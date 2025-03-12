
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, User, LogOut, Home, Users, ShieldCheck, Building, Scale, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMobile } from '@/hooks/use-mobile';

const Navbar = () => {
  const { isAuthenticated, user, logout, hasRole } = useAuth();
  const { isMobile } = useMobile();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAssociationMember, setIsAssociationMember] = useState(false);
  const [isBanker, setIsBanker] = useState(false);
  const [isJusticeDepartment, setIsJusticeDepartment] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Check user roles
  useEffect(() => {
    const checkRoles = async () => {
      if (isAuthenticated && user) {
        const [associationRole, bankerRole, justiceRole] = await Promise.all([
          hasRole('association_member'),
          hasRole('banker'),
          hasRole('justice_department')
        ]);
        
        setIsAssociationMember(associationRole);
        setIsBanker(bankerRole);
        setIsJusticeDepartment(justiceRole);
      }
    };
    
    checkRoles();
  }, [isAuthenticated, user, hasRole]);

  // Handle scroll for navbar transparency
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const closeMenu = () => {
    setIsMenuOpen(false);
  };
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled 
        ? "bg-background/95 backdrop-blur-sm shadow-md" 
        : "bg-transparent"
    )}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2" onClick={closeMenu}>
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">JusticeChain</span>
          </Link>
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <div className="hidden md:flex items-center space-x-6">
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/dashboard" 
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary", 
                      isActive('/dashboard') && "text-primary"
                    )}
                  >
                    Dashboard
                  </Link>
                  
                  <Link 
                    to="/send-money" 
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary", 
                      isActive('/send-money') && "text-primary"
                    )}
                  >
                    Send Money
                  </Link>
                  
                  <Link 
                    to="/receive-money" 
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary", 
                      isActive('/receive-money') && "text-primary"
                    )}
                  >
                    Receive Money
                  </Link>
                  
                  <Link 
                    to="/loans" 
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary", 
                      isActive('/loans') && "text-primary"
                    )}
                  >
                    Loans
                  </Link>
                  
                  <Link 
                    to="/chainbook" 
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary", 
                      isActive('/chainbook') && "text-primary"
                    )}
                  >
                    Chainbook
                  </Link>
                  
                  <Link 
                    to="/voting" 
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary", 
                      isActive('/voting') && "text-primary"
                    )}
                  >
                    Voting
                  </Link>
                  
                  {/* Admin links based on roles */}
                  {(isAssociationMember || isBanker || isJusticeDepartment) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                          <span>Admin</span>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isAssociationMember && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link to="/association" className="flex items-center space-x-2">
                                <Building className="h-4 w-4" />
                                <span>Association</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to="/users" className="flex items-center space-x-2">
                                <Users className="h-4 w-4" />
                                <span>Users</span>
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}
                        
                        {isBanker && (
                          <DropdownMenuItem asChild>
                            <Link to="/banker-admin" className="flex items-center space-x-2">
                              <Building className="h-4 w-4" />
                              <span>Banker Admin</span>
                            </Link>
                          </DropdownMenuItem>
                        )}
                        
                        {isJusticeDepartment && (
                          <DropdownMenuItem asChild>
                            <Link to="/justice-admin" className="flex items-center space-x-2">
                              <Scale className="h-4 w-4" />
                              <span>Justice Admin</span>
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary", 
                      isActive('/login') && "text-primary"
                    )}
                  >
                    Login
                  </Link>
                  
                  <Link 
                    to="/register" 
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary", 
                      isActive('/register') && "text-primary"
                    )}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          )}
          
          {/* User menu (desktop) */}
          {!isMobile && isAuthenticated && (
            <div className="hidden md:flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span>{user?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={logout}
                    className="flex items-center space-x-2 text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          
          {/* Mobile menu button */}
          {isMobile && (
            <Button variant="ghost" size="sm" onClick={toggleMenu}>
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          )}
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobile && isMenuOpen && (
        <div className={cn(
          "fixed inset-0 bg-background/95 z-50 pt-16 pb-6 px-4 backdrop-blur-sm overflow-y-auto transition-all duration-300",
          scrolled ? "border-t border-border/10" : ""
        )}>
          <div className="flex flex-col space-y-4">
            {isAuthenticated ? (
              <>
                <div className="py-4 border-b border-border/10 mb-2">
                  <Link to="/profile" className="flex items-center space-x-4" onClick={closeMenu}>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{user?.name}</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                  </Link>
                </div>
                
                <Link 
                  to="/dashboard" 
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent"
                  onClick={closeMenu}
                >
                  <Home className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
                
                <Link 
                  to="/send-money" 
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent"
                  onClick={closeMenu}
                >
                  <span>Send Money</span>
                </Link>
                
                <Link 
                  to="/receive-money" 
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent"
                  onClick={closeMenu}
                >
                  <span>Receive Money</span>
                </Link>
                
                <Link 
                  to="/loans" 
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent"
                  onClick={closeMenu}
                >
                  <span>Loans</span>
                </Link>
                
                <Link 
                  to="/chainbook" 
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent"
                  onClick={closeMenu}
                >
                  <span>Chainbook</span>
                </Link>
                
                <Link 
                  to="/voting" 
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent"
                  onClick={closeMenu}
                >
                  <span>Voting</span>
                </Link>
                
                {/* Admin links based on roles */}
                {isAssociationMember && (
                  <>
                    <div className="pt-2 pb-1 border-t border-border/10 mt-2">
                      <p className="text-sm font-medium text-muted-foreground">Association Admin</p>
                    </div>
                    
                    <Link 
                      to="/association" 
                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent"
                      onClick={closeMenu}
                    >
                      <Building className="h-5 w-5" />
                      <span>Association</span>
                    </Link>
                    
                    <Link 
                      to="/users" 
                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent"
                      onClick={closeMenu}
                    >
                      <Users className="h-5 w-5" />
                      <span>Users</span>
                    </Link>
                  </>
                )}
                
                {isBanker && (
                  <>
                    <div className="pt-2 pb-1 border-t border-border/10 mt-2">
                      <p className="text-sm font-medium text-muted-foreground">Banker Admin</p>
                    </div>
                    
                    <Link 
                      to="/banker-admin" 
                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent"
                      onClick={closeMenu}
                    >
                      <Building className="h-5 w-5" />
                      <span>Banker Admin</span>
                    </Link>
                  </>
                )}
                
                {isJusticeDepartment && (
                  <>
                    <div className="pt-2 pb-1 border-t border-border/10 mt-2">
                      <p className="text-sm font-medium text-muted-foreground">Justice Admin</p>
                    </div>
                    
                    <Link 
                      to="/justice-admin" 
                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent"
                      onClick={closeMenu}
                    >
                      <Scale className="h-5 w-5" />
                      <span>Justice Admin</span>
                    </Link>
                  </>
                )}
                
                <div className="pt-2 mt-auto">
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => {
                      logout();
                      closeMenu();
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Logout</span>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="flex items-center justify-center p-2 rounded-md hover:bg-accent"
                  onClick={closeMenu}
                >
                  Login
                </Link>
                
                <Link 
                  to="/register" 
                  className="flex items-center justify-center p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  onClick={closeMenu}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
