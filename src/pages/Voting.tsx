
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CardCustom, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card-custom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Vote, Award, Clock, CheckCircle2, XCircle, AlertCircle, User, FileText } from "lucide-react";

const Voting = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeElections, setActiveElections] = useState<any[]>([]);
  const [pastElections, setPastElections] = useState<any[]>([]);
  const [userVotes, setUserVotes] = useState<{[key: string]: string}>({});
  const [selectedElection, setSelectedElection] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [candidateDialogOpen, setCandidateDialogOpen] = useState(false);
  const [candidateForm, setCandidateForm] = useState({
    manifesto: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchElections = async () => {
      setLoading(true);
      try {
        const now = new Date().toISOString();
        
        // Fetch active elections
        const { data: activeData, error: activeError } = await supabase
          .from("elections")
          .select("*")
          .lt("start_date", now)
          .gt("end_date", now)
          .order("end_date", { ascending: true });

        if (activeError) throw activeError;

        // Fetch past elections
        const { data: pastData, error: pastError } = await supabase
          .from("elections")
          .select("*")
          .lt("end_date", now)
          .order("end_date", { ascending: false })
          .limit(5);

        if (pastError) throw pastError;

        // Fetch user votes
        const { data: votesData, error: votesError } = await supabase
          .from("votes")
          .select("election_id, candidate_id")
          .eq("voter_id", user.id);

        if (votesError) throw votesError;

        // Convert votes to a map for easier lookup
        const votesMap: {[key: string]: string} = {};
        votesData.forEach(vote => {
          votesMap[vote.election_id] = vote.candidate_id;
        });

        setActiveElections(activeData || []);
        setPastElections(pastData || []);
        setUserVotes(votesMap);

        if (activeData && activeData.length > 0) {
          setSelectedElection(activeData[0]);
          fetchCandidates(activeData[0].id);
        }
      } catch (error) {
        console.error("Error fetching elections:", error);
        toast.error("Failed to load elections");
      } finally {
        setLoading(false);
      }
    };

    fetchElections();
  }, [user, navigate]);

  const fetchCandidates = async (electionId: string) => {
    try {
      const { data, error } = await supabase
        .from("candidates")
        .select(`
          id, 
          manifesto,
          user_id,
          profiles(first_name, last_name)
        `)
        .eq("election_id", electionId);

      if (error) throw error;

      // Format candidate data
      const formattedCandidates = data.map(candidate => ({
        id: candidate.id,
        user_id: candidate.user_id,
        manifesto: candidate.manifesto,
        name: `${candidate.profiles?.first_name || ""} ${candidate.profiles?.last_name || ""}`.trim() || "Candidate",
      }));

      setCandidates(formattedCandidates);
    } catch (error) {
      console.error("Error fetching candidates:", error);
      toast.error("Failed to load candidates");
    }
  };

  const handleElectionSelect = (election: any) => {
    setSelectedElection(election);
    fetchCandidates(election.id);
  };

  const handleVote = async (candidateId: string) => {
    if (!user || !selectedElection) return;

    try {
      // Check if user has already voted in this election
      if (userVotes[selectedElection.id]) {
        // Update existing vote
        const { error } = await supabase
          .from("votes")
          .update({ candidate_id: candidateId })
          .eq("voter_id", user.id)
          .eq("election_id", selectedElection.id);

        if (error) throw error;
      } else {
        // Create new vote
        const { error } = await supabase
          .from("votes")
          .insert({
            voter_id: user.id,
            election_id: selectedElection.id,
            candidate_id: candidateId
          });

        if (error) throw error;
      }

      // Update local state
      setUserVotes({
        ...userVotes,
        [selectedElection.id]: candidateId
      });

      toast.success("Your vote has been recorded");
    } catch (error) {
      console.error("Error submitting vote:", error);
      toast.error("Failed to submit your vote");
    }
  };

  const handleCandidateSubmit = async () => {
    if (!user || !selectedElection) return;

    try {
      // Check if user is already a candidate
      const { data: existingCandidate, error: checkError } = await supabase
        .from("candidates")
        .select("id")
        .eq("user_id", user.id)
        .eq("election_id", selectedElection.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingCandidate) {
        toast.error("You are already a candidate in this election");
        return;
      }

      // Create new candidate
      const { error } = await supabase
        .from("candidates")
        .insert({
          user_id: user.id,
          election_id: selectedElection.id,
          manifesto: candidateForm.manifesto
        });

      if (error) throw error;

      // Refresh candidates
      fetchCandidates(selectedElection.id);
      setCandidateDialogOpen(false);
      setCandidateForm({ manifesto: "" });

      toast.success("You are now a candidate in this election");
    } catch (error) {
      console.error("Error submitting candidacy:", error);
      toast.error("Failed to register as a candidate");
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Check if user is eligible to become a candidate (example logic)
  const canBeCandidate = () => {
    if (!user || !selectedElection) return false;
    
    // Check if user is already a candidate
    const isAlreadyCandidate = candidates.some(c => c.user_id === user.id);
    
    // Check if registration period is still open (example: can register until halfway through election)
    const now = new Date();
    const startDate = new Date(selectedElection.start_date);
    const endDate = new Date(selectedElection.end_date);
    const halfwayPoint = new Date((startDate.getTime() + endDate.getTime()) / 2);
    
    return !isAlreadyCandidate && now < halfwayPoint;
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold">Community Voting</h1>
          <p className="text-muted-foreground">
            Participate in elections and shape the future of our digital society
          </p>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="active">Active Elections</TabsTrigger>
            <TabsTrigger value="past">Past Elections</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : activeElections.length === 0 ? (
              <CardCustom>
                <CardContent className="text-center py-12">
                  <Vote className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">No active elections</p>
                  <p className="text-muted-foreground">
                    Check back later for upcoming elections
                  </p>
                </CardContent>
              </CardCustom>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium mb-2">Election List</h3>
                  {activeElections.map((election) => (
                    <CardCustom
                      key={election.id}
                      className={`cursor-pointer transition-colors ${
                        selectedElection?.id === election.id
                          ? "border-primary"
                          : ""
                      }`}
                      onClick={() => handleElectionSelect(election)}
                    >
                      <CardContent className="p-4">
                        <h4 className="font-medium">{election.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Ends: {formatDate(election.end_date)}
                        </p>
                        {userVotes[election.id] && (
                          <div className="mt-2 flex items-center text-xs text-green-600">
                            <CheckCircle2 size={12} className="mr-1" />
                            You have voted
                          </div>
                        )}
                      </CardContent>
                    </CardCustom>
                  ))}
                </div>

                <div className="md:col-span-2">
                  {selectedElection && (
                    <CardCustom>
                      <CardHeader>
                        <CardTitle>{selectedElection.title}</CardTitle>
                        <CardDescription>
                          {selectedElection.description}
                        </CardDescription>
                        <div className="flex items-center space-x-4 text-sm mt-2">
                          <div className="flex items-center text-muted-foreground">
                            <Award size={16} className="mr-1" />
                            <span>Position: {selectedElection.position_type}</span>
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <Clock size={16} className="mr-1" />
                            <span>Ends: {formatDate(selectedElection.end_date)}</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {canBeCandidate() && (
                            <Alert className="mb-4">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Candidate Registration Open</AlertTitle>
                              <AlertDescription>
                                You can register as a candidate for this election.
                              </AlertDescription>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => setCandidateDialogOpen(true)}
                              >
                                Apply as Candidate
                              </Button>
                            </Alert>
                          )}

                          <h3 className="text-lg font-medium">Candidates</h3>
                          
                          {candidates.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <User className="mx-auto h-12 w-12 mb-2" />
                              <p>No candidates have registered yet</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-4">
                              {candidates.map((candidate) => (
                                <CardCustom key={candidate.id} variant="outline">
                                  <CardContent className="p-4">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h4 className="font-medium">{candidate.name}</h4>
                                        <p className="text-sm text-muted-foreground mt-1">
                                          {candidate.manifesto || "No manifesto provided"}
                                        </p>
                                      </div>
                                      <Button
                                        variant={
                                          userVotes[selectedElection.id] === candidate.id
                                            ? "default"
                                            : "outline"
                                        }
                                        size="sm"
                                        onClick={() => handleVote(candidate.id)}
                                        disabled={
                                          userVotes[selectedElection.id] === candidate.id
                                        }
                                      >
                                        {userVotes[selectedElection.id] === candidate.id
                                          ? "Voted"
                                          : "Vote"}
                                      </Button>
                                    </div>
                                  </CardContent>
                                </CardCustom>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </CardCustom>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pastElections.length === 0 ? (
              <CardCustom>
                <CardContent className="text-center py-12">
                  <Clock className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">No past elections</p>
                  <p className="text-muted-foreground">
                    Election results will appear here after they conclude
                  </p>
                </CardContent>
              </CardCustom>
            ) : (
              <div className="space-y-6">
                {pastElections.map((election) => (
                  <CardCustom key={election.id}>
                    <CardHeader>
                      <CardTitle>{election.title}</CardTitle>
                      <CardDescription>
                        {election.description}
                      </CardDescription>
                      <div className="flex items-center space-x-4 text-sm mt-2">
                        <div className="flex items-center text-muted-foreground">
                          <Award size={16} className="mr-1" />
                          <span>Position: {election.position_type}</span>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <Clock size={16} className="mr-1" />
                          <span>Ended: {formatDate(election.end_date)}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <p className="text-muted-foreground">
                          Results are available to view
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedElection(election);
                            fetchCandidates(election.id);
                          }}
                        >
                          View Results
                        </Button>
                      </div>
                    </CardContent>
                  </CardCustom>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Candidate Registration Dialog */}
        <Dialog open={candidateDialogOpen} onOpenChange={setCandidateDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Apply as Candidate</DialogTitle>
              <DialogDescription>
                Enter your manifesto to register as a candidate for this election.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="manifesto">Manifesto</Label>
                <Textarea
                  id="manifesto"
                  placeholder="Describe why you should be elected and what you plan to accomplish..."
                  rows={5}
                  value={candidateForm.manifesto}
                  onChange={(e) =>
                    setCandidateForm({ ...candidateForm, manifesto: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCandidateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCandidateSubmit}>Submit Application</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Voting;
