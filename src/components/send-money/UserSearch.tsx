
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { X, User, Search, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface UserSearchProps {
  onUserSelect: (user: { id: string; name: string; email: string | null } | null) => void;
  selectedUser: { id: string; name: string; email: string | null } | null;
}

const UserSearch: React.FC<UserSearchProps> = ({ onUserSelect, selectedUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useAuth();

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .limit(5);

      if (error) throw error;

      // Filter out the current user
      const filteredResults = data?.filter(item => item.id !== user?.id) || [];
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: 'Error',
        description: 'Could not search for users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

  const handleUserClick = (selectedUser: any) => {
    onUserSelect({
      id: selectedUser.id,
      name: `${selectedUser.first_name} ${selectedUser.last_name}`,
      email: null
    });
    setSearchResults([]);
    setSearchQuery('');
  };

  const clearSelectedUser = () => {
    onUserSelect(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="search-users">Find User</Label>
        {!selectedUser ? (
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-users"
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 glass-effect"
            />
            {isSearching && (
              <div className="absolute right-3 top-2.5">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                <User size={16} className="text-primary" />
              </div>
              <div>
                <p className="font-medium">{selectedUser.name}</p>
              </div>
            </div>
            <button 
              onClick={clearSelectedUser}
              className="p-1 hover:bg-accent rounded-full"
              aria-label="Clear selected user"
            >
              <X size={16} className="text-muted-foreground" />
            </button>
          </div>
        )}
      </div>

      {searchResults.length > 0 && !selectedUser && (
        <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto">
          {searchResults.map((result) => (
            <div
              key={result.id}
              className="flex items-center justify-between p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
              onClick={() => handleUserClick(result)}
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                  <User size={16} className="text-primary" />
                </div>
                <div>
                  <p className="font-medium">{result.first_name} {result.last_name}</p>
                </div>
              </div>
              <CheckCircle size={16} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      )}

      {searchQuery && searchResults.length === 0 && !isSearching && !selectedUser && (
        <div className="p-3 text-center text-muted-foreground bg-accent/50 rounded-lg">
          No users found. Try a different search term.
        </div>
      )}
    </div>
  );
};

export default UserSearch;
