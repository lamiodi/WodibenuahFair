import React from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-cream text-deep-black font-body flex flex-col">
      <Navigation />
      
      <div className="flex-grow flex items-center justify-center px-4 py-20 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
           <div className="absolute top-1/4 left-1/4 text-[20vw] font-heading font-bold text-deep-black transform -translate-x-1/2 -translate-y-1/2 rotate-12">404</div>
        </div>

        <div className="bg-white p-12 md:p-20 border border-deep-black max-w-3xl text-center relative z-10 shadow-[10px_10px_0px_0px_rgba(33,32,28,1)]">
          <div className="absolute top-0 left-0 w-full h-2 bg-deep-black"></div>
          
          <p className="text-gold font-bold tracking-[0.3em] uppercase mb-4 text-sm">Page Not Found</p>
          
          <h1 className="text-5xl md:text-8xl font-heading font-normal uppercase text-deep-black mb-8 leading-none">
            Lost In<br/>Luxury?
          </h1>
          
          <div className="w-24 h-[2px] bg-deep-black mx-auto mb-10"></div>
          
          <p className="text-lg md:text-xl text-gray-600 mb-12 leading-relaxed max-w-lg mx-auto">
            The page you are looking for seems to have been moved, deleted, or does not exist.
          </p>
          
          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <Link 
              to="/" 
              className="bg-deep-black text-white px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-deep-black border border-deep-black transition-all duration-300"
            >
              Back to Home
            </Link>
            <Link 
              to="/contact" 
              className="px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] text-deep-black border border-deep-black hover:bg-deep-black hover:text-white transition-all duration-300"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default NotFound;
