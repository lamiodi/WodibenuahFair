import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PaystackPop from '@paystack/inline-js';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { apiRequest } from '../services/api';

const Register = () => {
  const [searchParams] = useSearchParams();
  const locationParam = searchParams.get('location');
  const eventIdParam = searchParams.get('eventId');
  const navigate = useNavigate();
  const errorRef = React.useRef(null);

  const [formData, setFormData] = useState({
    eventId: '',
    email: '',
    fullName: '', 
    phoneNumber: '',
    whatsappNumber: '',
    instagramHandle: '',
    businessName: '',
    sector: '',
    boothType: '',
    selectedLocation: '',
    isPreviousVendor: false,
    liveInAbuja: false,
    categoryAccepted: false,
    agreeToMarket: false,
    agreeToWhatsapp: false,
    agreeToTerms: false
  });

  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [events, setEvents] = useState([]);

  // Store all pricing configurations
  const [allPrices, setAllPrices] = useState({
    'Default': {
      'Royal Booth': 380000,
      'Food Slot': 300000,
      'Half Booth': 190000
    },
    'Port Harcourt': {
      'Royal Booth': 350000,
      'Food Slot': 250000,
      'Single Booth': 175000
    }
  });

  // Current active prices based on location
  const [boothPrices, setBoothPrices] = useState(allPrices['Default']);

  useEffect(() => {
    // Fetch prices configuration
    apiRequest('/vendors/prices').then(data => {
      if (data) {
        setAllPrices(data);
        // Initial update based on current selection
        updateBoothPrices(formData.selectedLocation, data);
      }
    }).catch(err => console.error('Failed to load prices', err));

    // Fetch all events
    apiRequest('/events').then(data => {
      if (data) {
        const eventsList = Array.isArray(data) ? data : [data];
        setEvents(eventsList);

        if (eventIdParam) {
          const matchedEvent = eventsList.find(e => e.id.toString() === eventIdParam);
          if (matchedEvent) {
            setFormData(prev => ({ ...prev, eventId: matchedEvent.id }));
          }
        } else if (locationParam) {
          // Auto-select location from URL param if valid
          const loc = locationParam.charAt(0).toUpperCase() + locationParam.slice(1);
          setFormData(prev => ({ ...prev, selectedLocation: loc }));
        }
      }
    }).catch(err => console.error(err));
  }, [locationParam, eventIdParam]);

  // Update booth prices when location changes
  const updateBoothPrices = (location, prices = allPrices) => {
    if (location === 'Port Harcourt' && prices['Port Harcourt']) {
      setBoothPrices(prices['Port Harcourt']);
    } else {
      setBoothPrices(prices['Default'] || prices);
    }
  };

  useEffect(() => {
    updateBoothPrices(formData.selectedLocation);
  }, [formData.selectedLocation, allPrices]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePayment = (vendorId) => {
    // Paystack expects amount in kobo
    const amountToCharge = (boothPrices[formData.boothType] || 190000) * 100;

    const paystack = new PaystackPop();
    paystack.newTransaction({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email: formData.email,
      amount: amountToCharge,
      metadata: {
        vendorId: vendorId,
        custom_fields: [
          { display_name: "Booth Type", variable_name: "booth_type", value: formData.boothType },
          { display_name: "Location", variable_name: "location", value: formData.selectedLocation }
        ]
      },
      onSuccess: (transaction) => {
        setStatus('verifying');
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
              setErrorMessage('');
              // Redirect to Thank You page with reference and location
              navigate(`/thank-you?reference=${transaction.reference}&location=${encodeURIComponent(formData.selectedLocation || 'your location')}`);
            } else {
              const msg = data.message || 'Payment verification failed.';
              toast.error(msg, { id: 'payment-toast' });
              setErrorMessage(msg);
              setStatus('error');
              if (errorRef.current) errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          })
          .catch(err => {
            console.error(err);
            const msg = err.message || 'Error verifying payment.';
            toast.error(msg, { id: 'payment-toast' });
            setErrorMessage(msg);
            setStatus('error');
            if (errorRef.current) errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          });
      },
      onCancel: () => {
        setStatus('error');
        setErrorMessage('Transaction cancelled. Please try again when you are ready.');
        toast.error('Transaction cancelled');
        if (errorRef.current) errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');
    toast.loading('Registering vendor...', { id: 'register-toast' });

    try {
      const data = await apiRequest('/vendors/register', {
        method: 'POST',
        body: formData
      });

      if (data.vendor) {
        toast.success('Registration successful! Proceeding to payment...', { id: 'register-toast' });
        // Trigger Paystack Payment
        handlePayment(data.vendor.id);
      } else {
        const msg = data.error || 'Registration failed. Please try again.';
        toast.error(msg, { id: 'register-toast' });
        setErrorMessage(msg);
        setStatus('error');
        if (errorRef.current) errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch (err) {
      console.error(err);
      let msg = err.message || 'Network error. Please check your connection and try again.';

      // Enhance error messages
      if (msg.includes('already registered')) {
        msg = 'This email is already registered. Please check your email for previous confirmation or contact support.';
      }

      toast.error(msg, { id: 'register-toast' });
      setErrorMessage(msg);
      setStatus('error');
      if (errorRef.current) errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (status === 'verifying') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-deep-black/90 backdrop-blur-md">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-3xl font-heading font-bold uppercase tracking-widest mb-2">Verifying Payment</h2>
          <p className="text-gray-400 text-sm tracking-wider uppercase">Please do not close this window</p>
        </div>
      </div>
    );
  }

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
              Registration<br />Successful
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
        <div className="max-w-5xl mx-auto mb-8 bg-gold/10 border border-gold p-4 text-center">
          <p className="text-sm md:text-base font-bold text-deep-black uppercase tracking-wider">
            Already registered but haven't paid? <a href="/complete-payment" className="underline hover:text-gold transition-colors">Click here to complete your payment</a>
          </p>
        </div>

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
                Join The<br />Exhibition
              </h2>
              <p className="max-w-xl mx-auto text-white text-sm md:text-base leading-relaxed font-body font-medium drop-shadow-md">
                The Wodibenuah Fair stands as a premier exhibition, hosting a cultural extravaganza that surpasses all expectations.
              </p>
            </div>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="p-8 md:p-16 space-y-12">

            {/* Error Message Display */}
            {status === 'error' && (
              <div ref={errorRef} className="bg-red-50 border-l-4 border-red-500 p-6 mb-8 animate-pulse">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-red-800 uppercase tracking-wider">
                      Submission Error
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <div className="pl-2 border-l-2 border-red-300 mb-4">
                        {errorMessage.split('\n').map((msg, i) => (
                          <p key={i} className="font-bold mb-1">• {msg}</p>
                        ))}
                      </div>
                      <p className="mt-2 text-xs uppercase tracking-widest font-bold">Please correct the issue(s) above and try again.</p>
                      {errorMessage.toLowerCase().includes('already registered') && (
                        <div className="mt-3">
                          <a href="/contact" className="text-red-900 underline font-bold hover:text-red-700">Contact Support</a> if you need assistance.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 1: Personal Info */}
            <div>
              <div className="flex items-center gap-4 mb-8">
                <span className="text-xs font-bold tracking-[0.2em] uppercase bg-deep-black text-white px-3 py-1">Step 01</span>
                <h3 className="text-2xl font-heading font-bold uppercase text-deep-black">Personal & Business Info</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Replaced with simple location selector if needed, or rely on selectedLocation state if it exists */}
                {/* Assuming user still wants to choose "Abuja" or "Lagos" broadly? 
                    The previous prompt asked for "a location selector that is like abuja or lagos".
                    Let's check if 'selectedLocation' input exists in the form below line 300.
                    I need to read more lines to confirm. 
                    But for now, I will COMMENT OUT the specific eventId selector.
                    I will also ensure 'eventId' is not strictly required by frontend validation if I remove the input.
                    Wait, 'eventId' is marked 'required' in the select.
                    If I remove it, I must handle the backend requirement.
                    The backend might default it or I should pick a default event based on selectedLocation.
                */}

                <div className="md:col-span-2 group">
                  {/* Fallback hidden input to avoid validation errors if we auto-select */}
                  {/* However, for now, let's just remove the visual selector. 
                       I will assume the 'selectedLocation' dropdown (which I haven't seen yet but user asked for) 
                       is further down or should be added here.
                   */}

                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 group-focus-within:text-deep-black transition-colors">Select Location *</label>
                  <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wide">Choose the city where you want to exhibit</p>
                  <select
                    required name="selectedLocation" value={formData.selectedLocation} onChange={(e) => {
                      handleChange(e);
                      // Auto-select event based on location if possible
                      const loc = e.target.value;
                      if (loc && events.length > 0) {
                        const matched = events.find(ev => ev.location.toLowerCase().includes(loc.toLowerCase()));
                        if (matched) {
                          setFormData(prev => ({ ...prev, eventId: matched.id, selectedLocation: loc }));
                        }
                      }
                    }}
                    className="w-full px-0 py-3 border-b border-gray-300 focus:border-deep-black bg-transparent outline-none transition-colors text-lg font-body cursor-pointer"
                  >
                    <option value="">SELECT LOCATION</option>
                    <option value="Abuja">Abuja</option>
                    <option value="Lagos">Lagos</option>
                    <option value="Port Harcourt">Port Harcourt</option>
                  </select>
                </div>

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
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 group-focus-within:text-deep-black transition-colors">WhatsApp Number *</label>
                  <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wide">Must be an active number for vendor group communication</p>
                  <input
                    required type="tel" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange}
                    className="w-full px-0 py-3 border-b border-gray-300 focus:border-deep-black bg-transparent outline-none transition-colors text-lg font-body placeholder-gray-300"
                    placeholder="+234..."
                  />
                </div>

                <div className="group">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 group-focus-within:text-deep-black transition-colors">Instagram Handle *</label>
                  <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wide">Your primary business social media account</p>
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 group-focus-within:text-deep-black transition-colors">Business Sector *</label>
                  <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wide">Choose the category that best fits your products or services</p>
                  <select
                    required name="sector" value={formData.sector} onChange={handleChange}
                    className="w-full px-0 py-3 border-b border-gray-300 focus:border-deep-black bg-transparent outline-none transition-colors text-lg font-body cursor-pointer"
                  >
                    <option value="">SELECT A SECTOR</option>
                    <option value="Fashion & Apparel">Fashion & Apparel</option>
                    <option value="Beauty, Cosmetics & Skincare">Beauty, Cosmetics & Skincare</option>
                    <option value="Food & Beverages">Food & Beverages</option>
                    <option value="Drinks">Drinks</option>
                    <option value="Art, Crafts & Lifestyle">Art, Crafts & Lifestyle</option>
                    <option value="Home & Interior Decor">Home & Interior Decor</option>
                    <option value="Health & Wellness">Health & Wellness</option>
                    <option value="Kids & Maternity">Kids & Maternity</option>
                    <option value="Tech & Gadgets">Tech & Gadgets</option>
                    <option value="Services & Consultancy">Services & Consultancy</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="md:col-span-2 group">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 group-focus-within:text-deep-black transition-colors">Booth Type *</label>
                  <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wide">Select the size and type of booth you require.</p>
                  <select
                    required name="boothType" value={formData.boothType} onChange={handleChange}
                    className="w-full px-0 py-3 border-b border-gray-300 focus:border-deep-black bg-transparent outline-none transition-colors text-lg font-body cursor-pointer"
                  >
                    <option value="">SELECT A BOOTH TYPE</option>
                    {Object.entries(boothPrices).map(([type, price]) => (
                      <option key={type} value={type}>
                        {type} - ₦{price.toLocaleString()}
                      </option>
                    ))}
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
                  { name: 'liveInAbuja', label: `I live in ${formData.selectedLocation || 'Abuja'} / am available to exhibit in ${formData.selectedLocation || 'Abuja'} *` },
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
            </div>

          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Register;
