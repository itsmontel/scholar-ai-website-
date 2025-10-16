import React from 'react';
import Header from '../common/Header';

interface TermsOfServicePageProps {
  onNavigate: (page: string) => void;
  user?: { name: string; email: string } | null;
  onLogout?: () => void;
}

const TermsOfServicePage: React.FC<TermsOfServicePageProps> = ({ onNavigate, user, onLogout }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="terms" />
      
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-8 md:p-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Terms of Service
            </h1>
            <p className="text-lg text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  By accessing and using WriteScholar ("the Service"), you accept and agree to be bound by 
                  the terms and provision of this agreement. If you do not agree to abide by the above, 
                  please do not use this service.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  WriteScholar provides AI-powered academic writing analysis and feedback services. 
                  Our service includes:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Document analysis and feedback</li>
                  <li>Grammar and style checking</li>
                  <li>Citation style formatting</li>
                  <li>Plagiarism detection</li>
                  <li>Academic writing guidance</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
              <div className="space-y-4 text-gray-700">
                <p>To use our service, you must:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide accurate and complete registration information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Be responsible for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized use</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use</h2>
              <div className="space-y-4 text-gray-700">
                <p>You agree to use the service only for lawful purposes and in accordance with these terms. You agree not to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Upload content that violates any laws or regulations</li>
                  <li>Submit plagiarized or copyrighted material without permission</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Use the service for any commercial purpose without permission</li>
                  <li>Interfere with or disrupt the service or servers</li>
                  <li>Upload malicious software or harmful code</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Content and Intellectual Property</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  You retain ownership of the content you upload to our service. By using our service, 
                  you grant us a limited license to process, analyze, and store your content for the 
                  purpose of providing our services.
                </p>
                <p>
                  Our service, including all software, algorithms, and methodologies, is protected by 
                  intellectual property laws. You may not copy, modify, or distribute our technology 
                  without permission.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Payment and Billing</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Paid subscriptions are billed in advance on a monthly or annual basis. All fees are 
                  non-refundable unless otherwise stated. We reserve the right to change our pricing 
                  with 30 days' notice.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Payment is due in advance for each billing period</li>
                  <li>Failed payments may result in service suspension</li>
                  <li>No refunds are provided for unused portions of subscriptions</li>
                  <li>Plan changes are not available after subscription</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Service Availability</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We strive to maintain high service availability but cannot guarantee uninterrupted access. 
                  We may temporarily suspend service for maintenance, updates, or technical issues.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Privacy and Data Protection</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Your privacy is important to us. Please review our Privacy Policy to understand how 
                  we collect, use, and protect your information.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Disclaimers and Limitations</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  The service is provided "as is" without warranties of any kind. We do not guarantee 
                  the accuracy, completeness, or reliability of our analysis results. You use the service 
                  at your own risk.
                </p>
                <p>
                  To the maximum extent permitted by law, we shall not be liable for any indirect, 
                  incidental, special, or consequential damages arising from your use of the service.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Termination</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We may terminate or suspend your account at any time for violation of these terms. 
                  You may terminate your account at any time by contacting our support team.
                </p>
                <p>
                  Upon termination, your right to use the service ceases immediately, and we may delete 
                  your account and associated data.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to Terms</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We reserve the right to modify these terms at any time. We will notify users of 
                  material changes via email or through the service. Continued use after changes 
                  constitutes acceptance of the new terms.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Governing Law</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  These terms shall be governed by and construed in accordance with applicable laws. 
                  Any disputes arising from these terms or your use of the service shall be resolved 
                  through binding arbitration.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Information</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  If you have any questions about these terms, please contact us at:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>Email:</strong> legal@writescholar.com</p>
                  <p><strong>Support:</strong> support@writescholar.com</p>
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
                onClick={() => onNavigate('privacy')}
                className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 px-8 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                View Privacy Policy
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsOfServicePage;
