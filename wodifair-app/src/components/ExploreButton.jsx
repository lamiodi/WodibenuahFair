import React from 'react';

const ExploreButton = ({ text = "Explore Now", onClick, className = "", variant = "dark" }) => {
  const baseStyles = "px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] inline-flex items-center gap-3 transition-all duration-300 border border-deep-black group relative overflow-hidden";
  
  const variants = {
    dark: "bg-deep-black text-white hover:bg-gold hover:text-deep-black hover:border-gold",
    light: "bg-white text-deep-black hover:bg-gold hover:text-white hover:border-gold"
  };

  return (
    <button 
      onClick={onClick}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${className}
      `}
    >
      {/* Button text */}
      <span>{text}</span>
      
      {/* Arrow icon */}
      <svg 
        className="w-4 h-4" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M7 17L17 7M17 7H7M17 7V17" 
        />
      </svg>
    </button>
  );
};

export default ExploreButton;
