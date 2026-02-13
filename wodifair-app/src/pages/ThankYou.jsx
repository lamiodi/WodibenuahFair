import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

const ThankYou = () => {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference');
  
  // Try to get location from state or localStorage if available, 
  // but since we redirect from Paystack, state might be lost unless passed in URL.
  // Ideally, we should pass location as a query param too.
  // For now, let's look for a generic message or try to read 'location' query param if I add it to the redirect logic.
  const location = searchParams.get('location') || 'your selected location';

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full text-center"
      >
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
          <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase mb-6 text-deep-black">
          Payment Successful
        </h1>
        
        <p className="text-xl text-gray-600 mb-8 font-light">
          Thank you for securing your spot at Wodibenuah Fair!
        </p>

        <div className="bg-cream border border-deep-black p-8 mb-10 max-w-md mx-auto">
          <p className="text-sm uppercase tracking-wider text-gray-500 mb-2">Transaction Reference</p>
          <p className="text-2xl font-bold font-mono text-deep-black">{reference || 'PENDING'}</p>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">
            A confirmation email with your receipt and further instructions has been sent to your email address.
          </p>
          <p className="text-lg font-medium text-deep-black bg-gray-50 p-4 border-l-4 border-gold">
             The event location in <strong>{location}</strong> will be communicated to you shortly via email.
          </p>
          <p className="text-gray-600">
            Please check your spam folder if you don't see it within a few minutes.
          </p>
        </div>

        <div className="mt-12 flex flex-col md:flex-row gap-4 justify-center">
          <Link 
            to="/" 
            className="bg-deep-black text-white px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-gold hover:text-deep-black transition-colors"
          >
            Return Home
          </Link>
          <Link 
            to="/contact" 
            className="bg-transparent border border-deep-black text-deep-black px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-deep-black hover:text-white transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ThankYou;
