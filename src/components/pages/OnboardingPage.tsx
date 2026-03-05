import { useState } from 'react';

interface OnboardingPageProps {
  onNavigate: (page: string) => void;
  user?: { id: string; email: string } | null;
  onComplete?: () => void;
}

type Step = 'profile' | 'grade' | 'referral' | 'goals' | 'features' | 'trial';

const OnboardingPage = ({ onNavigate, user, onComplete }: OnboardingPageProps) => {
  const [currentStep, setCurrentStep] = useState<Step>('profile');
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedReferral, setSelectedReferral] = useState<string | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'premium'>('starter');

  const steps: Step[] = ['profile', 'grade', 'referral', 'goals', 'features', 'trial'];
  const stepIndex = steps.indexOf(currentStep);
  const progress = ((stepIndex + 1) / steps.length) * 100;

  const goNext = () => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const goBack = () => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev =>
      prev.includes(goal)
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleStartTrial = () => {
    if (user && onComplete) {
      localStorage.setItem('writescholar_onboarding_completed', 'true');
      onNavigate('pricing');
    } else {
      localStorage.setItem('writescholar_onboarding_completed', 'true');
      onNavigate('login');
    }
  };

  const handleSkip = () => {
    if (user && onComplete) {
      onComplete();
    } else {
      localStorage.setItem('writescholar_onboarding_completed', 'true');
      onNavigate('login');
    }
  };

  const gradeOptions = [
    { id: 'college', label: 'College / University', icon: '🎓' },
    { id: 'highschool', label: 'High School', icon: '🏫' },
    { id: 'masters', label: 'Masters / PhD', icon: '📚' },
    { id: 'other', label: 'Other', icon: '✏️' },
  ];

  const referralOptions = [
    { id: 'social', label: 'Social media', icon: '📱' },
    { id: 'google', label: 'Google search', icon: '🔍' },
    { id: 'friend', label: 'Friend or classmate', icon: '👋' },
    { id: 'other', label: 'Other', icon: '💬' },
  ];

  const goalOptions = [
    { id: 'essay', label: 'Essay feedback & analysis', icon: '📝' },
    { id: 'humanizer', label: 'Humanize AI-written text', icon: '🤖' },
    { id: 'citations', label: 'Find & format citations', icon: '📖' },
    { id: 'summarizer', label: 'Summarize papers & articles', icon: '📄' },
    { id: 'quizzes', label: 'Generate quizzes & flashcards', icon: '🧠' },
    { id: 'grammar', label: 'Grammar & style checking', icon: '✅' },
  ];

  const trialFeatures = [
    'Unlimited essay analyses',
    'Unlimited quizzes, flashcards & crosswords',
    '999,999 words for Humanizer & Summarizer',
    '999 citation searches',
    'All citation styles (APA, MLA, Chicago, Harvard...)',
    'Export to PDF & Word',
    'Study tools history',
  ];

  const premiumExtras = [
    'Top-tier premium AI model',
    'All quiz types & difficulty levels',
    'All summarizer styles & lengths',
    'Advanced essay analysis',
    'Priority support',
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #FAFAF9 0%, #F5F5F4 50%, #ECFCCB 100%)' }}>
      {/* Top bar */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #292524 0%, #1c1917 100%)' }}>
            <span className="text-lime-400 font-bold text-sm">W</span>
          </div>
          <span className="text-lg font-semibold text-stone-800">WriteScholar</span>
        </div>
        <button
          onClick={handleSkip}
          className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
        >
          Skip for now
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-6 pt-3 pb-1">
        <div className="h-1.5 bg-stone-200/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-lime-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-lg">

          {/* Step 1: Username & DOB */}
          {currentStep === 'profile' && (
            <div className="animate-fadeIn">
              <div className="text-center mb-8">
                <h1 className="text-3xl text-stone-800 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>
                  Set up your profile
                </h1>
                <p className="text-stone-500 text-lg">Choose a username and add your date of birth</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-2">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. student123"
                    className="w-full px-5 py-4 rounded-2xl border-2 border-stone-200 bg-white focus:border-lime-400 focus:ring-0 transition-all text-base text-stone-700 placeholder-stone-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-2">Date of birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-stone-200 bg-white focus:border-lime-400 focus:ring-0 transition-all text-base text-stone-700"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  onClick={goNext}
                  disabled={!username.trim() || !dob}
                  className="px-10 py-3 bg-stone-900 text-white rounded-full font-semibold text-base transition-all hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Grade */}
          {currentStep === 'grade' && (
            <div className="animate-fadeIn">
              <div className="text-center mb-8">
                <h1 className="text-3xl text-stone-800 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>
                  Welcome to WriteScholar!
                </h1>
                <p className="text-stone-500 text-lg">What level are you studying at?</p>
              </div>

              <div className="space-y-3">
                {gradeOptions.map(option => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedGrade(option.id)}
                    className={`w-full flex items-center px-5 py-4 rounded-2xl border-2 transition-all ${
                      selectedGrade === option.id
                        ? 'border-lime-400 bg-lime-50 shadow-sm'
                        : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm'
                    }`}
                  >
                    <span className="text-2xl mr-4">{option.icon}</span>
                    <span className="text-base font-medium text-stone-700">{option.label}</span>
                    {selectedGrade === option.id && (
                      <svg className="w-5 h-5 text-lime-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-8 flex items-center justify-between">
                <button onClick={goBack} className="flex items-center text-stone-400 hover:text-stone-600 transition-colors">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <button
                  onClick={goNext}
                  disabled={!selectedGrade}
                  className="px-10 py-3 bg-stone-900 text-white rounded-full font-semibold text-base transition-all hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Referral */}
          {currentStep === 'referral' && (
            <div className="animate-fadeIn">
              <div className="text-center mb-8">
                <h1 className="text-3xl text-stone-800 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>
                  How did you find us?
                </h1>
                <p className="text-stone-500 text-lg">This helps us reach more students like you</p>
              </div>

              <div className="space-y-3">
                {referralOptions.map(option => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedReferral(option.id)}
                    className={`w-full flex items-center px-5 py-4 rounded-2xl border-2 transition-all ${
                      selectedReferral === option.id
                        ? 'border-lime-400 bg-lime-50 shadow-sm'
                        : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm'
                    }`}
                  >
                    <span className="text-2xl mr-4">{option.icon}</span>
                    <span className="text-base font-medium text-stone-700">{option.label}</span>
                    {selectedReferral === option.id && (
                      <svg className="w-5 h-5 text-lime-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-8 flex items-center justify-between">
                <button onClick={goBack} className="flex items-center text-stone-400 hover:text-stone-600 transition-colors">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <button
                  onClick={goNext}
                  className="px-10 py-3 bg-stone-900 text-white rounded-full font-semibold text-base transition-all hover:bg-stone-800"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Goals */}
          {currentStep === 'goals' && (
            <div className="animate-fadeIn">
              <div className="text-center mb-8">
                <h1 className="text-3xl text-stone-800 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>
                  What brings you here?
                </h1>
                <p className="text-stone-500 text-lg">Select all that apply</p>
              </div>

              <div className="space-y-3">
                {goalOptions.map(option => (
                  <button
                    key={option.id}
                    onClick={() => toggleGoal(option.id)}
                    className={`w-full flex items-center px-5 py-4 rounded-2xl border-2 transition-all ${
                      selectedGoals.includes(option.id)
                        ? 'border-lime-400 bg-lime-50 shadow-sm'
                        : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm'
                    }`}
                  >
                    <span className="text-2xl mr-4">{option.icon}</span>
                    <span className="text-base font-medium text-stone-700">{option.label}</span>
                    {selectedGoals.includes(option.id) && (
                      <svg className="w-5 h-5 text-lime-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-8 flex items-center justify-between">
                <button onClick={goBack} className="flex items-center text-stone-400 hover:text-stone-600 transition-colors">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <button
                  onClick={goNext}
                  className="px-10 py-3 bg-stone-900 text-white rounded-full font-semibold text-base transition-all hover:bg-stone-800"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Feature comparison */}
          {currentStep === 'features' && (
            <div className="animate-fadeIn">
              <div className="text-center mb-6">
                <h1 className="text-3xl text-stone-800 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>
                  Unlock <span className="text-lime-600">everything</span>
                </h1>
                <p className="text-stone-500 text-lg">See what you get with a free trial</p>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                {/* Table header */}
                <div className="grid grid-cols-3 border-b border-stone-100">
                  <div className="p-4"></div>
                  <div className="p-4 text-center">
                    <span className="text-sm font-semibold text-stone-500">Free</span>
                  </div>
                  <div className="p-4 text-center rounded-t-xl" style={{ background: 'linear-gradient(180deg, #ECFCCB 0%, #F7FEE7 100%)' }}>
                    <span className="text-sm font-bold text-lime-700">Trial</span>
                  </div>
                </div>
                {/* Feature rows */}
                {[
                  'Essay analyses',
                  'Study tool generations',
                  'Humanizer words',
                  'Citation searches',
                  'All citation styles',
                  'PDF & Word export',
                  'Study tools history',
                ].map((feature, i) => (
                  <div key={feature} className={`grid grid-cols-3 ${i < 6 ? 'border-b border-stone-50' : ''}`}>
                    <div className="px-4 py-3">
                      <span className="text-sm text-stone-600">{feature}</span>
                    </div>
                    <div className="px-4 py-3 flex justify-center items-center">
                      {i < 4 ? (
                        <span className="text-xs text-stone-400 font-medium">Limited</span>
                      ) : (
                        <svg className="w-4 h-4 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <div className="px-4 py-3 flex justify-center items-center" style={{ background: i % 2 === 0 ? 'rgba(236, 252, 203, 0.15)' : 'transparent' }}>
                      <div className="w-6 h-6 rounded-full bg-lime-400 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-stone-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center justify-between">
                <button onClick={goBack} className="flex items-center text-stone-400 hover:text-stone-600 transition-colors">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <button
                  onClick={goNext}
                  className="px-10 py-3 bg-stone-900 text-white rounded-full font-semibold text-base transition-all hover:bg-stone-800"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Trial paywall */}
          {currentStep === 'trial' && (
            <div className="animate-fadeIn">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-lime-100 rounded-full mb-4">
                  <span className="w-2 h-2 bg-lime-500 rounded-full animate-pulse"></span>
                  <span className="text-xs font-semibold text-lime-700 uppercase tracking-wide">Limited time offer</span>
                </div>
                <h1 className="text-3xl text-stone-800 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>
                  Try everything <span className="text-lime-600 italic">free</span> for 7 days
                </h1>
                <p className="text-stone-500">Cancel anytime. No charge until the trial ends.</p>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-2xl border border-stone-200 p-5 mb-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-lime-400 flex items-center justify-center">
                      <svg className="w-4 h-4 text-stone-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v-3m0 0V9m0 3h3m-3 0H9" />
                      </svg>
                    </div>
                    <div className="w-0.5 h-10 bg-stone-200 my-1"></div>
                    <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center">
                      <svg className="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                      </svg>
                    </div>
                    <div className="w-0.5 h-10 bg-stone-200 my-1"></div>
                    <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center">
                      <svg className="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 space-y-5 pt-1">
                    <div>
                      <p className="font-semibold text-stone-800 text-sm">Today: Instant access</p>
                      <p className="text-stone-500 text-sm">Full access to all features, completely free</p>
                    </div>
                    <div>
                      <p className="font-semibold text-stone-800 text-sm">Day 6: Reminder email</p>
                      <p className="text-stone-500 text-sm">We'll remind you before the trial ends</p>
                    </div>
                    <div>
                      <p className="font-semibold text-stone-800 text-sm">Day 7: Trial ends</p>
                      <p className="text-stone-500 text-sm">Cancel before and you won't be charged</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Plan toggle */}
              <div className="flex bg-stone-100 rounded-full p-1 mb-5">
                <button
                  onClick={() => setSelectedPlan('starter')}
                  className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    selectedPlan === 'starter'
                      ? 'bg-white text-stone-800 shadow-sm'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  Starter · $19.99/mo
                </button>
                <button
                  onClick={() => setSelectedPlan('premium')}
                  className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    selectedPlan === 'premium'
                      ? 'bg-white text-stone-800 shadow-sm'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  Premium · $39.99/mo
                </button>
              </div>

              {/* Features for selected plan */}
              <div className="bg-white rounded-2xl border border-stone-200 p-5 mb-6 shadow-sm">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">
                  {selectedPlan === 'starter' ? 'Starter includes' : 'Premium includes'}
                </p>
                <div className="space-y-2.5">
                  {trialFeatures.map(f => (
                    <div key={f} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-lime-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm text-stone-600">{f}</span>
                    </div>
                  ))}
                  {selectedPlan === 'premium' && premiumExtras.map(f => (
                    <div key={f} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm text-stone-600">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Free PDF bonus */}
              <div className="flex items-center gap-3 bg-lime-50 border border-lime-200 rounded-xl p-4 mb-6">
                <span className="text-2xl">🎁</span>
                <div>
                  <p className="text-sm font-semibold text-stone-800">Bonus: Free Study Tips Guide</p>
                  <p className="text-xs text-stone-500">10-page PDF with proven study techniques, sent to your email</p>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={handleStartTrial}
                className="w-full py-4 rounded-full font-bold text-base transition-all text-stone-900 shadow-lg hover:shadow-xl hover:scale-[1.01]"
                style={{ background: 'linear-gradient(135deg, #a3e635 0%, #84cc16 100%)' }}
              >
                Start 7-day free trial for $0.00
              </button>
              <p className="text-center text-xs text-stone-400 mt-3">
                Then ${selectedPlan === 'starter' ? '19.99' : '39.99'}/month. Cancel anytime before day 7 and pay nothing.
              </p>

              <div className="mt-4 flex items-center justify-between">
                <button onClick={goBack} className="flex items-center text-stone-400 hover:text-stone-600 transition-colors">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <button
                  onClick={handleSkip}
                  className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
                >
                  Continue with free plan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.35s ease-out;
        }
      `}</style>
    </div>
  );
};

export default OnboardingPage;
