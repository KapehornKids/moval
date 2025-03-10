
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { CardCustom, CardContent, CardHeader, CardTitle } from "@/components/ui/card-custom";

const TermsPage = () => {
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
            <CardTitle className="text-2xl">Terms and Conditions</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <h2>1. Agreement to Terms</h2>
            <p>
              By accessing or using the Moval Society application, you agree to be bound by these Terms and Conditions. If you disagree with any part of the terms, you may not access the application.
            </p>

            <h2>2. Use License</h2>
            <p>
              Permission is granted to temporarily use the Moval Society application for personal, non-commercial transactional purposes only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul>
              <li>Modify or copy the materials;</li>
              <li>Use the materials for any commercial purpose;</li>
              <li>Attempt to decompile or reverse engineer any software contained in Moval Society;</li>
              <li>Remove any copyright or other proprietary notations from the materials; or</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server.</li>
            </ul>

            <h2>3. Disclaimer</h2>
            <p>
              The materials within Moval Society are provided on an 'as is' basis. The Moval Society makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>

            <h2>4. Limitations</h2>
            <p>
              In no event shall the Moval Society or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Moval Society, even if the Moval Society or a authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>

            <h2>5. Accuracy of Materials</h2>
            <p>
              The materials appearing within Moval Society could include technical, typographical, or photographic errors. The Moval Society does not warrant that any of the materials on its application are accurate, complete or current. The Moval Society may make changes to the materials contained on its application at any time without notice.
            </p>

            <h2>6. Links</h2>
            <p>
              The Moval Society has not reviewed all of the sites linked to its application and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by the Moval Society of the site. Use of any such linked website is at the user's own risk.
            </p>

            <h2>7. Modifications</h2>
            <p>
              The Moval Society may revise these terms of service for its application at any time without notice. By using this application, you are agreeing to be bound by the then current version of these terms of service.
            </p>

            <h2>8. Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws of [your country] and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>

            <h2>9. Moval Society Currency and Transactions</h2>
            <p>
              The Moval (M) is a digital token used exclusively within the Moval Society application. The following rules apply to all Moval transactions:
            </p>
            <ul>
              <li>Movals hold no value outside of the Moval Society application;</li>
              <li>Users can transfer Movals between registered members only;</li>
              <li>All transactions are recorded and monitored for security purposes;</li>
              <li>Conversion rates between Movals and real currencies are set by appointed Bankers;</li>
              <li>Users are responsible for all transactions made from their accounts;</li>
              <li>The Moval Society reserves the right to freeze accounts suspected of fraudulent activity.</li>
            </ul>

            <h2>10. Contact Us</h2>
            <p>
              If you have any questions about these Terms and Conditions, please contact us.
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

export default TermsPage;
