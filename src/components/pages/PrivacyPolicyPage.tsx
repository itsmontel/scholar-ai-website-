import React from 'react';
import Header from '../common/Header';

interface PrivacyPolicyPageProps {
  onNavigate: (page: string) => void;
  user?: { name: string; email: string } | null;
  onLogout?: () => void;
}

const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onNavigate, user, onLogout }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="privacy" />
      
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-8 md:p-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
              <div className="space-y-4 text-gray-700">
                <p>We collect the following types of information:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Account Information:</strong> First name, last name, email address, and hashed password when you register. If you sign in via Google, we receive your name and email from Google OAuth.</li>
                  <li><strong>Text Content You Submit:</strong> Essays, documents, notes, and other text you paste or upload to use our AI tools (Humanizer, Summarizer, Quiz Generator, Citation Finder, Essay Analyzer).</li>
                  <li><strong>Uploaded Documents:</strong> PDF, DOCX, and TXT files you upload for analysis, stored securely in cloud storage.</li>
                  <li><strong>Usage Data:</strong> Monthly word counts for Humanizer, Summarizer, and Quiz Generator; number of analyses, citation searches, and quiz generations performed; feature usage patterns.</li>
                  <li><strong>Payment Information:</strong> Billing is processed by Stripe. We do not store your credit card number. We receive and store your Stripe customer ID and subscription status.</li>
                  <li><strong>Email Subscription Status:</strong> Whether you have subscribed to or unsubscribed from marketing communications.</li>
                  <li><strong>Communications:</strong> Messages you send to our support team.</li>
                  <li><strong>Technical Data:</strong> IP address, browser type, and approximate location for security and rate-limiting purposes.</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <div className="space-y-4 text-gray-700">
                <p>We use the information we collect to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide and operate all WriteScholar features and AI tools</li>
                  <li>Process your text through AI models to deliver Humanizer, Summarizer, Quiz Generator, Citation Finder, and Essay Analyzer results</li>
                  <li>Enforce monthly usage limits according to your subscription plan</li>
                  <li>Send transactional emails: account verification, password reset, and billing notifications</li>
                  <li>Send optional marketing emails about new features and updates (you may unsubscribe at any time)</li>
                  <li>Respond to support requests and questions</li>
                  <li>Detect and prevent abuse, fraud, and security threats</li>
                  <li>Analyse aggregate usage patterns to improve the service</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Third-Party Service Providers</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We share data with the following trusted service providers strictly as necessary to
                  operate the service. We do not sell your personal data.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>OpenAI</strong> — Text you submit to AI-powered features (Humanizer, Summarizer, Quiz Generator, Citation Finder, Essay Analyzer) is sent to OpenAI's API for processing. OpenAI's use of API data is governed by their <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Privacy Policy</a>.</li>
                  <li><strong>Stripe</strong> — Payment processing and subscription management. Stripe receives your billing information. See <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Stripe's Privacy Policy</a>.</li>
                  <li><strong>Supabase</strong> — Our primary database and optional file storage provider, hosting your account data, document metadata, usage records, and quiz history.</li>
                  <li><strong>Amazon Web Services (S3)</strong> — Cloud storage for uploaded document files in production environments.</li>
                  <li><strong>Email Provider (SMTP)</strong> — Transactional and marketing emails are delivered via our configured email service.</li>
                </ul>
                <p>
                  We may also disclose information when required by law or to protect our legal rights.
                  In the event of a merger or acquisition, user information may be transferred to the
                  successor entity.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. AI Processing and Your Content</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  When you use AI-powered features, the text you submit is transmitted to OpenAI's API.
                  We do not use your submitted content to train our own AI models. However, as an API
                  customer, OpenAI's own data handling policies apply to data sent through their API.
                </p>
                <p>
                  AI-generated outputs (humanized text, summaries, quiz questions, citation suggestions,
                  essay feedback) are provided as tools to assist your work. We make no warranty that
                  these outputs are accurate, original, or free from error. You are responsible for
                  reviewing all AI outputs before use.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Storage and Local Storage</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Your account data is stored in a secure cloud database (Supabase/PostgreSQL). Uploaded
                  documents are stored in encrypted cloud object storage (Supabase Storage or AWS S3).
                </p>
                <p>
                  WriteScholar stores your authentication token and basic account information (name,
                  email, plan) in your browser's <strong>localStorage</strong> to keep you logged in
                  between sessions. This data is not shared with third parties and is cleared when you
                  log out.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Security</h2>
              <div className="space-y-4 text-gray-700">
                <p>We protect your information using industry-standard measures including:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>HTTPS encryption for all data in transit</li>
                  <li>Bcrypt password hashing (no plaintext passwords stored)</li>
                  <li>JWT authentication with token expiry and refresh</li>
                  <li>Rate limiting on all API endpoints to prevent abuse</li>
                  <li>Security headers (HSTS, CSP, X-Frame-Options) via Helmet</li>
                  <li>Input validation and sanitisation on all user-submitted data</li>
                </ul>
                <p>
                  No method of transmission or storage is 100% secure. We cannot guarantee absolute
                  security, but we take reasonable steps to protect your data.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
              <div className="space-y-4 text-gray-700">
                <p>We retain data for as long as necessary to provide the service:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Account data:</strong> Retained while your account is active. Deleted upon account deletion.</li>
                  <li><strong>Uploaded documents:</strong> Retained until you delete them or your account.</li>
                  <li><strong>Quiz history:</strong> Quizzes are automatically deleted after 7 days.</li>
                  <li><strong>Citation history and analysis history:</strong> Retained until deleted by you or as part of periodic cleanup.</li>
                  <li><strong>Monthly usage records:</strong> Retained for billing verification and limit enforcement.</li>
                  <li><strong>Email subscription records:</strong> Retained to honour unsubscribe requests; unsubscribing prevents you from being re-added.</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Your Rights</h2>
              <div className="space-y-4 text-gray-700">
                <p>You have the following rights regarding your personal data:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Access &amp; Update:</strong> View and edit your profile at any time in Account Settings</li>
                  <li><strong>Delete:</strong> Delete your account and all associated data via Account Settings or by contacting us</li>
                  <li><strong>Unsubscribe:</strong> Opt out of marketing emails at any time via the unsubscribe link or Settings</li>
                  <li><strong>Data Portability:</strong> Request a copy of your data by contacting privacy@writescholar.com</li>
                  <li><strong>Withdraw Consent:</strong> Stop using the service and delete your account at any time</li>
                </ul>
                <p>
                  If you are located in the EU/EEA or UK, you may have additional rights under GDPR,
                  including the right to lodge a complaint with your local supervisory authority.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Cookies and Browser Storage</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  WriteScholar uses browser <strong>localStorage</strong> (not cookies) to store your
                  session token and basic user profile to keep you logged in. We do not currently use
                  advertising cookies or third-party tracking pixels.
                </p>
                <p>
                  We may use session cookies for security purposes (CSRF protection). You can clear
                  localStorage and cookies through your browser settings, which will log you out.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Children's Privacy</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  WriteScholar is not intended for children under 13 years of age. We do not knowingly
                  collect personal information from children under 13. If we become aware that we have
                  collected such information, we will delete it promptly.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to This Policy</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We may update this privacy policy from time to time. We will notify you of material
                  changes by email or in-app notice before they take effect, and by updating the
                  "Last updated" date at the top of this page.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  If you have any questions about this privacy policy or your personal data, please contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>Privacy enquiries:</strong> privacy@writescholar.com</p>
                  <p><strong>General support:</strong> support@writescholar.com</p>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate('dashboard')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => onNavigate('contact')}
                className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 px-8 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicyPage;
