
import { useState } from 'react';
import { User, Search, QrCode } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ButtonCustom } from '@/components/ui/button-custom';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import QRCodeScanner from './QRCodeScanner';

interface UserSearchProps {
  onUserSelect: (user: { id: string; name: string; email: string | null }) => void;
  selectedUser: { id: string; name: string; email: string | null } | null;
}

const UserSearch = ({ onUserSelect, selectedUser }: UserSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; email: string | null }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // Function to handle QR code scanning result
  const handleQRCodeScanned = (userId: string) => {
    if (!userId) {
      toast({
        title: 'Invalid QR Code',
        description: 'The scanned QR code does not contain a valid user ID',
        variant: 'destructive',
      });
      return;
    }

    setIsQRModalOpen(false);
    
    // Look up the user based on the scanned ID
    fetchUserById(userId);
  };

  // Function to fetch user by ID (from QR scan)
  const fetchUserById = async (userId: string) => {
    try {
      setIsSearching(true);
      
      // Get user profile
      const { data: userProfile, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      if (userProfile) {
        // Get user email separately
        const { data: userData } = await supabase
          .from('auth_users')
          .select('email')
          .eq('id', userId)
          .maybeSingle();
          
        const email = userData?.email || null;
        
        const user = {
          id: userProfile.id,
          name: `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || 'User',
          email
        };
        
        onUserSelect(user);
        
        toast({
          title: 'User Found',
          description: `Selected user: ${user.name}`,
        });
      } else {
        toast({
          title: 'User Not Found',
          description: 'No user found with the scanned ID',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      toast({
        title: 'Error',
        description: 'Failed to get user information',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
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
        .select('id, first_name, last_name')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
        .order('first_name', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      
      // Format the user data without trying to access auth_users
      const formattedUsers = (userProfiles || []).map((user) => {
        return {
          id: user.id,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User',
          email: null // We don't have access to email through client-side queries
        };
      });
      
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
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id="search"
            placeholder="Enter a name to search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleUserSearch();
              }
            }}
            className="glass-effect pr-10"
          />
          <ButtonCustom
            variant="glass"
            size="sm"
            className="absolute right-1 top-1 rounded-md"
            onClick={handleUserSearch}
            disabled={isSearching}
          >
            {isSearching ? 'Searching...' : <Search className="w-4 h-4" />}
          </ButtonCustom>
        </div>
        
        <Dialog open={isQRModalOpen} onOpenChange={setIsQRModalOpen}>
          <DialogTrigger asChild>
            <ButtonCustom variant="outline" className="px-3">
              <QrCode className="w-4 h-4 mr-2" />
              Scan QR
            </ButtonCustom>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Scan User QR Code</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-4">
              <QRCodeScanner onScan={handleQRCodeScanned} />
            </div>
          </DialogContent>
        </Dialog>
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
                    <span>{user.name}</span>
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
            {selectedUser.email && <span className="text-muted-foreground text-sm">({selectedUser.email})</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSearch;
