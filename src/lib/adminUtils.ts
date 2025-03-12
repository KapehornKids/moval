
import { supabase } from '@/integrations/supabase/client';

export async function setupInitialAdminAndElections() {
  try {
    // Email for the admin user
    const adminEmail = "kumarapoorva120021@gmail.com";
    
    // Find the user by email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', adminEmail)
      .single();
    
    if (userError) {
      if (userError.code === 'PGRST116') {
        return { success: false, message: "User not found. Please make sure the admin email is registered." };
      }
      throw userError;
    }
    
    const userId = userData.id;
    
    // Assign roles to the admin
    const roles = ['association_member', 'banker', 'justice_department'];
    
    for (const role of roles) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert([
          { user_id: userId, role_name: role }
        ]);
      
      if (roleError) throw roleError;
    }
    
    // Create elections
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 2);
    
    // Create Association Election
    const { error: associationElectionError } = await supabase
      .from('elections')
      .insert([
        {
          title: 'Association Members Election',
          description: 'Election for new Association Members',
          role_type: 'association_member',
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
          role_type: 'justice_department',
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
