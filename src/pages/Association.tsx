
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Calendar, BadgeDollarSign } from "lucide-react";

// Election form schema
const electionFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  positionType: z.string().min(1, "Position type is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

// Conversion rate form schema
const conversionFormSchema = z.object({
  rate: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    },
    { message: "Rate must be a positive number" }
  ),
});

// User type
type User = {
  id: string;
  name: string;
  role: string;
};

const Association = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("elections");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [electionLoading, setElectionLoading] = useState(false);
  const [conversionLoading, setConversionLoading] = useState(false);
  const [currentRate, setCurrentRate] = useState<number | null>(null);

  const electionForm = useForm<z.infer<typeof electionFormSchema>>({
    resolver: zodResolver(electionFormSchema),
    defaultValues: {
      title: "",
      description: "",
      positionType: "association_member",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    },
  });

  const conversionForm = useForm<z.infer<typeof conversionFormSchema>>({
    resolver: zodResolver(conversionFormSchema),
    defaultValues: {
      rate: "",
    },
  });

  useEffect(() => {
    // Check if user is an association member
    if (user && user.role === "association_member") {
      fetchUsers();
      fetchCurrentRate();
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
          role: (roleData?.role || 'user') as string
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

  const fetchCurrentRate = async () => {
    try {
      // Get the latest conversion rate
      const { data, error } = await supabase
        .from('conversion_rates')
        .select('moval_to_rupee_rate')
        .order('effective_from', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setCurrentRate(data[0].moval_to_rupee_rate);
        conversionForm.setValue('rate', data[0].moval_to_rupee_rate.toString());
      }
    } catch (error) {
      console.error("Error fetching conversion rate:", error);
      toast.error("Failed to load current conversion rate");
    }
  };

  const onCreateElection = async (values: z.infer<typeof electionFormSchema>) => {
    if (!user) return;
    
    try {
      setElectionLoading(true);
      
      // Create a new election
      const { error } = await supabase
        .from('elections')
        .insert({
          title: values.title,
          description: values.description,
          position_type: values.positionType,
          start_date: new Date(values.startDate).toISOString(),
          end_date: new Date(values.endDate).toISOString(),
          status: 'active'
        });
      
      if (error) throw error;
      
      toast.success("Election created successfully");
      electionForm.reset({
        title: "",
        description: "",
        positionType: "association_member",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      });
    } catch (error) {
      console.error("Error creating election:", error);
      toast.error("Failed to create election");
    } finally {
      setElectionLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // Update the user role in the database
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Update the local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
      
      toast.success("User role updated successfully");
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    }
  };

  const onUpdateConversionRate = async (values: z.infer<typeof conversionFormSchema>) => {
    if (!user) return;
    
    try {
      setConversionLoading(true);
      
      const rate = parseFloat(values.rate);
      
      // Create a new conversion rate
      const { error } = await supabase
        .from('conversion_rates')
        .insert({
          moval_to_rupee_rate: rate,
          created_by: user.id,
          effective_from: new Date().toISOString()
        });
      
      if (error) throw error;
      
      setCurrentRate(rate);
      toast.success("Conversion rate updated successfully");
    } catch (error) {
      console.error("Error updating conversion rate:", error);
      toast.error("Failed to update conversion rate");
    } finally {
      setConversionLoading(false);
    }
  };

  const appointBanker = async (userId: string) => {
    try {
      // Check if user is already a banker
      const user = users.find(u => u.id === userId);
      if (user && user.role === "banker") {
        toast.error("This user is already appointed as a banker");
        return;
      }
      
      // Update the user role to banker
      await updateUserRole(userId, "banker");
      
      toast.success("User appointed as banker successfully");
    } catch (error) {
      console.error("Error appointing banker:", error);
      toast.error("Failed to appoint banker");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <h1 className="text-2xl font-bold mb-6 flex items-center">
            <Building2 className="mr-2" /> Association Management
          </h1>
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <Building2 className="mr-2" /> Association Management
        </h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="elections">Elections</TabsTrigger>
            <TabsTrigger value="bankers">Appoint Banker</TabsTrigger>
            <TabsTrigger value="conversion">Currency Conversion</TabsTrigger>
          </TabsList>
          
          <TabsContent value="elections">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2" /> Create New Election
                </CardTitle>
                <CardDescription>
                  Set up a new election for association members or justice department
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...electionForm}>
                  <form
                    onSubmit={electionForm.handleSubmit(onCreateElection)}
                    className="space-y-4"
                  >
                    <FormField
                      control={electionForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Election Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Q3 Association Member Election" {...field} />
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
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Details about the election" 
                              className="min-h-20"
                              {...field} 
                            />
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
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select position type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="association_member">Association Member</SelectItem>
                              <SelectItem value="justice_department">Justice Department</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      className="w-full mt-2"
                      disabled={electionLoading}
                    >
                      {electionLoading ? "Creating..." : "Create Election"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="bankers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2" /> Appoint Banker
                </CardTitle>
                <CardDescription>
                  Appoint a user to the banker role to manage currency conversion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users
                    .filter(u => u.role !== "banker")
                    .map(user => (
                      <div 
                        key={user.id}
                        className="flex items-center justify-between p-4 border rounded-md hover:bg-gray-50"
                      >
                        <div>
                          <h3 className="font-medium">{user.name}</h3>
                          <p className="text-sm text-gray-500">Current role: {user.role.replace('_', ' ')}</p>
                        </div>
                        <Button 
                          onClick={() => appointBanker(user.id)} 
                          variant="outline"
                        >
                          Appoint as Banker
                        </Button>
                      </div>
                    ))}
                  
                  {users.filter(u => u.role !== "banker").length === 0 && (
                    <p className="text-center py-4 text-gray-500">No eligible users found</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex-col items-start">
                <h3 className="font-medium mb-2">Current Bankers</h3>
                <div className="w-full">
                  {users
                    .filter(u => u.role === "banker")
                    .map(user => (
                      <div 
                        key={user.id}
                        className="flex items-center justify-between p-3 border rounded-md mb-2 bg-green-50"
                      >
                        <span className="font-medium">{user.name}</span>
                        <Button 
                          onClick={() => updateUserRole(user.id, "user")} 
                          variant="ghost" 
                          size="sm"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  
                  {users.filter(u => u.role === "banker").length === 0 && (
                    <p className="text-center py-2 text-gray-500">No bankers appointed</p>
                  )}
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="conversion">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BadgeDollarSign className="mr-2" /> Moval Currency Conversion
                </CardTitle>
                <CardDescription>
                  Set the conversion rate between Movals and rupees
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 p-4 bg-gray-50 rounded-md">
                  <h3 className="font-medium mb-1">Current Conversion Rate</h3>
                  <p className="text-2xl font-bold">
                    {currentRate !== null ? (
                      <>1 Moval = {currentRate} Rupees</>
                    ) : (
                      "No conversion rate set"
                    )}
                  </p>
                </div>
                
                <Form {...conversionForm}>
                  <form
                    onSubmit={conversionForm.handleSubmit(onUpdateConversionRate)}
                    className="space-y-4"
                  >
                    <FormField
                      control={conversionForm.control}
                      name="rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Conversion Rate (Rupees per Moval)</FormLabel>
                          <FormDescription>
                            Set how many rupees one Moval is worth
                          </FormDescription>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g. 10" 
                              step="0.01"
                              min="0.01"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={conversionLoading}
                    >
                      {conversionLoading ? "Updating..." : "Update Conversion Rate"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Association;
