
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { CardCustom, CardContent, CardHeader, CardTitle } from '@/components/ui/card-custom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getAnimationClass } from '@/lib/animations';
import { Filter, Search, User, Shield, Crown } from 'lucide-react';

// Define the User data structure
interface UserData {
  id: string;
  first_name: string;
  last_name: string;
  user_roles: { role: string }[];
}

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const { user, hasRole } = useAuth();

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

      const hasAssociationRole = await hasRole("association_member");
      if (!hasAssociationRole) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access User Management",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      fetchUsers();
    };

    checkAccess();
  }, [user, navigate, hasRole, roleFilter, searchQuery]);

  // Fetch users function
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      // Fetch profiles with their roles
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          user_roles (
            role
          )
        `);

      if (error) throw error;

      // Apply filters
      let filteredUsers = data;
      
      if (roleFilter) {
        filteredUsers = filteredUsers.filter(user => 
          user.user_roles?.some(r => r.role === roleFilter)
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

  const handleRoleChange = (value: string) => {
    setRoleFilter(value === 'all' ? null : value);
  };

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    try {
      // Check if the user already has a role
      const { data: existingRoles, error: selectError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);

      if (selectError) throw selectError;

      // Remove the user's current roles if they're the same type as the new role
      for (const role of existingRoles || []) {
        if (role.role === newRole) {
          // Role already exists, no need to update
          return;
        }
      }

      // Insert new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (insertError) throw insertError;

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

  const handleRemoveRole = async (userId: string, roleToRemove: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', roleToRemove);

      if (error) throw error;

      // Refresh users
      fetchUsers();
      toast({
        title: 'Success',
        description: 'User role removed successfully.',
      });
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove user role. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Layout>
      <div className="container px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          </div>
          <p className="text-muted-foreground">
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
                  className="pl-9"
                />
              </div>
              <div className="md:w-auto">
                <Select onValueChange={handleRoleChange} defaultValue="all">
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
              <Button variant="outline" className="md:w-auto" onClick={fetchUsers}>
                <Filter size={16} className="mr-2" />
                Apply Filters
              </Button>
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
            users.map((user, index) => (
              <CardCustom key={user.id} className={`glass-card hover:bg-white/5 transition-colors ${getAnimationClass("fade", index % 5)}`}>
                <CardContent className="py-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <User size={18} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{user.first_name} {user.last_name}</h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {user.user_roles?.map((role, idx) => (
                            <div key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary group">
                              <span>{role.role}</span>
                              {role.role !== 'user' && (
                                <button 
                                  onClick={() => handleRemoveRole(user.id, role.role)}
                                  className="ml-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  &times;
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRoleUpdate(user.id, 'association_member')}
                      >
                        <Crown size={16} className="mr-2" />
                        Association
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRoleUpdate(user.id, 'banker')}
                      >
                        <Shield size={16} className="mr-2" />
                        Banker
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRoleUpdate(user.id, 'justice_department')}
                      >
                        <Shield size={16} className="mr-2" />
                        Justice
                      </Button>
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
              <Button variant="outline" onClick={() => {
                setSearchQuery('');
                setRoleFilter(null);
                fetchUsers();
              }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* User Management Information */}
        <CardCustom className={`glass-card mt-12 ${getAnimationClass("fade", 5)}`}>
          <CardHeader>
            <CardTitle>About Role-Based Access Control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              Manage user roles to control access to different features and functionalities within the JusticeChain platform.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-white/5">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                  <Crown size={18} className="text-primary" />
                </div>
                <h4 className="text-sm font-medium">Association Members</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Can manage users, roles, conversion rates, and create elections.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white/5">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                  <Building size={18} className="text-primary" />
                </div>
                <h4 className="text-sm font-medium">Bankers</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Can create and approve loans and manage financial transactions.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white/5">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                  <Shield size={18} className="text-primary" />
                </div>
                <h4 className="text-sm font-medium">Justice Department</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Can review and resolve disputes between community members.
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
