import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '../services/api';

const UpcomingEvents = ({ title = "Upcoming Events" }) => {
  const [activeEventIndex, setActiveEventIndex] = useState(0);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await apiRequest('/events');
        
        // Map API data to component structure
        const mappedEvents = data.map(event => {
          const startDate = new Date(event.start_date);
          const dateStr = startDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();
          
          // Simple extraction for city (assuming "Venue, City" or just "City")
          const locationParts = event.location.split(',');
          const city = locationParts.length > 1 ? locationParts[locationParts.length - 1].trim() : event.location;
          
          return {
            id: event.id,
            date: dateStr,
            title: event.title,
            subtitle: "The Main Event", // Default or extract from description
            category: "Exhibition", // Default
            location: event.location,
            city: city,
            image: event.image_url || "/images/Wodi SM (17).png",
            mapUrl: event.map_link || `https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&t=&z=13&ie=UTF8&iwloc=&output=embed`,
            directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.location)}`
          };
        });

        setEvents(mappedEvents);
        setLoading(false);
      } catch (err) {
        console.error("Error loading events:", err);
        setError("Could not load events.");
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[400px] bg-cream border-b border-deep-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-deep-black"></div>
      </div>
    );
  }

  if (error || events.length === 0) {
    return (
      <div className="flex justify-center items-center h-[200px] bg-cream border-b border-deep-black">
         <p className="text-gray-500 font-body uppercase tracking-widest">{error || "No upcoming events scheduled."}</p>
      </div>
    );
  }

  return (
    <section className="bg-cream border-b border-deep-black overflow-hidden">
      <div className="flex flex-col lg:flex-row h-auto lg:h-[800px]">
        
        {/* LEFT: Events List */}
        <div className="lg:w-1/2 flex flex-col border-b lg:border-b-0 lg:border-r border-deep-black bg-cream relative z-10">
          {/* Header */}
          <div className="p-6 md:p-8 border-b border-deep-black bg-white sticky top-0 z-20">
             <div className="flex justify-between items-end">
               <div>
                 <h2 className="text-4xl md:text-5xl font-heading font-bold text-deep-black uppercase leading-none mb-2">{title}</h2>
                 <p className="text-sm font-bold tracking-[0.2em] uppercase text-gold">2026 Season</p>
               </div>
               <span className="text-xs font-bold tracking-[0.2em] text-gray-400 hidden md:block">SCROLL TO EXPLORE</span>
             </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {events.map((event, index) => (
              <div 
                key={event.id}
                className={`group border-b border-deep-black p-8 md:p-10 cursor-pointer transition-all duration-300 relative overflow-hidden ${
                  activeEventIndex === index ? 'bg-deep-black text-white' : 'hover:bg-white text-deep-black'
                }`}
                onMouseEnter={() => setActiveEventIndex(index)}
                onClick={() => setActiveEventIndex(index)}
              >
                <div className="relative z-10 flex justify-between items-center">
                  <div className="flex gap-6 md:gap-10 items-baseline">
                    <span className={`text-lg font-heading font-bold opacity-30 ${activeEventIndex === index ? 'text-gold' : 'text-deep-black'}`}>
                      0{index + 1}
                    </span>
                    <div>
                      <h3 className="text-2xl md:text-4xl font-heading font-bold uppercase mb-2 leading-tight">
                        {event.title}
                      </h3>
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-xs font-bold tracking-[0.15em] uppercase opacity-70">
                        <span>{event.date}</span>
                        <span className="hidden md:block w-1 h-1 bg-current rounded-full"></span>
                        <span>{event.city}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`transform transition-transform duration-500 ${activeEventIndex === index ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
                    <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Visual Preview & Map */}
        <div className="lg:w-1/2 relative bg-deep-black h-[500px] lg:h-auto overflow-hidden">
          <AnimatePresence mode='wait'>
            <motion.div
              key={activeEventIndex}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0"
            >
              {/* Background Image */}
              <img 
                src={events[activeEventIndex].image} 
                alt={events[activeEventIndex].title}
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep-black via-deep-black/20 to-transparent"></div>
            </motion.div>
          </AnimatePresence>

          {/* Content Overlay */}
          <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-between z-10 pointer-events-none">
            <div className="flex justify-end pointer-events-auto">
              <span className="bg-gold text-deep-black text-xs font-bold px-4 py-2 uppercase tracking-widest">
                {events[activeEventIndex].category}
              </span>
            </div>

            <div className="pointer-events-auto">
               <motion.div
                 key={`content-${activeEventIndex}`}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.2, duration: 0.5 }}
               >
                 <h2 className="text-4xl md:text-6xl font-heading font-bold text-white uppercase mb-4 leading-none">
                   {events[activeEventIndex].city}
                 </h2>
                 <p className="text-gray-300 text-lg md:text-xl font-body italic mb-8 max-w-md">
                   {events[activeEventIndex].location} &bull; {events[activeEventIndex].subtitle}
                 </p>

                 {/* Embedded Map Container */}
                 <div className="relative w-full h-48 md:h-64 border border-white/20 bg-deep-black/50 backdrop-blur-sm overflow-hidden group">
                    {/* Custom Map UI Placeholder */}
                    <div className="absolute inset-0 bg-[#1a1a1a] flex flex-col items-center justify-center p-6 text-center group-hover:bg-[#111] transition-colors duration-500">
                        <div className="w-16 h-16 rounded-full border-2 border-gold flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <h4 className="text-white font-heading text-lg uppercase tracking-widest mb-1">Venue Map</h4>
                        <p className="text-gray-500 text-xs font-body">Interactive View Loading...</p>
                    </div>

                   <iframe 
                      width="100%" 
                      height="100%" 
                      src={events[activeEventIndex].mapUrl}
                      className="absolute inset-0 w-full h-full filter grayscale contrast-125 opacity-40 mix-blend-screen group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"
                      title="Event Location"
                      loading="lazy"
                   ></iframe>
                   
                   <a 
                     href={events[activeEventIndex].directionsUrl}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="absolute bottom-4 right-4 bg-white text-deep-black text-xs font-bold px-4 py-2 uppercase tracking-widest hover:bg-gold hover:text-white transition-all shadow-lg flex items-center gap-2 z-10"
                   >
                     <span>Get Directions</span>
                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                     </svg>
                   </a>
                 </div>
               </motion.div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default UpcomingEvents;
