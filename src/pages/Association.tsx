
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { CardCustom, CardHeader, CardTitle, CardContent } from '@/components/ui/card-custom';
import { Input } from '@/components/ui/input';
import { ButtonCustom } from '@/components/ui/button-custom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { getAnimationClass } from '@/lib/animations';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { User } from '@/types';
import { Search, Vote, CheckSquare, Users, Clock, ChevronRight } from 'lucide-react';

const Association = () => {
  const [activeMembers, setActiveMembers] = useState<User[]>([]);
  const [candidates, setCandidates] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const { isAuthenticated, user, hasRole } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchAssociationMembers();
      fetchCandidates();
    } else {
      toast({
        title: "Authentication Required",
        description: "Please login to access the Association page",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);
  
  const fetchAssociationMembers = async () => {
    setIsLoading(true);
    try {
      // First, get user_ids that have the association_member role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'association_member');
        
      if (roleError) throw roleError;
      
      if (roleData && roleData.length > 0) {
        // Get the array of user_ids
        const memberIds = roleData.map(item => item.user_id);
        
        // Then fetch profiles for these users
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', memberIds);
          
        if (profilesError) throw profilesError;
        
        // Map profiles to User type
        const members: User[] = profilesData.map(profile => ({
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          user_roles: [{ role: 'association_member' }]
        }));
        
        setActiveMembers(members);
      } else {
        setActiveMembers([]);
      }
    } catch (error) {
      console.error('Error fetching association members:', error);
      toast({
        title: 'Error',
        description: 'Failed to load association members',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchCandidates = async () => {
    try {
      // Get active election for association_member role
      const { data: electionsData, error: electionsError } = await supabase
        .from('elections')
        .select('id')
        .eq('position_type', 'association_member')
        .eq('status', 'active')
        .single();
        
      if (electionsError) {
        if (electionsError.code === 'PGRST116') {
          console.log('No active association election found');
          return;
        }
        throw electionsError;
      }
      
      if (electionsData) {
        // Get candidates for this election
        const { data: candidatesData, error: candidatesError } = await supabase
          .from('candidates')
          .select('user_id')
          .eq('election_id', electionsData.id);
          
        if (candidatesError) throw candidatesError;
        
        if (candidatesData && candidatesData.length > 0) {
          // Get the array of user_ids
          const candidateIds = candidatesData.map(item => item.user_id);
          
          // Then fetch profiles for these users
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', candidateIds);
            
          if (profilesError) throw profilesError;
          
          // Map profiles to User type
          const candidates: User[] = profilesData.map(profile => ({
            id: profile.id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            user_roles: [{ role: 'user' }]
          }));
          
          setCandidates(candidates);
        }
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load candidates',
        variant: 'destructive',
      });
    }
  };
  
  const filteredActiveMembers = activeMembers.filter(member => {
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });
  
  const filteredCandidates = candidates.filter(candidate => {
    const fullName = `${candidate.first_name} ${candidate.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });
  
  return (
    <Layout>
      <div className="container px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight animate-fade-in">Moval Association</h1>
          <p className="text-muted-foreground animate-fade-in">
            Meet the community leaders and participate in governance
          </p>
        </div>
        
        <Tabs defaultValue="members" className={getAnimationClass("fade", 1)}>
          <TabsList className="mb-6">
            <TabsTrigger value="members" className="flex items-center">
              <Users size={16} className="mr-2" />
              <span>Current Members</span>
            </TabsTrigger>
            <TabsTrigger value="candidates" className="flex items-center">
              <Vote size={16} className="mr-2" />
              <span>Election Candidates</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members or candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 glass-effect"
              />
            </div>
          </div>
          
          <TabsContent value="members">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: 6 }).map((_, i) => (
                  <CardCustom key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/20"></div>
                          <div className="space-y-2">
                            <div className="h-4 w-24 bg-primary/20 rounded"></div>
                            <div className="h-3 w-16 bg-primary/10 rounded"></div>
                          </div>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-primary/10"></div>
                      </div>
                      <div className="h-16 bg-primary/10 rounded"></div>
                    </CardContent>
                  </CardCustom>
                ))
              ) : filteredActiveMembers.length > 0 ? (
                filteredActiveMembers.map((member) => (
                  <CardCustom key={member.id} className="glass-card">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <Users size={24} />
                          </div>
                          <div>
                            <h3 className="font-medium">{member.first_name} {member.last_name}</h3>
                            <p className="text-sm text-muted-foreground">Association Member</p>
                          </div>
                        </div>
                        <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center">
                          <CheckSquare size={16} />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Active member of the Moval Association, participating in governance and community decisions.
                      </p>
                    </CardContent>
                  </CardCustom>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                    <Users size={32} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-medium">No Association Members Found</h3>
                  <p className="text-muted-foreground mt-2">
                    {searchQuery 
                      ? 'No members match your search criteria' 
                      : 'There are no active association members at this time'}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="candidates">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                // Loading skeletons (same as above)
                Array.from({ length: 6 }).map((_, i) => (
                  <CardCustom key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/20"></div>
                          <div className="space-y-2">
                            <div className="h-4 w-24 bg-primary/20 rounded"></div>
                            <div className="h-3 w-16 bg-primary/10 rounded"></div>
                          </div>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-primary/10"></div>
                      </div>
                      <div className="h-16 bg-primary/10 rounded"></div>
                    </CardContent>
                  </CardCustom>
                ))
              ) : filteredCandidates.length > 0 ? (
                filteredCandidates.map((candidate) => (
                  <CardCustom key={candidate.id} className="glass-card">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                            <Vote size={24} />
                          </div>
                          <div>
                            <h3 className="font-medium">{candidate.first_name} {candidate.last_name}</h3>
                            <p className="text-sm text-muted-foreground">Candidate</p>
                          </div>
                        </div>
                        <div className="bg-amber-500/10 text-amber-500 w-8 h-8 rounded-full flex items-center justify-center">
                          <Clock size={16} />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Standing as a candidate for the Moval Association, campaigning to represent the community interests.
                      </p>
                      
                      <ButtonCustom
                        variant="ghost"
                        size="sm"
                        className="mt-4 w-full flex items-center justify-center"
                        onClick={() => navigate(`/voting`)}
                      >
                        <span>View Candidate Details</span>
                        <ChevronRight size={16} className="ml-1" />
                      </ButtonCustom>
                    </CardContent>
                  </CardCustom>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                    <Vote size={32} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-medium">No Candidates Found</h3>
                  <p className="text-muted-foreground mt-2">
                    {searchQuery 
                      ? 'No candidates match your search criteria' 
                      : 'There are no active candidates at this time'}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Association;
