
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ButtonCustom } from '@/components/ui/button-custom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { User, AlertCircle, CheckCircle, XCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface MoneyRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'rejected';
  created_at: string;
  sender_name?: string;
}

const MoneyRequests = () => {
  const [requests, setRequests] = useState<MoneyRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    
    const fetchRequests = async () => {
      try {
        // Get money requests where the current user is the receiver
        const { data, error } = await supabase
          .from('transactions')
          .select(`
            id, 
            amount, 
            description, 
            status, 
            created_at,
            sender_id,
            receiver_id,
            sender:sender_id(profiles(first_name, last_name))
          `)
          .eq('receiver_id', user.id)
          .eq('transaction_type', 'request')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        const formattedRequests = data.map((req: any) => ({
          ...req,
          sender_name: req.sender?.profiles 
            ? `${req.sender.profiles.first_name || ''} ${req.sender.profiles.last_name || ''}`.trim()
            : 'Unknown User'
        }));
        
        setRequests(formattedRequests);
      } catch (error) {
        console.error('Error fetching money requests:', error);
        toast({
          title: 'Error',
          description: 'Failed to load money requests',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRequests();
  }, [user]);
  
  const handleAccept = async (request: MoneyRequest) => {
    if (!user?.id) return;
    
    try {
      // First update the request status to completed
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', request.id);
        
      if (updateError) throw updateError;
      
      // Create a new transaction for the transfer
      const { error: transferError } = await supabase
        .from('transactions')
        .insert([
          {
            sender_id: user.id,
            receiver_id: request.sender_id,
            amount: request.amount,
            description: `Payment for: ${request.description}`,
            transaction_type: 'transfer',
            status: 'completed'
          }
        ]);
        
      if (transferError) throw transferError;
      
      // Update the sender's wallet (add money)
      const { error: senderWalletError } = await supabase.rpc('update_wallet_balance', {
        _user_id: request.sender_id,
        _amount: request.amount
      });
      
      if (senderWalletError) throw senderWalletError;
      
      // Update the receiver's wallet (subtract money)
      const { error: receiverWalletError } = await supabase.rpc('update_wallet_balance', {
        _user_id: user.id,
        _amount: -request.amount
      });
      
      if (receiverWalletError) throw receiverWalletError;
      
      toast({
        title: 'Success',
        description: 'Payment sent successfully!',
      });
      
      // Update the UI
      setRequests(prev => prev.filter(req => req.id !== request.id));
      
    } catch (error) {
      console.error('Error accepting money request:', error);
      toast({
        title: 'Error',
        description: 'Failed to process payment. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'rejected' })
        .eq('id', requestId);
        
      if (error) throw error;
      
      toast({
        title: 'Request Rejected',
        description: 'The money request has been rejected',
      });
      
      // Update the UI
      setRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error rejecting money request:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject request. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20"></div>
              <div className="space-y-2">
                <div className="h-4 w-24 bg-primary/20 rounded"></div>
                <div className="h-3 w-16 bg-primary/10 rounded"></div>
              </div>
            </div>
            <div className="h-8 w-16 bg-primary/20 rounded"></div>
          </div>
        ))}
      </div>
    );
  }
  
  if (requests.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <AlertCircle className="mx-auto h-10 w-10 mb-2 text-muted-foreground/70" />
        <p>No pending money requests</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div key={request.id} className="p-4 border rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{request.sender_name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="font-medium text-primary">
              {request.amount} Movals
            </div>
          </div>
          
          <p className="text-sm">{request.description}</p>
          
          <div className="flex gap-2 pt-2">
            <ButtonCustom
              size="sm"
              variant="glass"
              className="flex-1 bg-green-500/10 text-green-600 hover:bg-green-500/20"
              onClick={() => handleAccept(request)}
            >
              <CheckCircle className="mr-1 h-4 w-4" /> Accept
            </ButtonCustom>
            
            <ButtonCustom
              size="sm"
              variant="glass"
              className="flex-1 bg-red-500/10 text-red-600 hover:bg-red-500/20"
              onClick={() => handleReject(request.id)}
            >
              <XCircle className="mr-1 h-4 w-4" /> Reject
            </ButtonCustom>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MoneyRequests;
