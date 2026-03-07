interface ScholarMascotProps {
  size?: number;
  className?: string;
  animated?: boolean;
  pose?: 'default' | 'waving' | 'pointing' | 'celebrating' | 'studying' | 'thinking' | 'analyzing';
}

const ScholarMascot = ({ size = 200, className = '', animated = true, pose = 'default' }: ScholarMascotProps) => {
  const animationClass = animated ? 'animate-[mascot-float_3s_ease-in-out_infinite]' : '';
  const uniqueId = Math.random().toString(36).substr(2, 9);
  
  const renderArms = () => {
    switch (pose) {
      case 'waving':
        return (
          <>
            {/* Left arm (waving high) */}
            <g transform="translate(25, 65)">
              <ellipse cx="15" cy="30" rx="12" ry="15" fill="#8B5CF6" />
              <ellipse cx="15" cy="27" rx="9" ry="11" fill="#A78BFA" />
              <ellipse cx="10" cy="8" rx="10" ry="12" fill="#A78BFA" transform="rotate(-25 10 8)" />
              <ellipse cx="10" cy="8" rx="7" ry="8" fill="#C4B5FD" opacity="0.5" transform="rotate(-25 10 8)" />
              {/* Waving hand */}
              <g transform="translate(2, -12) rotate(-15)">
                <circle cx="8" cy="8" r="10" fill="#A78BFA" />
                <circle cx="8" cy="8" r="7" fill="#C4B5FD" opacity="0.5" />
                {/* Fingers spread for wave */}
                <ellipse cx="0" cy="2" rx="3" ry="6" fill="#A78BFA" transform="rotate(-30 0 2)" />
                <ellipse cx="4" cy="-2" rx="2.5" ry="5" fill="#A78BFA" transform="rotate(-15 4 -2)" />
                <ellipse cx="10" cy="-3" rx="2.5" ry="5" fill="#A78BFA" transform="rotate(0 10 -3)" />
                <ellipse cx="15" cy="-1" rx="2.5" ry="5" fill="#A78BFA" transform="rotate(15 15 -1)" />
              </g>
              {/* Motion lines */}
              <path d="M-5 5 L-12 2" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              <path d="M-3 12 L-10 12" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
              <path d="M-4 -3 L-10 -8" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
            </g>
            
            {/* Right arm (relaxed at side) */}
            <g transform="translate(145, 100)">
              <ellipse cx="8" cy="25" rx="12" ry="15" fill="#8B5CF6" />
              <ellipse cx="8" cy="22" rx="9" ry="11" fill="#A78BFA" />
              <circle cx="10" cy="40" r="9" fill="#A78BFA" />
              <circle cx="10" cy="40" r="6" fill="#C4B5FD" opacity="0.5" />
            </g>
          </>
        );
      
      case 'pointing':
        return (
          <>
            {/* Left arm (at side) */}
            <g transform="translate(35, 100)">
              <ellipse cx="15" cy="25" rx="12" ry="15" fill="#8B5CF6" />
              <ellipse cx="15" cy="22" rx="9" ry="11" fill="#A78BFA" />
              <circle cx="12" cy="40" r="9" fill="#A78BFA" />
              <circle cx="12" cy="40" r="6" fill="#C4B5FD" opacity="0.5" />
            </g>
            
            {/* Right arm (pointing forward) */}
            <g transform="translate(140, 90)">
              <ellipse cx="12" cy="20" rx="12" ry="15" fill="#8B5CF6" />
              <ellipse cx="12" cy="17" rx="9" ry="11" fill="#A78BFA" />
              {/* Extended arm */}
              <ellipse cx="30" cy="5" rx="15" ry="10" fill="#A78BFA" transform="rotate(-10 30 5)" />
              <ellipse cx="30" cy="5" rx="11" ry="7" fill="#C4B5FD" opacity="0.5" transform="rotate(-10 30 5)" />
              {/* Pointing hand */}
              <g transform="translate(42, -5)">
                <circle cx="8" cy="8" r="9" fill="#A78BFA" />
                <circle cx="8" cy="8" r="6" fill="#C4B5FD" opacity="0.5" />
                {/* Pointing finger */}
                <ellipse cx="22" cy="6" rx="12" ry="4" fill="#A78BFA" transform="rotate(-5 22 6)" />
                <ellipse cx="22" cy="6" rx="9" ry="3" fill="#C4B5FD" opacity="0.5" transform="rotate(-5 22 6)" />
                {/* Finger tip highlight */}
                <circle cx="32" cy="5" r="3" fill="#DDD6FE" opacity="0.6" />
              </g>
              {/* Sparkle at pointing tip */}
              <g filter={`url(#sparkleGlow-${uniqueId})`}>
                <path d="M78 0 L80 5 L85 5 L81 8 L83 13 L78 10 L73 13 L75 8 L71 5 L76 5 Z" fill="#FDE68A" opacity="0.9" />
              </g>
            </g>
          </>
        );
      
      case 'celebrating':
        return (
          <>
            {/* Left arm (raised with star) */}
            <g transform="translate(20, 55)">
              <ellipse cx="20" cy="35" rx="12" ry="15" fill="#8B5CF6" />
              <ellipse cx="20" cy="32" rx="9" ry="11" fill="#A78BFA" />
              <ellipse cx="12" cy="12" rx="10" ry="13" fill="#A78BFA" transform="rotate(-35 12 12)" />
              <ellipse cx="12" cy="12" rx="7" ry="9" fill="#C4B5FD" opacity="0.5" transform="rotate(-35 12 12)" />
              {/* Hand */}
              <circle cx="5" cy="-5" r="10" fill="#A78BFA" />
              <circle cx="5" cy="-5" r="7" fill="#C4B5FD" opacity="0.5" />
              {/* Star above hand */}
              <g filter={`url(#sparkleGlow-${uniqueId})`} transform="translate(-5, -25)">
                <path d="M10 0 L12 7 L19 7 L14 11 L16 18 L10 14 L4 18 L6 11 L1 7 L8 7 Z" fill="#FDE68A" />
                <path d="M10 3 L11.5 8 L17 8 L12.5 11 L14 16 L10 13 L6 16 L7.5 11 L3 8 L8.5 8 Z" fill="#FBBF24" opacity="0.8" />
              </g>
            </g>
            
            {/* Right arm (raised with star) */}
            <g transform="translate(145, 55)">
              <ellipse cx="5" cy="35" rx="12" ry="15" fill="#8B5CF6" />
              <ellipse cx="5" cy="32" rx="9" ry="11" fill="#A78BFA" />
              <ellipse cx="12" cy="12" rx="10" ry="13" fill="#A78BFA" transform="rotate(35 12 12)" />
              <ellipse cx="12" cy="12" rx="7" ry="9" fill="#C4B5FD" opacity="0.5" transform="rotate(35 12 12)" />
              {/* Hand */}
              <circle cx="18" cy="-5" r="10" fill="#A78BFA" />
              <circle cx="18" cy="-5" r="7" fill="#C4B5FD" opacity="0.5" />
              {/* Star above hand */}
              <g filter={`url(#sparkleGlow-${uniqueId})`} transform="translate(8, -25)">
                <path d="M10 0 L12 7 L19 7 L14 11 L16 18 L10 14 L4 18 L6 11 L1 7 L8 7 Z" fill="#FDE68A" />
                <path d="M10 3 L11.5 8 L17 8 L12.5 11 L14 16 L10 13 L6 16 L7.5 11 L3 8 L8.5 8 Z" fill="#FBBF24" opacity="0.8" />
              </g>
            </g>
            
            {/* Confetti particles */}
            <g opacity="0.7">
              <rect x="30" y="40" width="6" height="6" rx="1" fill="#F472B6" transform="rotate(25 33 43)" />
              <rect x="165" y="35" width="5" height="5" rx="1" fill="#34D399" transform="rotate(-20 167 37)" />
              <rect x="45" y="25" width="4" height="4" rx="1" fill="#60A5FA" transform="rotate(45 47 27)" />
              <rect x="150" y="50" width="5" height="5" rx="1" fill="#FBBF24" transform="rotate(15 152 52)" />
              <circle cx="55" cy="55" r="3" fill="#A78BFA" />
              <circle cx="145" cy="25" r="2.5" fill="#F472B6" />
            </g>
          </>
        );
      
      case 'studying':
        return (
          <>
            {/* Left arm (holding book from below) */}
            <g transform="translate(25, 85)">
              <ellipse cx="18" cy="28" rx="12" ry="15" fill="#8B5CF6" />
              <ellipse cx="18" cy="25" rx="9" ry="11" fill="#A78BFA" />
              {/* Hand supporting book */}
              <circle cx="30" cy="15" r="10" fill="#A78BFA" />
              <circle cx="30" cy="15" r="7" fill="#C4B5FD" opacity="0.5" />
            </g>
            
            {/* Right arm (holding book from side) */}
            <g transform="translate(130, 85)">
              <ellipse cx="8" cy="28" rx="12" ry="15" fill="#8B5CF6" />
              <ellipse cx="8" cy="25" rx="9" ry="11" fill="#A78BFA" />
              {/* Hand on book */}
              <circle cx="-5" cy="15" r="10" fill="#A78BFA" />
              <circle cx="-5" cy="15" r="7" fill="#C4B5FD" opacity="0.5" />
            </g>
            
            {/* Open book in front */}
            <g transform="translate(55, 95)">
              {/* Book spine */}
              <rect x="42" y="0" width="6" height="35" fill="#8B5CF6" />
              {/* Left page */}
              <path d="M0 5 Q20 0 42 5 L42 35 Q20 30 0 35 Z" fill="#FAFAF9" stroke="#E7E5E4" strokeWidth="1" />
              {/* Right page */}
              <path d="M48 5 Q68 0 90 5 L90 35 Q68 30 48 35 Z" fill="#FAFAF9" stroke="#E7E5E4" strokeWidth="1" />
              {/* Text lines left */}
              <g opacity="0.4">
                <rect x="6" y="10" width="30" height="2" rx="1" fill="#A78BFA" />
                <rect x="6" y="15" width="25" height="2" rx="1" fill="#A78BFA" />
                <rect x="6" y="20" width="28" height="2" rx="1" fill="#A78BFA" />
                <rect x="6" y="25" width="20" height="2" rx="1" fill="#A78BFA" />
              </g>
              {/* Text lines right */}
              <g opacity="0.4">
                <rect x="54" y="10" width="30" height="2" rx="1" fill="#A78BFA" />
                <rect x="54" y="15" width="25" height="2" rx="1" fill="#A78BFA" />
                <rect x="54" y="20" width="28" height="2" rx="1" fill="#A78BFA" />
                <rect x="54" y="25" width="22" height="2" rx="1" fill="#A78BFA" />
              </g>
              {/* Sparkles around book */}
              <g filter={`url(#sparkleGlow-${uniqueId})`}>
                <path d="M-5 -5 L-3 0 L2 0 L-1 3 L0 8 L-5 5 L-10 8 L-9 3 L-12 0 L-7 0 Z" fill="#FDE68A" opacity="0.8" />
                <path d="M95 -5 L97 0 L102 0 L99 3 L100 8 L95 5 L90 8 L91 3 L88 0 L93 0 Z" fill="#FDE68A" opacity="0.8" />
              </g>
            </g>
          </>
        );
      
      case 'thinking':
        return (
          <>
            {/* Left arm (resting at side) */}
            <g transform="translate(35, 100)">
              <ellipse cx="15" cy="25" rx="12" ry="15" fill="#8B5CF6" />
              <ellipse cx="15" cy="22" rx="9" ry="11" fill="#A78BFA" />
              <circle cx="12" cy="40" r="9" fill="#A78BFA" />
              <circle cx="12" cy="40" r="6" fill="#C4B5FD" opacity="0.5" />
            </g>
            
            {/* Right arm (hand on chin, thinking pose) */}
            <g transform="translate(135, 80)">
              <ellipse cx="15" cy="35" rx="12" ry="15" fill="#8B5CF6" />
              <ellipse cx="15" cy="32" rx="9" ry="11" fill="#A78BFA" />
              {/* Arm bent up */}
              <ellipse cx="5" cy="15" rx="10" ry="13" fill="#A78BFA" transform="rotate(25 5 15)" />
              <ellipse cx="5" cy="15" rx="7" ry="9" fill="#C4B5FD" opacity="0.5" transform="rotate(25 5 15)" />
              {/* Hand on chin */}
              <circle cx="-8" cy="0" r="10" fill="#A78BFA" />
              <circle cx="-8" cy="0" r="7" fill="#C4B5FD" opacity="0.5" />
            </g>
            
            {/* Thought bubbles */}
            <g opacity="0.7">
              <circle cx="165" cy="50" r="5" fill="#DDD6FE" />
              <circle cx="172" cy="38" r="7" fill="#EDE9FE" />
              <ellipse cx="178" cy="22" rx="12" ry="10" fill="#F5F3FF" stroke="#DDD6FE" strokeWidth="1" />
              {/* Light bulb in thought */}
              <g transform="translate(170, 14)">
                <ellipse cx="8" cy="8" rx="6" ry="7" fill="#FDE68A" />
                <rect x="6" y="14" width="4" height="3" fill="#9CA3AF" />
                <path d="M5 11 Q8 13 11 11" stroke="#F59E0B" strokeWidth="1" fill="none" />
              </g>
            </g>
            
            {/* Magic sparkles around */}
            <g filter={`url(#sparkleGlow-${uniqueId})`} opacity="0.8">
              <path d="M35 60 L37 65 L42 65 L38 68 L40 73 L35 70 L30 73 L32 68 L28 65 L33 65 Z" fill="#C4B5FD" />
              <circle cx="25" cy="85" r="3" fill="#DDD6FE" />
              <circle cx="175" cy="75" r="2.5" fill="#FDE68A" />
            </g>
          </>
        );
      
      case 'analyzing':
        return (
          <>
            {/* Left arm (holding clipboard - lowered so face/glasses stay visible) */}
            <g transform="translate(25, 105)">
              <ellipse cx="18" cy="28" rx="12" ry="15" fill="#8B5CF6" />
              <ellipse cx="18" cy="25" rx="9" ry="11" fill="#A78BFA" />
              {/* Hand supporting clipboard */}
              <circle cx="30" cy="15" r="10" fill="#A78BFA" />
              <circle cx="30" cy="15" r="7" fill="#C4B5FD" opacity="0.5" />
            </g>
            
            {/* Right arm (pointing at clipboard) */}
            <g transform="translate(130, 110)">
              <ellipse cx="8" cy="28" rx="12" ry="15" fill="#8B5CF6" />
              <ellipse cx="8" cy="25" rx="9" ry="11" fill="#A78BFA" />
              {/* Hand pointing */}
              <circle cx="-5" cy="10" r="10" fill="#A78BFA" />
              <circle cx="-5" cy="10" r="7" fill="#C4B5FD" opacity="0.5" />
              {/* Pointing finger */}
              <ellipse cx="-18" cy="5" rx="8" ry="4" fill="#A78BFA" transform="rotate(-15 -18 5)" />
            </g>
            
            {/* Clipboard - lowered below face so glasses are clearly visible */}
            <g transform="translate(50, 125)">
              {/* Clipboard back */}
              <rect x="5" y="0" width="90" height="50" rx="4" fill="#8B5CF6" />
              {/* Clipboard clip */}
              <rect x="35" y="-5" width="30" height="10" rx="2" fill="#6D28D9" />
              <rect x="40" y="-3" width="20" height="6" rx="1" fill="#9CA3AF" />
              {/* Paper */}
              <rect x="10" y="5" width="80" height="40" rx="2" fill="#FAFAF9" stroke="#E7E5E4" strokeWidth="1" />
              {/* Analysis lines / chart */}
              <g opacity="0.6">
                <rect x="15" y="10" width="30" height="3" rx="1" fill="#8B5CF6" />
                <rect x="15" y="16" width="45" height="3" rx="1" fill="#A78BFA" />
                <rect x="15" y="22" width="35" height="3" rx="1" fill="#8B5CF6" />
                {/* Mini bar chart */}
                <rect x="60" y="28" width="6" height="12" rx="1" fill="#22C55E" />
                <rect x="68" y="24" width="6" height="16" rx="1" fill="#8B5CF6" />
                <rect x="76" y="31" width="6" height="9" rx="1" fill="#F59E0B" />
              </g>
              {/* Checkmarks */}
              <g stroke="#22C55E" strokeWidth="2" strokeLinecap="round" fill="none">
                <path d="M52 11 L54 13 L58 9" />
                <path d="M52 17 L54 19 L58 15" />
              </g>
            </g>
            
            {/* Floating analysis icons */}
            <g filter={`url(#sparkleGlow-${uniqueId})`} opacity="0.8">
              {/* Magnifying glass */}
              <g transform="translate(160, 50)">
                <circle cx="8" cy="8" r="7" fill="none" stroke="#C4B5FD" strokeWidth="2" />
                <line x1="13" y1="13" x2="18" y2="18" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" />
              </g>
              {/* Checkmark badge */}
              <g transform="translate(30, 55)">
                <circle cx="8" cy="8" r="8" fill="#DDD6FE" />
                <path d="M5 8 L7 10 L11 6" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" fill="none" />
              </g>
            </g>
          </>
        );
      
      default:
        return (
          <>
            {/* Left arm (thumbs up) */}
            <g transform="translate(35, 100)">
              <ellipse cx="15" cy="25" rx="12" ry="15" fill="#8B5CF6" />
              <ellipse cx="15" cy="22" rx="9" ry="11" fill="#A78BFA" />
              <circle cx="12" cy="10" r="10" fill="#A78BFA" />
              <circle cx="12" cy="10" r="7" fill="#C4B5FD" opacity="0.5" />
              <ellipse cx="5" cy="2" rx="5" ry="8" fill="#A78BFA" transform="rotate(-30 5 2)" />
              <ellipse cx="5" cy="0" rx="3" ry="5" fill="#C4B5FD" transform="rotate(-30 5 0)" opacity="0.5" />
            </g>
            
            {/* Right arm (holding pencil) */}
            <g transform="translate(140, 95)">
              <ellipse cx="10" cy="28" rx="12" ry="15" fill="#8B5CF6" />
              <ellipse cx="10" cy="25" rx="9" ry="11" fill="#A78BFA" />
              <circle cx="15" cy="12" r="10" fill="#A78BFA" />
              <circle cx="15" cy="12" r="7" fill="#C4B5FD" opacity="0.5" />
              <g transform="translate(20, -15) rotate(35)">
                <rect x="0" y="0" width="8" height="45" rx="2" fill={`url(#pencilGradient-${uniqueId})`} />
                <rect x="0" y="5" width="8" height="35" fill="#F59E0B" />
                <rect x="2" y="5" width="4" height="35" fill="#FBBF24" />
                <polygon points="0,45 4,55 8,45" fill="#FDE68A" />
                <polygon points="2,45 4,52 6,45" fill="#92400E" />
                <rect x="0" y="0" width="8" height="6" rx="1" fill="#F472B6" />
                <rect x="1" y="1" width="6" height="2" rx="0.5" fill="#F9A8D4" opacity="0.5" />
                <rect x="0" y="5" width="8" height="4" fill="#9CA3AF" />
                <rect x="0" y="5" width="8" height="1" fill="#D1D5DB" />
                <circle cx="4" cy="56" r="4" fill="#FDE68A" opacity="0.6" filter={`url(#sparkleGlow-${uniqueId})`} />
              </g>
            </g>
          </>
        );
    }
  };

  const renderEyes = () => {
    const baseEyes = (
      <>
        {/* Left eye white */}
        <ellipse cx="82" cy="108" rx="16" ry="18" fill="white" />
        {/* Right eye white */}
        <ellipse cx="118" cy="108" rx="16" ry="18" fill="white" />
      </>
    );

    switch (pose) {
      case 'waving':
        return (
          <g>
            {baseEyes}
            {/* Left eye - happy squint */}
            <path d="M72 108 Q82 100 92 108" stroke="#1F2937" strokeWidth="4" strokeLinecap="round" fill="none" />
            {/* Right eye pupil - looking at viewer */}
            <ellipse cx="118" cy="110" rx="8" ry="10" fill="#1F2937" />
            <circle cx="113" cy="104" r="5" fill="white" opacity="0.9" />
            <circle cx="121" cy="114" r="2.5" fill="white" opacity="0.5" />
          </g>
        );
      
      case 'celebrating':
        return (
          <g>
            {baseEyes}
            {/* Both eyes - happy closed */}
            <path d="M72 108 Q82 100 92 108" stroke="#1F2937" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M108 108 Q118 100 128 108" stroke="#1F2937" strokeWidth="4" strokeLinecap="round" fill="none" />
          </g>
        );
      
      case 'studying':
        return (
          <g>
            {baseEyes}
            {/* Both eyes looking down at book */}
            <ellipse cx="84" cy="112" rx="8" ry="10" fill="#1F2937" />
            <circle cx="79" cy="108" r="5" fill="white" opacity="0.9" />
            <circle cx="87" cy="116" r="2.5" fill="white" opacity="0.5" />
            <ellipse cx="120" cy="112" rx="8" ry="10" fill="#1F2937" />
            <circle cx="115" cy="108" r="5" fill="white" opacity="0.9" />
            <circle cx="123" cy="116" r="2.5" fill="white" opacity="0.5" />
          </g>
        );
      
      case 'thinking':
        return (
          <g>
            {baseEyes}
            {/* Eyes looking up and to the side (thinking) */}
            <ellipse cx="86" cy="105" rx="8" ry="10" fill="#1F2937" />
            <circle cx="82" cy="100" r="5" fill="white" opacity="0.9" />
            <circle cx="89" cy="109" r="2.5" fill="white" opacity="0.5" />
            <ellipse cx="122" cy="105" rx="8" ry="10" fill="#1F2937" />
            <circle cx="118" cy="100" r="5" fill="white" opacity="0.9" />
            <circle cx="125" cy="109" r="2.5" fill="white" opacity="0.5" />
          </g>
        );
      
      case 'analyzing':
        return (
          <g>
            {baseEyes}
            {/* Eyes looking down at clipboard - focused */}
            <ellipse cx="84" cy="112" rx="8" ry="10" fill="#1F2937" />
            <circle cx="80" cy="108" r="5" fill="white" opacity="0.9" />
            <circle cx="87" cy="116" r="2.5" fill="white" opacity="0.5" />
            <ellipse cx="120" cy="112" rx="8" ry="10" fill="#1F2937" />
            <circle cx="116" cy="108" r="5" fill="white" opacity="0.9" />
            <circle cx="123" cy="116" r="2.5" fill="white" opacity="0.5" />
            {/* Glasses frame */}
            <g fill="none" stroke="#374151" strokeWidth="2.5">
              {/* Left lens */}
              <ellipse cx="82" cy="108" rx="18" ry="16" />
              {/* Right lens */}
              <ellipse cx="118" cy="108" rx="18" ry="16" />
              {/* Bridge */}
              <path d="M100 108 Q100 105 100 108" />
              <line x1="100" y1="106" x2="100" y2="110" />
              {/* Temple arms (sides) */}
              <path d="M64 106 L55 100" strokeLinecap="round" />
              <path d="M136 106 L145 100" strokeLinecap="round" />
            </g>
            {/* Lens shine */}
            <ellipse cx="75" cy="102" rx="4" ry="3" fill="white" opacity="0.3" />
            <ellipse cx="111" cy="102" rx="4" ry="3" fill="white" opacity="0.3" />
          </g>
        );
      
      default:
        return (
          <g>
            {baseEyes}
            {/* Left eye pupil */}
            <ellipse cx="84" cy="110" rx="8" ry="10" fill="#1F2937" />
            <circle cx="79" cy="104" r="5" fill="white" opacity="0.9" />
            <circle cx="87" cy="114" r="2.5" fill="white" opacity="0.5" />
            {/* Right eye pupil */}
            <ellipse cx="120" cy="110" rx="8" ry="10" fill="#1F2937" />
            <circle cx="115" cy="104" r="5" fill="white" opacity="0.9" />
            <circle cx="123" cy="114" r="2.5" fill="white" opacity="0.5" />
          </g>
        );
    }
  };

  const renderMouth = () => {
    switch (pose) {
      case 'celebrating':
        return (
          <g>
            {/* Big open smile */}
            <path d="M75 130 Q100 160 125 130" fill="#5B21B6" />
            <ellipse cx="100" cy="145" rx="14" ry="8" fill="#F472B6" />
            <ellipse cx="100" cy="142" rx="8" ry="4" fill="#F9A8D4" opacity="0.6" />
            <path d="M82 130 L85 138 L88 130" fill="white" />
            <path d="M112 130 L115 138 L118 130" fill="white" />
          </g>
        );
      
      default:
        return (
          <g>
            <path d="M80 132 Q100 150 120 132" fill="#5B21B6" />
            <ellipse cx="100" cy="140" rx="10" ry="6" fill="#F472B6" />
            <ellipse cx="100" cy="138" rx="6" ry="3" fill="#F9A8D4" opacity="0.6" />
            <path d="M85 132 L88 140 L91 132" fill="white" />
            <path d="M109 132 L112 140 L115 132" fill="white" />
          </g>
        );
    }
  };
  
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
          <linearGradient id={`bodyGradient-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#6D28D9" />
          </linearGradient>
          
          {/* Body highlight gradient */}
          <linearGradient id={`bodyHighlight-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </linearGradient>
          
          {/* Ambient glow */}
          <radialGradient id={`ambientGlow-${uniqueId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
            <stop offset="70%" stopColor="#8B5CF6" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </radialGradient>
          
          {/* Pencil gradient */}
          <linearGradient id={`pencilGradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          
          {/* Cap gradient */}
          <linearGradient id={`capGradient-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="100%" stopColor="#1F2937" />
          </linearGradient>
          
          {/* Shadow filter */}
          <filter id={`softShadow-${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#6D28D9" floodOpacity="0.3" />
          </filter>
          
          {/* Glow filter for sparkles */}
          <filter id={`sparkleGlow-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Ambient glow background */}
        <circle cx="100" cy="105" r="85" fill={`url(#ambientGlow-${uniqueId})`} />
        
        {/* Floating sparkles */}
        <g className={animated ? 'animate-[sparkle-pulse_2s_ease-in-out_infinite]' : ''} filter={`url(#sparkleGlow-${uniqueId})`}>
          <path d="M35 45 L37 50 L42 50 L38 53 L40 58 L35 55 L30 58 L32 53 L28 50 L33 50 Z" fill="#C4B5FD" opacity="0.8" />
          <path d="M165 55 L166.5 58.5 L170 59 L167 61 L168 65 L165 62.5 L162 65 L163 61 L160 59 L163.5 58.5 Z" fill="#DDD6FE" opacity="0.7" />
          <path d="M155 130 L156 133 L159 133 L156.5 135 L157.5 138 L155 136 L152.5 138 L153.5 135 L151 133 L154 133 Z" fill="#C4B5FD" opacity="0.6" />
          <circle cx="45" cy="140" r="3" fill="#DDD6FE" opacity="0.5" />
          <circle cx="160" cy="85" r="2.5" fill="#EDE9FE" opacity="0.6" />
        </g>
        
        {/* Floating books - only show on default pose */}
        {pose === 'default' && (
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
        )}
        
        {/* Main body with shadow */}
        <g filter={`url(#softShadow-${uniqueId})`}>
          {/* Body - rounded cube shape */}
          <rect x="55" y="65" width="90" height="95" rx="24" fill={`url(#bodyGradient-${uniqueId})`} />
          
          {/* Body highlight overlay */}
          <rect x="55" y="65" width="90" height="95" rx="24" fill={`url(#bodyHighlight-${uniqueId})`} />
          
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
          <polygon points="0,8 25,0 50,8 25,16" fill={`url(#capGradient-${uniqueId})`} />
          {/* Cap top */}
          <rect x="15" y="8" width="20" height="12" rx="2" fill="#1F2937" />
          {/* Button on top */}
          <circle cx="25" cy="8" r="3" fill="#374151" />
          {/* Tassel */}
          <line x1="50" y1="8" x2="58" y2="20" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          <circle cx="58" cy="22" r="3" fill="#F59E0B" />
        </g>
        
        {/* Eyebrows - vary by pose */}
        {pose === 'celebrating' ? (
          <>
            <path d="M72 90 Q80 84 88 90" stroke="#5B21B6" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M112 90 Q120 84 128 90" stroke="#5B21B6" strokeWidth="3" strokeLinecap="round" fill="none" />
          </>
        ) : (
          <>
            <path d="M72 92 Q80 88 88 92" stroke="#5B21B6" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M112 92 Q120 88 128 92" stroke="#5B21B6" strokeWidth="3" strokeLinecap="round" fill="none" />
          </>
        )}
        
        {/* Eyes */}
        {renderEyes()}
        
        {/* Mouth */}
        {renderMouth()}
        
        {/* Arms */}
        {renderArms()}
        
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
