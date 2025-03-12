
import React, { useState } from 'react';
import { CardCustom, CardHeader, CardTitle, CardContent } from '@/components/ui/card-custom';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ButtonCustom } from '@/components/ui/button-custom';
import { toast } from '@/hooks/use-toast';
import { ArrowDown, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import UserSearch from './UserSearch';

const RequestForm = () => {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; email: string | null } | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

  // Handle amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and one decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  // Handle money request
  const handleRequest = async () => {
    if (!selectedUser) {
      toast({
        title: 'Error',
        description: 'Please select a user to request money from.',
        variant: 'destructive',
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount to request.',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to request money.',
        variant: 'destructive',
      });
      return;
    }

    setIsRequesting(true);

    try {
      // Create a transaction with 'pending' status as a request
      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            sender_id: selectedUser.id, // The person who will pay (requestee)
            receiver_id: user.id, // The person requesting (current user)
            amount: parseFloat(amount),
            description: reason || 'Money Request',
            transaction_type: 'request',
            status: 'pending', // Indicates this is a request, not a completed transaction
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Successfully requested ${amount} Movals from ${selectedUser.name}.`,
      });

      // Reset form
      setSelectedUser(null);
      setAmount('');
      setReason('');
    } catch (error: any) {
      console.error('Error requesting money:', error);
      toast({
        title: 'Error',
        description: error.message || 'Unable to request money. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <CardCustom className="glass-card">
      <CardHeader>
        <CardTitle>Request Movals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <UserSearch 
          onUserSelect={setSelectedUser}
          selectedUser={selectedUser}
        />
        
        {selectedUser && (
          <div className="pt-4 border-t border-white/10 space-y-4">
            <div className="grid gap-4">
              <Label htmlFor="requestAmount">Amount (Movals)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="requestAmount"
                  placeholder="Enter amount"
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  className="glass-effect pl-9"
                />
              </div>
            </div>
            
            <div className="grid gap-4">
              <Label htmlFor="requestReason">Reason</Label>
              <Textarea
                id="requestReason"
                placeholder="What's this request for? (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="glass-effect min-h-20"
              />
            </div>
            
            <ButtonCustom 
              onClick={handleRequest} 
              disabled={isRequesting || !amount} 
              className="w-full"
            >
              {isRequesting ? 'Requesting...' : 'Request Money'}
              <ArrowDown className="w-4 h-4 ml-2" />
            </ButtonCustom>
          </div>
        )}
      </CardContent>
    </CardCustom>
  );
};

export default RequestForm;
