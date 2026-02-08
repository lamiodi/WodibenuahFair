import React from 'react';

const ExhibitionHighlightVideo = () => {
  return (
    <section className="bg-cream border-b border-deep-black relative overflow-hidden">
      {/* Background Element */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent pointer-events-none"></div>

      {/* Section Header */}
      <div className="container mx-auto px-4 md:px-8 pt-12 md:pt-24">
        <div className="text-center">
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-gold block mb-2">Experience The Magic</span>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-heading font-bold text-deep-black uppercase tracking-tight">
            Wodibenuah <span className="text-gold">Fair</span>
          </h2>
        </div>
      </div>

      <div className="w-full max-w-[280px] md:max-w-sm mx-auto pb-16 md:pb-32 pt-8 md:pt-12">

          {/* Video Player Container */}
          <div className="relative group">
            
            <div className="relative aspect-[9/14] border-2 border-deep-black bg-white p-2 md:p-4 shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] hover:shadow-[20px_20px_0px_0px_rgba(212,175,55,1)] transition-all duration-500">
              <div className="w-full h-full bg-deep-black relative overflow-hidden border border-deep-black">
                 <iframe 
                  src="https://www.youtube.com/embed/etteCqunX78" 
                  title="Wodibenuah Fair Highlights"
                  className="absolute inset-0 w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 transition-all duration-700"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>

              {/* Decorative Corners - Scaled Up */}
              <div className="absolute top-0 left-0 w-8 h-8 md:w-12 md:h-12 border-t-4 border-l-4 border-deep-black transition-all duration-500 group-hover:w-16 group-hover:h-16"></div>
              <div className="absolute top-0 right-0 w-8 h-8 md:w-12 md:h-12 border-t-4 border-r-4 border-deep-black transition-all duration-500 group-hover:w-16 group-hover:h-16"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 md:w-12 md:h-12 border-b-4 border-l-4 border-deep-black transition-all duration-500 group-hover:w-16 group-hover:h-16"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 md:w-12 md:h-12 border-b-4 border-r-4 border-deep-black transition-all duration-500 group-hover:w-16 group-hover:h-16"></div>
            </div>

            {/* Bottom Label */}
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 px-10 py-4 bg-deep-black border-2 border-deep-black text-white text-xs md:text-sm font-bold uppercase tracking-[0.2em] shadow-xl hover:bg-gold hover:text-deep-black transition-colors duration-300 cursor-pointer z-10">
              Watch Highlights
            </div>
          </div>
        </div>
    </section>
  );
};

export default ExhibitionHighlightVideo;
