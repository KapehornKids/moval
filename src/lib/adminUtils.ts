
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types';

export async function setupInitialAdminAndElections() {
  try {
    // Email for the admin user
    const adminEmail = "kumarapoorva120021@gmail.com";
    
    // Find the user by email
    const { data: userQuery, error: userQueryError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', adminEmail)
      .maybeSingle();
    
    if (userQueryError) {
      console.error("User lookup error:", userQueryError);
      return { success: false, message: "User not found. Please make sure the admin email is registered." };
    }
    
    if (!userQuery?.id) {
      return { success: false, message: "User not found. Please make sure the admin email is registered." };
    }
    
    const userId = userQuery.id;
    
    // Assign roles to the admin
    const roles: AppRole[] = ['association_member', 'banker', 'justice_department'];
    
    for (const role of roles) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert([
          { user_id: userId, role }
        ]);
      
      if (roleError) throw roleError;
    }
    
    // Create elections
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
    
    // Create Association Election
    const { error: associationElectionError } = await supabase
      .from('elections')
      .insert([
        {
          title: 'Association Members Election',
          description: 'Election for new Association Members',
          position_type: 'association_member',
          start_date: new Date().toISOString(),
          end_date: twoWeeksFromNow.toISOString(),
          status: 'active'
        }
      ]);
    
    if (associationElectionError) throw associationElectionError;
    
    // Create Justice Department Election
    const { error: justiceElectionError } = await supabase
      .from('elections')
      .insert([
        {
          title: 'Justice Department Election',
          description: 'Election for Justice Department Representatives',
          position_type: 'justice_department',
          start_date: new Date().toISOString(),
          end_date: twoWeeksFromNow.toISOString(),
          status: 'active'
        }
      ]);
    
    if (justiceElectionError) throw justiceElectionError;
    
    return { 
      success: true, 
      message: "Setup completed successfully. Roles assigned to admin and elections created."
    };
  } catch (error) {
    console.error("Setup error:", error);
    return { 
      success: false, 
      message: `Setup failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
