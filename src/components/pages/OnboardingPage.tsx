import { useState, useEffect, useRef } from 'react';

interface OnboardingPageProps {
  onNavigate: (page: string) => void;
  user?: { id: string; email: string; name?: string } | null;
  onComplete?: () => void;
  onUserUpdate?: (updates: { name: string }) => void;
}

type Step = 'profile' | 'grade' | 'referral' | 'goals' | 'features' | 'trial';

const ProfileIllustration = () => (
  <svg viewBox="0 0 200 160" fill="none" className="w-48 h-36 mx-auto mb-6">
    {/* Person with clipboard */}
    <g transform="translate(60, 10)">
      {/* Body */}
      <path d="M30 70 Q25 95 30 130 L70 130 Q75 95 70 70" fill="#84CC16" />
      {/* Neck */}
      <rect x="42" y="52" width="16" height="20" fill="#FCD9B6" />
      {/* Head */}
      <ellipse cx="50" cy="32" rx="24" ry="26" fill="#FCD9B6" />
      {/* Hair */}
      <path d="M26 26 Q22 8 40 4 Q50 0 65 4 Q78 8 74 26 Q70 16 58 12 Q50 8 42 12 Q30 16 26 26" fill="#5D4037" />
      {/* Eyes */}
      <ellipse cx="40" cy="32" rx="4" ry="5" fill="#1F2937" />
      <ellipse cx="60" cy="32" rx="4" ry="5" fill="#1F2937" />
      <circle cx="41" cy="30" r="1.5" fill="white" />
      <circle cx="61" cy="30" r="1.5" fill="white" />
      {/* Smile */}
      <path d="M40 44 Q50 54 60 44" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Blush */}
      <ellipse cx="30" cy="38" rx="5" ry="3" fill="#FECACA" opacity="0.5" />
      <ellipse cx="70" cy="38" rx="5" ry="3" fill="#FECACA" opacity="0.5" />
    </g>
    {/* Clipboard */}
    <g transform="translate(115, 60)">
      <rect x="0" y="0" width="45" height="60" rx="4" fill="#F5F5F4" stroke="#D6D3D1" strokeWidth="2" />
      <rect x="12" y="-5" width="21" height="10" rx="2" fill="#78716C" />
      <rect x="8" y="15" width="29" height="4" rx="1" fill="#A8A29E" />
      <rect x="8" y="25" width="24" height="4" rx="1" fill="#A8A29E" />
      <rect x="8" y="35" width="29" height="4" rx="1" fill="#A8A29E" />
      <rect x="8" y="45" width="18" height="4" rx="1" fill="#A8A29E" />
    </g>
    {/* Floating elements */}
    <circle cx="30" cy="40" r="8" fill="#ECFCCB" opacity="0.8" />
    <circle cx="175" cy="30" r="6" fill="#D9F99D" opacity="0.8" />
    <circle cx="20" cy="120" r="10" fill="#BEF264" opacity="0.6" />
  </svg>
);

