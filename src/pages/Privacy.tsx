
import Layout from "@/components/layout/Layout";

const Privacy = () => {
  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-sm sm:prose max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p>
              At Moval Society, we respect your privacy and are committed to protecting your personal data.
              This Privacy Policy explains how we collect, use, store, and protect your information when you use our platform.
            </p>
            <p>
              By using the Moval Society platform, you consent to the data practices described in this policy.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>
            <p>We collect several types of information from and about users of our platform, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Personal Information:</strong> This includes your name, email address, and other identifiers.
              </li>
              <li>
                <strong>Account Information:</strong> Details related to your account such as username, password (encrypted), and user preferences.
              </li>
              <li>
                <strong>Transaction Data:</strong> Records of Moval transactions, including transfers, loans, and repayments.
              </li>
              <li>
                <strong>Voting Records:</strong> Information about your participation in platform governance, including votes cast.
              </li>
              <li>
                <strong>Communications:</strong> Content of messages sent through the platform.
              </li>
              <li>
                <strong>Technical Data:</strong> Internet protocol (IP) address, browser type and version, time zone setting, operating system, and device information.
              </li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. How We Collect Your Information</h2>
            <p>We collect information through the following methods:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Direct Interactions:</strong> Information you provide when creating an account, making transactions, or communicating within the platform.
              </li>
              <li>
                <strong>Automated Technologies:</strong> As you interact with our platform, we may automatically collect technical data about your device and browsing actions.
              </li>
              <li>
                <strong>Blockchain Records:</strong> All Moval transactions are recorded on our blockchain system.
              </li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. How We Use Your Information</h2>
            <p>We use your information for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To create and manage your account.</li>
              <li>To facilitate Moval transactions within the platform.</li>
              <li>To process loan applications and repayments.</li>
              <li>To enable your participation in governance and voting.</li>
              <li>To maintain the integrity and security of the platform.</li>
              <li>To resolve disputes through the Justice Department.</li>
              <li>To improve the platform and develop new features.</li>
              <li>To comply with legal obligations.</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Information Access Within the Platform</h2>
            <p>
              Different roles within the platform have different levels of access to user information:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Association Members:</strong> May access aggregate data related to platform operations.
              </li>
              <li>
                <strong>Justice Department:</strong> May access transaction records and communications relevant to dispute resolution.
              </li>
              <li>
                <strong>Banker:</strong> May access transaction data related to Moval operations.
              </li>
              <li>
                <strong>Regular Users:</strong> May only access their own information and public platform data.
              </li>
            </ul>
            <p>
              All access to user data is logged and subject to oversight by platform administrators.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, 
              alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encryption of sensitive data.</li>
              <li>Blockchain technology for transaction records.</li>
              <li>Regular security assessments.</li>
              <li>Access controls for platform officials.</li>
              <li>Staff training on data protection.</li>
            </ul>
            <p>
              Despite our efforts, no method of transmission over the Internet or electronic storage is 100% secure. 
              We cannot guarantee absolute security.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Your Privacy Rights</h2>
            <p>
              Depending on your jurisdiction, you may have the following rights regarding your personal data:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The right to access your personal information.</li>
              <li>The right to correct inaccurate or incomplete information.</li>
              <li>The right to delete your personal information under certain circumstances.</li>
              <li>The right to restrict processing of your personal information.</li>
              <li>The right to data portability.</li>
              <li>The right to object to processing of your personal information.</li>
            </ul>
            <p>
              To exercise these rights, please contact us using the information provided in Section 10.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to fulfill the purposes for which we collected it, 
              including for the purposes of satisfying any legal, accounting, or reporting requirements.
            </p>
            <p>
              Transaction records on the blockchain are permanent and cannot be deleted due to the nature of blockchain technology.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. The updated version will be indicated by an updated "Last updated" date.
              We encourage you to review this Privacy Policy periodically to stay informed about how we are protecting your information.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Contact Information</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at privacy@movalsociety.com.
            </p>
          </section>
          
          <section>
            <p className="text-sm text-gray-500">
              Last updated: June 15, 2023
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default Privacy;
