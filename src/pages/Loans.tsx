
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { CardCustom, CardContent, CardHeader, CardTitle } from "@/components/ui/card-custom";
import { ButtonCustom } from "@/components/ui/button-custom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { getAnimationClass } from "@/lib/animations";
import { toast } from "@/hooks/use-toast";
import { Landmark, Clock, ArrowUpRight, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Define the loan status type to match the DB
type LoanStatus = "pending" | "approved" | "rejected" | "paid";

// Define the loan type
interface Loan {
  id: string;
  user_id: string;
  amount: number;
  interest_rate: number;
  purpose: string;
  repayment_due_date: string | null;
  status: LoanStatus;
  created_at: string;
  updated_at: string;
}

const Loans = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showApplyForm, setShowApplyForm] = useState(false);
  
  // Form state
  const [amount, setAmount] = useState<number>(100);
  const [purpose, setPurpose] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Fetch loans
  useEffect(() => {
    const fetchLoans = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('loans')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        // Convert the data to the correct type
        const typedLoans = data.map(loan => ({
          ...loan,
          status: loan.status as LoanStatus
        }));
        
        setLoans(typedLoans);
      } catch (error) {
        console.error('Error fetching loans:', error);
        toast({
          title: "Error",
          description: "Unable to fetch loans. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchLoans();
    }
  }, [user, isAuthenticated]);
  
  // Apply for a loan
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (!amount || !purpose) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const { data, error } = await supabase
        .from('loans')
        .insert([
          {
            user_id: user.id,
            amount,
            interest_rate: 5.0, // Default interest rate
            purpose,
            status: 'pending' as LoanStatus,
          }
        ])
        .select();
        
      if (error) throw error;
      
      toast({
        title: "Loan Application Submitted",
        description: "Your loan application has been received and is pending review.",
      });
      
      // Update loans list
      if (data) {
        setLoans(prev => [...data.map(loan => ({
          ...loan,
          status: loan.status as LoanStatus
        })), ...prev]);
      }
      
      // Reset form
      setAmount(100);
      setPurpose('');
      setShowApplyForm(false);
    } catch (error) {
      console.error('Error applying for loan:', error);
      toast({
        title: "Application Failed",
        description: "Unable to submit your loan application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  // Get status badge class
  const getStatusBadge = (status: LoanStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100/20 text-yellow-500 border border-yellow-500/20';
      case 'approved':
        return 'bg-green-100/20 text-green-500 border border-green-500/20';
      case 'rejected':
        return 'bg-red-100/20 text-red-500 border border-red-500/20';
      case 'paid':
        return 'bg-blue-100/20 text-blue-500 border border-blue-500/20';
      default:
        return 'bg-gray-100/20 text-gray-500 border border-gray-500/20';
    }
  };
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      toast({
        title: "Authentication Required",
        description: "Please login to access loans",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  if (!isAuthenticated && !isLoading) {
    return null;
  }
  
  return (
    <Layout>
      <div className="container px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight animate-fade-in">Loans</h1>
          <p className="text-muted-foreground animate-fade-in">
            Apply for loans and manage your loan repayments
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Loan List */}
            <CardCustom className={getAnimationClass("fade", 1)}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl">Your Loans</CardTitle>
                <ButtonCustom 
                  variant="glass" 
                  size="sm" 
                  onClick={() => setShowApplyForm(!showApplyForm)}
                >
                  {showApplyForm ? "Cancel" : "Apply for Loan"}
                </ButtonCustom>
              </CardHeader>
              <CardContent>
                {showApplyForm && (
                  <div className="mb-6 glass-card p-4">
                    <h3 className="text-lg font-medium mb-4">New Loan Application</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Loan Amount (Movals)</Label>
                        <Input
                          id="amount"
                          type="number"
                          min="10"
                          value={amount}
                          onChange={(e) => setAmount(parseFloat(e.target.value))}
                          className="glass-effect"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="purpose">Loan Purpose</Label>
                        <Textarea
                          id="purpose"
                          value={purpose}
                          onChange={(e) => setPurpose(e.target.value)}
                          placeholder="Describe why you need this loan..."
                          className="glass-effect min-h-24"
                          required
                        />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Default interest rate: 5.0%</p>
                      </div>
                      <div className="flex justify-end">
                        <ButtonCustom
                          type="submit"
                          loading={isSubmitting}
                        >
                          Submit Application
                        </ButtonCustom>
                      </div>
                    </form>
                  </div>
                )}
                
                <div className="space-y-4">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="p-4 rounded-lg glass-effect flex flex-col gap-2 animate-pulse">
                        <div className="h-6 w-32 bg-white/10 rounded"></div>
                        <div className="h-4 w-48 bg-white/10 rounded"></div>
                        <div className="flex gap-4 mt-2">
                          <div className="h-8 w-24 bg-white/10 rounded"></div>
                          <div className="h-8 w-24 bg-white/10 rounded"></div>
                        </div>
                      </div>
                    ))
                  ) : loans.length > 0 ? (
                    loans.map((loan) => (
                      <div key={loan.id} className="p-4 rounded-lg glass-card space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Landmark className="h-5 w-5 text-primary" />
                            <h3 className="font-medium text-lg">{loan.amount} Movals</h3>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs ${getStatusBadge(loan.status)}`}>
                            {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">{loan.purpose}</p>
                        
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Interest Rate</p>
                            <p className="text-sm">{loan.interest_rate}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Application Date</p>
                            <p className="text-sm">{formatDate(loan.created_at)}</p>
                          </div>
                          {loan.repayment_due_date && (
                            <div>
                              <p className="text-xs text-muted-foreground">Repayment Due</p>
                              <p className="text-sm">{formatDate(loan.repayment_due_date)}</p>
                            </div>
                          )}
                        </div>
                        
                        {loan.status === 'approved' && (
                          <div className="pt-2">
                            <ButtonCustom variant="glass" size="sm" className="w-full">
                              Repay Loan
                            </ButtonCustom>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="mx-auto w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-3">
                        <Landmark size={24} className="text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium">No Loans Yet</h3>
                      <p className="text-muted-foreground mt-1 mb-4">
                        You haven't applied for any loans. Apply now to get started.
                      </p>
                      {!showApplyForm && (
                        <ButtonCustom variant="glass" onClick={() => setShowApplyForm(true)}>
                          Apply for Loan
                        </ButtonCustom>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </CardCustom>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Info Card */}
            <CardCustom className={`glass-card ${getAnimationClass("fade", 2)}`}>
              <CardHeader>
                <CardTitle>Loan Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-500" />
                    <p className="text-sm">Fast approval process</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-500" />
                    <p className="text-sm">Low interest rates starting at 5%</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-500" />
                    <p className="text-sm">Simple repayment options</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-500" />
                    <p className="text-sm">No hidden fees</p>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-white/10">
                  <h4 className="font-medium mb-2">Loan Process</h4>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-medium">
                        1
                      </div>
                      <div>
                        <p className="text-sm">Submit loan application</p>
                        <p className="text-xs text-muted-foreground">Provide loan amount and purpose</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-medium">
                        2
                      </div>
                      <div>
                        <p className="text-sm">Application review</p>
                        <p className="text-xs text-muted-foreground">MBQM Bank reviews your application</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-medium">
                        3
                      </div>
                      <div>
                        <p className="text-sm">Loan approval</p>
                        <p className="text-xs text-muted-foreground">If approved, funds are transferred to your wallet</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-medium">
                        4
                      </div>
                      <div>
                        <p className="text-sm">Repayment</p>
                        <p className="text-xs text-muted-foreground">Repay loan by the due date plus interest</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-muted-foreground">
                    For detailed information about loan terms and conditions, please refer to the 
                    <a href="/terms" className="text-primary ml-1 hover:underline">
                      Terms & Conditions
                    </a>.
                  </p>
                </div>
              </CardContent>
            </CardCustom>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Loans;
