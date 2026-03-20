const b = "hsl(var(--primary))";
const y = "hsl(var(--secondary))";
const bm = "#5A7FFF";

const illustrations: Record<string, React.ReactNode> = {
  dryfood: (
    <g>
      <path d="M28 18L32 72H68L72 18Z" fill={b} opacity="0.12" />
      <path d="M28 18L32 72H68L72 18Z" stroke={b} strokeWidth="3" strokeLinejoin="round" fill="none" />
      <path d="M28 18L35 8H65L72 18Z" stroke={b} strokeWidth="3" strokeLinejoin="round" fill="none" />
      <path d="M35 8L38 14H62L65 8" stroke={b} strokeWidth="2" strokeLinejoin="round" fill="none" />
      <circle cx="44" cy="40" r="5" fill={y} stroke={b} strokeWidth="2" />
      <circle cx="56" cy="36" r="4" fill={y} stroke={b} strokeWidth="2" />
      <circle cx="50" cy="50" r="5.5" fill={y} stroke={b} strokeWidth="2" />
      <circle cx="60" cy="48" r="3.5" fill={y} stroke={b} strokeWidth="2" />
      <circle cx="68" cy="14" r="8" fill={y} stroke={b} strokeWidth="2" />
      <path d="M68 9L69.5 13L74 13L70.5 15.5L71.5 19.5L68 17L64.5 19.5L65.5 15.5L62 13L66.5 13Z" fill={b} />
    </g>
  ),
  wetfood: (
    <g>
      <rect x="30" y="28" width="40" height="40" rx="4" fill={b} opacity="0.12" />
      <rect x="30" y="28" width="40" height="40" rx="4" stroke={b} strokeWidth="3" fill="none" />
      <ellipse cx="50" cy="28" rx="20" ry="6" fill="white" stroke={b} strokeWidth="3" />
      <path d="M50 22V18" stroke={b} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="50" cy="16" r="4" fill="none" stroke={b} strokeWidth="2.5" />
      <rect x="30" y="40" width="40" height="16" fill={y} opacity="0.4" />
      <rect x="30" y="40" width="40" height="16" stroke={b} strokeWidth="1.5" fill="none" />
      <path d="M44 48C44 48 48 44 54 48C48 52 44 48 44 48Z" fill={b} />
      <circle cx="52" cy="47.5" r="1" fill="white" />
      <path d="M43 48L39 44L39 52Z" fill={b} />
      <path d="M42 22Q44 18 42 14" stroke={bm} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M58 22Q60 18 58 14" stroke={bm} strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </g>
  ),
  treat: (
    <g>
      <path d="M34 30C34 26 38 24 50 24C62 24 66 26 66 30L66 68C66 72 62 74 50 74C38 74 34 72 34 68Z" fill={b} opacity="0.10" />
      <path d="M34 30C34 26 38 24 50 24C62 24 66 26 66 30L66 68C66 72 62 74 50 74C38 74 34 72 34 68Z" stroke={b} strokeWidth="3" fill="none" />
      <rect x="36" y="16" width="28" height="10" rx="3" fill="white" stroke={b} strokeWidth="3" />
      <rect x="44" y="12" width="12" height="6" rx="2" fill={b} opacity="0.15" stroke={b} strokeWidth="2" />
      <g transform="translate(42,36) rotate(-15)">
        <rect x="0" y="2" width="12" height="5" rx="2.5" fill={y} stroke={b} strokeWidth="1.5" />
        <circle cx="0" cy="4.5" r="3" fill={y} stroke={b} strokeWidth="1.5" />
        <circle cx="12" cy="4.5" r="3" fill={y} stroke={b} strokeWidth="1.5" />
      </g>
      <g transform="translate(46,50) rotate(10)">
        <rect x="0" y="2" width="12" height="5" rx="2.5" fill={y} stroke={b} strokeWidth="1.5" />
        <circle cx="0" cy="4.5" r="3" fill={y} stroke={b} strokeWidth="1.5" />
        <circle cx="12" cy="4.5" r="3" fill={y} stroke={b} strokeWidth="1.5" />
      </g>
      <g transform="translate(62,42) rotate(25)">
        <rect x="0" y="3" width="18" height="7" rx="3.5" fill="white" stroke={b} strokeWidth="2.5" />
        <circle cx="0" cy="3" r="4" fill="white" stroke={b} strokeWidth="2.5" />
        <circle cx="0" cy="13" r="4" fill="white" stroke={b} strokeWidth="2.5" />
        <circle cx="18" cy="3" r="4" fill="white" stroke={b} strokeWidth="2.5" />
        <circle cx="18" cy="13" r="4" fill="white" stroke={b} strokeWidth="2.5" />
      </g>
    </g>
  ),
  toy: (
    <g>
      <circle cx="42" cy="46" r="20" fill={y} opacity="0.25" />
      <circle cx="42" cy="46" r="20" stroke={b} strokeWidth="3" fill="none" />
      <path d="M26 36C32 42 32 50 26 56" stroke={b} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M58 36C52 42 52 50 58 56" stroke={b} strokeWidth="2" strokeLinecap="round" fill="none" />
      <ellipse cx="42" cy="46" rx="8" ry="20" stroke={b} strokeWidth="2" fill="none" />
      <ellipse cx="42" cy="48" rx="4" ry="5" fill={b} opacity="0.2" />
      <circle cx="37" cy="42" r="2" fill={b} opacity="0.2" />
      <circle cx="42" cy="39" r="2" fill={b} opacity="0.2" />
      <circle cx="47" cy="42" r="2" fill={b} opacity="0.2" />
      <path d="M58 34L72 20" stroke={b} strokeWidth="4" strokeLinecap="round" />
      <path d="M58 34L72 20" stroke={y} strokeWidth="4" strokeLinecap="round" strokeDasharray="4 6" />
      <circle cx="72" cy="20" r="5" fill={b} opacity="0.15" stroke={b} strokeWidth="2.5" />
      <path d="M30 22L32 18L34 22L32 26Z" fill={y} />
    </g>
  ),
  leash: (
    <g>
      <path d="M34 20C34 12 42 8 50 8C58 8 66 12 66 20L66 28C66 32 62 34 58 34L42 34C38 34 34 32 34 28Z" fill={b} opacity="0.10" />
      <path d="M34 20C34 12 42 8 50 8C58 8 66 12 66 20L66 28C66 32 62 34 58 34L42 34C38 34 34 32 34 28Z" stroke={b} strokeWidth="3" fill="none" />
      <rect x="44" y="10" width="12" height="4" rx="2" fill={y} stroke={b} strokeWidth="1.5" />
      <rect x="46" y="34" width="8" height="8" rx="1" fill={bm} stroke={b} strokeWidth="2.5" />
      <circle cx="50" cy="38" r="2" fill="white" stroke={b} strokeWidth="1.5" />
      <path d="M50 42L50 54Q50 58 46 60L38 64Q34 66 34 70L34 76" stroke={b} strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M30 74L38 74L38 80L30 80Z" fill={bm} stroke={b} strokeWidth="2" />
      <path d="M34 80L34 84" stroke={b} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="66" cy="60" r="8" fill={y} stroke={b} strokeWidth="2" />
      <path d="M66 55L66 58M63 60L69 60" stroke={b} strokeWidth="1.5" strokeLinecap="round" />
    </g>
  ),
  hygiene: (
    <g>
      <path d="M34 30L34 68C34 72 38 74 44 74L56 74C62 74 66 72 66 68L66 30Z" fill={b} opacity="0.10" />
      <path d="M34 30L34 68C34 72 38 74 44 74L56 74C62 74 66 72 66 68L66 30Z" stroke={b} strokeWidth="3" fill="none" />
      <rect x="42" y="20" width="16" height="12" rx="3" fill="white" stroke={b} strokeWidth="3" />
      <rect x="46" y="12" width="8" height="10" rx="2" fill={bm} stroke={b} strokeWidth="2" />
      <path d="M54 16L62 16L62 20L58 22" stroke={b} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M62 22Q64 26 62 30Q60 26 62 22Z" fill={bm} opacity="0.5" />
      <rect x="38" y="42" width="24" height="18" rx="3" fill={y} opacity="0.35" stroke={b} strokeWidth="1.5" />
      <ellipse cx="50" cy="53" rx="3.5" ry="4" fill={b} opacity="0.3" />
      <circle cx="46" cy="48" r="1.8" fill={b} opacity="0.3" />
      <circle cx="50" cy="46" r="1.8" fill={b} opacity="0.3" />
      <circle cx="54" cy="48" r="1.8" fill={b} opacity="0.3" />
      <circle cx="72" cy="36" r="4" fill="none" stroke={bm} strokeWidth="1.5" opacity="0.5" />
      <circle cx="76" cy="28" r="2.5" fill="none" stroke={bm} strokeWidth="1" opacity="0.4" />
    </g>
  ),
  health: (
    <g>
      <path d="M50 72C50 72 22 52 22 34C22 22 32 16 40 16C46 16 50 22 50 22C50 22 54 16 60 16C68 16 78 22 78 34C78 52 50 72 50 72Z" fill={b} opacity="0.10" />
      <path d="M50 72C50 72 22 52 22 34C22 22 32 16 40 16C46 16 50 22 50 22C50 22 54 16 60 16C68 16 78 22 78 34C78 52 50 72 50 72Z" stroke={b} strokeWidth="3" fill="none" />
      <rect x="44" y="30" width="12" height="24" rx="2" fill="white" stroke={b} strokeWidth="2.5" />
      <rect x="38" y="36" width="24" height="12" rx="2" fill="white" stroke={b} strokeWidth="2.5" />
      <rect x="46" y="32" width="8" height="20" rx="1" fill={y} opacity="0.5" />
      <rect x="40" y="38" width="20" height="8" rx="1" fill={y} opacity="0.5" />
      <circle cx="28" cy="24" r="2" fill={y} />
      <circle cx="74" cy="22" r="1.5" fill={y} />
      <path d="M70 48L72 44L74 48L72 52Z" fill={y} opacity="0.6" />
    </g>
  ),
  litter: (
    <g>
      <path d="M20 44L26 72H74L80 44Z" fill={b} opacity="0.10" />
      <path d="M20 44L26 72H74L80 44Z" stroke={b} strokeWidth="3" strokeLinejoin="round" fill="none" />
      <path d="M18 44L82 44" stroke={b} strokeWidth="3" strokeLinecap="round" />
      <path d="M18 44C18 40 24 38 50 38C76 38 82 40 82 44" stroke={b} strokeWidth="3" fill="none" />
      <path d="M28 38C28 22 36 14 50 14C64 14 72 22 72 38" stroke={b} strokeWidth="3" fill="none" />
      <path d="M36 38C36 30 42 26 50 26C58 26 64 30 64 38" fill="white" stroke={b} strokeWidth="2" />
      <path d="M70 28L78 20" stroke={b} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M78 20L82 16" stroke={y} strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="70" cy="30" rx="4" ry="6" fill="none" stroke={b} strokeWidth="2" transform="rotate(-20 70 30)" />
      <circle cx="40" cy="56" r="2" fill={b} opacity="0.15" />
      <circle cx="50" cy="60" r="2.5" fill={b} opacity="0.15" />
      <circle cx="60" cy="54" r="2" fill={b} opacity="0.15" />
    </g>
  ),
  cattree: (
    <g>
      <rect x="30" y="68" width="40" height="6" rx="3" fill={b} opacity="0.15" stroke={b} strokeWidth="2" />
      <rect x="46" y="24" width="8" height="46" fill={y} opacity="0.3" stroke={b} strokeWidth="2" />
      <path d="M46 30L54 34M46 38L54 42M46 46L54 50M46 54L54 58M46 62L54 66" stroke={b} strokeWidth="1.5" opacity="0.3" />
      <rect x="30" y="18" width="40" height="8" rx="4" fill={b} opacity="0.12" stroke={b} strokeWidth="2.5" />
      <rect x="58" y="42" width="22" height="6" rx="3" fill={b} opacity="0.12" stroke={b} strokeWidth="2" />
      <path d="M42 18C42 12 44 8 44 8L48 14L52 8C52 8 54 12 54 18" fill={b} opacity="0.2" />
      <ellipse cx="48" cy="16" rx="6" ry="3" fill={b} opacity="0.15" />
      <circle cx="46" cy="14" r="1" fill={b} />
      <circle cx="50" cy="14" r="1" fill={b} />
      <path d="M78 48L78 58" stroke={b} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="78" cy="60" r="3" fill={y} stroke={b} strokeWidth="1.5" />
    </g>
  ),
  deals: (
    <g>
      <path d="M26 30L50 18L78 30L78 62C78 66 74 70 50 74C26 70 22 66 22 62Z" fill={y} opacity="0.3" />
      <path d="M26 30L50 18L78 30L78 62C78 66 74 70 50 74C26 70 22 66 22 62Z" stroke={b} strokeWidth="3" fill="none" strokeLinejoin="round" />
      <circle cx="42" cy="40" r="6" fill="none" stroke={b} strokeWidth="3" />
      <circle cx="58" cy="56" r="6" fill="none" stroke={b} strokeWidth="3" />
      <path d="M60 36L40 60" stroke={b} strokeWidth="3" strokeLinecap="round" />
      <path d="M24 18L26 12L28 18L26 24Z" fill={y} />
      <path d="M22 18L30 18M26 12L26 24" stroke={b} strokeWidth="1" />
      <path d="M72 14L74 10L76 14L74 18Z" fill={y} />
      <circle cx="80" cy="42" r="2" fill={y} stroke={b} strokeWidth="1" />
      <circle cx="20" cy="52" r="1.5" fill={y} stroke={b} strokeWidth="1" />
      <path d="M50 18L44 8L48 12L42 4" stroke={b} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M50 18L56 8L52 12L58 4" stroke={b} strokeWidth="2" strokeLinecap="round" fill="none" />
    </g>
  ),
  clothing: (
    <g>
      <path d="M30 28L22 38L30 42L30 70L70 70L70 42L78 38L70 28Z" fill={b} opacity="0.10" />
      <path d="M30 28L22 38L30 42L30 70L70 70L70 42L78 38L70 28Z" stroke={b} strokeWidth="3" strokeLinejoin="round" fill="none" />
      <path d="M38 28C38 34 50 38 50 38C50 38 62 34 62 28" stroke={b} strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M30 28L22 38" stroke={b} strokeWidth="3" strokeLinecap="round" />
      <path d="M70 28L78 38" stroke={b} strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="50" cy="54" rx="5" ry="6" fill={y} opacity="0.5" />
      <circle cx="44" cy="46" r="2.5" fill={y} opacity="0.5" />
      <circle cx="50" cy="43" r="2.5" fill={y} opacity="0.5" />
      <circle cx="56" cy="46" r="2.5" fill={y} opacity="0.5" />
      <path d="M50 14L50 22" stroke={b} strokeWidth="2" strokeLinecap="round" />
      <circle cx="50" cy="12" r="3" fill="none" stroke={b} strokeWidth="2" />
      <path d="M36 28L50 20L64 28" stroke={b} strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  ),
  bed: (
    <g>
      <ellipse cx="50" cy="62" rx="30" ry="12" fill={b} opacity="0.10" />
      <ellipse cx="50" cy="62" rx="30" ry="12" stroke={b} strokeWidth="3" fill="none" />
      <path d="M22 56C22 36 32 28 50 28C68 28 78 36 78 56" stroke={b} strokeWidth="3" fill="none" />
      <path d="M22 56C22 36 32 28 50 28C68 28 78 36 78 56" fill={b} opacity="0.06" />
      <ellipse cx="34" cy="42" rx="8" ry="6" fill="white" stroke={b} strokeWidth="2" />
      <ellipse cx="50" cy="38" rx="8" ry="6" fill="white" stroke={b} strokeWidth="2" />
      <ellipse cx="66" cy="42" rx="8" ry="6" fill="white" stroke={b} strokeWidth="2" />
      <ellipse cx="50" cy="62" rx="18" ry="6" fill={y} opacity="0.25" stroke={b} strokeWidth="1.5" />
      <circle cx="44" cy="60" r="1.5" fill={b} opacity="0.15" />
      <circle cx="50" cy="58" r="1.5" fill={b} opacity="0.15" />
      <circle cx="56" cy="61" r="1.5" fill={b} opacity="0.15" />
      <path d="M72 22L78 22L72 28L78 28" stroke={bm} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.5" />
      <path d="M78 14L82 14L78 18L82 18" stroke={bm} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.35" />
    </g>
  ),
  bowl: (
    <g>
      <path d="M20 40C20 40 24 68 50 68C76 68 80 40 80 40" stroke={b} strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M20 40C20 40 24 68 50 68C76 68 80 40 80 40Z" fill={b} opacity="0.10" />
      <ellipse cx="50" cy="40" rx="30" ry="8" fill="white" stroke={b} strokeWidth="3" />
      <ellipse cx="50" cy="40" rx="22" ry="5" fill={y} opacity="0.4" stroke={b} strokeWidth="1.5" />
      <circle cx="40" cy="38" r="3" fill={y} stroke={b} strokeWidth="1.5" />
      <circle cx="50" cy="36" r="3.5" fill={y} stroke={b} strokeWidth="1.5" />
      <circle cx="60" cy="38" r="2.5" fill={y} stroke={b} strokeWidth="1.5" />
      <circle cx="45" cy="34" r="2" fill={y} stroke={b} strokeWidth="1.5" />
      <circle cx="55" cy="34" r="2.5" fill={y} stroke={b} strokeWidth="1.5" />
      <ellipse cx="50" cy="58" rx="4" ry="5" fill={b} opacity="0.15" />
      <circle cx="45" cy="52" r="2" fill={b} opacity="0.15" />
      <circle cx="50" cy="50" r="2" fill={b} opacity="0.15" />
      <circle cx="55" cy="52" r="2" fill={b} opacity="0.15" />
      <path d="M38 28Q40 24 38 20" stroke={bm} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4" />
      <path d="M50 26Q52 22 50 18" stroke={bm} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4" />
      <path d="M62 28Q64 24 62 20" stroke={bm} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4" />
    </g>
  ),
  pad: (
    <g>
      <rect x="22" y="24" width="56" height="48" rx="6" fill={b} opacity="0.08" />
      <rect x="22" y="24" width="56" height="48" rx="6" stroke={b} strokeWidth="3" fill="none" />
      <rect x="30" y="32" width="40" height="32" rx="4" fill={bm} opacity="0.10" stroke={b} strokeWidth="1.5" strokeDasharray="4 3" />
      <path d="M42 44Q44 38 42 34Q40 38 42 44Z" fill={bm} opacity="0.4" stroke={b} strokeWidth="1.5" />
      <path d="M54 48Q56 42 54 38Q52 42 54 48Z" fill={bm} opacity="0.4" stroke={b} strokeWidth="1.5" />
      <path d="M48 52Q50 46 48 42Q46 46 48 52Z" fill={bm} opacity="0.3" stroke={b} strokeWidth="1.5" />
      <path d="M68 8L68 20C68 24 64 28 60 28C56 28 52 24 52 20L52 8Z" fill="white" stroke={b} strokeWidth="2" />
      <path d="M57 14L60 18L65 12" stroke={b} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M22 24L32 24L22 34Z" fill={b} opacity="0.06" stroke={b} strokeWidth="1.5" />
    </g>
  ),
  carrier: (
    <g>
      <path d="M16 36L16 64C16 68 20 72 24 72L76 72C80 72 84 68 84 64L84 36" stroke={b} strokeWidth="3" strokeLinejoin="round" fill="none" />
      <path d="M16 36L16 64C16 68 20 72 24 72L76 72C80 72 84 68 84 64L84 36Z" fill={b} opacity="0.08" />
      <path d="M16 36C16 22 28 14 50 14C72 14 84 22 84 36" stroke={b} strokeWidth="3" fill="none" />
      <path d="M16 36C16 22 28 14 50 14C72 14 84 22 84 36Z" fill={b} opacity="0.05" />
      <circle cx="50" cy="48" r="12" fill="white" stroke={b} strokeWidth="2.5" />
      <path d="M50 36L50 60" stroke={b} strokeWidth="1.5" opacity="0.4" />
      <path d="M38 48L62 48" stroke={b} strokeWidth="1.5" opacity="0.4" />
      <path d="M38 14C38 8 44 4 50 4C56 4 62 8 62 14" stroke={b} strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="26" cy="48" r="2" fill="none" stroke={b} strokeWidth="1.5" />
      <circle cx="26" cy="56" r="2" fill="none" stroke={b} strokeWidth="1.5" />
      <circle cx="74" cy="48" r="2" fill="none" stroke={b} strokeWidth="1.5" />
      <circle cx="74" cy="56" r="2" fill="none" stroke={b} strokeWidth="1.5" />
      <circle cx="46" cy="46" r="2" fill={b} />
      <circle cx="54" cy="46" r="2" fill={b} />
      <circle cx="46.5" cy="45.5" r="0.8" fill="white" />
      <circle cx="54.5" cy="45.5" r="0.8" fill="white" />
    </g>
  ),
};

interface CategoryIllustrationProps {
  type: string;
}

export const CategoryIllustration = ({ type }: CategoryIllustrationProps) => (
  <svg viewBox="0 0 100 88" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {illustrations[type] || illustrations.toy}
  </svg>
);
