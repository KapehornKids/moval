
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { ButtonCustom } from '@/components/ui/button-custom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { getHeaderItems } from '@/lib/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings, Wallet, Shield } from 'lucide-react';

interface HeaderProps {
  transparentBg?: boolean;
}

const Header = ({ transparentBg = false }: HeaderProps) => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  const { isAuthenticated, user, logout } = useAuth();
  
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Check initial scroll position
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navigationItems = getHeaderItems();
  
  // Get user's initials for avatar
  const getUserInitials = () => {
    if (!user) return "U";
    // Use firstName/lastName if available, otherwise fallback to name or first character of email
    const first = user.firstName || (user.name ? user.name.split(' ')[0] : '');
    const last = user.lastName || (user.name ? user.name.split(' ')[1] || '' : '');
    
    return `${first.charAt(0) || ''}${last.charAt(0) || ''}`.toUpperCase() || user.email.charAt(0).toUpperCase();
  };

  // Check if user has admin roles
  const hasAdminRole = () => {
    if (!user) return false;
    const adminRoles: string[] = ['banker', 'association_member', 'justice_department'];
    return user.roles.some(role => adminRoles.includes(role));
  };

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-40 transition-all duration-300
        ${scrolled || !isHomePage || !transparentBg 
          ? 'bg-background/90 backdrop-blur-xl border-b border-border/50 py-3'
          : 'bg-transparent py-5'}
      `}
    >
      <div className="container flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent tracking-tight">Moval</span>
          </Link>
          
          <Navbar items={navigationItems} />
        </div>
        
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full hover:bg-accent/50 p-1 px-2 transition-colors">
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-sm font-medium">
                    {user?.firstName || user?.name || 'Account'}
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
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="cursor-pointer flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                
                {hasAdminRole() && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Administration</DropdownMenuLabel>
                    
                    {user?.roles.includes('association_member') && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin-setup" className="cursor-pointer flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span>Admin Setup</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    {user?.roles.includes('justice_department') && (
                      <DropdownMenuItem asChild>
                        <Link to="/justice-admin" className="cursor-pointer flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span>Justice Admin</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
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
                  variant={isHomePage && transparentBg && !scrolled ? "glass" : "outline"}
                  size="sm"
                >
                  Log In
                </ButtonCustom>
              </Link>
              <div className="hidden md:block">
                <Link to="/register">
                  <ButtonCustom
                    size="sm"
                  >
                    Register
                  </ButtonCustom>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