const GradeIllustration = () => (
  <svg viewBox="0 0 200 160" fill="none" className="w-48 h-36 mx-auto mb-6">
    {/* Student at desk */}
    <g transform="translate(50, 20)">
      {/* Desk */}
      <rect x="0" y="90" width="100" height="8" rx="2" fill="#78716C" />
      <rect x="5" y="98" width="8" height="40" fill="#57534E" />
      <rect x="87" y="98" width="8" height="40" fill="#57534E" />
      {/* Book on desk */}
      <rect x="20" y="75" width="35" height="25" rx="2" fill="#3B82F6" />
      <rect x="22" y="77" width="31" height="21" rx="1" fill="#60A5FA" />
      <rect x="25" y="82" width="20" height="2" fill="white" opacity="0.6" />
      <rect x="25" y="87" width="15" height="2" fill="white" opacity="0.6" />
      {/* Person */}
      <path d="M55 55 Q50 75 55 90 L85 90 Q90 75 85 55" fill="#8B5CF6" />
      <rect x="63" y="38" width="14" height="18" fill="#E8B796" />
      <ellipse cx="70" cy="22" rx="20" ry="22" fill="#E8B796" />
      {/* Hair */}
      <path d="M50 18 Q48 2 62 -2 Q70 -5 82 -2 Q92 2 90 18 Q86 8 76 5 Q70 2 64 5 Q54 8 50 18" fill="#1F2937" />
      {/* Glasses */}
      <ellipse cx="62" cy="22" rx="10" ry="8" fill="none" stroke="#374151" strokeWidth="2" />
      <ellipse cx="78" cy="22" rx="10" ry="8" fill="none" stroke="#374151" strokeWidth="2" />
      <path d="M72 22 L74 22" stroke="#374151" strokeWidth="2" />
      {/* Eyes */}
      <ellipse cx="62" cy="23" rx="3" ry="4" fill="#1F2937" />
      <ellipse cx="78" cy="23" rx="3" ry="4" fill="#1F2937" />
      <circle cx="63" cy="21" r="1" fill="white" />
      <circle cx="79" cy="21" r="1" fill="white" />
      {/* Smile */}
      <path d="M62 34 Q70 42 78 34" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
    {/* Graduation cap floating */}
    <g transform="translate(150, 20)">
      <path d="M0 20 L25 10 L50 20 L25 30 Z" fill="#1F2937" />
      <rect x="22" y="10" width="6" height="15" fill="#1F2937" />
      <rect x="20" y="5" width="10" height="8" fill="#1F2937" />
      <path d="M50 20 L50 30 Q45 35 40 30" stroke="#FCD34D" strokeWidth="2" fill="none" />
      <circle cx="40" cy="32" r="3" fill="#FCD34D" />
    </g>
    {/* Stars */}
    <path d="M30 30 L32 36 L38 36 L33 40 L35 46 L30 42 L25 46 L27 40 L22 36 L28 36 Z" fill="#FCD34D" />
    <path d="M170 100 L171 103 L174 103 L172 105 L173 108 L170 106 L167 108 L168 105 L166 103 L169 103 Z" fill="#FCD34D" />
  </svg>
);

const ReferralIllustration = () => (
  <svg viewBox="0 0 200 160" fill="none" className="w-48 h-36 mx-auto mb-6">
    {/* Two people talking */}
    {/* Person 1 */}
    <g transform="translate(20, 30)">
      <path d="M20 60 Q15 80 20 100 L50 100 Q55 80 50 60" fill="#10B981" />
      <rect x="28" y="44" width="14" height="18" fill="#FCD9B6" />
      <ellipse cx="35" cy="26" rx="18" ry="20" fill="#FCD9B6" />
      <path d="M17 22 Q14 6 28 2 Q35 -1 46 2 Q54 6 52 22 Q48 12 40 9 Q35 6 30 9 Q20 12 17 22" fill="#B45309" />
      <ellipse cx="28" cy="26" rx="3" ry="4" fill="#1F2937" />
      <ellipse cx="42" cy="26" rx="3" ry="4" fill="#1F2937" />
      <circle cx="29" cy="24" r="1" fill="white" />
      <circle cx="43" cy="24" r="1" fill="white" />
      <path d="M28 36 Q35 44 42 36" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
    {/* Person 2 */}
    <g transform="translate(110, 30)">
      <path d="M20 60 Q15 80 20 100 L50 100 Q55 80 50 60" fill="#3B82F6" />
      <rect x="28" y="44" width="14" height="18" fill="#E8B796" />
      <ellipse cx="35" cy="26" rx="18" ry="20" fill="#E8B796" />
      <path d="M17 22 Q14 6 28 2 Q35 -1 46 2 Q54 6 52 22 Q48 12 40 9 Q35 6 30 9 Q20 12 17 22" fill="#1F2937" />
      <ellipse cx="28" cy="26" rx="3" ry="4" fill="#1F2937" />
      <ellipse cx="42" cy="26" rx="3" ry="4" fill="#1F2937" />
      <circle cx="29" cy="24" r="1" fill="white" />
      <circle cx="43" cy="24" r="1" fill="white" />
      <path d="M28 36 Q35 44 42 36" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
    {/* Speech bubbles */}
    <g transform="translate(60, 10)">
      <ellipse cx="20" cy="15" rx="25" ry="18" fill="white" stroke="#D6D3D1" strokeWidth="2" />
      <path d="M10 30 Q5 40 15 35" fill="white" stroke="#D6D3D1" strokeWidth="2" />
      <text x="10" y="18" fontSize="12" fill="#84CC16" fontWeight="bold">Hi!</text>
    </g>
    <g transform="translate(100, 25)">
      <ellipse cx="20" cy="15" rx="25" ry="18" fill="white" stroke="#D6D3D1" strokeWidth="2" />
      <path d="M30 30 Q35 40 25 35" fill="white" stroke="#D6D3D1" strokeWidth="2" />
      <text x="8" y="18" fontSize="12" fill="#3B82F6" fontWeight="bold">Hey!</text>
    </g>
    {/* Connection hearts */}
    <path d="M100 90 C100 85 95 80 90 80 C85 80 80 85 80 90 C80 100 100 110 100 110 C100 110 120 100 120 90 C120 85 115 80 110 80 C105 80 100 85 100 90" fill="#F472B6" opacity="0.6" />
  </svg>
);

