
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { UserRound, Shield, Building, Users as UsersIcon } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { CardCustom, CardHeader, CardTitle, CardContent } from "@/components/ui/card-custom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type UserData = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  user_roles: { role: string }[];
};

const UsersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Check if current user is association member or justice department
        const { data: isAssociation, error: associationError } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: "association_member" as "user" | "association_member" | "banker" | "justice_department"
        });
        
        const { data: isJustice, error: justiceError } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: "justice_department" as "user" | "association_member" | "banker" | "justice_department"
        });
        
        if (associationError) throw associationError;
        if (justiceError) throw justiceError;
        
        if (!isAssociation && !isJustice) {
          toast.error("You don't have permission to view this page");
          navigate("/dashboard");
          return;
        }
        
        // Fetch all users
        const { data: usersData, error: usersError } = await supabase
          .from("profiles")
          .select(`
            id,
            first_name,
            last_name,
            user_roles (
              role
            )
          `);
          
        if (usersError) throw usersError;
        
        setUsers(usersData || []);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load users");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user, navigate]);
  
  const getUserRoles = (userData: UserData) => {
    return userData.user_roles.map(role => role.role);
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Users Management</h1>
        
        <Tabs defaultValue="all">
          <TabsList className="mb-8">
            <TabsTrigger value="all" className="flex items-center">
              <UsersIcon size={16} className="mr-2" />
              <span>All Users</span>
            </TabsTrigger>
            <TabsTrigger value="association" className="flex items-center">
              <Shield size={16} className="mr-2" />
              <span>Association</span>
            </TabsTrigger>
            <TabsTrigger value="banker" className="flex items-center">
              <Building size={16} className="mr-2" />
              <span>Bankers</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((userData) => (
                <CardCustom key={userData.id} className="hover:shadow transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary mr-3">
                        <UserRound size={20} />
                      </div>
                      <CardTitle className="text-lg">
                        {userData.first_name} {userData.last_name}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {getUserRoles(userData).map((role, idx) => (
                        <span 
                          key={idx} 
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => navigate(`/profile/${userData.id}`)}
                    >
                      View Profile
                    </Button>
                  </CardContent>
                </CardCustom>
              ))}
              
              {users.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">No users found</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="association">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users
                .filter(u => getUserRoles(u).includes("association_member"))
                .map((userData) => (
                  <CardCustom key={userData.id} className="hover:shadow transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary mr-3">
                          <Shield size={20} />
                        </div>
                        <CardTitle className="text-lg">
                          {userData.first_name} {userData.last_name}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {getUserRoles(userData).map((role, idx) => (
                          <span 
                            key={idx} 
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => navigate(`/profile/${userData.id}`)}
                      >
                        View Profile
                      </Button>
                    </CardContent>
                  </CardCustom>
                ))}
              
              {users.filter(u => getUserRoles(u).includes("association_member")).length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">No association members found</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="banker">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users
                .filter(u => getUserRoles(u).includes("banker"))
                .map((userData) => (
                  <CardCustom key={userData.id} className="hover:shadow transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary mr-3">
                          <Building size={20} />
                        </div>
                        <CardTitle className="text-lg">
                          {userData.first_name} {userData.last_name}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {getUserRoles(userData).map((role, idx) => (
                          <span 
                            key={idx} 
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => navigate(`/profile/${userData.id}`)}
                      >
                        View Profile
                      </Button>
                    </CardContent>
                  </CardCustom>
                ))}
              
              {users.filter(u => getUserRoles(u).includes("banker")).length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">No bankers found</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default UsersPage;
