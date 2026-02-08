import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import UpcomingEvents from '../components/UpcomingEvents';
import EventHighlights from '../components/EventHighlights';
import VenueMap from '../components/VenueMap';

const EventInfo = () => {
  const events = [
    { 
      category: "WODIFAIR",
      title: "Abuja May 9th 2026", 
      video: "/video/IMG_7859.MP4"
    },
    { 
      category: "Wodibenuahfair",
      title: "Customer Highlights", 
      video: "/video/IMG_9437.MP4"
    },
    { 
      category: "Wodibenuahfair",
      title: "Lagos Edition", 
      video: "https://www.youtube.com/embed/8XyJlVKUlAs?si=pWMK0JLNWNSXG9f2"
    }
  ];

  return (
    <div className="min-h-screen bg-cream text-deep-black font-body flex flex-col">
      
      {/* ============================================
          TITLE BANNER: "OUR EVENTS"
          With Embedded Images in 'O' and 'U'
          ============================================ */}
      <div className="w-full px-2 md:px-8 py-3 md:py-6 border-b border-deep-black">
        <div className="relative w-full max-w-[1920px] mx-auto overflow-hidden">
          <h1 className="w-full text-[12vw] leading-[0.9] font-heading font-medium tracking-tighter text-deep-black flex flex-nowrap justify-center items-center select-none whitespace-nowrap px-1">
            
            {/* O with Image */}
            <span className="relative inline-block mx-[0.02em]">
               <div className="absolute inset-0 z-0 flex items-center justify-center">
                  <div className="mt-[0.11em] w-[80%] h-[80%] overflow-hidden rounded-full">
                   <img 
                     src="/images/IMG_3766.JPG.jpeg" 
                     alt="Event"
                     className="w-full h-full object-cover"
                   />
                 </div>
              </div>
              <span className="relative z-10 text-deep-black mix-blend-multiply">O</span>
            </span>

            {/* U with Image */}
            <span className="relative inline-block mx-[0.02em]">
               <div className="absolute inset-0 z-0 flex items-center justify-center">
                  <div className="ms-5 mt-[0.1em] w-[65%] h-[75%] overflow-hidden rounded-t-none rounded-b-full translate-y-2">
                   <img 
                     src="/images/IMG_3756.JPG.jpeg" 
                     alt="Event"
                     className="w-full h-full object-cover"
                   />
                 </div>
              </div>
              <span className="relative z-10 text-deep-black mix-blend-multiply">U</span>
            </span>

            <span>R EVENTS</span>
          </h1>
        </div>
      </div>
      
      <Navigation activeItem="Event Info" />

      {/* ============================================
          HERO SPLIT SECTION
          Left: Text | Middle: Vertical Text & Arrows | Right: Full Image
          ============================================ */}
      <div className="border-b border-deep-black">
        <div className="flex flex-col lg:flex-row min-h-[600px] lg:h-[800px]">
          
          {/* 1. LEFT CONTENT */}
          <div className="flex-1 bg-cream p-8 md:p-16 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-deep-black">
            <div className="max-w-3xl pr-0 lg:pr-10">
              <h2 className="text-6xl md:text-8xl font-heading font-medium uppercase leading-[0.9] mb-8 tracking-tight">
                UPCOMING
                <span className="inline-block align-middle ml-4 w-32 md:w-48 h-12 md:h-16 rounded-full overflow-hidden border border-deep-black">
                  <img src="/images/IMG_3764.JPG.jpeg" className="w-full h-full object-cover" alt="" />
                </span>
                <br />
                <span className="inline-block align-middle mr-4 w-32 md:w-48 h-12 md:h-16 rounded-full overflow-hidden border border-deep-black">
                  <img src="/images/IMG_3765.JPG.jpeg" className="w-full h-full object-cover" alt="" />
                </span>
                EVENTS
                <br />
                AROUND THE WORLD
              </h2>

              <p className="text-gray-600 text-sm md:text-base leading-relaxed max-w-xl mb-12">
                Experience the global marketplace at Wodifair. From exclusive product launches to cultural showcases, immerse yourself in a world of innovation and tradition. Join thousands of attendees and exhibitors from around the globe for an event that redefines trade and connection.
              </p>

              <button className="bg-deep-black text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gold hover:text-deep-black transition-all duration-300 flex items-center gap-2 w-fit">
                Explore Now
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19L19 5M5 5h14v14" /></svg>
              </button>
            </div>
          </div>

          {/* 2. MIDDLE COLUMN (Vertical Text & Arrows) */}
          <div className="hidden lg:flex flex-col w-16 md:w-20 border-r border-deep-black bg-cream">
            {/* Vertical "February Events" Text */}
            <div className="flex-1 flex items-center justify-center relative overflow-hidden">
               <span className="transform rotate-90 whitespace-nowrap font-heading font-medium text-xl tracking-widest absolute">
                 February Events
               </span>
            </div>
            
            {/* Navigation Arrows */}
            <div className="flex flex-col border-t border-deep-black">
              <button className="w-full aspect-square bg-cream flex items-center justify-center hover:bg-white transition-colors border-b border-deep-black">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
              <button className="w-full aspect-square bg-cream flex items-center justify-center hover:bg-white transition-colors">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              </button>
            </div>
          </div>

          {/* 3. RIGHT IMAGE */}
          <div className="lg:w-[35%] relative">
            <img 
              src="/images/IMG_3766.JPG.jpeg" 
              alt="Event Atmosphere"
              className="w-full h-full object-cover"
            />
          </div>

        </div>
      </div>

      {/* ============================================
          EVENT GRID (3 Columns)
          ============================================ */}
      <div className="w-full px-4 md:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {events.map((event, index) => (
            <div key={index} className="group cursor-pointer">
               <div className="border-b border-deep-black pb-4 mb-4">
                 <span className="text-xs text-gray-500 uppercase tracking-wide">{event.category}</span>
                 <h3 className="text-2xl md:text-3xl font-heading font-normal mt-1">{event.title}</h3>
               </div>
               <div className="aspect-[3/4] overflow-hidden border border-deep-black relative">
                 {event.video.includes('http') ? (
                   <iframe 
                     src={event.video} 
                     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                     title={event.title}
                     frameBorder="0"
                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                     allowFullScreen
                   ></iframe>
                 ) : (
                   <video 
                     src={event.video} 
                     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                     autoPlay
                     loop
                     muted
                     playsInline
                   />
                 )}
                 {/* Hover Overlay Icon */}
                 <div className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                 </div>
               </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-16">
          <button className="bg-deep-black text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gold hover:text-deep-black transition-all duration-300 flex items-center gap-2">
            Explore Now
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19L19 5M5 5h14v14" /></svg>
          </button>
        </div>
      </div>

      {/* ============================================
          EVENT HIGHLIGHTS SECTION
          ============================================ */}
      <EventHighlights />

      {/* ============================================
          INTERACTIVE MAP SECTION
          ============================================ */}
      <div className="w-full border-t border-deep-black">
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-1/3 bg-deep-black text-white p-12 md:p-16 flex flex-col justify-center">
            <span className="text-gold text-xs font-bold tracking-[0.2em] uppercase mb-4">Location</span>
            <h2 className="text-4xl md:text-5xl font-heading font-medium uppercase mb-8 leading-none">
              Find Your<br/>Way
            </h2>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-12">
              Located in the prestigious district of Abuja, our venue offers world-class facilities, 
              ample parking, and easy accessibility for all our guests.
            </p>
            <div className="space-y-6 border-t border-gray-800 pt-8">
               <div>
                 <h4 className="text-sm font-bold uppercase tracking-wider mb-2">Address</h4>
                 <p className="text-gray-400 text-sm">International Conference Centre, Abuja</p>
               </div>
               <div>
                 <h4 className="text-sm font-bold uppercase tracking-wider mb-2">Hours</h4>
                 <p className="text-gray-400 text-sm">Doors Open: 10:00 AM</p>
                 <p className="text-gray-400 text-sm">Close: 10:00 PM</p>
               </div>
            </div>
          </div>
          <div className="lg:w-2/3">
             <VenueMap />
          </div>
        </div>
      </div>

      <UpcomingEvents title="All Events" />

      <Footer />
    </div>
  );
};

export default EventInfo;
