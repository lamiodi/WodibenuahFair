import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { motion, AnimatePresence } from 'framer-motion';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "What is Wodibenuah Fair?",
      answer: "Wodibenuah Fair is a premier luxury vendor exhibition that brings together the finest brands in fashion, beauty, art, and lifestyle. We curate an exclusive experience for vendors to showcase their products and for attendees to discover unique, high-quality items."
    },
    {
      question: "How can I become a vendor?",
      answer: "To become a vendor, visit our Registration page, select your category, and fill out the application form. All applications are reviewed to ensure they meet our quality standards. Once approved, you will be prompted to complete your payment."
    },
    {
      question: "What categories of vendors do you accept?",
      answer: "We accept vendors across various luxury categories including Fashion (Apparel & Accessories), Beauty & Wellness, Fine Art, Gourmet Food & Drink, and Home Decor. We strictly limit vendors to one or two categories per booth to maintain quality."
    },
    {
      question: "Is there an entrance fee for attendees?",
      answer: "Ticket information varies by event location. General admission is typically free or low-cost, while VIP tickets offer exclusive perks such as lounge access, priority entry, and goodie bags. Please check the Event Info page for specific details."
    },
    {
      question: "What is the refund policy for vendors?",
      answer: "All vendor payments are non-refundable. However, if you are unable to attend, you may request to transfer your slot to the next fair, provided you notify us at least 30 days in advance. Please refer to our Terms & Conditions for full details."
    },
    {
      question: "Are there sponsorship opportunities?",
      answer: "Yes, we offer various sponsorship packages for brands looking to gain significant exposure. Please contact us via the Contact page and select 'Sponsorship' as your inquiry type."
    }
  ];

  return (
    <div className="min-h-screen bg-cream text-deep-black font-body flex flex-col">
      {/* Title Banner */}
      <div className="w-full px-2 md:px-8 py-3 md:py-6 border-b border-deep-black">
        <div className="relative w-full max-w-[1920px] mx-auto overflow-hidden">
          <h1 className="w-full text-[14vw] leading-[0.8] font-heading font-medium tracking-tighter text-deep-black flex flex-nowrap justify-center items-center select-none whitespace-nowrap px-1">
            <span>FAQ</span>
          </h1>
        </div>
      </div>

      <Navigation activeItem="FAQ" />

      <div className="flex-grow max-w-4xl mx-auto px-4 py-16 md:py-24 w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-heading font-bold uppercase mb-4">Frequently Asked Questions</h2>
          <p className="text-gray-600 max-w-lg mx-auto">Everything you need to know about the fair, registration, and attendance.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-deep-black bg-white transition-all duration-300 hover:shadow-lg">
              <button 
                onClick={() => toggleAccordion(index)}
                className="w-full px-6 md:px-8 py-6 flex items-center justify-between text-left focus:outline-none"
              >
                <span className="text-lg md:text-xl font-heading font-bold uppercase pr-8">{faq.question}</span>
                <span className="relative flex-shrink-0 w-6 h-6 flex items-center justify-center border border-deep-black rounded-full">
                  <span className={`absolute w-3 h-[2px] bg-deep-black transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}></span>
                  <span className={`absolute w-3 h-[2px] bg-deep-black transition-transform duration-300 ${openIndex === index ? 'rotate-180 opacity-0' : 'rotate-90'}`}></span>
                </span>
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 md:px-8 pb-8 text-gray-600 leading-relaxed font-body border-t border-gray-100 pt-4">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="mb-6 font-medium">Still have questions?</p>
          <a href="/contact" className="inline-block bg-deep-black text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gold hover:text-deep-black transition-all duration-300">
            Contact Support
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FAQ;
