
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { CardCustom, CardContent, CardHeader, CardTitle } from "@/components/ui/card-custom";

const PrivacyPage = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Layout>
      <div className="container max-w-4xl py-8 px-4">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6"
          onClick={handleGoBack}
        >
          <ArrowLeft size={16} className="mr-2" /> Back
        </Button>

        <CardCustom>
          <CardHeader>
            <CardTitle className="text-2xl">Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p>
              Your privacy is important to us. It is Moval Society's policy to respect your privacy regarding any information we may collect from you through our application.
            </p>

            <h2>1. Information We Collect</h2>
            <p>
              We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we're collecting it and how it will be used.
            </p>
            
            <p>We may collect the following information:</p>
            <ul>
              <li>Personal identification information (Name, email address, phone number, etc.)</li>
              <li>Transaction history within the application</li>
              <li>Account balances and wallet information</li>
              <li>Voting records and preferences</li>
              <li>Communication preferences</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>
              We use the information we collect in various ways, including to:
            </p>
            <ul>
              <li>Provide, operate, and maintain our application</li>
              <li>Improve, personalize, and expand our application</li>
              <li>Understand and analyze how you use our application</li>
              <li>Develop new products, services, features, and functionality</li>
              <li>Process transactions and maintain transaction records</li>
              <li>Communicate with you about updates, security alerts, and support</li>
              <li>Prevent fraudulent activities and ensure the security of your account</li>
            </ul>

            <h2>3. Data Retention</h2>
            <p>
              We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we'll protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.
            </p>

            <h2>4. Blockchain Records</h2>
            <p>
              As part of our service, transaction data is recorded on a local blockchain within the Moval Society application. This information is used to:
            </p>
            <ul>
              <li>Maintain an immutable record of all Moval transactions</li>
              <li>Allow for transparency in the system</li>
              <li>Enable the Justice Department to resolve disputes when necessary</li>
            </ul>
            <p>
              The blockchain data does not contain personally identifiable information, but does contain transaction amounts, timestamps, and internal account identifiers.
            </p>

            <h2>5. Information Sharing</h2>
            <p>
              We don't share any personally identifying information publicly or with third-parties, except when required to by law. Your information may be accessible to:
            </p>
            <ul>
              <li>Association members (for governance purposes)</li>
              <li>Justice Department members (for dispute resolution)</li>
              <li>Bankers (for transaction processing)</li>
            </ul>
            <p>
              These role-based accesses are controlled by strict permissions and are only granted to authorized members of the Moval Society.
            </p>

            <h2>6. Your Rights</h2>
            <p>
              You have the right to:
            </p>
            <ul>
              <li>Access the personal information we have about you</li>
              <li>Request correction of your personal information</li>
              <li>Request deletion of your personal information, subject to record-keeping requirements</li>
              <li>Receive a copy of your personal data in a structured, machine-readable format</li>
              <li>Object to our processing of your personal information</li>
            </ul>

            <h2>7. Security</h2>
            <p>
              We value your trust in providing us your personal information, thus we strive to use commercially acceptable means of protecting it. But remember that no method of transmission over the internet, or method of electronic storage is 100% secure and reliable, and we cannot guarantee its absolute security.
            </p>

            <h2>8. Changes to This Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
            </p>

            <h2>9. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us.
            </p>

            <div className="text-sm text-muted-foreground mt-8">
              Last updated: {new Date().toLocaleDateString()}
            </div>
          </CardContent>
        </CardCustom>
      </div>
    </Layout>
  );
};

export default PrivacyPage;
