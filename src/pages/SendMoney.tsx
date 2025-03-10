
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, UserRound } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CardCustom, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card-custom";

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

const SendMoney = () => {
  const navigate = useNavigate();
  const { user, updateUserData } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recipientUser, setRecipientUser] = useState<{id: string, name: string} | null>(null);
  const [lookupPerformed, setLookupPerformed] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientEmail: "",
      amount: "",
      description: "",
    },
  });

  const lookupRecipient = async (email: string) => {
    if (!email) return;

    try {
      // Look up the user by email in the profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', (await supabase.from('auth.users').select('id').eq('email', email).single()).data?.id)
        .single();

      if (error) {
        setRecipientUser(null);
        console.error("Error looking up recipient:", error);
        return;
      }

      if (data) {
        const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'User';
        setRecipientUser({
          id: data.id,
          name: fullName
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || !recipientUser) return;

    setIsSubmitting(true);
    
    try {
      const amount = parseFloat(values.amount);
      
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
          description: values.description || 'Transfer',
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
      
      // Update the recipient's wallet (add amount)
      const { error: recipientUpdateError } = await supabase
        .from('wallets')
        .update({ 
          balance: supabase.rpc('get_wallet_balance', { user_id: recipientUser.id }) + amount 
        })
        .eq('user_id', recipientUser.id);
      
      if (recipientUpdateError) {
        throw new Error('Failed to update recipient wallet');
      }
      
      // Add to blockchain
      // This would be where you'd add the transaction to the blockchain
      
      // Update the user's wallet balance
      await updateUserData();
      
      toast.success(`Successfully sent ${amount} Movals to ${recipientUser.name}`);
      navigate('/dashboard');
      
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
      <div className="container max-w-md mx-auto py-8 px-4">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6"
          onClick={handleGoBack}
        >
          <ArrowLeft size={16} className="mr-2" /> Back
        </Button>
        
        <CardCustom>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Send Movals</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="recipientEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient Email</FormLabel>
                      <FormControl>
                        <Input placeholder="user@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {lookupPerformed && (
                  <div className="py-2">
                    {recipientUser ? (
                      <div className="flex items-center p-2 bg-primary/10 rounded-md">
                        <UserRound size={18} className="mr-2 text-primary" />
                        <span className="text-sm">Sending to: <span className="font-medium">{recipientUser.name}</span></span>
                      </div>
                    ) : (
                      <div className="text-sm text-red-500">
                        Recipient not found. Please check the email address.
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
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          min="0.01"
                          {...field}
                        />
                      </FormControl>
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
                        <Input placeholder="What's this for?" {...field} />
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
                  {isSubmitting ? "Sending..." : "Send Movals"}
                  <Send size={16} className="ml-2" />
                </Button>
              </form>
            </Form>
          </CardContent>
        </CardCustom>
      </div>
    </Layout>
  );
};

export default SendMoney;
