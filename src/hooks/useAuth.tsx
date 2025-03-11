
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "banker" | "justice" | "association";
  walletBalance: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasRole: (role: "user" | "association_member" | "banker" | "justice_department") => Promise<boolean>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if a user has a specific role
  const hasRole = async (role: "user" | "association_member" | "banker" | "justice_department"): Promise<boolean> => {
    try {
      if (!user) return false;
      
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: role
      });
      
      if (error) {
        console.error("Error checking role:", error);
        return false;
      }
      
      return data || false;
    } catch (error) {
      console.error("Error in hasRole:", error);
      return false;
    }
  };

  // Fetch wallet balance for the user
  const fetchWalletBalance = async (userId: string): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error("Error fetching wallet balance:", error);
        return 0;
      }

      return data?.balance || 0;
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      return 0;
    }
  };

  // Fetch user role
  const fetchUserRole = async (userId: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error("Error fetching user role:", error);
        return 'user';
      }

      return data?.role || 'user';
    } catch (error) {
      console.error("Error fetching user role:", error);
      return 'user';
    }
  };

  // Fetch user profile data
  const fetchUserProfile = async (userId: string): Promise<{ first_name: string; last_name: string }> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        return { first_name: '', last_name: '' };
      }

      return { 
        first_name: data?.first_name || '', 
        last_name: data?.last_name || '' 
      };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return { first_name: '', last_name: '' };
    }
  };

  const updateUserData = async () => {
    const session = await supabase.auth.getSession();
    const currentUser = session?.data?.session?.user;
    
    if (!currentUser) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const [walletBalance, userRole, profile] = await Promise.all([
        fetchWalletBalance(currentUser.id),
        fetchUserRole(currentUser.id),
        fetchUserProfile(currentUser.id)
      ]);

      const userName = profile.first_name && profile.last_name 
        ? `${profile.first_name} ${profile.last_name}` 
        : currentUser.email || 'User';

      setUser({
        id: currentUser.id,
        name: userName,
        email: currentUser.email || '',
        role: userRole as "user" | "banker" | "justice" | "association",
        walletBalance
      });
    } catch (error) {
      console.error("Error updating user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize user state on load and setup auth listener
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      
      // Get current session
      await updateUserData();
      
      // Listen for auth changes
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await updateUserData();
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
          }
        }
      );

      return () => {
        authListener.subscription.unsubscribe();
      };
    };

    initAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      await updateUserData();
      toast({
        title: "Success",
        description: "You have been logged in successfully",
      });
    } catch (error: any) {
      console.error("Login failed:", error);
      toast({
        title: "Login failed",
        description: error.message || "Unable to login with those credentials",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // Split name into first and last name
      const nameParts = name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });

      if (error) throw error;
      
      toast({
        title: "Registration successful",
        description: "Your account has been created successfully",
      });
      
      await updateUserData();
    } catch (error: any) {
      console.error("Registration failed:", error);
      toast({
        title: "Registration failed",
        description: error.message || "Unable to create your account",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error: any) {
      console.error("Logout failed:", error);
      toast({
        title: "Logout failed",
        description: error.message || "Unable to log you out",
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    hasRole,
    login,
    register,
    logout,
    updateUserData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
