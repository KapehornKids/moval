
import Layout from "@/components/layout/Layout";

const Terms = () => {
  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8">Terms and Conditions</h1>
        
        <div className="prose prose-sm sm:prose max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p>
              Welcome to Moval Society. These Terms and Conditions govern your use of our platform
              and provide information about our digital society service.
            </p>
            <p>
              By accessing or using the Moval Society platform, you agree to be bound by these Terms and Conditions
              and our Privacy Policy.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Definitions</h2>
            <p>Throughout these Terms, we use specific terminology:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Movals:</strong> The digital currency used within the Moval Society platform.
              </li>
              <li>
                <strong>Platform:</strong> The Moval Society application and related services.
              </li>
              <li>
                <strong>User:</strong> Any individual who accesses or uses the Platform.
              </li>
              <li>
                <strong>Association:</strong> The governing body of the Moval Society.
              </li>
              <li>
                <strong>Justice Department:</strong> The dispute resolution authority within the Moval Society.
              </li>
              <li>
                <strong>Banker:</strong> The appointed individual responsible for managing Moval currency operations.
              </li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Account Registration</h2>
            <p>
              To use most features of the Platform, you must register for an account. When you register, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate, current, and complete information.</li>
              <li>Maintain and promptly update your account information.</li>
              <li>Keep your password secure and confidential.</li>
              <li>Accept responsibility for all activities that occur under your account.</li>
              <li>Notify us immediately of any unauthorized use of your account.</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Moval Currency</h2>
            <p>
              Movals are a digital currency with the following characteristics:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Movals have no monetary value outside the Platform.</li>
              <li>Movals cannot be exchanged for real currency or other assets outside the Platform.</li>
              <li>The conversion rate between Movals and reference currencies is managed by the appointed Banker.</li>
              <li>All Moval transactions are recorded on the Platform's blockchain system.</li>
              <li>Users are solely responsible for the security of their Moval balance.</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Loans</h2>
            <p>
              The Platform provides a loan system with the following conditions:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Loans are provided in Movals.</li>
              <li>All loans are subject to approval by the designated authorities.</li>
              <li>Loans accrue interest at rates determined by the Platform governance.</li>
              <li>Users must repay loans according to the agreed schedule.</li>
              <li>Failure to repay loans may result in penalties within the Platform.</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Governance and Voting</h2>
            <p>
              The Platform includes a governance system with the following features:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Users may participate in elections for Association members and Justice Department representatives.</li>
              <li>Elected officials have additional responsibilities and privileges within the Platform.</li>
              <li>Voting is conducted securely through the Platform.</li>
              <li>Users may stand as candidates for elected positions subject to eligibility requirements.</li>
              <li>The Association may make decisions affecting Platform operations.</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Dispute Resolution</h2>
            <p>
              In case of disputes between users:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Users should first attempt to resolve disputes amicably.</li>
              <li>Unresolved disputes may be referred to the Justice Department.</li>
              <li>The Justice Department has authority to review relevant transactions and communications.</li>
              <li>Decisions of the Justice Department are binding within the Platform.</li>
              <li>The Platform administrators retain final authority over all Platform operations.</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Prohibited Activities</h2>
            <p>
              Users are prohibited from:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violating any applicable laws or regulations.</li>
              <li>Impersonating other users or Platform officials.</li>
              <li>Attempting to manipulate the Platform's systems or databases.</li>
              <li>Engaging in harassment or abusive behavior toward other users.</li>
              <li>Creating multiple accounts for deceptive purposes.</li>
              <li>Attempting to convert Movals to real-world currency outside the Platform.</li>
              <li>Attempting to bypass or subvert the Platform's security measures.</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Modifications to Terms</h2>
            <p>
              We may modify these Terms at any time by posting the revised Terms on the Platform. 
              Your continued use of the Platform after the effective date of the revised Terms 
              constitutes your acceptance of the terms.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Contact Information</h2>
            <p>
              If you have any questions about these Terms, please contact us at admin@movalsociety.com.
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

export default Terms;
