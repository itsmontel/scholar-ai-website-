interface ScholarMascotProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

const ScholarMascot = ({ size = 200, className = '', animated = true }: ScholarMascotProps) => {
  const animationClass = animated ? 'animate-[mascot-float_3s_ease-in-out_infinite]' : '';
  
  return (
    <div className={`relative ${animationClass} ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-2xl"
      >
        <defs>
          {/* Main body gradient */}
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#6D28D9" />
          </linearGradient>
          
          {/* Body highlight gradient */}
          <linearGradient id="bodyHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </linearGradient>
          
          {/* Ambient glow */}
          <radialGradient id="ambientGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
            <stop offset="70%" stopColor="#8B5CF6" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </radialGradient>
          
          {/* Pencil gradient */}
          <linearGradient id="pencilGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          
          {/* Cap gradient */}
          <linearGradient id="capGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="100%" stopColor="#1F2937" />
          </linearGradient>
          
          {/* Eye shine */}
          <radialGradient id="eyeShine" cx="30%" cy="30%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          
          {/* Shadow filter */}
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#6D28D9" floodOpacity="0.3" />
          </filter>
          
          {/* Glow filter for sparkles */}
          <filter id="sparkleGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Ambient glow background */}
        <circle cx="100" cy="105" r="85" fill="url(#ambientGlow)" />
        
        {/* Floating sparkles */}
        <g className={animated ? 'animate-[sparkle-pulse_2s_ease-in-out_infinite]' : ''} filter="url(#sparkleGlow)">
          <path d="M35 45 L37 50 L42 50 L38 53 L40 58 L35 55 L30 58 L32 53 L28 50 L33 50 Z" fill="#C4B5FD" opacity="0.8" />
          <path d="M165 55 L166.5 58.5 L170 59 L167 61 L168 65 L165 62.5 L162 65 L163 61 L160 59 L163.5 58.5 Z" fill="#DDD6FE" opacity="0.7" />
          <path d="M155 130 L156 133 L159 133 L156.5 135 L157.5 138 L155 136 L152.5 138 L153.5 135 L151 133 L154 133 Z" fill="#C4B5FD" opacity="0.6" />
          <circle cx="45" cy="140" r="3" fill="#DDD6FE" opacity="0.5" />
          <circle cx="160" cy="85" r="2.5" fill="#EDE9FE" opacity="0.6" />
        </g>
        
        {/* Floating books */}
        <g opacity="0.4">
          <g transform="translate(25, 70) rotate(-15)">
            <rect width="18" height="14" rx="2" fill="#DDD6FE" />
            <rect x="2" y="3" width="14" height="1.5" rx="0.5" fill="#8B5CF6" opacity="0.5" />
            <rect x="2" y="6" width="10" height="1.5" rx="0.5" fill="#8B5CF6" opacity="0.5" />
            <rect x="2" y="9" width="12" height="1.5" rx="0.5" fill="#8B5CF6" opacity="0.5" />
          </g>
          <g transform="translate(160, 145) rotate(10)">
            <rect width="16" height="12" rx="2" fill="#EDE9FE" />
            <rect x="2" y="2.5" width="12" height="1.2" rx="0.5" fill="#A78BFA" opacity="0.5" />
            <rect x="2" y="5" width="8" height="1.2" rx="0.5" fill="#A78BFA" opacity="0.5" />
            <rect x="2" y="7.5" width="10" height="1.2" rx="0.5" fill="#A78BFA" opacity="0.5" />
          </g>
        </g>
        
        {/* Main body with shadow */}
        <g filter="url(#softShadow)">
          {/* Body - rounded cube shape */}
          <rect x="55" y="65" width="90" height="95" rx="24" fill="url(#bodyGradient)" />
          
          {/* Body highlight overlay */}
          <rect x="55" y="65" width="90" height="95" rx="24" fill="url(#bodyHighlight)" />
          
          {/* Subtle inner shadow at bottom */}
          <path 
            d="M79 155 Q100 165 121 155" 
            fill="none" 
            stroke="#5B21B6" 
            strokeWidth="3" 
            strokeLinecap="round"
            opacity="0.3"
          />
        </g>
        
        {/* Horns */}
        <g>
          {/* Left horn */}
          <ellipse cx="68" cy="62" rx="12" ry="18" fill="#8B5CF6" transform="rotate(-20 68 62)" />
          <ellipse cx="68" cy="58" rx="8" ry="12" fill="#A78BFA" transform="rotate(-20 68 58)" />
          <ellipse cx="68" cy="55" rx="4" ry="6" fill="#C4B5FD" transform="rotate(-20 68 55)" />
          
          {/* Right horn */}
          <ellipse cx="132" cy="62" rx="12" ry="18" fill="#8B5CF6" transform="rotate(20 132 62)" />
          <ellipse cx="132" cy="58" rx="8" ry="12" fill="#A78BFA" transform="rotate(20 132 58)" />
          <ellipse cx="132" cy="55" rx="4" ry="6" fill="#C4B5FD" transform="rotate(20 132 55)" />
        </g>
        
        {/* Graduation cap */}
        <g transform="translate(95, 30) rotate(12)">
          {/* Cap board */}
          <polygon points="0,8 25,0 50,8 25,16" fill="url(#capGradient)" />
          {/* Cap top */}
          <rect x="15" y="8" width="20" height="12" rx="2" fill="#1F2937" />
          {/* Button on top */}
          <circle cx="25" cy="8" r="3" fill="#374151" />
          {/* Tassel */}
          <line x1="50" y1="8" x2="58" y2="20" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          <circle cx="58" cy="22" r="3" fill="#F59E0B" />
        </g>
        
        {/* Eyebrows */}
        <path d="M72 92 Q80 88 88 92" stroke="#5B21B6" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M112 92 Q120 88 128 92" stroke="#5B21B6" strokeWidth="3" strokeLinecap="round" fill="none" />
        
        {/* Eyes */}
        <g>
          {/* Left eye white */}
          <ellipse cx="82" cy="108" rx="16" ry="18" fill="white" />
          {/* Left eye pupil */}
          <ellipse cx="84" cy="110" rx="8" ry="10" fill="#1F2937" />
          {/* Left eye shine */}
          <circle cx="79" cy="104" r="5" fill="white" opacity="0.9" />
          <circle cx="87" cy="114" r="2.5" fill="white" opacity="0.5" />
          
          {/* Right eye white */}
          <ellipse cx="118" cy="108" rx="16" ry="18" fill="white" />
          {/* Right eye pupil */}
          <ellipse cx="120" cy="110" rx="8" ry="10" fill="#1F2937" />
          {/* Right eye shine */}
          <circle cx="115" cy="104" r="5" fill="white" opacity="0.9" />
          <circle cx="123" cy="114" r="2.5" fill="white" opacity="0.5" />
        </g>
        
        {/* Mouth */}
        <g>
          {/* Main smile */}
          <path 
            d="M80 132 Q100 150 120 132" 
            fill="#5B21B6" 
          />
          {/* Tongue */}
          <ellipse cx="100" cy="140" rx="10" ry="6" fill="#F472B6" />
          <ellipse cx="100" cy="138" rx="6" ry="3" fill="#F9A8D4" opacity="0.6" />
          
          {/* Fangs */}
          <path d="M85 132 L88 140 L91 132" fill="white" />
          <path d="M109 132 L112 140 L115 132" fill="white" />
        </g>
        
        {/* Left arm (thumbs up) */}
        <g transform="translate(35, 100)">
          {/* Arm */}
          <ellipse cx="15" cy="25" rx="12" ry="15" fill="#8B5CF6" />
          <ellipse cx="15" cy="22" rx="9" ry="11" fill="#A78BFA" />
          
          {/* Hand */}
          <circle cx="12" cy="10" r="10" fill="#A78BFA" />
          <circle cx="12" cy="10" r="7" fill="#C4B5FD" opacity="0.5" />
          
          {/* Thumb */}
          <ellipse cx="5" cy="2" rx="5" ry="8" fill="#A78BFA" transform="rotate(-30 5 2)" />
          <ellipse cx="5" cy="0" rx="3" ry="5" fill="#C4B5FD" transform="rotate(-30 5 0)" opacity="0.5" />
        </g>
        
        {/* Right arm (holding pencil) */}
        <g transform="translate(140, 95)">
          {/* Arm */}
          <ellipse cx="10" cy="28" rx="12" ry="15" fill="#8B5CF6" />
          <ellipse cx="10" cy="25" rx="9" ry="11" fill="#A78BFA" />
          
          {/* Hand */}
          <circle cx="15" cy="12" r="10" fill="#A78BFA" />
          <circle cx="15" cy="12" r="7" fill="#C4B5FD" opacity="0.5" />
          
          {/* Pencil */}
          <g transform="translate(20, -15) rotate(35)">
            {/* Pencil body */}
            <rect x="0" y="0" width="8" height="45" rx="2" fill="url(#pencilGradient)" />
            {/* Pencil stripe */}
            <rect x="0" y="5" width="8" height="35" fill="#F59E0B" />
            <rect x="2" y="5" width="4" height="35" fill="#FBBF24" />
            {/* Pencil tip */}
            <polygon points="0,45 4,55 8,45" fill="#FDE68A" />
            <polygon points="2,45 4,52 6,45" fill="#92400E" />
            {/* Eraser */}
            <rect x="0" y="0" width="8" height="6" rx="1" fill="#F472B6" />
            <rect x="1" y="1" width="6" height="2" rx="0.5" fill="#F9A8D4" opacity="0.5" />
            {/* Metal band */}
            <rect x="0" y="5" width="8" height="4" fill="#9CA3AF" />
            <rect x="0" y="5" width="8" height="1" fill="#D1D5DB" />
            
            {/* Pencil glow/sparkle */}
            <circle cx="4" cy="56" r="4" fill="#FDE68A" opacity="0.6" filter="url(#sparkleGlow)" />
          </g>
        </g>
        
        {/* Legs/feet */}
        <g>
          {/* Left foot */}
          <ellipse cx="78" cy="165" rx="14" ry="10" fill="#7C3AED" />
          <ellipse cx="78" cy="163" rx="10" ry="6" fill="#8B5CF6" />
          
          {/* Right foot */}
          <ellipse cx="122" cy="165" rx="14" ry="10" fill="#7C3AED" />
          <ellipse cx="122" cy="163" rx="10" ry="6" fill="#8B5CF6" />
        </g>
        
        {/* Cheek blush */}
        <ellipse cx="65" cy="122" rx="8" ry="5" fill="#F9A8D4" opacity="0.4" />
        <ellipse cx="135" cy="122" rx="8" ry="5" fill="#F9A8D4" opacity="0.4" />
        
        {/* Body sparkle highlights */}
        <circle cx="70" cy="80" r="3" fill="white" opacity="0.4" />
        <circle cx="130" cy="90" r="2" fill="white" opacity="0.3" />
      </svg>
      
      {/* CSS for animations */}
      <style>{`
        @keyframes mascot-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes sparkle-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default ScholarMascot;
