import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { apiRequest } from '../services/api';

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  // Hardcoded fallback data removed. We rely on the API now.
  const fallbackVendors = [];

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const data = await apiRequest('/public/vendors');
        // If API returns empty array (e.g., no paid vendors yet), use fallback for display purposes
        if (data.length > 0) {
          setVendors(data);
        } else {
          console.log("No paid vendors found, using fallback data.");
          setVendors(fallbackVendors);
        }
      } catch (err) {
        console.error("Error fetching vendors:", err);
        // Fallback to hardcoded data on error
        setVendors(fallbackVendors);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredVendors = filter === 'All' 
    ? vendors 
    : vendors.filter(v => v.category.toLowerCase().includes(filter.toLowerCase()) || 
                          (filter === 'Lifestyle' && ['Home Decor', 'Wellness', 'Art'].some(c => v.category.includes(c))));

  return (
    <div className="min-h-screen bg-cream text-deep-black font-body flex flex-col">
      
      {/* ============================================
          TITLE BANNER: "OUR VENDORS"
          With Embedded Image in 'O'
          ============================================ */}
      <div className="w-full px-2 md:px-8 py-3 md:py-6 border-b border-deep-black">
        <div className="relative w-full max-w-[1920px] mx-auto overflow-hidden">
          <h1 className="w-full text-[10vw] leading-[0.9] font-heading font-medium tracking-tighter text-deep-black flex flex-nowrap justify-center items-center select-none whitespace-nowrap px-1">
            
            <span>OUR VEND</span>

            {/* O with Image */}
            <span className="relative inline-block mx-[0.02em]">
               <div className="absolute inset-0 z-0 flex items-center justify-center">
                  <div className="ms-3 mt-[0.1em] w-[85%] h-[81%] overflow-hidden rounded-full">
                   <img 
                     src="/images/IMG_3766.JPG.jpeg" 
                     alt="Vendor"
                     className="w-full h-full object-cover"
                   />
                 </div>
              </div>
              <span className="relative z-10 text-deep-black mix-blend-multiply">O</span>
            </span>

            <span>RS</span>
          </h1>
        </div>
      </div>

      <Navigation activeItem="Vendors" />

      {/* ============================================
          SPOTLIGHT SECTION
          ============================================ */}
      <div className="border-b border-deep-black">
        <div className="flex flex-col lg:flex-row min-h-[600px]">
          
          {/* Left: Text Content */}
          <div className="lg:w-1/2 p-8 md:p-16 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-deep-black">
            <span className="inline-block px-3 py-1 border border-deep-black text-[10px] font-bold tracking-[0.2em] uppercase mb-8 w-fit bg-white">
              Vendor Spotlight
            </span>
            
            <h2 className="text-5xl md:text-7xl font-heading font-medium uppercase leading-[0.9] mb-8">
              Curated<br/>Excellence
            </h2>
            
            <p className="text-gray-600 text-sm md:text-base leading-relaxed max-w-md mb-12">
              Discover a handpicked selection of the finest brands in fashion, beauty, art, and lifestyle. 
              Our vendors represent the pinnacle of creativity and quality, bringing you unique products 
              that tell a story.
            </p>

            <Link to="/register" className="bg-deep-black text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gold hover:text-deep-black transition-all duration-300 flex items-center gap-2 w-fit">
              Apply to Vend
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>

          {/* Right: Image */}
          <div className="lg:w-1/2 relative min-h-[400px]">
            <img 
              src="/images/Gemini_Generated_Image_45z3p945z3p945z3.png" 
              alt="Vendor Showcase"
              className="w-full h-full object-cover"
            />
             {/* Decorative Label */}
             <div className="absolute bottom-0 left-0 bg-white border-t border-r border-deep-black px-6 py-3">
              <span className="text-xs font-bold tracking-widest uppercase">Est. 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          VENDOR DIRECTORY GRID
          ============================================ */}
      <div className="w-full px-4 md:px-8 py-16 md:py-24">
        
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 border-b border-deep-black pb-8">
          <h2 className="text-4xl md:text-6xl font-heading font-medium uppercase leading-none">
            Directory
          </h2>
          <div className="flex gap-4 mt-8 md:mt-0">
            <button 
              onClick={() => setFilter('All')}
              className={`text-xs font-bold uppercase tracking-[0.2em] border-b pb-1 transition-colors ${filter === 'All' ? 'border-deep-black text-deep-black' : 'border-transparent text-gray-400 hover:text-deep-black'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('Fashion')}
              className={`text-xs font-bold uppercase tracking-[0.2em] border-b pb-1 transition-colors ${filter === 'Fashion' ? 'border-deep-black text-deep-black' : 'border-transparent text-gray-400 hover:text-deep-black'}`}
            >
              Fashion
            </button>
            <button 
              onClick={() => setFilter('Beauty')}
              className={`text-xs font-bold uppercase tracking-[0.2em] border-b pb-1 transition-colors ${filter === 'Beauty' ? 'border-deep-black text-deep-black' : 'border-transparent text-gray-400 hover:text-deep-black'}`}
            >
              Beauty
            </button>
            <button 
              onClick={() => setFilter('Lifestyle')}
              className={`text-xs font-bold uppercase tracking-[0.2em] border-b pb-1 transition-colors ${filter === 'Lifestyle' ? 'border-deep-black text-deep-black' : 'border-transparent text-gray-400 hover:text-deep-black'}`}
            >
              Lifestyle
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-deep-black"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {filteredVendors.length > 0 ? filteredVendors.map((vendor, index) => (
              <div key={index} className="group cursor-pointer">
                 {/* Image Container */}
                 <div className="aspect-[4/5] overflow-hidden border border-deep-black relative mb-6">
                   <img 
                     src={vendor.image} 
                     alt={vendor.name}
                     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 grayscale group-hover:grayscale-0"
                   />
                   
                   {/* Category Tag Overlay */}
                   <div className="absolute top-0 left-0 bg-white border-b border-r border-deep-black px-4 py-2 z-10">
                     <span className="text-[10px] font-bold tracking-widest uppercase">{vendor.category}</span>
                   </div>

                   {/* Hover Overlay */}
                   <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300"></div>
                 </div>

                 {/* Text Content */}
                 <div className="flex justify-between items-start">
                   <div>
                     <h3 className="text-2xl font-heading font-medium uppercase mb-1 group-hover:underline decoration-1 underline-offset-4">{vendor.name}</h3>
                     <p className="text-xs text-gray-500 uppercase tracking-wider">Booth {vendor.booth || (100 + index)}</p>
                   </div>
                   <div className="w-8 h-8 rounded-full border border-deep-black flex items-center justify-center group-hover:bg-deep-black group-hover:text-white transition-all duration-300">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg>
                   </div>
                 </div>
              </div>
            )) : (
              <div className="col-span-full text-center py-12 text-gray-500 italic">
                No vendors found in this category.
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Vendors;