const GoalsIllustration = () => (
  <svg viewBox="0 0 200 160" fill="none" className="w-48 h-36 mx-auto mb-6">
    {/* Person reaching for star */}
    <g transform="translate(60, 30)">
      {/* Body */}
      <path d="M30 65 Q25 90 30 120 L60 120 Q65 90 60 65" fill="#F59E0B" />
      {/* Neck */}
      <rect x="38" y="48" width="14" height="18" fill="#D4A574" />
      {/* Head */}
      <ellipse cx="45" cy="30" rx="20" ry="22" fill="#D4A574" />
      {/* Hair */}
      <path d="M25 26 Q22 8 38 4 Q45 0 58 4 Q68 8 65 26 Q62 16 52 12 Q45 8 38 12 Q28 16 25 26" fill="#7C3AED" />
      {/* Eyes looking up */}
      <ellipse cx="38" cy="28" rx="3" ry="4" fill="#1F2937" />
      <ellipse cx="52" cy="28" rx="3" ry="4" fill="#1F2937" />
      <circle cx="38" cy="26" r="1.5" fill="white" />
      <circle cx="52" cy="26" r="1.5" fill="white" />
      {/* Excited smile */}
      <path d="M38 40 Q45 50 52 40" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Arm reaching up */}
      <path d="M60 70 Q75 50 85 25" stroke="#D4A574" strokeWidth="10" fill="none" strokeLinecap="round" />
      <ellipse cx="87" cy="22" rx="6" ry="7" fill="#D4A574" />
    </g>
    {/* Target/Goal star */}
    <g transform="translate(140, 5)">
      <path d="M20 0 L24 14 L38 14 L26 22 L30 36 L20 28 L10 36 L14 22 L2 14 L16 14 Z" fill="#FCD34D" />
      <path d="M20 8 L22 14 L28 14 L23 18 L25 24 L20 20 L15 24 L17 18 L12 14 L18 14 Z" fill="#FBBF24" />
    </g>
    {/* Checklist items floating */}
    <g transform="translate(10, 40)">
      <rect x="0" y="0" width="35" height="12" rx="3" fill="#ECFCCB" />
      <circle cx="8" cy="6" r="3" fill="#84CC16" />
      <path d="M6 6 L7.5 7.5 L10 5" stroke="white" strokeWidth="1.5" fill="none" />
    </g>
    <g transform="translate(15, 60)">
      <rect x="0" y="0" width="35" height="12" rx="3" fill="#ECFCCB" />
      <circle cx="8" cy="6" r="3" fill="#84CC16" />
      <path d="M6 6 L7.5 7.5 L10 5" stroke="white" strokeWidth="1.5" fill="none" />
    </g>
    <g transform="translate(10, 80)">
      <rect x="0" y="0" width="35" height="12" rx="3" fill="#FEF3C7" />
      <circle cx="8" cy="6" r="3" fill="#D6D3D1" />
    </g>
    {/* Sparkles */}
    <circle cx="160" cy="50" r="4" fill="#FCD34D" opacity="0.8" />
    <circle cx="175" cy="35" r="3" fill="#FCD34D" opacity="0.6" />
    <circle cx="130" cy="20" r="3" fill="#FCD34D" opacity="0.7" />
  </svg>
);

