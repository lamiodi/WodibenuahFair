import React from 'react';
import { Link } from 'react-router-dom';

const Navigation = ({ activeItem = 'Exhibition' }) => {
  // Navigation items configuration
  const navItems = [
    { label: 'Home', route: '/' },
    { label: 'About', route: '/about' },
    { label: 'Event Info', route: '/event-info' },
    { label: 'Vendors', route: '/vendors' },
    { label: 'Blog', route: '/blog' },
    { label: 'Register', route: '/register' },
    { label: 'Contact', route: '/contact' },
  ];

  return (
    <nav className="border-b border-deep-black py-4 relative z-40 bg-cream">
      {/* Horizontal Scroll Container */}
      <div className="flex items-center justify-between px-4 md:px-8 overflow-x-auto no-scrollbar scroll-smooth">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.route}
            className={`
              text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] whitespace-nowrap px-4 py-2 flex-shrink-0
              transition-all duration-200 hover:opacity-70
              ${activeItem === item.label 
                ? 'opacity-100' 
                : 'opacity-60 hover:opacity-100'
              }
            `}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
