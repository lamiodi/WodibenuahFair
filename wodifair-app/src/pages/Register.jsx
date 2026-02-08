import React, { useState } from 'react';
import toast from 'react-hot-toast';
import PaystackPop from '@paystack/inline-js';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { apiRequest } from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phoneNumber: '',
    whatsappNumber: '',
    instagramHandle: '',
    businessName: '',
    sector: '',
    isPreviousVendor: false,
    liveInAbuja: false,
    categoryAccepted: false,
    agreeToMarket: false,
    agreeToWhatsapp: false,
    agreeToTerms: false
  });

  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  const [nextEvent, setNextEvent] = useState(null);

  React.useEffect(() => {
    apiRequest('/events/next').then(data => {
      if (data) setNextEvent(data);
    }).catch(err => console.error(err));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePayment = (vendorId) => {
    const paystack = new PaystackPop();
    paystack.newTransaction({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email: formData.email,
      amount: 500000, // ₦5,000 in kobo
      onSuccess: (transaction) => {
        toast.loading('Verifying payment...', { id: 'payment-toast' });
        // Verify payment on backend
        apiRequest('/vendors/verify-payment', {
          method: 'POST',
          body: {
            reference: transaction.reference,
            vendorId: vendorId
          }
        })
        .then(data => {
          if (data.status === 'success') {
            toast.success('Payment successful!', { id: 'payment-toast' });
            setStatus('success');
          } else {
            toast.error('Payment verification failed.', { id: 'payment-toast' });
            setStatus('error');
          }
        })
        .catch(err => {
          console.error(err);
          toast.error('Error verifying payment.', { id: 'payment-toast' });
          setStatus('error');
        });
      },
      onCancel: () => {
        setStatus('error');
        toast.error('Transaction cancelled');
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    toast.loading('Registering vendor...', { id: 'register-toast' });
    
    try {
      const data = await apiRequest('/vendors/register', {
        method: 'POST',
        body: { ...formData, eventId: nextEvent?.id }
      });
      
      if (data.vendor) {
        toast.success('Registration successful! Proceeding to payment...', { id: 'register-toast' });
        // Trigger Paystack Payment
        handlePayment(data.vendor.id);
      } else {
        toast.error(data.error || 'Registration failed. Please try again.', { id: 'register-toast' });
        setStatus('error');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Network error. Please try again.', { id: 'register-toast' });
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-cream text-deep-black font-body flex flex-col">
        <div className="w-full px-2 md:px-8 py-3 md:py-6 border-b border-deep-black">
          <div className="relative w-full max-w-[1920px] mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-heading font-bold tracking-tighter text-deep-black uppercase">
              Registration
            </h1>
          </div>
        </div>
        <Navigation activeItem="Register" />
        
        <div className="flex-grow flex items-center justify-center px-4 py-20">
          <div className="bg-white p-12 md:p-16 border border-deep-black max-w-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-deep-black"></div>
            <h2 className="text-3xl md:text-5xl font-heading font-normal uppercase text-deep-black mb-6 leading-none">
              Registration<br/>Successful
            </h2>
            <div className="w-20 h-[2px] bg-deep-black mx-auto mb-8"></div>
            <p className="text-lg text-gray-600 mb-10 leading-relaxed">
              Thank you for registering for Wodibenuahfair Abuja 2026. 
              We will review your application and contact you shortly via email.
            </p>
            <button 
              onClick={() => setStatus('idle')}
              className="bg-deep-black text-white px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-deep-black border border-deep-black transition-all duration-300"
            >
              Submit Another
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-deep-black font-body flex flex-col">
      {/* Title Banner (Consistent with Home) */}
      <div className="w-full px-2 md:px-8 py-3 md:py-6 border-b border-deep-black">
        <div className="relative w-full max-w-[1920px] mx-auto">
          <div className="relative flex flex-col items-center w-full overflow-hidden">
            <h1 className="w-full text-[10vw] md:text-[8vw] leading-[0.8] font-heading font-medium tracking-tighter text-deep-black flex flex-nowrap justify-center items-center select-none whitespace-nowrap px-1 md:px-2 uppercase">
              Registration
            </h1>
            <div className="w-full flex justify-end pr-[1vw] md:pr-[5vw] relative z-20 mt-2">
              <span className="text-[3vw] md:text-[1.5vw] font-heading font-bold tracking-[0.2em] uppercase text-deep-black">
                Vendor Application
              </span>
            </div>
          </div>
        </div>
      </div>

      <Navigation activeItem="Register" />

      {/* Main Content */}
      <div className="flex-grow w-full px-2 md:px-8 py-8 md:py-16">
        <div className="max-w-5xl mx-auto border border-deep-black bg-white relative">
          
          {/* Header Section inside Box */}
          <div className="bg-deep-black text-white p-10 md:p-16 text-center relative overflow-hidden border-b border-deep-black">
             {/* Background Image */}
             <div className="absolute inset-0 z-0">
               <img 
                 src="/images/Gemini_Generated_Image_euj3e6euj3e6euj3.png" 
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
                Join The<br/>Exhibition
              </h2>
              <p className="max-w-xl mx-auto text-white text-sm md:text-base leading-relaxed font-body font-medium drop-shadow-md">
                The Wodibenuah Fair stands as a premier exhibition, hosting a cultural extravaganza that surpasses all expectations.
              </p>
            </div>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="p-8 md:p-16 space-y-12">
            
            {/* Section 1: Personal Info */}
            <div>
              <div className="flex items-center gap-4 mb-8">
                <span className="text-xs font-bold tracking-[0.2em] uppercase bg-deep-black text-white px-3 py-1">Step 01</span>
                <h3 className="text-2xl font-heading font-bold uppercase text-deep-black">Personal & Business Info</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2 group">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 group-focus-within:text-deep-black transition-colors">Full Name *</label>
                  <input 
                    required type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                    className="w-full px-0 py-3 border-b border-gray-300 focus:border-deep-black bg-transparent outline-none transition-colors text-lg font-body placeholder-gray-300"
                    placeholder="ENTER YOUR FULL NAME"
                  />
                </div>

                <div className="group">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 group-focus-within:text-deep-black transition-colors">Email Address *</label>
                  <input 
                    required type="email" name="email" value={formData.email} onChange={handleChange}
                    className="w-full px-0 py-3 border-b border-gray-300 focus:border-deep-black bg-transparent outline-none transition-colors text-lg font-body placeholder-gray-300"
                    placeholder="EMAIL@ADDRESS.COM"
                  />
                </div>

                <div className="group">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 group-focus-within:text-deep-black transition-colors">Phone Number *</label>
                  <input 
                    required type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange}
                    className="w-full px-0 py-3 border-b border-gray-300 focus:border-deep-black bg-transparent outline-none transition-colors text-lg font-body placeholder-gray-300"
                    placeholder="+234..."
                  />
                </div>

                <div className="group">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 group-focus-within:text-deep-black transition-colors">WhatsApp Number *</label>
                  <input 
                    required type="tel" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange}
                    className="w-full px-0 py-3 border-b border-gray-300 focus:border-deep-black bg-transparent outline-none transition-colors text-lg font-body placeholder-gray-300"
                    placeholder="+234..."
                  />
                </div>

                <div className="group">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 group-focus-within:text-deep-black transition-colors">Instagram Handle *</label>
                  <input 
                    required type="text" name="instagramHandle" value={formData.instagramHandle} onChange={handleChange}
                    className="w-full px-0 py-3 border-b border-gray-300 focus:border-deep-black bg-transparent outline-none transition-colors text-lg font-body placeholder-gray-300"
                    placeholder="@YOURHANDLE"
                  />
                </div>

                <div className="md:col-span-2 group">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 group-focus-within:text-deep-black transition-colors">Business Name *</label>
                  <input 
                    required type="text" name="businessName" value={formData.businessName} onChange={handleChange}
                    className="w-full px-0 py-3 border-b border-gray-300 focus:border-deep-black bg-transparent outline-none transition-colors text-lg font-body placeholder-gray-300"
                    placeholder="YOUR BUSINESS NAME"
                  />
                </div>

                <div className="md:col-span-2 group">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 group-focus-within:text-deep-black transition-colors">Business Sector *</label>
                  <select 
                    required name="sector" value={formData.sector} onChange={handleChange}
                    className="w-full px-0 py-3 border-b border-gray-300 focus:border-deep-black bg-transparent outline-none transition-colors text-lg font-body cursor-pointer"
                  >
                    <option value="">SELECT A SECTOR</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Beauty">Beauty</option>
                    <option value="Food & Drink">Food & Drink</option>
                    <option value="Art & Lifestyle">Art & Lifestyle</option>
                    <option value="Services">Services</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Eligibility */}
            <div>
              <div className="flex items-center gap-4 mb-8 border-t border-gray-200 pt-12">
                <span className="text-xs font-bold tracking-[0.2em] uppercase bg-deep-black text-white px-3 py-1">Step 02</span>
                <h3 className="text-2xl font-heading font-bold uppercase text-deep-black">Eligibility & Commitments</h3>
              </div>

              <div className="space-y-6">
                {[
                  { name: 'isPreviousVendor', label: 'I am a previous vendor' },
                  { name: 'liveInAbuja', label: 'I live in Abuja / am available to exhibit in Abuja *' },
                  { name: 'categoryAccepted', label: 'I confirm my business category is accepted by the exhibition *' },
                  { name: 'agreeToMarket', label: 'I agree to ACTIVELY Market my business and contribute to the Fair *' },
                  { name: 'agreeToWhatsapp', label: 'I agree to JOIN & REMAIN ACTIVE in the assigned WhatsApp group *' }
                ].map((item) => (
                  <label key={item.name} className="flex items-start gap-4 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        name={item.name}
                        required={item.name !== 'isPreviousVendor'}
                        checked={formData[item.name]}
                        onChange={handleChange}
                        className="peer h-6 w-6 cursor-pointer appearance-none border border-deep-black transition-all checked:bg-deep-black"
                      />
                      <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-sm md:text-base text-gray-600 group-hover:text-deep-black transition-colors pt-0.5">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Section 3: Terms & Submit */}
            <div className="border-t border-deep-black pt-12">
              <div className="bg-gray-100 p-8 border border-gray-200 mb-8">
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                  By submitting this form, you acknowledge that you have read attentively and responded truthfully to all inquiries.
                </p>
                <label className="flex items-center gap-4 cursor-pointer group">
                   <div className="relative flex items-center">
                      <input 
                        required type="checkbox" name="agreeToTerms" checked={formData.agreeToTerms} onChange={handleChange}
                        className="peer h-6 w-6 cursor-pointer appearance-none border border-deep-black transition-all checked:bg-deep-black"
                      />
                      <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  <span className="text-sm font-bold uppercase tracking-wider text-deep-black">I agree to Wodibenuah fair Terms & Conditions *</span>
                </label>
              </div>

              <div className="text-center">
                <button 
                  type="submit"
                  disabled={status === 'submitting'}
                  className="bg-deep-black text-white px-12 py-5 text-sm font-bold uppercase tracking-[0.25em] hover:bg-white hover:text-deep-black border border-deep-black transition-all duration-300 shadow-lg hover:shadow-xl w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 mx-auto"
                >
                  {status === 'submitting' ? (
                    <>Processing...</>
                  ) : (
                    <>
                      Register & Pay
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </>
                  )}
                </button>
              </div>
              
              {status === 'error' && (
                <div className="text-red-600 text-center font-bold mt-6 text-sm uppercase tracking-widest">
                  Transaction failed. Please try again.
                </div>
              )}
            </div>

          </form>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Register;
