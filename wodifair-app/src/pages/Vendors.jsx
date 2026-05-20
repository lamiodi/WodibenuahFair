import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const Vendors = () => {
  const [filter, setFilter] = useState('All');

  // Static Vendor Showcase Data (Placeholder for now, can be expanded)
  const vendors = [
    {
      name: "Luxe Apparel",
      category: "Fashion",
      image: "https://res.cloudinary.com/dwmz4youk/image/upload/v1779310094/wodifair/DJI_0509.jpg", 
      booth: "A-12"
    },
    {
      name: "Urban Trends",
      category: "Fashion",
      image: "https://res.cloudinary.com/dwmz4youk/image/upload/v1779310099/wodifair/DJI_0510.jpg",
      booth: "B-05"
    },
    {
      name: "Glow Beauty",
      category: "Beauty",
      image: "https://res.cloudinary.com/dwmz4youk/image/upload/v1779310088/wodifair/DJI_0511.jpg",
      booth: "C-08"
    },
    {
      name: "Pure Wellness",
      category: "Lifestyle",
      image: "https://res.cloudinary.com/dwmz4youk/image/upload/v1779310083/wodifair/DJI_0512.jpg",
      booth: "C-09"
    },
    {
      name: "Artisan Home",
      category: "Lifestyle",
      image: "https://res.cloudinary.com/dwmz4youk/image/upload/v1779310086/wodifair/DJI_0513.jpg",
      booth: "D-15"
    },
    {
      name: "Taste of Africa",
      category: "Lifestyle",
      image: "https://res.cloudinary.com/dwmz4youk/image/upload/v1779310098/wodifair/DJI_0514.jpg",
      booth: "E-02"
    },
    {
      name: "Royal Fabrics",
      category: "Fashion",
      image: "https://res.cloudinary.com/dwmz4youk/image/upload/v1779310100/wodifair/DJI_0515.jpg",
      booth: "A-14"
    },
    {
      name: "Natural Essence",
      category: "Beauty",
      image: "https://res.cloudinary.com/dwmz4youk/image/upload/v1779310095/wodifair/DJI_0516.jpg",
      booth: "C-11"
    },
    {
      name: "Modern Living",
      category: "Lifestyle",
      image: "https://res.cloudinary.com/dwmz4youk/image/upload/v1779310105/wodifair/DJI_0517.jpg",
      booth: "D-03"
    },
    {
      name: "Heritage Crafts",
      category: "Lifestyle",
      image: "https://res.cloudinary.com/dwmz4youk/image/upload/v1779310091/wodifair/DJI_0518.jpg",
      booth: "D-07"
    },
    {
      name: "Elite Styles",
      category: "Fashion",
      image: "https://res.cloudinary.com/dwmz4youk/image/upload/v1779310089/wodifair/DJI_0519.jpg",
      booth: "B-08"
    },
    {
      name: "Zen Garden",
      category: "Lifestyle",
      image: "https://res.cloudinary.com/dwmz4youk/image/upload/v1779310084/wodifair/DJI_0520.jpg",
      booth: "E-05"
    }
  ];

  const filteredVendors = filter === 'All' 
    ? vendors 
    : vendors.filter(v => v.category.toLowerCase().includes(filter.toLowerCase()) || 
                          (filter === 'Lifestyle' && ['Home Decor', 'Wellness', 'Art'].some(c => v.category.includes(c))));

  return (
    <div className="min-h-screen bg-cream text-deep-black font-body flex flex-col">
      <SEO
        title="Explore Vendors"
        description="Explore fashion, beauty, lifestyle, and luxury vendors featured at Wodibenuah Fair across Abuja, Lagos, and Port Harcourt."
        url="/vendors"
        image="https://res.cloudinary.com/dwmz4youk/image/upload/v1779310110/wodifair/IMG_0164.jpg"
      />
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
                  <div className=" ms-2 lg:ms-3   mt-[0.1em] w-[85%] h-[81%] overflow-hidden rounded-full">
                   <img 
                     src="https://res.cloudinary.com/dwmz4youk/image/upload/v1779310116/wodifair/IMG_3766.JPG.jpg" 
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
              src="https://res.cloudinary.com/dwmz4youk/image/upload/v1779310110/wodifair/IMG_0164.jpg" 
              alt="Vendor Showcase"
              className="w-full h-full object-cover"
            />
             {/* Decorative Label */}
             <div className="absolute bottom-0 left-0 bg-white border-t border-r border-deep-black px-6 py-3">
              <span className="text-xs font-bold tracking-widest uppercase">Wodi.™</span>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {filteredVendors.length > 0 ? filteredVendors.map((vendor, index) => (
              <div key={index} className="group cursor-pointer">
                 {/* Image Container */}
                 <div className="aspect-[4/5] overflow-hidden border border-deep-black relative mb-6">
                   <img 
                     src={vendor.image} 
                     alt={vendor.name}
                     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
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
      </div>

      <Footer />
    </div>
  );
};

export default Vendors;
