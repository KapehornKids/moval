
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardCustom, CardContent, CardHeader, CardTitle } from "@/components/ui/card-custom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, UserPlus, Edit, UserCheck, UserMinus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const Users = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Check if the current user has admin privileges
    const checkAdminAccess = async () => {
      try {
        const { data, error } = await supabase
          .rpc("has_role", { _user_id: user.id, _role: "association_member" });

        if (error) throw error;

        if (!data) {
          toast.error("You don't have permission to access this page");
          navigate("/dashboard");
          return;
        }
      } catch (error) {
        console.error("Error checking access:", error);
        toast.error("Access verification failed");
        navigate("/dashboard");
      }
    };

    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Fetch profiles with role information
        const { data, error } = await supabase
          .from("profiles")
          .select(`
            id,
            first_name, 
            last_name,
            created_at,
            user_roles!inner(role)
          `);

        if (error) throw error;

        // Map the data to format we need
        const formattedUsers = data.map((profile) => ({
          id: profile.id,
          name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User",
          created_at: new Date(profile.created_at).toLocaleDateString(),
          role: profile.user_roles[0]?.role || "user",
        }));

        setUsers(formattedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess().then(() => fetchUsers());
  }, [user, navigate]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // Update the user's role
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);

      if (error) throw error;

      // Update the local state
      setUsers(
        users.map(u => u.id === userId ? { ...u, role: newRole } : u)
      );

      toast.success("User role updated successfully");
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update user role");
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (!user) return null;

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            View and manage users in the Moval Society
          </p>
        </div>

        <CardCustom className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="mr-2" size={18} />
              Search and Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="association_member">Association</SelectItem>
                  <SelectItem value="banker">Banker</SelectItem>
                  <SelectItem value="justice_department">Justice</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </CardCustom>

        <CardCustom>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserCheck className="mr-2" size={18} />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserMinus className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
                <p>No users found matching your search criteria</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.created_at}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {u.role === "association_member" && (
                              <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                Association
                              </span>
                            )}
                            {u.role === "banker" && (
                              <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Banker
                              </span>
                            )}
                            {u.role === "justice_department" && (
                              <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                Justice
                              </span>
                            )}
                            {u.role === "user" && (
                              <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                                User
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            defaultValue={u.role}
                            onValueChange={(value) => handleRoleChange(u.id, value)}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue placeholder="Change role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="association_member">Association</SelectItem>
                              <SelectItem value="banker">Banker</SelectItem>
                              <SelectItem value="justice_department">Justice</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </CardCustom>
      </div>
    </Layout>
  );
};

export default Users;
