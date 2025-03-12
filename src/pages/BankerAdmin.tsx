
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { CardCustom, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card-custom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Layout from "@/components/layout/Layout";
import { Building, CreditCard, Calendar, Clock, User, Check, X, Ban, AlertCircle, DollarSign } from "lucide-react";
import { getAnimationClass } from "@/lib/animations";

const loanSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  amount: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    },
    { message: "Amount must be a positive number" }
  ),
  interestRate: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 100;
    },
    { message: "Interest rate must be between 0 and 100" }
  ),
  dueDate: z.string().min(1, "Due date is required"),
  purpose: z.string().optional(),
});

interface Loan {
  id: string;
  user_id: string;
  amount: number;
  interest_rate: number;
  repayment_due_date: string | null;
  purpose: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  user_name: string;
}

interface User {
  id: string;
  name: string;
}

const BankerAdmin = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [creatingLoan, setCreatingLoan] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  
  const form = useForm<z.infer<typeof loanSchema>>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      userId: "",
      amount: "",
      interestRate: "5",
      dueDate: "",
      purpose: "",
    },
  });

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        toast({
          title: "Unauthorized",
          description: "Please log in to access this page",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const hasBankerRole = await hasRole("banker");
      if (!hasBankerRole) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the Banker Administration",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      fetchLoans();
      fetchUsers();
    };

    checkAccess();
  }, [user, navigate, hasRole, activeTab]);

  const fetchLoans = async () => {
    try {
      setIsLoading(true);
      
      // Fetch loans
      const { data, error } = await supabase
        .from("loans")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch all user profiles to get names
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name");

      if (profilesError) throw profilesError;

      // Create a map of user IDs to names
      const userMap = new Map();
      profiles.forEach((profile) => {
        userMap.set(profile.id, `${profile.first_name} ${profile.last_name}`);
      });

      // Enhance loans with user names
      const enhancedLoans = data.map((loan) => ({
        ...loan,
        user_name: userMap.get(loan.user_id) || "Unknown",
      }));

      setLoans(enhancedLoans);
    } catch (error) {
      console.error("Error fetching loans:", error);
      toast({
        title: "Error",
        description: "Failed to load loans. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name");

      if (error) throw error;

      const formattedUsers = profiles.map((profile) => ({
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`,
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: z.infer<typeof loanSchema>) => {
    setCreatingLoan(true);
    
    try {
      // Create the loan
      const { error: loanError } = await supabase
        .from("loans")
        .insert({
          user_id: data.userId,
          amount: parseFloat(data.amount),
          interest_rate: parseFloat(data.interestRate),
          repayment_due_date: data.dueDate ? new Date(data.dueDate).toISOString() : null,
          purpose: data.purpose || null,
          status: "pending",
        });

      if (loanError) throw loanError;

      // Reset form
      form.reset({
        userId: "",
        amount: "",
        interestRate: "5",
        dueDate: "",
        purpose: "",
      });

      toast({
        title: "Success",
        description: "Loan created successfully.",
      });

      // Refresh loans
      fetchLoans();
    } catch (error) {
      console.error("Error creating loan:", error);
      toast({
        title: "Error",
        description: "Failed to create loan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingLoan(false);
    }
  };

  const handleLoanStatusUpdate = async (loanId: string, status: string) => {
    try {
      // First update the loan status
      const { error: updateError } = await supabase
        .from("loans")
        .update({
          status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", loanId);

      if (updateError) throw updateError;

      // If approved, add funds to user's wallet
      if (status === "approved") {
        const loan = loans.find(l => l.id === loanId);
        
        if (loan) {
          // Create a transaction record
          const { error: transactionError } = await supabase
            .from("transactions")
            .insert({
              amount: loan.amount,
              sender_id: null, // Bank is the sender
              receiver_id: loan.user_id,
              transaction_type: "loan_disbursement",
              description: "Loan disbursement",
              status: "completed",
            });

          if (transactionError) throw transactionError;

          // Update user's wallet balance
          const { error: walletError } = await supabase.rpc(
            'update_wallet_balance',
            { user_id_param: loan.user_id, amount_param: loan.amount }
          );

          if (walletError) throw walletError;
        }
      }

      toast({
        title: "Success",
        description: `Loan ${status === "approved" ? "approved" : "rejected"} successfully.`,
      });

      // Refresh loans
      fetchLoans();
    } catch (error) {
      console.error(`Error ${status === "approved" ? "approving" : "rejecting"} loan:`, error);
      toast({
        title: "Error",
        description: `Failed to ${status === "approved" ? "approve" : "reject"} loan. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const getFilteredLoans = () => {
    return loans.filter((loan) => loan.status === activeTab);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="text-yellow-500" />;
      case "approved":
        return <Check className="text-green-500" />;
      case "rejected":
        return <X className="text-red-500" />;
      case "paid":
        return <DollarSign className="text-blue-500" />;
      case "defaulted":
        return <AlertCircle className="text-red-500" />;
      default:
        return <Clock className="text-muted-foreground" />;
    }
  };

  return (
    <Layout>
      <div className="container px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex items-center gap-2">
            <Building className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Banker Administration</h1>
          </div>
          <p className="text-muted-foreground">
            Manage loans and financial services for the community
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <CardCustom className={`md:col-span-2 ${getAnimationClass("fade", 0)}`}>
            <CardHeader>
              <CardTitle>Loan Management</CardTitle>
              <CardDescription>Review and manage loan applications</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pending" onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="pending" className="relative">
                    Pending
                    {loans.filter(l => l.status === "pending").length > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                        {loans.filter(l => l.status === "pending").length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab}>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <CardCustom key={i} className="animate-pulse">
                          <CardContent className="p-4">
                            <div className="h-8 bg-primary/10 rounded-md w-3/4 mb-4"></div>
                            <div className="h-24 bg-primary/5 rounded-md"></div>
                          </CardContent>
                        </CardCustom>
                      ))}
                    </div>
                  ) : getFilteredLoans().length > 0 ? (
                    <div className="space-y-4">
                      {getFilteredLoans().map((loan, index) => (
                        <CardCustom key={loan.id} className={`overflow-hidden ${getAnimationClass("fade", index % 5)}`}>
                          <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                              <div className="flex items-center gap-2 mb-2 md:mb-0">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{loan.user_name}</p>
                                  <p className="text-xs text-muted-foreground">ID: {loan.id.slice(0, 8)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(loan.status)}
                                <span className="text-sm font-medium">{loan.status}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(loan.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Amount</p>
                                <p className="font-medium">{loan.amount.toFixed(2)} Movals</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Interest Rate</p>
                                <p className="font-medium">{loan.interest_rate}%</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Due Date</p>
                                <p className="font-medium">
                                  {loan.repayment_due_date 
                                    ? new Date(loan.repayment_due_date).toLocaleDateString() 
                                    : "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Purpose</p>
                                <p className="font-medium">{loan.purpose || "N/A"}</p>
                              </div>
                            </div>

                            {/* Actions for pending loans */}
                            {loan.status === "pending" && (
                              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <Button 
                                  variant="default" 
                                  className="flex-1"
                                  onClick={() => handleLoanStatusUpdate(loan.id, "approved")}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                
                                <Button 
                                  variant="outline" 
                                  className="flex-1"
                                  onClick={() => handleLoanStatusUpdate(loan.id, "rejected")}
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </CardCustom>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <CreditCard className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-medium">No {activeTab} loans</h3>
                      <p className="text-muted-foreground text-center max-w-md mt-2">
                        {activeTab === "pending" 
                          ? "There are no pending loan applications at this time."
                          : activeTab === "approved"
                          ? "No loans have been approved yet."
                          : "No loans have been rejected yet."}
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </CardCustom>

          <CardCustom className={getAnimationClass("fade", 1)}>
            <CardHeader>
              <CardTitle>Create Loan</CardTitle>
              <CardDescription>Create a new loan for a user</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select a user</option>
                            {users.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.name}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (Movals)</FormLabel>
                        <FormControl>
                          <Input placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="interestRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interest Rate (%)</FormLabel>
                        <FormControl>
                          <Input placeholder="5.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purpose (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Loan purpose..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={creatingLoan}
                  >
                    {creatingLoan ? "Creating Loan..." : "Create Loan"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </CardCustom>
        </div>
      </div>
    </Layout>
  );
};

export default BankerAdmin;
