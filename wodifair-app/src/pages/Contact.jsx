import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { apiRequest } from '../services/api';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    inquiryType: 'General',
    message: ''
  });
  
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error

  React.useEffect(() => {
    // Check for query param
    const searchParams = new URLSearchParams(window.location.search);
    const type = searchParams.get('type');
    if (type) {
      setFormData(prev => ({ ...prev, inquiryType: type }));
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    
    try {
      await apiRequest('/contact', {
        method: 'POST',
        body: formData
      });
      
      toast.success('Message sent successfully!');
      setStatus('success');
      setFormData({ name: '', email: '', inquiryType: 'General Inquiry', message: '' });
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to send message.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-cream text-deep-black font-body flex flex-col">
      {/* Title Banner (Consistent with Home & Register) */}
      <div className="w-full px-2 md:px-8 py-3 md:py-6 border-b border-deep-black">
        <div className="relative w-full max-w-[1920px] mx-auto">
          <div className="relative flex flex-col items-center w-full overflow-hidden">
            <h1 className="w-full text-[12vw] md:text-[10vw] leading-[0.8] font-heading font-medium tracking-tighter text-deep-black flex flex-nowrap justify-center items-center select-none whitespace-nowrap px-1 md:px-2 uppercase">
              <span>C</span>
              
              {/* O with Image */}
              <span className="relative inline-block mx-[0.02em]">
                 <div className="absolute inset-0 z-0 flex items-center justify-center">
                    <div className="mt-[0.11em] w-[80%] h-[89%] overflow-hidden rounded-full">
                     <img 
                       src="/images/IMG_3756.JPG.jpeg" 
                       alt="Contact"
                       className="w-full h-full object-cover"
                     />
                   </div>
                </div>
                <span className="relative z-10 text-deep-black mix-blend-multiply">O</span>
              </span>

              <span>NTA</span>

              {/* Second C with Image */}
              <span className="relative inline-block mx-[0.02em]">
                 <div className="absolute inset-0 z-0 flex items-center justify-center">
                    <div className="lg:ms-3  mt-[0.11em] w-[80%] h-[89%] overflow-hidden rounded-full">
                     <img 
                       src="/images/IMG_3766.JPG.jpeg" 
                       alt="Contact"
                       className="w-full h-full object-cover"
                     />
                   </div>
                </div>
                <span className="relative z-10 text-deep-black mix-blend-multiply">C</span>
              </span>

              <span>T</span>
            </h1>
            <div className="w-full flex justify-end pr-[1vw] md:pr-[2vw] relative z-20 mt-2">
              <span className="text-[3vw] md:text-[1.5vw] font-heading font-bold tracking-[0.2em] uppercase text-deep-black">
                Get In Touch
              </span>
            </div>
          </div>
        </div>
      </div>

      <Navigation activeItem="Contact" />

      {/* Main Content */}
      <div className="flex-grow w-full px-2 md:px-8 py-8 md:py-16">
        <div className="max-w-5xl mx-auto border border-deep-black bg-white relative">
          
          {/* Header Section inside Box */}
          <div className="bg-deep-black text-white p-10 md:p-16 text-center relative overflow-hidden border-b border-deep-black">
             {/* Background Image */}
             <div className="absolute inset-0 z-0">
               <img 
                 src="/images/pport harcourt.jpg" 
                 alt="Background" 
                 className="w-full h-full object-cover opacity-80"
               />
               <div className="absolute inset-0 bg-deep-black/20"></div>
             </div>

            <div className="relative z-10">
              <p className="text-xs md:text-sm font-bold tracking-[0.3em] uppercase mb-4 text-gray-300">
                Wodibenuah Fair 2026
              </p>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading font-normal uppercase tracking-wide leading-none mb-6">
                We&apos;d Love To<br/>Hear From You
              </h2>
              <p className="max-w-xl mx-auto text-white text-sm md:text-base leading-relaxed font-body font-medium drop-shadow-md">
                Whether you have a question about the fair, sponsorship opportunities, or press inquiries, our team is ready to assist you.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Left Column: Contact Info */}
            <div className="p-8 md:p-16 border-b md:border-b-0 md:border-r border-deep-black bg-gray-50 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-4 mb-12">
                  <span className="text-xs font-bold tracking-[0.2em] uppercase bg-deep-black text-white px-3 py-1">Info</span>
                  <h3 className="text-2xl font-heading font-bold uppercase text-deep-black">Contact Details</h3>
                </div>

                <div className="space-y-12">
                  <div className="group">
                    <span className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Email Us</span>
                    <a href="mailto:hello@wodibenuahfair.com" className="text-xl md:text-2xl font-body text-deep-black border-b border-transparent group-hover:border-deep-black transition-all inline-block">
                      hello@wodibenuahfair.com
                    </a>
                  </div>

                  <div className="group">
                    <span className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Call Us</span>
                    <a href="tel:+2348001234567" className="text-xl md:text-2xl font-body text-deep-black border-b border-transparent group-hover:border-deep-black transition-all inline-block">
                      +234 800 123 4567
                    </a>
                  </div>

                  <div className="group">
                    <span className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">WhatsApp</span>
                    <a href="https://wa.me/2348001234567" className="text-xl md:text-2xl font-body text-deep-black border-b border-transparent group-hover:border-deep-black transition-all inline-block">
                      +234 800 123 4567
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-16 pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-500 uppercase tracking-widest mb-4">Follow Us</p>
                <div className="flex flex-wrap gap-4">
                  <a href="https://www.instagram.com/wodibenuahfair?igsh=MXhia2tuMWRyaWl3dw==" target="_blank" rel="noopener noreferrer" className="text-xs font-bold uppercase tracking-wider text-deep-black hover:text-gray-600 transition-colors border border-deep-black px-4 py-2 hover:bg-deep-black hover:text-white flex-1 md:flex-none text-center">
                    Instagram
                  </a>
                  <a href="https://www.threads.com/@wodibenuahfair?igshid=NTc4MTIwNjQ2YQ==" target="_blank" rel="noopener noreferrer" className="text-xs font-bold uppercase tracking-wider text-deep-black hover:text-gray-600 transition-colors border border-deep-black px-4 py-2 hover:bg-deep-black hover:text-white flex-1 md:flex-none text-center">
                    Threads
                  </a>
                  <a href="https://www.youtube.com/@WodibenuahFair" target="_blank" rel="noopener noreferrer" className="text-xs font-bold uppercase tracking-wider text-deep-black hover:text-gray-600 transition-colors border border-deep-black px-4 py-2 hover:bg-deep-black hover:text-white flex-1 md:flex-none text-center">
                    YouTube
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column: Form */}
            <form onSubmit={handleSubmit} className="p-8 md:p-16 space-y-8 bg-white">
              <div className="flex items-center gap-4 mb-12">
                <span className="text-xs font-bold tracking-[0.2em] uppercase bg-deep-black text-white px-3 py-1">Form</span>
                <h3 className="text-2xl font-heading font-bold uppercase text-deep-black">Send a Message</h3>
              </div>

              <div className="group">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 group-focus-within:text-deep-black transition-colors">Full Name</label>
                <input 
                  required type="text" name="name" value={formData.name} onChange={handleChange}
                  className="w-full px-0 py-3 border-b border-gray-300 focus:border-deep-black bg-transparent outline-none transition-colors text-lg font-body placeholder-gray-300"
                  placeholder="ENTER YOUR NAME"
                />
              </div>

              <div className="group">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 group-focus-within:text-deep-black transition-colors">Email Address</label>
                <input 
                  required type="email" name="email" value={formData.email} onChange={handleChange}
                  className="w-full px-0 py-3 border-b border-gray-300 focus:border-deep-black bg-transparent outline-none transition-colors text-lg font-body placeholder-gray-300"
                  placeholder="EMAIL@ADDRESS.COM"
                />
              </div>

              <div className="group">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 group-focus-within:text-deep-black transition-colors">Inquiry Type</label>
                <select 
                  name="inquiryType" value={formData.inquiryType} onChange={handleChange}
                  className="w-full px-0 py-3 border-b border-gray-300 focus:border-deep-black bg-transparent outline-none transition-colors text-lg font-body cursor-pointer"
                >
                  <option>General Inquiry</option>
                  <option>Sponsorship</option>
                  <option>Press & Media</option>
                  <option>VIP Concierge</option>
                </select>
              </div>

              <div className="group">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 group-focus-within:text-deep-black transition-colors">Message</label>
                <textarea 
                  required name="message" value={formData.message} onChange={handleChange} rows="4"
                  className="w-full px-0 py-3 border-b border-gray-300 focus:border-deep-black bg-transparent outline-none transition-colors text-lg font-body placeholder-gray-300 resize-none"
                  placeholder="HOW CAN WE HELP?"
                ></textarea>
              </div>

              <div className="pt-8">
                <button 
                  type="submit"
                  disabled={status === 'submitting'}
                  className="bg-deep-black text-white px-12 py-5 text-sm font-bold uppercase tracking-[0.25em] hover:bg-white hover:text-deep-black border border-deep-black transition-all duration-300 shadow-lg hover:shadow-xl w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4"
                >
                  {status === 'submitting' ? (
                    <>Sending...</>
                  ) : (
                    <>
                      Send Message
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Contact;
