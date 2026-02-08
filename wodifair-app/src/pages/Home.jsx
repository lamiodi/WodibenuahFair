import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import ExploreButton from '../components/ExploreButton';
import Footer from '../components/Footer';
import NextEventCountdown from '../components/NextEventCountdown';
import ExhibitionHighlightVideo from '../components/ExhibitionHighlightVideo';
import UpcomingEvents from '../components/UpcomingEvents';
import SponsorshipCTA from '../components/SponsorshipCTA';
import { motion, AnimatePresence } from 'framer-motion';

  const slides = [
    {
      image: "/images/abuja may 9th edition.png",
      title: "ABUJA",
      subtitle: "May 9th Edition"
    },
    {
      image: "/images/pport harcourt.jpg",
      title: "PORT HARCOURT",
      subtitle: "Unforgettable Crowd Experience"
    },
    {
      image: "/images/Gemini_Generated_Image_45z3p945z3p945z3.png",
      title: "CAMEROON",
      subtitle: "Exhibition at Malyko Stadium"
    },
    {
      image: "/images/Lagosdecember12thedition.png",
      title: "LAGOS",
      subtitle: "December 12th Edition"
    }
  ];

  const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-cream text-deep-black font-body">
      
      {/* ============================================
          TITLE BANNER SECTION
          Large "WODIBENUAH" text with embedded images
          ============================================ */}
      <div className="w-full px-2 md:px-8 py-3 md:py-6 border-b border-deep-black">
        <div className="relative w-full max-w-[1920px] mx-auto">
          {/* Main title text - "WODIBENUAH" */}
          <div className="relative flex flex-col items-center w-full">
            <h1 className="w-full text-[11.5vw] md:text-[10.5vw] 2xl:text-[220px] leading-[0.8] font-heading font-medium tracking-tighter text-deep-black flex flex-nowrap justify-center items-center select-none whitespace-nowrap px-0">
              {/* W */}
              <span>W</span>
              
              {/* O with embedded image behind hole */}
              <span className="relative inline-block mx-[0.02em]">
                 {/* Image Layer */}
                  <div className="absolute inset-0 z-0 flex items-center justify-center">
                     <div className="mt-[0.1em]  w-[65%] h-[90%] overflow-hidden rounded-full">
                      <img 
                        src="/images/ceoimage.png" 
                        alt="Portrait"
                        className="w-full h-full object-cover"
                      />
                    </div>
                 </div>
                 {/* Text Layer */}
                 <span className="relative z-10 text-deep-black mix-blend-multiply">O</span>
              </span>

              {/* DI */}
              <span>DI</span>
              
              {/* B with embedded image behind holes */}
              <span className="relative inline-block mx-[0.02em]">
                 {/* Image Layer - Positioned absolutely behind the text */}
                  <div className="absolute inset-0 z-0 flex items-center justify-center">
                     <div className="ms-1 mt-[0.159em]  w-[59%] h-[89%] overflow-hidden rounded-full">
                      <img 
                        src="/images/IMG_3767.JPG.jpeg" 
                        alt="Portrait"
                        className="w-full h-full object-cover"
                      />
                    </div>
                 </div>

                 {/* Text Layer - Mix Blend Multiply makes white parts transparent (showing image) and black parts stay black */}
                 <span className="relative z-10 text-deep-black mix-blend-multiply">B</span>
              </span>
              
              {/* ENUAH */}
              <span>ENUAH</span>
            </h1>
            
            {/* FAIR 2026 Subtitle - Aligned to right, tucked under */}
            <div className="w-full flex justify-end pr-[1vw] md:pr-[2vw] relative z-20">
              <span className="text-[4vw] md:text-[2.5vw] 2xl:text-[48px] font-heading font-bold tracking-[0.2em] md:tracking-[0.3em] uppercase text-deep-black">
                FAIR 2026
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* ============================================
          NAVIGATION SECTION
          ============================================ */}
      <Navigation activeItem="Home" />
      
      {/* ============================================
          HERO SECTION (Slideshow)
          ============================================ */}
      <div className="w-full px-2 md:px-8 py-4 md:py-8">
        <div className="relative w-full h-[90vh] overflow-hidden border border-deep-black bg-black">
          <AnimatePresence mode='wait'>
            <motion.img 
              key={currentSlide}
              src={slides[currentSlide].image} 
              alt="Hero"
              className="absolute inset-0 w-full h-full object-cover opacity-80"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 0.8, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
            />
          </AnimatePresence>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 z-10">
            <h2 className="text-[6vw] md:text-[4vw] font-heading font-normal text-white uppercase tracking-wide leading-tight mb-4 drop-shadow-lg">
              WODIBENUAH FAIR<br />
              <span className="font-bold">
                <AnimatePresence mode='wait'>
                  <motion.span
                    key={currentSlide}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                  >
                    {slides[currentSlide].title}
                  </motion.span>
                </AnimatePresence>
              </span>
            </h2>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-8 md:w-16 h-[1px] bg-white"></div>
              <span className="text-white text-xs md:text-sm uppercase tracking-[0.3em] font-medium">
                <AnimatePresence mode='wait'>
                  <motion.span
                    key={currentSlide}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    {slides[currentSlide].subtitle}
                  </motion.span>
                </AnimatePresence>
              </span>
              <div className="w-8 md:w-16 h-[1px] bg-white"></div>
            </div>

            <ExploreButton 
              variant="light"
              className="px-8 border-none"
              text="Explore Now"
            />
          </div>
          
          {/* Slide Indicators */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
            {slides.map((_, index) => (
              <button 
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-white w-8' : 'bg-white/40 hover:bg-white/70'}`}
              />
            ))}
          </div>

          {/* Decorative Corner Element - Removed */}
        </div>
      </div>

      {/* ============================================
          NEXT EVENT COUNTDOWN
          ============================================ */}
      <NextEventCountdown />

      {/* ============================================
          EXHIBITION HIGHLIGHTS VIDEO
          ============================================ */}
      <ExhibitionHighlightVideo />
      
      {/* ============================================
          VENDOR HIGHLIGHTS SECTION (Summer Collection)
          Corrected Grid Layout: 3 Columns
          - Left Column: Stacked Item 1 & 2
          - Center Column: Large Image (Full Height)
          - Right Column: Stacked Item 3 & 4
          ============================================ */}
      <section className="bg-cream border-b border-deep-black mt-0">
        <div className="border-t border-b border-deep-black py-6 md:py-16">
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-heading font-normal text-center uppercase tracking-wide text-deep-black leading-none">
            Event Highlights
          </h2>
        </div>
        
        <div className="px-4 md:px-8 py-8 md:py-12 max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          
          <div className="flex flex-col gap-8 justify-between">
            <div className="group cursor-pointer">
              <div className="aspect-[3/4] overflow-hidden mb-4 bg-gray-200 border border-deep-black">
                <img src="/images/IMG_3756.JPG.jpeg" alt="Fashion" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
              <h3 className="font-heading font-bold uppercase text-xs tracking-[0.2em] mb-3 text-deep-black">FASHION</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Discover the latest trends from top designers and luxury brands.
              </p>
            </div>
            
            <div className="group cursor-pointer">
              <div className="aspect-[4/3] overflow-hidden mb-4 bg-gray-200 border border-deep-black">
                <img src="/images/IMG_3757.JPG.jpeg" alt="Beauty" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
              <h3 className="font-heading font-bold uppercase text-xs tracking-[0.2em] mb-3 text-deep-black">BEAUTY</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Experience premium beauty, wellness, and skincare products.
              </p>
            </div>
          </div>
          
          <div className="lg:col-span-2 h-full">
            <div className="h-full w-full bg-gray-200 overflow-hidden relative group min-h-[600px] lg:min-h-full border border-deep-black">
              <img 
                src="/images/IMG_3763.JPG.jpeg" 
                alt="Centerpiece" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-8 justify-between">
            <div className="group cursor-pointer">
              <div className="aspect-[3/4] overflow-hidden mb-4 bg-gray-200 border border-deep-black">
                <img src="/images/IMG_3764.JPG.jpeg" alt="Fine Art" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
              <h3 className="font-heading font-bold uppercase text-xs tracking-[0.2em] mb-3 text-deep-black">FINE ART</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Curated pieces from renowned artists and galleries.
              </p>
            </div>
            
            <div className="group cursor-pointer">
              <div className="aspect-[4/3] overflow-hidden mb-4 bg-gray-200 border border-deep-black">
                <img src="/images/IMG_3767.JPG.jpeg" alt="Gourmet" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
              <h3 className="font-heading font-bold uppercase text-xs tracking-[0.2em] mb-3 text-deep-black">GOURMET</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Exquisite culinary delights and tastings from top chefs.
              </p>
            </div>
          </div>
        </div>
      </div>
      </section>
      
      {/* ============================================
          DIAGONAL GEOMETRIC SECTION
          Pixel-Perfect Implementation
          - Left: Black Background (Clipped)
          - Right: Image Background (Full, then revealed by clip)
          - Split Text: "Fair" (White on Black, Black on Image)
          ============================================ */}
      <section className="relative min-h-[700px] md:min-h-[900px] flex overflow-hidden bg-cream">
        
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/IMG_3765.JPG.jpeg" 
            alt="Wodifair Exhibition Crowd"
            className="w-full h-full object-cover"
          />
          {/* Light overlay removed for clarity */}
          {/* <div className="absolute inset-0 bg-white/40"></div> */}
        </div>

        {/* "COMMUNITY" Text - Background Layer (Black text on Image) */}
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-end pb-16 md:pb-24 pl-[5%]" aria-hidden="true">
           <span className="text-[14vw] leading-[0.8] font-heading font-bold text-deep-black tracking-tighter uppercase">
             COMMUNITY
           </span>
        </div>

        {/* Black Overlay Layer with Clip Path */}
        <div 
          className="absolute inset-0 z-20 bg-deep-black flex flex-col justify-center"
          style={{ clipPath: 'polygon(0 0, 70% 0, 30% 100%, 0 100%)' }}
        >
          <div className="w-full h-full relative p-10 lg:p-20 flex flex-col justify-center">
            
            {/* "EXHIBITION" Vertical Text */}
            <div className="absolute left-0 top-0 bottom-0 flex items-center pl-2 md:pl-6">
              <span className="-rotate-180 text-6xl md:text-8xl lg:text-9xl font-heading font-bold tracking-wide whitespace-nowrap text-white" style={{ writingMode: 'vertical-rl' }}>
                EXHIBITION
              </span>
            </div>
            
            {/* Content Block */}
            <div className="pl-24 md:pl-32 lg:pl-40 max-w-lg lg:max-w-xl pt-0 md:pt-20">
              <p className="text-sm md:text-base lg:text-lg font-body leading-relaxed text-white mb-10 opacity-90">
                Blending into the vibrant atmosphere, the crowd forms a living stream of connection, weaving the fabric of a new narrative. Transcending its commercial origins, the exhibition now heralds the unstoppable rise of African luxury and community. (Wodibenuahfair, 2026)
              </p>
              
              <button 
                aria-label="View Magazine Details"
                className="w-16 h-16 rounded-full border border-white flex items-center justify-center cursor-pointer hover:bg-white hover:text-deep-black transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
              >
                <svg className="w-6 h-6 transform group-hover:rotate-45 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 17L17 7M17 7H7M17 7V17" /></svg>
              </button>
            </div>

            {/* "COMMUNITY" Text - Foreground Layer (White text on Black) */}
            <div className="absolute inset-0 flex flex-col justify-end pb-16 md:pb-24 pl-[5%] pointer-events-none">
               <span className="text-[14vw] leading-[0.8] font-heading font-bold text-white tracking-tighter uppercase">
                 COMMUNITY
               </span>
            </div>
          </div>
        </div>
      </section>
      
      {/* ============================================
          INCLUSIVE REGISTRATION SECTION
          Categorized Grid Layout: 4 Columns
          ============================================ */}
      <section className="bg-cream border-t border-deep-black">
        {/* Section Header */}
        <div className="border-b border-deep-black py-12 md:py-24 px-4 text-center bg-deep-black text-white">
          <p className="text-xs md:text-sm font-bold tracking-[0.3em] uppercase mb-6 text-gray-300">
            Open to All Luxury Vendors
          </p>
          <h2 className="text-4xl md:text-6xl lg:text-8xl font-heading font-normal uppercase tracking-wide leading-none max-w-6xl mx-auto">
            Registration is<br/>Inclusive to
          </h2>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-deep-black">
          
          {/* Category 1: Hair/Hair Products */}
          <div className="p-8 md:p-12 group hover:bg-white transition-colors duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 font-heading text-6xl md:text-8xl font-bold select-none pointer-events-none group-hover:opacity-5 transition-opacity">01</div>
            <div className="mb-10 relative z-10">
               <span className="inline-block px-3 py-1 border border-deep-black text-[10px] font-bold tracking-[0.2em] uppercase mb-6 bg-cream">Category 01</span>
               <h3 className="text-3xl md:text-4xl font-heading font-normal uppercase text-deep-black leading-[0.9] tracking-tight">
                 Hair &<br/>Hair Products
               </h3>
            </div>
            <ul className="space-y-4 relative z-10">
              {[
                "Natural Hair Products", "Weaves/Extensions", "Hair Accessories", 
                "Haircare Products", "Hair styling tools", "Wigs", 
                "Hair colorants", "Scalp treatments", "Hair growth serums", 
                "Hair styling brushes"
              ].map((item, i) => (
                <li key={i} className="text-sm md:text-base font-body text-gray-600 flex items-start gap-4 group-hover:text-black transition-colors border-b border-dashed border-gray-300 pb-2 last:border-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-deep-black mt-2 opacity-100 flex-shrink-0"></span>
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Category 2: Fashion, Beauty & Skincare */}
          <div className="p-8 md:p-12 group hover:bg-white transition-colors duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 font-heading text-6xl md:text-8xl font-bold select-none pointer-events-none group-hover:opacity-5 transition-opacity">02</div>
            <div className="mb-10 relative z-10">
               <span className="inline-block px-3 py-1 border border-deep-black text-[10px] font-bold tracking-[0.2em] uppercase mb-6 bg-cream">Category 02</span>
               <h3 className="text-3xl md:text-4xl font-heading font-normal uppercase text-deep-black leading-[0.9] tracking-tight">
                 Fashion, Beauty<br/>& Skincare
               </h3>
            </div>
            <ul className="space-y-4 relative z-10">
              {[
                "Ready-to-wear apparel", "Quality fabrics", "Makeup essentials", 
                "Ready-made garments", "Stylish jewelry and accessories", "Footwear and slippers", 
                "Fragrances for all occasions", "Preowned fashion items", "Trendy bags and purses", 
                "Elegant lingerie pieces", "Skincare products", 
                "Indigenous attire"
              ].map((item, i) => (
                <li key={i} className="text-sm md:text-base font-body text-gray-600 flex items-start gap-4 group-hover:text-black transition-colors border-b border-dashed border-gray-300 pb-2 last:border-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-deep-black mt-2 opacity-100 flex-shrink-0"></span>
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Category 3: Food And Drinks */}
          <div className="p-8 md:p-12 group hover:bg-white transition-colors duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 font-heading text-6xl md:text-8xl font-bold select-none pointer-events-none group-hover:opacity-5 transition-opacity">03</div>
            <div className="mb-10 relative z-10">
               <span className="inline-block px-3 py-1 border border-deep-black text-[10px] font-bold tracking-[0.2em] uppercase mb-6 bg-cream">Category 03</span>
               <h3 className="text-3xl md:text-4xl font-heading font-normal uppercase text-deep-black leading-[0.9] tracking-tight">
                 Food And<br/>Drinks
               </h3>
            </div>
            <ul className="space-y-4 relative z-10">
              {[
                "Bakery Items", "Desserts", "Coffee/Tea", "Juices/Smoothies", 
                "Alcoholic Beverages", "Non-Alcoholic Beverages", "Ready-to-Eat Meals", 
                "Condiments/Sauces", "Spices/Seasonings", "Baked Goods", 
                "Confectionery", "Bottled Water", "Energy Drinks", "Soft Drinks"
              ].map((item, i) => (
                <li key={i} className="text-sm md:text-base font-body text-gray-600 flex items-start gap-4 group-hover:text-black transition-colors border-b border-dashed border-gray-300 pb-2 last:border-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-deep-black mt-2 opacity-100 flex-shrink-0"></span>
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Category 4: Home Essentials/Services */}
          <div className="p-8 md:p-12 group hover:bg-white transition-colors duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 font-heading text-6xl md:text-8xl font-bold select-none pointer-events-none group-hover:opacity-5 transition-opacity">04</div>
            <div className="mb-10 relative z-10">
               <span className="inline-block px-3 py-1 border border-deep-black text-[10px] font-bold tracking-[0.2em] uppercase mb-6 bg-cream">Category 04</span>
               <h3 className="text-3xl md:text-4xl font-heading font-normal uppercase text-deep-black leading-[0.9] tracking-tight">
                 Home Essentials<br/>& Services
               </h3>
            </div>
            <ul className="space-y-4 relative z-10">
              {[
                "Beddings: Sheets, duvet covers, pillowcases.", 
                "Scented candles, decorative candles, tea lights", 
                "Aromatherapy diffusers, essential oil diffusers", 
                "Interior design consultation", 
                "Branding services, advertising campaigns"
              ].map((item, i) => (
                <li key={i} className="text-sm md:text-base font-body text-gray-600 flex items-start gap-4 group-hover:text-black transition-colors border-b border-dashed border-gray-300 pb-2 last:border-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-deep-black mt-2 opacity-100 flex-shrink-0"></span>
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          
        </div>
      </section>

      {/* ============================================
          EVENTS SCHEDULE STRIP
          Replaced with Enhanced UpcomingEvents Component
          ============================================ */}
      <UpcomingEvents />

      {/* ============================================
          SPONSORSHIP CTA SECTION
          ============================================ */}
      <SponsorshipCTA />
      
      <Footer />
    </div>
  );
};

export default Home;
