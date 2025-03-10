
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { User, Edit, Save, Lock, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CardCustom, CardContent, CardHeader, CardTitle } from "@/components/ui/card-custom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(8, "Password must be at least 8 characters"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const ProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, updateUserData } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
    },
  });
  
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const profileId = id || user.id;
      setIsOwnProfile(profileId === user.id);
      
      try {
        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", profileId)
          .single();
          
        if (profileError) throw profileError;
        
        // Fetch user roles
        const { data: rolesData, error: rolesError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", profileId);
          
        if (rolesError) throw rolesError;
        
        // Update form
        profileForm.reset({
          firstName: profileData.first_name || "",
          lastName: profileData.last_name || "",
        });
        
        setUserRoles(rolesData.map(r => r.role));
        
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
        navigate("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [user, id, navigate]);
  
  const updateProfile = async (data: z.infer<typeof profileSchema>) => {
    if (!user) return;
    
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id || user.id);
        
      if (error) throw error;
      
      toast.success("Profile updated successfully");
      setIsEditing(false);
      
      if (isOwnProfile) {
        await updateUserData();
      }
      
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };
  
  const updatePassword = async (data: z.infer<typeof passwordSchema>) => {
    if (!user) return;
    
    setIsUpdating(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      });
      
      if (error) throw error;
      
      toast.success("Password updated successfully");
      passwordForm.reset();
      
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Failed to update password");
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleGoBack = () => {
    navigate(-1);
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container max-w-3xl py-8 px-4">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6"
          onClick={handleGoBack}
        >
          <ArrowLeft size={16} className="mr-2" /> Back
        </Button>
        
        <div className="flex items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary mr-4">
            <User size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              {profileForm.watch("firstName")} {profileForm.watch("lastName")}
            </h1>
            <div className="flex flex-wrap gap-1 mt-2">
              {userRoles.map((role, idx) => (
                <span 
                  key={idx} 
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
          
          {isOwnProfile && !isEditing && (
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-auto"
              onClick={() => setIsEditing(true)}
            >
              <Edit size={16} className="mr-2" /> Edit Profile
            </Button>
          )}
        </div>
        
        {isOwnProfile ? (
          <Tabs defaultValue="profile">
            <TabsList className="mb-6">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <CardCustom>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Profile Information</CardTitle>
                    {isEditing && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form className="space-y-4" onSubmit={profileForm.handleSubmit(updateProfile)}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  disabled={!isEditing}
                                  placeholder="Enter your first name" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  disabled={!isEditing}
                                  placeholder="Enter your last name" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {isEditing && (
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            "Updating..."
                          ) : (
                            <>
                              <Save size={16} className="mr-2" /> 
                              Save Changes
                            </>
                          )}
                        </Button>
                      )}
                    </form>
                  </Form>
                </CardContent>
              </CardCustom>
            </TabsContent>
            
            <TabsContent value="security">
              <CardCustom>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form className="space-y-4" onSubmit={passwordForm.handleSubmit(updatePassword)}>
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Enter your current password" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Enter your new password" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Confirm your new password" 
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
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          "Updating..."
                        ) : (
                          <>
                            <Lock size={16} className="mr-2" /> 
                            Update Password
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </CardCustom>
            </TabsContent>
          </Tabs>
        ) : (
          <CardCustom>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    First Name
                  </h3>
                  <p className="text-foreground">
                    {profileForm.watch("firstName")}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Last Name
                  </h3>
                  <p className="text-foreground">
                    {profileForm.watch("lastName")}
                  </p>
                </div>
              </div>
            </CardContent>
          </CardCustom>
        )}
      </div>
    </Layout>
  );
};

export default ProfilePage;
