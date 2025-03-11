
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { CardCustom, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card-custom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Scale, AlertTriangle, CheckCircle, XCircle, Clock, 
  FileText, User, Users, Shield
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Dispute {
  id: string;
  complainant_id: string;
  respondent_id: string | null;
  description: string;
  evidence: string | null;
  status: "pending" | "in_review" | "resolved" | "dismissed";
  ruling: string | null;
  ruled_by: string | null;
  created_at: string;
  updated_at: string;
  complainant_name?: string;
  respondent_name?: string;
}

const Justice = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [isRulingDialogOpen, setIsRulingDialogOpen] = useState(false);
  const [ruling, setRuling] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");

  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please login to access the justice panel",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (user && user.role !== 'justice') {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access the justice panel",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    const fetchDisputes = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('disputes')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch user names for disputes
        const disputesWithNames = await Promise.all(
          (data || []).map(async (dispute) => {
            let complainantName = 'Unknown';
            let respondentName = 'Unknown';

            if (dispute.complainant_id) {
              const { data: complainantData } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', dispute.complainant_id)
                .single();
                
              if (complainantData) {
                complainantName = `${complainantData.first_name || ''} ${complainantData.last_name || ''}`.trim() || 'Unknown';
              }
            }

            if (dispute.respondent_id) {
              const { data: respondentData } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', dispute.respondent_id)
                .single();
                
              if (respondentData) {
                respondentName = `${respondentData.first_name || ''} ${respondentData.last_name || ''}`.trim() || 'Unknown';
              }
            }

            return {
              ...dispute,
              complainant_name: complainantName,
              respondent_name: respondentName
            };
          })
        );

        setDisputes(disputesWithNames);
      } catch (error: any) {
        console.error("Error fetching disputes:", error);
        toast({
          title: "Error",
          description: "Failed to load disputes",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDisputes();
  }, [isAuthenticated, navigate, toast, user]);

  const handleUpdateDisputeStatus = async (disputeId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('disputes')
        .update({ status: newStatus })
        .eq('id', disputeId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: "The dispute status has been updated",
      });

      setDisputes(prev => prev.map(dispute => 
        dispute.id === disputeId ? { ...dispute, status: newStatus } : dispute
      ));
    } catch (error: any) {
      console.error("Error updating dispute status:", error);
      toast({
        title: "Error",
        description: "Failed to update dispute status",
        variant: "destructive",
      });
    }
  };

  const handleMakeRuling = async () => {
    if (!selectedDispute || !user) return;
    
    try {
      const { error } = await supabase
        .from('disputes')
        .update({
          ruling,
          status: 'resolved',
          ruled_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedDispute.id);

      if (error) throw error;

      toast({
        title: "Ruling Made",
        description: "Your ruling has been recorded",
      });

      setDisputes(prev => prev.map(dispute => 
        dispute.id === selectedDispute.id 
          ? { ...dispute, ruling, status: 'resolved', ruled_by: user.id } 
          : dispute
      ));

      setIsRulingDialogOpen(false);
      setRuling("");
      setSelectedDispute(null);
    } catch (error: any) {
      console.error("Error making ruling:", error);
      toast({
        title: "Error",
        description: "Failed to record your ruling",
        variant: "destructive",
      });
    }
  };

  const filteredDisputes = disputes.filter(dispute => {
    if (activeTab === "pending") {
      return dispute.status === "pending" || dispute.status === "in_review";
    } else if (activeTab === "resolved") {
      return dispute.status === "resolved" || dispute.status === "dismissed";
    }
    return true;
  });

  return (
    <Layout>
      <div className="container px-4 pt-8 pb-16">
        <div className="flex items-center gap-3 mb-6">
          <Scale className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Justice Dashboard</h1>
        </div>

        <p className="text-muted-foreground mb-8 max-w-3xl">
          As a Justice of the Moval Society, you're responsible for reviewing and ruling on disputes between members.
          Your decisions help maintain order and fairness in our community.
        </p>

        <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="glass-effect mb-6">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock size={16} />
              <span>Pending Disputes</span>
            </TabsTrigger>
            <TabsTrigger value="resolved" className="flex items-center gap-2">
              <CheckCircle size={16} />
              <span>Resolved Disputes</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="mt-0">
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
                      </div>
                    </CardContent>
                  </CardCustom>
                ))}
              </div>
            ) : filteredDisputes.length > 0 ? (
              <div className="space-y-6">
                {filteredDisputes.map((dispute) => (
                  <CardCustom key={dispute.id} className="glass-card overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <CardTitle className="text-lg">
                          Dispute #{dispute.id.slice(0, 8)}
                        </CardTitle>
                        <div className={cn(
                          "px-3 py-1 text-xs rounded-full flex items-center gap-1",
                          dispute.status === 'pending' ? "bg-yellow-500/20 text-yellow-300" :
                          dispute.status === 'in_review' ? "bg-blue-500/20 text-blue-300" :
                          dispute.status === 'resolved' ? "bg-green-500/20 text-green-300" :
                          "bg-red-500/20 text-red-300"
                        )}>
                          {dispute.status === 'pending' && <Clock size={12} />}
                          {dispute.status === 'in_review' && <FileText size={12} />}
                          {dispute.status === 'resolved' && <CheckCircle size={12} />}
                          {dispute.status === 'dismissed' && <XCircle size={12} />}
                          <span>{dispute.status.replace('_', ' ').toUpperCase()}</span>
                        </div>
                      </div>
                      <CardDescription>
                        Filed {formatDistanceToNow(new Date(dispute.created_at), { addSuffix: true })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex gap-6 text-sm">
                          <div className="flex-1">
                            <div className="text-muted-foreground mb-1">Complainant</div>
                            <div className="font-medium flex items-center gap-2">
                              <User size={14} />
                              {dispute.complainant_name}
                            </div>
                          </div>
                          
                          {dispute.respondent_id && (
                            <div className="flex-1">
                              <div className="text-muted-foreground mb-1">Respondent</div>
                              <div className="font-medium flex items-center gap-2">
                                <User size={14} />
                                {dispute.respondent_name}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="pt-2 border-t border-white/10">
                          <h4 className="text-sm font-medium mb-1">Description</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-line">
                            {dispute.description}
                          </p>
                        </div>
                        
                        {dispute.evidence && (
                          <div className="pt-2 border-t border-white/10">
                            <h4 className="text-sm font-medium mb-1">Evidence</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-line">
                              {dispute.evidence}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    
                    <CardFooter className="border-t border-white/10 pt-4 flex-wrap gap-2">
                      {dispute.status === 'pending' && (
                        <Button 
                          className="flex-1 glass-button"
                          onClick={() => handleUpdateDisputeStatus(dispute.id, 'in_review')}
                        >
                          Start Review
                        </Button>
                      )}
                      
                      {dispute.status === 'in_review' && (
                        <>
                          <Dialog open={isRulingDialogOpen && selectedDispute?.id === dispute.id} 
                            onOpenChange={(open) => {
                              setIsRulingDialogOpen(open);
                              if (!open) setSelectedDispute(null);
                            }}>
                            <DialogTrigger asChild>
                              <Button 
                                className="flex-1 glass-button"
                                onClick={() => setSelectedDispute(dispute)}
                              >
                                Make Ruling
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="glass-card max-w-md">
                              <DialogHeader>
                                <DialogTitle>Make Ruling on Dispute</DialogTitle>
                                <DialogDescription>
                                  Your ruling will be recorded and shared with all parties involved
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="ruling">Your Ruling</Label>
                                  <Textarea
                                    id="ruling"
                                    placeholder="Enter your official ruling on this case..."
                                    rows={6}
                                    value={ruling}
                                    onChange={(e) => setRuling(e.target.value)}
                                  />
                                </div>
                              </div>
                              
                              <DialogFooter>
                                <Button variant="outline" onClick={() => {
                                  setIsRulingDialogOpen(false);
                                  setSelectedDispute(null);
                                }}>
                                  Cancel
                                </Button>
                                <Button onClick={handleMakeRuling}>
                                  Submit Ruling
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          
                          <Button 
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleUpdateDisputeStatus(dispute.id, 'dismissed')}
                          >
                            Dismiss Case
                          </Button>
                        </>
                      )}
                    </CardFooter>
                  </CardCustom>
                ))}
              </div>
            ) : (
              <CardCustom className="glass-card text-center p-12">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">No Pending Disputes</h3>
                <p className="text-muted-foreground">
                  There are currently no disputes that require your attention.
                </p>
              </CardCustom>
            )}
          </TabsContent>
          
          <TabsContent value="resolved" className="mt-0">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <CardCustom key={i} className="glass-card animate-pulse">
                    <CardHeader>
                      <div className="h-6 w-48 bg-primary/20 rounded"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="h-4 w-full bg-primary/20 rounded"></div>
                        <div className="h-4 w-3/4 bg-primary/20 rounded"></div>
                      </div>
                    </CardContent>
                  </CardCustom>
                ))}
              </div>
            ) : filteredDisputes.length > 0 ? (
              <div className="space-y-6">
                {filteredDisputes.map((dispute) => (
                  <CardCustom key={dispute.id} className="glass-card overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <CardTitle className="text-lg">
                          Dispute #{dispute.id.slice(0, 8)}
                        </CardTitle>
                        <div className={cn(
                          "px-3 py-1 text-xs rounded-full flex items-center gap-1",
                          dispute.status === 'resolved' ? "bg-green-500/20 text-green-300" :
                          "bg-red-500/20 text-red-300"
                        )}>
                          {dispute.status === 'resolved' && <CheckCircle size={12} />}
                          {dispute.status === 'dismissed' && <XCircle size={12} />}
                          <span>{dispute.status.replace('_', ' ').toUpperCase()}</span>
                        </div>
                      </div>
                      <CardDescription>
                        Filed {format(new Date(dispute.created_at), "MMMM d, yyyy")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex gap-6 text-sm">
                          <div className="flex-1">
                            <div className="text-muted-foreground mb-1">Complainant</div>
                            <div className="font-medium flex items-center gap-2">
                              <User size={14} />
                              {dispute.complainant_name}
                            </div>
                          </div>
                          
                          {dispute.respondent_id && (
                            <div className="flex-1">
                              <div className="text-muted-foreground mb-1">Respondent</div>
                              <div className="font-medium flex items-center gap-2">
                                <User size={14} />
                                {dispute.respondent_name}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="pt-2 border-t border-white/10">
                          <h4 className="text-sm font-medium mb-1">Description</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-line">
                            {dispute.description}
                          </p>
                        </div>
                        
                        {dispute.ruling && dispute.status === 'resolved' && (
                          <div className="pt-2 border-t border-white/10">
                            <h4 className="text-sm font-medium mb-1">Your Ruling</h4>
                            <p className="text-sm whitespace-pre-line">
                              {dispute.ruling}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </CardCustom>
                ))}
              </div>
            ) : (
              <CardCustom className="glass-card text-center p-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">No Resolved Disputes</h3>
                <p className="text-muted-foreground">
                  There are no resolved or dismissed disputes in the system.
                </p>
              </CardCustom>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Justice;
