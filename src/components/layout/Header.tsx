
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronDown, User, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ButtonCustom } from '@/components/ui/button-custom';
import MainNav from './MainNav';
import { cn } from '@/lib/utils';

interface HeaderProps {
  transparentBg?: boolean;
}

const Header = ({ transparentBg = false }: HeaderProps) => {
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Get user's initials for avatar
  const getUserInitials = () => {
    if (!user) return "U";
    
    const first = user.firstName || user.first_name || (user.name ? user.name.split(' ')[0] : '');
    const last = user.lastName || user.last_name || (user.name ? user.name.split(' ')[1] || '' : '');
    
    return `${first.charAt(0) || ''}${last.charAt(0) || ''}`.toUpperCase() || 
           (user.email ? user.email.charAt(0).toUpperCase() : 'U');
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
        scrolled || !transparentBg 
          ? "bg-background/90 backdrop-blur-md border-b border-border/50 py-2" 
          : "bg-transparent py-4"
      )}
    >
      <div className="container flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2 md:gap-6">
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Moval</span>
          </Link>
          
          {!isMobile && <MainNav />}
        </div>
        
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full p-1 px-2 transition-colors hover:bg-accent/50">
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-sm font-medium">
                    {user?.firstName || user?.first_name || user?.name || 'Account'}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={logout}
                  className="cursor-pointer text-destructive hover:text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <ButtonCustom
                  variant={transparentBg && !scrolled ? "glass" : "outline"}
                  size="sm"
                >
                  Log In
                </ButtonCustom>
              </Link>
              <div className="hidden md:block">
                <Link to="/register">
                  <ButtonCustom size="sm">
                    Register
                  </ButtonCustom>
                </Link>
              </div>
            </div>
          )}
          
          {isMobile && (
            <MobileNavTrigger />
          )}
        </div>
      </div>
    </header>
  );
};

// Mobile Navigation Trigger
const MobileNavTrigger = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md text-foreground hover:bg-accent/50 ml-2"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      
      <div className={cn(
        "fixed inset-0 bg-background/95 backdrop-blur-lg z-50 transition-transform duration-300",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="p-4 flex justify-end">
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-md text-foreground hover:bg-accent/50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="px-4 py-6">
          <MainNav isMobile onNavItemClick={() => setIsOpen(false)} />
        </div>
      </div>
    </>
  );
};

export default Header;
