
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { NavItem } from '@/types';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from '@/lib/utils';

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
      return item.roles.some(role => user.roles.includes(role));
    }

    // If item requires authentication but no specific roles, show it to any authenticated user
    return true;
  };

  // Function to check if a path is active
  const isActiveLink = (href?: string) => {
    if (!href) return false;
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

  // Desktop navigation using NavigationMenu
  const DesktopNav = () => (
    <NavigationMenu className="hidden lg:flex">
      <NavigationMenuList>
        {items.map((item, index) => (
          shouldShowMenuItem(item) && (
            <NavigationMenuItem key={index}>
              {item.children ? (
                <>
                  <NavigationMenuTrigger 
                    className={cn(
                      "text-foreground hover:text-primary",
                      isActiveLink(item.href) && "text-primary font-medium"
                    )}
                  >
                    {item.title}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[220px] gap-1 p-2">
                      {item.children.map((child, childIndex) => (
                        shouldShowMenuItem(child) && (
                          <li key={childIndex}>
                            <NavigationMenuLink asChild>
                              <Link
                                to={child.href || '#'}
                                className={cn(
                                  "block select-none space-y-1 rounded-md p-3 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                                  isActiveLink(child.href) && "bg-accent/50 text-accent-foreground font-medium"
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{child.title}</span>
                                  <ChevronRight className="h-4 w-4 opacity-60" />
                                </div>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        )
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </>
              ) : (
                <Link to={item.href || '#'}>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "bg-transparent text-foreground hover:text-primary hover:bg-transparent",
                      isActiveLink(item.href) && "text-primary font-medium"
                    )}
                  >
                    {item.title}
                  </NavigationMenuLink>
                </Link>
              )}
            </NavigationMenuItem>
          )
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );

  // Mobile navigation
  return (
    <>
      <div className="flex lg:hidden items-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md text-foreground hover:text-primary hover:bg-accent/50"
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Desktop Navigation */}
      <DesktopNav />

      {/* Mobile Navigation */}
      <nav
        className={`
          fixed inset-0 lg:hidden bg-background/95 backdrop-blur-md z-50 transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          flex flex-col gap-1 pt-16 px-4 overflow-y-auto
        `}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-md text-foreground hover:text-primary hover:bg-accent/50"
          aria-label="Close menu"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="flex flex-col space-y-1">
          {items.map((item, index) => (
            shouldShowMenuItem(item) && (
              <div key={index} className="relative w-full">
                {item.children ? (
                  <div className="w-full rounded-md">
                    <div 
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md",
                        isActiveLink(item.href) ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/50 hover:text-accent-foreground"
                      )}
                    >
                      <span>{item.title}</span>
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </div>
                    
                    <div className="pl-4 mt-1 space-y-1">
                      {item.children?.map((child, childIndex) => (
                        shouldShowMenuItem(child) && (
                          <Link
                            key={childIndex}
                            to={child.href || '#'}
                            className={cn(
                              "flex items-center px-4 py-2 text-sm rounded-md",
                              isActiveLink(child.href) ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/50 hover:text-accent-foreground"
                            )}
                          >
                            {child.title}
                            <ChevronRight className="ml-auto h-4 w-4" />
                          </Link>
                        )
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    to={item.href || '#'}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md",
                      isActiveLink(item.href) ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/50 hover:text-accent-foreground"
                    )}
                  >
                    {item.title}
                  </Link>
                )}
              </div>
            )
          ))}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
