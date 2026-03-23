import React from 'react';
import Header from '../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
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
    <div className="relative min-h-screen overflow-x-hidden">
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="terms" />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="bg-white dark:bg-stone-800 rounded-3xl shadow-xl border border-stone-200 dark:border-stone-700 p-6 sm:p-8 md:p-12">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-stone-800 dark:text-stone-100 mb-4">
              Terms of Service
            </h1>
            <p className="text-stone-500 dark:text-stone-400">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="prose pviolet-lg max-w-none pviolet-stone dark:pviolet-invert">
            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100 mb-4">1. Acceptance of Terms</h2>
              <div className="space-y-4 text-stone-600 dark:text-stone-400">
                <p>
                  By accessing and using WriteScholar ("the Service"), you accept and agree to be bound by
                  these Terms of Service. If you do not agree, please do not use this service. These terms
                  apply to all visitors, registered users, and paid subscribers.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100 mb-4">2. Description of Service</h2>
              <div className="space-y-4 text-stone-600 dark:text-stone-400">
                <p>
                  WriteScholar is an AI-powered academic toolkit for students. Our service includes the
                  following features, some of which are subject to plan-based usage limits:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Essay Analyzer</strong> — professor-style AI feedback on structure, grammar, argument, citations, and tone</li>
                  <li><strong>Citation Finder</strong> — discovers and formats academic sources in APA, MLA, Chicago, Harvard, and other styles</li>
                  <li><strong>Study Pack</strong> — generates interactive lessons, flashcards, quizzes, crosswords, and Crater Blast (quiz game) from your notes in one go</li>
                  <li><strong>Paper Summarizer</strong> — condenses documents into bullet points or paragraph summaries</li>
                  <li><strong>Focus Mode</strong> — Chrome extension that blocks distracting sites until you complete study goals</li>
                  <li><strong>Document Upload &amp; Library</strong> — upload and manage PDF, DOCX, and TXT files</li>
                  <li><strong>PDF &amp; DOCX Export</strong> — download quizzes, flashcards, and analyses as formatted documents</li>
                  <li><strong>Badges &amp; Achievements</strong> — earn badges for study milestones and usage</li>
                  <li><strong>Free Tools</strong> — word counter, grammar checker, thesis generator, essay outline generator, readability score, citation generator, text case converter, paraphrasing tips, GPA calculator, Pomodoro timer, scientific calculator, and unit converter</li>
                </ul>
                <p>
                  Optional social features (such as sharing study materials with other users) may be offered in some versions of the app. Features and limits vary by plan. We reserve the right to modify, add, or remove features
                  at any time with reasonable notice.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100 mb-4">3. Subscription Plans and Usage Limits</h2>
              <div className="space-y-4 text-stone-600 dark:text-stone-400">
                <p>WriteScholar offers the following plans:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Free</strong> — 3 documents per month, 2 AI essay analyses per month, 5,000 words/month for the Paper Summarizer, 2 study pack generations (lesson, flashcards & quiz — crossword & Crater Blast unlock with Pro), 2 citation searches per month</li>
                  <li><strong>Pro ($19.99/month)</strong> — unlimited documents, 99 combined actions per month (analyses, study packs & citations), 999,999 words/month for the Paper Summarizer; quiz, flashcards, crossword & Crater Blast with all types and difficulties; Focus Mode with unlimited blocked sites; document uploads up to 100MB per file; 100MB total library storage; full annotations and feedback (one-click Apply WriteScholar revisions into your draft are not included)</li>
                  <li><strong>Premium ($39.99/month)</strong> — everything in Pro with 3× usage (299 combined actions per month, 2,999,999 Paper Summarizer words per month), 1GB total library storage, and Apply WriteScholar revisions into your essay</li>
                </ul>
                <p>
                  Usage limits reset based on your plan: paid subscribers' limits reset at the start of each billing period; free users' limits reset on rolling 30-day periods from signup. Unused allowances do not carry
                  over. We reserve the right to adjust plan limits and pricing with 30 days' notice to existing
                  subscribers.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100 mb-4">4. User Accounts</h2>
              <div className="space-y-4 text-stone-600 dark:text-stone-400">
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
                  13 years old to create an account.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100 mb-4">5. Acceptable Use</h2>
              <div className="space-y-4 text-stone-600 dark:text-stone-400">
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
                <p>
                  <strong>Academic Integrity:</strong> WriteScholar's tools are designed to help you learn,
                  improve, and understand your work. You are solely responsible for ensuring that your use of
                  our service — including the Study Pack (quizzes, flashcards, crosswords, lessons), Essay Analyzer, Paper Summarizer, and Citation Finder — complies with
                  your institution's academic integrity policies. WriteScholar does not encourage or condone
                  academic dishonesty.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100 mb-4">6. Content and Intellectual Property</h2>
              <div className="space-y-4 text-stone-600 dark:text-stone-400">
                <p>
                  You retain ownership of all content you upload to WriteScholar. By using the service,
                  you grant us a limited, non-exclusive license to process, analyze, and temporarily store
                  your content solely to provide the service to you.
                </p>
                <p>
                  <strong>AI-generated outputs</strong> (essay feedback, citations, lessons, quiz questions, flashcards, crossword puzzles, summaries) are provided for your personal use. We do not claim ownership of
                  these outputs, but make no representations about their accuracy, originality, or
                  fitness for any particular purpose.
                </p>
                <p>
                  WriteScholar's software, brand, interface, and underlying technology are protected by
                  intellectual property laws. You may not copy, modify, or distribute our platform without
                  written permission.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100 mb-4">7. Payment and Billing</h2>
              <div className="space-y-4 text-stone-600 dark:text-stone-400">
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
                  <li>All fees are non-refundable unless required by applicable law</li>
                  <li>We reserve the right to change pricing with 30 days' notice to existing subscribers</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100 mb-4">8. AI Processing Disclosure</h2>
              <div className="space-y-4 text-stone-600 dark:text-stone-400">
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
                <p>
                  AI outputs may occasionally be inaccurate, incomplete, or biased. Always review and
                  verify AI-generated content before using it academically or professionally.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100 mb-4">9. Service Availability</h2>
              <div className="space-y-4 text-stone-600 dark:text-stone-400">
                <p>
                  We strive to maintain high service availability but cannot guarantee uninterrupted access.
                  We may temporarily suspend service for maintenance, updates, or technical issues without
                  prior notice. We are not liable for any damages resulting from service unavailability.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100 mb-4">10. Privacy and Data Protection</h2>
              <div className="space-y-4 text-stone-600 dark:text-stone-400">
                <p>
                  Your privacy is important to us. Please review our{' '}
                  <button onClick={() => onNavigate('privacy')} className="text-violet-600 dark:text-violet-400 hover:underline font-medium">Privacy Policy</button>{' '}
                  to understand how we collect, use, and protect your information, including how your
                  content is processed by third-party AI providers.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100 mb-4">11. Disclaimers and Limitations of Liability</h2>
              <div className="space-y-4 text-stone-600 dark:text-stone-400">
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
            </section>

            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100 mb-4">12. Termination</h2>
              <div className="space-y-4 text-stone-600 dark:text-stone-400">
                <p>
                  We may terminate or suspend your account at any time for violation of these terms, abuse
                  of the service, or non-payment. You may delete your account at any time via Account Settings.
                </p>
                <p>
                  Upon termination, your right to use the service ceases immediately. We may delete your
                  account and associated data, including uploaded documents, study pack history (quizzes, flashcards, crosswords, lessons), analysis history, citation history, optional social or sharing data if applicable, and badge progress.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100 mb-4">13. Changes to Terms</h2>
              <div className="space-y-4 text-stone-600 dark:text-stone-400">
                <p>
                  We reserve the right to modify these terms at any time. We will notify users of material
                  changes via email or in-app notice. Continued use of the service after changes take effect
                  constitutes acceptance of the updated terms.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100 mb-4">14. Governing Law</h2>
              <div className="space-y-4 text-stone-600 dark:text-stone-400">
                <p>
                  These terms shall be governed by and construed in accordance with applicable laws.
                  Any disputes arising from these terms or your use of the service shall be resolved
                  through binding arbitration, except where prohibited by law.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100 mb-4">15. Contact Information</h2>
              <div className="space-y-4 text-stone-600 dark:text-stone-400">
                <p>If you have any questions about these terms, please contact us at:</p>
                <div className="bg-stone-100 dark:bg-stone-700/50 p-4 rounded-xl">
                  <p><strong>Email:</strong> legal@writescholar.com</p>
                  <p><strong>Support:</strong> support@writescholar.com</p>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-stone-200 dark:border-stone-700">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-8 py-3 rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-500/25 transition-all duration-200"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => onNavigate('privacy')}
                className="px-8 py-3 rounded-xl font-semibold border-2 border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:border-stone-400 dark:hover:border-stone-500 transition-all duration-200"
              >
                View Privacy Policy
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default TermsOfServicePage;
