import React from 'react';
import LoggedInPageShell from '../workspace/LoggedInPageShell';
import Footer from '../common/Footer';

interface PrivacyPolicyPageProps {
  onNavigate: (page: string) => void;
  user?: { name: string; email: string } | null;
  onLogout?: () => void;
}

const sectionIcon = (emoji: string) => (
  <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#EAFFD6] text-lg mr-3 shrink-0 border-2 border-b-4 border-[#58CC02]/30">
    {emoji}
  </span>
);

const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onNavigate, user, onLogout }) => {
  return (
    <LoggedInPageShell className="min-h-screen bg-stone-50 dark:bg-stone-950" user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="privacy">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Page title card */}
        <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8 md:p-10 mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#F3EAFF] border-2 border-b-4 border-[#A560E8]/30 mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-stone-800 dark:text-stone-100 mb-3">
            Privacy Policy
          </h1>
          <p className="text-stone-500 dark:text-stone-400 font-bold text-sm uppercase tracking-wide">
            Last updated: May 9, 2026
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">

          {/* 1 */}
          <section className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8">
            <h2 className="flex items-center text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">
              {sectionIcon('📋')}
              1. Information We Collect
            </h2>
            <div className="space-y-4 text-stone-600 dark:text-stone-400 leading-relaxed">
              <p>We collect the following types of information:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-stone-700 dark:text-stone-300">Account Information:</strong> First name, last name, email address, and hashed password when you register. If you sign in via Google, we receive your name and email from Google OAuth.</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Text Content You Submit:</strong> Essays, documents, notes, and other text you paste or upload to use our AI tools (Essay Analyzer, Citation Finder, Study Pack — lessons, flashcards, quizzes, crosswords — and Paper Summarizer).</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Uploaded Documents:</strong> PDF, DOCX, and TXT files you upload for analysis, stored securely in cloud storage.</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Usage Data:</strong> Monthly word counts for the Paper Summarizer and study tools; number of analyses, citation searches, and study pack generations performed; feature usage patterns; Focus Mode usage (sites blocked, unlocks); badges and achievements progress.</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Social &amp; Sharing Data (when available):</strong> If you use optional sharing features in the app, we may store friend connections, shared quizzes/flashcards/crosswords, and friend requests.</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Payment Information:</strong> Billing is processed by Stripe. We do not store your credit card number. We receive and store your Stripe customer ID and subscription status.</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Email Subscription Status:</strong> Whether you have subscribed to or unsubscribed from marketing communications.</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Communications:</strong> Messages you send to our support team.</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Technical Data:</strong> IP address, browser type, and approximate location for security and rate-limiting purposes.</li>
              </ul>
            </div>
          </section>

          {/* 2 */}
          <section className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8">
            <h2 className="flex items-center text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">
              {sectionIcon('⚙️')}
              2. How We Use Your Information
            </h2>
            <div className="space-y-4 text-stone-600 dark:text-stone-400 leading-relaxed">
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide and operate all WriteScholar features and AI tools</li>
                <li>Process your text through AI models to deliver Essay Analyzer, Citation Finder, Study Pack (lessons, flashcards, quizzes, crosswords), and Paper Summarizer results</li>
                <li>Enforce monthly usage limits according to your subscription plan</li>
                <li>Send transactional emails: account verification, password reset, and billing notifications</li>
                <li>Send optional marketing emails about new features and updates (you may unsubscribe at any time)</li>
                <li>Respond to support requests and questions</li>
                <li>Detect and prevent abuse, fraud, and security threats</li>
                <li>Analyse aggregate usage patterns to improve the service</li>
              </ul>
            </div>
          </section>

          {/* 3 */}
          <section className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8">
            <h2 className="flex items-center text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">
              {sectionIcon('🤝')}
              3. Third-Party Service Providers
            </h2>
            <div className="space-y-4 text-stone-600 dark:text-stone-400 leading-relaxed">
              <p>
                We share data with the following trusted service providers strictly as necessary to
                operate the service. We do not sell your personal data.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-stone-700 dark:text-stone-300">OpenAI</strong> — Text you submit to AI-powered features (Essay Analyzer, Citation Finder, Study Pack, Paper Summarizer) is sent to OpenAI's API for processing. OpenAI's use of API data is governed by their <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#1CB0F6] hover:text-[#1899D6] font-bold hover:underline">Privacy Policy</a>.</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Stripe</strong> — Payment processing and subscription management. Stripe receives your name, email address, and billing details (including country and postal code) when you start or manage a paid subscription. <strong className="text-stone-700 dark:text-stone-300">Your full credit/debit card number is entered directly into Stripe's secure form and is never sent to or stored on WriteScholar's servers.</strong> See <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#1CB0F6] hover:text-[#1899D6] font-bold hover:underline">Stripe's Privacy Policy</a>.</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Supabase</strong> — Our primary database and optional file storage provider, hosting your account data, document metadata, usage records, study pack history (quizzes, flashcards, crosswords, lessons), optional social/sharing data when those features are in use, and badge progress.</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Amazon Web Services (S3)</strong> — Cloud storage for uploaded document files in production environments.</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Email Provider (SMTP)</strong> — Transactional and marketing emails are delivered via our configured email service.</li>
              </ul>
              <p>
                We may also disclose information when required by law or to protect our legal rights.
                In the event of a merger or acquisition, user information may be transferred to the
                successor entity.
              </p>
            </div>
          </section>

          {/* 4 */}
          <section className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8">
            <h2 className="flex items-center text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">
              {sectionIcon('🤖')}
              4. AI Processing and Your Content
            </h2>
            <div className="space-y-4 text-stone-600 dark:text-stone-400 leading-relaxed">
              <p>
                When you use AI-powered features, the text you submit is transmitted to OpenAI's API.
                We do not use your submitted content to train our own AI models. However, as an API
                customer, OpenAI's own data handling policies apply to data sent through their API.
              </p>
              <p>
                AI-generated outputs (essay feedback, citations, lessons, quiz questions, flashcards, crossword puzzles, summaries) are provided as tools to assist your work. We make no warranty that
                these outputs are accurate, original, or free from error. You are responsible for
                reviewing all AI outputs before use.
              </p>
              <p>
                <strong className="text-stone-700 dark:text-stone-300">Focus Mode (Chrome extension):</strong> Focus Mode is an optional Chrome extension. Your list of blocked sites, unlock activity, and daily session statistics are stored locally in your browser using the extension's storage API. <strong className="text-stone-700 dark:text-stone-300">No browsing history, page content, or activity from blocked sites is transmitted to WriteScholar's servers.</strong> The extension uses host permissions (<code className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[0.85em]">&lt;all_urls&gt;</code>) only to detect when you visit a site on your block list and redirect you, not to read or transmit page contents.
              </p>
            </div>
          </section>

          {/* 5 */}
          <section className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8">
            <h2 className="flex items-center text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">
              {sectionIcon('💾')}
              5. Data Storage and Local Storage
            </h2>
            <div className="space-y-4 text-stone-600 dark:text-stone-400 leading-relaxed">
              <p>
                Your account data is stored in a secure cloud database (Supabase/PostgreSQL). Uploaded
                documents are stored in encrypted cloud object storage (Supabase Storage or AWS S3).
              </p>
              <p>
                WriteScholar stores your authentication token and basic account information (name,
                email, plan) in your browser's <strong className="text-stone-700 dark:text-stone-300">localStorage</strong> to keep you logged in
                between sessions. This data is not shared with third parties and is cleared when you
                log out.
              </p>
            </div>
          </section>

          {/* 6 */}
          <section className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8">
            <h2 className="flex items-center text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">
              {sectionIcon('🛡️')}
              6. Data Security
            </h2>
            <div className="space-y-4 text-stone-600 dark:text-stone-400 leading-relaxed">
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

          {/* 7 */}
          <section className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8">
            <h2 className="flex items-center text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">
              {sectionIcon('🗄️')}
              7. Data Retention
            </h2>
            <div className="space-y-4 text-stone-600 dark:text-stone-400 leading-relaxed">
              <p>We retain data for as long as necessary to provide the service:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-stone-700 dark:text-stone-300">Account data:</strong> Retained while your account is active. <strong className="text-stone-700 dark:text-stone-300">When you delete your account, all account data is permanently and immediately removed — there is no recovery period and we cannot restore deleted accounts.</strong></li>
                <li><strong className="text-stone-700 dark:text-stone-300">Uploaded documents:</strong> Retained until you delete them or your account.</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Study pack history (quizzes, flashcards, crosswords, lessons):</strong> Study materials are automatically deleted after 30 days.</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Citation history and analysis history:</strong> Retained until deleted by you or as part of periodic cleanup.</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Monthly usage records:</strong> Retained for billing verification and limit enforcement.</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Email subscription records:</strong> Retained to honour unsubscribe requests; unsubscribing prevents you from being re-added.</li>
              </ul>
            </div>
          </section>

          {/* 8 */}
          <section className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8">
            <h2 className="flex items-center text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">
              {sectionIcon('✊')}
              8. Your Rights
            </h2>
            <div className="space-y-4 text-stone-600 dark:text-stone-400 leading-relaxed">
              <p>You have the following rights regarding your personal data:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-stone-700 dark:text-stone-300">Access &amp; Update:</strong> View and edit your profile at any time in Account Settings</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Rectification:</strong> Correct inaccurate or incomplete personal data we hold about you</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Delete:</strong> Delete your account and all associated data via Account Settings or by contacting us</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Restrict Processing:</strong> Ask us to limit how we use your personal data (for example, while a correction request is being reviewed)</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Object:</strong> Object to processing of your personal data for direct marketing or where we rely on legitimate interests</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Unsubscribe:</strong> Opt out of marketing emails at any time via the unsubscribe link or Settings</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Data Portability:</strong> Request a copy of your data in a structured, machine-readable format by contacting privacy@writescholar.com</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Withdraw Consent:</strong> Stop using the service and delete your account at any time</li>
              </ul>
              <p>
                If you are located in the EU/EEA or UK, you may have additional rights under the GDPR
                (or UK GDPR), including the right to lodge a complaint with your local supervisory
                authority.
              </p>
              <div className="border-2 border-b-4 border-[#1CB0F6]/30 bg-[#DDF4FF] dark:bg-[#1CB0F6]/10 p-4 rounded-xl mt-2">
                <p className="text-stone-700 dark:text-stone-300">
                  <strong className="font-extrabold">California residents (CCPA / CPRA):</strong> If you are a California resident, you have additional rights including: (1) the right to know what personal information we collect, use, and disclose about you; (2) the right to request deletion of your personal information; (3) the right to opt out of the sale or sharing of your personal information; and (4) the right not to be discriminated against for exercising these rights. <strong className="font-extrabold">We do not sell your personal information and we do not share it for cross-context behavioural advertising.</strong> To exercise your CCPA rights, contact privacy@writescholar.com.
                </p>
              </div>
            </div>
          </section>

          {/* 9 */}
          <section className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8">
            <h2 className="flex items-center text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">
              {sectionIcon('🍪')}
              9. Cookies and Browser Storage
            </h2>
            <div className="space-y-4 text-stone-600 dark:text-stone-400 leading-relaxed">
              <p>
                WriteScholar uses browser <strong className="text-stone-700 dark:text-stone-300">localStorage</strong> (not cookies) to store your
                session token and basic user profile to keep you logged in. We do not currently use
                advertising cookies or third-party tracking pixels.
              </p>
              <p>
                We may use session cookies for security purposes (CSRF protection). You can clear
                localStorage and cookies through your browser settings, which will log you out.
              </p>
            </div>
          </section>

          {/* 10 */}
          <section className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8">
            <h2 className="flex items-center text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">
              {sectionIcon('👶')}
              10. Children's Privacy
            </h2>
            <div className="space-y-4 text-stone-600 dark:text-stone-400 leading-relaxed">
              <p>
                WriteScholar is intended for users aged <strong className="text-stone-700 dark:text-stone-300">14 and older</strong>. We do not knowingly collect personal information from anyone under 14.
              </p>
              <p>
                Some jurisdictions set a higher minimum age for digital consent — for example, parts of the EU/EEA require users to be 16 or older to consent to data processing without parental authorisation. <strong className="text-stone-700 dark:text-stone-300">If the law in your country sets a minimum age higher than 14, you must meet that age (or have verifiable parental consent) to use the service.</strong>
              </p>
              <p>
                If we become aware that we have collected information from a user below the applicable
                minimum age, we will delete that information promptly. Parents or guardians who believe
                their child has provided us with personal data may contact privacy@writescholar.com.
              </p>
            </div>
          </section>

          {/* 11 */}
          <section className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8">
            <h2 className="flex items-center text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">
              {sectionIcon('📝')}
              11. Changes to This Policy
            </h2>
            <div className="space-y-4 text-stone-600 dark:text-stone-400 leading-relaxed">
              <p>
                We may update this privacy policy from time to time. We will notify you of material
                changes by email or in-app notice before they take effect, and by updating the
                "Last updated" date at the top of this page.
              </p>
            </div>
          </section>

          {/* 12 */}
          <section className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8">
            <h2 className="flex items-center text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">
              {sectionIcon('📬')}
              12. Contact Us
            </h2>
            <div className="space-y-4 text-stone-600 dark:text-stone-400 leading-relaxed">
              <p>
                If you have any questions about this privacy policy or your personal data, please contact us:
              </p>
              <div className="border-2 border-b-4 border-[#1CB0F6]/30 bg-[#DDF4FF] dark:bg-[#1CB0F6]/10 p-5 rounded-xl">
                <p className="text-stone-700 dark:text-stone-300"><strong>Privacy enquiries:</strong> privacy@writescholar.com</p>
                <p className="text-stone-700 dark:text-stone-300 mt-1"><strong>General support:</strong> support@writescholar.com</p>
              </div>
            </div>
          </section>
        </div>

        {/* Bottom action buttons */}
        <div className="mt-10 border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-8 py-3 rounded-xl font-extrabold uppercase tracking-wide text-white bg-[#58CC02] border-2 border-b-4 border-[#46A302] hover:bg-[#4CAF00] active:border-b-2 active:translate-y-0.5 transition-all duration-150"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => onNavigate('contact')}
              className="px-8 py-3 rounded-xl font-extrabold uppercase tracking-wide text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 border-2 border-b-4 border-stone-300 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-700 active:border-b-2 active:translate-y-0.5 transition-all duration-150"
            >
              Contact Support
            </button>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </LoggedInPageShell>
  );
};

export default PrivacyPolicyPage;
