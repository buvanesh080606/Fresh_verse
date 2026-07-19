import React from 'react';

/**
 * FreshverseLogo — Custom project logo.
 * Three stacked four-pointed sparkle/star shapes in dark-brown, mid-brown,
 * and terracotta on a warm blush rounded-rect background.
 *
 * Props:
 *   size      — px dimension (width = height), default 36
 *   className — forwarded to the outer <svg>
 */
const FreshverseLogo = ({ size = 36, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="FreshVerse AI logo"
  >
    {/* Rounded background */}
    <rect x="0" y="0" width="200" height="200" rx="40" fill="#F3D9CC" />

    {/* Top sparkle — dark brown */}
    <path
      d="M100 35 C102 58, 110 66, 133 68 C110 70, 102 78, 100 101
         C98 78, 90 70, 67 68 C90 66, 98 58, 100 35 Z"
      fill="#3D2418"
    />

    {/* Middle sparkle — mid brown */}
    <path
      d="M100 73 C101 90, 108 96, 125 98 C108 100, 101 106, 100 123
         C99 106, 92 100, 75 98 C92 96, 99 90, 100 73 Z"
      fill="#8B4A2E"
    />

    {/* Bottom sparkle — terracotta */}
    <path
      d="M100 101 C101 114, 106 119, 119 121 C106 123, 101 128, 100 141
         C99 128, 94 123, 81 121 C94 119, 99 114, 100 101 Z"
      fill="#C97B5A"
    />
  </svg>
);

export default FreshverseLogo;
