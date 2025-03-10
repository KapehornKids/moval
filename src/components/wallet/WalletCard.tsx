
import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { CardCustom, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card-custom";
import { ButtonCustom } from "@/components/ui/button-custom";
import { useAuth } from "@/hooks/useAuth";

interface WalletCardProps {
  onSend?: () => void;
  onReceive?: () => void;
}

const WalletCard = ({
  onSend,
  onReceive
}: WalletCardProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <CardCustom className="h-48 md:h-56 overflow-hidden relative bg-gradient-to-r from-primary to-blue-700 text-white shadow-lg">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB4PSIwIiB5PSIwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSgzMCkiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIyIiBoZWlnaHQ9IjIiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwYXR0ZXJuKSIvPjwvc3ZnPg==')] opacity-30"></div>
      <CardHeader>
        <CardTitle className="font-normal flex items-center space-x-1 text-white/80">
          <span>Moval Wallet</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`transition-all duration-700 delay-300 ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
          <p className="text-sm font-medium text-white/80">Current Balance</p>
          <h2 className="text-4xl font-bold mt-1 tracking-tight">
            {isLoaded ? (
              <span className="animate-fade-in">{user?.walletBalance.toLocaleString()} M</span>
            ) : (
              <div className="h-10 w-28 bg-white/10 rounded-md animate-pulse"></div>
            )}
          </h2>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <ButtonCustom 
          size="sm" 
          variant="glass" 
          leftIcon={<ArrowUpRight size={16} />}
          onClick={onSend}
          className={`transition-all duration-700 delay-500 ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
        >
          Send
        </ButtonCustom>
        <ButtonCustom 
          size="sm" 
          variant="glass" 
          leftIcon={<ArrowDownLeft size={16} />}
          onClick={onReceive}
          className={`transition-all duration-700 delay-600 ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
        >
          Receive
        </ButtonCustom>
      </CardFooter>
    </CardCustom>
  );
};

export default WalletCard;
