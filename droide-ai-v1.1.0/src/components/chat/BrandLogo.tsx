import React from 'react';

export const BrandLogo = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
    <line x1="250" y1="250" x2="250" y2="118" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
    <line x1="250" y1="250" x2="362" y2="150" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
    <line x1="250" y1="250" x2="386" y2="255" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
    <line x1="250" y1="250" x2="348" y2="367" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
    <line x1="250" y1="250" x2="136" y2="305" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
    <line x1="250" y1="250" x2="148" y2="175" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
    <circle cx="250" cy="110" r="22" fill="transparent" stroke="currentColor" strokeWidth="7"/>
    <circle cx="370" cy="140" r="22" fill="transparent" stroke="currentColor" strokeWidth="7"/>
    <circle cx="390" cy="258" r="22" fill="transparent" stroke="currentColor" strokeWidth="7"/>
    <circle cx="355" cy="378" r="22" fill="transparent" stroke="currentColor" strokeWidth="7"/>
    <circle cx="122" cy="314" r="22" fill="transparent" stroke="currentColor" strokeWidth="7"/>
    <circle cx="135" cy="165" r="22" fill="transparent" stroke="currentColor" strokeWidth="7"/>
    <circle cx="250" cy="250" r="38" fill="transparent" stroke="currentColor" strokeWidth="9"/>
  </svg>
);
