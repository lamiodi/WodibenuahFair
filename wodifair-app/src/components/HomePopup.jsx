import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const HomePopup = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if popup has been shown in this session/day
    const lastShown = localStorage.getItem('wodifair_popup_shown');
    const now = new Date().getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    // Show popup if it hasn't been shown in the last 24 hours
    if (!lastShown || now - parseInt(lastShown) > oneDay) {
      // Small delay so it doesn't appear instantly on load (better UX)
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Prevent body scroll when popup is open
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    // Set flag in local storage
    localStorage.setItem('wodifair_popup_shown', new Date().getTime().toString());
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 md:px-0">
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-deep-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Popup Content */}
          <motion.div 
            className="relative bg-white w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-deep-black"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Close Button */}
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-white rounded-full text-deep-black hover:bg-deep-black hover:text-white transition-colors border border-deep-black"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            {/* Image Section (Left) */}
            <div className="w-full md:w-1/2 h-64 md:h-auto relative">
              <img 
                src="/images/IMG_3766.JPG.jpeg" 
                alt="Wodifair Atmosphere" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-deep-black/20"></div>
              {/* Badge */}
              <div className="absolute top-6 left-6 bg-gold text-deep-black text-[10px] font-bold uppercase tracking-widest px-3 py-1">
                Next Event
              </div>
            </div>

            {/* Text Section (Right) */}
            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-cream relative">
              <div className="mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">BMO EVENT CENTER, Wuse 2</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-heading font-medium text-deep-black uppercase leading-none mb-6">
                Registration<br/>Is Now Open
              </h2>
              
              <p className="text-gray-600 text-sm leading-relaxed mb-8">
                Join over 200+ premium vendors at the Abuja edition this May. Secure your prime booth location before they sell out.
              </p>

              <div className="flex flex-col gap-3">
                <Link 
                  to="/register?location=Abuja" 
                  onClick={handleClose}
                  className="w-full bg-deep-black text-white text-center py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gold hover:text-deep-black transition-all duration-300"
                >
                  Book Your Booth
                </Link>
                
                <button 
                  onClick={handleClose}
                  className="w-full bg-transparent border border-deep-black text-deep-black text-center py-3 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-100 transition-colors"
                >
                  Maybe Later
                </button>
              </div>

              {/* Bottom Info */}
              <div className="mt-8 pt-8 border-t border-gray-200 text-xs text-gray-400 flex items-center justify-between">
                <span>May 23rd & 24th, 2026 • Abuja</span>
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Registration Closes Soon
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default HomePopup;
