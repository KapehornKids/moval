
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { CardCustom, CardContent, CardHeader, CardTitle } from '@/components/ui/card-custom';
import { ButtonCustom } from '@/components/ui/button-custom';
import { useAuth } from '@/hooks/useAuth';
import { getAnimationClass } from '@/lib/animations';
import { toast } from '@/hooks/use-toast';
import { setupInitialAdminAndElections } from '@/lib/adminUtils';
import { Shield, Users, Gavel } from 'lucide-react';

const AdminSetup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please login to access admin setup",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const handleSetup = async () => {
    setIsLoading(true);
    try {
      const result = await setupInitialAdminAndElections();
      
      if (result.success) {
        toast({
          title: "Setup Complete",
          description: result.message,
        });
        setIsComplete(true);
      } else {
        toast({
          title: "Setup Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error during setup:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during setup",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div className="container px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight animate-fade-in">Admin Setup</h1>
          <p className="text-muted-foreground animate-fade-in">
            Configure initial roles and elections for the Moval Society
          </p>
        </div>

        <CardCustom className={`glass-card ${getAnimationClass("fade", 1)}`}>
          <CardHeader>
            <CardTitle>One-Time Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="mr-4 mt-1">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Admin Role Assignment</h3>
                  <p className="text-muted-foreground">
                    Assign Association Member, Banker, and Justice Department roles to kumarapoorva120021@gmail.com
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-4 mt-1">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Association Election</h3>
                  <p className="text-muted-foreground">
                    Create a new 2-day election for Association Member positions
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-4 mt-1">
                  <Gavel className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Justice Department Election</h3>
                  <p className="text-muted-foreground">
                    Create a new 2-day election for Justice Department positions
                  </p>
                </div>
              </div>
            </div>
            
            {isComplete ? (
              <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                <p className="text-green-600 font-medium">Setup completed successfully!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  The roles have been assigned and elections have been created.
                </p>
                <ButtonCustom
                  variant="glass"
                  className="mt-4"
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard
                </ButtonCustom>
              </div>
            ) : (
              <ButtonCustom
                onClick={handleSetup}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Processing...' : 'Run Setup'}
              </ButtonCustom>
            )}
          </CardContent>
        </CardCustom>
      </div>
    </Layout>
  );
};

export default AdminSetup;
