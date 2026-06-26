import React from 'react';

interface TokenIconProps {
  className?: string;
  size?: number;
}

export function TokenIcon({ className = 'w-4 h-4', size }: TokenIconProps) {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <svg 
      className={`inline-block select-none align-middle ${className}`} 
      style={style}
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer gold glow ring */}
      <circle cx="12" cy="12" r="10" fill="url(#goldGradient)" stroke="#fbbf24" strokeWidth="1.5" />
      {/* Inner dotted border */}
      <circle cx="12" cy="12" r="8" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="1" strokeDasharray="2 1.5" />
      
      {/* Stylized Paw Print in center representing the 'Hau-Hau' brand */}
      {/* Main bottom pad */}
      <path 
        d="M12 15.5C10.7 15.5 9.8 14.4 10.0 13.3C10.2 12.1 11.2 11.5 12 11.5C12.8 11.5 13.8 12.1 14.0 13.3C14.2 14.4 13.3 15.5 12 15.5Z" 
        fill="#78350f" 
      />
      {/* Left toe */}
      <circle cx="8.5" cy="11.0" r="1.5" fill="#78350f" />
      {/* Middle-left toe */}
      <circle cx="10.5" cy="9.0" r="1.5" fill="#78350f" />
      {/* Middle-right toe */}
      <circle cx="13.5" cy="9.0" r="1.5" fill="#78350f" />
      {/* Right toe */}
      <circle cx="15.5" cy="11.0" r="1.5" fill="#78350f" />

      {/* Shiny gold gradient */}
      <defs>
        <linearGradient id="goldGradient" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="35%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
    </svg>
  );
}
