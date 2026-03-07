interface BadgeCreatureProps {
  badgeId: string;
  unlocked: boolean;
  size?: number;
}

const BadgeCreature = ({ badgeId, unlocked, size = 80 }: BadgeCreatureProps) => {
  const filter = unlocked ? undefined : 'grayscale(100%) opacity(0.4)';
  const animClass = unlocked ? 'animate-[creature-float_3s_ease-in-out_infinite]' : '';

  return (
    <div
      className={`relative ${animClass}`}
      style={{ width: size, height: size, filter }}
    >
      <svg viewBox="0 0 80 80" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
        {getCreatureSVG(badgeId, unlocked)}
      </svg>
    </div>
  );
};

function getCreatureSVG(id: string, alive: boolean) {
  const bounce = alive ? 'animate-[creature-bounce_2s_ease-in-out_infinite]' : '';
  const pulse = alive ? 'animate-[creature-pulse_2.5s_ease-in-out_infinite]' : '';
  const wiggle = alive ? 'animate-[creature-wiggle_3s_ease-in-out_infinite]' : '';
  const _ = { bounce, pulse, wiggle }; // suppress unused warnings
  void _;

  switch (id) {
    // 1. Blobby - teal blob
    case 'first_steps':
      return (
        <g>
          <circle cx="40" cy="42" r="24" fill="#06B6D4" opacity="0.15" />
          <ellipse cx="40" cy="44" rx="20" ry="18" fill="#06B6D4" />
          <ellipse cx="40" cy="44" rx="20" ry="18" fill="url(#g1)" />
          <circle cx="40" cy="28" r="4" fill="#06B6D4" />
          <circle cx="48" cy="30" r="3" fill="#0891B2" />
          <circle cx="33" cy="40" r="4" fill="white" />
          <circle cx="47" cy="40" r="4" fill="white" />
          <circle cx="34" cy="39" r="2" fill="#164E63" />
          <circle cx="48" cy="39" r="2" fill="#164E63" />
          {alive && <circle cx="34.5" cy="38.5" r="0.8" fill="white" />}
          {alive && <circle cx="48.5" cy="38.5" r="0.8" fill="white" />}
          <path d="M36 49 Q40 53 44 49" stroke="#164E63" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <ellipse cx="28" cy="46" rx="3" ry="2" fill="#22D3EE" opacity="0.5" />
          <ellipse cx="52" cy="46" rx="3" ry="2" fill="#22D3EE" opacity="0.5" />
          <defs><radialGradient id="g1" cx="40%" cy="30%"><stop offset="0%" stopColor="white" stopOpacity="0.3" /><stop offset="100%" stopColor="white" stopOpacity="0" /></radialGradient></defs>
        </g>
      );

    // 2. Sparky - electric yellow star creature
    case 'brain_spark':
      return (
        <g>
          <circle cx="40" cy="40" r="24" fill="#F59E0B" opacity="0.12" />
          <polygon points="40,16 46,32 62,32 49,42 54,58 40,48 26,58 31,42 18,32 34,32" fill="#F59E0B" />
          <polygon points="40,16 46,32 62,32 49,42 54,58 40,48 26,58 31,42 18,32 34,32" fill="url(#g2)" />
          <circle cx="35" cy="38" r="3.5" fill="white" />
          <circle cx="45" cy="38" r="3.5" fill="white" />
          <circle cx="36" cy="37" r="1.8" fill="#78350F" />
          <circle cx="46" cy="37" r="1.8" fill="#78350F" />
          {alive && <circle cx="36.5" cy="36.5" r="0.7" fill="white" />}
          {alive && <circle cx="46.5" cy="36.5" r="0.7" fill="white" />}
          <path d="M37 44 Q40 47 43 44" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M28 22 L24 16 M52 22 L56 16" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
          <defs><radialGradient id="g2" cx="40%" cy="30%"><stop offset="0%" stopColor="white" stopOpacity="0.35" /><stop offset="100%" stopColor="white" stopOpacity="0" /></radialGradient></defs>
        </g>
      );

    // 3. Mystiq - purple wizard teardrop
    case 'word_wizard':
      return (
        <g>
          <circle cx="40" cy="42" r="24" fill="#8B5CF6" opacity="0.12" />
          <path d="M40 18 C28 30 24 42 24 50 Q24 62 40 62 Q56 62 56 50 C56 42 52 30 40 18Z" fill="#8B5CF6" />
          <path d="M40 18 C28 30 24 42 24 50 Q24 62 40 62 Q56 62 56 50 C56 42 52 30 40 18Z" fill="url(#g3)" />
          <polygon points="40,8 44,22 36,22" fill="#6D28D9" />
          <circle cx="40" cy="15" r="2" fill="#DDD6FE" />
          <circle cx="34" cy="44" r="3.5" fill="white" />
          <circle cx="46" cy="44" r="3.5" fill="white" />
          <circle cx="35" cy="43" r="1.8" fill="#4C1D95" />
          <circle cx="47" cy="43" r="1.8" fill="#4C1D95" />
          {alive && <>
            <circle cx="24" cy="30" r="1.5" fill="#DDD6FE" opacity="0.8" />
            <circle cx="56" cy="26" r="1" fill="#DDD6FE" opacity="0.6" />
            <circle cx="20" cy="48" r="1.2" fill="#C4B5FD" opacity="0.7" />
          </>}
          <path d="M37 52 Q40 55 43 52" stroke="#4C1D95" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <defs><radialGradient id="g3" cx="45%" cy="35%"><stop offset="0%" stopColor="white" stopOpacity="0.3" /><stop offset="100%" stopColor="white" stopOpacity="0" /></radialGradient></defs>
        </g>
      );

    // 4. Flashy - gold diamond creature
    case 'flash_master':
      return (
        <g>
          <circle cx="40" cy="40" r="24" fill="#EAB308" opacity="0.12" />
          <rect x="22" y="22" width="36" height="36" rx="6" fill="#EAB308" transform="rotate(45 40 40)" />
          <rect x="22" y="22" width="36" height="36" rx="6" fill="url(#g4)" transform="rotate(45 40 40)" />
          <ellipse cx="35" cy="38" rx="3" ry="2" fill="white" />
          <ellipse cx="45" cy="38" rx="3" ry="2" fill="white" />
          <ellipse cx="35.5" cy="38" rx="1.5" ry="1.8" fill="#713F12" />
          <ellipse cx="45.5" cy="38" rx="1.5" ry="1.8" fill="#713F12" />
          <path d="M37 45 Q40 48 43 45" stroke="#713F12" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          <path d="M30 18 L27 10 L33 14Z" fill="#CA8A04" />
          <path d="M50 18 L53 10 L47 14Z" fill="#CA8A04" />
          {alive && <path d="M18 40 L14 38 M62 40 L66 38" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />}
          <defs><radialGradient id="g4" cx="40%" cy="30%"><stop offset="0%" stopColor="white" stopOpacity="0.35" /><stop offset="100%" stopColor="white" stopOpacity="0" /></radialGradient></defs>
        </g>
      );

    // 5. Hootsworth - brown owl
    case 'quiz_whiz':
      return (
        <g>
          <circle cx="40" cy="42" r="24" fill="#92400E" opacity="0.1" />
          <ellipse cx="40" cy="46" rx="22" ry="20" fill="#D97706" />
          <ellipse cx="40" cy="46" rx="22" ry="20" fill="url(#g5)" />
          <ellipse cx="40" cy="50" rx="14" ry="10" fill="#FDE68A" />
          <circle cx="33" cy="40" r="7" fill="white" />
          <circle cx="47" cy="40" r="7" fill="white" />
          <circle cx="33" cy="40" r="4" fill="#451A03" />
          <circle cx="47" cy="40" r="4" fill="#451A03" />
          {alive && <circle cx="34.5" cy="38.5" r="1.5" fill="white" />}
          {alive && <circle cx="48.5" cy="38.5" r="1.5" fill="white" />}
          <polygon points="40,46 37,50 43,50" fill="#92400E" />
          <path d="M22 32 L28 38 M58 32 L52 38" stroke="#B45309" strokeWidth="2.5" strokeLinecap="round" />
          <defs><radialGradient id="g5" cx="40%" cy="30%"><stop offset="0%" stopColor="white" stopOpacity="0.25" /><stop offset="100%" stopColor="white" stopOpacity="0" /></radialGradient></defs>
        </g>
      );

    // 6. Snoop - navy detective
    case 'citation_hunter':
      return (
        <g>
          <circle cx="40" cy="42" r="24" fill="#1E3A5F" opacity="0.1" />
          <circle cx="40" cy="46" r="20" fill="#1E40AF" />
          <circle cx="40" cy="46" r="20" fill="url(#g6)" />
          <rect x="26" y="24" width="28" height="8" rx="4" fill="#1E3A8A" />
          <rect x="30" y="20" width="20" height="8" rx="2" fill="#1E3A8A" />
          <circle cx="34" cy="44" r="4" fill="white" />
          <circle cx="34" cy="44" r="2" fill="#0F172A" />
          <circle cx="48" cy="44" r="6" fill="white" stroke="#1E3A8A" strokeWidth="1.5" />
          <circle cx="48" cy="44" r="3" fill="#0F172A" />
          <line x1="53" y1="49" x2="58" y2="56" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" />
          {alive && <circle cx="35" cy="43" r="1" fill="white" />}
          <path d="M37 54 Q40 57 43 54" stroke="#0F172A" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          <defs><radialGradient id="g6" cx="40%" cy="35%"><stop offset="0%" stopColor="white" stopOpacity="0.2" /><stop offset="100%" stopColor="white" stopOpacity="0" /></radialGradient></defs>
        </g>
      );

    // 7. Scrollie - teal scroll serpent
    case 'summary_sage':
      return (
        <g>
          <circle cx="40" cy="40" r="24" fill="#14B8A6" opacity="0.1" />
          <path d="M20 40 C20 28 30 22 40 22 C50 22 56 28 56 36 C56 44 48 48 40 48 C32 48 28 52 28 56" stroke="#14B8A6" strokeWidth="10" strokeLinecap="round" fill="none" />
          <path d="M20 40 C20 28 30 22 40 22 C50 22 56 28 56 36 C56 44 48 48 40 48 C32 48 28 52 28 56" stroke="url(#g7s)" strokeWidth="10" strokeLinecap="round" fill="none" />
          <circle cx="25" cy="38" r="3.5" fill="white" />
          <circle cx="25" cy="38" r="1.8" fill="#134E4A" />
          {alive && <circle cx="25.8" cy="37.2" r="0.7" fill="white" />}
          <circle cx="16" cy="38" r="2" fill="#14B8A6" />
          <circle cx="14" cy="34" r="1.5" fill="#0D9488" />
          <path d="M22 44 Q25 46 22 48" stroke="#134E4A" strokeWidth="1" strokeLinecap="round" fill="none" />
          <defs><linearGradient id="g7s" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="white" stopOpacity="0.3" /><stop offset="100%" stopColor="white" stopOpacity="0" /></linearGradient></defs>
        </g>
      );

    // 8. Puzzler - orange puzzle creature
    case 'puzzle_pro':
      return (
        <g>
          <circle cx="40" cy="40" r="24" fill="#F97316" opacity="0.12" />
          <path d="M24 28 h10 v-4 a4 4 0 018 0 v4 h10 v10 h4 a4 4 0 010 8 h-4 v10 h-10 v4 a4 4 0 01-8 0 v-4 h-10 v-10 h-4 a4 4 0 010-8 h4 Z" fill="#F97316" />
          <path d="M24 28 h10 v-4 a4 4 0 018 0 v4 h10 v10 h4 a4 4 0 010 8 h-4 v10 h-10 v4 a4 4 0 01-8 0 v-4 h-10 v-10 h-4 a4 4 0 010-8 h4 Z" fill="url(#g8)" />
          <circle cx="35" cy="40" r="3" fill="white" />
          <circle cx="45" cy="40" r="3" fill="white" />
          <circle cx="35" cy="40" r="1.5" fill="#7C2D12" />
          <circle cx="45" cy="40" r="1.5" fill="#7C2D12" />
          <path d="M35 48 Q40 52 45 48" stroke="#7C2D12" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          {alive && <>
            <circle cx="35.5" cy="39" r="0.8" fill="white" />
            <circle cx="45.5" cy="39" r="0.8" fill="white" />
          </>}
          <defs><radialGradient id="g8" cx="40%" cy="30%"><stop offset="0%" stopColor="white" stopOpacity="0.3" /><stop offset="100%" stopColor="white" stopOpacity="0" /></radialGradient></defs>
        </g>
      );

    // 9. Emberly - small fire sprite
    case 'streak_starter':
      return (
        <g>
          <circle cx="40" cy="42" r="22" fill="#EF4444" opacity="0.1" />
          <path d="M40 14 C44 24 54 28 54 42 C54 52 48 60 40 60 C32 60 26 52 26 42 C26 28 36 24 40 14Z" fill="#EF4444" />
          <path d="M40 14 C44 24 54 28 54 42 C54 52 48 60 40 60 C32 60 26 52 26 42 C26 28 36 24 40 14Z" fill="url(#g9)" />
          <path d="M40 30 C42 36 46 38 46 46 C46 50 43 54 40 54 C37 54 34 50 34 46 C34 38 38 36 40 30Z" fill="#FBBF24" />
          <circle cx="36" cy="44" r="3" fill="white" />
          <circle cx="44" cy="44" r="3" fill="white" />
          <circle cx="36.5" cy="43.5" r="1.5" fill="#7F1D1D" />
          <circle cx="44.5" cy="43.5" r="1.5" fill="#7F1D1D" />
          {alive && <circle cx="37" cy="43" r="0.6" fill="white" />}
          <path d="M38 51 Q40 53 42 51" stroke="#7F1D1D" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <defs><radialGradient id="g9" cx="50%" cy="40%"><stop offset="0%" stopColor="#FCA5A5" stopOpacity="0.4" /><stop offset="100%" stopColor="white" stopOpacity="0" /></radialGradient></defs>
        </g>
      );

    // 10. Blazer - fierce fire dragon
    case 'streak_warrior':
      return (
        <g>
          <circle cx="40" cy="40" r="26" fill="#DC2626" opacity="0.12" />
          <path d="M40 10 C46 22 58 26 58 42 C58 54 50 64 40 64 C30 64 22 54 22 42 C22 26 34 22 40 10Z" fill="#DC2626" />
          <path d="M40 10 C46 22 58 26 58 42 C58 54 50 64 40 64 C30 64 22 54 22 42 C22 26 34 22 40 10Z" fill="url(#g10)" />
          <path d="M40 26 C43 34 50 36 50 46 C50 52 46 58 40 58 C34 58 30 52 30 46 C30 36 37 34 40 26Z" fill="#F59E0B" />
          <path d="M18 30 L14 24 M22 24 L18 18" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
          <path d="M62 30 L66 24 M58 24 L62 18" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
          <circle cx="34" cy="42" r="3.5" fill="white" />
          <circle cx="46" cy="42" r="3.5" fill="white" />
          <ellipse cx="34.5" cy="42" rx="2" ry="2.5" fill="#7F1D1D" />
          <ellipse cx="46.5" cy="42" rx="2" ry="2.5" fill="#7F1D1D" />
          <path d="M36 52 L40 50 L44 52" stroke="#7F1D1D" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <defs><radialGradient id="g10" cx="50%" cy="35%"><stop offset="0%" stopColor="#FCA5A5" stopOpacity="0.3" /><stop offset="100%" stopColor="white" stopOpacity="0" /></radialGradient></defs>
        </g>
      );

    // 11. Phoenix - legendary fire bird
    case 'streak_legend':
      return (
        <g>
          <circle cx="40" cy="40" r="28" fill="#D97706" opacity="0.15" />
          <path d="M40 14 L46 28 L60 22 L52 36 L66 38 L52 44 L58 58 L40 50 L22 58 L28 44 L14 38 L28 36 L20 22 L34 28Z" fill="#D97706" />
          <path d="M40 14 L46 28 L60 22 L52 36 L66 38 L52 44 L58 58 L40 50 L22 58 L28 44 L14 38 L28 36 L20 22 L34 28Z" fill="url(#g11)" />
          <circle cx="40" cy="38" r="12" fill="#F59E0B" />
          <circle cx="36" cy="36" r="3" fill="white" />
          <circle cx="44" cy="36" r="3" fill="white" />
          <circle cx="36.5" cy="35.5" r="1.5" fill="#78350F" />
          <circle cx="44.5" cy="35.5" r="1.5" fill="#78350F" />
          {alive && <circle cx="37" cy="35" r="0.7" fill="white" />}
          <polygon points="40,40 38,44 42,44" fill="#92400E" />
          <path d="M36 46 Q40 49 44 46" stroke="#78350F" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          {alive && <>
            <circle cx="16" cy="30" r="1.5" fill="#FBBF24" opacity="0.8" />
            <circle cx="64" cy="30" r="1.2" fill="#FBBF24" opacity="0.7" />
            <circle cx="40" cy="10" r="1" fill="#FDE68A" opacity="0.9" />
          </>}
          <defs><radialGradient id="g11" cx="50%" cy="40%"><stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.5" /><stop offset="100%" stopColor="white" stopOpacity="0" /></radialGradient></defs>
        </g>
      );

    // 12. Champ - gold trophy creature
    case 'quiz_champion':
      return (
        <g>
          <circle cx="40" cy="42" r="24" fill="#CA8A04" opacity="0.1" />
          <circle cx="40" cy="46" r="18" fill="#EAB308" />
          <circle cx="40" cy="46" r="18" fill="url(#g12)" />
          <rect x="32" y="16" width="16" height="12" rx="3" fill="#CA8A04" />
          <polygon points="36,16 40,10 44,16" fill="#CA8A04" />
          <circle cx="40" cy="22" r="2" fill="#FDE68A" />
          <circle cx="34" cy="42" r="3.5" fill="white" />
          <circle cx="46" cy="42" r="3.5" fill="white" />
          <circle cx="34.5" cy="41.5" r="1.8" fill="#713F12" />
          <circle cx="46.5" cy="41.5" r="1.8" fill="#713F12" />
          <path d="M36 52 Q40 56 44 52" stroke="#713F12" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M20 42 L24 46 M60 42 L56 46" stroke="#EAB308" strokeWidth="3" strokeLinecap="round" />
          <defs><radialGradient id="g12" cx="40%" cy="30%"><stop offset="0%" stopColor="white" stopOpacity="0.35" /><stop offset="100%" stopColor="white" stopOpacity="0" /></radialGradient></defs>
        </g>
      );

    // 13. Shredz - green munching monster
    case 'paper_shredder':
      return (
        <g>
          <circle cx="40" cy="40" r="24" fill="#22C55E" opacity="0.1" />
          <rect x="20" y="26" width="40" height="34" rx="12" fill="#22C55E" />
          <rect x="20" y="26" width="40" height="34" rx="12" fill="url(#g13)" />
          <circle cx="32" cy="38" r="4" fill="white" />
          <circle cx="48" cy="38" r="4" fill="white" />
          <circle cx="32.5" cy="37.5" r="2" fill="#14532D" />
          <circle cx="48.5" cy="37.5" r="2" fill="#14532D" />
          <path d="M28 50 L32 46 L36 50 L40 46 L44 50 L48 46 L52 50" stroke="#14532D" strokeWidth="2" strokeLinecap="round" fill="none" />
          <polygon points="33,50 35,54 31,54" fill="white" />
          <polygon points="40,46 42,50 38,50" fill="white" />
          <polygon points="47,50 49,54 45,54" fill="white" />
          {alive && <>
            <rect x="16" y="34" width="6" height="4" rx="1" fill="#BBF7D0" opacity="0.6" transform="rotate(-15 19 36)" />
            <rect x="58" y="30" width="5" height="3" rx="1" fill="#BBF7D0" opacity="0.5" transform="rotate(20 60 31)" />
          </>}
          <defs><radialGradient id="g13" cx="40%" cy="30%"><stop offset="0%" stopColor="white" stopOpacity="0.25" /><stop offset="100%" stopColor="white" stopOpacity="0" /></radialGradient></defs>
        </g>
      );

    // 14. Flippy - violet card cat
    case 'flashcard_fiend':
      return (
        <g>
          <circle cx="40" cy="42" r="24" fill="#A855F7" opacity="0.1" />
          <ellipse cx="40" cy="46" rx="18" ry="16" fill="#A855F7" />
          <ellipse cx="40" cy="46" rx="18" ry="16" fill="url(#g14)" />
          <polygon points="28,30 24,18 32,28" fill="#9333EA" />
          <polygon points="52,30 56,18 48,28" fill="#9333EA" />
          <circle cx="34" cy="42" r="4" fill="white" />
          <circle cx="46" cy="42" r="4" fill="white" />
          <circle cx="34.5" cy="41.5" r="2" fill="#581C87" />
          <ellipse cx="46" cy="42" rx="2" ry="0.8" fill="#581C87" />
          {alive && <circle cx="35" cy="41" r="0.8" fill="white" />}
          <path d="M37 50 Q40 53 43 50" stroke="#581C87" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          <path d="M54 36 Q62 42 54 48" stroke="#C084FC" strokeWidth="2" strokeLinecap="round" fill="none" />
          {alive && <rect x="60" y="36" width="8" height="10" rx="1.5" fill="#DDD6FE" stroke="#A855F7" strokeWidth="1" transform="rotate(10 64 41)" />}
          <defs><radialGradient id="g14" cx="40%" cy="30%"><stop offset="0%" stopColor="white" stopOpacity="0.3" /><stop offset="100%" stopColor="white" stopOpacity="0" /></radialGradient></defs>
        </g>
      );

    // 15. Morpher - teal shape-shifter
    case 'humanize_hero':
      return (
        <g>
          <circle cx="40" cy="40" r="24" fill="#0D9488" opacity="0.1" />
          <path d="M40 18 C52 20 62 28 60 42 C58 56 50 62 40 64 C30 62 20 56 22 42 C24 28 28 20 40 18Z" fill="#0D9488" />
          <path d="M40 18 C52 20 62 28 60 42 C58 56 50 62 40 64 C30 62 20 56 22 42 C24 28 28 20 40 18Z" fill="url(#g15)" />
          <circle cx="32" cy="36" r="2.5" fill="#5EEAD4" opacity="0.5" />
          <circle cx="50" cy="32" r="3" fill="#5EEAD4" opacity="0.4" />
          <circle cx="44" cy="52" r="2" fill="#5EEAD4" opacity="0.3" />
          <circle cx="35" cy="40" r="3" fill="white" />
          <circle cx="45" cy="40" r="3" fill="white" />
          <circle cx="35.5" cy="39.5" r="1.5" fill="#134E4A" />
          <circle cx="45.5" cy="39.5" r="1.5" fill="#134E4A" />
          <path d="M38 48 Q40 50 42 48" stroke="#134E4A" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          {alive && <circle cx="36" cy="39" r="0.6" fill="white" />}
          <defs><radialGradient id="g15" cx="45%" cy="35%"><stop offset="0%" stopColor="white" stopOpacity="0.25" /><stop offset="100%" stopColor="white" stopOpacity="0" /></radialGradient></defs>
        </g>
      );

    // 16. Kingy - royal blue crowned crab
    case 'crossword_king':
      return (
        <g>
          <circle cx="40" cy="42" r="24" fill="#2563EB" opacity="0.1" />
          <ellipse cx="40" cy="48" rx="22" ry="14" fill="#2563EB" />
          <ellipse cx="40" cy="48" rx="22" ry="14" fill="url(#g16)" />
          <polygon points="30,30 33,22 37,28 40,18 43,28 47,22 50,30" fill="#EAB308" />
          <circle cx="40" cy="22" r="2" fill="#FDE68A" />
          <circle cx="34" cy="44" r="3.5" fill="white" />
          <circle cx="46" cy="44" r="3.5" fill="white" />
          <circle cx="34.5" cy="43.5" r="1.8" fill="#1E3A8A" />
          <circle cx="46.5" cy="43.5" r="1.8" fill="#1E3A8A" />
          <path d="M37 52 Q40 55 43 52" stroke="#1E3A8A" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          <path d="M16 46 L12 42 M16 46 L12 50" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M64 46 L68 42 M64 46 L68 50" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
          <defs><radialGradient id="g16" cx="40%" cy="30%"><stop offset="0%" stopColor="white" stopOpacity="0.25" /><stop offset="100%" stopColor="white" stopOpacity="0" /></radialGradient></defs>
        </g>
      );

    // 17. Bookwyrm - navy book serpent
    case 'citation_master':
      return (
        <g>
          <circle cx="40" cy="40" r="24" fill="#1E40AF" opacity="0.1" />
          <path d="M24 56 C20 48 18 38 24 30 C30 22 40 20 48 26 C56 32 60 42 56 52" stroke="#1E40AF" strokeWidth="8" strokeLinecap="round" fill="none" />
          <path d="M24 56 C20 48 18 38 24 30 C30 22 40 20 48 26 C56 32 60 42 56 52" stroke="url(#g17s)" strokeWidth="8" strokeLinecap="round" fill="none" />
          <circle cx="28" cy="30" r="4" fill="white" />
          <circle cx="28" cy="30" r="2" fill="#172554" />
          <circle cx="20" cy="30" r="3.5" fill="white" stroke="#1E40AF" strokeWidth="1" />
          <circle cx="20" cy="30" r="1.8" fill="#172554" />
          {alive && <circle cx="21" cy="29" r="0.7" fill="white" />}
          <path d="M22 36 Q25 38 28 36" stroke="#172554" strokeWidth="1" strokeLinecap="round" fill="none" />
          <rect x="44" y="48" width="12" height="14" rx="2" fill="#DBEAFE" stroke="#1E40AF" strokeWidth="1" />
          <line x1="47" y1="52" x2="53" y2="52" stroke="#1E40AF" strokeWidth="0.8" />
          <line x1="47" y1="55" x2="53" y2="55" stroke="#1E40AF" strokeWidth="0.8" />
          <line x1="47" y1="58" x2="51" y2="58" stroke="#1E40AF" strokeWidth="0.8" />
          <defs><linearGradient id="g17s" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="white" stopOpacity="0.3" /><stop offset="100%" stopColor="white" stopOpacity="0" /></linearGradient></defs>
        </g>
      );

    // 18. Sage - wise teal scholar
    case 'summary_scholar':
      return (
        <g>
          <circle cx="40" cy="42" r="24" fill="#0F766E" opacity="0.1" />
          <circle cx="40" cy="44" r="18" fill="#0F766E" />
          <circle cx="40" cy="44" r="18" fill="url(#g18)" />
          <path d="M28 30 L40 20 L52 30" fill="#115E59" />
          <circle cx="40" cy="24" r="2.5" fill="#5EEAD4" />
          <ellipse cx="35" cy="42" rx="3" ry="2" fill="white" />
          <ellipse cx="45" cy="42" rx="3" ry="2" fill="white" />
          <ellipse cx="35.5" cy="42" rx="1.5" ry="1.8" fill="#134E4A" />
          <ellipse cx="45.5" cy="42" rx="1.5" ry="1.8" fill="#134E4A" />
          <path d="M38 50 Q40 52 42 50" stroke="#134E4A" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <polygon points="37,54 40,58 43,54" fill="#99F6E4" opacity="0.6" />
          <line x1="16" y1="30" x2="16" y2="56" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" />
          <circle cx="16" cy="28" r="3" fill="#5EEAD4" />
          <defs><radialGradient id="g18" cx="40%" cy="30%"><stop offset="0%" stopColor="white" stopOpacity="0.25" /><stop offset="100%" stopColor="white" stopOpacity="0" /></radialGradient></defs>
        </g>
      );

    // 19. Nyx - dark purple night owl
    case 'night_owl':
      return (
        <g>
          <circle cx="40" cy="42" r="26" fill="#581C87" opacity="0.12" />
          <ellipse cx="40" cy="46" rx="20" ry="18" fill="#581C87" />
          <ellipse cx="40" cy="46" rx="20" ry="18" fill="url(#g19)" />
          <path d="M24 34 L30 40 M56 34 L50 40" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="34" cy="42" r="6" fill="#1E1B4B" />
          <circle cx="46" cy="42" r="6" fill="#1E1B4B" />
          <circle cx="34" cy="42" r="4" fill="#FBBF24" />
          <circle cx="46" cy="42" r="4" fill="#FBBF24" />
          <circle cx="34" cy="42" r="2" fill="#1E1B4B" />
          <circle cx="46" cy="42" r="2" fill="#1E1B4B" />
          <polygon points="40,50 38,54 42,54" fill="#6D28D9" />
          <path d="M54 16 C50 22 54 28 60 28 C54 20 56 14 54 16Z" fill="#EAB308" opacity="0.8" />
          {alive && <>
            <circle cx="18" cy="24" r="1" fill="#DDD6FE" opacity="0.7" />
            <circle cx="62" cy="20" r="0.8" fill="#DDD6FE" opacity="0.5" />
            <circle cx="28" cy="16" r="0.6" fill="#DDD6FE" opacity="0.6" />
          </>}
          <defs><radialGradient id="g19" cx="40%" cy="30%"><stop offset="0%" stopColor="white" stopOpacity="0.15" /><stop offset="100%" stopColor="white" stopOpacity="0" /></radialGradient></defs>
        </g>
      );

    // 20. Sol - bright yellow sun bird
    case 'early_bird':
      return (
        <g>
          <circle cx="40" cy="40" r="26" fill="#F59E0B" opacity="0.15" />
          {alive && <>
            <line x1="40" y1="8" x2="40" y2="14" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
            <line x1="56" y1="14" x2="52" y2="18" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
            <line x1="24" y1="14" x2="28" y2="18" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
            <line x1="64" y1="28" x2="60" y2="30" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
            <line x1="16" y1="28" x2="20" y2="30" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
          </>}
          <circle cx="40" cy="40" r="18" fill="#F59E0B" />
          <circle cx="40" cy="40" r="18" fill="url(#g20)" />
          <circle cx="34" cy="38" r="3.5" fill="white" />
          <circle cx="46" cy="38" r="3.5" fill="white" />
          <circle cx="34.5" cy="37.5" r="1.8" fill="#78350F" />
          <circle cx="46.5" cy="37.5" r="1.8" fill="#78350F" />
          {alive && <circle cx="35" cy="37" r="0.7" fill="white" />}
          <polygon points="40,42 37,46 43,46" fill="#92400E" />
          <path d="M36 50 Q40 53 44 50" stroke="#78350F" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          <path d="M22 44 L18 40 M22 44 L18 48" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          <path d="M58 44 L62 40 M58 44 L62 48" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          <defs><radialGradient id="g20" cx="40%" cy="30%"><stop offset="0%" stopColor="white" stopOpacity="0.4" /><stop offset="100%" stopColor="white" stopOpacity="0" /></radialGradient></defs>
        </g>
      );

    // ═══════════════════════════════════════
    // NEW BADGES (30 additional creatures)
    // ═══════════════════════════════════════

    // Greenie - small green sprout (first_login)
    case 'first_login':
      return (
        <g>
          <circle cx="40" cy="42" r="22" fill="#22C55E" opacity="0.1" />
          <ellipse cx="40" cy="50" rx="14" ry="12" fill="#22C55E" />
          <ellipse cx="40" cy="50" rx="14" ry="12" fill="url(#gl1)" />
          <path d="M40 38 L36 28 M40 38 L44 26 M40 38 L40 24" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
          <circle cx="36" cy="26" r="3" fill="#4ADE80" />
          <circle cx="44" cy="24" r="2.5" fill="#4ADE80" />
          <circle cx="40" cy="22" r="3.5" fill="#4ADE80" />
          <circle cx="36" cy="48" r="3" fill="white" /><circle cx="44" cy="48" r="3" fill="white" />
          <circle cx="36.5" cy="47.5" r="1.5" fill="#14532D" /><circle cx="44.5" cy="47.5" r="1.5" fill="#14532D" />
          <path d="M38 55 Q40 57 42 55" stroke="#14532D" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          {alive && <circle cx="37" cy="47" r="0.6" fill="white" />}
          <defs><radialGradient id="gl1" cx="40%" cy="30%"><stop offset="0%" stopColor="white" stopOpacity="0.3" /><stop offset="100%" stopColor="white" stopOpacity="0" /></radialGradient></defs>
        </g>
      );

    // Peeker - curious eye creature (explorer)
    case 'explorer':
      return (
        <g>
          <circle cx="40" cy="40" r="22" fill="#6366F1" opacity="0.1" />
          <circle cx="40" cy="42" r="18" fill="#6366F1" />
          <circle cx="40" cy="38" r="12" fill="white" />
          <circle cx="40" cy="38" r="7" fill="#312E81" />
          <circle cx="42" cy="36" r="2.5" fill="white" />
          {alive && <circle cx="38" cy="40" r="1.5" fill="white" opacity="0.5" />}
          <path d="M30 52 Q40 58 50 52" stroke="#312E81" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <circle cx="26" cy="34" r="4" fill="#818CF8" opacity="0.4" />
          <circle cx="54" cy="34" r="4" fill="#818CF8" opacity="0.4" />
        </g>
      );

    // Titan - armored fire warrior (two_week_titan)
    case 'two_week_titan':
      return (
        <g>
          <circle cx="40" cy="40" r="26" fill="#DC2626" opacity="0.12" />
          <path d="M40 12 C48 24 60 28 58 44 C56 58 46 66 40 66 C34 66 24 58 22 44 C20 28 32 24 40 12Z" fill="#B91C1C" />
          <rect x="28" y="30" width="24" height="20" rx="4" fill="#7F1D1D" />
          <rect x="30" y="32" width="20" height="16" rx="3" fill="#991B1B" />
          <circle cx="36" cy="40" r="3" fill="#FCA5A5" /><circle cx="44" cy="40" r="3" fill="#FCA5A5" />
          <circle cx="36.5" cy="39.5" r="1.5" fill="#450A0A" /><circle cx="44.5" cy="39.5" r="1.5" fill="#450A0A" />
          <polygon points="40,20 36,28 44,28" fill="#EF4444" />
          <path d="M36 48 L40 46 L44 48" stroke="#FCA5A5" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <rect x="24" y="36" width="4" height="10" rx="2" fill="#7F1D1D" />
          <rect x="52" y="36" width="4" height="10" rx="2" fill="#7F1D1D" />
        </g>
      );

    // Inferno - massive flame being (monthly_master)
    case 'monthly_master':
      return (
        <g>
          <circle cx="40" cy="40" r="28" fill="#F97316" opacity="0.15" />
          <path d="M40 6 C50 20 66 26 64 44 C62 60 52 70 40 70 C28 70 18 60 16 44 C14 26 30 20 40 6Z" fill="#EA580C" />
          <path d="M40 20 C46 30 56 34 54 46 C52 56 46 62 40 62 C34 62 28 56 26 46 C24 34 34 30 40 20Z" fill="#F97316" />
          <path d="M40 32 C43 38 48 40 47 48 C46 54 43 56 40 56 C37 56 34 54 33 48 C32 40 37 38 40 32Z" fill="#FBBF24" />
          <circle cx="36" cy="44" r="3" fill="white" /><circle cx="44" cy="44" r="3" fill="white" />
          <circle cx="36.5" cy="43.5" r="1.8" fill="#7C2D12" /><circle cx="44.5" cy="43.5" r="1.8" fill="#7C2D12" />
          <path d="M37 52 Q40 55 43 52" stroke="#7C2D12" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          {alive && <><circle cx="20" cy="20" r="2" fill="#FBBF24" opacity="0.6" /><circle cx="60" cy="18" r="1.5" fill="#FBBF24" opacity="0.5" /></>}
        </g>
      );

    // Mechablaze - mechanical fire (streak_machine)
    case 'streak_machine':
      return (
        <g>
          <circle cx="40" cy="40" r="26" fill="#EF4444" opacity="0.1" />
          <rect x="24" y="24" width="32" height="36" rx="6" fill="#78716C" />
          <rect x="26" y="26" width="28" height="32" rx="5" fill="#A8A29E" />
          <rect x="30" y="30" width="20" height="18" rx="3" fill="#292524" />
          <circle cx="36" cy="38" r="3" fill="#EF4444" /><circle cx="44" cy="38" r="3" fill="#EF4444" />
          <circle cx="36" cy="38" r="1.5" fill="#FCA5A5" /><circle cx="44" cy="38" r="1.5" fill="#FCA5A5" />
          <path d="M36 44 L40 42 L44 44" stroke="#EF4444" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <path d="M30 16 L28 10 M40 16 L40 8 M50 16 L52 10" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
          <rect x="20" y="38" width="4" height="8" rx="2" fill="#57534E" />
          <rect x="56" y="38" width="4" height="8" rx="2" fill="#57534E" />
          {alive && <circle cx="36" cy="38" r="4" fill="#EF4444" opacity="0.3"><animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" /></circle>}
        </g>
      );

    // Eternox - ethereal flame entity (streak_immortal)
    case 'streak_immortal':
      return (
        <g>
          <circle cx="40" cy="40" r="28" fill="#7C3AED" opacity="0.15" />
          <path d="M40 8 C50 22 62 26 60 42 C58 58 50 68 40 68 C30 68 22 58 20 42 C18 26 30 22 40 8Z" fill="#7C3AED" />
          <path d="M40 20 C46 32 54 34 52 46 C50 56 46 60 40 60 C34 60 30 56 28 46 C26 34 34 32 40 20Z" fill="#8B5CF6" />
          <path d="M40 30 C43 38 48 40 46 48 C44 54 42 56 40 56 C38 56 36 54 34 48 C32 40 37 38 40 30Z" fill="#DDD6FE" />
          <circle cx="36" cy="44" r="3.5" fill="white" /><circle cx="44" cy="44" r="3.5" fill="white" />
          <circle cx="36" cy="44" r="2" fill="#4C1D95" /><circle cx="44" cy="44" r="2" fill="#4C1D95" />
          {alive && <><circle cx="14" cy="28" r="1.5" fill="#C4B5FD" opacity="0.7" /><circle cx="66" cy="24" r="1.2" fill="#C4B5FD" opacity="0.6" /><circle cx="40" cy="6" r="1" fill="#EDE9FE" opacity="0.8" /></>}
          <path d="M37 52 Q40 55 43 52" stroke="#4C1D95" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </g>
      );

    // Godflame - celestial fire god (streak_demigod)
    case 'streak_demigod':
      return (
        <g>
          <circle cx="40" cy="40" r="30" fill="#D97706" opacity="0.2" />
          <path d="M40 4 L48 20 L66 14 L56 32 L72 38 L56 44 L64 62 L40 52 L16 62 L24 44 L8 38 L24 32 L14 14 L32 20Z" fill="#B45309" />
          <circle cx="40" cy="38" r="16" fill="#D97706" />
          <circle cx="40" cy="38" r="12" fill="#F59E0B" />
          <circle cx="40" cy="38" r="8" fill="#FDE68A" />
          <circle cx="36" cy="36" r="2.5" fill="white" /><circle cx="44" cy="36" r="2.5" fill="white" />
          <circle cx="36.5" cy="35.5" r="1.3" fill="#78350F" /><circle cx="44.5" cy="35.5" r="1.3" fill="#78350F" />
          <polygon points="40,40 38,43 42,43" fill="#92400E" />
          <path d="M37 46 Q40 48 43 46" stroke="#78350F" strokeWidth="1" strokeLinecap="round" fill="none" />
          {alive && <><circle cx="40" cy="2" r="2" fill="#FDE68A" opacity="0.8" /><circle cx="10" cy="38" r="1.5" fill="#FBBF24" opacity="0.6" /><circle cx="70" cy="38" r="1.5" fill="#FBBF24" opacity="0.6" /></>}
        </g>
      );

    // Quizilla - quiz monster evolution (quiz_addict)
    case 'quiz_addict':
      return (
        <g>
          <circle cx="40" cy="42" r="22" fill="#F59E0B" opacity="0.12" />
          <ellipse cx="40" cy="44" rx="20" ry="18" fill="#D97706" />
          <circle cx="34" cy="38" r="5" fill="white" /><circle cx="46" cy="38" r="5" fill="white" />
          <circle cx="34.5" cy="37.5" r="2.5" fill="#78350F" /><circle cx="46.5" cy="37.5" r="2.5" fill="#78350F" />
          {alive && <><circle cx="35" cy="37" r="1" fill="white" /><circle cx="47" cy="37" r="1" fill="white" /></>}
          <path d="M34 52 Q40 58 46 52" stroke="#78350F" strokeWidth="2" strokeLinecap="round" fill="none" />
          <polygon points="28,28 32,22 26,22" fill="#B45309" /><polygon points="52,28 56,22 48,22" fill="#B45309" />
          <text x="40" y="48" textAnchor="middle" fill="#78350F" fontSize="8" fontWeight="bold">?</text>
        </g>
      );

    // Quizor - ultimate quiz being (quiz_legend)
    case 'quiz_legend':
      return (
        <g>
          <circle cx="40" cy="40" r="26" fill="#F59E0B" opacity="0.15" />
          <path d="M40 12 L48 26 L64 22 L54 36 L68 42 L54 48 L62 62 L40 54 L18 62 L26 48 L12 42 L26 36 L16 22 L32 26Z" fill="#CA8A04" />
          <circle cx="40" cy="40" r="14" fill="#EAB308" />
          <circle cx="36" cy="38" r="3.5" fill="white" /><circle cx="44" cy="38" r="3.5" fill="white" />
          <circle cx="36.5" cy="37.5" r="1.8" fill="#713F12" /><circle cx="44.5" cy="37.5" r="1.8" fill="#713F12" />
          <path d="M36 46 Q40 50 44 46" stroke="#713F12" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <text x="40" y="10" textAnchor="middle" fill="#EAB308" fontSize="10" fontWeight="bold">!</text>
          {alive && <><circle cx="18" cy="36" r="1.5" fill="#FDE68A" opacity="0.7" /><circle cx="62" cy="36" r="1.5" fill="#FDE68A" opacity="0.7" /></>}
        </g>
      );

    // Analytix - evolved analysis creature (analysis_master)
    case 'analysis_master':
      return (
        <g>
          <circle cx="40" cy="40" r="24" fill="#E11D48" opacity="0.1" />
          <ellipse cx="40" cy="44" rx="20" ry="18" fill="#E11D48" />
          <circle cx="40" cy="36" r="10" fill="white" opacity="0.15" />
          <circle cx="34" cy="40" r="4" fill="white" /><circle cx="46" cy="40" r="4" fill="white" />
          <circle cx="34.5" cy="39.5" r="2" fill="#881337" /><circle cx="46.5" cy="39.5" r="2" fill="#881337" />
          <path d="M36 52 Q40 56 44 52" stroke="#881337" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <circle cx="40" cy="26" r="3" fill="#FB7185" /><path d="M40 22 L40 18" stroke="#FB7185" strokeWidth="2" strokeLinecap="round" />
          <path d="M36 22 L44 22" stroke="#FB7185" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      );

    // Analytor - ultimate analysis being (analysis_legend)
    case 'analysis_legend':
      return (
        <g>
          <circle cx="40" cy="40" r="26" fill="#BE123C" opacity="0.15" />
          <path d="M40 14 C52 18 60 28 58 42 C56 56 48 64 40 64 C32 64 24 56 22 42 C20 28 28 18 40 14Z" fill="#BE123C" />
          <circle cx="40" cy="40" r="14" fill="#E11D48" />
          <circle cx="35" cy="38" r="4" fill="white" /><circle cx="45" cy="38" r="4" fill="white" />
          <circle cx="35.5" cy="37.5" r="2" fill="#4C0519" /><circle cx="45.5" cy="37.5" r="2" fill="#4C0519" />
          <path d="M37 48 Q40 52 43 48" stroke="#4C0519" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M26 20 L22 14 M54 20 L58 14 M40 14 L40 8" stroke="#FB7185" strokeWidth="2" strokeLinecap="round" />
          {alive && <><circle cx="16" cy="30" r="1.5" fill="#FDA4AF" opacity="0.6" /><circle cx="64" cy="30" r="1.5" fill="#FDA4AF" opacity="0.6" /></>}
        </g>
      );

    // Metamorph - advanced shapeshifter (humanize_legend)
    case 'humanize_legend':
      return (
        <g>
          <circle cx="40" cy="40" r="24" fill="#0D9488" opacity="0.12" />
          <path d="M20 40 Q20 20 40 20 Q60 20 60 40 Q60 60 40 60 Q20 60 20 40Z" fill="#0D9488" />
          <path d="M24 36 Q24 24 40 24 Q56 24 56 36 Q56 48 40 56 Q24 48 24 36Z" fill="#14B8A6" />
          <circle cx="32" cy="36" r="5" fill="#5EEAD4" opacity="0.4" /><circle cx="50" cy="34" r="4" fill="#5EEAD4" opacity="0.3" />
          <circle cx="36" cy="38" r="3" fill="white" /><circle cx="44" cy="38" r="3" fill="white" />
          <circle cx="36.5" cy="37.5" r="1.5" fill="#134E4A" /><circle cx="44.5" cy="37.5" r="1.5" fill="#134E4A" />
          <path d="M38 46 Q40 49 42 46" stroke="#134E4A" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          {alive && <circle cx="48" cy="50" r="3" fill="#99F6E4" opacity="0.5" />}
        </g>
      );

    // Cardano - card master (flash_genius)
    case 'flash_genius':
      return (
        <g>
          <circle cx="40" cy="40" r="24" fill="#A855F7" opacity="0.12" />
          <rect x="24" y="26" width="32" height="32" rx="8" fill="#9333EA" />
          <rect x="26" y="28" width="28" height="28" rx="7" fill="#A855F7" />
          <circle cx="36" cy="40" r="3.5" fill="white" /><circle cx="44" cy="40" r="3.5" fill="white" />
          <circle cx="36.5" cy="39.5" r="1.8" fill="#581C87" /><circle cx="44.5" cy="39.5" r="1.8" fill="#581C87" />
          <path d="M38 48 Q40 51 42 48" stroke="#581C87" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          {alive && <>
            <rect x="12" y="28" width="8" height="10" rx="1.5" fill="#DDD6FE" stroke="#A855F7" strokeWidth="0.8" transform="rotate(-15 16 33)" />
            <rect x="60" y="32" width="8" height="10" rx="1.5" fill="#DDD6FE" stroke="#A855F7" strokeWidth="0.8" transform="rotate(15 64 37)" />
            <rect x="36" y="14" width="8" height="10" rx="1.5" fill="#DDD6FE" stroke="#A855F7" strokeWidth="0.8" />
          </>}
        </g>
      );

    // Gridlord - crossword ruler (crossword_emperor)
    case 'crossword_emperor':
      return (
        <g>
          <circle cx="40" cy="40" r="24" fill="#2563EB" opacity="0.12" />
          <rect x="22" y="24" width="36" height="36" rx="4" fill="#1E40AF" />
          <rect x="24" y="26" width="32" height="32" rx="3" fill="#2563EB" />
          <line x1="24" y1="37" x2="56" y2="37" stroke="#1E3A8A" strokeWidth="0.8" />
          <line x1="24" y1="47" x2="56" y2="47" stroke="#1E3A8A" strokeWidth="0.8" />
          <line x1="35" y1="26" x2="35" y2="58" stroke="#1E3A8A" strokeWidth="0.8" />
          <line x1="45" y1="26" x2="45" y2="58" stroke="#1E3A8A" strokeWidth="0.8" />
          <circle cx="36" cy="40" r="3" fill="white" /><circle cx="44" cy="40" r="3" fill="white" />
          <circle cx="36.5" cy="39.5" r="1.5" fill="#172554" /><circle cx="44.5" cy="39.5" r="1.5" fill="#172554" />
          <polygon points="34,16 37,22 40,14 43,22 46,16" fill="#EAB308" />
          <path d="M38 50 Q40 53 42 50" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        </g>
      );

    // Librax - library dragon (citation_legend)
    case 'citation_legend':
      return (
        <g>
          <circle cx="40" cy="40" r="26" fill="#1E40AF" opacity="0.12" />
          <path d="M40 14 C52 18 62 30 58 44 C54 58 48 66 40 66 C32 66 26 58 22 44 C18 30 28 18 40 14Z" fill="#1E40AF" />
          <path d="M28 24 L24 16 M52 24 L56 16" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="34" cy="40" r="4" fill="white" /><circle cx="46" cy="40" r="4" fill="white" />
          <circle cx="34.5" cy="39.5" r="2" fill="#172554" /><circle cx="46.5" cy="39.5" r="2" fill="#172554" />
          <path d="M36 52 Q40 56 44 52" stroke="#172554" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <rect x="32" y="56" width="16" height="10" rx="2" fill="#DBEAFE" stroke="#1E40AF" strokeWidth="0.8" />
          <line x1="35" y1="59" x2="45" y2="59" stroke="#1E40AF" strokeWidth="0.6" />
          <line x1="35" y1="62" x2="43" y2="62" stroke="#1E40AF" strokeWidth="0.6" />
          {alive && <circle cx="35" cy="39" r="0.8" fill="white" />}
        </g>
      );

    // Condensor - compression creature (summary_master)
    case 'summary_master':
      return (
        <g>
          <circle cx="40" cy="40" r="24" fill="#0F766E" opacity="0.12" />
          <path d="M24 30 L56 30 L50 56 L30 56Z" fill="#0F766E" />
          <path d="M26 32 L54 32 L49 54 L31 54Z" fill="#14B8A6" />
          <circle cx="36" cy="42" r="3" fill="white" /><circle cx="44" cy="42" r="3" fill="white" />
          <circle cx="36.5" cy="41.5" r="1.5" fill="#134E4A" /><circle cx="44.5" cy="41.5" r="1.5" fill="#134E4A" />
          <path d="M38 50 Q40 52 42 50" stroke="#134E4A" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <path d="M30 22 L50 22 M32 26 L48 26" stroke="#5EEAD4" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M34 18 L46 18" stroke="#99F6E4" strokeWidth="1" strokeLinecap="round" />
        </g>
      );

    // Uploader - upload creature (upload_champion)
    case 'upload_champion':
      return (
        <g>
          <circle cx="40" cy="42" r="22" fill="#3B82F6" opacity="0.1" />
          <ellipse cx="40" cy="46" rx="18" ry="16" fill="#3B82F6" />
          <circle cx="34" cy="42" r="3.5" fill="white" /><circle cx="46" cy="42" r="3.5" fill="white" />
          <circle cx="34.5" cy="41.5" r="1.8" fill="#1E3A8A" /><circle cx="46.5" cy="41.5" r="1.8" fill="#1E3A8A" />
          <path d="M37 52 Q40 55 43 52" stroke="#1E3A8A" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          <path d="M40 28 L40 16 M34 22 L40 16 L46 22" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {alive && <path d="M30 32 L32 28 M48 28 L50 32" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />}
        </g>
      );

    // Cloudking - cloud king (upload_legend)
    case 'upload_legend':
      return (
        <g>
          <circle cx="40" cy="40" r="26" fill="#3B82F6" opacity="0.12" />
          <path d="M20 44 C20 36 26 30 34 30 C36 24 44 20 52 24 C58 26 62 32 60 38 C64 40 66 46 62 50 C60 54 56 56 50 56 L30 56 C24 56 18 50 20 44Z" fill="#3B82F6" />
          <circle cx="36" cy="44" r="3.5" fill="white" /><circle cx="46" cy="44" r="3.5" fill="white" />
          <circle cx="36.5" cy="43.5" r="1.8" fill="#1E3A8A" /><circle cx="46.5" cy="43.5" r="1.8" fill="#1E3A8A" />
          <polygon points="36,30 39,24 42,30" fill="#EAB308" /><polygon points="38,28 41,20 44,28" fill="#EAB308" />
          <circle cx="41" cy="22" r="2" fill="#FDE68A" />
          <path d="M38 50 Q41 53 44 50" stroke="#1E3A8A" strokeWidth="1.3" strokeLinecap="round" fill="none" />
        </g>
      );

    // Goldie - gold premium creature (premium_pioneer)
    case 'premium_pioneer':
      return (
        <g>
          <circle cx="40" cy="40" r="26" fill="#EAB308" opacity="0.15" />
          <circle cx="40" cy="42" r="20" fill="#EAB308" />
          <circle cx="40" cy="42" r="20" fill="url(#gp1)" />
          <circle cx="40" cy="42" r="14" fill="#F59E0B" />
          <circle cx="35" cy="40" r="3.5" fill="white" /><circle cx="45" cy="40" r="3.5" fill="white" />
          <circle cx="35.5" cy="39.5" r="1.8" fill="#713F12" /><circle cx="45.5" cy="39.5" r="1.8" fill="#713F12" />
          {alive && <><circle cx="36" cy="39" r="0.7" fill="white" /><circle cx="46" cy="39" r="0.7" fill="white" /></>}
          <path d="M37 48 Q40 52 43 48" stroke="#713F12" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <polygon points="40,16 36,24 44,24" fill="#CA8A04" />
          <polygon points="34,20 30,24 38,24" fill="#A16207" /><polygon points="46,20 42,24 50,24" fill="#A16207" />
          <circle cx="40" cy="20" r="2" fill="#FDE68A" />
          {alive && <><circle cx="18" cy="32" r="1.5" fill="#FBBF24" opacity="0.6" /><circle cx="62" cy="32" r="1.5" fill="#FBBF24" opacity="0.6" /><circle cx="40" cy="12" r="1" fill="#FDE68A" opacity="0.8" /></>}
          <defs><radialGradient id="gp1" cx="40%" cy="30%"><stop offset="0%" stopColor="white" stopOpacity="0.35" /><stop offset="100%" stopColor="white" stopOpacity="0" /></radialGradient></defs>
        </g>
      );

    // Loyalist - loyal companion (loyal_learner)
    case 'loyal_learner':
      return (
        <g>
          <circle cx="40" cy="42" r="24" fill="#D97706" opacity="0.12" />
          <ellipse cx="40" cy="46" rx="18" ry="16" fill="#B45309" />
          <ellipse cx="40" cy="46" rx="18" ry="16" fill="url(#gll)" />
          <circle cx="34" cy="42" r="4" fill="white" /><circle cx="46" cy="42" r="4" fill="white" />
          <circle cx="34.5" cy="41.5" r="2" fill="#78350F" /><circle cx="46.5" cy="41.5" r="2" fill="#78350F" />
          <path d="M36 52 Q40 56 44 52" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M34 28 C36 22 44 22 46 28" fill="#92400E" />
          <path d="M28 34 C24 28 30 26 34 28 M52 34 C56 28 50 26 46 28" fill="#92400E" />
          <path d="M40 60 L36 68 L40 66 L44 68Z" fill="#D97706" />
          {alive && <circle cx="35" cy="41" r="0.8" fill="white" />}
          <defs><radialGradient id="gll" cx="40%" cy="30%"><stop offset="0%" stopColor="white" stopOpacity="0.25" /><stop offset="100%" stopColor="white" stopOpacity="0" /></radialGradient></defs>
        </g>
      );

    // Devotion - devoted guardian (dedicated_scholar)
    case 'dedicated_scholar':
      return (
        <g>
          <circle cx="40" cy="40" r="26" fill="#7C3AED" opacity="0.15" />
          <path d="M40 14 C54 18 62 30 58 44 C54 58 48 66 40 66 C32 66 26 58 22 44 C18 30 26 18 40 14Z" fill="#6D28D9" />
          <circle cx="40" cy="40" r="14" fill="#7C3AED" />
          <path d="M28 22 L40 12 L52 22" fill="#5B21B6" />
          <circle cx="40" cy="16" r="3" fill="#DDD6FE" />
          <circle cx="35" cy="38" r="3.5" fill="white" /><circle cx="45" cy="38" r="3.5" fill="white" />
          <circle cx="35.5" cy="37.5" r="1.8" fill="#4C1D95" /><circle cx="45.5" cy="37.5" r="1.8" fill="#4C1D95" />
          <path d="M37 46 Q40 49 43 46" stroke="#4C1D95" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          <path d="M18 36 L16 30 L16 42Z" fill="#8B5CF6" /><path d="M62 36 L64 30 L64 42Z" fill="#8B5CF6" />
          {alive && <><circle cx="14" cy="24" r="1.5" fill="#C4B5FD" opacity="0.7" /><circle cx="66" cy="24" r="1.2" fill="#C4B5FD" opacity="0.6" /></>}
        </g>
      );

    // Eternia - ultimate scholar being (scholar_supreme)
    case 'scholar_supreme':
      return (
        <g>
          <circle cx="40" cy="40" r="30" fill="#EAB308" opacity="0.18" />
          <circle cx="40" cy="40" r="24" fill="#7C3AED" />
          <circle cx="40" cy="40" r="18" fill="#8B5CF6" />
          <circle cx="40" cy="40" r="12" fill="#A78BFA" />
          <circle cx="36" cy="38" r="3" fill="white" /><circle cx="44" cy="38" r="3" fill="white" />
          <circle cx="36.5" cy="37.5" r="1.5" fill="#4C1D95" /><circle cx="44.5" cy="37.5" r="1.5" fill="#4C1D95" />
          <path d="M38 44 Q40 47 42 44" stroke="#4C1D95" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <polygon points="30,14 34,22 40,10 46,22 50,14" fill="#EAB308" />
          <circle cx="40" cy="14" r="3" fill="#FDE68A" />
          {alive && <>
            <circle cx="12" cy="30" r="2" fill="#FBBF24" opacity="0.7" />
            <circle cx="68" cy="30" r="2" fill="#FBBF24" opacity="0.7" />
            <circle cx="40" cy="6" r="1.5" fill="#FDE68A" opacity="0.8" />
            <circle cx="20" cy="50" r="1.5" fill="#C4B5FD" opacity="0.6" />
            <circle cx="60" cy="50" r="1.5" fill="#C4B5FD" opacity="0.6" />
          </>}
        </g>
      );

    // Midnight - midnight specter (midnight_scholar)
    case 'midnight_scholar':
      return (
        <g>
          <circle cx="40" cy="40" r="24" fill="#1E1B4B" opacity="0.15" />
          <ellipse cx="40" cy="44" rx="20" ry="18" fill="#312E81" />
          <circle cx="34" cy="40" r="5" fill="#1E1B4B" /><circle cx="46" cy="40" r="5" fill="#1E1B4B" />
          <circle cx="34" cy="40" r="3" fill="#818CF8" /><circle cx="46" cy="40" r="3" fill="#818CF8" />
          <circle cx="34" cy="40" r="1.5" fill="#1E1B4B" /><circle cx="46" cy="40" r="1.5" fill="#1E1B4B" />
          <path d="M38 52 Q40 54 42 52" stroke="#4338CA" strokeWidth="1" strokeLinecap="round" fill="none" />
          <path d="M56 18 C52 24 56 30 62 30 C56 22 58 16 56 18Z" fill="#FBBF24" opacity="0.9" />
          {alive && <><circle cx="18" cy="22" r="1" fill="#C4B5FD" opacity="0.7" /><circle cx="64" cy="18" r="0.8" fill="#C4B5FD" opacity="0.5" /><circle cx="26" cy="16" r="0.6" fill="#E0E7FF" opacity="0.6" /><circle cx="50" cy="14" r="0.5" fill="#E0E7FF" opacity="0.5" /></>}
        </g>
      );

    // Weekender - weekend hero (weekend_warrior)
    case 'weekend_warrior':
      return (
        <g>
          <circle cx="40" cy="40" r="22" fill="#10B981" opacity="0.1" />
          <ellipse cx="40" cy="44" rx="18" ry="16" fill="#10B981" />
          <circle cx="34" cy="40" r="3.5" fill="white" /><circle cx="46" cy="40" r="3.5" fill="white" />
          <circle cx="34.5" cy="39.5" r="1.8" fill="#064E3B" /><circle cx="46.5" cy="39.5" r="1.8" fill="#064E3B" />
          <path d="M36 50 Q40 54 44 50" stroke="#064E3B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <circle cx="28" cy="28" r="6" fill="#FBBF24" /><circle cx="28" cy="28" r="4" fill="#FDE68A" />
          <path d="M22 28 L18 28 M34 28 L38 28 M28 22 L28 18 M28 34 L28 38" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />
          {alive && <circle cx="35" cy="39" r="0.7" fill="white" />}
        </g>
      );

    // Omni - all-tools creature (all_rounder)
    case 'all_rounder':
      return (
        <g>
          <circle cx="40" cy="40" r="26" fill="#8B5CF6" opacity="0.12" />
          <polygon points="40,12 52,24 56,40 48,56 32,56 24,40 28,24" fill="#7C3AED" />
          <polygon points="40,16 50,26 54,40 46,54 34,54 26,40 30,26" fill="#8B5CF6" />
          <circle cx="36" cy="38" r="3" fill="white" /><circle cx="44" cy="38" r="3" fill="white" />
          <circle cx="36.5" cy="37.5" r="1.5" fill="#4C1D95" /><circle cx="44.5" cy="37.5" r="1.5" fill="#4C1D95" />
          <path d="M38 46 Q40 49 42 46" stroke="#4C1D95" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          {alive && <>
            <circle cx="40" cy="10" r="2" fill="#F59E0B" opacity="0.8" />
            <circle cx="58" cy="26" r="1.5" fill="#EF4444" opacity="0.7" />
            <circle cx="58" cy="42" r="1.5" fill="#3B82F6" opacity="0.7" />
            <circle cx="48" cy="58" r="1.5" fill="#22C55E" opacity="0.7" />
            <circle cx="32" cy="58" r="1.5" fill="#06B6D4" opacity="0.7" />
            <circle cx="22" cy="42" r="1.5" fill="#F97316" opacity="0.7" />
            <circle cx="22" cy="26" r="1.5" fill="#A855F7" opacity="0.7" />
          </>}
        </g>
      );

    // Exporto - export creature (export_pro)
    case 'export_pro':
      return (
        <g>
          <circle cx="40" cy="42" r="22" fill="#0EA5E9" opacity="0.1" />
          <ellipse cx="40" cy="46" rx="18" ry="16" fill="#0284C7" />
          <circle cx="34" cy="42" r="3.5" fill="white" /><circle cx="46" cy="42" r="3.5" fill="white" />
          <circle cx="34.5" cy="41.5" r="1.8" fill="#0C4A6E" /><circle cx="46.5" cy="41.5" r="1.8" fill="#0C4A6E" />
          <path d="M37 52 Q40 55 43 52" stroke="#0C4A6E" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          <rect x="34" y="18" width="12" height="14" rx="2" fill="#BAE6FD" stroke="#0284C7" strokeWidth="1" />
          <path d="M40 24 L40 18 M37 21 L40 18 L43 21" stroke="#0284C7" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          {alive && <path d="M30 26 L26 22 M50 26 L54 22" stroke="#7DD3FC" strokeWidth="1.5" strokeLinecap="round" />}
        </g>
      );

    // Boomerang - returning creature (comeback_kid)
    case 'comeback_kid':
      return (
        <g>
          <circle cx="40" cy="40" r="22" fill="#F43F5E" opacity="0.1" />
          <ellipse cx="40" cy="44" rx="18" ry="16" fill="#E11D48" />
          <circle cx="34" cy="40" r="3.5" fill="white" /><circle cx="46" cy="40" r="3.5" fill="white" />
          <circle cx="34.5" cy="39.5" r="1.8" fill="#881337" /><circle cx="46.5" cy="39.5" r="1.8" fill="#881337" />
          <path d="M36 50 Q40 54 44 50" stroke="#881337" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M56 22 C62 28 62 38 56 44 M58 24 L56 22 L54 24" stroke="#FB7185" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M24 22 C18 28 18 38 24 44 M22 24 L24 22 L26 24" stroke="#FB7185" strokeWidth="2" strokeLinecap="round" fill="none" />
          {alive && <circle cx="35" cy="39" r="0.7" fill="white" />}
        </g>
      );

    // Sharky - sharing creature (social_scholar)
    case 'social_scholar':
      return (
        <g>
          <circle cx="40" cy="42" r="22" fill="#06B6D4" opacity="0.1" />
          <path d="M40 24 C54 24 58 34 58 42 C58 54 50 60 40 60 C30 60 22 54 22 42 C22 34 26 24 40 24Z" fill="#0891B2" />
          <path d="M58 42 L66 38 L66 46Z" fill="#06B6D4" />
          <circle cx="34" cy="40" r="3.5" fill="white" /><circle cx="44" cy="40" r="3.5" fill="white" />
          <circle cx="34.5" cy="39.5" r="1.8" fill="#164E63" /><circle cx="44.5" cy="39.5" r="1.8" fill="#164E63" />
          <path d="M36 50 Q40 54 44 50" stroke="#164E63" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M20 38 L16 34 M20 38 L16 42" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" />
          {alive && <circle cx="35" cy="39" r="0.7" fill="white" />}
        </g>
      );

    default:
      return (
        <g>
          <circle cx="40" cy="40" r="20" fill="#94A3B8" />
          <circle cx="35" cy="38" r="3" fill="white" />
          <circle cx="45" cy="38" r="3" fill="white" />
          <circle cx="35.5" cy="37.5" r="1.5" fill="#334155" />
          <circle cx="45.5" cy="37.5" r="1.5" fill="#334155" />
          <path d="M36 46 Q40 49 44 46" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </g>
      );
  }
}

export default BadgeCreature;
