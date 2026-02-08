import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const heroImages = [
  "/images/IMG_3764.JPG.jpeg", // Event crowd/light
  "/images/IMG_3767.JPG.jpeg", // Luxury atmosphere
  "/images/IMG_3756.JPG.jpeg"  // Fashion/Model
];

const Hero = () => {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-screen w-full overflow-hidden bg-deep-black">
      {/* Background Slider */}
      <AnimatePresence mode='wait'>
        <motion.div
          key={currentImage}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImages[currentImage]})` }}
          />
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative h-full container mx-auto px-6 flex flex-col justify-center items-center text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <h2 className="text-gold uppercase tracking-[0.2em] text-sm md:text-base mb-4 font-bold">
            The Ultimate Luxury Experience
          </h2>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold text-white mb-6 leading-tight">
            WODIBENUAH<span className="text-gold">FAIR</span>
            <span className="block text-2xl md:text-4xl font-light font-body mt-4 text-gray-200">
              Where Elegance Meets Excellence
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-gray-300 text-lg mb-10 font-body">
            Join us for an unforgettable showcase of premium vendors, exclusive fashion, and high-end networking.
          </p>

          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <Link 
              to="/register" 
              className="px-8 py-4 bg-gold text-deep-black font-bold uppercase tracking-widest hover:bg-white transition-colors duration-300 min-w-[200px]"
            >
              Register Now
            </Link>
            <Link 
              to="/vendors" 
              className="px-8 py-4 border-2 border-white text-white font-bold uppercase tracking-widest hover:bg-white hover:text-deep-black transition-colors duration-300 min-w-[200px]"
            >
              Explore Vendors
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 2 }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-white/50"
      >
        <div className="w-[1px] h-16 bg-gradient-to-b from-gold to-transparent mx-auto"></div>
        <span className="text-xs uppercase tracking-widest mt-2 block">Scroll</span>
      </motion.div>
    </section>
  );
};

export default Hero;
