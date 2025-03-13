
import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
  transparentHeader?: boolean;
  className?: string;
}

const Layout = ({ 
  children, 
  showFooter = true,
  transparentHeader = false,
  className = ""
}: LayoutProps) => {
  const { pathname } = useLocation();
  
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex flex-col min-h-screen relative">
      <div className="absolute inset-0 bg-mesh-gradient pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-grain pointer-events-none z-0"></div>
      <Header transparentBg={transparentHeader} />
      <main className={`flex-1 pt-20 relative z-10 ${className}`}>{children}</main>
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout;
