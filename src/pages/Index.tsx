
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { ButtonCustom } from "@/components/ui/button-custom";
import { useReveal, getAnimationClass } from "@/lib/animations";
import { CardCustom, CardContent } from "@/components/ui/card-custom";
import { ArrowRight, Wallet, Landmark, Vote, Users, Scale, History } from "lucide-react";

const features = [
  {
    title: "Moval Wallet",
    description: "Store, send, and receive digital currency within the society.",
    icon: <Wallet size={24} />,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400"
  },
  {
    title: "Moval Loans",
    description: "Request loans from MBMQ bank and set up repayment plans.",
    icon: <Landmark size={24} />,
    color: "bg-green-500/10 text-green-600 dark:text-green-400"
  },
  {
    title: "Voting System",
    description: "Participate in association elections and vote on proposals.",
    icon: <Vote size={24} />,
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400"
  },
  {
    title: "Association Management",
    description: "Oversee community decisions and appoint key positions.",
    icon: <Users size={24} />,
    color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
  },
  {
    title: "Justice Department",
    description: "Maintain transparency with audit access and dispute resolution.",
    icon: <Scale size={24} />,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
  },
  {
    title: "Transaction History",
    description: "View detailed logs of all your financial activity.",
    icon: <History size={24} />,
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400"
  }
];

const Index = () => {
  const [heroRef, heroRevealed] = useReveal();
  const [featuresRef, featuresRevealed] = useReveal(0.1);
  
  return (
    <Layout>
      {/* Hero Section */}
      <section 
        className="relative overflow-hidden py-20 md:py-28"
        ref={heroRef as React.RefObject<HTMLElement>}
      >
        <div 
          className={`absolute inset-0 bg-grid-pattern opacity-[0.02] transition-opacity duration-500 ${
            heroRevealed ? "opacity-[0.02]" : "opacity-0"
          }`}
        ></div>
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 
                  className={`text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none transition-all duration-700 ${
                    heroRevealed 
                      ? "translate-y-0 opacity-100" 
                      : "translate-y-4 opacity-0"
                  }`}
                >
                  The Digital Economy for Modern Society
                </h1>
                <p 
                  className={`max-w-[600px] text-muted-foreground md:text-xl transition-all duration-700 delay-100 ${
                    heroRevealed 
                      ? "translate-y-0 opacity-100" 
                      : "translate-y-4 opacity-0"
                  }`}
                >
                  A secure, transparent platform for managing Moval currency, governance, and community services.
                </p>
              </div>
              <div 
                className={`flex flex-col sm:flex-row gap-3 transition-all duration-700 delay-200 ${
                  heroRevealed 
                    ? "translate-y-0 opacity-100" 
                    : "translate-y-4 opacity-0"
                }`}
              >
                <Link to="/register">
                  <ButtonCustom size="lg">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </ButtonCustom>
                </Link>
                <Link to="/login">
                  <ButtonCustom size="lg" variant="outline">
                    Sign In
                  </ButtonCustom>
                </Link>
              </div>
            </div>
            <div 
              className={`mx-auto w-full max-w-[400px] lg:max-w-none transition-all duration-1000 delay-300 ${
                heroRevealed 
                  ? "translate-y-0 opacity-100" 
                  : "translate-y-4 opacity-0"
              }`}
            >
              <CardCustom 
                className="overflow-hidden bg-gradient-to-b from-primary to-blue-700 text-white h-64 md:h-80 animate-float"
                radius="2xl"
              >
                <CardContent className="flex flex-col items-center justify-center h-full">
                  <div className="p-2 rounded-full bg-white/10 backdrop-blur-sm mb-4">
                    <Wallet size={36} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Moval Wallet</h3>
                  <p className="text-white/70 text-center max-w-sm mb-6">Securely store and manage your digital currency</p>
                  <div className="text-4xl font-bold">1,000 M</div>
                </CardContent>
              </CardCustom>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section 
        className="py-16 md:py-24 bg-muted/30" 
        ref={featuresRef as React.RefObject<HTMLElement>}
      >
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              Features
            </div>
            <h2 
              className={`text-3xl font-bold tracking-tighter sm:text-5xl transition-all duration-700 ${
                featuresRevealed ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
            >
              Everything You Need
            </h2>
            <p 
              className={`mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed transition-all duration-700 delay-100 ${
                featuresRevealed ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
            >
              A comprehensive platform that combines finance, governance, and community management.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <CardCustom 
                key={feature.title}
                className={`transition-all hover:-translate-y-1 hover:shadow-md ${
                  featuresRevealed 
                    ? getAnimationClass("fade", Math.min(index, 7)) 
                    : "opacity-0"
                }`}
              >
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${feature.color}`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground mb-4">{feature.description}</p>
                  <Link to="/register" className="text-primary font-medium inline-flex items-center hover:underline">
                    Learn more <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </CardContent>
              </CardCustom>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Join Our Digital Society</h2>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Experience the future of digital community management with the Moval Society platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/register">
                  <ButtonCustom size="lg">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </ButtonCustom>
                </Link>
                <Link to="/about">
                  <ButtonCustom size="lg" variant="outline">
                    Learn More
                  </ButtonCustom>
                </Link>
              </div>
            </div>
            <div className="mx-auto w-full max-w-[500px] aspect-video rounded-xl bg-muted overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-blue-700/20 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Users size={32} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Association Management</h3>
                  <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
                    Transparent governance for your community
                  </p>
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
