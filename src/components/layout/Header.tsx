
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { ButtonCustom } from '@/components/ui/button-custom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { getHeaderItems } from '@/lib/navigation';

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

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-40 transition-all duration-300
        ${scrolled || !isHomePage || !transparentBg 
          ? 'bg-background/80 backdrop-blur-xl shadow-sm py-3'
          : 'bg-transparent py-5'}
      `}
    >
      <div className="container flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center">
          <Link to="/" className="flex items-center mr-6">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent tracking-tight">Moval</span>
          </Link>
          
          {!isMobile && (
            <Navbar items={navigationItems} />
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="hidden md:block">
                <Link to="/profile">
                  <ButtonCustom
                    variant="outline"
                    size="sm"
                  >
                    {user?.firstName || 'Profile'}
                  </ButtonCustom>
                </Link>
              </div>
              <ButtonCustom
                variant="ghost"
                size="sm"
                onClick={logout}
              >
                Logout
              </ButtonCustom>
            </div>
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
