
import { supabase } from "@/integrations/supabase/client";

/**
 * Assigns multiple roles to a user by email
 */
export const assignRolesToUserByEmail = async (
  email: string, 
  roles: Array<"user" | "association_member" | "banker" | "justice_department">
): Promise<{ success: boolean; message: string }> => {
  try {
    // First, find the user ID associated with the email
    const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(email);
    
    if (userError || !userData) {
      console.error("Error finding user:", userError);
      return { 
        success: false, 
        message: `Unable to find user with email ${email}` 
      };
    }
    
    const userId = userData.id;
    
    // Check existing roles for the user
    const { data: existingRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
      
    if (rolesError) {
      console.error("Error fetching existing roles:", rolesError);
      return { 
        success: false, 
        message: "Failed to check existing roles" 
      };
    }
    
    // Extract existing role values
    const existingRoleValues = existingRoles.map(r => r.role);
    
    // Filter out roles that the user already has
    const newRoles = roles.filter(role => !existingRoleValues.includes(role));
    
    if (newRoles.length === 0) {
      return { 
        success: true, 
        message: "User already has all the specified roles" 
      };
    }
    
    // Prepare role entries for insertion
    const roleEntries = newRoles.map(role => ({
      user_id: userId,
      role
    }));
    
    // Insert new roles
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert(roleEntries);
      
    if (insertError) {
      console.error("Error assigning roles:", insertError);
      return { 
        success: false, 
        message: "Failed to assign roles" 
      };
    }
    
    return { 
      success: true, 
      message: `Successfully assigned roles to ${email}` 
    };
  } catch (error) {
    console.error("Error in assignRolesToUserByEmail:", error);
    return { 
      success: false, 
      message: "An unexpected error occurred" 
    };
  }
};

/**
 * Creates a new election
 */
export const createElection = async (
  title: string,
  description: string,
  positionType: string,
  startDate: Date,
  endDate: Date
): Promise<{ success: boolean; message: string }> => {
  try {
    const { error } = await supabase
      .from('elections')
      .insert({
        title,
        description,
        position_type: positionType,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'upcoming'
      });
      
    if (error) {
      console.error("Error creating election:", error);
      return { 
        success: false, 
        message: "Failed to create election" 
      };
    }
    
    return { 
      success: true, 
      message: `Successfully created ${positionType} election` 
    };
  } catch (error) {
    console.error("Error in createElection:", error);
    return { 
      success: false, 
      message: "An unexpected error occurred while creating the election" 
    };
  }
};

/**
 * Set up initial admin roles and elections
 */
export const setupInitialAdminAndElections = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // 1. Assign roles to the specified email
    const email = "kumarapoorva120021@gmail.com";
    const roles: Array<"user" | "association_member" | "banker" | "justice_department"> = [
      "association_member", 
      "banker", 
      "justice_department"
    ];
    
    const rolesResult = await assignRolesToUserByEmail(email, roles);
    if (!rolesResult.success) {
      return rolesResult;
    }
    
    // 2. Create elections for Association Member and Justice Department
    // Calculate dates for 2-day election period
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 2); // 2 days from now
    
    // Create Association Member election
    const associationElectionResult = await createElection(
      "Association Member Election 2023",
      "Election for new association members for the Moval Society",
      "association_member",
      startDate,
      endDate
    );
    
    if (!associationElectionResult.success) {
      return associationElectionResult;
    }
    
    // Create Justice Department election
    const justiceElectionResult = await createElection(
      "Justice Department Election 2023",
      "Election for new justice department members for the Moval Society",
      "justice_department",
      startDate,
      endDate
    );
    
    if (!justiceElectionResult.success) {
      return justiceElectionResult;
    }
    
    return {
      success: true,
      message: "Successfully set up admin roles and created elections"
    };
  } catch (error) {
    console.error("Error in setupInitialAdminAndElections:", error);
    return {
      success: false,
      message: "An unexpected error occurred during setup"
    };
  }
};
