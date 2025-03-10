
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

const Terms = () => {
  return (
    <Layout>
      <div className="container max-w-3xl py-8">
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link to="/">
            <ArrowLeft size={16} className="mr-2" /> Back to home
          </Link>
        </Button>

        <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
          <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>
          
          <p className="text-gray-600 mb-6">
            Effective Date: July 1, 2023
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p>
              Welcome to Moval Society. These Terms and Conditions govern your use of our application and services. By accessing or using the Moval Society application, you agree to be bound by these Terms. Please read them carefully.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Definitions</h2>
            <p>
              <strong>"Movals"</strong> refers to the digital currency used within the Moval Society ecosystem.
            </p>
            <p>
              <strong>"User"</strong> refers to anyone who accesses or uses the Moval Society application.
            </p>
            <p>
              <strong>"Association"</strong> refers to the elected group responsible for governing the Moval Society.
            </p>
            <p>
              <strong>"Banker"</strong> refers to the designated individual responsible for managing Moval currency and conversions.
            </p>
            <p>
              <strong>"Justice Department"</strong> refers to the elected members responsible for resolving disputes and enforcing rules.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Account Registration</h2>
            <p>
              To use the Moval Society application, you must register an account. You agree to provide accurate and complete information during the registration process. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Moval Currency</h2>
            <p>
              Movals are a digital currency that exist solely within the Moval Society ecosystem. Movals have no cash value outside the ecosystem and are not intended to be an investment or financial product. The conversion rate between Movals and local currency (rupees) is determined by the appointed Banker and may fluctuate.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Transactions</h2>
            <p>
              All transactions within the Moval Society are recorded on a local blockchain. Once confirmed, transactions cannot be reversed. Users are responsible for verifying transaction details before confirming. The Moval Society is not responsible for losses due to user error or unauthorized account access.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Governance</h2>
            <p>
              The Moval Society is governed by elected Association members and the Justice Department. Users agree to abide by decisions made by these governing bodies. Elections are held periodically, and all users are eligible to vote and run for positions as specified in the election rules.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Dispute Resolution</h2>
            <p>
              Disputes between users will be resolved by the Justice Department. The decisions of the Justice Department are final within the ecosystem. Users agree to cooperate with any investigation conducted by the Justice Department.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Prohibited Activities</h2>
            <p>
              Users are prohibited from:
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li>Using the application for any illegal purpose</li>
              <li>Attempting to manipulate the Moval economy</li>
              <li>Creating multiple accounts for fraudulent purposes</li>
              <li>Interfering with the operation of the application</li>
              <li>Sharing account credentials with others</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Termination</h2>
            <p>
              The Association reserves the right to terminate or suspend user accounts for violation of these Terms. Upon termination, you will lose access to your account and any Movals associated with it.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Changes to Terms</h2>
            <p>
              These Terms may be updated from time to time. We will notify users of significant changes via the application or email. Continued use of the application after changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">11. Contact Information</h2>
            <p>
              For questions about these Terms, please contact the Association through the application's messaging system or at support@movalsociety.com.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default Terms;
