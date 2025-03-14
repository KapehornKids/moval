
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { NavItem } from '@/types';
import { getHeaderItems } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

interface MainNavProps {
  isMobile?: boolean;
  onNavItemClick?: () => void;
}

const MainNav = ({ isMobile = false, onNavItemClick }: MainNavProps) => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const navigationItems = getHeaderItems();

  // Function to check if a menu item should be shown based on user roles
  const shouldShowMenuItem = (item: NavItem): boolean => {
    if (item.public) {
      return true;
    }

    if (!isAuthenticated) {
      return false;
    }

    if (item.roles && item.roles.length > 0 && user) {
      return item.roles.some(role => user.roles?.includes(role));
    }

    return true;
  };

  // Check if a child item should be shown
  const hasVisibleChildren = (item: NavItem): boolean => {
    if (!item.children) return false;
    return item.children.some(child => shouldShowMenuItem(child));
  };

  // Function to check if a path is active
  const isActiveLink = (href?: string) => {
    if (!href) return false;
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

  if (isMobile) {
    return (
      <div className="flex flex-col space-y-1">
        {navigationItems.map((item, index) => {
          if (!shouldShowMenuItem(item) && !hasVisibleChildren(item)) {
            return null;
          }

          return (
            <div key={index} className="w-full">
              {item.children && hasVisibleChildren(item) ? (
                <MobileNavGroup 
                  item={item} 
                  isActive={isActiveLink} 
                  shouldShow={shouldShowMenuItem}
                  onItemClick={onNavItemClick}
                />
              ) : item.href ? (
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md",
                    isActiveLink(item.href) ? "bg-accent/70 text-accent-foreground" : "hover:bg-accent/40"
                  )}
                  onClick={onNavItemClick}
                >
                  {item.title}
                </Link>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList>
        {navigationItems.map((item, index) => {
          if (!shouldShowMenuItem(item) && !hasVisibleChildren(item)) {
            return null;
          }

          return (
            <NavigationMenuItem key={index}>
              {item.children && hasVisibleChildren(item) ? (
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
              ) : item.href ? (
                <Link to={item.href}>
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
              ) : null}
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
};

// Mobile Navigation Group Component
const MobileNavGroup = ({ 
  item, 
  isActive, 
  shouldShow,
  onItemClick
}: { 
  item: NavItem; 
  isActive: (href?: string) => boolean; 
  shouldShow: (item: NavItem) => boolean;
  onItemClick?: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-md mb-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md",
          isOpen ? "bg-accent/70 text-accent-foreground" : "hover:bg-accent/40"
        )}
      >
        <span>{item.title}</span>
        <ChevronDown 
          className={cn(
            "h-4 w-4 transition-transform", 
            isOpen && "transform rotate-180"
          )} 
        />
      </button>
      
      {isOpen && (
        <div className="pl-4 mt-1 space-y-1 mb-2">
          {item.children?.map((child, childIndex) => (
            shouldShow(child) && (
              <Link
                key={childIndex}
                to={child.href || '#'}
                className={cn(
                  "flex items-center px-3 py-2 text-sm rounded-md",
                  isActive(child.href) 
                    ? "bg-accent/70 text-accent-foreground" 
                    : "hover:bg-accent/40"
                )}
                onClick={onItemClick}
              >
                <span>{child.title}</span>
                <ChevronRight className="ml-auto h-4 w-4 opacity-70" />
              </Link>
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default MainNav;
