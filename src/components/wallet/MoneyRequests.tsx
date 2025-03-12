
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ButtonCustom } from '@/components/ui/button-custom';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Check, X } from 'lucide-react';

interface MoneyRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  description: string;
  created_at: string;
  sender_name?: string;
  receiver_name?: string;
}

export function MoneyRequests() {
  const { user, updateUserData } = useAuth();
  const [requests, setRequests] = useState<MoneyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Fetch money requests - both sent to me and by me
  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) return;

      try {
        // Get requests where I'm the sender (someone requested money from me)
        const { data: receivedRequests, error: receivedError } = await supabase
          .from('transactions')
          .select(`
            id,
            sender_id,
            receiver_id,
            amount,
            description,
            created_at
          `)
          .eq('sender_id', user.id)
          .eq('transaction_type', 'request')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (receivedError) throw receivedError;

        // Get requests that I sent to others
        const { data: sentRequests, error: sentError } = await supabase
          .from('transactions')
          .select(`
            id,
            sender_id,
            receiver_id,
            amount,
            description,
            created_at
          `)
          .eq('receiver_id', user.id)
          .eq('transaction_type', 'request')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (sentError) throw sentError;

        // Combine and enhance with profile data
        const allRequests = [...(receivedRequests || []), ...(sentRequests || [])];
        
        // Get all unique user IDs to fetch their names
        const uniqueUserIds = [...new Set(
          allRequests.flatMap(req => [req.sender_id, req.receiver_id])
        )];
        
        // Fetch profiles for these users
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', uniqueUserIds);
          
        if (profilesError) throw profilesError;
        
        // Map profiles to a lookup object
        const profileMap = (profiles || []).reduce((acc, profile) => {
          acc[profile.id] = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User';
          return acc;
        }, {} as Record<string, string>);
        
        // Enhance requests with names
        const enhancedRequests = allRequests.map(req => ({
          ...req,
          sender_name: profileMap[req.sender_id] || 'Unknown User',
          receiver_name: profileMap[req.receiver_id] || 'Unknown User'
        }));
        
        setRequests(enhancedRequests);
      } catch (error) {
        console.error('Error fetching money requests:', error);
        toast({
          title: 'Error',
          description: 'Unable to load money requests',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user]);

  // Handle approve request
  const handleApprove = async (request: MoneyRequest) => {
    if (!user) return;
    
    setProcessingId(request.id);
    
    try {
      // 1. Update the request status to completed
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', request.id);
        
      if (updateError) throw updateError;
      
      // 2. Transfer the money - deduct from sender (me) and add to receiver
      const { error: senderWalletError } = await supabase.rpc('update_wallet_balance', {
        user_id_param: request.sender_id,
        amount_param: -request.amount
      });
      
      if (senderWalletError) throw senderWalletError;
      
      const { error: receiverWalletError } = await supabase.rpc('update_wallet_balance', {
        user_id_param: request.receiver_id,
        amount_param: request.amount
      });
      
      if (receiverWalletError) throw receiverWalletError;
      
      // 3. Update user data to reflect new balance
      await updateUserData();
      
      // 4. Update UI
      setRequests(prev => prev.filter(r => r.id !== request.id));
      
      toast({
        title: 'Success',
        description: `You've sent ${request.amount} Movals to ${request.receiver_name}`,
      });
    } catch (error: any) {
      console.error('Error approving money request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Unable to complete the transaction',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };
  
  // Handle reject request
  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    
    try {
      // Just update the status to rejected
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'rejected' })
        .eq('id', requestId);
        
      if (error) throw error;
      
      // Update UI
      setRequests(prev => prev.filter(r => r.id !== requestId));
      
      toast({
        title: 'Request Rejected',
        description: 'The money request has been rejected',
      });
    } catch (error: any) {
      console.error('Error rejecting money request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Unable to reject the request',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };
  
  if (loading) {
    return <div className="py-4 text-center text-muted-foreground">Loading money requests...</div>;
  }
  
  if (requests.length === 0) {
    return <div className="py-4 text-center text-muted-foreground">You have no pending money requests</div>;
  }
  
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Pending Money Requests</h3>
      {requests.map(request => {
        const isReceivedRequest = request.sender_id === user?.id;
        
        return (
          <Card key={request.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {isReceivedRequest 
                  ? `Request from ${request.receiver_name}`
                  : `Your request to ${request.sender_name}`}
              </CardTitle>
              <CardDescription>
                {new Date(request.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-xl">{request.amount} Movals</p>
                  <p className="text-sm text-muted-foreground">{request.description}</p>
                </div>
                
                {isReceivedRequest && (
                  <div className="flex space-x-2">
                    <ButtonCustom
                      variant="success"
                      size="sm"
                      onClick={() => handleApprove(request)}
                      disabled={processingId === request.id}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Pay
                    </ButtonCustom>
                    <ButtonCustom
                      variant="destructive"
                      size="sm"
                      onClick={() => handleReject(request.id)}
                      disabled={processingId === request.id}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </ButtonCustom>
                  </div>
                )}
                
                {!isReceivedRequest && (
                  <ButtonCustom
                    variant="outline"
                    size="sm"
                    onClick={() => handleReject(request.id)}
                    disabled={processingId === request.id}
                  >
                    Cancel Request
                  </ButtonCustom>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default MoneyRequests;
