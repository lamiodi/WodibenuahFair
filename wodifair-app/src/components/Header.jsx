import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Header = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    // Header container with bottom border
    <header className="flex items-center justify-between border-b border-deep-black bg-cream h-[70px]">
      
      {/* Left section - Hamburger menu */}
      <div className="h-full px-6 border-r border-deep-black flex items-center justify-center">
        {/* Hamburger icon using three horizontal lines */}
        <button className="flex flex-col gap-1.5 p-2 hover:opacity-70 transition-opacity">
          <span className="w-6 h-0.5 bg-deep-black"></span>
          <span className="w-6 h-0.5 bg-deep-black"></span>
          <span className="w-6 h-0.5 bg-deep-black"></span>
        </button>
      </div>
      
      {/* Middle section - Empty space (logo could go here) */}
      <div className="flex-1 border-r border-deep-black h-full flex items-center px-6">
        <Link to="/" className="text-xl font-heading font-bold uppercase tracking-wider">
            Wodifair
        </Link>
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
    </header>
  );
};

export default Header;
