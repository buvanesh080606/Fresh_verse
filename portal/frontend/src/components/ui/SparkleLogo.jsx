import React from 'react';

/**
 * SparkleLogo — Three clustered four-pointed sparkle/star shapes in
 * red (#EA4335), orange-yellow (#FBBC05), and green (#34A853).
 *
 * The component accepts:
 *   - `className`  – Tailwind / CSS classes forwarded to the <svg> element
 *   - `size`       – pixel size shorthand (width & height), default 24
 *   - `style`      – inline style overrides
 *
 * Background is fully transparent so it works on both light and dark themes.
 */
const SparkleLogo = ({ className = '', size = 24, style = {} }) => {
  // A four-pointed sparkle path centred at (cx,cy) with outer radius r
  // and inner radius r*0.25.  Points at top/right/bottom/left.
  const sparkle = (cx, cy, r) => {
    const ri = r * 0.25; // inner pinch radius
    return [
      `M ${cx} ${cy - r}`,          // top
      `Q ${cx + ri} ${cy - ri} ${cx + r} ${cy}`,  // right
      `Q ${cx + ri} ${cy + ri} ${cx} ${cy + r}`,  // bottom
      `Q ${cx - ri} ${cy + ri} ${cx - r} ${cy}`,  // left
      `Q ${cx - ri} ${cy - ri} ${cx} ${cy - r}`,  // back to top
      'Z'
    ].join(' ');
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      className={className}
      style={style}
      aria-label="FreshVerse AI logo"
    >
      {/* Red sparkle — top-left, slightly larger anchor */}
      <path d={sparkle(7.5, 7.5, 5.5)} fill="#EA4335" />

      {/* Yellow/orange sparkle — top-right, slightly smaller */}
      <path d={sparkle(16, 8, 4.5)} fill="#FBBC05" />

      {/* Green sparkle — bottom-centre */}
      <path d={sparkle(11.5, 16.5, 5)} fill="#34A853" />
    </svg>
  );
};

export default SparkleLogo;
