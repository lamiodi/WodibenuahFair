import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const slides = [
  {
    id: 1,
    image: '/images/IMG_3764.JPG.jpeg',
    title: 'Experience Luxury',
    subtitle: 'The Premier Vendor Fair of the Year',
    cta: 'Register Now',
    link: '/register'
  },
  {
    id: 2,
    image: '/images/IMG_3756.JPG.jpeg',
    title: 'Exclusive Fashion',
    subtitle: 'Discover Top Designers & Brands',
    cta: 'View Vendors',
    link: '/vendors'
  },
  {
    id: 3,
    image: '/images/Gemini_Generated_Image_45z3p945z3p945z3.png',
    title: 'VIP Access',
    subtitle: 'Unlock Premium Benefits & Lounges',
    cta: 'Get VIP Tickets',
    link: '/register'
  }
];

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-deep-black">
      <AnimatePresence mode='wait'>
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slides[currentSlide].image})` }}
          />
          
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/40" />
        </motion.div>
      </AnimatePresence>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex items-center justify-center text-center z-10 px-6">
        <div className="max-w-4xl">
          <motion.p
            key={`sub-${currentSlide}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-gold text-lg md:text-xl font-bold uppercase tracking-[0.2em] mb-4"
          >
            {slides[currentSlide].subtitle}
          </motion.p>
          
          <motion.h1
            key={`title-${currentSlide}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold text-white mb-8 leading-tight"
          >
            {slides[currentSlide].title}
          </motion.h1>

          <motion.div
            key={`cta-${currentSlide}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            <Link
              to={slides[currentSlide].link}
              className="inline-block border-2 border-gold text-gold hover:bg-gold hover:text-deep-black px-8 py-3 text-sm md:text-base font-bold uppercase tracking-widest transition-all duration-300"
            >
              {slides[currentSlide].cta}
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Slider Indicators */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-4 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide ? 'bg-gold w-8' : 'bg-white/50 hover:bg-white'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;
