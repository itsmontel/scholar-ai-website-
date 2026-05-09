import React from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';

interface TermsOfServicePageProps {
  onNavigate: (page: string) => void;
  user?: {
    id: string;
    name: string;
    email: string;
    firstName?: string;
    lastName?: string;
    plan: string;
    subscription_status?: string;
    email_verified?: boolean;
  } | null;
  onLogout?: () => void;
}

const TermsOfServicePage: React.FC<TermsOfServicePageProps> = ({ onNavigate, user, onLogout }) => {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="terms" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Hero / Title Card */}
        <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8 md:p-10 mb-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5" style={{ backgroundColor: '#DDF4FF' }}>
              <svg className="w-8 h-8" style={{ color: '#1CB0F6' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-stone-800 dark:text-stone-100 mb-3">
              Terms of Service
            </h1>
            <p className="text-stone-500 dark:text-stone-400 font-bold text-sm uppercase tracking-wide">
              Last updated: May 9, 2026
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">

          {/* Section 1 */}
          <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">1. Acceptance of Terms</h2>
            <div className="space-y-4 text-stone-600 dark:text-stone-400 leading-relaxed">
              <p>
                By accessing and using WriteScholar ("the Service"), you accept and agree to be bound by
                these Terms of Service. If you do not agree, please do not use this service. These terms
                apply to all visitors, registered users, and paid subscribers.
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">2. Description of Service</h2>
            <div className="space-y-4 text-stone-600 dark:text-stone-400 leading-relaxed">
              <p>
                WriteScholar is an AI-powered academic toolkit for students. Our service includes the
                following features, some of which are subject to plan-based usage limits:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-stone-700 dark:text-stone-300">Essay Analyzer</strong> — professor-style AI feedback on structure, grammar, argument, citations, and tone</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Citation Finder</strong> — discovers and formats academic sources in APA, MLA, Chicago, Harvard, and other styles</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Study Pack</strong> — generates interactive lessons, flashcards, quizzes, crosswords, Crater Blast & Word Tower (quiz games) from your notes in one go</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Paper Summarizer</strong> — condenses documents into bullet points or paragraph summaries</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Focus Mode</strong> — Chrome extension that blocks distracting sites until you complete study goals</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Document Upload &amp; Library</strong> — upload and manage PDF, DOCX, and TXT files</li>
                <li><strong className="text-stone-700 dark:text-stone-300">PDF &amp; DOCX Export</strong> — download quizzes, flashcards, and analyses as formatted documents</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Badges &amp; Achievements</strong> — earn badges for study milestones and usage</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Free Tools</strong> — word counter, grammar checker, thesis generator, essay outline generator, readability score, citation generator, text case converter, paraphrasing tips, GPA calculator, Pomodoro timer, scientific calculator, and unit converter</li>
              </ul>
              <p>
                Optional social features (such as sharing study materials with other users) may be offered in some versions of the app. Features and limits vary by plan. We reserve the right to modify, add, or remove features
                at any time with reasonable notice.
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">3. Subscription Plans and Usage Limits</h2>
            <div className="space-y-4 text-stone-600 dark:text-stone-400 leading-relaxed">
              <p>WriteScholar offers the following plans:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-stone-700 dark:text-stone-300">Free</strong> — 3 documents per month, 2 AI essay analyses per month, 5,000 words/month for the Paper Summarizer, 2 study pack generations (lesson, flashcards & quiz — crossword, Crater Blast & Word Tower unlock with Pro), 2 citation searches per month, 2MB total document library storage</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Pro ($19.99/month)</strong> — 99 combined actions per month (analyses, study packs & citations), 999,999 words/month for the Paper Summarizer; quiz, flashcards, crossword, Crater Blast & Word Tower with all types and difficulties; Focus Mode with unlimited blocked sites; document uploads up to 100MB per file; 100MB total library storage; full annotations and feedback; one-click Apply WriteScholar revisions into your draft</li>
                <li><strong className="text-stone-700 dark:text-stone-300">Premium ($39.99/month)</strong> — everything in Pro with 5× usage (499 combined actions per month, unlimited research-paper summarisation) and 1GB total library storage</li>
              </ul>
              <p>
                Usage limits reset based on your plan: paid subscribers' limits reset at the start of each billing period; free users' limits reset on rolling 30-day periods from signup. Unused allowances do not carry
                over. We reserve the right to adjust plan limits and pricing with 30 days' notice to existing
                subscribers.
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">4. User Accounts</h2>
            <div className="space-y-4 text-stone-600 dark:text-stone-400 leading-relaxed">
              <p>To use the service, you must:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate and complete registration information</li>
                <li>Verify your email address to activate your account</li>
                <li>Maintain the security of your account credentials</li>
                <li>Be responsible for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use at support@writescholar.com</li>
              </ul>
              <p>
                You may register using an email and password or via Google OAuth. You must be at least
                <strong className="text-stone-700 dark:text-stone-300"> 14 years old</strong> to create an account. If the law in your jurisdiction sets a higher minimum age for using online services without parental consent (for example, 16 in some EU member states), you must meet that age — or have verifiable parental authorisation — to use the service.
              </p>
            </div>
          </div>

          {/* Section 5 */}
          <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">5. Acceptable Use</h2>
            <div className="space-y-4 text-stone-600 dark:text-stone-400 leading-relaxed">
              <p>You agree to use the service only for lawful purposes. You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Upload content that violates any laws or infringes third-party rights</li>
                <li>Attempt to circumvent usage limits or access controls</li>
                <li>Reverse-engineer, scrape, or systematically extract our AI outputs</li>
                <li>Use the service to generate content for resale or distribution without permission</li>
                <li>Interfere with or disrupt the service, servers, or networks</li>
                <li>Upload malicious software, spam, or harmful code</li>
                <li>Use automated bots or scripts to abuse the service</li>
              </ul>
              <div className="border-2 border-b-4 rounded-xl p-4 mt-4" style={{ borderColor: '#FF9600', backgroundColor: '#FFF4E0' }}>
                <p className="dark:text-stone-800">
                  <strong className="font-extrabold" style={{ color: '#D97F00' }}>Academic Integrity:</strong> WriteScholar's tools are designed to help you learn,
                  improve, and understand your work. You are solely responsible for ensuring that your use of
                  our service — including the Study Pack (quizzes, flashcards, crosswords, lessons), Essay Analyzer, Paper Summarizer, and Citation Finder — complies with
                  your institution's academic integrity policies. WriteScholar does not encourage or condone
                  academic dishonesty.
                </p>
              </div>
            </div>
          </div>

          {/* Section 6 */}
          <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">6. Content and Intellectual Property</h2>
            <div className="space-y-4 text-stone-600 dark:text-stone-400 leading-relaxed">
              <p>
                You retain ownership of all content you upload to WriteScholar. By using the service,
                you grant us a limited, non-exclusive license to process, analyze, and temporarily store
                your content solely to provide the service to you.
              </p>
              <p>
                <strong className="text-stone-700 dark:text-stone-300">AI-generated outputs</strong> (essay feedback, citations, lessons, quiz questions, flashcards, crossword puzzles, summaries) are provided for your personal use. We do not claim ownership of
                these outputs, but make no representations about their accuracy, originality, or
                fitness for any particular purpose.
              </p>
              <p>
                WriteScholar's software, brand, interface, and underlying technology are protected by
                intellectual property laws. You may not copy, modify, or distribute our platform without
                written permission.
              </p>
            </div>
          </div>

          {/* Section 7 */}
          <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">7. Payment and Billing</h2>
            <div className="space-y-4 text-stone-600 dark:text-stone-400 leading-relaxed">
              <p>
                Paid subscriptions are billed in advance on a monthly or annual basis via Stripe, our
                third-party payment processor. By subscribing, you authorize us to charge your payment
                method on a recurring basis.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Payment is due at the start of each billing period</li>
                <li>Failed payments may result in service downgrade or suspension</li>
                <li>You may cancel your subscription at any time; access continues until the end of the paid period</li>
                <li>You may upgrade or downgrade your plan at any time through your Billing settings</li>
                <li>Promotional codes may be applied at checkout and are subject to their own terms</li>
                <li>
                  <strong className="text-stone-700 dark:text-stone-300">14-day refund window:</strong> If you cancel a new paid subscription within 14 days of your initial purchase, you may request a full refund — regardless of where you live. To request a refund within this window, email <a href="mailto:support@writescholar.com" className="font-bold hover:underline" style={{ color: '#1CB0F6' }}>support@writescholar.com</a> from the email address on the account. Refunds are typically processed within 5–10 business days back to your original payment method.
                </li>
                <li>After the 14-day window has passed, fees are non-refundable except where required by applicable consumer-protection law in your jurisdiction</li>
                <li>We reserve the right to change pricing with 30 days' notice to existing subscribers</li>
              </ul>
            </div>
          </div>

          {/* Section 8 */}
          <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">8. AI Processing Disclosure</h2>
            <div className="space-y-4 text-stone-600 dark:text-stone-400 leading-relaxed">
              <p>
                Our AI features (Essay Analyzer, Citation Finder, Study Pack — lessons, flashcards, quizzes, crosswords — and Paper Summarizer)
                are powered by large language models provided by OpenAI. When you use these features,
                your submitted text is sent to OpenAI's API for processing. OpenAI's use of this data is
                governed by their own Privacy Policy and API usage policies. Focus Mode runs as a Chrome extension and processes site-blocking rules locally; no content from blocked sites is sent to our servers.
              </p>
              <p>
                We do not use your submitted content to train our own AI models. However, as an API
                customer of OpenAI, data handling on their end is subject to their terms.
              </p>
              <div className="border-2 border-b-4 rounded-xl p-4 mt-2" style={{ borderColor: '#FF4B4B', backgroundColor: '#FFE8E8' }}>
                <p className="font-bold dark:text-stone-800" style={{ color: '#E04343' }}>
                  AI outputs may occasionally be inaccurate, incomplete, or biased. Always review and
                  verify AI-generated content before using it academically or professionally.
                </p>
              </div>
            </div>
          </div>

          {/* Section 9 */}
          <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">9. Service Availability</h2>
            <div className="space-y-4 text-stone-600 dark:text-stone-400 leading-relaxed">
              <p>
                We strive to maintain high service availability but cannot guarantee uninterrupted access.
                We may temporarily suspend service for maintenance, updates, or technical issues without
                prior notice. We are not liable for any damages resulting from service unavailability.
              </p>
            </div>
          </div>

          {/* Section 10 */}
          <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">10. Privacy and Data Protection</h2>
            <div className="space-y-4 text-stone-600 dark:text-stone-400 leading-relaxed">
              <p>
                Your privacy is important to us. Please review our{' '}
                <button onClick={() => onNavigate('privacy')} className="font-extrabold hover:underline" style={{ color: '#1CB0F6' }}>Privacy Policy</button>{' '}
                to understand how we collect, use, and protect your information, including how your
                content is processed by third-party AI providers.
              </p>
            </div>
          </div>

          {/* Section 11 */}
          <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">11. Disclaimers and Limitations of Liability</h2>
            <div className="space-y-4 text-stone-600 dark:text-stone-400 leading-relaxed">
              <p>
                The service is provided "as is" without warranties of any kind, express or implied. We do
                not guarantee the accuracy, completeness, or reliability of AI-generated outputs including
                essay feedback, citations, lessons, quiz questions, flashcards, crossword puzzles, or summaries. You use the service
                at your own risk.
              </p>
              <p>
                To the maximum extent permitted by law, WriteScholar shall not be liable for any indirect,
                incidental, special, consequential, or punitive damages, including loss of data, revenue, or
                academic standing, arising from your use of or inability to use the service.
              </p>
            </div>
          </div>

          {/* Section 12 */}
          <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">12. Termination</h2>
            <div className="space-y-4 text-stone-600 dark:text-stone-400 leading-relaxed">
              <p>
                We may terminate or suspend your account at any time for violation of these terms, abuse
                of the service, or non-payment. You may delete your account at any time via Account Settings.
              </p>
              <p>
                Upon termination, your right to use the service ceases immediately. We may delete your
                account and associated data, including uploaded documents, study pack history (quizzes, flashcards, crosswords, lessons), analysis history, citation history, optional social or sharing data if applicable, and badge progress.
              </p>
            </div>
          </div>

          {/* Section 13 */}
          <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">13. Changes to Terms</h2>
            <div className="space-y-4 text-stone-600 dark:text-stone-400 leading-relaxed">
              <p>
                We reserve the right to modify these terms at any time. We will notify users of material
                changes via email or in-app notice. Continued use of the service after changes take effect
                constitutes acceptance of the updated terms.
              </p>
            </div>
          </div>

          {/* Section 14 */}
          <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">14. Governing Law</h2>
            <div className="space-y-4 text-stone-600 dark:text-stone-400 leading-relaxed">
              <p>
                These terms shall be governed by and construed in accordance with applicable laws.
                Any disputes arising from these terms or your use of the service shall be resolved
                through binding arbitration, except where prohibited by law.
              </p>
            </div>
          </div>

          {/* Section 15 */}
          <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">15. Contact Information</h2>
            <div className="space-y-4 text-stone-600 dark:text-stone-400 leading-relaxed">
              <p>If you have any questions about these terms, please contact us at:</p>
              <div className="border-2 border-b-4 rounded-xl p-4" style={{ borderColor: '#A560E8', backgroundColor: '#F3EAFF' }}>
                <p className="dark:text-stone-800"><strong className="font-extrabold" style={{ color: '#8A48C7' }}>Email:</strong> legal@writescholar.com</p>
                <p className="dark:text-stone-800"><strong className="font-extrabold" style={{ color: '#8A48C7' }}>Support:</strong> support@writescholar.com</p>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => onNavigate('dashboard')}
            className="px-8 py-3 border-2 border-b-4 active:border-b-2 active:translate-y-0.5 transition-all font-extrabold uppercase tracking-wide rounded-xl text-white"
            style={{ backgroundColor: '#58CC02', borderColor: '#46A302' }}
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => onNavigate('privacy')}
            className="px-8 py-3 border-2 border-b-4 active:border-b-2 active:translate-y-0.5 transition-all font-extrabold uppercase tracking-wide rounded-xl text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            View Privacy Policy
          </button>
        </div>
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default TermsOfServicePage;
