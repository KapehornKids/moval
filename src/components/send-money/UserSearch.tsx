
import { useState } from 'react';
import { User, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ButtonCustom } from '@/components/ui/button-custom';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UserSearchProps {
  onUserSelect: (user: { id: string; name: string; email: string | null }) => void;
  selectedUser: { id: string; name: string; email: string | null } | null;
}

const UserSearch = ({ onUserSelect, selectedUser }: UserSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Get user email by ID
  const getUserEmailById = async (userId: string) => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();
        
      return profile?.email || authUser?.user?.email || null;
    } catch (error) {
      console.error('Error getting user email by ID:', error);
      return null;
    }
  };

  // Function to handle user search
  const handleUserSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a search term',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsSearching(true);
      
      // Query to profiles table
      const { data: userProfiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email
        `)
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .order('first_name', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      
      const formattedUsers = await Promise.all(
        (userProfiles || []).map(async (user) => {
          const email = user.email || await getUserEmailById(user.id);
          return {
            id: user.id,
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User',
            email: email || 'No email'
          };
        })
      );
      
      setSearchResults(formattedUsers);
      
      if (formattedUsers.length === 0) {
        toast({
          title: 'No results',
          description: 'No users found matching your search',
        });
      }
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: 'Error',
        description: 'Unable to search for users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="grid gap-4">
      <Label htmlFor="search">Search User</Label>
      <div className="relative">
        <Input
          id="search"
          placeholder="Enter a name or email to search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleUserSearch();
            }
          }}
          className="glass-effect"
        />
        <ButtonCustom
          variant="glass"
          size="sm"
          className="absolute right-1 top-1 rounded-md"
          onClick={handleUserSearch}
          disabled={isSearching}
        >
          {isSearching ? 'Searching...' : <Search className="w-4 h-4 mr-2" />}
        </ButtonCustom>
      </div>
      
      {searchResults.length > 0 && (
        <div className="mt-2">
          <Label>Search Results</Label>
          <Select onValueChange={(value) => {
            const user = searchResults.find(user => user.id === value);
            if (user) onUserSelect(user);
          }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent>
              {searchResults.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>{user.name} ({user.email})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {selectedUser && (
        <div className="mt-2 p-3 rounded-md bg-muted/50">
          <Label>Selected User</Label>
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>{selectedUser.name}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSearch;
