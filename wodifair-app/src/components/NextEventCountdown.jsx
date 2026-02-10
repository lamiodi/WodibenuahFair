import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiRequest } from '../services/api';

const NextEventCountdown = () => {
  const [nextEvent, setNextEvent] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/events/next')
      .then(data => {
        if (data) {
          setNextEvent(data);
        } else {
            setNextEvent({
                title: "Wodibenuah Fair Abuja",
                start_date: "2026-04-04T10:00:00",
                location: "Abuja International Conference Center",
                is_registration_open: true
            });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching next event:', err);
        setNextEvent({
            title: "Wodibenuah Fair Abuja",
            start_date: "2026-04-04T10:00:00",
            location: "Abuja International Conference Center",
            is_registration_open: true
        });
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!nextEvent) return;

    const timer = setInterval(() => {
      const eventDate = new Date(nextEvent.start_date).getTime();
      const now = new Date().getTime();
      const difference = eventDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextEvent]);

  if (loading) return null;
  if (!nextEvent) return null;

  return (
    <section className="relative w-full min-h-[700px] h-auto py-16 md:py-0 overflow-hidden bg-deep-black border-b border-deep-black flex items-center">
      {/* Background Image with Parallax-like feel */}
      <motion.div 
        initial={{ scale: 1.1 }}
        whileInView={{ scale: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 z-0"
      >
        <div 
          className="w-full h-full bg-cover bg-center opacity-55"
          style={{ backgroundImage: 'url(/images/Gemini_Generated_Image_euj3e6euj3e6euj3.png)' }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-deep-black via-deep-black/60 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-deep-black via-transparent to-deep-black"></div>
      </motion.div>

      <div className="container mx-auto px-6 relative z-10 flex flex-col justify-center items-center text-center">
        
        {/* Top Label */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center justify-center gap-4">
            <span className="h-[1px] w-12 bg-gold/60"></span>
            <span className="text-gold text-xs md:text-sm font-bold uppercase tracking-[0.3em]">The Countdown Begins</span>
            <span className="h-[1px] w-12 bg-gold/60"></span>
          </div>
        </motion.div>

        {/* Main Title */}
        <motion.h2 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold text-white uppercase mb-4 tracking-tighter"
        >
          {nextEvent.title}
        </motion.h2>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl md:text-2xl font-body italic text-gray-300 mb-12 md:mb-16"
        >
          {new Date(nextEvent.start_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          <span className="mx-3 text-gold">|</span>
          {nextEvent.location}
        </motion.div>

        {/* Countdown Timer - Large & Bold */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 mb-16 max-w-5xl mx-auto">
          {[
            { label: 'Days', value: timeLeft.days },
            { label: 'Hours', value: timeLeft.hours },
            { label: 'Minutes', value: timeLeft.minutes },
            { label: 'Seconds', value: timeLeft.seconds }
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + (idx * 0.1) }}
              className="flex flex-col items-center group cursor-default"
            >
              <div className="relative">
                <span className="text-6xl md:text-8xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-gray-600 group-hover:text-gold transition-all duration-500">
                  {String(item.value).padStart(2, '0')}
                </span>
                {/* Reflection effect */}
                <span className="absolute -bottom-8 left-0 right-0 text-6xl md:text-8xl font-heading font-bold text-white opacity-5 transform scale-y-[-1] pointer-events-none blur-sm">
                  {String(item.value).padStart(2, '0')}
                </span>
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.4em] text-gold mt-4 opacity-80 group-hover:opacity-100 transition-opacity">
                {item.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          {nextEvent.is_registration_open ? (
            <Link 
              to="/register" 
              className="group relative inline-flex items-center gap-4 px-10 py-5 bg-white text-deep-black font-bold uppercase tracking-[0.2em] overflow-hidden hover:text-white transition-colors duration-300"
            >
              <span className="relative z-10">Reserve Your Entry</span>
              <div className="absolute inset-0 bg-gold transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
              <svg className="w-4 h-4 relative z-10 group-hover:rotate-45 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          ) : (
            <button disabled className="px-10 py-5 border border-gray-700 text-gray-500 font-bold uppercase tracking-[0.2em] cursor-not-allowed">
              Registration Closed
            </button>
          )}
        </motion.div>

      </div>
    </section>
  );
};

export default NextEventCountdown;
