
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Send, UserRound, Search, X, CreditCard } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  CardCustom, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card-custom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getAnimationClass } from "@/lib/animations";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { createBlock } from "@/lib/blockchain";

const formSchema = z.object({
  recipientEmail: z.string().email("Invalid email address"),
  amount: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    },
    { message: "Amount must be a positive number" }
  ),
  description: z.string().optional(),
});

type UserProfile = {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
};

const SendMoney = () => {
  const navigate = useNavigate();
  const { user, updateUserData } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recipientUser, setRecipientUser] = useState<UserProfile | null>(null);
  const [lookupPerformed, setLookupPerformed] = useState(false);
  const [recentRecipients, setRecentRecipients] = useState<UserProfile[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<{
    amount: number;
    description: string;
  } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientEmail: "",
      amount: "",
      description: "",
    },
  });

  // Fetch recent recipients
  useEffect(() => {
    const fetchRecentRecipients = async () => {
      if (!user) return;

      try {
        // Fetch recent transactions where the user is the sender
        const { data: transactions, error } = await supabase
          .from('transactions')
          .select('receiver_id, created_at')
          .eq('sender_id', user.id)
          .eq('transaction_type', 'transfer')
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;

        if (transactions && transactions.length > 0) {
          // Get unique receiver IDs
          const uniqueReceiverIds = [...new Set(transactions.map(tx => tx.receiver_id))];
          
          // Fetch profiles for these receivers
          const recipients: UserProfile[] = [];
          
          for (const receiverId of uniqueReceiverIds) {
            if (!receiverId) continue;
            
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('id, first_name, last_name')
              .eq('id', receiverId)
              .single();
              
            if (profileError) {
              console.error("Error fetching profile:", profileError);
              continue;
            }
            
            if (profile) {
              // Fetch email from auth.users (if you have access)
              const { data: userData, error: userError } = await supabase
                .rpc('get_user_email', { user_id: profile.id });
                
              recipients.push({
                id: profile.id,
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                email: userData?.email
              });
            }
          }
          
          setRecentRecipients(recipients);
        }
      } catch (error) {
        console.error("Error fetching recent recipients:", error);
      }
    };

    if (user) {
      fetchRecentRecipients();
    }
  }, [user]);

  const lookupRecipient = async (email: string) => {
    if (!email) return;

    try {
      // This is a custom RPC function that looks up a user by email
      const { data: userData, error: userError } = await supabase
        .rpc('get_user_by_email', { email_address: email });

      if (userError || !userData) {
        setRecipientUser(null);
        setLookupPerformed(true);
        return;
      }

      if (userData) {
        // Get the user's profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', userData.id)
          .single();

        if (profileError || !profileData) {
          setRecipientUser(null);
          setLookupPerformed(true);
          return;
        }

        setRecipientUser({
          id: userData.id,
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          email: email
        });
      } else {
        setRecipientUser(null);
      }
    } catch (error) {
      console.error("Error in recipient lookup:", error);
      setRecipientUser(null);
    } finally {
      setLookupPerformed(true);
    }
  };

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "recipientEmail" && value.recipientEmail && value.recipientEmail.includes('@')) {
        lookupRecipient(value.recipientEmail);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const selectRecentRecipient = (recipient: UserProfile) => {
    if (!recipient.email) {
      toast.error("Email for this recipient is not available");
      return;
    }
    
    form.setValue('recipientEmail', recipient.email);
    setRecipientUser(recipient);
    setLookupPerformed(true);
  };

  const confirmTransaction = (values: z.infer<typeof formSchema>) => {
    // Set transaction details and open confirm dialog
    setTransactionDetails({
      amount: parseFloat(values.amount),
      description: values.description || 'Transfer'
    });
    setIsConfirmOpen(true);
  };

  const executeTransaction = async () => {
    if (!user || !recipientUser || !transactionDetails) return;

    setIsSubmitting(true);
    setIsConfirmOpen(false);
    
    try {
      const amount = transactionDetails.amount;
      
      // Check if user has enough balance
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();
      
      if (walletError) {
        throw new Error('Could not retrieve your wallet balance');
      }
      
      if (walletData.balance < amount) {
        toast.error('Insufficient funds in your wallet');
        return;
      }
      
      // Create the transaction
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          sender_id: user.id,
          receiver_id: recipientUser.id,
          amount,
          description: transactionDetails.description,
          transaction_type: 'transfer'
        })
        .select()
        .single();
      
      if (transactionError) {
        throw new Error('Failed to create transaction');
      }
      
      // Update the sender's wallet (subtract amount)
      const { error: senderUpdateError } = await supabase
        .from('wallets')
        .update({ balance: walletData.balance - amount })
        .eq('user_id', user.id);
      
      if (senderUpdateError) {
        throw new Error('Failed to update your wallet');
      }
      
      // Get recipient's wallet balance
      const { data: recipientWalletData, error: recipientWalletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', recipientUser.id)
        .single();
        
      if (recipientWalletError) {
        throw new Error('Failed to retrieve recipient wallet');
      }
      
      // Update the recipient's wallet (add amount)
      const { error: recipientUpdateError } = await supabase
        .from('wallets')
        .update({ balance: recipientWalletData.balance + amount })
        .eq('user_id', recipientUser.id);
      
      if (recipientUpdateError) {
        throw new Error('Failed to update recipient wallet');
      }
      
      // Add to blockchain
      if (transactionData) {
        // Create a new block for this transaction
        const block = await createBlock([transactionData]);
        if (!block) {
          console.warn("Could not add transaction to blockchain");
        }
      }
      
      // Update the user's wallet balance
      await updateUserData();
      
      toast.success(`Successfully sent ${amount} Movals to ${recipientUser.first_name} ${recipientUser.last_name}`);
      
      // Reset form
      form.reset();
      setRecipientUser(null);
      setLookupPerformed(false);
      
      // Redirect back to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (error: any) {
      console.error('Transaction error:', error);
      toast.error(error.message || 'Failed to complete transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <Layout>
      <div className="container max-w-lg mx-auto py-8 px-4">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6"
          onClick={handleGoBack}
        >
          <ArrowLeft size={16} className="mr-2" /> Back
        </Button>
        
        <CardCustom className={getAnimationClass("fade", 1)}>
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              <Send size={20} className="mr-2" /> Send Movals
            </CardTitle>
            <CardDescription>
              Transfer Movals to another user in the community
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentRecipients.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Recent Recipients</h3>
                <div className="flex flex-wrap gap-2">
                  {recentRecipients.map((recipient) => (
                    <button
                      key={recipient.id}
                      onClick={() => selectRecentRecipient(recipient)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-xs">
                          {recipient.first_name?.[0]}{recipient.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {recipient.first_name} {recipient.last_name}
                      </span>
                    </button>
                  ))}
                </div>
                <Separator className="my-4" />
              </div>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(confirmTransaction)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="recipientEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient Email</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input 
                            placeholder="user@example.com" 
                            {...field} 
                            className="pl-10" 
                          />
                        </FormControl>
                        <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
                        {field.value && (
                          <button
                            type="button"
                            onClick={() => {
                              field.onChange("");
                              setRecipientUser(null);
                              setLookupPerformed(false);
                            }}
                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {lookupPerformed && (
                  <div className="py-2">
                    {recipientUser ? (
                      <div className="flex items-center p-3 bg-primary/10 rounded-lg">
                        <Avatar className="h-8 w-8 mr-3">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {recipientUser.first_name?.[0]}{recipientUser.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-medium">
                            {recipientUser.first_name} {recipientUser.last_name}
                          </span>
                          <p className="text-xs text-muted-foreground">{recipientUser.email}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center p-3 bg-destructive/10 text-destructive rounded-lg">
                        <UserRound size={18} className="mr-2" />
                        <span className="text-sm">Recipient not found. Please check the email address.</span>
                      </div>
                    )}
                  </div>
                )}
                
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (M)</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.00"
                            step="0.01"
                            min="0.01"
                            {...field}
                            className="pl-10"
                          />
                        </FormControl>
                        <CreditCard size={16} className="absolute left-3 top-3 text-muted-foreground" />
                      </div>
                      <FormMessage />
                      {user && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Available balance: {user.walletBalance} M
                        </p>
                      )}
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="What's this for?" {...field} className="min-h-20" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting || !recipientUser}
                >
                  Continue to Review
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </form>
            </Form>
          </CardContent>
        </CardCustom>

        {/* Confirmation Dialog */}
        <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Transaction</DialogTitle>
              <DialogDescription>
                Please review the transaction details before sending
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex justify-between p-3 border rounded-lg glass-card">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">{transactionDetails?.amount} Movals</span>
              </div>
              <div className="flex justify-between p-3 border rounded-lg glass-card">
                <span className="text-muted-foreground">To</span>
                <span className="font-medium">
                  {recipientUser?.first_name} {recipientUser?.last_name}
                </span>
              </div>
              <div className="flex justify-between p-3 border rounded-lg glass-card">
                <span className="text-muted-foreground">Description</span>
                <span>{transactionDetails?.description || 'Transfer'}</span>
              </div>
              <div className="flex justify-between p-3 border rounded-lg glass-card">
                <span className="text-muted-foreground">Fee</span>
                <span>0 Movals</span>
              </div>
            </div>
            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={executeTransaction}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Confirm & Send'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default SendMoney;
