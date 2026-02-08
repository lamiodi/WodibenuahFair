import React, { useState } from 'react';

const EventHighlights = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const highlights = [
    {
      id: 1,
      title: "VIP Experience",
      badge: "Premium",
      description: "Exclusive access to our premium lounge with complimentary champagne and networking opportunities.",
      mediaType: "video",
      src: "/images/WhatsApp Video 2026-02-08 at 2.01.02 PM.mp4"
    },
    {
      id: 2,
      title: "Fashion Runway",
      badge: "Exclusive",
      description: "Witness the latest trends from top designers in our signature fashion showcase.",
      mediaType: "youtube",
      src: "https://www.youtube.com/embed/55MjbB_eybM?si=x5lpd5GUCfWFy8nY"
    },
    {
      id: 3,
      title: "Gourmet Dining",
      badge: "Curated",
      description: "Savor exquisite culinary delights from world-class chefs and premium food vendors.",
      mediaType: "youtube",
      src: "https://www.youtube.com/embed/ME9KMYeRYcM?si=RtX2jgDVa69yXYX4"
    }
  ];

  return (
    <section className="bg-cream border-b border-deep-black">
      <div className="border-b border-deep-black p-4 md:p-6 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-deep-black">Event Highlights</span>
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-gold">Discover</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-0">
          {highlights.map((item, index) => (
            <div
              key={item.id}
              className={`border-b md:border-b-0 md:border-r last:border-r-0 border-deep-black p-8 md:p-10 transition-all duration-300 cursor-pointer ${
                activeIndex === index ? 'bg-white' : 'hover:bg-white'
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <div className="relative overflow-hidden mb-6 aspect-[4/5] border-2 border-deep-black">
                {/* Overlay only for local video if desired, or removed to let videos shine. 
                    Given the requirement for YouTube interaction, we should probably remove the overlay 
                    or make it pointer-events-none, but YouTube iframes need pointer events.
                    Let's keep the overlay logic but make it invisible for active items.
                 */}
                <div className={`absolute inset-0 bg-deep-black/20 transition-opacity duration-500 z-10 pointer-events-none ${
                  activeIndex === index ? 'opacity-0' : 'opacity-100'
                }`} />
                
                {item.mediaType === 'video' ? (
                  <video
                    src={item.src}
                    className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
                      activeIndex === index ? 'scale-110' : 'scale-100'
                    }`}
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                   <iframe 
                     src={item.src} 
                     title={item.title} 
                     frameBorder="0" 
                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                     referrerPolicy="strict-origin-when-cross-origin" 
                     allowFullScreen
                     className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
                       activeIndex === index ? 'scale-100' : 'scale-100' /* Avoid scaling iframes to prevent blur/issues */
                     }`}
                   ></iframe>
                )}
                
                <div className="absolute top-4 right-4 z-20 pointer-events-none">
                  <span className="bg-gold text-deep-black text-[10px] font-bold px-3 py-1 uppercase tracking-widest border border-deep-black">
                    {item.badge}
                  </span>
                </div>

                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white pointer-events-none"></div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <span className={`h-[2px] transition-all duration-300 ${
                  activeIndex === index ? 'w-12 bg-gold' : 'w-8 bg-deep-black'
                }`}></span>
                <span className={`text-xs font-bold tracking-[0.2em] uppercase transition-colors ${
                  activeIndex === index ? 'text-gold' : 'text-gray-500'
                }`}>
                  0{index + 1}
                </span>
              </div>

              <h3 className={`text-2xl md:text-3xl font-heading font-bold uppercase mb-4 transition-colors ${
                activeIndex === index ? 'text-gold' : 'text-deep-black'
              }`}>
                {item.title}
              </h3>
              
              <p className="text-gray-600 font-body leading-relaxed text-sm md:text-base">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EventHighlights;
