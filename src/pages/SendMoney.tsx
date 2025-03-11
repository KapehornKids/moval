import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { CardCustom, CardContent, CardHeader, CardTitle } from '@/components/ui/card-custom';
import { ButtonCustom } from '@/components/ui/button-custom';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { getAnimationClass } from '@/lib/animations';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, User, DollarSign } from 'lucide-react';

const SendMoney = () => {
  const [activeTab, setActiveTab] = useState('send');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Function to get user info by email
  const getUserByEmail = async (email: string) => {
    try {
      const { data: userProfiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name
        `)
        .eq('id', (await supabase.auth.getUser()).data.user?.id);
      
      if (error) throw error;
      
      if (userProfiles && userProfiles.length > 0) {
        const user = userProfiles[0];
        return {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`.trim() || 'User'
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  };

  // Function to get user email by ID
  const getUserEmailById = async (userId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (user && user.user) {
        return user.user.email;
      }
      return null;
    } catch (error) {
      console.error('Error getting user email by ID:', error);
      return null;
    }
  };

  // Handle user selection
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setSearchResults([]);
    setSearchTerm('');
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

    if (!amount) {
      toast({
        title: 'Error',
        description: 'Please enter an amount to send.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);

    try {
      const amountNumber = parseFloat(amount);

      // Get sender and receiver IDs
      const senderId = (await supabase.auth.getUser()).data.user?.id;
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
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (transactionError) throw transactionError;

      toast({
        title: 'Success',
        description: `Successfully sent ${amount} Movals to ${selectedUser.name}.`,
      });

      // Reset form
      setSelectedUser(null);
      setAmount('');
      setDescription('');
    } catch (error) {
      console.error('Error sending money:', error);
      toast({
        title: 'Error',
        description: 'Unable to send money. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  // Handle amount change
  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and one decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  // Function to handle user search
  const handleUserSearch = async () => {
    try {
      setIsSearching(true);
      
      // Direct query to profiles table
      const { data: userProfiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name
        `)
        .ilike('first_name', `%${searchTerm}%`)
        .order('first_name', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      
      const formattedUsers = await Promise.all(
        userProfiles.map(async (user) => {
          const email = await getUserEmailById(user.id);
          return {
            id: user.id,
            name: `${user.first_name} ${user.last_name}`.trim() || 'User',
            email: email || 'No email'
          };
        })
      );
      
      setSearchResults(formattedUsers);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: 'Error',
        description: 'Unable to search for users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please login to send money",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div className="container px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight animate-fade-in">Send Money</h1>
          <p className="text-muted-foreground animate-fade-in">
            Send money to other users in the Moval Society
          </p>
        </div>

        <Tabs defaultValue="send" className={`w-full ${getAnimationClass("fade", 1)}`}>
          <TabsList className="mb-4">
            <TabsTrigger value="send" onClick={() => setActiveTab('send')}>Send Money</TabsTrigger>
            <TabsTrigger value="request" onClick={() => setActiveTab('request')}>Request Money</TabsTrigger>
          </TabsList>
          <TabsContent value="send">
            <CardCustom className="glass-card">
              <CardHeader>
                <CardTitle>Send Movals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <Label htmlFor="search">Search User</Label>
                  <div className="relative">
                    <Input
                      id="search"
                      placeholder="Enter a name to search for a user..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUserSearch();
                        }
                      }}
                      className="glass-effect"
                    />
                    <ButtonCustom
                      variant="secondary"
                      size="sm"
                      className="absolute right-1 top-1 rounded-md"
                      onClick={handleUserSearch}
                      disabled={isSearching}
                    >
                      {isSearching ? 'Searching...' : <Search className="w-4 h-4 mr-2" />}
                    </ButtonCustom>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="mt-2">
                      <Label>Search Results</Label>
                      <Select onValueChange={(value) => {
                        const user = searchResults.find(user => user.id === value);
                        handleUserSelect(user);
                      }}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a user" value={selectedUser?.id} />
                        </SelectTrigger>
                        <SelectContent>
                          {searchResults.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4" />
                                <span>{user.name} ({user.email})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {selectedUser && (
                    <div className="mt-2 p-3 rounded-md bg-muted/50">
                      <Label>Selected User</Label>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>{selectedUser.name}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid gap-4">
                  <Label htmlFor="amount">Amount (Movals)</Label>
                  <Input
                    id="amount"
                    placeholder="Enter amount"
                    type="number"
                    value={amount}
                    onChange={handleAmountChange}
                    className="glass-effect"
                  />
                </div>
                <div className="grid gap-4">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="glass-effect"
                  />
                </div>
                <ButtonCustom onClick={handleSend} disabled={isSending} className="w-full">
                  {isSending ? 'Sending...' : 'Send Money'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </ButtonCustom>
              </CardContent>
            </CardCustom>
          </TabsContent>
          <TabsContent value="request">
            <CardCustom className="glass-card">
              <CardHeader>
                <CardTitle>Request Movals (Coming Soon)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">This feature is coming soon!</p>
              </CardContent>
            </CardCustom>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SendMoney;
