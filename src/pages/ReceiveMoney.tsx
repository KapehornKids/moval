
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { CardCustom, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card-custom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getAnimationClass } from "@/lib/animations";
import { ArrowLeft, Copy, QrCode, Share2, Download } from "lucide-react";
import QRCode from "qrcode.react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

const ReceiveMoney = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const [userInfo, setUserInfo] = useState<{
    email: string | null;
    walletAddress: string;
    name: string;
  }>({
    email: '',
    walletAddress: '',
    name: ''
  });
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to receive money",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    
    const fetchUserInfo = async () => {
      try {
        // Get wallet info
        const { data: walletData, error: walletError } = await supabase
          .from('wallets')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (walletError) {
          console.error('Error fetching wallet:', walletError);
          throw walletError;
        }
        
        // Get profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          throw profileError;
        }
        
        // Get email from auth
        const authData = await supabase.auth.getUser();
        const email = authData.data?.user?.email;
        
        const fullName = `${profileData?.first_name || ''} ${profileData?.last_name || ''}`.trim();
        
        setUserInfo({
          email,
          walletAddress: walletData.id || user.id,
          name: fullName || user.name || 'User'
        });
      } catch (error) {
        console.error('Error setting up receive money page:', error);
        toast({
          title: 'Error',
          description: 'Unable to load your information. Please try again.',
          variant: 'destructive',
        });
      }
    };
    
    fetchUserInfo();
  }, [user, navigate, toast]);
  
  // Handle copy to clipboard
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };
  
  // Handle download QR code
  const handleDownloadQR = () => {
    const canvas = document.getElementById('user-qr-code') as HTMLCanvasElement;
    if (!canvas) return;
    
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `${userInfo.name.replace(/\s+/g, '_')}_wallet_qr.png`;
    link.click();
  };
  
  // Handle share
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Moval Wallet',
          text: `Send Movals to me: ${userInfo.email}`,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      toast({
        title: "Sharing not supported",
        description: "Your browser does not support the Web Share API",
      });
    }
  };
  
  const qrValue = JSON.stringify({
    type: "moval_send",
    recipient: userInfo.email,
    name: userInfo.name,
    wallet: userInfo.walletAddress
  });
  
  return (
    <Layout>
      <div className="container max-w-md px-4 py-12">
        <CardCustom className={getAnimationClass("fade", 1)}>
          <CardHeader>
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                className="mr-2 p-0 w-8 h-8"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft size={18} />
              </Button>
              <CardTitle>Receive Money</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Tabs defaultValue="qrcode" className="w-full">
              <TabsList className="w-full mb-6">
                <TabsTrigger value="qrcode" className="flex-1">
                  <QrCode size={16} className="mr-2" />
                  QR Code
                </TabsTrigger>
                <TabsTrigger value="details" className="flex-1">
                  <Copy size={16} className="mr-2" />
                  Details
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="qrcode" className="flex flex-col items-center">
                <div 
                  ref={qrContainerRef}
                  className="w-64 h-64 bg-white p-6 rounded-lg shadow-sm mb-4 flex items-center justify-center"
                >
                  <QRCode
                    id="user-qr-code"
                    value={qrValue}
                    size={240}
                    level="H"
                    includeMargin={false}
                    renderAs="canvas"
                  />
                </div>
                
                <p className="text-sm text-center mb-4">
                  Scan this QR code to receive Movals
                </p>
                
                <Button 
                  variant="outline" 
                  className="flex items-center mb-2 w-full justify-center"
                  onClick={handleDownloadQR}
                >
                  <Download size={16} className="mr-2" />
                  Download QR Code
                </Button>
                
                <Button 
                  variant="outline"
                  className="flex items-center w-full justify-center"
                  onClick={handleShare}
                >
                  <Share2 size={16} className="mr-2" />
                  Share QR Code
                </Button>
              </TabsContent>
              
              <TabsContent value="details">
                <div className="space-y-4 w-full">
                  <div className="glass-card p-4 rounded-lg space-y-1">
                    <p className="text-sm text-muted-foreground">Name</p>
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{userInfo.name}</p>
                    </div>
                  </div>
                  
                  <div className="glass-card p-4 rounded-lg space-y-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{userInfo.email}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 w-8 h-8"
                        onClick={() => userInfo.email && handleCopy(userInfo.email, 'Email')}
                      >
                        <Copy size={16} />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="glass-card p-4 rounded-lg space-y-1">
                    <p className="text-sm text-muted-foreground">Wallet Address</p>
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate max-w-[200px]">
                        {userInfo.walletAddress}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 w-8 h-8"
                        onClick={() => handleCopy(userInfo.walletAddress, 'Wallet Address')}
                      >
                        <Copy size={16} />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="glass-card p-4 rounded-lg">
                    <p className="text-sm text-center text-muted-foreground">
                      Share these details with someone to receive Movals
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
            <Button
              onClick={() => navigate('/send-money')}
            >
              Send Money Instead
            </Button>
          </CardFooter>
        </CardCustom>
      </div>
    </Layout>
  );
};

export default ReceiveMoney;
