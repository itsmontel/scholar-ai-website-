import { useState, useEffect, useRef } from 'react';
import ScholarMascot from '../common/ScholarMascot';
import { setOnboardingDone, persistOnboardingToServer } from '../../utils/onboarding';

interface OnboardingPageProps {
  onNavigate: (page: string) => void;
  user?: { id: string; email: string; name?: string; username?: string } | null;
  onComplete?: () => void;
  onUserUpdate?: (updates: { name?: string; username?: string }) => void;
}

type Step = 'profile' | 'grade' | 'referral' | 'goals' | 'features' | 'trial';

const STEP_MASCOT_POSES: Record<Step, 'default' | 'waving' | 'pointing' | 'celebrating' | 'studying' | 'thinking' | 'analyzing'> = {
  profile: 'waving',
  grade: 'studying',
  referral: 'pointing',
  goals: 'thinking',
  features: 'analyzing',
  trial: 'celebrating',
};

const OnboardingPage = ({ onNavigate, user, onComplete, onUserUpdate }: OnboardingPageProps) => {
  const [currentStep, setCurrentStep] = useState<Step>('profile');
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [dob, setDob] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedReferral, setSelectedReferral] = useState<string | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'premium'>('pro');
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);
  const [trialSecondsLeft, setTrialSecondsLeft] = useState(10 * 60);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (currentStep === 'trial') {
      setTrialSecondsLeft(10 * 60);
      countdownRef.current = setInterval(() => {
        setTrialSecondsLeft(s => (s > 0 ? s - 1 : 0));
      }, 1000);
    } else {
      if (countdownRef.current) clearInterval(countdownRef.current);
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [currentStep]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const steps: Step[] = ['profile', 'grade', 'referral', 'goals', 'features', 'trial'];
  const stepIndex = steps.indexOf(currentStep);
  const progress = ((stepIndex + 1) / steps.length) * 100;

  const saveProfile = async (): Promise<boolean> => {
    if (!user?.id) return false;
    const token = localStorage.getItem('authToken');
    try {
      if (displayName.trim()) {
        const profileRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/users/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name: displayName.trim() })
        });
        if (profileRes.ok) {
          onUserUpdate?.({ name: displayName.trim() });
        }
      }
      if (username.trim()) {
        const normalized = username.trim().toLowerCase().replace(/\s/g, '_');
        if (!/^[a-z0-9_]{3,30}$/.test(normalized)) {
          setUsernameError('Username must be 3-30 characters, letters, numbers, and underscores only');
          return false;
        }
        setUsernameError(null);
        const usernameRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/users/username`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ username: normalized })
        });
        const usernameData = await usernameRes.json();
        if (usernameRes.ok) {
          onUserUpdate?.({ username: normalized });
        } else {
          setUsernameError(usernameData.message || 'Username is already taken');
          return false;
        }
      }
      return true;
    } catch (e) {
      console.error('Failed to save profile:', e);
      return false;
    }
  };

  const goNext = async () => {
    if (currentStep === 'profile' && user?.id) {
      const ok = await saveProfile();
      if (!ok) return;
    }
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

  const markOnboardingComplete = async (userId: string) => {
    setOnboardingDone(userId);
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        localStorage.setItem('user', JSON.stringify({ ...parsed, onboardingCompleted: true }));
      } catch (_) {}
    }
    await persistOnboardingToServer();
  };

  const handleStartTrial = async () => {
    if (!user) {
      onNavigate('login');
      return;
    }

    await markOnboardingComplete(user.id);

    if (user.id) {
      await saveProfile();
    }

    setIsLoadingCheckout(true);

    try {
      const successUrl = `${window.location.origin}/dashboard?payment=success`;
      const cancelUrl = `${window.location.origin}/dashboard?payment=cancelled`;

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/subscriptions/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          planType: selectedPlan,
          billingCycle: 'monthly',
          successUrl,
          cancelUrl
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create checkout session');
      }

      window.location.href = data.data.checkoutUrl;
    } catch (err) {
      console.error('Checkout error:', err);
      setIsLoadingCheckout(false);
      onNavigate('pricing');
    }
  };

  const handleSkip = async () => {
    if (user?.id) {
      await saveProfile();
    }
    if (user && onComplete) {
      await markOnboardingComplete(user.id);
      onComplete();
    } else if (user?.id) {
      await markOnboardingComplete(user.id);
      onNavigate('dashboard');
    } else {
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
    '99 citation searches per month',
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
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #FAFAF9 0%, #F5F5F4 50%, #EDE9FE 100%)' }}>
      {/* Top bar */}
      <div className="px-6 pt-6 pb-2 flex items-center">
        <div className="flex items-center gap-2.5">
          <ScholarMascot size={40} animated={false} />
          <span className="text-xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">WriteScholar</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6 pt-3 pb-1">
        <div className="h-1.5 bg-stone-200/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-lg">

          {/* Step 1: Name & DOB */}
          {currentStep === 'profile' && (
            <div className="animate-fadeIn">
              <div className="flex justify-center mb-6">
                <ScholarMascot size={140} animated={true} pose={STEP_MASCOT_POSES.profile} />
              </div>
              <div className="text-center mb-8">
                <h1 className="text-3xl text-stone-800 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>
                  Set up your profile
                </h1>
                <p className="text-stone-500 text-lg">Your name, username, and date of birth</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-2">Your name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Alex or Jordan"
                    className="w-full px-5 py-4 rounded-2xl border-2 border-stone-200 bg-white focus:border-violet-500 focus:ring-0 transition-all text-base text-stone-700 placeholder-stone-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-2">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setUsernameError(null); }}
                    placeholder="e.g. alex_student (letters, numbers, underscores)"
                    className={`w-full px-5 py-4 rounded-2xl border-2 bg-white focus:ring-0 transition-all text-base text-stone-700 placeholder-stone-400 ${
                      usernameError ? 'border-red-400 focus:border-red-500' : 'border-stone-200 focus:border-violet-500'
                    }`}
                  />
                  {usernameError && (
                    <p className="mt-1.5 text-sm text-red-600">{usernameError}</p>
                  )}
                  <p className="mt-1 text-xs text-stone-400">Used in Settings, when sharing notes, and shown to friends</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-2">Date of birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-stone-200 bg-white focus:border-violet-500 focus:ring-0 transition-all text-base text-stone-700"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  onClick={goNext}
                  disabled={!displayName.trim() || !username.trim() || !dob || !!usernameError}
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
              <div className="flex justify-center mb-6">
                <ScholarMascot size={140} animated={true} pose={STEP_MASCOT_POSES.grade} />
              </div>
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
                        ? 'border-violet-500 bg-violet-50 shadow-sm'
                        : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm'
                    }`}
                  >
                    <span className="text-2xl mr-4">{option.icon}</span>
                    <span className="text-base font-medium text-stone-700">{option.label}</span>
                    {selectedGrade === option.id && (
                      <svg className="w-5 h-5 text-violet-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="flex justify-center mb-6">
                <ScholarMascot size={140} animated={true} pose={STEP_MASCOT_POSES.referral} />
              </div>
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
                        ? 'border-violet-500 bg-violet-50 shadow-sm'
                        : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm'
                    }`}
                  >
                    <span className="text-2xl mr-4">{option.icon}</span>
                    <span className="text-base font-medium text-stone-700">{option.label}</span>
                    {selectedReferral === option.id && (
                      <svg className="w-5 h-5 text-violet-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* Step 4: Goals */}
          {currentStep === 'goals' && (
            <div className="animate-fadeIn">
              <div className="flex justify-center mb-6">
                <ScholarMascot size={140} animated={true} pose={STEP_MASCOT_POSES.goals} />
              </div>
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
                        ? 'border-violet-500 bg-violet-50 shadow-sm'
                        : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm'
                    }`}
                  >
                    <span className="text-2xl mr-4">{option.icon}</span>
                    <span className="text-base font-medium text-stone-700">{option.label}</span>
                    {selectedGoals.includes(option.id) && (
                      <svg className="w-5 h-5 text-violet-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* Step 5: Feature comparison */}
          {currentStep === 'features' && (
            <div className="animate-fadeIn">
              <div className="flex justify-center mb-6">
                <ScholarMascot size={140} animated={true} pose={STEP_MASCOT_POSES.features} />
              </div>
              <div className="text-center mb-6">
                <h1 className="text-3xl text-stone-800 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>
                  Unlock <span className="text-violet-600">everything</span>
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
                  <div className="p-4 text-center rounded-t-xl" style={{ background: 'linear-gradient(180deg, #EDE9FE 0%, #F5F3FF 100%)' }}>
                    <span className="text-sm font-bold text-violet-700">Trial</span>
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
                    <div className="px-4 py-3 flex justify-center items-center" style={{ background: i % 2 === 0 ? 'rgba(237, 233, 254, 0.3)' : 'transparent' }}>
                      <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
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

          {/* Step 6: Trial paywall */}
          {currentStep === 'trial' && (
            <div className="animate-fadeIn">
              <div className="flex justify-center mb-4">
                <ScholarMascot size={140} animated={true} pose={STEP_MASCOT_POSES.trial} />
              </div>
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-100 rounded-full mb-4">
                  <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></span>
                  <span className="text-xs font-semibold text-violet-700 uppercase tracking-wide">Limited time offer</span>
                </div>
                <h1 className="text-3xl text-stone-800 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>
                  Try everything <span className="text-violet-600 italic">free</span> for 7 days
                </h1>
                <p className="text-stone-500">Cancel anytime. No charge until the trial ends.</p>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-2xl border border-stone-200 p-5 mb-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-stone-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v-3m0 0V9m0 3h3m-3 0H9" />
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
                      <p className="font-semibold text-stone-800 text-sm">Day 7: Trial ends</p>
                      <p className="text-stone-500 text-sm">Cancel before and you won't be charged</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Plan toggle */}
              <div className="flex bg-stone-100 rounded-full p-1 mb-5">
                <button
                  onClick={() => setSelectedPlan('pro')}
                  className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    selectedPlan === 'pro'
                      ? 'bg-white text-stone-800 shadow-sm'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  Pro · $19.99/mo
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
                  {selectedPlan === 'pro' ? 'Pro includes' : 'Premium includes'}
                </p>
                <div className="space-y-2.5">
                  {trialFeatures.map(f => (
                    <div key={f} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="flex items-center gap-3 bg-violet-50 border border-violet-200 rounded-xl p-4 mb-6">
                <span className="text-2xl">🎁</span>
                <div>
                  <p className="text-sm font-semibold text-stone-800">Bonus: Free Study Tips Guide</p>
                  <p className="text-xs text-stone-500">10-page PDF with proven study techniques, sent to your email</p>
                </div>
              </div>

              {/* Urgency countdown */}
              <div className="flex items-center justify-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-semibold text-red-700">
                  Offer expires in{' '}
                  <span className="font-mono text-red-600">{formatCountdown(trialSecondsLeft)}</span>
                  {' '}don't miss your free trial!
                </p>
              </div>

              {/* CTA */}
              <button
                onClick={handleStartTrial}
                disabled={isLoadingCheckout}
                className="w-full py-4 rounded-full font-bold text-base transition-all text-white shadow-lg hover:shadow-xl hover:scale-[1.01] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}
              >
                {isLoadingCheckout ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Redirecting to checkout...
                  </span>
                ) : (
                  'Start 7-day free trial for $0.00'
                )}
              </button>
              <p className="text-center text-xs text-stone-400 mt-3">
                Then ${selectedPlan === 'pro' ? '19.99' : '39.99'}/month. Cancel anytime before day 7 and pay nothing.
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
