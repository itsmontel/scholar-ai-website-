const DualMascot = ({ size = 420 }: { size?: number }) => {
  const h = Math.round(size * 0.62);
  const uniqueId = `dm-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <svg
      viewBox="0 0 420 260"
      width={size}
      height={h}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-2xl"
    >
      <defs>
        <linearGradient id={`${uniqueId}-body1`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
        <linearGradient id={`${uniqueId}-body2`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C4B5FD" />
          <stop offset="50%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id={`${uniqueId}-cap`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#374151" />
          <stop offset="100%" stopColor="#1F2937" />
        </linearGradient>
        <linearGradient id={`${uniqueId}-cap2`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4B5563" />
          <stop offset="100%" stopColor="#374151" />
        </linearGradient>
        <radialGradient id={`${uniqueId}-glow1`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uniqueId}-glow2`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
        </radialGradient>
        <filter id={`${uniqueId}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#6D28D9" floodOpacity="0.25" />
        </filter>
        <filter id={`${uniqueId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <ellipse cx="120" cy="175" rx="75" ry="55" fill={`url(#${uniqueId}-glow1)`} />
      <ellipse cx="300" cy="175" rx="75" ry="55" fill={`url(#${uniqueId}-glow2)`} />

      <g transform="translate(20, 20) scale(0.88)">
        <ellipse cx="68" cy="62" rx="12" ry="18" fill="#8B5CF6" transform="rotate(-20 68 62)" />
        <ellipse cx="68" cy="58" rx="8" ry="12" fill="#A78BFA" transform="rotate(-20 68 58)" />
        <ellipse cx="68" cy="55" rx="4" ry="6" fill="#C4B5FD" transform="rotate(-20 68 55)" />
        <ellipse cx="132" cy="62" rx="12" ry="18" fill="#8B5CF6" transform="rotate(20 132 62)" />
        <ellipse cx="132" cy="58" rx="8" ry="12" fill="#A78BFA" transform="rotate(20 132 58)" />
        <ellipse cx="132" cy="55" rx="4" ry="6" fill="#C4B5FD" transform="rotate(20 132 55)" />
        <g transform="translate(95, 30) rotate(12)">
          <polygon points="0,8 25,0 50,8 25,16" fill={`url(#${uniqueId}-cap)`} />
          <rect x="15" y="8" width="20" height="12" rx="2" fill="#1F2937" />
          <circle cx="25" cy="8" r="3" fill="#374151" />
          <line x1="50" y1="8" x2="58" y2="20" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          <circle cx="58" cy="22" r="3" fill="#F59E0B" />
        </g>
        <g filter={`url(#${uniqueId}-shadow)`}>
          <rect x="55" y="65" width="90" height="95" rx="24" fill={`url(#${uniqueId}-body1)`} />
        </g>
        <path d="M72 92 Q80 88 88 92" stroke="#5B21B6" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M112 90 Q120 84 128 90" stroke="#5B21B6" strokeWidth="3" strokeLinecap="round" fill="none" />
        <ellipse cx="82" cy="108" rx="16" ry="18" fill="white" />
        <ellipse cx="118" cy="108" rx="16" ry="18" fill="white" />
        <path d="M72 108 Q82 100 92 108" stroke="#1F2937" strokeWidth="4" strokeLinecap="round" fill="none" />
        <ellipse cx="118" cy="110" rx="8" ry="10" fill="#1F2937" />
        <circle cx="113" cy="104" r="5" fill="white" opacity="0.9" />
        <circle cx="121" cy="114" r="2.5" fill="white" opacity="0.5" />
        <path d="M80 132 Q100 152 120 132" fill="#5B21B6" />
        <ellipse cx="100" cy="140" rx="10" ry="6" fill="#F472B6" />
        <ellipse cx="100" cy="138" rx="6" ry="3" fill="#F9A8D4" opacity="0.6" />
        <ellipse cx="65" cy="122" rx="8" ry="5" fill="#F9A8D4" opacity="0.45" />
        <ellipse cx="135" cy="122" rx="8" ry="5" fill="#F9A8D4" opacity="0.45" />
        <g transform="translate(25, 65)">
          <ellipse cx="15" cy="30" rx="12" ry="15" fill="#8B5CF6" />
          <ellipse cx="15" cy="27" rx="9" ry="11" fill="#A78BFA" />
          <ellipse cx="10" cy="8" rx="10" ry="12" fill="#A78BFA" transform="rotate(-25 10 8)" />
          <g transform="translate(2, -12) rotate(-15)">
            <circle cx="8" cy="8" r="10" fill="#A78BFA" />
            <ellipse cx="0" cy="2" rx="3" ry="6" fill="#A78BFA" transform="rotate(-30 0 2)" />
            <ellipse cx="4" cy="-2" rx="2.5" ry="5" fill="#A78BFA" transform="rotate(-15 4 -2)" />
            <ellipse cx="10" cy="-3" rx="2.5" ry="5" fill="#A78BFA" transform="rotate(0 10 -3)" />
            <ellipse cx="15" cy="-1" rx="2.5" ry="5" fill="#A78BFA" transform="rotate(15 15 -1)" />
          </g>
          <path d="M-5 5 L-12 2" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          <path d="M-3 12 L-10 12" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        </g>
        <g transform="translate(140, 90)">
          <ellipse cx="8" cy="25" rx="12" ry="15" fill="#8B5CF6" />
          <ellipse cx="8" cy="22" rx="9" ry="11" fill="#A78BFA" />
          <ellipse cx="28" cy="10" rx="18" ry="10" fill="#A78BFA" transform="rotate(-5 28 10)" />
          <circle cx="46" cy="8" r="9" fill="#A78BFA" />
          <circle cx="46" cy="8" r="6" fill="#C4B5FD" opacity="0.5" />
        </g>
        <ellipse cx="78" cy="165" rx="14" ry="10" fill="#7C3AED" />
        <ellipse cx="78" cy="163" rx="10" ry="6" fill="#8B5CF6" />
        <ellipse cx="122" cy="165" rx="14" ry="10" fill="#7C3AED" />
        <ellipse cx="122" cy="163" rx="10" ry="6" fill="#8B5CF6" />
        <g filter={`url(#${uniqueId}-glow)`} opacity="0.9">
          <path d="M15 30 L17 35 L22 35 L18 38 L20 43 L15 40 L10 43 L12 38 L8 35 L13 35 Z" fill="#FDE68A" />
          <circle cx="5" cy="18" r="3" fill="#C4B5FD" />
          <circle cx="26" cy="15" r="2" fill="#DDD6FE" />
        </g>
        <circle cx="70" cy="80" r="3" fill="white" opacity="0.4" />
      </g>

      <g transform="translate(205, 10)">
        <ellipse cx="68" cy="62" rx="12" ry="18" fill="#7C3AED" transform="rotate(-20 68 62)" />
        <ellipse cx="68" cy="58" rx="8" ry="12" fill="#8B5CF6" transform="rotate(-20 68 58)" />
        <ellipse cx="68" cy="55" rx="4" ry="6" fill="#A78BFA" transform="rotate(-20 68 55)" />
        <ellipse cx="132" cy="62" rx="12" ry="18" fill="#7C3AED" transform="rotate(20 132 62)" />
        <ellipse cx="132" cy="58" rx="8" ry="12" fill="#8B5CF6" transform="rotate(20 132 58)" />
        <ellipse cx="132" cy="55" rx="4" ry="6" fill="#A78BFA" transform="rotate(20 132 55)" />
        <g transform="translate(95, 28) rotate(-10)">
          <polygon points="0,8 25,0 50,8 25,16" fill={`url(#${uniqueId}-cap2)`} />
          <rect x="15" y="8" width="20" height="12" rx="2" fill="#374151" />
          <circle cx="25" cy="8" r="3" fill="#4B5563" />
          <line x1="0" y1="8" x2="-8" y2="20" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          <circle cx="-8" cy="22" r="3" fill="#F59E0B" />
        </g>
        <g filter={`url(#${uniqueId}-shadow)`}>
          <rect x="55" y="65" width="90" height="95" rx="24" fill={`url(#${uniqueId}-body2)`} />
        </g>
        <path d="M72 90 Q80 84 88 90" stroke="#4C1D95" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M112 90 Q120 84 128 90" stroke="#4C1D95" strokeWidth="3" strokeLinecap="round" fill="none" />
        <ellipse cx="82" cy="108" rx="16" ry="18" fill="white" />
        <ellipse cx="118" cy="108" rx="16" ry="18" fill="white" />
        <path d="M72 108 Q82 100 92 108" stroke="#1F2937" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M108 108 Q118 100 128 108" stroke="#1F2937" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M75 130 Q100 160 125 130" fill="#4C1D95" />
        <ellipse cx="100" cy="145" rx="14" ry="8" fill="#F472B6" />
        <ellipse cx="100" cy="142" rx="8" ry="4" fill="#F9A8D4" opacity="0.6" />
        <path d="M82 130 L85 138 L88 130" fill="white" />
        <path d="M112 130 L115 138 L118 130" fill="white" />
        <ellipse cx="65" cy="122" rx="8" ry="5" fill="#F9A8D4" opacity="0.5" />
        <ellipse cx="135" cy="122" rx="8" ry="5" fill="#F9A8D4" opacity="0.5" />
        <g transform="translate(25, 90)">
          <ellipse cx="18" cy="28" rx="12" ry="15" fill="#7C3AED" />
          <ellipse cx="18" cy="25" rx="9" ry="11" fill="#8B5CF6" />
          <circle cx="5" cy="14" r="9" fill="#8B5CF6" />
          <circle cx="5" cy="14" r="6" fill="#A78BFA" opacity="0.5" />
        </g>
        <g transform="translate(142, 60)">
          <ellipse cx="8" cy="35" rx="12" ry="15" fill="#7C3AED" />
          <ellipse cx="8" cy="32" rx="9" ry="11" fill="#8B5CF6" />
          <ellipse cx="10" cy="12" rx="10" ry="13" fill="#8B5CF6" transform="rotate(30 10 12)" />
          <circle cx="22" cy="-2" r="10" fill="#8B5CF6" />
          <circle cx="22" cy="-2" r="7" fill="#A78BFA" opacity="0.5" />
          <g transform="translate(14, -22)">
            <rect x="0" y="0" width="22" height="28" rx="4" fill="#6D28D9" />
            <rect x="2" y="2" width="18" height="24" rx="3" fill="#DDD6FE" />
            <circle cx="11" cy="10" r="3" fill="#8B5CF6" />
            <path d="M6 16 Q11 12 16 16" stroke="#8B5CF6" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <circle cx="6" cy="16" r="2" fill="#A78BFA" />
            <circle cx="16" cy="16" r="2" fill="#A78BFA" />
            <rect x="4" y="21" width="14" height="2" rx="1" fill="#C4B5FD" opacity="0.6" />
          </g>
        </g>
        <ellipse cx="78" cy="165" rx="14" ry="10" fill="#6D28D9" />
        <ellipse cx="78" cy="163" rx="10" ry="6" fill="#7C3AED" />
        <ellipse cx="122" cy="165" rx="14" ry="10" fill="#6D28D9" />
        <ellipse cx="122" cy="163" rx="10" ry="6" fill="#7C3AED" />
        <g filter={`url(#${uniqueId}-glow)`} opacity="0.85">
          <path d="M170 20 L172 26 L178 26 L173 30 L175 36 L170 32 L165 36 L167 30 L162 26 L168 26 Z" fill="#FDE68A" />
          <circle cx="178" cy="50" r="3" fill="#DDD6FE" />
          <circle cx="158" cy="38" r="2" fill="#F9A8D4" />
        </g>
        <g opacity="0.7">
          <rect x="158" y="68" width="6" height="6" rx="1" fill="#F472B6" transform="rotate(25 161 71)" />
          <rect x="175" y="80" width="5" height="5" rx="1" fill="#34D399" transform="rotate(-20 177 82)" />
        </g>
        <circle cx="130" cy="80" r="2" fill="white" opacity="0.35" />
      </g>

      <g filter={`url(#${uniqueId}-glow)`}>
        <path d="M208 100 L210 106 L216 106 L211 110 L213 116 L208 112 L203 116 L205 110 L200 106 L206 106 Z" fill="#FDE68A" opacity="0.9" />
        <circle cx="200" cy="88" r="4" fill="#C4B5FD" opacity="0.8" />
        <circle cx="218" cy="120" r="3" fill="#F9A8D4" opacity="0.75" />
      </g>
      <g transform="translate(196, 130)">
        <path d="M10 4 C10 2 8 0 6 0 C4 0 2 2 2 4 C2 7 10 13 10 13 C10 13 18 7 18 4 C18 2 16 0 14 0 C12 0 10 2 10 4Z" fill="#F472B6" opacity="0.75" />
      </g>
    </svg>
  );
};

export default DualMascot;
