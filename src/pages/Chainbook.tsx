
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { CardCustom, CardContent, CardHeader, CardTitle } from "@/components/ui/card-custom";
import { ButtonCustom } from "@/components/ui/button-custom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { getAnimationClass } from "@/lib/animations";
import { toast } from "@/hooks/use-toast";
import { Database, Search, ArrowUpRight, ChevronDown, ArrowDown, ArrowUp, CheckCircle, XCircle, HelpCircle, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BlockchainBlock {
  id: string;
  block_number: number;
  current_hash: string;
  previous_hash: string | null;
  timestamp: string;
  data: {
    transactions: Transaction[];
  };
}

interface Transaction {
  id: string;
  amount: number;
  sender_id: string | null;
  receiver_id: string | null;
  description: string | null;
  created_at: string;
  status: string;
  transaction_type: string;
  sender_name?: string;
  receiver_name?: string;
}

const Chainbook = () => {
  const [blocks, setBlocks] = useState<BlockchainBlock[]>([]);
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBlocks, setFilteredBlocks] = useState<BlockchainBlock[]>([]);
  
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Fetch blockchain data
  useEffect(() => {
    const fetchBlockchainData = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('blockchain_blocks')
          .select('*')
          .order('block_number', { ascending: false });
          
        if (error) throw error;
        
        // Process the data to ensure correct typing
        const processedBlocks: BlockchainBlock[] = data.map(block => {
          // Handle the data field which contains transaction information
          let parsedData;
          if (typeof block.data === 'string') {
            try {
              parsedData = JSON.parse(block.data);
            } catch (e) {
              console.error('Error parsing block data:', e);
              parsedData = { transactions: [] };
            }
          } else {
            parsedData = block.data as any;
          }
          
          return {
            ...block,
            data: parsedData
          };
        });
        
        setBlocks(processedBlocks);
        setFilteredBlocks(processedBlocks);
      } catch (error) {
        console.error('Error fetching blockchain data:', error);
        toast({
          title: "Error",
          description: "Unable to fetch blockchain data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBlockchainData();
  }, []);
  
  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBlocks(blocks);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = blocks.filter(block => {
      // Search in block info
      if (block.current_hash.toLowerCase().includes(query)) return true;
      if (block.previous_hash?.toLowerCase().includes(query)) return true;
      
      // Search in transactions
      if (block.data && Array.isArray(block.data.transactions)) {
        return block.data.transactions.some(tx => 
          tx.id.toLowerCase().includes(query) || 
          tx.description?.toLowerCase().includes(query) ||
          tx.sender_name?.toLowerCase().includes(query) ||
          tx.receiver_name?.toLowerCase().includes(query)
        );
      }
      
      return false;
    });
    
    setFilteredBlocks(filtered);
  }, [searchQuery, blocks]);
  
  // Toggle block expansion
  const toggleBlockExpansion = (blockId: string) => {
    setExpandedBlocks(prev => ({
      ...prev,
      [blockId]: !prev[blockId]
    }));
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };
  
  // Format hash for display
  const formatHash = (hash: string) => {
    if (!hash) return '';
    if (hash.length <= 16) return hash;
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };
  
  // Get transaction type icon
  const getTransactionIcon = (transaction: Transaction) => {
    switch (transaction.transaction_type) {
      case 'transfer':
        return <ArrowUpRight size={16} className="text-blue-500" />;
      case 'loan':
        return <Database size={16} className="text-purple-500" />;
      case 'repayment':
        return <ArrowUp size={16} className="text-green-500" />;
      default:
        return <HelpCircle size={16} className="text-muted-foreground" />;
    }
  };
  
  // Get transaction status badge
  const getTransactionStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 rounded-full text-xs bg-green-100/20 text-green-500 border border-green-500/20">Completed</span>;
      case 'pending':
        return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100/20 text-yellow-500 border border-yellow-500/20">Pending</span>;
      case 'failed':
        return <span className="px-2 py-1 rounded-full text-xs bg-red-100/20 text-red-500 border border-red-500/20">Failed</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100/20 text-gray-500 border border-gray-500/20">{status}</span>;
    }
  };
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      toast({
        title: "Authentication Required",
        description: "Please login to access the chainbook",
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
          <h1 className="text-3xl font-bold tracking-tight animate-fade-in">Chainbook</h1>
          <p className="text-muted-foreground animate-fade-in">
            View all transactions in the blockchain ledger
          </p>
        </div>
        
        {/* Search and Filters */}
        <CardCustom className={`glass-card mb-6 ${getAnimationClass("fade", 1)}`}>
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by transaction ID, hash, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 glass-effect"
                />
              </div>
              <ButtonCustom variant="outline" className="md:w-auto">
                <Filter size={16} className="mr-2" />
                Filters
              </ButtonCustom>
            </div>
          </CardContent>
        </CardCustom>
        
        {/* Blockchain Blocks */}
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <CardCustom key={i} className="animate-pulse">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-32 bg-white/10 rounded"></div>
                    <div className="h-6 w-48 bg-white/10 rounded"></div>
                  </div>
                  <div className="mt-4 h-8 w-full bg-white/10 rounded"></div>
                </CardContent>
              </CardCustom>
            ))
          ) : filteredBlocks.length > 0 ? (
            filteredBlocks.map((block) => (
              <CardCustom 
                key={block.id} 
                className={`glass-card hover:bg-white/5 transition-colors cursor-pointer ${getAnimationClass("fade", block.block_number % 5)}`}
                onClick={() => toggleBlockExpansion(block.id)}
              >
                <CardContent className="py-4">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Database size={18} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Block #{block.block_number}</h3>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(block.timestamp)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Hash</p>
                        <p className="text-sm font-mono">{formatHash(block.current_hash)}</p>
                      </div>
                      <ChevronDown 
                        size={20} 
                        className={`transform transition-transform ${expandedBlocks[block.id] ? 'rotate-180' : ''}`} 
                      />
                    </div>
                  </div>
                  
                  {expandedBlocks[block.id] && (
                    <div className="mt-4 pt-4 border-t border-white/10 animate-fade-in">
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Previous Hash:</span>
                          <span className="text-xs font-mono">{block.previous_hash ? formatHash(block.previous_hash) : 'Genesis Block'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Transactions:</span>
                          <span className="text-xs">{block.data.transactions?.length || 0} transactions</span>
                        </div>
                      </div>
                      
                      {/* Transactions */}
                      {block.data.transactions && block.data.transactions.length > 0 ? (
                        <div className="space-y-2 mt-4">
                          <h4 className="text-sm font-medium mb-2">Transactions:</h4>
                          {block.data.transactions.map((tx) => (
                            <div key={tx.id} className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  {getTransactionIcon(tx)}
                                  <div>
                                    <p className="text-sm font-medium">{tx.transaction_type.charAt(0).toUpperCase() + tx.transaction_type.slice(1)}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {tx.description || `Transaction ${formatHash(tx.id)}`}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium">{tx.amount} Movals</p>
                                  <div className="mt-1">
                                    {getTransactionStatusBadge(tx.status)}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-white/5">
                                <div>
                                  <p className="text-xs text-muted-foreground">From</p>
                                  <p className="text-xs truncate max-w-[150px]">
                                    {tx.sender_name || tx.sender_id || 'System'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">To</p>
                                  <p className="text-xs truncate max-w-[150px]">
                                    {tx.receiver_name || tx.receiver_id || 'System'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Transaction ID</p>
                                  <p className="text-xs font-mono">{formatHash(tx.id)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Time</p>
                                  <p className="text-xs">{new Date(tx.created_at).toLocaleTimeString()}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-4 text-center text-muted-foreground">
                          <p>No transactions in this block</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </CardCustom>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                <Database size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium">No Blocks Found</h3>
              <p className="text-muted-foreground mt-2 mb-6">
                No blockchain blocks match your search criteria
              </p>
              <ButtonCustom variant="outline" onClick={() => setSearchQuery('')}>
                Clear Search
              </ButtonCustom>
            </div>
          )}
        </div>
        
        {/* Load More Button */}
        {filteredBlocks.length > 0 && (
          <div className="flex justify-center mt-8">
            <ButtonCustom variant="glass">
              Load More Blocks
            </ButtonCustom>
          </div>
        )}
        
        {/* Blockchain Information */}
        <CardCustom className={`glass-card mt-12 ${getAnimationClass("fade", 5)}`}>
          <CardHeader>
            <CardTitle>About the Blockchain</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              The Moval Society uses a blockchain ledger to ensure transparency and security for all transactions. Every transaction is permanently recorded and cannot be altered.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-white/5">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                  <Database size={18} className="text-primary" />
                </div>
                <h4 className="text-sm font-medium">Transparent</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  All transactions are publicly visible and can be audited by any member of the society.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white/5">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                  <CheckCircle size={18} className="text-primary" />
                </div>
                <h4 className="text-sm font-medium">Secure</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Transactions are cryptographically secured and cannot be altered once recorded.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white/5">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                  <ArrowUpRight size={18} className="text-primary" />
                </div>
                <h4 className="text-sm font-medium">Automated</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  The system automatically records all transactions in the society in real-time.
                </p>
              </div>
            </div>
          </CardContent>
        </CardCustom>
      </div>
    </Layout>
  );
};

export default Chainbook;
