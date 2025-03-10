
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ButtonCustom } from "@/components/ui/button-custom";
import { ArrowRight, CheckCircle, Wallet, Vote, Users, Landmark } from "lucide-react";
import { getAnimationClass } from "@/lib/animations";

const Index = () => {
  const featuresRef = useRef<HTMLElement | null>(null);
  const howItWorksRef = useRef<HTMLElement | null>(null);

  const scrollToSection = (ref: React.RefObject<HTMLElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-950"></div>
        <div className="container relative z-10 px-4 md:px-6 mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className={getAnimationClass("fade", 1)}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Welcome to <span className="text-primary">Moval Society</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg">
                A digital community with its own currency, governance, and economic system for sustainable living and collaborative growth.
              </p>
              <div className="flex flex-wrap gap-4">
                <ButtonCustom 
                  size="lg" 
                  className="gap-2"
                  rightIcon={<ArrowRight />}
                  onClick={() => scrollToSection(featuresRef)}
                >
                  Explore Features
                </ButtonCustom>
                <ButtonCustom 
                  variant="outline" 
                  size="lg"
                  onClick={() => scrollToSection(howItWorksRef)}
                >
                  How It Works
                </ButtonCustom>
              </div>
            </div>
            <div className={`relative ${getAnimationClass("slide-right", 2)}`}>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                  <Wallet size={64} className="text-primary" />
                </div>
                <h3 className="text-xl font-semibold mt-6 mb-2">Moval Wallet</h3>
                <p className="text-muted-foreground">
                  Easily send, receive and manage your Movals within the society.
                </p>
              </div>
              <div className="absolute -bottom-8 -right-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-3/4">
                <div className="flex items-start gap-4">
                  <CheckCircle className="text-green-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Secure Transactions</h4>
                    <p className="text-sm text-muted-foreground">
                      All transactions are recorded on our local blockchain
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={el => { featuresRef.current = el; }} className="py-20 bg-white dark:bg-gray-950">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Key Features</h2>
            <p className="text-lg text-muted-foreground">
              Discover the powerful tools and systems that make the Moval Society unique
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className={`bg-slate-50 dark:bg-gray-900 rounded-lg p-6 ${getAnimationClass("fade", 1)}`}>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Wallet className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Moval Wallet</h3>
              <p className="text-muted-foreground mb-4">
                Send, receive and store Movals, the digital currency of our society.
              </p>
              <Link to="/login" className="text-primary font-medium flex items-center hover:underline">
                Get Started <ArrowRight size={16} className="ml-2" />
              </Link>
            </div>

            {/* Feature 2 */}
            <div className={`bg-slate-50 dark:bg-gray-900 rounded-lg p-6 ${getAnimationClass("fade", 2)}`}>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Vote className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Community Voting</h3>
              <p className="text-muted-foreground mb-4">
                Participate in elections and help shape the future of our society.
              </p>
              <Link to="/login" className="text-primary font-medium flex items-center hover:underline">
                Learn More <ArrowRight size={16} className="ml-2" />
              </Link>
            </div>

            {/* Feature 3 */}
            <div className={`bg-slate-50 dark:bg-gray-900 rounded-lg p-6 ${getAnimationClass("fade", 3)}`}>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Landmark className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Moval Loans</h3>
              <p className="text-muted-foreground mb-4">
                Request and repay loans from the MBMQ bank to fund your projects.
              </p>
              <Link to="/login" className="text-primary font-medium flex items-center hover:underline">
                Apply Now <ArrowRight size={16} className="ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section ref={el => { howItWorksRef.current = el; }} className="py-20 bg-slate-50 dark:bg-gray-900">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">
              Understanding the Moval Society ecosystem and how you can participate
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className={getAnimationClass("slide-up", 1)}>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 h-full">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold mb-4">1</div>
                <h3 className="text-lg font-semibold mb-2">Create Account</h3>
                <p className="text-muted-foreground">
                  Sign up for a new account to join the Moval Society.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className={getAnimationClass("slide-up", 2)}>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 h-full">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold mb-4">2</div>
                <h3 className="text-lg font-semibold mb-2">Get Movals</h3>
                <p className="text-muted-foreground">
                  Request loans or receive Movals from other members.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className={getAnimationClass("slide-up", 3)}>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 h-full">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold mb-4">3</div>
                <h3 className="text-lg font-semibold mb-2">Participate</h3>
                <p className="text-muted-foreground">
                  Vote in elections and take part in community decisions.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className={getAnimationClass("slide-up", 4)}>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 h-full">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold mb-4">4</div>
                <h3 className="text-lg font-semibold mb-2">Contribute</h3>
                <p className="text-muted-foreground">
                  Apply for roles like banker or justice department.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link to="/register">
              <ButtonCustom size="lg" className="gap-2" rightIcon={<ArrowRight />}>
                Join Moval Society Today
              </ButtonCustom>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
