
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { CardCustom, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card-custom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, Check, X, Clock, DollarSign, PercentIcon, CalendarIcon, 
  CheckCircle, AlertCircle, ArrowRight, Hourglass
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Loan {
  id: string;
  amount: number;
  interest_rate: number;
  user_id: string;
  status: "pending" | "approved" | "rejected" | "paid";
  purpose: string;
  repayment_due_date: string | null;
  created_at: string;
  updated_at: string;
}

interface LoanRepayment {
  id: string;
  loan_id: string;
  amount: number;
  created_at: string;
  transaction_id: string | null;
}

const Loans = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [repayments, setRepayments] = useState<Record<string, LoanRepayment[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [isRepayDialogOpen, setIsRepayDialogOpen] = useState(false);
  const [selectedLoanForRepayment, setSelectedLoanForRepayment] = useState<Loan | null>(null);
  
  const [loanAmount, setLoanAmount] = useState("");
  const [loanPurpose, setLoanPurpose] = useState("");
  const [repaymentAmount, setRepaymentAmount] = useState("");

  const { isAuthenticated, user, updateUserData } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load loans
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please login to view your loans",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    const fetchLoans = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('loans')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setLoans(data || []);

        // Fetch repayments for each loan
        if (data && data.length > 0) {
          const repaymentData: Record<string, LoanRepayment[]> = {};
          
          await Promise.all(data.map(async (loan) => {
            const { data: loanRepayments, error: repaymentError } = await supabase
              .from('loan_repayments')
              .select('*')
              .eq('loan_id', loan.id)
              .order('created_at', { ascending: false });
              
            if (!repaymentError && loanRepayments) {
              repaymentData[loan.id] = loanRepayments;
            }
          }));
          
          setRepayments(repaymentData);
        }
      } catch (error: any) {
        console.error("Error fetching loans:", error);
        toast({
          title: "Error",
          description: "Failed to load loan data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoans();
  }, [isAuthenticated, navigate, toast, user?.id]);

  // Apply for a loan
  const handleApplyForLoan = async () => {
    if (!user) return;
    
    try {
      const amountNum = parseFloat(loanAmount);
      
      if (isNaN(amountNum) || amountNum <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid loan amount",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('loans')
        .insert([
          {
            user_id: user.id,
            amount: amountNum,
            interest_rate: 5.0, // Default interest rate
            status: 'pending',
            purpose: loanPurpose || 'General purpose',
          }
        ])
        .select();

      if (error) throw error;

      toast({
        title: "Loan Application Submitted",
        description: "Your loan application is now pending approval",
      });

      setLoans(prev => [...prev, data[0]]);
      setIsApplyDialogOpen(false);
      setLoanAmount("");
      setLoanPurpose("");
    } catch (error: any) {
      console.error("Error applying for loan:", error);
      toast({
        title: "Application Failed",
        description: error.message || "There was an error submitting your loan application",
        variant: "destructive",
      });
    }
  };

  // Make a loan repayment
  const handleRepayLoan = async () => {
    if (!user || !selectedLoanForRepayment) return;
    
    try {
      const amountNum = parseFloat(repaymentAmount);
      
      if (isNaN(amountNum) || amountNum <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid repayment amount",
          variant: "destructive",
        });
        return;
      }

      if (amountNum > user.walletBalance) {
        toast({
          title: "Insufficient balance",
          description: "You don't have enough Movals in your wallet",
          variant: "destructive",
        });
        return;
      }

      // Create a transaction for the repayment
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert([
          {
            sender_id: user.id,
            receiver_id: null, // System account (bank)
            amount: amountNum,
            status: 'completed',
            transaction_type: 'loan_repayment',
            description: `Loan repayment for loan #${selectedLoanForRepayment.id.slice(0, 8)}`
          }
        ])
        .select();

      if (transactionError) throw transactionError;

      // Record the repayment
      const { data, error } = await supabase
        .from('loan_repayments')
        .insert([
          {
            loan_id: selectedLoanForRepayment.id,
            amount: amountNum,
            transaction_id: transactionData[0].id
          }
        ])
        .select();

      if (error) throw error;

      // Update the loan status if fully repaid
      const totalRepaid = Object.values(repayments[selectedLoanForRepayment.id] || [])
        .reduce((sum, repayment) => sum + repayment.amount, 0) + amountNum;
        
      if (totalRepaid >= selectedLoanForRepayment.amount) {
        const { error: updateError } = await supabase
          .from('loans')
          .update({ status: 'paid' })
          .eq('id', selectedLoanForRepayment.id);
          
        if (updateError) throw updateError;
        
        // Update loans list with the new status
        setLoans(prev => prev.map(loan => 
          loan.id === selectedLoanForRepayment.id ? {...loan, status: 'paid'} : loan
        ));
      }

      toast({
        title: "Repayment Successful",
        description: `You've repaid ${amountNum} Movals on your loan`,
      });

      // Update repayments list
      setRepayments(prev => ({
        ...prev,
        [selectedLoanForRepayment.id]: [data[0], ...(prev[selectedLoanForRepayment.id] || [])]
      }));

      // Update user wallet balance
      await updateUserData();

      setIsRepayDialogOpen(false);
      setRepaymentAmount("");
      setSelectedLoanForRepayment(null);
    } catch (error: any) {
      console.error("Error making repayment:", error);
      toast({
        title: "Repayment Failed",
        description: error.message || "There was an error processing your repayment",
        variant: "destructive",
      });
    }
  };

  // Calculate the total amount paid for a loan
  const getTotalRepaid = (loanId: string) => {
    return (repayments[loanId] || []).reduce((total, repayment) => total + repayment.amount, 0);
  };

  // Calculate the remaining amount for a loan
  const getRemainingAmount = (loan: Loan) => {
    const totalRepaid = getTotalRepaid(loan.id);
    const totalDue = loan.amount * (1 + loan.interest_rate / 100);
    return Math.max(0, totalDue - totalRepaid);
  };

  // Get progress percentage for a loan
  const getRepaymentProgress = (loan: Loan) => {
    const totalRepaid = getTotalRepaid(loan.id);
    const totalDue = loan.amount * (1 + loan.interest_rate / 100);
    return Math.min(100, Math.round((totalRepaid / totalDue) * 100));
  };

  return (
    <Layout>
      <div className="container px-4 pt-8 pb-16">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Loan Center</h1>
            <p className="text-muted-foreground">
              Apply for loans and manage your repayments
            </p>
          </div>
          
          <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
            <DialogTrigger asChild>
              <Button className="glass-button">
                <Plus size={16} className="mr-2" />
                Apply for Loan
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card max-w-md">
              <DialogHeader>
                <DialogTitle>Apply for a Loan</DialogTitle>
                <DialogDescription>
                  Fill out this form to request a loan from MBMQ bank
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Loan Amount (in Movals)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="amount"
                      type="number"
                      min="1"
                      placeholder="Enter amount"
                      className="pl-10"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose</Label>
                  <Textarea
                    id="purpose"
                    placeholder="Describe the purpose of your loan"
                    value={loanPurpose}
                    onChange={(e) => setLoanPurpose(e.target.value)}
                  />
                </div>
                
                <div className="bg-primary/10 p-3 rounded-lg">
                  <h4 className="font-medium mb-1">Loan Terms</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <PercentIcon size={14} />
                      Interest Rate: 5.0%
                    </li>
                    <li className="flex items-center gap-2">
                      <CalendarIcon size={14} />
                      Repayment: Flexible schedule
                    </li>
                  </ul>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsApplyDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleApplyForLoan}>
                  Submit Application
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <CardCustom key={i} className="glass-card animate-pulse">
                <CardHeader>
                  <div className="h-6 w-48 bg-primary/20 rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-4 w-full bg-primary/20 rounded"></div>
                    <div className="h-4 w-3/4 bg-primary/20 rounded"></div>
                    <div className="h-4 w-1/2 bg-primary/20 rounded"></div>
                  </div>
                </CardContent>
              </CardCustom>
            ))}
          </div>
        ) : loans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loans.map((loan) => (
              <CardCustom key={loan.id} className="glass-card overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl">
                      {loan.amount} M Loan
                    </CardTitle>
                    <div className={cn(
                      "px-3 py-1 text-xs rounded-full",
                      loan.status === 'approved' ? "bg-green-500/20 text-green-300" :
                      loan.status === 'pending' ? "bg-yellow-500/20 text-yellow-300" :
                      loan.status === 'paid' ? "bg-blue-500/20 text-blue-300" :
                      "bg-red-500/20 text-red-300"
                    )}>
                      {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                    </div>
                  </div>
                  <CardDescription>
                    Applied on {format(new Date(loan.created_at), "MMMM d, yyyy")}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <div className="text-muted-foreground">Interest Rate</div>
                      <div className="font-medium">{loan.interest_rate}%</div>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <div className="text-muted-foreground">Total With Interest</div>
                      <div className="font-medium">
                        {(loan.amount * (1 + loan.interest_rate / 100)).toFixed(2)} M
                      </div>
                    </div>
                    
                    {loan.repayment_due_date && (
                      <div className="flex justify-between text-sm">
                        <div className="text-muted-foreground">Due Date</div>
                        <div className="font-medium">
                          {format(new Date(loan.repayment_due_date), "MMMM d, yyyy")}
                        </div>
                      </div>
                    )}
                    
                    {loan.status === 'approved' || loan.status === 'paid' ? (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm mb-1">
                            <div className="text-muted-foreground">Repayment Progress</div>
                            <div className="font-medium">{getRepaymentProgress(loan)}%</div>
                          </div>
                          <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full" 
                              style={{ width: `${getRepaymentProgress(loan)}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <div className="text-muted-foreground">Remaining</div>
                          <div className="font-medium">
                            {getRemainingAmount(loan).toFixed(2)} M
                          </div>
                        </div>
                      </>
                    ) : null}
                    
                    {loan.purpose && (
                      <div className="pt-2 border-t border-white/10">
                        <h4 className="text-sm font-medium mb-1">Purpose</h4>
                        <p className="text-sm text-muted-foreground">
                          {loan.purpose}
                        </p>
                      </div>
                    )}
                    
                    {loan.status === 'approved' && repayments[loan.id] && repayments[loan.id].length > 0 && (
                      <div className="pt-2 border-t border-white/10">
                        <h4 className="text-sm font-medium mb-2">Recent Repayments</h4>
                        <div className="space-y-2">
                          {repayments[loan.id].slice(0, 2).map((repayment) => (
                            <div key={repayment.id} className="flex justify-between text-xs bg-black/20 p-2 rounded">
                              <span>{format(new Date(repayment.created_at), "MMM d, yyyy")}</span>
                              <span className="font-medium text-green-400">+{repayment.amount} M</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="border-t border-white/10 pt-4">
                  {loan.status === 'pending' && (
                    <div className="w-full flex justify-center">
                      <div className="flex items-center gap-2 text-yellow-300">
                        <Hourglass size={16} />
                        <span className="text-sm">Awaiting approval</span>
                      </div>
                    </div>
                  )}
                  
                  {loan.status === 'approved' && (
                    <Dialog open={isRepayDialogOpen && selectedLoanForRepayment?.id === loan.id} 
                      onOpenChange={(open) => {
                        setIsRepayDialogOpen(open);
                        if (!open) setSelectedLoanForRepayment(null);
                      }}>
                      <DialogTrigger asChild>
                        <Button 
                          className="w-full glass-button"
                          onClick={() => setSelectedLoanForRepayment(loan)}
                        >
                          Make Repayment
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="glass-card max-w-md">
                        <DialogHeader>
                          <DialogTitle>Make a Loan Repayment</DialogTitle>
                          <DialogDescription>
                            Your current wallet balance: {user?.walletBalance} M
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="repaymentAmount">Repayment Amount</Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                id="repaymentAmount"
                                type="number"
                                min="0.1"
                                step="0.1"
                                max={user?.walletBalance}
                                placeholder="Enter amount"
                                className="pl-10"
                                value={repaymentAmount}
                                onChange={(e) => setRepaymentAmount(e.target.value)}
                              />
                            </div>
                          </div>
                          
                          <div className="bg-primary/10 p-3 rounded-lg">
                            <h4 className="font-medium mb-1">Repayment Summary</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              <li className="flex justify-between">
                                <span>Original Loan</span>
                                <span>{loan.amount} M</span>
                              </li>
                              <li className="flex justify-between">
                                <span>With Interest</span>
                                <span>{(loan.amount * (1 + loan.interest_rate / 100)).toFixed(2)} M</span>
                              </li>
                              <li className="flex justify-between">
                                <span>Already Paid</span>
                                <span>{getTotalRepaid(loan.id)} M</span>
                              </li>
                              <li className="flex justify-between font-medium">
                                <span>Remaining</span>
                                <span>{getRemainingAmount(loan).toFixed(2)} M</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button variant="outline" onClick={() => {
                            setIsRepayDialogOpen(false);
                            setSelectedLoanForRepayment(null);
                          }}>
                            Cancel
                          </Button>
                          <Button onClick={handleRepayLoan}>
                            Confirm Repayment
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  {loan.status === 'paid' && (
                    <div className="w-full flex justify-center">
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle size={16} />
                        <span className="text-sm">Fully repaid</span>
                      </div>
                    </div>
                  )}
                  
                  {loan.status === 'rejected' && (
                    <div className="w-full flex justify-center">
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertCircle size={16} />
                        <span className="text-sm">Application rejected</span>
                      </div>
                    </div>
                  )}
                </CardFooter>
              </CardCustom>
            ))}
          </div>
        ) : (
          <CardCustom className="glass-card max-w-md mx-auto p-6 text-center">
            <h3 className="text-xl font-semibold mb-4">No Loans Yet</h3>
            <p className="text-muted-foreground mb-6">
              Apply for a loan to get Movals for your needs. Loans are managed by MBMQ bank and have a simple application process.
            </p>
            <Button onClick={() => setIsApplyDialogOpen(true)}>
              Apply for Your First Loan
            </Button>
          </CardCustom>
        )}
      </div>
    </Layout>
  );
};

export default Loans;
