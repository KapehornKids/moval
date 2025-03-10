
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

const Privacy = () => {
  return (
    <Layout>
      <div className="container max-w-3xl py-8">
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link to="/">
            <ArrowLeft size={16} className="mr-2" /> Back to home
          </Link>
        </Button>

        <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
          
          <p className="text-gray-600 mb-6">
            Effective Date: July 1, 2023
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p>
              At Moval Society, we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our application.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>
            <p>We collect several types of information from and about users of our application, including:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Personal identifiers (name, email address)</li>
              <li>Account credentials</li>
              <li>Transaction history within the application</li>
              <li>Voting history and election participation</li>
              <li>User-generated content (such as dispute claims or candidate manifestos)</li>
              <li>Technical data (IP address, device information, access times)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Create and maintain your account</li>
              <li>Process and record transactions</li>
              <li>Administer elections and voting</li>
              <li>Resolve disputes</li>
              <li>Improve and personalize the user experience</li>
              <li>Communicate with you about your account and the application</li>
              <li>Ensure the security and integrity of the application</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Blockchain Data</h2>
            <p>
              All transactions within the Moval Society are recorded on a local blockchain. This blockchain is only accessible to users within the ecosystem and is not publicly available. Transaction data includes the sender, receiver, amount, and timestamp. This data is stored indefinitely as part of the blockchain's immutable record.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Information Sharing</h2>
            <p>
              We do not sell or rent your personal information to third parties. Within the ecosystem, information may be shared with:
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li>The Association, for governance purposes</li>
              <li>The Justice Department, for dispute resolution</li>
              <li>The Banker, for currency management</li>
            </ul>
            <p className="mt-2">
              Basic information (such as usernames) may be visible to other users in the context of transactions, elections, or disputes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information. However, no electronic transmission or storage system is 100% secure. We cannot guarantee the absolute security of your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Your Rights</h2>
            <p>Depending on your location, you may have rights regarding your personal data, including:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Access to your personal information</li>
              <li>Correction of inaccurate data</li>
              <li>Deletion of your data (subject to our legal obligations)</li>
              <li>Restriction of processing</li>
              <li>Data portability</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, please contact us through the application or at privacy@movalsociety.com.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Children's Privacy</h2>
            <p>
              Our application is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Effective Date" at the top. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Contact Information</h2>
            <p>
              For questions about this Privacy Policy, please contact us at privacy@movalsociety.com.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default Privacy;
