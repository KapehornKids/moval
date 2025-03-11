import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { CardCustom, CardContent, CardHeader, CardTitle } from '@/components/ui/card-custom';
import { ButtonCustom } from '@/components/ui/button-custom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getAnimationClass } from '@/lib/animations';
import { Filter, Search, User, Shield, Crown } from 'lucide-react';

// Define the role type that matches what's in the database
type UserRole = {
  role: string;
};

// Define the User data structure
interface UserData {
  id: string;
  first_name: string;
  last_name: string;
  user_roles: UserRole[];
}

const Users = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated, roleFilter, searchQuery]);

  // Fetch users function
  const fetchUsers = async () => {
    try {
      setIsLoading(true);

      // Fetch profiles and attempt to join with user_roles
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name
        `);

      if (error) throw error;

      // For each profile, fetch their roles
      const usersWithRoles = await Promise.all(
        data.map(async (profile) => {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id);

          return {
            ...profile,
            user_roles: roles || []
          };
        })
      );

      // Apply filters if needed
      let filteredUsers = usersWithRoles;
      
      if (roleFilter) {
        filteredUsers = filteredUsers.filter(user => 
          user.user_roles.some(r => r.role === roleFilter)
        );
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
          user.first_name?.toLowerCase().includes(query) || 
          user.last_name?.toLowerCase().includes(query)
        );
      }

      setUsers(filteredUsers as UserData[]);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value === 'all' ? null : e.target.value);
  };

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    try {
      // Check if the user already has a role
      const { data: existingRoles, error: selectError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);

      if (selectError) throw selectError;

      if (existingRoles && existingRoles.length > 0) {
        // Update existing role
        const { error: updateError } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);

        if (updateError) throw updateError;
      } else {
        // Insert new role
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });

        if (insertError) throw insertError;
      }

      // Refresh users
      fetchUsers();
      toast({
        title: 'Success',
        description: 'User role updated successfully.',
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div className="container px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight animate-fade-in">Users</h1>
          <p className="text-muted-foreground animate-fade-in">
            Manage user roles and permissions
          </p>
        </div>

        {/* Search and Filters */}
        <CardCustom className={`glass-card mb-6 ${getAnimationClass("fade", 1)}`}>
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 glass-effect"
                />
              </div>
              <div className="md:w-auto">
                <Select onValueChange={(value) => setRoleFilter(value === 'all' ? null : value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="association_member">Association Member</SelectItem>
                    <SelectItem value="banker">Banker</SelectItem>
                    <SelectItem value="justice_department">Justice Department</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ButtonCustom variant="outline" className="md:w-auto">
                <Filter size={16} className="mr-2" />
                Filters
              </ButtonCustom>
            </div>
          </CardContent>
        </CardCustom>

        {/* Users List */}
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <CardCustom key={i} className="animate-pulse">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-32 bg-white/10 rounded"></div>
                    <div className="h-6 w-48 bg-white/10 rounded"></div>
                  </div>
                  <div className="mt-4 h-8 w-full bg-white/10 rounded"></div>
                </CardContent>
              </CardCustom>
            ))
          ) : users.length > 0 ? (
            users.map((user) => (
              <CardCustom key={user.id} className={`glass-card hover:bg-white/5 transition-colors ${getAnimationClass("fade", users.indexOf(user) % 5)}`}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <User size={18} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{user.first_name} {user.last_name}</h3>
                        <p className="text-xs text-muted-foreground">User ID: {user.id}</p>
                      </div>
                    </div>
                    <div>
                      <Select onValueChange={(newRole) => handleRoleUpdate(user.id, newRole)}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select Role">
                            {user.user_roles && user.user_roles.length > 0 ? (
                              user.user_roles[0].role
                            ) : (
                              'Select Role'
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="association_member">Association Member</SelectItem>
                          <SelectItem value="banker">Banker</SelectItem>
                          <SelectItem value="justice_department">Justice Department</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </CardCustom>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                <User size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium">No Users Found</h3>
              <p className="text-muted-foreground mt-2 mb-6">
                No users match your search criteria
              </p>
              <ButtonCustom variant="outline" onClick={() => {
                setSearchQuery('');
                setRoleFilter(null);
              }}>
                Clear Filters
              </ButtonCustom>
            </div>
          )}
        </div>

        {/* Load More Button */}
        {users.length > 0 && (
          <div className="flex justify-center mt-8">
            <ButtonCustom variant="glass">
              Load More Users
            </ButtonCustom>
          </div>
        )}

        {/* User Management Information */}
        <CardCustom className={`glass-card mt-12 ${getAnimationClass("fade", 5)}`}>
          <CardHeader>
            <CardTitle>About User Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              Manage user roles and permissions to control access to different features and functionalities within the application.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-white/5">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                  <Shield size={18} className="text-primary" />
                </div>
                <h4 className="text-sm font-medium">Secure Access</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Control user access to sensitive data and features based on their assigned roles.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white/5">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                  <Crown size={18} className="text-primary" />
                </div>
                <h4 className="text-sm font-medium">Role-Based Permissions</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Assign specific roles to users to define their permissions and capabilities.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white/5">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                  <User size={18} className="text-primary" />
                </div>
                <h4 className="text-sm font-medium">User Management</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Easily manage user accounts, roles, and permissions from a centralized dashboard.
                </p>
              </div>
            </div>
          </CardContent>
        </CardCustom>
      </div>
    </Layout>
  );
};

export default Users;
