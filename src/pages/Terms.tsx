import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p>By accessing and using VAULT, you accept and agree to be bound by these Terms of Service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p>VAULT provides AI-powered creative asset analysis and protection services. Our service helps you identify, organize, and protect your most valuable creative work.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Content Ownership</h2>
            <p>You retain all rights to the photos and creative assets you upload to VAULT. We do not claim ownership of your content.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Upload content that violates intellectual property rights</li>
              <li>Use the service for illegal purposes</li>
              <li>Attempt to access other users' accounts or data</li>
              <li>Interfere with or disrupt the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Third-Party Integrations</h2>
            <p>VAULT integrates with third-party services like Google Photos. Your use of these services is governed by their respective terms of service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. AI Analysis</h2>
            <p>Our AI analysis is provided for informational purposes. While we strive for accuracy, we cannot guarantee the precision of AI-generated insights.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Service Modifications</h2>
            <p>We reserve the right to modify or discontinue the service at any time, with or without notice.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
            <p>VAULT is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Termination</h2>
            <p>We may terminate or suspend your account at any time for violation of these terms.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
            <p>We may update these terms from time to time. Continued use of the service constitutes acceptance of updated terms.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Contact</h2>
            <p>For questions about these Terms of Service, please contact us through the app.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
