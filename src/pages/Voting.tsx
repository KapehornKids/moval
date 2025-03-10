
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VoteIcon, UserCheck, Calendar } from "lucide-react";

// Define the election type
type Election = {
  id: string;
  title: string;
  description: string;
  position_type: string;
  start_date: string;
  end_date: string;
  status: string;
};

// Define the candidate type
type Candidate = {
  id: string;
  user_id: string;
  election_id: string;
  manifesto: string;
  userName: string;
};

// Form schema for candidate registration
const candidateFormSchema = z.object({
  manifesto: z.string().min(10, "Manifesto must be at least 10 characters long"),
});

const Voting = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("active");
  const [activeElections, setActiveElections] = useState<Election[]>([]);
  const [pastElections, setPastElections] = useState<Election[]>([]);
  const [candidates, setCandidates] = useState<{ [key: string]: Candidate[] }>({});
  const [userVotes, setUserVotes] = useState<{ [key: string]: string }>({});
  const [loadingElections, setLoadingElections] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [loadingVotes, setLoadingVotes] = useState(true);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [registeringForElection, setRegisteringForElection] = useState<string | null>(null);
  const [votingInProgress, setVotingInProgress] = useState(false);
  const [registeringInProgress, setRegisteringInProgress] = useState(false);

  const form = useForm<z.infer<typeof candidateFormSchema>>({
    resolver: zodResolver(candidateFormSchema),
    defaultValues: {
      manifesto: "",
    },
  });

  useEffect(() => {
    if (user) {
      fetchElections();
      fetchUserVotes();
    } else {
      navigate("/login");
    }
  }, [user, navigate]);

  const fetchElections = async () => {
    try {
      setLoadingElections(true);
      
      const today = new Date().toISOString();
      
      // Fetch active elections
      const { data: activeData, error: activeError } = await supabase
        .from('elections')
        .select('*')
        .lte('start_date', today)
        .gte('end_date', today)
        .eq('status', 'active');
      
      if (activeError) throw activeError;
      
      // Fetch past elections
      const { data: pastData, error: pastError } = await supabase
        .from('elections')
        .select('*')
        .lt('end_date', today)
        .order('end_date', { ascending: false });
      
      if (pastError) throw pastError;
      
      setActiveElections(activeData || []);
      setPastElections(pastData || []);
      
      // Fetch candidates for all elections
      const allElections = [...(activeData || []), ...(pastData || [])];
      if (allElections.length > 0) {
        fetchCandidatesForElections(allElections);
      } else {
        setLoadingCandidates(false);
      }
    } catch (error) {
      console.error("Error fetching elections:", error);
      toast.error("Failed to load elections");
      setLoadingElections(false);
      setLoadingCandidates(false);
    }
  };

  const fetchCandidatesForElections = async (elections: Election[]) => {
    try {
      setLoadingCandidates(true);
      
      const candidatesMap: { [key: string]: Candidate[] } = {};
      
      for (const election of elections) {
        // Fetch candidates for this election
        const { data, error } = await supabase
          .from('candidates')
          .select('*')
          .eq('election_id', election.id);
        
        if (error) throw error;
        
        if (data) {
          // Fetch user information for each candidate
          const candidatesWithNames = await Promise.all(
            data.map(async (candidate) => {
              const { data: userData, error: userError } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', candidate.user_id)
                .single();
              
              if (userError) {
                console.error("Error fetching candidate profile:", userError);
                return {
                  ...candidate,
                  userName: "Unknown User",
                };
              }
              
              return {
                ...candidate,
                userName: userData ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'User' : 'Unknown User',
              };
            })
          );
          
          candidatesMap[election.id] = candidatesWithNames;
        }
      }
      
      setCandidates(candidatesMap);
    } catch (error) {
      console.error("Error fetching candidates:", error);
      toast.error("Failed to load candidates");
    } finally {
      setLoadingCandidates(false);
    }
  };

  const fetchUserVotes = async () => {
    if (!user) return;
    
    try {
      setLoadingVotes(true);
      
      // Fetch user votes
      const { data, error } = await supabase
        .from('votes')
        .select('election_id, candidate_id')
        .eq('voter_id', user.id);
      
      if (error) throw error;
      
      const votesMap: { [key: string]: string } = {};
      if (data) {
        data.forEach((vote) => {
          votesMap[vote.election_id] = vote.candidate_id;
        });
      }
      
      setUserVotes(votesMap);
    } catch (error) {
      console.error("Error fetching user votes:", error);
      toast.error("Failed to load your votes");
    } finally {
      setLoadingVotes(false);
    }
  };

  const voteForCandidate = async (electionId: string, candidateId: string) => {
    if (!user) return;
    
    try {
      setVotingInProgress(true);
      
      // Check if user has already voted in this election
      if (userVotes[electionId]) {
        toast.error("You have already voted in this election");
        return;
      }
      
      // Create the vote
      const { error } = await supabase
        .from('votes')
        .insert({
          voter_id: user.id,
          election_id: electionId,
          candidate_id: candidateId,
        });
      
      if (error) throw error;
      
      // Update local state
      setUserVotes({
        ...userVotes,
        [electionId]: candidateId,
      });
      
      toast.success("Your vote has been recorded");
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Failed to record your vote");
    } finally {
      setVotingInProgress(false);
    }
  };

  const onRegisterCandidate = async (values: z.infer<typeof candidateFormSchema>) => {
    if (!user || !registeringForElection) return;
    
    try {
      setRegisteringInProgress(true);
      
      // Check if user is already a candidate for this election
      const { data: existingCandidate, error: checkError } = await supabase
        .from('candidates')
        .select('id')
        .eq('election_id', registeringForElection)
        .eq('user_id', user.id);
      
      if (checkError) throw checkError;
      
      if (existingCandidate && existingCandidate.length > 0) {
        toast.error("You are already registered as a candidate for this election");
        return;
      }
      
      // Create the candidate entry
      const { error } = await supabase
        .from('candidates')
        .insert({
          user_id: user.id,
          election_id: registeringForElection,
          manifesto: values.manifesto,
        });
      
      if (error) throw error;
      
      // Update local state
      const election = [...activeElections, ...pastElections].find(e => e.id === registeringForElection);
      if (election) {
        const newCandidate: Candidate = {
          id: Date.now().toString(), // Temporary ID until we refresh
          user_id: user.id,
          election_id: registeringForElection,
          manifesto: values.manifesto,
          userName: user.name,
        };
        
        setCandidates({
          ...candidates,
          [registeringForElection]: [
            ...(candidates[registeringForElection] || []),
            newCandidate,
          ],
        });
      }
      
      toast.success("You have successfully registered as a candidate");
      setRegisteringForElection(null);
      form.reset();
    } catch (error) {
      console.error("Error registering as candidate:", error);
      toast.error("Failed to register as a candidate");
    } finally {
      setRegisteringInProgress(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isUserCandidate = (electionId: string) => {
    if (!user) return false;
    
    const electionCandidates = candidates[electionId] || [];
    return electionCandidates.some(candidate => candidate.user_id === user?.id);
  };

  if (loadingElections || loadingCandidates || loadingVotes) {
    return (
      <Layout>
        <div className="container py-8">
          <h1 className="text-2xl font-bold mb-6">Voting System</h1>
          <p>Loading elections and candidates...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <VoteIcon className="mr-2" /> Voting System
        </h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="active">Active Elections</TabsTrigger>
            <TabsTrigger value="past">Past Elections</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            {activeElections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeElections.map((election) => (
                  <Card key={election.id}>
                    <CardHeader>
                      <CardTitle>{election.title}</CardTitle>
                      <CardDescription>
                        {election.position_type} • {formatDate(election.start_date)} to {formatDate(election.end_date)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4">{election.description}</p>
                      
                      {userVotes[election.id] ? (
                        <div className="rounded-md bg-green-50 p-3 mb-4">
                          <p className="text-green-800 font-medium flex items-center">
                            <UserCheck className="mr-2" size={16} />
                            You have voted in this election
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-md bg-yellow-50 p-3 mb-4">
                          <p className="text-yellow-800">You haven't voted in this election yet</p>
                        </div>
                      )}
                      
                      <h3 className="font-semibold text-lg mb-2">Candidates</h3>
                      {(candidates[election.id] || []).length > 0 ? (
                        <div className="space-y-3">
                          {(candidates[election.id] || []).map((candidate) => (
                            <div key={candidate.id} className="p-3 border rounded-md hover:border-primary transition-colors">
                              <p className="font-medium">{candidate.userName}</p>
                              <p className="text-sm text-gray-600 my-1">{candidate.manifesto}</p>
                              
                              {!userVotes[election.id] && (
                                <Button 
                                  onClick={() => voteForCandidate(election.id, candidate.id)}
                                  disabled={votingInProgress}
                                  className="mt-2"
                                  size="sm"
                                >
                                  Vote for this candidate
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No candidates registered yet</p>
                      )}
                    </CardContent>
                    <CardFooter>
                      {!isUserCandidate(election.id) && (
                        <Button
                          onClick={() => setRegisteringForElection(election.id)}
                          variant="outline"
                          className="w-full"
                        >
                          Register as a candidate
                        </Button>
                      )}
                      {isUserCandidate(election.id) && (
                        <p className="text-sm text-gray-600">You are registered as a candidate for this election</p>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium">No active elections</h3>
                <p className="mt-1 text-gray-500">Check back later for upcoming elections.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="past">
            {pastElections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pastElections.map((election) => (
                  <Card key={election.id}>
                    <CardHeader>
                      <CardTitle>{election.title}</CardTitle>
                      <CardDescription>
                        {election.position_type} • Ended on {formatDate(election.end_date)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4">{election.description}</p>
                      
                      {userVotes[election.id] ? (
                        <div className="rounded-md bg-green-50 p-3 mb-4">
                          <p className="text-green-800 font-medium flex items-center">
                            <UserCheck className="mr-2" size={16} />
                            You voted in this election
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-md bg-gray-50 p-3 mb-4">
                          <p className="text-gray-800">You didn't vote in this election</p>
                        </div>
                      )}
                      
                      <h3 className="font-semibold text-lg mb-2">Candidates</h3>
                      {(candidates[election.id] || []).length > 0 ? (
                        <div className="space-y-3">
                          {(candidates[election.id] || []).map((candidate) => (
                            <div 
                              key={candidate.id} 
                              className={`p-3 border rounded-md ${
                                userVotes[election.id] === candidate.id ? 'border-green-500 bg-green-50' : ''
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <p className="font-medium">{candidate.userName}</p>
                                {userVotes[election.id] === candidate.id && (
                                  <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">Your vote</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 my-1">{candidate.manifesto}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No candidates registered for this election</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium">No past elections</h3>
                <p className="mt-1 text-gray-500">Past elections will appear here.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {registeringForElection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Register as a Candidate</CardTitle>
                <CardDescription>
                  Share your manifesto with voters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onRegisterCandidate)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="manifesto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Manifesto</FormLabel>
                          <FormDescription>
                            Explain why people should vote for you
                          </FormDescription>
                          <FormControl>
                            <Textarea 
                              placeholder="Share your ideas and vision..." 
                              className="min-h-24"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setRegisteringForElection(null);
                          form.reset();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={registeringInProgress}
                      >
                        {registeringInProgress ? "Submitting..." : "Register"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Voting;
