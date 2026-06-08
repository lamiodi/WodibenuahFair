import React from 'react';

const VenueMap = () => {
  return (
    <div className="w-full h-[500px] border border-deep-black relative z-0 bg-gray-100 flex items-center justify-center overflow-hidden group">
      {/* Background Image (Optional - Use a generic venue or abstract map image) */}
      <div className="absolute inset-0 z-0">
          <img 
            src="https://res.cloudinary.com/dwmz4youk/image/upload/v1779310067/wodifair/Lagosdecember12thedition.png" 
            alt="Venue Location" 
            className="w-full h-full object-cover opacity-30 grayscale group-hover:grayscale-0 transition-all duration-700 transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-deep-black/10"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center p-8 max-w-lg bg-white/90 backdrop-blur-sm border border-deep-black shadow-xl">
        <div className="w-16 h-16 bg-deep-black rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        
        <h3 className="text-3xl font-heading font-bold uppercase mb-2 text-deep-black">
          Venue Location
        </h3>
        <p className="text-gold font-bold tracking-[0.2em] uppercase text-xs mb-6">
          Coming Soon
        </p>
        
        <div className="w-12 h-[2px] bg-deep-black mx-auto mb-6"></div>

        <p className="text-gray-600 mb-8 leading-relaxed">
          We are finalizing the exact coordinates for our main exhibition hall in Lagos. 
          Stay tuned for the official map update!
        </p>

        <div className="flex flex-col gap-3 text-xs font-bold uppercase tracking-wider text-deep-black">
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            <span>Venue TBD, Lagos</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span>December 12th, 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueMap;
