
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { CardCustom, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card-custom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ButtonCustom } from "@/components/ui/button-custom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getAnimationClass } from "@/lib/animations";
import { ArrowLeft, Send } from "lucide-react";

const SendMoney = () => {
  const [amount, setAmount] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearch, setIsSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  
  const { user, updateUserData } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to send money",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [user, navigate, toast]);
  
  // Search for recipient
  const handleSearch = async () => {
    if (!recipientEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email to search",
        variant: "destructive",
      });
      return;
    }
    
    setIsSearch(true);
    setIsLoading(true);
    
    try {
      const { data: userData, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name
        `)
        .eq('id', (await supabase.from('auth.users').select('id').eq('email', recipientEmail).single()).data?.id)
        .single();
      
      if (error) throw error;
      
      if (userData) {
        setSearchResults([userData]);
      } else {
        setSearchResults([]);
        toast({
          title: "No Results",
          description: "No user found with that email"
        });
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: error.message || "Failed to search for recipient",
        variant: "destructive"
      });
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle recipient selection
  const handleSelectRecipient = (recipient: any) => {
    setSelectedRecipient(recipient);
    setIsSearch(false);
  };
  
  // Handle send money
  const handleSendMoney = async () => {
    if (!selectedRecipient) {
      toast({
        title: "Error",
        description: "Please select a recipient",
        variant: "destructive",
      });
      return;
    }
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    
    const numAmount = Number(amount);
    
    if (numAmount > (user?.walletBalance || 0)) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough Movals for this transaction",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert([
          {
            sender_id: user?.id,
            receiver_id: selectedRecipient.id,
            amount: numAmount,
            status: 'completed',
            transaction_type: 'transfer',
            description: `Transfer to ${selectedRecipient.first_name} ${selectedRecipient.last_name}`
          }
        ])
        .select()
        .single();
      
      if (transactionError) throw transactionError;
      
      // Update sender wallet (decrease balance)
      const { error: senderWalletError } = await supabase
        .from('wallets')
        .update({ balance: (user?.walletBalance || 0) - numAmount })
        .eq('user_id', user?.id);
      
      if (senderWalletError) throw senderWalletError;
      
      // Update recipient wallet (increase balance)
      const { error: recipientWalletError } = await supabase
        .from('wallets')
        .update({ 
          balance: supabase.rpc('get_wallet_balance', { user_id_param: selectedRecipient.id }) + numAmount 
        })
        .eq('user_id', selectedRecipient.id);
      
      if (recipientWalletError) throw recipientWalletError;
      
      // Update user data
      await updateUserData();
      
      toast({
        title: "Success",
        description: `${numAmount} Movals sent to ${selectedRecipient.first_name} ${selectedRecipient.last_name}`,
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Send money error:', error);
      toast({
        title: "Transaction Failed",
        description: error.message || "Failed to send money",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Layout>
      <div className="container max-w-md px-4 py-12">
        <CardCustom className={getAnimationClass("fade", 1)}>
          <CardHeader>
            <div className="flex items-center">
              <ButtonCustom 
                variant="ghost" 
                size="sm" 
                className="mr-2 p-0 w-8 h-8"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft size={18} />
              </ButtonCustom>
              <CardTitle>Send Money</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isSearch ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search by Email</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="search"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="user@example.com"
                      disabled={isLoading}
                    />
                    <ButtonCustom 
                      onClick={handleSearch} 
                      disabled={isLoading} 
                      loading={isLoading}
                    >
                      Search
                    </ButtonCustom>
                  </div>
                </div>
                
                {searchResults.length > 0 ? (
                  <div className="space-y-2">
                    <Label>Search Results</Label>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {searchResults.map((result) => (
                        <div 
                          key={result.id} 
                          className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleSelectRecipient(result)}
                        >
                          <p className="font-medium">{result.first_name} {result.last_name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : searchResults.length === 0 && !isLoading ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No users found. Try a different email.
                  </div>
                ) : null}
                
                <div className="flex justify-between pt-4">
                  <ButtonCustom
                    variant="outline"
                    onClick={() => setIsSearch(false)}
                  >
                    Back
                  </ButtonCustom>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedRecipient ? (
                  <div className="space-y-2">
                    <Label>Recipient</Label>
                    <div className="p-3 border rounded-lg bg-muted/30">
                      <p className="font-medium">{selectedRecipient.first_name} {selectedRecipient.last_name}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient</Label>
                    <ButtonCustom 
                      variant="outline" 
                      className="w-full justify-start text-muted-foreground font-normal"
                      onClick={() => setIsSearch(true)}
                    >
                      Search for a recipient
                    </ButtonCustom>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (Movals)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Available balance: {user?.walletBalance || 0} M
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          {!isSearch && (
            <CardFooter className="flex justify-between">
              <ButtonCustom
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Cancel
              </ButtonCustom>
              <ButtonCustom
                onClick={handleSendMoney}
                disabled={isLoading || !selectedRecipient || !amount}
                loading={isLoading}
                leftIcon={<Send size={16} />}
              >
                Send Money
              </ButtonCustom>
            </CardFooter>
          )}
        </CardCustom>
      </div>
    </Layout>
  );
};

export default SendMoney;