const FeaturesIllustration = () => (
  <svg viewBox="0 0 200 160" fill="none" className="w-48 h-36 mx-auto mb-6">
    {/* Laptop with features */}
    <g transform="translate(30, 40)">
      {/* Laptop base */}
      <rect x="0" y="70" width="140" height="8" rx="2" fill="#57534E" />
      {/* Laptop screen */}
      <rect x="10" y="0" width="120" height="75" rx="4" fill="#1F2937" />
      <rect x="15" y="5" width="110" height="60" rx="2" fill="#F5F5F4" />
      {/* Screen content - feature cards */}
      <rect x="20" y="10" width="45" height="25" rx="2" fill="#ECFCCB" />
      <rect x="70" y="10" width="50" height="25" rx="2" fill="#DBEAFE" />
      <rect x="20" y="38" width="50" height="22" rx="2" fill="#FCE7F3" />
      <rect x="75" y="38" width="45" height="22" rx="2" fill="#FEF3C7" />
      {/* Icons on cards */}
      <circle cx="32" cy="22" r="6" fill="#84CC16" />
      <circle cx="85" cy="22" r="6" fill="#3B82F6" />
      <circle cx="35" cy="49" r="6" fill="#EC4899" />
      <circle cx="90" cy="49" r="6" fill="#F59E0B" />
    </g>
    {/* Floating checkmarks */}
    <g transform="translate(10, 20)">
      <circle cx="15" cy="15" r="12" fill="#84CC16" />
      <path d="M10 15 L13 18 L20 11" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </g>
    <g transform="translate(165, 30)">
      <circle cx="15" cy="15" r="10" fill="#3B82F6" />
      <path d="M11 15 L14 18 L19 12" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
    <g transform="translate(170, 100)">
      <circle cx="12" cy="12" r="9" fill="#F59E0B" />
      <path d="M8 12 L11 15 L16 9" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
    {/* Sparkles */}
    <path d="M180 70 L182 76 L188 76 L183 80 L185 86 L180 82 L175 86 L177 80 L172 76 L178 76 Z" fill="#FCD34D" />
  </svg>
);

