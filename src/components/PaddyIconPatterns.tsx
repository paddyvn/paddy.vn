import React from "react";

// Paddy brand dog icon - extracted from the official brand SVG
export const DogIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 400 400" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M158.79,127.73c-1.55-13.48-1.26-27.19.99-40.57,1.13-6.69,2.71-13.3,4.75-19.78,1.02-3.24,2.15-6.44,3.39-9.59.58-1.48,1.19-2.95,1.83-4.41.56-1.27,1.09-2.65,1.93-3.76,1.83-2.42,4.83-1.03,7.16-.13,2.64,1.02,5.17,2.35,7.58,3.84,5,3.09,9.4,7.03,13.38,11.33s7.58,9.08,10.91,13.96c2.75,4.04,6.71,9.06,6.28,14.27-.22,2.62-2.31,3.99-4.85,4.56-3.47.79-7.18.89-10.72.84-7.68-.1-15.25-1.69-22.37-4.56-1.25-.5-2.75.55-3.08,1.75-.39,1.43.49,2.57,1.75,3.08,6.96,2.8,14.39,4.37,21.88,4.68,3.86.16,7.72-.04,11.55-.57,3.16-.44,6.46-1.34,8.58-3.91,4.19-5.07,1.77-12.13-1.15-17.19-3.17-5.49-7.08-10.72-11.08-15.63s-8.71-9.76-13.93-13.73c-2.52-1.92-5.19-3.66-8.01-5.12s-6.15-3.08-9.4-3.65c-3.81-.67-6.95.78-9.02,3.99-1.92,2.97-3.1,6.59-4.37,9.88-2.61,6.75-4.71,13.7-6.29,20.76-3.64,16.26-4.6,33.11-2.69,49.67.15,1.34,1.04,2.5,2.5,2.5,1.23,0,2.66-1.15,2.5-2.5h0Z"/>
    <path d="M187.74,101.53c-7.36,9.67-12.28,21.19-14.18,33.19-.21,1.33.34,2.69,1.75,3.08,1.19.33,2.86-.4,3.08-1.75,1.84-11.65,6.53-22.61,13.67-32,.82-1.08.17-2.8-.9-3.42-1.28-.75-2.6-.18-3.42.9h0Z"/>
    <path d="M114.87,127.72c-6.13-10.51-11.33-21.55-15.48-32.99-2.06-5.68-3.86-11.44-5.41-17.28-.77-2.92-1.48-5.85-2.13-8.8-.59-2.7-1.58-5.83-.68-8.56,1.57-4.73,7.3-6,11.65-5.53,5.69.62,11.37,3.3,16.39,5.94s10.11,5.98,14.83,9.48c2.33,1.73,4.64,3.5,6.85,5.38,1.97,1.67,4,3.56,5.06,5.96.86,1.96,1.08,4.63-.27,6.43-1.61,2.15-5.08,2.33-7.49,2.71-7.2,1.12-14.46,1.88-21.74,2.33-3.2.2-3.22,5.2,0,5,7.16-.44,14.3-1.2,21.39-2.25,3.12-.46,6.56-.77,9.3-2.49s4.08-4.32,4.42-7.36c.7-6.34-3.85-11.24-8.41-14.93-5.12-4.14-10.43-8.1-16.05-11.53s-11.5-6.35-17.73-8.3-13.04-2.43-18.37,1.56c-2.3,1.72-4.18,4.11-4.82,6.96-.79,3.51.11,7.09.87,10.53,1.42,6.49,3.15,12.91,5.19,19.23,4.61,14.28,10.77,28.07,18.33,41.04,1.62,2.78,5.94.26,4.32-2.52h0Z"/>
    <path d="M128.03,96.74c-.81,5.98-.93,11.93.04,17.9s3.03,11.41,5.82,16.59c1.53,2.83,5.85.31,4.32-2.52-5.11-9.47-6.81-20-5.36-30.64.18-1.34-.32-2.68-1.75-3.08-1.17-.32-2.89.4-3.08,1.75h0Z"/>
    <path d="M147.34,148.01c6.72-2.2,14.38.19,18.4,6.09,4.2,6.16,2.4,14.36-2.91,19.27-4.39,4.07-11.31,6.54-17.22,4.9s-8.95-7.32-9.16-12.95c-.24-6.79,4.06-15.09,10.88-17.32,3.05-.99,1.74-5.82-1.33-4.82-8.16,2.66-13.77,11.39-14.49,19.71-.65,7.46,2.82,15.7,9.81,19.06,7.36,3.55,16.51,1.49,22.86-3.26,7.47-5.59,11.29-15.74,7.31-24.56-4.26-9.44-15.76-14.14-25.49-10.95-3.04,1-1.74,5.83,1.33,4.82h0Z"/>
  </svg>
);

// Cat face icon - simplified line art style
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

// Second dog face (different style - floppy ears)
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

// Second cat face (different style - more angular)
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
