import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import WalletCard from "@/components/wallet/WalletCard";
import TransactionItem, { Transaction } from "@/components/wallet/TransactionItem";
import { CardCustom, CardContent, CardHeader, CardTitle } from "@/components/ui/card-custom";
import { ButtonCustom } from "@/components/ui/button-custom";
import { useAuth } from "@/hooks/useAuth";
import { getAnimationClass } from "@/lib/animations";
import { Activity, ArrowRight, CreditCard, FileText, Vote, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import MoneyRequests from '@/components/wallet/MoneyRequests';

const quickActions = [
  {
    title: "Apply for Loan",
    description: "Request Movals from MBMQ bank",
    icon: <CreditCard size={24} />,
    path: "/loans",
    color: "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400",
  },
  {
    title: "Vote",
    description: "Participate in society elections",
    icon: <Vote size={24} />,
    path: "/voting",
    color: "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  },
  {
    title: "View Statements",
    description: "See your financial reports",
    icon: <FileText size={24} />,
    path: "/statements",
    color: "bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
  },
  {
    title: "Join Association",
    description: "Apply for community roles",
    icon: <Users size={24} />,
    path: "/association",
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  },
];

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      
      try {
        const { data: incomingData, error: incomingError } = await supabase
          .from('transactions')
          .select(`
            id, 
            amount, 
            created_at, 
            status, 
            sender:sender_id(profiles(first_name, last_name))
          `)
          .eq('receiver_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (incomingError) throw incomingError;
        
        const { data: outgoingData, error: outgoingError } = await supabase
          .from('transactions')
          .select(`
            id, 
            amount, 
            created_at, 
            status, 
            recipient:receiver_id(profiles(first_name, last_name))
          `)
          .eq('sender_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (outgoingError) throw outgoingError;
        
        const incomingTransactions = incomingData.map((tx: any) => ({
          id: tx.id,
          type: 'incoming' as const,
          amount: tx.amount,
          sender: tx.sender?.profiles?.first_name && tx.sender?.profiles?.last_name 
            ? `${tx.sender.profiles.first_name} ${tx.sender.profiles.last_name}` 
            : 'Unknown',
          date: new Date(tx.created_at),
          status: tx.status as "completed" | "pending" | "failed"
        }));
        
        const outgoingTransactions = outgoingData.map((tx: any) => ({
          id: tx.id,
          type: 'outgoing' as const,
          amount: tx.amount,
          recipient: tx.recipient?.profiles?.first_name && tx.recipient?.profiles?.last_name 
            ? `${tx.recipient.profiles.first_name} ${tx.recipient.profiles.last_name}` 
            : 'Unknown',
          date: new Date(tx.created_at),
          status: tx.status as "completed" | "pending" | "failed"
        }));
        
        const allTransactions = [...incomingTransactions, ...outgoingTransactions]
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .slice(0, 4);
        
        setTransactions(allTransactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTransactions();
  }, [user]);
  
  const handleSendMoney = () => {
    navigate('/send-money');
  };
  
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      toast({
        title: "Authentication Required",
        description: "Please login to access the dashboard",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  if (!isAuthenticated && !isLoading) {
    return null;
  }
  
  return (
    <Layout>
      <div className="container px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight animate-fade-in">Dashboard</h1>
          <p className="text-muted-foreground animate-fade-in">
            Manage your wallet, transactions, and community activities
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className={getAnimationClass("fade", 1)}>
              <WalletCard 
                onSend={handleSendMoney} 
                onReceive={() => navigate('/receive-money')} 
              />
            </div>
            
            <CardCustom className={getAnimationClass("fade", 2)}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl">Recent Transactions</CardTitle>
                <ButtonCustom 
                  variant="ghost" 
                  size="sm" 
                  className="gap-1" 
                  rightIcon={<ArrowRight size={16} />}
                  onClick={() => navigate('/transactions')}
                >
                  View All
                </ButtonCustom>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="p-4 rounded-lg border animate-pulse flex justify-between items-center"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 rounded-full bg-muted"></div>
                          <div className="space-y-2">
                            <div className="h-4 w-32 bg-muted rounded"></div>
                            <div className="h-3 w-24 bg-muted rounded"></div>
                          </div>
                        </div>
                        <div className="h-5 w-16 bg-muted rounded"></div>
                      </div>
                    ))
                  ) : transactions.length > 0 ? (
                    transactions.map((transaction) => (
                      <TransactionItem key={transaction.id} transaction={transaction} />
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      No transactions yet. Start sending or receiving Movals!
                    </div>
                  )}
                </div>
              </CardContent>
            </CardCustom>
            
            <div className="col-span-12 md:col-span-6 xl:col-span-4">
              <CardCustom className="glass-card">
                <CardHeader>
                  <CardTitle>Money Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <MoneyRequests />
                </CardContent>
              </CardCustom>
            </div>
          </div>
          
          <div className="space-y-6">
            <CardCustom className={getAnimationClass("fade", 3)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Activity size={18} />
                  Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div className="h-8 w-8 rounded-full bg-muted"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-4 w-full bg-muted rounded"></div>
                          <div className="h-3 w-24 bg-muted rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                        <Users size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Association election started</p>
                        <p className="text-xs text-muted-foreground">3 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                        <CreditCard size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Loan application approved</p>
                        <p className="text-xs text-muted-foreground">Yesterday</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                        <Vote size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">You voted on proposal #23</p>
                        <p className="text-xs text-muted-foreground">2 days ago</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </CardCustom>
            
            <CardCustom className={getAnimationClass("fade", 4)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {quickActions.map((action, index) => (
                    <button
                      key={action.title}
                      className={`p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left ${getAnimationClass("scale", index + 1)}`}
                      onClick={() => navigate(action.path)}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${action.color}`}>
                        {action.icon}
                      </div>
                      <h3 className="font-medium">{action.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </CardCustom>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
