
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CardCustom, CardHeader, CardTitle, CardContent } from '@/components/ui/card-custom';
import { ButtonCustom } from '@/components/ui/button-custom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dispute } from '@/types';
import { 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  User
} from 'lucide-react';

const JusticeAdmin = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user, hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = async () => {
      if (!isAuthenticated) {
        toast({
          title: "Access Denied",
          description: "You must be logged in to access this page",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const hasAccess = await hasRole('justice_department');
      if (!hasAccess) {
        toast({
          title: "Access Denied",
          description: "You do not have the required role to access this page",
          variant: "destructive",
        });
        navigate("/dashboard");
      } else {
        fetchDisputes();
      }
    };

    checkAccess();
  }, [isAuthenticated, navigate, hasRole]);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('disputes')
        .select(`
          *,
          complainant:complainant_id(first_name, last_name),
          respondent:respondent_id(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process data to format it for our Dispute type
      const formattedDisputes: Dispute[] = data.map(dispute => {
        const formattedDispute: Dispute = {
          id: dispute.id,
          created_at: dispute.created_at,
          updated_at: dispute.updated_at,
          complainant_id: dispute.complainant_id,
          respondent_id: dispute.respondent_id,
          amount: dispute.amount || 0,
          status: dispute.status,
          transaction_id: dispute.transaction_id || '',
          description: dispute.description,
          resolution: dispute.resolution || '',
          ruling: dispute.ruling || '',
          evidence: dispute.evidence || '',
          ruled_by: dispute.ruled_by || '',
          complainant_name: dispute.complainant?.first_name && dispute.complainant?.last_name 
            ? `${dispute.complainant.first_name} ${dispute.complainant.last_name}`
            : 'Unknown User',
          respondent_name: dispute.respondent?.first_name && dispute.respondent?.last_name
            ? `${dispute.respondent.first_name} ${dispute.respondent.last_name}`
            : 'Unknown User'
        };
        return formattedDispute;
      });

      setDisputes(formattedDisputes);
    } catch (error) {
      console.error('Error fetching disputes:', error);
      toast({
        title: "Error",
        description: "Failed to load disputes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDisputeStatus = async (disputeId: string, status: string, ruling?: string) => {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
        ruled_by: user?.id
      };

      if (ruling) {
        updateData.ruling = ruling;
      }

      const { error } = await supabase
        .from('disputes')
        .update(updateData)
        .eq('id', disputeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Dispute ${status} successfully`,
      });

      // Refresh the disputes list
      fetchDisputes();
    } catch (error) {
      console.error('Error updating dispute:', error);
      toast({
        title: "Error",
        description: "Failed to update dispute status",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'in_review':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'dismissed':
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const filterDisputes = (status: string) => {
    if (status === 'all') return disputes;
    return disputes.filter(dispute => dispute.status === status);
  };

  return (
    <Layout>
      <div className="container px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight animate-fade-in flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Justice Department Administration
          </h1>
          <p className="text-muted-foreground animate-fade-in">
            Review and manage disputes within the Moval community
          </p>
        </div>

        <Tabs defaultValue="all" className="animate-fade-in">
          <TabsList className="mb-8">
            <TabsTrigger value="all">All Disputes</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="in_review">In Review</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          {['all', 'pending', 'in_review', 'resolved', 'rejected'].map((tab) => (
            <TabsContent key={tab} value={tab}>
              {loading ? (
                <div className="grid grid-cols-1 gap-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <CardCustom key={index} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-6 bg-primary/10 rounded w-1/4 mb-4"></div>
                        <div className="h-4 bg-primary/10 rounded w-3/4 mb-3"></div>
                        <div className="h-4 bg-primary/10 rounded w-1/2 mb-6"></div>
                        <div className="h-10 bg-primary/10 rounded w-1/4"></div>
                      </CardContent>
                    </CardCustom>
                  ))}
                </div>
              ) : filterDisputes(tab).length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {filterDisputes(tab).map(dispute => (
                    <CardCustom key={dispute.id} className="glass-card">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(dispute.status)}
                            <span className="font-medium capitalize">
                              {dispute.status.replace('_', ' ')}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(dispute.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <h3 className="text-lg font-medium mb-2">
                          Dispute #{dispute.id.substring(0, 8)}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              <span className="text-muted-foreground">Complainant:</span> {dispute.complainant_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              <span className="text-muted-foreground">Respondent:</span> {dispute.respondent_name}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm mb-4">{dispute.description}</p>

                        {dispute.evidence && (
                          <div className="mb-4 p-3 bg-muted rounded-md">
                            <h4 className="text-sm font-medium mb-1">Evidence:</h4>
                            <p className="text-sm text-muted-foreground">{dispute.evidence}</p>
                          </div>
                        )}

                        {dispute.ruling && (
                          <div className="mb-4 p-3 bg-muted rounded-md">
                            <h4 className="text-sm font-medium mb-1">Ruling:</h4>
                            <p className="text-sm text-muted-foreground">{dispute.ruling}</p>
                          </div>
                        )}

                        {dispute.status === 'pending' && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            <ButtonCustom 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateDisputeStatus(dispute.id, 'in_review')}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Review
                            </ButtonCustom>
                            <ButtonCustom 
                              size="sm"
                              variant="destructive"
                              onClick={() => updateDisputeStatus(dispute.id, 'dismissed', 'Dismissed due to insufficient evidence or relevance.')}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Dismiss
                            </ButtonCustom>
                          </div>
                        )}

                        {dispute.status === 'in_review' && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            <ButtonCustom 
                              size="sm"
                              variant="default"
                              onClick={() => updateDisputeStatus(dispute.id, 'resolved', 'Resolved in favor of complainant.')}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Resolve
                            </ButtonCustom>
                            <ButtonCustom 
                              size="sm"
                              variant="destructive"
                              onClick={() => updateDisputeStatus(dispute.id, 'rejected', 'Rejected due to lack of merit.')}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </ButtonCustom>
                          </div>
                        )}
                      </CardContent>
                    </CardCustom>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-medium">No Disputes Found</h3>
                  <p className="text-muted-foreground mt-2">
                    There are no {tab !== 'all' ? tab : ''} disputes at this time
                  </p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Layout>
  );
};

export default JusticeAdmin;
