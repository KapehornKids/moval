
import React, { useState } from 'react';
import { ArrowRight, DollarSign } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ButtonCustom } from '@/components/ui/button-custom';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TransactionFormProps {
  selectedUser: { id: string; name: string } | null;
}

const TransactionForm = ({ selectedUser }: TransactionFormProps) => {
  const { user, updateUserData } = useAuth();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Handle amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and one decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  // Handle send money
  const handleSend = async () => {
    if (!selectedUser) {
      toast({
        title: 'Error',
        description: 'Please select a user to send money to.',
        variant: 'destructive',
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount to send.',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to send money.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);

    try {
      const amountNumber = parseFloat(amount);
      
      const senderId = user.id;
      const receiverId = selectedUser.id;

      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert([
          {
            sender_id: senderId,
            receiver_id: receiverId,
            amount: amountNumber,
            description: description || 'Money Transfer',
            transaction_type: 'transfer',
            status: 'completed',
          },
        ])
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update sender's wallet (deduct amount)
      const { error: senderWalletError } = await supabase.rpc('update_wallet_balance', {
        _user_id: senderId,
        _amount: -amountNumber
      });
      
      if (senderWalletError) throw senderWalletError;

      // Update receiver's wallet (add amount)
      const { error: receiverWalletError } = await supabase.rpc('update_wallet_balance', {
        _user_id: receiverId,
        _amount: amountNumber
      });
      
      if (receiverWalletError) throw receiverWalletError;

      // Update user data to reflect new balance
      await updateUserData();

      toast({
        title: 'Success',
        description: `Successfully sent ${amount} Movals to ${selectedUser.name}.`,
      });

      // Reset form
      setAmount('');
      setDescription('');
    } catch (error: any) {
      console.error('Error sending money:', error);
      toast({
        title: 'Error',
        description: error.message || 'Unable to send money. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <div className="grid gap-4">
        <Label htmlFor="amount">Amount (Movals)</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="amount"
            placeholder="Enter amount"
            type="text"
            value={amount}
            onChange={handleAmountChange}
            className="glass-effect pl-9"
          />
        </div>
      </div>
      
      <div className="grid gap-4">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="What's this payment for? (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="glass-effect min-h-20"
        />
      </div>
      
      <ButtonCustom 
        onClick={handleSend} 
        disabled={isSending || !selectedUser || !amount} 
        className="w-full"
      >
        {isSending ? 'Sending...' : 'Send Money'}
        <ArrowRight className="w-4 h-4 ml-2" />
      </ButtonCustom>
    </>
  );
};

export default TransactionForm;
