import React, { useRef } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { motion, useScroll, useTransform } from 'framer-motion';

const About = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  return (
    <div className="min-h-screen bg-cream text-deep-black font-body" ref={containerRef}>
      {/* Title Banner */}
      <div className="w-full px-2 md:px-8 py-3 md:py-6 border-b border-deep-black bg-white sticky top-0 z-50">
        <div className="relative w-full max-w-[1920px] mx-auto">
          <div className="relative flex flex-col items-center w-full">
            <h1 className="w-full text-[12vw] md:text-[10vw] leading-[0.8] font-heading font-medium tracking-tighter text-deep-black flex flex-nowrap justify-center items-center select-none whitespace-nowrap px-1 md:px-2 uppercase">
              <span>A</span>
              
              {/* B with CEO Image 1 */}
              <span className="relative inline-block mx-[0.02em]">
                 <div className="absolute inset-0 z-0 flex items-center justify-center">
                    <div className="ms-1 mt-[0.099em] w-[58%] h-[87%] overflow-hidden rounded-full border border-deep-black">
                     <img 
                       src="/images/ceoimage.png" 
                       alt="CEO"
                       className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                     />
                   </div>
                </div>
                <span className="relative z-10 text-deep-black mix-blend-multiply">B</span>
              </span>

              {/* O with CEO Image 2 */}
              <span className="relative inline-block mx-[0.02em]">
                 <div className="absolute inset-0 z-0 flex items-center justify-center">
                    <div className="ms-2 mt-[0.09em] w-[65%] h-[91%] overflow-hidden rounded-full border border-deep-black">
                     <img 
                       src="/images/ceoimage 2.png" 
                       alt="CEO"
                       className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                     />
                   </div>
                </div>
                <span className="relative z-10 text-deep-black mix-blend-multiply">O</span>
              </span>

              <span>UT</span>
              <span className="w-4 md:w-12"></span>
              
              {/* U with Image */}
              <span className="relative inline-block mx-[0.02em]">
                 <div className="absolute inset-0 z-0 flex items-center justify-center">
                    <div className="ms-5 mt-[0.19em] w-[56%] h-[75%] overflow-hidden rounded-[18px] border border-deep-black">
                     <img 
                       src="/images/lagos december 2026.jpeg" 
                       alt="Lagos Event"
                       className="w-full h-full object-cover transition-all duration-500"
                     />
                   </div>
                </div>
                <span className="relative z-10 text-deep-black mix-blend-multiply">U</span>
              </span>
              <span>S</span>
            </h1>
          </div>
        </div>
      </div>

      <Navigation activeItem="About" />

      {/* Hero Section */}
      <div className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden border-b border-deep-black">
        <motion.div style={{ y }} className="absolute inset-0 w-full h-full">
          <img 
            src="/images/pport harcourt.jpg" 
            alt="Wodibenuah Fair Crowd" 
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-black/30"></div>
        </motion.div>
        
        <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16 z-10">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <h2 className="text-white text-3xl md:text-5xl lg:text-7xl font-heading uppercase leading-none mb-6">
              Redefining The<br/>Exhibition Experience
            </h2>
            <p className="text-white text-sm md:text-lg font-medium max-w-2xl leading-relaxed backdrop-blur-sm bg-black/20 p-4 border-l-2 border-white">
              Wodibenuah Fair is Africa's premier trade and lifestyle exhibition, curating the finest vendor experiences and celebrating the intersection of culture, luxury, and innovation.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-[1920px] mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
          
          {/* Left Column: Text Content */}
          <div className="lg:col-span-7 flex flex-col gap-16">
            
            {/* Mission Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="border-l border-deep-black pl-8"
            >
              <span className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">Our Mission</span>
              <h3 className="text-2xl md:text-4xl font-heading uppercase leading-tight mb-6">
                Connecting Brands,<br/>Creating Memories
              </h3>
              <div className="space-y-6 text-gray-700 text-base md:text-lg leading-relaxed text-justify">
                <p>
                  At Wodibenuah Fair, we believe in the power of connection. We are more than just an event; we are a platform that bridges the gap between exceptional brands and discerning audiences. Our mission is to create an immersive environment where commerce meets culture, fostering growth for businesses and unforgettable experiences for attendees.
                </p>
                <p>
                  From fashion and beauty to art and lifestyle, we curate a diverse selection of vendors that represent the best of creativity and innovation. Whether in Abuja, Port Harcourt, or Lagos, our fairs are designed to inspire, engage, and elevate.
                </p>
              </div>
            </motion.div>

            {/* Stats / Highlights */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 border-y border-deep-black py-12">
              <div className="text-center">
                <h4 className="text-4xl md:text-6xl font-heading font-bold mb-2">3+</h4>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Major Cities</p>
              </div>
              <div className="text-center border-l border-gray-200">
                <h4 className="text-4xl md:text-6xl font-heading font-bold mb-2">500+</h4>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Vendors Hosted</p>
              </div>
              <div className="text-center border-l border-gray-200 col-span-2 md:col-span-1">
                <h4 className="text-4xl md:text-6xl font-heading font-bold mb-2">10k+</h4>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Happy Attendees</p>
              </div>
            </div>

            {/* CEO Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative bg-white border border-deep-black p-8 md:p-12 mt-8"
            >
              <div className="absolute -top-6 -left-6 bg-deep-black text-white px-6 py-2 text-xs font-bold uppercase tracking-widest">
                The Visionary
              </div>
              
              <div className="flex flex-col md:flex-row gap-12 items-center">
                <div className="w-full md:w-1/2 aspect-[3/4] overflow-hidden border border-gray-200 bg-gray-100 relative group">
                  <img 
                    src="/images/ceoimage.png" 
                    alt="Founder & CEO" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 border-[1px] border-white/50 m-2"></div>
                </div>
                
                <div className="w-full md:w-1/2">
                  <h4 className="text-3xl font-heading uppercase mb-2">Founder & CEO</h4>
                  <p className="text-sm font-bold uppercase tracking-wider text-gold mb-6">Wodibenuah Fair</p>
                  
                  <blockquote className="text-lg italic text-gray-600 mb-6 border-l-4 border-gold pl-4">
                    "Our goal is to build a legacy of excellence, where every fair is a story told through the lens of creativity and community."
                  </blockquote>
                  
                  <p className="text-sm text-gray-700 leading-relaxed mb-6">
                    With a passion for bringing people together and a keen eye for quality, our founder has steered Wodibenuah Fair from a local gathering to a multi-city phenomenon. Her vision drives every aspect of the fair, ensuring that it remains a beacon of opportunity for entrepreneurs and a celebration of lifestyle for all.
                  </p>

                  <img 
                    src="/images/Wodi SM (17).png" 
                    alt="Signature" 
                    className="h-12 opacity-60"
                  />
                </div>
              </div>
            </motion.div>

          </div>

          {/* Right Column: Visuals & Sidebar */}
          <div className="lg:col-span-5 flex flex-col gap-8 sticky top-24 h-fit">
            
            {/* Image Grid */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div 
                whileHover={{ scale: 0.98 }}
                className="w-full aspect-square bg-gray-200 overflow-hidden border border-deep-black"
              >
                <img 
                  src="/images/ceoimage 2.png" 
                  alt="Abuja Edition" 
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <motion.div 
                whileHover={{ scale: 0.98 }}
                className="w-full aspect-square bg-gray-200 overflow-hidden border border-deep-black mt-8"
              >
                <img 
                  src="/images/Lagosdecember12thedition.png" 
                  alt="Lagos Edition" 
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </div>

            {/* Values Widget */}
            <div className="bg-deep-black text-white p-8 border border-gray-800">
              <h3 className="text-xl font-heading font-bold uppercase mb-6 border-b border-gray-700 pb-4">Core Values</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <span className="text-gold text-lg">01</span>
                  <div>
                    <h4 className="font-bold uppercase text-sm mb-1">Excellence</h4>
                    <p className="text-xs text-gray-400">We strive for the highest standards in everything we do.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-gold text-lg">02</span>
                  <div>
                    <h4 className="font-bold uppercase text-sm mb-1">Community</h4>
                    <p className="text-xs text-gray-400">Building lasting relationships between vendors and customers.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-gold text-lg">03</span>
                  <div>
                    <h4 className="font-bold uppercase text-sm mb-1">Innovation</h4>
                    <p className="text-xs text-gray-400">Constantly evolving to deliver fresh and exciting experiences.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Join Us Call to Action */}
            <div className="border-2 border-dashed border-deep-black p-6 bg-[#F5F5F0] text-center">
              <h3 className="text-xl font-heading font-bold uppercase mb-2">Join The Next Fair</h3>
              <p className="text-xs text-gray-600 mb-6 max-w-xs mx-auto">
                Don't miss out on the next Wodibenuah Fair experience. Register as a vendor or get your tickets today.
              </p>
              <a 
                href="/register" 
                className="inline-block bg-deep-black text-white text-xs font-bold uppercase tracking-widest px-8 py-3 hover:bg-gold hover:text-black transition-colors"
              >
                Get Involved
              </a>
            </div>

          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default About;
