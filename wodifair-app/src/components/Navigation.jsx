import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Navigation = ({ activeItem = 'Exhibition' }) => {
  const scrollContainerRef = useRef(null);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(true);

  // Navigation items configuration with keyword-rich labels for SEO
  const navItems = [
    { label: 'Home', route: '/', ariaLabel: 'Wodifair Home Page' },
    { label: 'Vendor Registration', route: '/register', ariaLabel: 'Register as a Vendor for Wodifair' },
    { label: 'About Wodifair', route: '/about', ariaLabel: 'About Wodifair Exhibition' },
    { label: 'Exhibition Info', route: '/event-info', ariaLabel: 'Exhibition Event Details' },
    { label: 'Vendor Showcase', route: '/vendors', ariaLabel: 'View Participating Vendors' },
    { label: 'Fair News', route: '/blog', ariaLabel: 'Wodifair Blog and News' },
    { label: 'Contact Support', route: '/contact', ariaLabel: 'Contact Wodifair Support' },
  ];

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftGradient(scrollLeft > 0);
      setShowRightGradient(scrollLeft < scrollWidth - clientWidth - 5); // 5px buffer
    }
  };

  const handleInteraction = () => {
    // Haptic feedback for mobile devices
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial check
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <nav className="border-b border-deep-black py-4 relative z-40 bg-cream" aria-label="Main Navigation">
      {/* Horizontal Scroll Container Wrapper */}
      <div className="relative">
        
        {/* Left Gradient Indicator */}
        <div 
          className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-cream to-transparent z-10 transition-opacity duration-300 pointer-events-none ${showLeftGradient ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Scrollable List */}
        <div 
          ref={scrollContainerRef}
          className="flex items-center justify-between gap-8 px-4 md:px-12 max-w-[1920px] mx-auto overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory"
        >
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.route}
              aria-label={item.ariaLabel}
              onClick={handleInteraction}
              className={`
                snap-center
                text-[10px] md:text-sm font-bold uppercase tracking-[0.15em] whitespace-nowrap py-2 flex-shrink-0
                transition-all duration-200 hover:opacity-70
                ${activeItem === item.label || (item.label === 'Home' && activeItem === 'Home') || (item.label.includes(activeItem)) // Simple matching logic
                  ? 'opacity-100 border-b-2 border-deep-black' 
                  : 'opacity-60 hover:opacity-100 border-b-2 border-transparent'
                }
              `}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right Gradient Indicator */}
        <div 
          className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-cream to-transparent z-10 transition-opacity duration-300 pointer-events-none ${showRightGradient ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>
    </nav>
  );
};

export default Navigation;
