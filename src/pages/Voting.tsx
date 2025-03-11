
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { CardCustom, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card-custom";
import { ButtonCustom } from "@/components/ui/button-custom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { getAnimationClass } from "@/lib/animations";
import { toast } from "@/hooks/use-toast";
import { Vote, Clock, Calendar, Users, CheckCircle, XCircle, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Election {
  id: string;
  title: string;
  description: string;
  position_type: string;
  status: 'upcoming' | 'active' | 'completed';
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

interface Candidate {
  id: string;
  election_id: string;
  user_id: string;
  manifesto: string;
  created_at: string;
  user_name?: string;
  vote_count?: number;
}

const Voting = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [candidates, setCandidates] = useState<Record<string, Candidate[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [myVotes, setMyVotes] = useState<Record<string, string>>({});
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [manifesto, setManifesto] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Fetch elections
  useEffect(() => {
    const fetchElections = async () => {
      try {
        setIsLoading(true);
        
        const { data: electionsData, error: electionsError } = await supabase
          .from('elections')
          .select('*')
          .order('start_date', { ascending: false });
          
        if (electionsError) throw electionsError;
        
        const typedElections = electionsData.map(election => ({
          ...election,
          status: election.status as 'upcoming' | 'active' | 'completed'
        }));
        
        setElections(typedElections);
        
        // Fetch candidates for each election
        const candidatesPromises = typedElections.map(async (election) => {
          const { data: candidatesData, error: candidatesError } = await supabase
            .from('candidates')
            .select(`
              *,
              profiles:user_id (
                first_name,
                last_name
              )
            `)
            .eq('election_id', election.id);
            
          if (candidatesError) throw candidatesError;
          
          // Process candidate data
          const processedCandidates = candidatesData.map((candidate: any) => ({
            ...candidate,
            user_name: candidate.profiles ? 
              `${candidate.profiles.first_name || ''} ${candidate.profiles.last_name || ''}`.trim() : 
              'Unknown'
          }));
          
          return { electionId: election.id, candidates: processedCandidates };
        });
        
        const candidatesResults = await Promise.all(candidatesPromises);
        
        // Organize candidates by election
        const candidatesByElection: Record<string, Candidate[]> = {};
        candidatesResults.forEach(result => {
          candidatesByElection[result.electionId] = result.candidates;
        });
        
        setCandidates(candidatesByElection);
        
        // If user is authenticated, fetch their votes
        if (user) {
          const { data: votesData, error: votesError } = await supabase
            .from('votes')
            .select('election_id, candidate_id')
            .eq('voter_id', user.id);
            
          if (votesError) throw votesError;
          
          // Create a mapping of election_id to candidate_id
          const userVotes: Record<string, string> = {};
          votesData.forEach((vote: any) => {
            userVotes[vote.election_id] = vote.candidate_id;
          });
          
          setMyVotes(userVotes);
        }
      } catch (error) {
        console.error('Error fetching elections:', error);
        toast({
          title: "Error",
          description: "Unable to fetch elections. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchElections();
  }, [user]);
  
  // Apply as candidate
  const handleApplyAsCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !selectedElection) return;
    
    if (!manifesto) {
      toast({
        title: "Missing Information",
        description: "Please provide your manifesto",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Check if user is already a candidate
      const { data: existingCandidate, error: checkError } = await supabase
        .from('candidates')
        .select('*')
        .eq('election_id', selectedElection.id)
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (checkError) throw checkError;
      
      if (existingCandidate) {
        toast({
          title: "Already Applied",
          description: "You are already a candidate in this election",
          variant: "destructive",
        });
        return;
      }
      
      // Insert new candidate
      const { data, error } = await supabase
        .from('candidates')
        .insert([
          {
            election_id: selectedElection.id,
            user_id: user.id,
            manifesto,
          }
        ])
        .select();
        
      if (error) throw error;
      
      toast({
        title: "Application Submitted",
        description: "Your candidacy application has been submitted successfully",
      });
      
      // Update candidates list
      if (data) {
        const newCandidate = {
          ...data[0],
          user_name: user.name || 'You'
        };
        
        setCandidates(prev => ({
          ...prev,
          [selectedElection.id]: [...(prev[selectedElection.id] || []), newCandidate]
        }));
      }
      
      // Reset form
      setManifesto('');
      setShowApplyForm(false);
      setSelectedElection(null);
    } catch (error) {
      console.error('Error applying as candidate:', error);
      toast({
        title: "Application Failed",
        description: "Unable to submit your candidacy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Vote for a candidate
  const handleVote = async (electionId: string, candidateId: string) => {
    if (!user) return;
    
    try {
      // Check if user has already voted
      if (myVotes[electionId]) {
        if (myVotes[electionId] === candidateId) {
          toast({
            title: "Already Voted",
            description: "You have already voted for this candidate",
          });
          return;
        } else {
          toast({
            title: "Already Voted",
            description: "You have already voted in this election for another candidate",
            variant: "destructive",
          });
          return;
        }
      }
      
      // Insert new vote
      const { error } = await supabase
        .from('votes')
        .insert([
          {
            election_id: electionId,
            candidate_id: candidateId,
            voter_id: user.id,
          }
        ]);
        
      if (error) throw error;
      
      // Update local state
      setMyVotes(prev => ({
        ...prev,
        [electionId]: candidateId
      }));
      
      toast({
        title: "Vote Submitted",
        description: "Your vote has been recorded successfully",
      });
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Voting Failed",
        description: "Unable to submit your vote. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  // Get time remaining for election
  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    const distance = end - now;
    
    if (distance < 0) return 'Ended';
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${days}d ${hours}h remaining`;
  };
  
  // Determine if user can apply as candidate
  const canApplyAsCandidate = (election: Election) => {
    if (!user) return false;
    if (election.status !== 'upcoming') return false;
    
    // Check if user is already a candidate
    const electionCandidates = candidates[election.id] || [];
    return !electionCandidates.some(candidate => candidate.user_id === user.id);
  };
  
  // Handle apply button click
  const handleApplyClick = (election: Election) => {
    setSelectedElection(election);
    setShowApplyForm(true);
  };
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      toast({
        title: "Authentication Required",
        description: "Please login to access voting",
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
          <h1 className="text-3xl font-bold tracking-tight animate-fade-in">Community Voting</h1>
          <p className="text-muted-foreground animate-fade-in">
            Participate in elections and vote for association members
          </p>
        </div>
        
        {showApplyForm && selectedElection && (
          <CardCustom className={`glass-card mb-8 ${getAnimationClass("fade", 1)}`}>
            <CardHeader>
              <CardTitle>Apply as Candidate for {selectedElection.title}</CardTitle>
              <CardDescription>
                Share your vision and goals to convince community members to vote for you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleApplyAsCandidate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="manifesto">Your Manifesto</Label>
                  <Textarea
                    id="manifesto"
                    value={manifesto}
                    onChange={(e) => setManifesto(e.target.value)}
                    placeholder="Describe your plans, goals, and why people should vote for you..."
                    className="glass-effect min-h-32"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <ButtonCustom
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowApplyForm(false);
                      setSelectedElection(null);
                      setManifesto('');
                    }}
                  >
                    Cancel
                  </ButtonCustom>
                  <ButtonCustom
                    type="submit"
                    loading={isSubmitting}
                  >
                    Submit Application
                  </ButtonCustom>
                </div>
              </form>
            </CardContent>
          </CardCustom>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Elections */}
            <CardCustom className={getAnimationClass("fade", 1)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Active Elections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="p-4 rounded-lg glass-effect flex flex-col gap-2 animate-pulse">
                        <div className="h-6 w-48 bg-white/10 rounded"></div>
                        <div className="h-4 w-full bg-white/10 rounded"></div>
                        <div className="flex gap-4 mt-2">
                          <div className="h-8 w-24 bg-white/10 rounded"></div>
                          <div className="h-8 w-24 bg-white/10 rounded"></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    elections
                      .filter(election => election.status === 'active')
                      .map((election) => (
                        <div key={election.id} className="p-4 rounded-lg glass-card space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-lg">{election.title}</h3>
                            <span className="px-3 py-1 rounded-full text-xs bg-green-100/20 text-green-500 border border-green-500/20">
                              Active
                            </span>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">{election.description}</p>
                          
                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                Ends: {formatDate(election.end_date)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {getTimeRemaining(election.end_date)}
                              </span>
                            </div>
                          </div>
                          
                          {/* Candidates */}
                          <div className="pt-3">
                            <h4 className="text-sm font-medium mb-2">Candidates:</h4>
                            <div className="space-y-2">
                              {(candidates[election.id] || []).length > 0 ? (
                                candidates[election.id].map(candidate => (
                                  <div key={candidate.id} className="flex items-center justify-between bg-white/5 p-2 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                        <Users size={16} className="text-primary" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">{candidate.user_name}</p>
                                        <p className="text-xs text-muted-foreground truncate max-w-xs">
                                          {candidate.manifesto.substring(0, 50)}...
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <ButtonCustom
                                      variant={myVotes[election.id] === candidate.id ? "primary" : "outline"}
                                      size="sm"
                                      onClick={() => handleVote(election.id, candidate.id)}
                                      disabled={!!myVotes[election.id]}
                                    >
                                      {myVotes[election.id] === candidate.id ? "Voted" : "Vote"}
                                    </ButtonCustom>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground">No candidates yet.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                  
                  {!isLoading && elections.filter(election => election.status === 'active').length === 0 && (
                    <div className="text-center py-8">
                      <div className="mx-auto w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-3">
                        <Vote size={24} className="text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium">No Active Elections</h3>
                      <p className="text-muted-foreground mt-1">
                        There are no active elections at the moment. Check back later or view upcoming elections.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </CardCustom>
            
            {/* Upcoming Elections */}
            <CardCustom className={getAnimationClass("fade", 2)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Upcoming Elections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="p-4 rounded-lg glass-effect flex flex-col gap-2 animate-pulse">
                      <div className="h-6 w-48 bg-white/10 rounded"></div>
                      <div className="h-4 w-full bg-white/10 rounded"></div>
                      <div className="flex gap-4 mt-2">
                        <div className="h-8 w-24 bg-white/10 rounded"></div>
                      </div>
                    </div>
                  ) : (
                    elections
                      .filter(election => election.status === 'upcoming')
                      .map((election) => (
                        <div key={election.id} className="p-4 rounded-lg glass-card space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-lg">{election.title}</h3>
                            <span className="px-3 py-1 rounded-full text-xs bg-blue-100/20 text-blue-500 border border-blue-500/20">
                              Upcoming
                            </span>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">{election.description}</p>
                          
                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                Starts: {formatDate(election.start_date)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                Ends: {formatDate(election.end_date)}
                              </span>
                            </div>
                          </div>
                          
                          {/* Candidates */}
                          <div className="pt-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-medium">Candidates:</h4>
                              {canApplyAsCandidate(election) && (
                                <ButtonCustom
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApplyClick(election)}
                                >
                                  Apply as Candidate
                                </ButtonCustom>
                              )}
                            </div>
                            <div className="space-y-2">
                              {(candidates[election.id] || []).length > 0 ? (
                                candidates[election.id].map(candidate => (
                                  <div key={candidate.id} className="flex items-center justify-between bg-white/5 p-2 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                        <Users size={16} className="text-primary" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">{candidate.user_name}</p>
                                        <p className="text-xs text-muted-foreground truncate max-w-xs">
                                          {candidate.manifesto.substring(0, 50)}...
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground">No candidates yet. Be the first to apply!</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                  
                  {!isLoading && elections.filter(election => election.status === 'upcoming').length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No upcoming elections scheduled at this time.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </CardCustom>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Election Information */}
            <CardCustom className={`glass-card ${getAnimationClass("fade", 3)}`}>
              <CardHeader>
                <CardTitle>Election Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">
                  The Moval Society holds regular elections for various positions in the community. These positions help govern and manage the society.
                </p>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Available Positions:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Shield size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Association Member</p>
                        <p className="text-xs text-muted-foreground">
                          Help govern the society's daily operations
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Scale size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Justice Officer</p>
                        <p className="text-xs text-muted-foreground">
                          Handle disputes and enforce community rules
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Landmark size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Banker</p>
                        <p className="text-xs text-muted-foreground">
                          Manage society's financial resources
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <h4 className="text-sm font-medium">Election Process:</h4>
                  <ul className="space-y-1">
                    <li className="text-xs text-muted-foreground flex items-start gap-2">
                      <ChevronRight size={12} className="mt-1 flex-shrink-0" />
                      <span>Elections are announced two weeks before the voting period</span>
                    </li>
                    <li className="text-xs text-muted-foreground flex items-start gap-2">
                      <ChevronRight size={12} className="mt-1 flex-shrink-0" />
                      <span>Candidates can apply during the announcement period</span>
                    </li>
                    <li className="text-xs text-muted-foreground flex items-start gap-2">
                      <ChevronRight size={12} className="mt-1 flex-shrink-0" />
                      <span>Voting is open to all registered members</span>
                    </li>
                    <li className="text-xs text-muted-foreground flex items-start gap-2">
                      <ChevronRight size={12} className="mt-1 flex-shrink-0" />
                      <span>Results are announced immediately after voting ends</span>
                    </li>
                    <li className="text-xs text-muted-foreground flex items-start gap-2">
                      <ChevronRight size={12} className="mt-1 flex-shrink-0" />
                      <span>Elected officers serve for a term of 3 months</span>
                    </li>
                  </ul>
                </div>
                
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-muted-foreground">
                    For detailed information about election rules, please refer to the 
                    <a href="/terms" className="text-primary ml-1 hover:underline">
                      Terms & Conditions
                    </a>.
                  </p>
                </div>
              </CardContent>
            </CardCustom>
            
            {/* Past Elections */}
            <CardCustom className={getAnimationClass("fade", 4)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Past Elections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {isLoading ? (
                    <div className="animate-pulse space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-8 bg-white/10 rounded"></div>
                      ))}
                    </div>
                  ) : (
                    elections
                      .filter(election => election.status === 'completed')
                      .slice(0, 3)
                      .map((election) => (
                        <div key={election.id} className="flex justify-between items-center p-2 hover:bg-white/5 rounded-lg">
                          <div>
                            <p className="text-sm font-medium">{election.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(election.end_date)}
                            </p>
                          </div>
                          <ButtonCustom variant="outline" size="sm">
                            Results
                          </ButtonCustom>
                        </div>
                      ))
                  )}
                  
                  {!isLoading && elections.filter(election => election.status === 'completed').length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No past elections available.
                    </p>
                  )}
                </div>
              </CardContent>
            </CardCustom>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Voting;
