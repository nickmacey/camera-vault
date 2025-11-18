import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <Shield className="h-5 w-5" />
          <span>Back to Vault</span>
        </Link>

        <h1 className="text-4xl font-bold mb-8 text-foreground">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Introduction</h2>
            <p>
              Welcome to Camera Vault. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Information We Collect</h2>
            <p>We collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Email address and authentication credentials when you create an account</li>
              <li><strong>Photo Content:</strong> Images you upload to analyze and store in your vault</li>
              <li><strong>Photo Metadata:</strong> EXIF data, location information, camera settings, and dates associated with your photos</li>
              <li><strong>Connected Services:</strong> When you connect external photo services like Google Photos, we access photos from those services with your permission</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our service, including feature usage and preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and improve our photo analysis and vault services</li>
              <li>Analyze your photos using AI to generate scores, tags, and descriptions</li>
              <li>Store and organize your photo collection securely</li>
              <li>Sync photos from connected external services</li>
              <li>Generate social media captions and content suggestions</li>
              <li>Communicate with you about service updates and features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data. Your photos are stored securely, and access is restricted to your account only. We use encryption for data transmission and storage. Our authentication system ensures only you can access your vault.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Third-Party Services</h2>
            <p>
              When you connect external services like Google Photos, we access your photos through their official APIs with your explicit permission. We only request the minimum permissions necessary to provide our service. You can disconnect these services at any time from your settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Data Retention and Deletion</h2>
            <p>
              Your photos and data remain in your vault until you choose to delete them. You can delete individual photos or your entire account at any time. When you delete data, it is permanently removed from our systems.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and all associated data</li>
              <li>Export your photos and data</li>
              <li>Disconnect external services</li>
              <li>Opt out of certain data collection practices</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Cookies and Tracking</h2>
            <p>
              We use essential cookies to maintain your session and preferences. We do not use tracking cookies or share your data with third-party advertisers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any significant changes by email or through our service. Your continued use of the service after changes indicates your acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or how we handle your data, please contact us through our support channels.
            </p>
          </section>

          <p className="text-sm text-muted-foreground mt-8">
            Last updated: November 18, 2025
          </p>
        </div>
      </div>
    </div>
  );
}
