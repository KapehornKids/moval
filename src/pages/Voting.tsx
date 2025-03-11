
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/layout/Layout";
import { 
  CardCustom, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card-custom";
import { ButtonCustom } from "@/components/ui/button-custom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  VoteIcon, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  ShieldCheck, 
  LibraryBig,
  UserCheck 
} from "lucide-react";
import { getAnimationClass } from "@/lib/animations";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel 
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// Define types
interface Election {
  id: string;
  title: string;
  description: string | null;
  position_type: string;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'ended';
  created_at: string;
  updated_at: string;
}

interface Candidate {
  id: string;
  user_id: string;
  election_id: string;
  manifesto: string | null;
  created_at: string;
  name?: string;
  vote_count?: number;
}

interface Vote {
  id: string;
  voter_id: string;
  candidate_id: string;
  election_id: string;
  created_at: string;
}

// Zod schemas
const candidateSchema = z.object({
  manifesto: z.string().min(10, "Manifesto must be at least 10 characters long"),
});

const Voting = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [elections, setElections] = useState<Election[]>([]);
  const [activeElection, setActiveElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [isUserRegistered, setIsUserRegistered] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);

  const candidateForm = useForm<z.infer<typeof candidateSchema>>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      manifesto: "",
    },
  });

  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      toast("Please login to access the voting system");
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Fetch elections
  useEffect(() => {
    const fetchElections = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("elections")
          .select("*")
          .order("start_date", { ascending: false });

        if (error) throw error;

        // Categorize elections by status
        const now = new Date();
        const categorizedElections = data.map((election) => {
          const startDate = new Date(election.start_date);
          const endDate = new Date(election.end_date);

          let status: 'upcoming' | 'active' | 'ended';
          if (now < startDate) {
            status = 'upcoming';
          } else if (now > endDate) {
            status = 'ended';
          } else {
            status = 'active';
          }

          return { ...election, status };
        });

        setElections(categorizedElections);

        // Find an active election if any
        const active = categorizedElections.find((e) => e.status === 'active');
        if (active) {
          setActiveElection(active);
          await fetchCandidatesForElection(active.id);
          if (user) {
            await checkUserVoted(active.id);
            await checkUserIsCandidate(active.id);
          }
        }
      } catch (error) {
        console.error("Error fetching elections:", error);
        toast.error("Could not load elections");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchElections();
    }
  }, [isAuthenticated, user]);

  // Fetch candidates for active election
  const fetchCandidatesForElection = async (electionId: string) => {
    try {
      // Fetch candidates
      const { data: candidatesData, error: candidatesError } = await supabase
        .from("candidates")
        .select("*")
        .eq("election_id", electionId);

      if (candidatesError) throw candidatesError;

      if (!candidatesData.length) {
        setCandidates([]);
        setTotalVotes(0);
        return;
      }

      // Get user details for each candidate
      const candidatesWithNames = await Promise.all(
        candidatesData.map(async (candidate) => {
          // Get user name
          const { data: userData, error: userError } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("id", candidate.user_id)
            .single();

          if (userError) {
            console.error("Error fetching candidate user:", userError);
            return {
              ...candidate,
              name: "Unknown User",
              vote_count: 0,
            };
          }

          // Get vote count
          const { count, error: countError } = await supabase
            .from("votes")
            .select("*", { count: "exact", head: true })
            .eq("candidate_id", candidate.id);

          if (countError) {
            console.error("Error counting votes:", countError);
            return {
              ...candidate,
              name: `${userData.first_name} ${userData.last_name}`,
              vote_count: 0,
            };
          }

          return {
            ...candidate,
            name: `${userData.first_name} ${userData.last_name}`,
            vote_count: count || 0,
          };
        })
      );

      // Calculate total votes
      const votesTotal = candidatesWithNames.reduce(
        (sum, candidate) => sum + (candidate.vote_count || 0),
        0
      );

      setCandidates(candidatesWithNames);
      setTotalVotes(votesTotal);
    } catch (error) {
      console.error("Error fetching candidates:", error);
      toast.error("Could not load candidates");
    }
  };

  // Check if user has already voted in the active election
  const checkUserVoted = async (electionId: string) => {
    if (!user) return;

    try {
      const { count, error } = await supabase
        .from("votes")
        .select("*", { count: "exact", head: true })
        .eq("voter_id", user.id)
        .eq("election_id", electionId);

      if (error) throw error;

      setHasVoted(!!count && count > 0);
    } catch (error) {
      console.error("Error checking if user voted:", error);
    }
  };

  // Check if user is already a candidate in the active election
  const checkUserIsCandidate = async (electionId: string) => {
    if (!user) return;

    try {
      const { count, error } = await supabase
        .from("candidates")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("election_id", electionId);

      if (error) throw error;

      setIsUserRegistered(!!count && count > 0);
    } catch (error) {
      console.error("Error checking if user is candidate:", error);
    }
  };

  // Handle election selection
  const handleElectionSelect = async (electionId: string) => {
    const selected = elections.find((e) => e.id === electionId);
    if (selected) {
      setActiveElection(selected);
      await fetchCandidatesForElection(selected.id);
      if (user) {
        await checkUserVoted(selected.id);
        await checkUserIsCandidate(selected.id);
      }
    }
  };

  // Register as a candidate
  const registerAsCandidate = async (data: z.infer<typeof candidateSchema>) => {
    if (!user || !activeElection) return;

    setIsRegistering(true);
    try {
      const { error } = await supabase.from("candidates").insert({
        user_id: user.id,
        election_id: activeElection.id,
        manifesto: data.manifesto,
      });

      if (error) throw error;

      toast.success("Successfully registered as a candidate");
      candidateForm.reset();
      setIsUserRegistered(true);
      
      // Refresh candidates
      await fetchCandidatesForElection(activeElection.id);
    } catch (error) {
      console.error("Error registering as candidate:", error);
      toast.error("Failed to register as a candidate");
    } finally {
      setIsRegistering(false);
    }
  };

  // Vote for a candidate
  const voteForCandidate = async (candidateId: string) => {
    if (!user || !activeElection || hasVoted) return;

    try {
      const { error } = await supabase.from("votes").insert({
        voter_id: user.id,
        candidate_id: candidateId,
        election_id: activeElection.id,
      });

      if (error) throw error;

      toast.success("Your vote has been recorded");
      setHasVoted(true);
      
      // Refresh candidates and vote count
      await fetchCandidatesForElection(activeElection.id);
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Failed to record your vote");
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate time remaining or elapsed
  const getTimeStatus = (election: Election) => {
    const now = new Date();
    const startDate = new Date(election.start_date);
    const endDate = new Date(election.end_date);

    if (election.status === 'upcoming') {
      const diffTime = startDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `Starts in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (election.status === 'active') {
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} remaining`;
    } else {
      return `Ended ${formatDate(election.end_date)}`;
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      case 'active':
        return "bg-green-500/20 text-green-500 border-green-500/30";
      case 'ended':
        return "bg-gray-500/20 text-gray-500 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-500 border-gray-500/30";
    }
  };

  if (!isAuthenticated && !isLoading) return null;

  return (
    <Layout>
      <div className="container px-4 py-8">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight animate-fade-in">
            Community Voting
          </h1>
          <p className="text-muted-foreground animate-fade-in">
            Participate in elections and help shape our community
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading elections...</p>
              </div>
            ) : elections.length === 0 ? (
              <CardCustom className={getAnimationClass("fade", 1)}>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <VoteIcon size={32} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-medium">No Elections Available</h3>
                  <p className="text-muted-foreground text-center mt-2 mb-6 max-w-md">
                    There are currently no elections scheduled. Check back later or contact the association members for more information.
                  </p>
                </CardContent>
              </CardCustom>
            ) : (
              <Tabs defaultValue={activeElection?.id || "about"} className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="about" className="flex items-center">
                    <VoteIcon size={16} className="mr-2" />
                    About Voting
                  </TabsTrigger>
                  {elections.map((election) => (
                    <TabsTrigger
                      key={election.id}
                      value={election.id}
                      className="flex items-center"
                      onClick={() => handleElectionSelect(election.id)}
                    >
                      {election.status === 'active' && (
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      )}
                      {election.title}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="about">
                  <CardCustom className={getAnimationClass("fade", 1)}>
                    <CardHeader>
                      <CardTitle>About the Voting System</CardTitle>
                      <CardDescription>
                        Learn how our community voting system works
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="glass-card p-4 space-y-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Calendar size={20} className="text-primary" />
                          </div>
                          <h3 className="font-medium">Elections</h3>
                          <p className="text-sm text-muted-foreground">
                            Elections are held periodically to select members for various positions in our community.
                          </p>
                        </div>
                        <div className="glass-card p-4 space-y-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserCheck size={20} className="text-primary" />
                          </div>
                          <h3 className="font-medium">Candidates</h3>
                          <p className="text-sm text-muted-foreground">
                            Any member can register as a candidate by submitting their manifesto during the election period.
                          </p>
                        </div>
                        <div className="glass-card p-4 space-y-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <VoteIcon size={20} className="text-primary" />
                          </div>
                          <h3 className="font-medium">Voting</h3>
                          <p className="text-sm text-muted-foreground">
                            Each member gets one vote per election. Results are transparent and secured on our platform.
                          </p>
                        </div>
                      </div>

                      <Separator className="my-6" />

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Voting Process</h3>
                        <ol className="space-y-3 pl-6 list-decimal">
                          <li className="text-muted-foreground">
                            <span className="text-foreground font-medium">Check active elections</span> - Browse through the tabs above to see ongoing or upcoming elections.
                          </li>
                          <li className="text-muted-foreground">
                            <span className="text-foreground font-medium">Register as a candidate</span> - If eligible, you can submit your manifesto to become a candidate.
                          </li>
                          <li className="text-muted-foreground">
                            <span className="text-foreground font-medium">Cast your vote</span> - Review candidates and cast your vote before the election ends.
                          </li>
                          <li className="text-muted-foreground">
                            <span className="text-foreground font-medium">View results</span> - After the election ends, results will be available for everyone to see.
                          </li>
                        </ol>
                      </div>

                      <Separator className="my-6" />

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Key Positions</h3>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="p-4 rounded-lg border border-muted space-y-2">
                            <div className="flex items-center gap-2">
                              <ShieldCheck size={18} className="text-blue-500" />
                              <h4 className="font-medium">Association Members</h4>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Responsible for governance and overseeing community operations
                            </p>
                          </div>
                          <div className="p-4 rounded-lg border border-muted space-y-2">
                            <div className="flex items-center gap-2">
                              <LibraryBig size={18} className="text-purple-500" />
                              <h4 className="font-medium">Justice Department</h4>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Responsible for dispute resolution and enforcing community rules
                            </p>
                          </div>
                          <div className="p-4 rounded-lg border border-muted space-y-2">
                            <div className="flex items-center gap-2">
                              <Users size={18} className="text-green-500" />
                              <h4 className="font-medium">Other Positions</h4>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Various roles may be created as needed to support community initiatives
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CardCustom>
                </TabsContent>

                {elections.map((election) => (
                  <TabsContent key={election.id} value={election.id}>
                    <CardCustom className={getAnimationClass("fade", 1)}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>{election.title}</CardTitle>
                            <CardDescription>
                              {election.description || `Election for ${election.position_type} position`}
                            </CardDescription>
                          </div>
                          <Badge className={`${getStatusColor(election.status)} capitalize`}>
                            {election.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-3 gap-4 mb-6">
                          <div className="glass-card p-4">
                            <p className="text-sm text-muted-foreground">Start Date</p>
                            <p className="font-medium">{formatDate(election.start_date)}</p>
                          </div>
                          <div className="glass-card p-4">
                            <p className="text-sm text-muted-foreground">End Date</p>
                            <p className="font-medium">{formatDate(election.end_date)}</p>
                          </div>
                          <div className="glass-card p-4">
                            <p className="text-sm text-muted-foreground">Status</p>
                            <p className="font-medium">{getTimeStatus(election)}</p>
                          </div>
                        </div>

                        {election.status === 'active' && !isUserRegistered && !hasVoted && (
                          <div className="glass-card p-4 mb-6">
                            <h3 className="font-medium mb-2">Register as a Candidate</h3>
                            <Form {...candidateForm}>
                              <form onSubmit={candidateForm.handleSubmit(registerAsCandidate)} className="space-y-4">
                                <FormField
                                  control={candidateForm.control}
                                  name="manifesto"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Your Manifesto</FormLabel>
                                      <FormControl>
                                        <Textarea
                                          placeholder="Share your vision and why you should be elected..."
                                          className="min-h-32"
                                          {...field}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                                <ButtonCustom
                                  type="submit"
                                  loading={isRegistering}
                                >
                                  Register as Candidate
                                </ButtonCustom>
                              </form>
                            </Form>
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-lg">Candidates</h3>
                            {totalVotes > 0 && (
                              <p className="text-sm text-muted-foreground">
                                Total Votes: {totalVotes}
                              </p>
                            )}
                          </div>

                          {candidates.length === 0 ? (
                            <div className="text-center py-8">
                              <div className="mx-auto w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-3">
                                <Users size={24} className="text-muted-foreground" />
                              </div>
                              <h3 className="text-lg font-medium">No Candidates Yet</h3>
                              <p className="text-muted-foreground mt-1 mb-4">
                                No one has registered as a candidate for this election yet.
                              </p>
                              {election.status === 'active' && !isUserRegistered && (
                                <ButtonCustom variant="glass" onClick={() => document.getElementById('manifesto')?.focus()}>
                                  Be the First Candidate
                                </ButtonCustom>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-4 mt-4">
                              {candidates.map((candidate) => (
                                <div key={candidate.id} className="glass-card p-4 space-y-3">
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-center">
                                      <Avatar className="h-10 w-10 mr-3">
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                          {candidate.name?.[0] || "U"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium">{candidate.name}</p>
                                        {candidate.vote_count !== undefined && totalVotes > 0 && (
                                          <div className="flex items-center text-xs text-muted-foreground gap-2 mt-1">
                                            <span>{candidate.vote_count} vote{candidate.vote_count !== 1 ? 's' : ''}</span>
                                            <Progress 
                                              value={(candidate.vote_count / totalVotes) * 100} 
                                              className="h-1.5 w-20" 
                                            />
                                            <span>{Math.round((candidate.vote_count / totalVotes) * 100)}%</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    {election.status === 'active' && !hasVoted && (
                                      <ButtonCustom
                                        variant="glass"
                                        size="sm"
                                        onClick={() => voteForCandidate(candidate.id)}
                                      >
                                        Vote
                                      </ButtonCustom>
                                    )}
                                    {hasVoted && (
                                      <Badge className="bg-green-500/10 text-green-500 border border-green-500/20">
                                        You Voted
                                      </Badge>
                                    )}
                                  </div>
                                  {candidate.manifesto && (
                                    <div className="text-sm text-muted-foreground pl-12">
                                      "{candidate.manifesto}"
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        {election.status === 'active' && hasVoted && (
                          <div className="w-full flex items-center justify-center p-3 bg-green-500/10 rounded-lg text-green-500 text-sm">
                            <CheckCircle size={16} className="mr-2" />
                            You have successfully cast your vote in this election
                          </div>
                        )}
                        {election.status === 'upcoming' && (
                          <div className="w-full flex items-center justify-center p-3 bg-yellow-500/10 rounded-lg text-yellow-500 text-sm">
                            <Calendar size={16} className="mr-2" />
                            This election has not started yet
                          </div>
                        )}
                        {election.status === 'ended' && (
                          <div className="w-full flex items-center justify-center p-3 bg-blue-500/10 rounded-lg text-blue-500 text-sm">
                            <LibraryBig size={16} className="mr-2" />
                            This election has ended
                          </div>
                        )}
                      </CardFooter>
                    </CardCustom>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <CardCustom className={`glass-card ${getAnimationClass("fade", 2)}`}>
              <CardHeader>
                <CardTitle>Election Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex justify-between items-center p-3 rounded-md bg-muted/10 animate-pulse">
                        <div className="w-32 h-4 bg-muted/20 rounded"></div>
                        <div className="w-16 h-4 bg-muted/20 rounded"></div>
                      </div>
                    ))
                  ) : elections.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No elections available</p>
                    </div>
                  ) : (
                    elections.map((election) => (
                      <div
                        key={election.id}
                        className={`flex justify-between items-center p-3 rounded-md cursor-pointer transition-colors ${
                          activeElection?.id === election.id
                            ? "bg-primary/10"
                            : "hover:bg-muted/10"
                        }`}
                        onClick={() => handleElectionSelect(election.id)}
                      >
                        <div>
                          <p className="font-medium">{election.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {getTimeStatus(election)}
                          </p>
                        </div>
                        <Badge className={`${getStatusColor(election.status)} capitalize`}>
                          {election.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>

                <Separator className="my-2" />

                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Your Voting Status</h3>
                  {!activeElection ? (
                    <p className="text-sm text-muted-foreground">
                      No active elections at the moment
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        {hasVoted ? (
                          <>
                            <CheckCircle size={16} className="text-green-500" />
                            <span>You have voted in the current election</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={16} className="text-yellow-500" />
                            <span>You have not voted yet</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {isUserRegistered ? (
                          <>
                            <CheckCircle size={16} className="text-green-500" />
                            <span>You are registered as a candidate</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={16} className="text-muted-foreground" />
                            <span className="text-muted-foreground">Not registered as candidate</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </CardCustom>

            <CardCustom className={`glass-card ${getAnimationClass("fade", 3)}`}>
              <CardHeader>
                <CardTitle>Voting Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-1" />
                    <span className="text-sm">Each member gets one vote per election</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-1" />
                    <span className="text-sm">Votes cannot be changed once cast</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-1" />
                    <span className="text-sm">You can register as a candidate in active elections</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-1" />
                    <span className="text-sm">Election results are visible to all members once closed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 mt-1" />
                    <span className="text-sm">Winners are determined by simple majority</span>
                  </li>
                </ul>
              </CardContent>
            </CardCustom>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Voting;
