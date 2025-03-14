
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { CardCustom, CardHeader, CardTitle, CardContent } from '@/components/ui/card-custom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ButtonCustom } from '@/components/ui/button-custom';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getAnimationClass } from '@/lib/animations';
import { Check, X, AlertCircle, Gavel, FileText, User, Flag, Clock } from 'lucide-react';
import { Dispute } from '@/types';

const JusticeAdmin = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [ruling, setRuling] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = async () => {
      const hasJusticeRole = await hasRole('justice_department');
      if (!hasJusticeRole) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the Justice Admin page",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }
      
      fetchDisputes();
    };

    checkAccess();
  }, [hasRole, navigate]);

  const fetchDisputes = async () => {
    try {
      setIsLoading(true);
      
      // Get disputes with complainant and respondent information
      const { data, error } = await supabase
        .from('disputes')
        .select(`
          *,
          complainant:complainant_id(
            id,
            first_name,
            last_name
          ),
          respondent:respondent_id(
            id,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        // Process the disputes to match our Dispute type
        const processedDisputes: Dispute[] = data.map(item => ({
          id: item.id,
          created_at: item.created_at,
          complainant_id: item.complainant_id,
          respondent_id: item.respondent_id,
          status: item.status as 'pending' | 'resolved' | 'rejected',
          transaction_id: item.transaction_id || '',
          description: item.description,
          ruling: item.ruling,
          resolution: item.resolution,
          amount: 0, // Use a default value since it's required in the type
          complainant_name: item.complainant ? 
            `${item.complainant.first_name || ''} ${item.complainant.last_name || ''}`.trim() : 
            'Unknown',
          respondent_name: item.respondent ? 
            `${item.respondent.first_name || ''} ${item.respondent.last_name || ''}`.trim() : 
            'Unknown',
          evidence: item.evidence,
          ruled_by: item.ruled_by
        }));
        
        setDisputes(processedDisputes);
      }
    } catch (error) {
      console.error('Error fetching disputes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load disputes',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveDispute = async (decision: 'resolve' | 'reject') => {
    if (!selectedDispute || !user?.id) return;
    if (decision === 'resolve' && !ruling.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a ruling before resolving the dispute',
        variant: 'destructive',
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Update the dispute status
      const { error } = await supabase
        .from('disputes')
        .update({
          status: decision === 'resolve' ? 'resolved' : 'rejected',
          ruling: decision === 'resolve' ? ruling : 'Dispute rejected',
          ruled_by: user.id
        })
        .eq('id', selectedDispute.id);
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Dispute has been ${decision === 'resolve' ? 'resolved' : 'rejected'} successfully`,
      });
      
      // Refresh disputes list
      fetchDisputes();
      setSelectedDispute(null);
      setRuling('');
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast({
        title: 'Error',
        description: 'Failed to process the dispute decision',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <div className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </div>
        );
      case 'resolved':
        return (
          <div className="bg-green-500/10 text-green-500 px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <Check className="w-3 h-3 mr-1" />
            Resolved
          </div>
        );
      case 'rejected':
        return (
          <div className="bg-red-500/10 text-red-500 px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <X className="w-3 h-3 mr-1" />
            Rejected
          </div>
        );
      default:
        return (
          <div className="bg-gray-500/10 text-gray-500 px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <AlertCircle className="w-3 h-3 mr-1" />
            {status}
          </div>
        );
    }
  };

  return (
    <Layout>
      <div className="container px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex items-center gap-2">
            <Gavel className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Justice Department Admin</h1>
          </div>
          <p className="text-muted-foreground">
            Review and resolve disputes submitted by users
          </p>
        </div>
        
        <Tabs defaultValue="pending" className={getAnimationClass("fade", 1)}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending" className="flex items-center">
              <Clock size={16} className="mr-2" />
              <span>Pending</span>
            </TabsTrigger>
            <TabsTrigger value="resolved" className="flex items-center">
              <Check size={16} className="mr-2" />
              <span>Resolved</span>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center">
              <X size={16} className="mr-2" />
              <span>Rejected</span>
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center">
              <FileText size={16} className="mr-2" />
              <span>All</span>
            </TabsTrigger>
          </TabsList>
          
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <CardCustom key={i}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-2">
                        <div className="h-5 w-32 bg-primary/20 rounded"></div>
                        <div className="h-4 w-24 bg-primary/10 rounded"></div>
                      </div>
                      <div className="h-6 w-20 bg-primary/20 rounded-full"></div>
                    </div>
                    <div className="h-20 bg-primary/10 rounded"></div>
                  </CardContent>
                </CardCustom>
              ))}
            </div>
          ) : (
            <>
              <TabsContent value="pending">
                {renderDisputeList(disputes.filter(d => d.status === 'pending'))}
              </TabsContent>
              
              <TabsContent value="resolved">
                {renderDisputeList(disputes.filter(d => d.status === 'resolved'))}
              </TabsContent>
              
              <TabsContent value="rejected">
                {renderDisputeList(disputes.filter(d => d.status === 'rejected'))}
              </TabsContent>
              
              <TabsContent value="all">
                {renderDisputeList(disputes)}
              </TabsContent>
            </>
          )}
        </Tabs>
        
        {selectedDispute && (
          <CardCustom className="mt-8 glass-card">
            <CardHeader>
              <CardTitle>Review Dispute</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2 flex items-center">
                    <Flag className="w-4 h-4 mr-2 text-red-500" />
                    Complainant
                  </h3>
                  <div className="p-4 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{selectedDispute.complainant_name}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2 flex items-center">
                    <User className="w-4 h-4 mr-2 text-primary" />
                    Respondent
                  </h3>
                  <div className="p-4 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{selectedDispute.respondent_name}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <div className="p-4 rounded-lg bg-white/5">
                  <p>{selectedDispute.description}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Evidence</h3>
                <div className="p-4 rounded-lg bg-white/5">
                  <p>Transaction ID: {selectedDispute.transaction_id || 'Not provided'}</p>
                  {selectedDispute.evidence && <p className="mt-2">{selectedDispute.evidence}</p>}
                </div>
              </div>
              
              {selectedDispute.status === 'pending' ? (
                <>
                  <div>
                    <h3 className="font-medium mb-2">Your Ruling</h3>
                    <Textarea
                      placeholder="Enter your ruling and decision here..."
                      value={ruling}
                      onChange={(e) => setRuling(e.target.value)}
                      className="min-h-[120px] glass-effect"
                    />
                  </div>
                  
                  <div className="flex gap-4">
                    <ButtonCustom
                      className="flex-1 bg-green-500/10 text-green-600 hover:bg-green-500/20"
                      onClick={() => handleResolveDispute('resolve')}
                      disabled={submitting}
                    >
                      <Check className="mr-2 h-4 w-4" /> Resolve Dispute
                    </ButtonCustom>
                    
                    <ButtonCustom
                      variant="glass"
                      className="flex-1 bg-red-500/10 text-red-600 hover:bg-red-500/20"
                      onClick={() => handleResolveDispute('reject')}
                      disabled={submitting}
                    >
                      <X className="mr-2 h-4 w-4" /> Reject Dispute
                    </ButtonCustom>
                  </div>
                </>
              ) : (
                <div>
                  <h3 className="font-medium mb-2">Ruling</h3>
                  <div className="p-4 rounded-lg bg-white/5">
                    <p>{selectedDispute.ruling || 'No ruling provided'}</p>
                  </div>
                </div>
              )}
              
              <ButtonCustom
                variant="outline"
                onClick={() => {
                  setSelectedDispute(null);
                  setRuling('');
                }}
              >
                Back to List
              </ButtonCustom>
            </CardContent>
          </CardCustom>
        )}
      </div>
    </Layout>
  );
  
  function renderDisputeList(disputes: Dispute[]) {
    if (disputes.length === 0) {
      return (
        <div className="text-center py-12">
          <Gavel className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Disputes Found</h3>
          <p className="text-muted-foreground">
            There are no disputes in this category at the moment.
          </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {disputes.map((dispute) => (
          <CardCustom
            key={dispute.id}
            className="hover:bg-accent/20 cursor-pointer transition-colors"
            onClick={() => setSelectedDispute(dispute)}
          >
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                <div>
                  <h3 className="font-medium">
                    Dispute filed by {dispute.complainant_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(dispute.created_at).toLocaleDateString()} at{' '}
                    {new Date(dispute.created_at).toLocaleTimeString()}
                  </p>
                </div>
                {getStatusBadge(dispute.status)}
              </div>
              
              <p className="mb-4 line-clamp-2">{dispute.description}</p>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Against: {dispute.respondent_name}
                  </span>
                </div>
                
                <ButtonCustom
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDispute(dispute);
                  }}
                >
                  View Details
                </ButtonCustom>
              </div>
            </CardContent>
          </CardCustom>
        ))}
      </div>
    );
  }
};

export default JusticeAdmin;
