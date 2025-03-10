
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UserWithRole = {
  id: string;
  email: string;
  name: string;
  userRole: "user" | "association_member" | "banker" | "justice_department";
};

const Users = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is an association member, banker, or justice department
    if (user && (user.role === "association_member" || user.role === "banker" || user.role === "justice_department")) {
      fetchUsers();
    } else {
      navigate("/dashboard");
      toast.error("You don't have permission to access this page");
    }
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get all users from the database
      const { data: authUsers, error: authError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name');
      
      if (authError) throw authError;
      
      // Get user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) throw rolesError;
      
      // Map the users with their roles
      const mappedUsers = authUsers.map(profile => {
        const roleData = userRoles.find(r => r.user_id === profile.id);
        return {
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
          email: '', // We don't have access to emails from profiles
          userRole: (roleData?.role || 'user') as "user" | "association_member" | "banker" | "justice_department"
        };
      });
      
      setUsers(mappedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: "user" | "association_member" | "banker" | "justice_department") => {
    try {
      setUpdatingUserId(userId);
      
      // Update the user role in the database
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Update the local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, userRole: newRole } : u
      ));
      
      toast.success("User role updated successfully");
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "association_member": return "bg-blue-500";
      case "banker": return "bg-green-500";
      case "justice_department": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <h1 className="text-2xl font-bold mb-6">User Management</h1>
          <p>Loading users...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">User Management</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <Card key={user.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{user.name}</CardTitle>
                <Badge className={getRoleBadgeColor(user.userRole)}>
                  {user.userRole.replace('_', ' ')}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">
                    Change role:
                  </label>
                  <div className="flex space-x-2">
                    <Select
                      disabled={updatingUserId === user.id}
                      onValueChange={(value) => updateUserRole(user.id, value as "user" | "association_member" | "banker" | "justice_department")}
                      defaultValue={user.userRole}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select role" />
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
            </Card>
          ))}
        </div>
        
        {users.length === 0 && (
          <p className="text-center mt-8 text-gray-500">No users found</p>
        )}
      </div>
    </Layout>
  );
};

export default Users;
