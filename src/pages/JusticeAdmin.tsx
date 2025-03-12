
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { CardCustom, CardContent, CardHeader, CardTitle } from "@/components/ui/card-custom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/layout/Layout";
import { Scale, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { getAnimationClass } from "@/lib/animations";

interface Dispute {
  id: string;
  complainant_id: string;
  respondent_id: string | null;
  description: string;
  evidence: string | null;
  status: string;
  created_at: string;
  complainant_name: string;
  respondent_name: string | null;
}

const JusticeAdmin = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        toast({
          title: "Unauthorized",
          description: "Please log in to access this page",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const hasJusticeRole = await hasRole("justice_department");
      if (!hasJusticeRole) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the Justice Administration",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      fetchDisputes();
    };

    checkAccess();
  }, [user, navigate, hasRole, activeTab]);

  const fetchDisputes = async () => {
    try {
      setIsLoading(true);
      
      // Fetch disputes
      const { data: disputesData, error: disputesError } = await supabase
        .from("disputes")
        .select("*")
        .order("created_at", { ascending: false });

      if (disputesError) throw disputesError;

      // Fetch all user profiles to get names
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name");

      if (profilesError) throw profilesError;

      // Create a map of user IDs to names
      const userMap = new Map();
      profiles.forEach((profile) => {
        userMap.set(profile.id, `${profile.first_name} ${profile.last_name}`);
      });

      // Enhance disputes with user names
      const enhancedDisputes = disputesData.map((dispute) => ({
        ...dispute,
        complainant_name: userMap.get(dispute.complainant_id) || "Unknown",
        respondent_name: dispute.respondent_id ? userMap.get(dispute.respondent_id) || "Unknown" : null,
      }));

      setDisputes(enhancedDisputes);
    } catch (error) {
      console.error("Error fetching disputes:", error);
      toast({
        title: "Error",
        description: "Failed to load disputes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRulingSubmission = async (disputeId: string, ruling: string, status: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("disputes")
        .update({
          ruling: ruling,
          status: status,
          ruled_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", disputeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Dispute ${status === "resolved" ? "resolved" : "rejected"} successfully.`,
      });

      // Refresh disputes
      fetchDisputes();
    } catch (error) {
      console.error("Error updating dispute:", error);
      toast({
        title: "Error",
        description: "Failed to update dispute. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="text-yellow-500" />;
      case "resolved":
        return <CheckCircle2 className="text-green-500" />;
      case "rejected":
        return <AlertTriangle className="text-red-500" />;
      default:
        return <Clock className="text-muted-foreground" />;
    }
  };

  const getFilteredDisputes = () => {
    return disputes.filter((dispute) => dispute.status === activeTab);
  };

  return (
    <Layout>
      <div className="container px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Justice Department Administration</h1>
          </div>
          <p className="text-muted-foreground">
            Manage and resolve community disputes
          </p>
        </div>

        <Tabs defaultValue="pending" onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="pending" className="relative">
              Pending 
              {disputes.filter(d => d.status === "pending").length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {disputes.filter(d => d.status === "pending").length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="grid grid-cols-1 gap-6">
                {[1, 2, 3].map((i) => (
                  <CardCustom key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-8 bg-primary/10 rounded-md w-3/4"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-24 bg-primary/5 rounded-md"></div>
                    </CardContent>
                  </CardCustom>
                ))}
              </div>
            ) : getFilteredDisputes().length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {getFilteredDisputes().map((dispute, index) => (
                  <CardCustom key={dispute.id} className={`glass-card ${getAnimationClass("fade", index % 5)}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          {getStatusIcon(dispute.status)}
                          <span>Dispute #{dispute.id.slice(0, 8)}</span>
                        </CardTitle>
                        <span className="text-sm text-muted-foreground">
                          {new Date(dispute.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Complainant</p>
                          <p>{dispute.complainant_name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Respondent</p>
                          <p>{dispute.respondent_name || "Not specified"}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                        <p className="text-sm">{dispute.description}</p>
                      </div>
                      {dispute.evidence && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Evidence</p>
                          <p className="text-sm">{dispute.evidence}</p>
                        </div>
                      )}
                      
                      {/* Actions for pending disputes */}
                      {dispute.status === "pending" && (
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                          <Button 
                            variant="default" 
                            className="flex-1"
                            onClick={() => handleRulingSubmission(
                              dispute.id, 
                              "The justice department has reviewed this case and found in favor of the complainant.",
                              "resolved"
                            )}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Resolve
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleRulingSubmission(
                              dispute.id,
                              "The justice department has reviewed this case and found insufficient evidence to proceed.",
                              "rejected"
                            )}
                          >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}
                      
                      {/* Show ruling for resolved or rejected disputes */}
                      {(dispute.status === "resolved" || dispute.status === "rejected") && dispute.ruling && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Ruling</p>
                          <p className="text-sm">{dispute.ruling}</p>
                        </div>
                      )}
                    </CardContent>
                  </CardCustom>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Scale className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-medium">No {activeTab} disputes</h3>
                <p className="text-muted-foreground text-center max-w-md mt-2">
                  {activeTab === "pending" 
                    ? "There are no pending disputes waiting for resolution at this time."
                    : activeTab === "resolved"
                    ? "No disputes have been resolved yet."
                    : "No disputes have been rejected yet."}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default JusticeAdmin;