const TrialIllustration = () => (
  <svg viewBox="0 0 200 160" fill="none" className="w-48 h-36 mx-auto mb-4">
    {/* Person celebrating */}
    <g transform="translate(60, 25)">
      {/* Body */}
      <path d="M30 65 Q25 90 30 120 L60 120 Q65 90 60 65" fill="#84CC16" />
      {/* Arms up celebrating */}
      <path d="M30 70 Q10 50 5 30" stroke="#FCD9B6" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M60 70 Q80 50 85 30" stroke="#FCD9B6" strokeWidth="10" fill="none" strokeLinecap="round" />
      <ellipse cx="3" cy="27" rx="6" ry="7" fill="#FCD9B6" />
      <ellipse cx="87" cy="27" rx="6" ry="7" fill="#FCD9B6" />
      {/* Neck */}
      <rect x="38" y="48" width="14" height="18" fill="#FCD9B6" />
      {/* Head */}
      <ellipse cx="45" cy="30" rx="20" ry="22" fill="#FCD9B6" />
      {/* Hair */}
      <path d="M25 26 Q22 8 38 4 Q45 0 58 4 Q68 8 65 26 Q62 16 52 12 Q45 8 38 12 Q28 16 25 26" fill="#B45309" />
      {/* Happy eyes (closed) */}
      <path d="M35 28 Q38 32 41 28" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M49 28 Q52 32 55 28" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Big smile */}
      <path d="M35 40 Q45 52 55 40" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Blush */}
      <ellipse cx="28" cy="36" rx="5" ry="3" fill="#FECACA" opacity="0.6" />
      <ellipse cx="62" cy="36" rx="5" ry="3" fill="#FECACA" opacity="0.6" />
    </g>
    {/* Confetti */}
    <rect x="20" y="20" width="8" height="8" rx="1" fill="#F472B6" transform="rotate(15 24 24)" />
    <rect x="170" y="30" width="8" height="8" rx="1" fill="#3B82F6" transform="rotate(-20 174 34)" />
    <rect x="30" y="100" width="6" height="6" rx="1" fill="#FCD34D" transform="rotate(30 33 103)" />
    <rect x="160" y="90" width="7" height="7" rx="1" fill="#84CC16" transform="rotate(-15 163 93)" />
    <circle cx="40" cy="50" r="4" fill="#8B5CF6" />
    <circle cx="155" cy="60" r="5" fill="#F59E0B" />
    <circle cx="180" cy="120" r="4" fill="#EC4899" />
    <circle cx="25" cy="130" r="3" fill="#10B981" />
    {/* Stars */}
    <path d="M15 70 L17 76 L23 76 L18 80 L20 86 L15 82 L10 86 L12 80 L7 76 L13 76 Z" fill="#FCD34D" />
    <path d="M175 15 L177 21 L183 21 L178 25 L180 31 L175 27 L170 31 L172 25 L167 21 L173 21 Z" fill="#FCD34D" />
    {/* Gift box */}
    <g transform="translate(5, 95)">
      <rect x="0" y="10" width="30" height="25" rx="2" fill="#EC4899" />
      <rect x="0" y="10" width="30" height="8" rx="2" fill="#F472B6" />
      <rect x="12" y="10" width="6" height="25" fill="#FCD34D" />
      <path d="M15 10 Q10 5 5 8 Q0 11 5 14" stroke="#FCD34D" strokeWidth="3" fill="none" />
      <path d="M15 10 Q20 5 25 8 Q30 11 25 14" stroke="#FCD34D" strokeWidth="3" fill="none" />
    </g>
  </svg>
);

const OnboardingPage = ({ onNavigate, user, onComplete, onUserUpdate }: OnboardingPageProps) => {
  const [currentStep, setCurrentStep] = useState<Step>('profile');
  const [username, setUsername] = useState(user?.name && !user.name.includes('@') ? user.name : '');
  const [dob, setDob] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedReferral, setSelectedReferral] = useState<string | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'premium'>('starter');
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

  const saveUsername = async () => {
    if (!username.trim() || !user?.id) return;
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: username.trim() })
      });
      if (res.ok) {
        onUserUpdate?.({ name: username.trim() });
      }
    } catch (e) {
      console.error('Failed to save username:', e);
    }
  };

  const goNext = async () => {
    if (currentStep === 'profile' && username.trim() && user?.id) {
      await saveUsername();
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

  const handleStartTrial = async () => {
    localStorage.setItem('writescholar_onboarding_completed', 'true');
    
    if (!user) {
      onNavigate('login');
      return;
    }

    if (username.trim() && user.id) {
      await saveUsername();
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
    if (username.trim() && user?.id) {
      await saveUsername();
    }
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
      <div className="px-6 pt-6 pb-2 flex items-center">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#262626' }}>
            <span className="font-bold text-sm" style={{ color: '#a3e635' }}>W</span>
          </div>
          <span className="text-lg font-semibold text-stone-800">WriteScholar</span>
        </div>
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
              <ProfileIllustration />
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
              <GradeIllustration />
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
              <ReferralIllustration />
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

          {/* Step 4: Goals */}
          {currentStep === 'goals' && (
            <div className="animate-fadeIn">
              <GoalsIllustration />
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

          {/* Step 5: Feature comparison */}
          {currentStep === 'features' && (
            <div className="animate-fadeIn">
              <FeaturesIllustration />
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

          {/* Step 6: Trial paywall */}
          {currentStep === 'trial' && (
            <div className="animate-fadeIn">
              <TrialIllustration />
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
                className="w-full py-4 rounded-full font-bold text-base transition-all text-stone-900 shadow-lg hover:shadow-xl hover:scale-[1.01] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{ background: 'linear-gradient(135deg, #a3e635 0%, #84cc16 100%)' }}
              >
                {isLoadingCheckout ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-stone-800" fill="none" viewBox="0 0 24 24">
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
