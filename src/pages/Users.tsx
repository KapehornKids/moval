
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { CardCustom, CardHeader, CardTitle, CardContent } from '@/components/ui/card-custom';
import { Input } from '@/components/ui/input';
import { ButtonCustom } from '@/components/ui/button-custom';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { User, AppRole } from '@/types';
import { Search, User as UserIcon, Shield, CreditCard, Gavel } from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>('user');
  const [isAssigningRole, setIsAssigningRole] = useState(false);
  
  const { isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkAccess = async () => {
      if (!isAuthenticated) {
        toast({
          title: "Authentication Required",
          description: "Please login to access the Users page",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }
      
      const isAssociationMember = await hasRole("association_member");
      if (!isAssociationMember) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the Users page",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }
      
      fetchUsers();
    };
    
    checkAccess();
  }, [isAuthenticated, navigate, hasRole]);
  
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      // First get all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name
        `);
      
      if (profilesError) throw profilesError;
      
      // Then get all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) throw rolesError;
      
      // Map roles to users
      const usersWithRoles: User[] = profilesData.map(profile => {
        const userRoles = rolesData
          .filter(role => role.user_id === profile.id)
          .map(role => ({ role: role.role }));
        
        return {
          id: profile.id,
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          user_roles: userRoles
        };
      });
      
      setUsers(usersWithRoles);
      setFilteredUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    // Filter users based on search query
    const filtered = users.filter(user => {
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      return fullName.includes(searchQuery.toLowerCase());
    });
    
    setFilteredUsers(filtered);
  }, [searchQuery, users]);
  
  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) return;
    
    try {
      setIsAssigningRole(true);
      
      // Check if user already has this role
      const userHasRole = selectedUser.user_roles?.some(r => r.role === selectedRole);
      
      if (userHasRole) {
        toast({
          title: 'Role Already Assigned',
          description: `User already has the ${selectedRole} role`,
          variant: 'default',
        });
        return;
      }
      
      // Assign the role
      const { error } = await supabase
        .from('user_roles')
        .insert([
          { user_id: selectedUser.id, role: selectedRole as AppRole }
        ]);
      
      if (error) throw error;
      
      toast({
        title: 'Role Assigned',
        description: `Successfully assigned ${selectedRole} role to ${selectedUser.first_name} ${selectedUser.last_name}`,
        variant: 'default',
      });
      
      // Refresh users list
      fetchUsers();
      setSelectedUser(null);
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign role',
        variant: 'destructive',
      });
    } finally {
      setIsAssigningRole(false);
    }
  };
  
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'association_member':
        return (
          <div className="bg-blue-500/10 text-blue-500 px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <Shield className="w-3 h-3 mr-1" />
            Association
          </div>
        );
      case 'banker':
        return (
          <div className="bg-green-500/10 text-green-500 px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <CreditCard className="w-3 h-3 mr-1" />
            Banker
          </div>
        );
      case 'justice_department':
        return (
          <div className="bg-purple-500/10 text-purple-500 px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <Gavel className="w-3 h-3 mr-1" />
            Justice
          </div>
        );
      default:
        return (
          <div className="bg-gray-500/10 text-gray-500 px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <UserIcon className="w-3 h-3 mr-1" />
            User
          </div>
        );
    }
  };
  
  return (
    <Layout>
      <div className="container px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            View and manage users and their roles in the Moval Society
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <CardCustom>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>All Users</CardTitle>
                  <div className="w-full max-w-xs">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Roles
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {isLoading ? (
                          Array.from({ length: 5 }).map((_, index) => (
                            <tr key={index} className="animate-pulse">
                              <td className="px-4 py-4">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-muted rounded-full mr-3"></div>
                                  <div className="h-4 w-24 bg-muted rounded"></div>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="h-4 w-32 bg-muted rounded"></div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="h-4 w-16 bg-muted rounded"></div>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <div className="h-8 w-20 bg-muted rounded ml-auto"></div>
                              </td>
                            </tr>
                          ))
                        ) : filteredUsers.length > 0 ? (
                          filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-muted/50">
                              <td className="px-4 py-4">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                                    <UserIcon className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <div className="font-medium">{user.first_name} {user.last_name}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm text-muted-foreground">
                                {user.id.substring(0, 8)}...
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex flex-wrap gap-2">
                                  {user.user_roles && user.user_roles.length > 0 ? (
                                    user.user_roles.map((role, index) => (
                                      <div key={index}>
                                        {getRoleBadge(role.role)}
                                      </div>
                                    ))
                                  ) : (
                                    getRoleBadge('user')
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <ButtonCustom
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedUser(user)}
                                >
                                  Assign Role
                                </ButtonCustom>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                              No users found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </CardCustom>
          </div>
          
          <div>
            <CardCustom>
              <CardHeader>
                <CardTitle>Assign Role</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedUser ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                          <UserIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{selectedUser.first_name} {selectedUser.last_name}</div>
                          <div className="text-sm text-muted-foreground">ID: {selectedUser.id.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Role</label>
                      <Select 
                        value={selectedRole}
                        onValueChange={(value) => setSelectedRole(value as AppRole)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="banker">Banker</SelectItem>
                          <SelectItem value="association_member">Association Member</SelectItem>
                          <SelectItem value="justice_department">Justice Department</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex gap-2">
                      <ButtonCustom
                        className="flex-1"
                        onClick={handleAssignRole}
                        disabled={isAssigningRole}
                      >
                        {isAssigningRole ? 'Assigning...' : 'Assign Role'}
                      </ButtonCustom>
                      <ButtonCustom
                        variant="outline"
                        onClick={() => setSelectedUser(null)}
                      >
                        Cancel
                      </ButtonCustom>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a user to assign a role</p>
                  </div>
                )}
              </CardContent>
            </CardCustom>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Users;
