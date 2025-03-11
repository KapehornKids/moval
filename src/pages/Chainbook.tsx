
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { CardCustom, CardContent, CardHeader, CardTitle } from "@/components/ui/card-custom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Separator } from "@/components/ui/separator";
import { ArrowUp, ArrowDown, Search, Calendar, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";

interface BlockchainBlock {
  id: string;
  block_number: number;
  current_hash: string;
  previous_hash: string | null;
  data: {
    transactions: Transaction[];
  };
  timestamp: string;
}

interface Transaction {
  id: string;
  amount: number;
  sender_id: string | null;
  receiver_id: string | null;
  sender_name?: string;
  receiver_name?: string;
  created_at: string;
  status: string;
  transaction_type: string;
  description?: string;
}

const Chainbook = () => {
  const [blocks, setBlocks] = useState<BlockchainBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please login to view the chainbook",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    const fetchBlockchainData = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('blockchain_blocks')
          .select('*')
          .order('block_number', { ascending: false })
          .limit(10);

        if (error) throw error;

        // Fetch user names for transactions
        const blockData = await Promise.all(
          data.map(async (block) => {
            const transactions = block.data.transactions || [];

            // Process each transaction to add sender/receiver names
            const processedTransactions = await Promise.all(
              transactions.map(async (tx) => {
                let senderName = 'System';
                let receiverName = 'System';

                if (tx.sender_id) {
                  const { data: senderData } = await supabase
                    .from('profiles')
                    .select('first_name, last_name')
                    .eq('id', tx.sender_id)
                    .single();
                    
                  if (senderData) {
                    senderName = `${senderData.first_name || ''} ${senderData.last_name || ''}`.trim() || 'Unknown';
                  }
                }

                if (tx.receiver_id) {
                  const { data: receiverData } = await supabase
                    .from('profiles')
                    .select('first_name, last_name')
                    .eq('id', tx.receiver_id)
                    .single();
                    
                  if (receiverData) {
                    receiverName = `${receiverData.first_name || ''} ${receiverData.last_name || ''}`.trim() || 'Unknown';
                  }
                }

                return {
                  ...tx,
                  sender_name: senderName,
                  receiver_name: receiverName
                };
              })
            );

            return {
              ...block,
              data: {
                ...block.data,
                transactions: processedTransactions
              }
            };
          })
        );

        setBlocks(blockData);
      } catch (error: any) {
        console.error("Error fetching blockchain data:", error);
        toast({
          title: "Error",
          description: "Failed to load blockchain data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlockchainData();
  }, [isAuthenticated, navigate, toast]);

  // Filter blocks based on search term
  const filteredBlocks = blocks.filter(block => {
    if (!searchTerm) return true;
    
    const searchTermLower = searchTerm.toLowerCase();
    
    // Search in block hash
    if (block.current_hash.toLowerCase().includes(searchTermLower)) return true;
    
    // Search in transactions
    return block.data.transactions.some(tx => 
      tx.id.toLowerCase().includes(searchTermLower) ||
      (tx.sender_name && tx.sender_name.toLowerCase().includes(searchTermLower)) ||
      (tx.receiver_name && tx.receiver_name.toLowerCase().includes(searchTermLower)) ||
      (tx.description && tx.description.toLowerCase().includes(searchTermLower))
    );
  });

  return (
    <Layout>
      <div className="container px-4 pt-8 pb-16">
        <h1 className="text-3xl font-bold mb-2">Moval Chainbook</h1>
        <p className="text-muted-foreground mb-8">
          Transparent record of all transactions on the Moval blockchain
        </p>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by transaction ID, address, or description..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <CardCustom key={i} className="glass-card animate-pulse">
                <CardHeader>
                  <div className="h-6 w-48 bg-primary/20 rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-4 w-full bg-primary/20 rounded"></div>
                    <div className="h-4 w-3/4 bg-primary/20 rounded"></div>
                    <div className="h-4 w-1/2 bg-primary/20 rounded"></div>
                  </div>
                </CardContent>
              </CardCustom>
            ))}
          </div>
        ) : filteredBlocks.length > 0 ? (
          <div className="space-y-6">
            {filteredBlocks.map((block) => (
              <CardCustom key={block.id} className="glass-card overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl flex items-center gap-2">
                      Block #{block.block_number}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock size={14} />
                      {formatDistanceToNow(new Date(block.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 text-xs font-mono bg-black/30 p-3 rounded overflow-x-auto">
                    <div><span className="text-blue-400">Current Hash:</span> {block.current_hash}</div>
                    {block.previous_hash && (
                      <div><span className="text-blue-400">Previous Hash:</span> {block.previous_hash}</div>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold mb-2">Transactions</h3>
                  {block.data.transactions && block.data.transactions.length > 0 ? (
                    <div className="space-y-3">
                      {block.data.transactions.map((tx, idx) => (
                        <div key={idx} className="border border-white/10 rounded-lg p-3 bg-black/20">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-mono text-xs text-muted-foreground">
                              {tx.id}
                            </div>
                            <div className="flex items-center">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                tx.status === 'completed' 
                                  ? 'bg-green-500/20 text-green-300' 
                                  : tx.status === 'pending'
                                  ? 'bg-yellow-500/20 text-yellow-300'
                                  : 'bg-red-500/20 text-red-300'
                              }`}>
                                {tx.status}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex-1">
                              <p className="text-sm">From: <span className="font-medium">{tx.sender_name}</span></p>
                              <p className="text-sm">To: <span className="font-medium">{tx.receiver_name}</span></p>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-semibold ${
                                user && tx.receiver_id === user.id 
                                  ? 'text-green-400' 
                                  : user && tx.sender_id === user.id
                                  ? 'text-red-400'
                                  : ''
                              }`}>
                                {user && tx.receiver_id === user.id && <ArrowDown size={16} className="inline mr-1" />}
                                {user && tx.sender_id === user.id && <ArrowUp size={16} className="inline mr-1" />}
                                {tx.amount} M
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(tx.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          
                          {tx.description && (
                            <p className="text-sm text-muted-foreground mt-2 border-t border-white/10 pt-2">
                              {tx.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No transactions in this block</p>
                  )}
                </CardContent>
              </CardCustom>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium mb-2">No results found</h3>
            <p className="text-muted-foreground">
              Try a different search term or come back later for more transactions
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Chainbook;
