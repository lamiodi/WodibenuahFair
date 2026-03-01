import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Header = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
    setIsMenuOpen(false);
  };

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Event Info', path: '/event-info' },
    { label: 'Vendors', path: '/vendors' },
    { label: 'Blog', path: '/blog' },
    { label: 'Register', path: '/register' },
    { label: 'Contact', path: '/contact' },
  ];

  return (
    // Header container with bottom border
    <header className="relative z-50 flex items-center justify-between border-b border-deep-black bg-cream h-[70px]">
      
      {/* Left section - Hamburger menu */}
      <div className="h-full px-6 border-r border-deep-black flex items-center justify-center">
        {/* Hamburger icon using three horizontal lines */}
        <button 
          onClick={toggleMenu}
          className="flex flex-col gap-1.5 p-2 hover:opacity-70 transition-opacity"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
        >
          <span className={`w-6 h-0.5 bg-deep-black transition-transform duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`w-6 h-0.5 bg-deep-black transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`w-6 h-0.5 bg-deep-black transition-transform duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </button>
      </div>
      
      {/* Middle section - Empty space (logo removed) */}
      <div className="flex-1 border-r border-deep-black h-full flex items-center px-6">
      </div>
      
      {/* Right section - Login and Subscribe buttons */}
      <div className="flex h-full">
        
        {isAuthenticated ? (
          <>
            <Link to="/admin" className="h-full px-6 flex items-center gap-2 hover:bg-gray-100 transition-colors border-r border-deep-black">
              <span className="text-sm font-medium text-deep-black">Dashboard</span>
            </Link>
            <button 
                onClick={handleLogout}
                className="h-full px-6 flex items-center gap-2 hover:bg-gray-100 transition-colors border-r border-deep-black"
            >
              <span className="text-sm font-medium text-deep-black">Logout</span>
            </button>
          </>
        ) : (
            /* Login button with user icon */
            <Link to="/admin/login" className="h-full px-6 flex items-center gap-2 hover:bg-gray-100 transition-colors border-r border-deep-black">
            <span className="text-sm font-medium text-deep-black">Admin</span>
            {/* User icon SVG */}
            <svg 
                className="w-4 h-4 text-deep-black" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                />
            </svg>
            </Link>
        )}
        
        {/* Register button with arrow - dark background */}
        <Link to="/register" className="h-full px-8 flex items-center gap-3 bg-deep-black text-white hover:bg-gray-800 transition-colors">
          <span className="text-sm font-medium tracking-wide">Register</span>
          {/* Arrow icon pointing to top-right */}
          <svg 
            className="w-3 h-3" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M7 17L17 7M17 7H7M17 7V17" 
            />
          </svg>
        </Link>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="absolute top-[70px] left-0 w-full bg-cream border-b border-deep-black shadow-lg flex flex-col animate-in fade-in slide-in-from-top-5 duration-200">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMenuOpen(false)}
              className="p-4 border-b border-deep-black/10 hover:bg-black/5 text-deep-black font-medium transition-colors text-center uppercase tracking-widest"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};

export default Header;
