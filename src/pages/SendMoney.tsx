
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { CardCustom, CardContent, CardHeader, CardTitle } from '@/components/ui/card-custom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { getAnimationClass } from '@/lib/animations';
import { toast } from '@/hooks/use-toast';
import UserSearch from '@/components/send-money/UserSearch';
import TransactionForm from '@/components/send-money/TransactionForm';
import RequestForm from '@/components/send-money/RequestForm';

const SendMoney = () => {
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; email: string | null } | null>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

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
      <div className="container max-w-4xl px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight animate-fade-in">Moval Transfers</h1>
          <p className="text-muted-foreground animate-fade-in">
            Send or request money from other Moval citizens
          </p>
        </div>

        <Tabs defaultValue="send" className={`w-full ${getAnimationClass("fade", 1)}`}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="send" className="flex-1">Send Money</TabsTrigger>
            <TabsTrigger value="request" className="flex-1">Request Money</TabsTrigger>
          </TabsList>
          
          <TabsContent value="send">
            <CardCustom className="glass-card">
              <CardHeader>
                <CardTitle>Send Movals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <UserSearch 
                  onUserSelect={setSelectedUser}
                  selectedUser={selectedUser}
                />
                
                {selectedUser && (
                  <div className="pt-4 border-t border-white/10">
                    <TransactionForm selectedUser={selectedUser} />
                  </div>
                )}
              </CardContent>
            </CardCustom>
          </TabsContent>
          
          <TabsContent value="request">
            <RequestForm />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SendMoney;
