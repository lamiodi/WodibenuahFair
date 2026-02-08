import React from 'react';
import { Link } from 'react-router-dom';

const SponsorshipCTA = () => {
  return (
    <section className="border-b border-deep-black">
      <div className="flex flex-col lg:flex-row min-h-[500px]">
        
        {/* Left: Text Content - Dark Theme */}
        <div className="lg:w-1/2 bg-deep-black text-white p-12 md:p-20 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-gray-800">
          <span className="inline-block px-3 py-1 border border-white/30 text-[10px] font-bold tracking-[0.2em] uppercase mb-8 w-fit text-gold">
            Partnership
          </span>
          
          <h2 className="text-4xl md:text-6xl font-heading font-medium uppercase leading-[0.9] mb-6">
            Become A<br/>Sponsor
          </h2>
          
          <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-md mb-10">
            Align your brand with excellence. Join Wodibenuah Fair as a strategic partner and connect with a discerning audience of luxury enthusiasts, industry leaders, and trendsetters across Africa.
          </p>
          
          <div className="flex flex-wrap gap-6">
            <Link 
              to="/contact?type=Sponsorship" 
              className="px-8 py-4 bg-white text-deep-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-gold hover:text-white transition-all duration-300"
            >
              Partner With Us
            </Link>
          </div>
        </div>

        {/* Right: Image - Grayscale to Color hover effect */}
        <div className="lg:w-1/2 relative min-h-[400px] group overflow-hidden bg-gray-900">
          <img 
            src="/images/IMG_3763.JPG.jpeg" 
            alt="Sponsorship Opportunity"
            className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000 scale-100 group-hover:scale-105"
          />
          
          {/* Overlay Text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[80%] h-[80%] border border-white/20 flex items-center justify-center">
              <span className="text-white/20 font-heading text-8xl md:text-9xl font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                JOIN US
              </span>
            </div>
          </div>
        </div>
        
      </div>
    </section>
  );
};

export default SponsorshipCTA;
