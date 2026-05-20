import React from 'react';
import { motion } from 'framer-motion';

const Loading = () => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-cream h-[100dvh]">
      <div className="relative w-32 h-32 md:w-40 md:h-40">
        {/* Central Logo Container */}
        <div className="absolute inset-0 flex items-center justify-center bg-white rounded-full border border-deep-black overflow-hidden shadow-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: [0.95, 1.05, 0.95] }}
            transition={{ 
              opacity: { duration: 0.8, ease: "easeOut" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" } 
            }}
            className="w-20 h-20 md:w-24 md:h-24 relative"
          >
             <img 
               src="https://res.cloudinary.com/dwmz4youk/image/upload/v1779310125/wodifair/Wodi_SM_17.png" 
               alt="Wodifair Loading" 
               className="w-full h-full object-contain p-2"
             />
          </motion.div>
        </div>
      </div>

      {/* Loading Text */}
      <motion.div 
        className="mt-8 flex flex-col items-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-xl md:text-2xl font-heading font-bold tracking-[0.2em] text-deep-black uppercase">
          Wodifair
        </h2>
        <div className="flex gap-1 mt-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 bg-gold rounded-full"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Loading;
