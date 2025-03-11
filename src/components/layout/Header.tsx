
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, User, LogOut, Home, CreditCard, Users, Shield, FileText, Settings, Vote, BookOpen, Scale, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonCustom } from "@/components/ui/button-custom";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const navItems = [
    { title: "Home", href: "/" },
    { title: "Dashboard", href: "/dashboard" },
  ];
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  // Close mobile menu when changing routes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);
  
  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-smooth",
        scrolled 
          ? "py-3 glass-effect shadow-sm" 
          : "py-5 bg-transparent"
      )}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center transition-transform hover:scale-105"
          >
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-700">
              Moval Society
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <ul className="flex items-center space-x-1">
              {navItems.map((item) => (
                <li key={item.title}>
                  <Link
                    to={item.href}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors glass-nav-item",
                      location.pathname === item.href
                        ? "text-primary bg-white/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                    )}
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
              {user && (
                <>
                  <li>
                    <Link
                      to="/send-money"
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors glass-nav-item",
                        location.pathname === "/send-money"
                          ? "text-primary bg-white/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                      )}
                    >
                      Send Money
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/receive-money"
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors glass-nav-item",
                        location.pathname === "/receive-money"
                          ? "text-primary bg-white/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                      )}
                    >
                      Receive Money
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
          
          {/* Auth Buttons / User Menu */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center space-x-2 text-sm font-medium rounded-lg glass-effect px-3 py-2 hover:bg-white/10 transition-colors"
                  >
                    <span>{user.name || 'User'}</span>
                    <ChevronDown size={16} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-menu">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer w-full">
                      <Home className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer w-full">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/send-money" className="cursor-pointer w-full">
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Send Money</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  
                  {/* New Pages */}
                  <DropdownMenuItem asChild>
                    <Link to="/voting" className="cursor-pointer w-full">
                      <Vote className="mr-2 h-4 w-4" />
                      <span>Voting</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/loans" className="cursor-pointer w-full">
                      <Landmark className="mr-2 h-4 w-4" />
                      <span>Loans</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/chainbook" className="cursor-pointer w-full">
                      <BookOpen className="mr-2 h-4 w-4" />
                      <span>Chainbook</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  {/* Admin Pages */}
                  {user.role === 'banker' || user.role === 'justice' || user.role === 'association' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/users" className="cursor-pointer w-full">
                          <Users className="mr-2 h-4 w-4" />
                          <span>Users</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/association" className="cursor-pointer w-full">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Association</span>
                        </Link>
                      </DropdownMenuItem>
                      {user.role === 'justice' && (
                        <DropdownMenuItem asChild>
                          <Link to="/justice" className="cursor-pointer w-full">
                            <Scale className="mr-2 h-4 w-4" />
                            <span>Justice</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/terms" className="cursor-pointer w-full">
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Terms & Conditions</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/privacy" className="cursor-pointer w-full">
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Privacy Policy</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-500 focus:text-red-500">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/login">
                  <ButtonCustom variant="glass" size="sm">
                    Sign In
                  </ButtonCustom>
                </Link>
                <Link to="/register">
                  <ButtonCustom size="sm">
                    Get Started
                  </ButtonCustom>
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <button
            className="md:hidden rounded-lg p-2 glass-nav-item text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 p-4 md:hidden glass-effect shadow-sm animate-fade-in">
            <nav className="flex flex-col space-y-2 pt-2 pb-4">
              {navItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.href}
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    location.pathname === item.href
                      ? "bg-white/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                  )}
                >
                  {item.title}
                </Link>
              ))}
              
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className={cn(
                      "px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      location.pathname === "/profile"
                        ? "bg-white/10 text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                    )}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/send-money"
                    className={cn(
                      "px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      location.pathname === "/send-money"
                        ? "bg-white/10 text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                    )}
                  >
                    Send Money
                  </Link>
                  <Link
                    to="/receive-money"
                    className={cn(
                      "px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      location.pathname === "/receive-money"
                        ? "bg-white/10 text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                    )}
                  >
                    Receive Money
                  </Link>
                  <Link
                    to="/voting"
                    className={cn(
                      "px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      location.pathname === "/voting"
                        ? "bg-white/10 text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                    )}
                  >
                    Voting
                  </Link>
                  <Link
                    to="/loans"
                    className={cn(
                      "px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      location.pathname === "/loans"
                        ? "bg-white/10 text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                    )}
                  >
                    Loans
                  </Link>
                  <Link
                    to="/chainbook"
                    className={cn(
                      "px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      location.pathname === "/chainbook"
                        ? "bg-white/10 text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                    )}
                  >
                    Chainbook
                  </Link>
                  <div className="pt-2 mt-2 border-t border-white/10">
                    <button
                      onClick={logout}
                      className="w-full px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-900/20 transition-colors text-left"
                    >
                      Log Out
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col space-y-2 pt-2 border-t border-white/10">
                  <Link to="/login" className="w-full">
                    <ButtonCustom variant="glass" className="w-full">
                      Sign In
                    </ButtonCustom>
                  </Link>
                  <Link to="/register" className="w-full">
                    <ButtonCustom className="w-full">
                      Get Started
                    </ButtonCustom>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
