
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { CardCustom, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card-custom';
import { ButtonCustom } from '@/components/ui/button-custom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getAnimationClass } from '@/lib/animations';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types';
import { ChevronDown, Search, User, UserCog } from 'lucide-react';

interface UserData {
  id: string;
  first_name: string;
  last_name: string;
  user_roles: { role: string }[];
}

const Users = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = async () => {
      const hasAssociationRole = await hasRole('association_member');
      if (!hasAssociationRole) {
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
  }, [hasRole, navigate]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      // Get all users with their roles
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          user_roles (role)
        `);
        
      if (error) throw error;
      
      // Convert to the right format for our component
      const processedData = data?.map(user => ({
        ...user,
        user_roles: Array.isArray(user.user_roles) ? user.user_roles : [] 
      })) || [];
      
      setUsers(processedData as UserData[]);
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

  const handleAssignRole = async (userId: string, role: AppRole) => {
    try {
      // First check if the user already has this role
      const user = users.find(u => u.id === userId);
      if (user && user.user_roles && Array.isArray(user.user_roles)) {
        const hasRole = user.user_roles.some(r => r.role === role);
        if (hasRole) {
          toast({
            title: 'Role Already Assigned',
            description: `User already has the ${role} role`,
          });
          return;
        }
      }
      
      // If not, assign the role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role
        });
        
      if (error) throw error;
      
      toast({
        title: 'Role Assigned',
        description: `Successfully assigned ${role} role to user`,
      });
      
      // Refresh the users list
      fetchUsers();
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign role',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);
        
      if (error) throw error;
      
      toast({
        title: 'Role Removed',
        description: `Successfully removed ${role} role from user`,
      });
      
      // Refresh the users list
      fetchUsers();
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove role',
        variant: 'destructive',
      });
    }
  };

  // Filter users based on search and selected tab
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' || 
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (selectedTab === 'all') {
      return matchesSearch;
    } else {
      const hasRole = user.user_roles && Array.isArray(user.user_roles) && 
        user.user_roles.some(r => r.role === selectedTab);
      return matchesSearch && hasRole;
    }
  });

  return (
    <Layout>
      <div className="container px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight animate-fade-in">User Management</h1>
          <p className="text-muted-foreground animate-fade-in">
            View and manage users and their roles
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="all">All Users</TabsTrigger>
              <TabsTrigger value="banker">Bankers</TabsTrigger>
              <TabsTrigger value="justice_department">Justice</TabsTrigger>
              <TabsTrigger value="association_member">Association</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div 
                key={index}
                className="animate-pulse p-6 rounded-lg border h-36"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20"></div>
                  <div>
                    <div className="h-4 w-24 bg-primary/20 rounded mb-2"></div>
                    <div className="h-3 w-16 bg-primary/10 rounded"></div>
                  </div>
                </div>
              </div>
            ))
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <CardCustom key={user.id} className={`glass-card ${getAnimationClass("fade", 1)}`}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{user.first_name} {user.last_name}</h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {user.user_roles && Array.isArray(user.user_roles) && user.user_roles.map((role, idx) => (
                            <div 
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
                            >
                              {role.role}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative group">
                      <ButtonCustom
                        variant="ghost"
                        size="sm"
                        className="focus:ring-0"
                      >
                        <UserCog size={16} className="text-muted-foreground" />
                      </ButtonCustom>
                      <div className="absolute right-0 mt-2 w-48 py-2 bg-background border rounded-md shadow-lg z-10 hidden group-hover:block">
                        <div className="px-4 py-2 text-xs font-semibold text-muted-foreground">
                          Assign Roles
                        </div>
                        <button
                          className="block w-full px-4 py-2 text-left text-sm hover:bg-accent"
                          onClick={() => handleAssignRole(user.id, 'banker')}
                        >
                          Assign Banker Role
                        </button>
                        <button
                          className="block w-full px-4 py-2 text-left text-sm hover:bg-accent"
                          onClick={() => handleAssignRole(user.id, 'justice_department')}
                        >
                          Assign Justice Role
                        </button>
                        <button
                          className="block w-full px-4 py-2 text-left text-sm hover:bg-accent"
                          onClick={() => handleAssignRole(user.id, 'association_member')}
                        >
                          Assign Association Role
                        </button>
                        
                        <div className="border-t my-2"></div>
                        
                        <div className="px-4 py-2 text-xs font-semibold text-muted-foreground">
                          Remove Roles
                        </div>
                        
                        {user.user_roles && Array.isArray(user.user_roles) && user.user_roles.map((role, idx) => (
                          <button
                            key={idx}
                            className="block w-full px-4 py-2 text-left text-sm hover:bg-accent text-red-500"
                            onClick={() => handleRemoveRole(user.id, role.role)}
                          >
                            Remove {role.role}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CardCustom>
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <UserCog className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Users Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'No users match your search criteria.' : 'No users available.'}
              </p>
              <ButtonCustom onClick={() => setSearchQuery('')}>
                Clear Search
              </ButtonCustom>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Users;
