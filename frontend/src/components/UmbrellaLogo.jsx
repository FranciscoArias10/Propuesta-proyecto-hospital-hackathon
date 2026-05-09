import React from 'react';

const UmbrellaLogo = ({ size = 24, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 
        Octagon-like umbrella with 8 segments.
        Center is (50, 50), radius is 45.
        Segments: 0-45, 45-90, 90-135, etc.
      */}
      {[...Array(8)].map((_, i) => {
        const startAngle = (i * 45 - 22.5) * (Math.PI / 180);
        const endAngle = ((i + 1) * 45 - 22.5) * (Math.PI / 180);
        const x1 = 50 + 50 * Math.cos(startAngle);
        const y1 = 50 + 50 * Math.sin(startAngle);
        const x2 = 50 + 50 * Math.cos(endAngle);
        const y2 = 50 + 50 * Math.sin(endAngle);
        
        // Color alternating: i=0 (top-ish) red, i=1 white...
        // Adjusted to match the image: top is red.
        const color = i % 2 === 0 ? "#EE2B2E" : "#FFFFFF";
        
        return (
          <path
            key={i}
            d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
            fill={color}
            stroke="#000000"
            strokeWidth="1"
          />
        );
      })}
      {/* Center point cover to make it cleaner */}
      <circle cx="50" cy="50" r="1.5" fill="#000000" />
    </svg>
  );
};

export default UmbrellaLogo;
