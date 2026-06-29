'use client';

import React, { useState } from 'react';
import { Question } from '@phosphor-icons/react';

interface InfoTagProps {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

export function InfoTag({ text, position = 'top', className = '' }: InfoTagProps) {
  const [visible, setVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    'top-left': 'bottom-full left-0 mb-2',
    'top-right': 'bottom-full right-0 mb-2',
    'bottom-left': 'top-full left-0 mt-2',
    'bottom-right': 'top-full right-0 mt-2'
  };

  return (
    <span 
      className={`relative inline-flex items-center justify-center cursor-help text-text-muted hover:text-primary transition-colors duration-150 ml-1.5 select-none ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onClick={() => setVisible(!visible)}
    >
      <Question size={13} weight="bold" className="opacity-70 hover:opacity-100" />
      {visible && (
        <span className={`absolute z-50 w-52 p-2.5 text-[10px] font-sans font-medium text-foreground bg-surface-container border border-border rounded-lg shadow-2xl leading-normal normal-case text-left transition-opacity duration-200 ${positionClasses[position]}`}>
          {text}
        </span>
      )}
    </span>
  );
}

export default InfoTag;
