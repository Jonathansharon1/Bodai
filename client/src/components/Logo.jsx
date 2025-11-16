import React from 'react';

export default function Logo({ size = 24, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outermost circle - lightest blue */}
      <circle cx="32" cy="32" r="30" stroke="#87CEEB" strokeWidth="2" fill="none" />
      {/* Third circle - light blue */}
      <circle cx="32" cy="32" r="22" stroke="#5BA3D0" strokeWidth="2" fill="none" />
      {/* Second circle - medium blue */}
      <circle cx="32" cy="32" r="14" stroke="#3498DB" strokeWidth="2" fill="none" />
      {/* Innermost circle - solid vibrant blue */}
      <circle cx="32" cy="32" r="8" fill="#2980B9" />
    </svg>
  );
}


