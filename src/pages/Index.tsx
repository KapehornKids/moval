
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, Check } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ButtonCustom } from "@/components/ui/button-custom";
import { CardCustom } from "@/components/ui/card-custom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    setIsLoaded(true);
  }, []);
  
  return (
    <Layout>
      {/* Hero Section */}
      <section className="px-4 pt-12 pb-24 md:pt-20 md:pb-32">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div
                className={`transition-all duration-700 delay-100 ${
                  isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              >
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tighter">
                  Your Digital Economy in{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-700">
                    Moval Society
                  </span>
                </h1>
              </div>
              
              <div
                className={`transition-all duration-700 delay-300 ${
                  isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              >
                <p className="text-lg text-muted-foreground">
                  Send, receive, vote, and participate in a fully functional digital society with its own economy.
                </p>
              </div>
              
              <div
                className={`transition-all duration-700 delay-500 ${
                  isLoaded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
                }`}
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {isAuthenticated ? (
                    <Link to="/dashboard">
                      <ButtonCustom size="lg" rightIcon={<ArrowRight />}>
                        Go to Dashboard
                      </ButtonCustom>
                    </Link>
                  ) : (
                    <Link to="/register">
                      <ButtonCustom size="lg" rightIcon={<ArrowRight />}>
                        Get Started
                      </ButtonCustom>
                    </Link>
                  )}
                  <Link to="/about">
                    <ButtonCustom variant="outline" size="lg">
                      Learn More
                    </ButtonCustom>
                  </Link>
                </div>
              </div>
            </div>
            
            <div
              className={`transition-all duration-700 delay-700 ${
                isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
            >
              <div className="relative flex justify-center">
                <div className="w-full max-w-md aspect-square bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-3xl overflow-hidden shadow-xl">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB4PSIwIiB5PSIwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSgzMCkiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIyIiBoZWlnaHQ9IjIiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwYXR0ZXJuKSIvPjwvc3ZnPg==')] opacity-30"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="bg-accent py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">All-in-One Society Platform</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to participate in your digital society with a comprehensive set of features.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <CardCustom
              className={`p-6 transition-all duration-700 delay-100 ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
            >
              <div className="flex flex-col h-full">
                <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <circle cx="12" cy="12" r="8" />
                    <line x1="3" y1="12" x2="5" y2="12" />
                    <line x1="19" y1="12" x2="21" y2="12" />
                    <line x1="12" y1="3" x2="12" y2="5" />
                    <line x1="12" y1="19" x2="12" y2="21" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Digital Wallet</h3>
                <p className="text-muted-foreground flex-1">
                  Send and receive Movals with ease. Track your transaction history.
                </p>
                <div className="mt-4">
                  <Link
                    to={isAuthenticated ? "/dashboard" : "/register"}
                    className="text-primary flex items-center hover:underline font-medium"
                  >
                    <span>Learn more</span>
                    <ChevronRight size={16} className="ml-1" />
                  </Link>
                </div>
              </div>
            </CardCustom>
            
            <CardCustom
              className={`p-6 transition-all duration-700 delay-200 ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
            >
              <div className="flex flex-col h-full">
                <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <path d="M2 12h5" />
                    <path d="M17 12h5" />
                    <path d="M8 7a4 4 0 0 1 8 0v5" />
                    <path d="M5 21v-2a7 7 0 0 1 7-7h0a7 7 0 0 1 7 7v2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Community Voting</h3>
                <p className="text-muted-foreground flex-1">
                  Participate in elections and vote for association members.
                </p>
                <div className="mt-4">
                  <Link
                    to={isAuthenticated ? "/voting" : "/register"}
                    className="text-primary flex items-center hover:underline font-medium"
                  >
                    <span>Learn more</span>
                    <ChevronRight size={16} className="ml-1" />
                  </Link>
                </div>
              </div>
            </CardCustom>
            
            <CardCustom
              className={`p-6 transition-all duration-700 delay-300 ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
            >
              <div className="flex flex-col h-full">
                <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l6.29-6.29c.94-.94.94-2.48 0-3.42L11.71 2.71c-.94-.94-2.48-.94-3.42 0L5 6" />
                    <path d="M7 9.01V9" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Loan System</h3>
                <p className="text-muted-foreground flex-1">
                  Request loans and manage your repayments easily.
                </p>
                <div className="mt-4">
                  <Link
                    to={isAuthenticated ? "/loans" : "/register"}
                    className="text-primary flex items-center hover:underline font-medium"
                  >
                    <span>Learn more</span>
                    <ChevronRight size={16} className="ml-1" />
                  </Link>
                </div>
              </div>
            </CardCustom>
            
            <CardCustom
              className={`p-6 transition-all duration-700 delay-400 ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
            >
              <div className="flex flex-col h-full">
                <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <rect width="18" height="10" x="3" y="11" rx="2" />
                    <circle cx="12" cy="5" r="2" />
                    <path d="M12 7v4" />
                    <line x1="8" y1="16" x2="8" y2="16" />
                    <line x1="16" y1="16" x2="16" y2="16" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Blockchain System</h3>
                <p className="text-muted-foreground flex-1">
                  Transparent and secure transactions with blockchain technology.
                </p>
                <div className="mt-4">
                  <Link
                    to={isAuthenticated ? "/chainbook" : "/register"}
                    className="text-primary flex items-center hover:underline font-medium"
                  >
                    <span>Learn more</span>
                    <ChevronRight size={16} className="ml-1" />
                  </Link>
                </div>
              </div>
            </CardCustom>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-primary/90 to-blue-700/90 rounded-3xl overflow-hidden">
            <div className="relative px-6 py-12 md:p-12 lg:p-16">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB4PSIwIiB5PSIwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSgzMCkiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIyIiBoZWlnaHQ9IjIiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwYXR0ZXJuKSIvPjwvc3ZnPg==')] opacity-30"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
                <div className="text-white">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Ready to join our digital society?
                  </h2>
                  <p className="text-white/80 mb-8 max-w-md">
                    Create your account today and start participating in a fully functional
                    digital society with its own economy, voting system, and more.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link to="/register">
                      <ButtonCustom variant="light" size="lg">
                        Sign Up Now
                      </ButtonCustom>
                    </Link>
                    <Link to="/login">
                      <ButtonCustom variant="glass" size="lg">
                        Sign In
                      </ButtonCustom>
                    </Link>
                  </div>
                </div>
                <div className="md:flex items-center justify-end hidden">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <div className="space-y-4 max-w-xs">
                      <div className="flex items-center">
                        <Check
                          size={20}
                          className="mr-3 text-green-300"
                        />
                        <span className="text-white text-sm">Digital wallet for transactions</span>
                      </div>
                      <div className="flex items-center">
                        <Check
                          size={20}
                          className="mr-3 text-green-300"
                        />
                        <span className="text-white text-sm">Democratic voting system</span>
                      </div>
                      <div className="flex items-center">
                        <Check
                          size={20}
                          className="mr-3 text-green-300"
                        />
                        <span className="text-white text-sm">Transparent loan management</span>
                      </div>
                      <div className="flex items-center">
                        <Check
                          size={20}
                          className="mr-3 text-green-300"
                        />
                        <span className="text-white text-sm">Blockchain-backed security</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
