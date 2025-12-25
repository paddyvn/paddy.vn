import React from "react";

// Paddy brand icon patterns - simplified SVG icons for decorative use

// Dog face icon (sketch style)
export const DogIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 80 80" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    {/* Ears */}
    <path d="M15 25 Q5 15 10 5 Q20 10 25 25 Z" opacity="0.9"/>
    <path d="M65 25 Q75 15 70 5 Q60 10 55 25 Z" opacity="0.9"/>
    {/* Head */}
    <ellipse cx="40" cy="45" rx="28" ry="25" opacity="0.8"/>
    {/* Eyes */}
    <circle cx="28" cy="40" r="4"/>
    <circle cx="52" cy="40" r="4"/>
    {/* Nose */}
    <ellipse cx="40" cy="52" rx="6" ry="4"/>
    {/* Mouth */}
    <path d="M32 58 Q40 65 48 58" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.6"/>
  </svg>
);

// Cat face icon (sketch style)
export const CatIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 80 80" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    {/* Ears */}
    <path d="M12 35 L5 5 L30 25 Z" opacity="0.9"/>
    <path d="M68 35 L75 5 L50 25 Z" opacity="0.9"/>
    {/* Head */}
    <ellipse cx="40" cy="48" rx="30" ry="26" opacity="0.8"/>
    {/* Eyes */}
    <ellipse cx="26" cy="42" rx="5" ry="6"/>
    <ellipse cx="54" cy="42" rx="5" ry="6"/>
    {/* Nose */}
    <path d="M40 52 L36 58 L44 58 Z"/>
    {/* Whiskers */}
    <line x1="10" y1="50" x2="28" y2="54" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
    <line x1="10" y1="58" x2="28" y2="56" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
    <line x1="70" y1="50" x2="52" y2="54" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
    <line x1="70" y1="58" x2="52" y2="56" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
  </svg>
);

// Paw print icon
export const PawIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 80 80" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    {/* Main pad */}
    <ellipse cx="40" cy="55" rx="18" ry="15"/>
    {/* Toe pads */}
    <ellipse cx="22" cy="32" rx="9" ry="10"/>
    <ellipse cx="58" cy="32" rx="9" ry="10"/>
    <ellipse cx="32" cy="18" rx="8" ry="9"/>
    <ellipse cx="48" cy="18" rx="8" ry="9"/>
  </svg>
);

// Bone icon
export const BoneIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 80 40" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    {/* Left knobs */}
    <circle cx="10" cy="10" r="8"/>
    <circle cx="10" cy="30" r="8"/>
    {/* Right knobs */}
    <circle cx="70" cy="10" r="8"/>
    <circle cx="70" cy="30" r="8"/>
    {/* Center shaft */}
    <rect x="10" y="12" width="60" height="16" rx="2"/>
  </svg>
);

// Fish icon
export const FishIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 80 50" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    {/* Body */}
    <ellipse cx="32" cy="25" rx="26" ry="16"/>
    {/* Tail */}
    <polygon points="60,25 80,8 80,42"/>
    {/* Eye */}
    <circle cx="18" cy="20" r="4" opacity="0.3"/>
    {/* Fin */}
    <path d="M35 12 Q40 5 45 12" opacity="0.6"/>
  </svg>
);

// Second dog face (different style)
export const DogFace2Icon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 80 80" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    {/* Floppy ears */}
    <ellipse cx="12" cy="40" rx="10" ry="20" opacity="0.8"/>
    <ellipse cx="68" cy="40" rx="10" ry="20" opacity="0.8"/>
    {/* Head */}
    <circle cx="40" cy="40" r="25" opacity="0.9"/>
    {/* Eyes */}
    <circle cx="30" cy="35" r="4"/>
    <circle cx="50" cy="35" r="4"/>
    {/* Snout */}
    <ellipse cx="40" cy="48" rx="10" ry="8" opacity="0.7"/>
    {/* Nose */}
    <ellipse cx="40" cy="45" rx="4" ry="3"/>
    {/* Tongue */}
    <ellipse cx="40" cy="58" rx="5" ry="6" opacity="0.6"/>
  </svg>
);

// Second cat face (different style)
export const CatFace2Icon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 80 80" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    {/* Pointy ears */}
    <path d="M15 40 L8 8 L32 30 Z" opacity="0.9"/>
    <path d="M65 40 L72 8 L48 30 Z" opacity="0.9"/>
    {/* Head - more angular */}
    <path d="M12 45 Q12 75 40 75 Q68 75 68 45 Q68 25 40 25 Q12 25 12 45" opacity="0.85"/>
    {/* Eyes - almond shaped */}
    <ellipse cx="28" cy="42" rx="6" ry="5" transform="rotate(-10 28 42)"/>
    <ellipse cx="52" cy="42" rx="6" ry="5" transform="rotate(10 52 42)"/>
    {/* Nose */}
    <path d="M40 50 L36 56 L44 56 Z"/>
    {/* Mouth */}
    <path d="M36 58 Q40 62 44 58" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
  </svg>
);
