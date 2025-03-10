
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { CardCustom, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card-custom";
import { ButtonCustom } from "@/components/ui/button-custom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getAnimationClass } from "@/lib/animations";
import { ArrowLeft, Copy, Share2 } from "lucide-react";

const ReceiveMoney = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const qrContainerRef = useRef<HTMLDivElement>(null);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to receive money",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [user, navigate, toast]);
  
  // Generate a QR code placeholder (future integration with actual QR code library)
  const userEmail = user?.email || '';
  
  // Handle copy to clipboard
  const handleCopyEmail = () => {
    navigator.clipboard.writeText(userEmail);
    toast({
      title: "Copied!",
      description: "Email copied to clipboard",
    });
  };
  
  return (
    <Layout>
      <div className="container max-w-md px-4 py-12">
        <CardCustom className={getAnimationClass("fade", 1)}>
          <CardHeader>
            <div className="flex items-center">
              <ButtonCustom 
                variant="ghost" 
                size="sm" 
                className="mr-2 p-0 w-8 h-8"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft size={18} />
              </ButtonCustom>
              <CardTitle>Receive Money</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div 
              ref={qrContainerRef}
              className="w-64 h-64 bg-white p-4 rounded-lg border shadow-sm mb-4"
            >
              {/* Placeholder QR code - in a real app, we'd use a QR code generator */}
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-center p-4">
                  QR Code: {userEmail}
                  <br />
                  (Scan to Send Movals)
                </span>
              </div>
            </div>
            
            <div className="w-full mt-4 space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Your Email</p>
                  <p className="font-medium">{userEmail}</p>
                </div>
                <ButtonCustom
                  variant="ghost"
                  size="sm"
                  className="p-0 w-8 h-8"
                  onClick={handleCopyEmail}
                >
                  <Copy size={16} />
                </ButtonCustom>
              </div>
              
              <p className="text-sm text-center text-muted-foreground">
                Share your email or have someone scan this QR code to receive Movals
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <ButtonCustom
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Back
            </ButtonCustom>
            <ButtonCustom
              leftIcon={<Share2 size={16} />}
            >
              Share
            </ButtonCustom>
          </CardFooter>
        </CardCustom>
      </div>
    </Layout>
  );
};

export default ReceiveMoney;
