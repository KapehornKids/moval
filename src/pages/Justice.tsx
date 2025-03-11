import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/layout/Layout';
import { CardCustom, CardContent, CardHeader, CardTitle } from '@/components/ui/card-custom';
import { ButtonCustom } from '@/components/ui/button-custom';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getAnimationClass } from '@/lib/animations';
import { Filter, Search, AlertCircle, User, CheckCircle, XCircle, Clock, ShieldAlert } from 'lucide-react';

// TypeScript interface for dispute status
type DisputeStatus = 'pending' | 'in_review' | 'resolved' | 'dismissed';

// Interface for dispute
interface Dispute {
  id: string;
  complainant_id: string;
  respondent_id: string | null;
  description: string;
  evidence: string | null;
  ruling: string | null;
  ruled_by: string | null;
  status: DisputeStatus;
  created_at: string;
  updated_at: string;
  complainant_name?: string;
  respondent_name?: string;
}

const Justice = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | 'all'>('all');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [ruling, setRuling] = useState('');
  
  const { user, isAuthenticated, hasRole } = useAuth();
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchDisputes();
    }
  }, [isAuthenticated, statusFilter, searchQuery]);
  
  const fetchDisputes = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all disputes
      const { data: disputesData, error } = await supabase
        .from('disputes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch user names for each dispute
      const disputesWithNames = await Promise.all(
        disputesData.map(async (dispute) => {
          let complainantName = 'Unknown';
          let respondentName = 'Unknown';
          
          // Get complainant name
          if (dispute.complainant_id) {
            const { data: complainantData } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', dispute.complainant_id)
              .single();
              
            if (complainantData) {
              complainantName = `${complainantData.first_name || ''} ${complainantData.last_name || ''}`.trim();
            }
          }
          
          // Get respondent name if exists
          if (dispute.respondent_id) {
            const { data: respondentData } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', dispute.respondent_id)
              .single();
              
            if (respondentData) {
              respondentName = `${respondentData.first_name || ''} ${respondentData.last_name || ''}`.trim();
            }
          }
          
          return {
            ...dispute,
            complainant_name: complainantName,
            respondent_name: respondentName
          };
        })
      );
      
      // Apply filters
      let filteredDisputes = disputesWithNames;
      
      if (statusFilter !== 'all') {
        filteredDisputes = filteredDisputes.filter(d => d.status === statusFilter);
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredDisputes = filteredDisputes.filter(d => 
          d.description.toLowerCase().includes(query) ||
          d.complainant_name?.toLowerCase().includes(query) ||
          d.respondent_name?.toLowerCase().includes(query)
        );
      }
      
      setDisputes(filteredDisputes);
    } catch (error) {
      console.error('Error fetching disputes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load disputes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResolve = async () => {
    if (!selectedDispute || !ruling.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a ruling before resolving the dispute.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('disputes')
        .update({
          ruling,
          ruled_by: user?.id,
          status: 'resolved',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedDispute.id);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Dispute has been resolved successfully.',
        variant: 'default',
      });
      
      setSelectedDispute(null);
      setRuling('');
      fetchDisputes();
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast({
        title: 'Error',
        description: 'Failed to resolve dispute. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const handleDismiss = async () => {
    if (!selectedDispute) return;
    
    try {
      const { error } = await supabase
        .from('disputes')
        .update({
          ruling: ruling || 'Dismissed without specific ruling.',
          ruled_by: user?.id,
          status: 'dismissed',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedDispute.id);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Dispute has been dismissed.',
        variant: 'default',
      });
      
      setSelectedDispute(null);
      setRuling('');
      fetchDisputes();
    } catch (error) {
      console.error('Error dismissing dispute:', error);
      toast({
        title: 'Error',
        description: 'Failed to dismiss dispute. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const renderStatusBadge = (status: DisputeStatus) => {
    switch (status) {
      case 'pending':
        return (
          <div className="flex items-center gap-1 text-yellow-500">
            <Clock size={14} />
            <span>Pending</span>
          </div>
        );
      case 'in_review':
        <div className="flex items-center gap-1 text-blue-500">
          <AlertCircle size={14} />
          <span>In Review</span>
        </div>
      case 'resolved':
        return (
          <div className="flex items-center gap-1 text-green-500">
            <CheckCircle size={14} />
            <span>Resolved</span>
          </div>
        );
      case 'dismissed':
        return (
          <div className="flex items-center gap-1 text-red-500">
            <XCircle size={14} />
            <span>Dismissed</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-gray-500">
            <AlertCircle size={14} />
            <span>{status}</span>
          </div>
        );
    }
  };
  
  return (
    <Layout>
      <div className="container px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight animate-fade-in">Justice Department</h1>
          <p className="text-muted-foreground animate-fade-in">
            Review and resolve disputes within the Moval Society
          </p>
        </div>
        
        {/* Search and Filters */}
        <CardCustom className={`glass-card mb-6 ${getAnimationClass("fade", 1)}`}>
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search disputes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 glass-effect"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as DisputeStatus | 'all')}
                  className="glass-effect rounded-md px-3 py-2 text-sm border border-white/10 bg-white/5"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_review">In Review</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
                <ButtonCustom variant="outline" className="md:w-auto">
                  <Filter size={16} className="mr-2" />
                  Filters
                </ButtonCustom>
              </div>
            </div>
          </CardContent>
        </CardCustom>
        
        {/* Disputes List */}
        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <CardCustom key={i} className="animate-pulse">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-32 bg-white/10 rounded"></div>
                    <div className="h-6 w-24 bg-white/10 rounded"></div>
                  </div>
                  <div className="mt-4 h-8 w-full bg-white/10 rounded"></div>
                  <div className="mt-2 h-4 w-1/2 bg-white/10 rounded"></div>
                </CardContent>
              </CardCustom>
            ))
          ) : disputes.length > 0 ? (
            disputes.map((dispute) => (
              <CardCustom 
                key={dispute.id} 
                className={`glass-card hover:bg-white/5 transition-colors cursor-pointer ${getAnimationClass("fade", 2)}`}
                onClick={() => setSelectedDispute(dispute)}
              >
                <CardContent className="py-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <ShieldAlert size={18} className="text-primary" />
                        <h3 className="font-medium">Dispute #{dispute.id.substring(0, 8)}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Filed on {new Date(dispute.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {renderStatusBadge(dispute.status)}
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm line-clamp-2">{dispute.description}</p>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Complainant</p>
                      <p className="text-sm font-medium">{dispute.complainant_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Respondent</p>
                      <p className="text-sm font-medium">{dispute.respondent_name || 'Not specified'}</p>
                    </div>
                  </div>
                </CardContent>
              </CardCustom>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                <ShieldAlert size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium">No Disputes Found</h3>
              <p className="text-muted-foreground mt-2">
                {searchQuery || statusFilter !== 'all' 
                  ? 'No disputes match your search criteria' 
                  : 'There are no disputes to review at this time'}
              </p>
            </div>
          )}
        </div>
        
        {/* Selected Dispute Modal */}
        {selectedDispute && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <CardCustom className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Dispute Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={18} className="text-primary" />
                    <h3 className="font-medium">Dispute #{selectedDispute.id.substring(0, 8)}</h3>
                  </div>
                  {renderStatusBadge(selectedDispute.status)}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Filed On</Label>
                    <p className="text-sm">{new Date(selectedDispute.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Last Updated</Label>
                    <p className="text-sm">{new Date(selectedDispute.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <div className="p-3 rounded-md bg-white/5 text-sm">
                    {selectedDispute.description}
                  </div>
                </div>
                
                {selectedDispute.evidence && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Evidence</Label>
                    <div className="p-3 rounded-md bg-white/5 text-sm">
                      {selectedDispute.evidence}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Complainant</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <User size={14} className="text-primary" />
                      </div>
                      <p className="text-sm">{selectedDispute.complainant_name}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Respondent</Label>
                    {selectedDispute.respondent_name ? (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <User size={14} className="text-primary" />
                        </div>
                        <p className="text-sm">{selectedDispute.respondent_name}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">Not specified</p>
                    )}
                  </div>
                </div>
                
                {selectedDispute.ruling && (
                  <div className="space-y-2 pt-2">
                    <Label className="text-xs text-muted-foreground">Ruling</Label>
                    <div className="p-3 rounded-md bg-white/5 text-sm">
                      {selectedDispute.ruling}
                    </div>
                  </div>
                )}
                
                {/* Justice Department Actions */}
                {hasRole('justice_department') && selectedDispute.status === 'pending' && (
                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <Label htmlFor="ruling">Your Ruling</Label>
                    <Textarea 
                      id="ruling"
                      placeholder="Enter your ruling on this dispute..."
                      value={ruling}
                      onChange={(e) => setRuling(e.target.value)}
                      className="min-h-[100px]"
                    />
                    
                    <div className="flex justify-end gap-2">
                      <ButtonCustom variant="outline" onClick={() => setSelectedDispute(null)}>
                        Cancel
                      </ButtonCustom>
                      <ButtonCustom variant="destructive" onClick={handleDismiss}>
                        Dismiss Dispute
                      </ButtonCustom>
                      <ButtonCustom onClick={handleResolve}>
                        Resolve Dispute
                      </ButtonCustom>
                    </div>
                  </div>
                )}
                
                {/* Non-Justice Department View */}
                {(!hasRole('justice_department') || selectedDispute.status !== 'pending') && (
                  <div className="flex justify-end pt-4 border-t border-white/10">
                    <ButtonCustom variant="outline" onClick={() => setSelectedDispute(null)}>
                      Close
                    </ButtonCustom>
                  </div>
                )}
              </CardContent>
            </CardCustom>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Justice;
