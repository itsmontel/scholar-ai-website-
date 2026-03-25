import React, { useState, useEffect } from 'react';

const ANIMATED_TEXTS = [
  'Summarise, cite & analyse',
  'Powerful study tools for students',
  'Paper analysis & so much more',
  'Your all-in-one academic AI',
] as const;

/**
 * Right-hand marketing column used on login, signup, and reset-password flows.
 */
export const AuthMarketingSide: React.FC = () => {
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const textInterval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % ANIMATED_TEXTS.length);
    }, 2000);
    return () => clearInterval(textInterval);
  }, []);

  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-50/80 via-red-50/50 to-stone-100 dark:from-stone-900 dark:via-violet-950/30 dark:to-stone-900 flex-col items-center justify-center p-8 relative overflow-hidden rounded-l-3xl">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-200/20 via-red-100/20 to-stone-200/30 dark:from-violet-900/20 dark:via-red-900/10 dark:to-transparent backdrop-blur-sm rounded-l-3xl" />

      <div className="relative z-10 max-w-lg w-full">
        <div className="bg-gradient-to-r from-white/70 to-white/40 dark:from-stone-800/70 dark:to-stone-800/40 backdrop-blur-xl rounded-3xl p-10 border border-violet-100/50 dark:border-stone-700 shadow-2xl shadow-violet-500/10">
          <div className="flex items-center space-x-5">
            <span className="text-2xl font-semibold text-stone-700 dark:text-stone-200 flex-1 transition-all duration-700 ease-in-out">
              {ANIMATED_TEXTS[textIndex]}
            </span>
            <div className="w-0.5 h-8 bg-violet-500 animate-pulse rounded-full" />
            <button
              type="button"
              className="w-10 h-10 bg-violet-600 hover:bg-violet-500 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-xl shadow-violet-500/30"
              aria-hidden
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-8">
        <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-72 h-36" aria-hidden>
          <g transform="translate(0, 0)">
            <path d="M35 80 Q30 102 35 130 L65 130 Q70 102 65 80" fill="#8B5CF6" />
            <rect x="43" y="62" width="14" height="20" fill="#FCD9B6" />
            <ellipse cx="50" cy="40" rx="22" ry="25" fill="#FCD9B6" />
            <path d="M28 34 Q24 16 38 10 Q50 3 66 10 Q78 16 74 34 Q71 25 60 20 Q50 15 40 20 Q30 25 28 34" fill="#B45309" />
            <path d="M28 34 Q20 58 28 85" fill="#B45309" />
            <path d="M72 34 Q80 58 72 85" fill="#B45309" />
            <ellipse cx="40" cy="40" rx="4" ry="5" fill="#1F2937" />
            <ellipse cx="60" cy="40" rx="4" ry="5" fill="#1F2937" />
            <circle cx="41" cy="38" r="1.5" fill="white" />
            <circle cx="61" cy="38" r="1.5" fill="white" />
            <path d="M40 52 Q50 62 60 52" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
            <ellipse cx="30" cy="47" rx="5" ry="3" fill="#FECACA" opacity="0.5" />
            <ellipse cx="70" cy="47" rx="5" ry="3" fill="#FECACA" opacity="0.5" />
            <path d="M70 85 Q82 72 86 55" stroke="#FCD9B6" strokeWidth="9" fill="none" strokeLinecap="round" />
            <ellipse cx="88" cy="53" rx="6" ry="7" fill="#FCD9B6" />
          </g>
          <g transform="translate(110, -8)">
            <path d="M35 95 Q30 120 35 150 L75 150 Q80 120 75 95" fill="#3B82F6" />
            <rect x="47" y="74" width="16" height="24" fill="#E8B796" />
            <ellipse cx="55" cy="48" rx="26" ry="30" fill="#E8B796" />
            <path d="M29 40 Q26 20 40 14 Q55 6 70 14 Q84 20 81 40 Q78 28 66 21 Q55 15 44 21 Q32 28 29 40" fill="#5D4037" />
            <path d="M29 40 Q22 50 29 60" fill="#5D4037" />
            <path d="M81 40 Q88 50 81 60" fill="#5D4037" />
            <ellipse cx="42" cy="46" rx="12" ry="10" fill="none" stroke="#374151" strokeWidth="2.5" />
            <ellipse cx="68" cy="46" rx="12" ry="10" fill="none" stroke="#374151" strokeWidth="2.5" />
            <path d="M54 46 L56 46" stroke="#374151" strokeWidth="2.5" />
            <path d="M30 43 L24 40" stroke="#374151" strokeWidth="2.5" />
            <path d="M80 43 L86 40" stroke="#374151" strokeWidth="2.5" />
            <ellipse cx="42" cy="48" rx="4" ry="5" fill="#1F2937" />
            <ellipse cx="68" cy="48" rx="4" ry="5" fill="#1F2937" />
            <circle cx="43" cy="46" r="1.5" fill="white" />
            <circle cx="69" cy="46" r="1.5" fill="white" />
            <path d="M30 34 Q42 28 54 34" stroke="#5D4037" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M56 34 Q68 28 80 34" stroke="#5D4037" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M42 64 Q55 76 68 64" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <ellipse cx="28" cy="56" rx="5" ry="3" fill="#FECACA" opacity="0.4" />
            <ellipse cx="82" cy="56" rx="5" ry="3" fill="#FECACA" opacity="0.4" />
            <path d="M80 100 Q92 88 96 68" stroke="#E8B796" strokeWidth="11" fill="none" strokeLinecap="round" />
            <ellipse cx="98" cy="66" rx="7" ry="8" fill="#E8B796" />
            <path d="M45 90 L55 102 L65 90" stroke="#2563EB" strokeWidth="2" fill="none" />
          </g>
          <g transform="translate(220, 2)">
            <path d="M30 78 Q25 100 30 128 L60 128 Q65 100 60 78" fill="#10B981" />
            <rect x="38" y="60" width="14" height="20" fill="#D4A574" />
            <ellipse cx="45" cy="38" rx="22" ry="24" fill="#D4A574" />
            <path d="M23 32 Q20 15 33 10 Q45 4 60 10 Q72 15 69 32 Q65 23 54 18 Q45 14 36 18 Q26 23 23 32" fill="#1F2937" />
            <ellipse cx="45" cy="6" rx="10" ry="8" fill="#1F2937" />
            <path d="M23 32 Q16 42 23 52" fill="#1F2937" />
            <path d="M67 32 Q74 42 67 52" fill="#1F2937" />
            <ellipse cx="36" cy="38" rx="4" ry="5" fill="#1F2937" />
            <ellipse cx="54" cy="38" rx="4" ry="5" fill="#1F2937" />
            <circle cx="37" cy="36" r="1.5" fill="white" />
            <circle cx="55" cy="36" r="1.5" fill="white" />
            <path d="M28 30 Q36 26 44 30" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M46 30 Q54 26 62 30" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M35 50 Q45 60 55 50" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
            <ellipse cx="25" cy="44" rx="5" ry="3" fill="#FECACA" opacity="0.5" />
            <ellipse cx="65" cy="44" rx="5" ry="3" fill="#FECACA" opacity="0.5" />
            <path d="M25 82 Q12 70 8 52" stroke="#D4A574" strokeWidth="9" fill="none" strokeLinecap="round" />
            <ellipse cx="7" cy="50" rx="6" ry="7" fill="#D4A574" />
          </g>
        </svg>
      </div>

      <div
        className="absolute top-16 left-16 w-32 h-32 bg-gradient-to-br from-violet-300/25 to-red-300/20 rounded-full animate-bounce"
        style={{ animationDuration: '6s' }}
      />
      <div
        className="absolute bottom-20 right-20 w-24 h-24 bg-gradient-to-br from-red-300/25 to-violet-300/20 rounded-full animate-bounce"
        style={{ animationDuration: '8s', animationDelay: '2s' }}
      />
      <div
        className="absolute top-1/3 right-12 w-20 h-20 bg-gradient-to-br from-violet-200/20 to-red-200/15 rounded-full animate-bounce"
        style={{ animationDuration: '7s', animationDelay: '1s' }}
      />
      <div
        className="absolute top-1/4 left-1/4 w-16 h-16 bg-gradient-to-br from-violet-200/15 to-red-200/10 rounded-full animate-bounce"
        style={{ animationDuration: '5s', animationDelay: '0.5s' }}
      />
      <div
        className="absolute bottom-1/3 left-1/3 w-12 h-12 bg-gradient-to-br from-red-200/15 to-violet-200/10 rounded-full animate-bounce"
        style={{ animationDuration: '4s', animationDelay: '1.5s' }}
      />
    </div>
  );
};

export default AuthMarketingSide;
