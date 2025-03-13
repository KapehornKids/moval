
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { NavItem } from '@/types';

interface NavbarProps {
  items: NavItem[];
}

const Navbar = ({ items }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const isMobile = useIsMobile();

  // Close the menu when navigating to a new page
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Function to check if a menu item should be shown based on user roles
  const shouldShowMenuItem = (item: NavItem) => {
    // Public items should always be shown
    if (item.public) {
      return true;
    }

    // If the item requires authentication and user is not authenticated, don't show
    if (!isAuthenticated) {
      return false;
    }

    // If the item requires specific roles and user doesn't have any of them, don't show
    if (item.roles && item.roles.length > 0 && user) {
      const userRoles = user.roles || [];
      return item.roles.some(role => userRoles.includes(role));
    }

    // If item requires authentication but no specific roles, show it to any authenticated user
    return true;
  };

  return (
    <>
      <div className="flex lg:hidden items-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10"
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      <nav
        className={`
          lg:flex fixed inset-0 lg:static bg-background lg:bg-transparent z-50 transform 
          ${isOpen ? 'flex' : 'hidden'} 
          flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6 pt-16 lg:pt-0 px-4 lg:px-0
        `}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-6 w-6" />
        </button>

        {items.map((item, index) => (
          shouldShowMenuItem(item) && (
            <div key={index} className="relative group w-full lg:w-auto">
              {item.children ? (
                // Dropdown menu
                <div className="w-full">
                  <button 
                    className={`
                      flex items-center justify-between w-full lg:w-auto px-3 py-2 text-sm font-medium rounded-md
                      ${location.pathname.startsWith(item.href || '#') ? 'text-primary' : 'text-foreground'} 
                      hover:bg-accent hover:text-accent-foreground transition-colors
                    `}
                  >
                    <span>{item.title}</span>
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </button>
                  
                  <div className={`
                    lg:absolute lg:left-0 lg:top-full lg:z-10 mt-1 w-full lg:w-48 origin-top-right rounded-md bg-popover shadow-lg ring-1 ring-black ring-opacity-5
                    ${isMobile ? 'block pl-4' : 'lg:hidden group-hover:lg:block'}
                  `}>
                    <div className="py-1">
                      {item.children?.map((child, childIndex) => (
                        shouldShowMenuItem(child) && (
                          <Link
                            key={childIndex}
                            to={child.href || '#'}
                            className={`
                              flex items-center px-4 py-2 text-sm
                              ${location.pathname === child.href ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent hover:text-accent-foreground'}
                            `}
                          >
                            {child.title}
                            <ChevronRight className="ml-auto h-4 w-4" />
                          </Link>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                // Regular menu item
                <Link
                  to={item.href || '#'}
                  className={`
                    flex items-center justify-between w-full lg:w-auto px-3 py-2 text-sm font-medium rounded-md
                    ${location.pathname === item.href ? 'text-primary' : 'text-foreground'} 
                    hover:bg-accent hover:text-accent-foreground transition-colors
                  `}
                >
                  {item.title}
                </Link>
              )}
            </div>
          )
        ))}
      </nav>
    </>
  );
};

export default Navbar;
