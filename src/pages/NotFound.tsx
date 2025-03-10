
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { ButtonCustom } from "@/components/ui/button-custom";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <Layout showFooter={false}>
      <div className="min-h-[90vh] flex flex-col items-center justify-center p-4 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <span className="text-5xl font-bold text-primary">404</span>
        </div>
        <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
        <p className="text-xl text-muted-foreground max-w-md mb-8">
          Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>
        <Link to="/">
          <ButtonCustom size="lg" leftIcon={<Home size={18} />}>
            Return to Home
          </ButtonCustom>
        </Link>
      </div>
    </Layout>
  );
};

export default NotFound;
