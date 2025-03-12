
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Users, UserCheck, Calendar, Building, Coins, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/layout/Layout";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardCustom, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card-custom";
import { getAnimationClass } from "@/lib/animations";

const conversionRateSchema = z.object({
  movalToRupeeRate: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    },
    { message: "Rate must be a positive number" }
  ),
});

const electionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  positionType: z.string().min(3, "Position type is required"),
  startDate: z.string().refine(val => !!val, { message: "Start date is required" }),
  endDate: z.string().refine(val => !!val, { message: "End date is required" }),
});

interface User {
  id: string;
  first_name: string;
  last_name: string;
  user_roles: { role: string }[];
}

const AssociationPage = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [roleType, setRoleType] = useState<"banker" | "justice_department">("banker");
  const [currentConversionRate, setCurrentConversionRate] = useState<number | null>(null);
  const [updatingRate, setUpdatingRate] = useState(false);
  const [creatingElection, setCreatingElection] = useState(false);
  const [activeElections, setActiveElections] = useState<any[]>([]);
  
  const conversionForm = useForm<z.infer<typeof conversionRateSchema>>({
    resolver: zodResolver(conversionRateSchema),
    defaultValues: {
      movalToRupeeRate: "",
    },
  });
  
  const electionForm = useForm<z.infer<typeof electionSchema>>({
    resolver: zodResolver(electionSchema),
    defaultValues: {
      title: "",
      description: "",
      positionType: "",
      startDate: "",
      endDate: "",
    },
  });
  
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
          description: "You don't have permission to access the Association Management",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      fetchData();
    };

    checkAccess();
  }, [user, navigate, hasRole]);
  
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
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
      
      // Fetch current conversion rate
      const { data: rateData, error: rateError } = await supabase
        .from("conversion_rates")
        .select("moval_to_rupee_rate")
        .order("effective_from", { ascending: false })
        .limit(1)
        .single();
        
      if (!rateError && rateData) {
        setCurrentConversionRate(rateData.moval_to_rupee_rate);
        conversionForm.setValue("movalToRupeeRate", rateData.moval_to_rupee_rate.toString());
      }
      
      // Fetch active elections
      const { data: electionsData, error: electionsError } = await supabase
        .from("elections")
        .select("*")
        .or("status.eq.active,status.eq.upcoming")
        .order("start_date", { ascending: true });
        
      if (!electionsError) {
        setActiveElections(electionsData || []);
      }
      
      setUsers(usersData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId === selectedUser ? null : userId);
  };
  
  const assignRole = async () => {
    if (!selectedUser || !user) return;
    
    try {
      // First check if user already has this role
      const { data: existingRole, error: roleCheckError } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", selectedUser)
        .eq("role", roleType)
        .maybeSingle();
        
      if (roleCheckError) throw roleCheckError;
      
      if (existingRole) {
        toast({
          title: "Info",
          description: `User already has the ${roleType} role`,
        });
        return;
      }
      
      // Assign the new role
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({
          user_id: selectedUser,
          role: roleType
        });
        
      if (insertError) throw insertError;
      
      toast({
        title: "Success",
        description: `Successfully assigned ${roleType} role`,
      });
      
      // Refresh user list
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
      console.error("Error assigning role:", error);
      toast({
        title: "Error",
        description: "Failed to assign role",
        variant: "destructive",
      });
    }
  };
  
  const updateConversionRate = async (data: z.infer<typeof conversionRateSchema>) => {
    if (!user) return;
    
    setUpdatingRate(true);
    
    try {
      const rate = parseFloat(data.movalToRupeeRate);
      
      const { error } = await supabase
        .from("conversion_rates")
        .insert({
          moval_to_rupee_rate: rate,
          created_by: user.id
        });
        
      if (error) throw error;
      
      setCurrentConversionRate(rate);
      toast({
        title: "Success",
        description: "Conversion rate updated successfully",
      });
      
    } catch (error) {
      console.error("Error updating conversion rate:", error);
      toast({
        title: "Error",
        description: "Failed to update conversion rate",
        variant: "destructive",
      });
    } finally {
      setUpdatingRate(false);
    }
  };
  
  const createElection = async (data: z.infer<typeof electionSchema>) => {
    if (!user) return;
    
    setCreatingElection(true);
    
    try {
      const { error } = await supabase
        .from("elections")
        .insert({
          title: data.title,
          description: data.description || null,
          position_type: data.positionType,
          start_date: new Date(data.startDate).toISOString(),
          end_date: new Date(data.endDate).toISOString(),
          status: "upcoming"
        });
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Election created successfully",
      });
      electionForm.reset();
      
      // Refresh elections
      const { data: electionsData, error: electionsError } = await supabase
        .from("elections")
        .select("*")
        .or("status.eq.active,status.eq.upcoming")
        .order("start_date", { ascending: true });
        
      if (!electionsError) {
        setActiveElections(electionsData || []);
      }
      
    } catch (error) {
      console.error("Error creating election:", error);
      toast({
        title: "Error",
        description: "Failed to create election",
        variant: "destructive",
      });
    } finally {
      setCreatingElection(false);
    }
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
      <div className="container px-4 md:px-6 py-8">
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex items-center gap-2">
            <Building className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Association Management</h1>
          </div>
          <p className="text-muted-foreground">
            Manage the society's roles, economy, and elections
          </p>
        </div>
        
        <Tabs defaultValue="members">
          <TabsList className="mb-8">
            <TabsTrigger value="members" className="flex items-center">
              <Users size={16} className="mr-2" />
              <span>Assign Roles</span>
            </TabsTrigger>
            <TabsTrigger value="conversion" className="flex items-center">
              <Coins size={16} className="mr-2" />
              <span>Conversion Rate</span>
            </TabsTrigger>
            <TabsTrigger value="elections" className="flex items-center">
              <Calendar size={16} className="mr-2" />
              <span>Elections</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="members">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <CardCustom className={getAnimationClass("fade", 0)}>
                  <CardHeader>
                    <CardTitle>Society Members</CardTitle>
                    <CardDescription>
                      Assign banker or justice department roles to members
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {users.length > 0 ? (
                        users.map((user) => (
                          <div 
                            key={user.id}
                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedUser === user.id ? 'bg-primary/10' : 'hover:bg-accent'}`}
                            onClick={() => handleUserSelect(user.id)}
                          >
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary mr-4">
                                {user.first_name?.[0] || ''}
                                {user.last_name?.[0] || ''}
                              </div>
                              <div>
                                <h3 className="font-medium">{user.first_name} {user.last_name}</h3>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {user.user_roles?.map((role, idx) => (
                                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                                      {role.role}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            {selectedUser === user.id && (
                              <UserCheck size={20} className="text-primary" />
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No users found</p>
                      )}
                    </div>
                  </CardContent>
                </CardCustom>
              </div>
              
              <div>
                <CardCustom className={getAnimationClass("fade", 1)}>
                  <CardHeader>
                    <CardTitle>Assign Role</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-col space-y-2">
                        <label className="text-sm font-medium">Role Type</label>
                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            variant={roleType === "banker" ? "default" : "outline"}
                            onClick={() => setRoleType("banker")}
                            className="flex-1"
                          >
                            <Building size={16} className="mr-2" />
                            Banker
                          </Button>
                          <Button
                            type="button"
                            variant={roleType === "justice_department" ? "default" : "outline"}
                            onClick={() => setRoleType("justice_department")}
                            className="flex-1"
                          >
                            <Settings size={16} className="mr-2" />
                            Justice
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      disabled={!selectedUser}
                      onClick={assignRole}
                    >
                      Assign Role
                    </Button>
                  </CardFooter>
                </CardCustom>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="conversion">
            <div className="max-w-md mx-auto">
              <CardCustom className={getAnimationClass("fade", 0)}>
                <CardHeader>
                  <CardTitle>Moval to Rupee Conversion Rate</CardTitle>
                  <CardDescription>
                    Set the current conversion rate between Movals and rupees
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...conversionForm}>
                    <form className="space-y-4" onSubmit={conversionForm.handleSubmit(updateConversionRate)}>
                      <FormField
                        control={conversionForm.control}
                        name="movalToRupeeRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>1 Moval = ? Rupees</FormLabel>
                            <FormControl>
                              <Input placeholder="0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {currentConversionRate && (
                        <div className="text-sm text-muted-foreground">
                          Current rate: 1 Moval = {currentConversionRate} Rupees
                        </div>
                      )}
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={updatingRate}
                      >
                        {updatingRate ? "Updating..." : "Update Rate"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </CardCustom>
            </div>
          </TabsContent>
          
          <TabsContent value="elections">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <CardCustom className={getAnimationClass("fade", 0)}>
                  <CardHeader>
                    <CardTitle>Create New Election</CardTitle>
                    <CardDescription>
                      Set up a new election for society positions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...electionForm}>
                      <form className="space-y-4" onSubmit={electionForm.handleSubmit(createElection)}>
                        <FormField
                          control={electionForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Election Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Spring 2023 Elections" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={electionForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Election details..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={electionForm.control}
                          name="positionType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Position Type</FormLabel>
                              <FormControl>
                                <select
                                  {...field}
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <option value="">Select a position type</option>
                                  <option value="association_member">Association Member</option>
                                  <option value="banker">Banker</option>
                                  <option value="justice_department">Justice Department</option>
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={electionForm.control}
                            name="startDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Start Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={electionForm.control}
                            name="endDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>End Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={creatingElection}
                        >
                          {creatingElection ? "Creating..." : "Create Election"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </CardCustom>
              </div>
              
              <div>
                <CardCustom className={getAnimationClass("fade", 1)}>
                  <CardHeader>
                    <CardTitle>Active Elections</CardTitle>
                    <CardDescription>
                      Currently active or upcoming elections
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activeElections.length > 0 ? (
                      <div className="space-y-4">
                        {activeElections.map((election, idx) => (
                          <div 
                            key={election.id}
                            className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-medium">{election.title}</h3>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                                {election.status}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {election.description || "No description provided"}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground">Position:</p>
                                <p>{election.position_type}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Dates:</p>
                                <p>
                                  {new Date(election.start_date).toLocaleDateString()} - {new Date(election.end_date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8">
                        <Calendar className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground text-center">
                          No active elections at this time
                        </p>
                      </div>
                    )}
                  </CardContent>
                </CardCustom>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AssociationPage;
