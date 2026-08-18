import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { apiRequest } from '../services/api';
import SEO from '../components/SEO';

const LAGOS_LOCATION = 'Lagos';

const INITIAL_FORM_DATA = {
  eventId: '',
  email: '',
  fullName: '',
  phoneNumber: '',
  whatsappNumber: '',
  instagramHandle: '',
  businessName: '',
  sector: '',
  boothType: '',
  selectedLocation: LAGOS_LOCATION,
  isPreviousVendor: false,
  liveInLagos: false,
  categoryAccepted: false,
  agreeToMarket: false,
  agreeToWhatsapp: false,
  agreeToTerms: false
};

const Register = () => {
  const navigate = useNavigate();
  const errorRef = React.useRef(null);

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [fieldErrors, setFieldErrors] = useState({});

  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const resetForm = () => {
    setFormData({ ...INITIAL_FORM_DATA });
    setFieldErrors({});
    // Re-fetch eventId for Lagos after reset
    apiRequest('/events').then(data => {
      if (data) {
        const eventsList = Array.isArray(data) ? data : [data];
        const lagosEvent = eventsList.find(e =>
          e.location?.toLowerCase().includes('lagos')
        ) || eventsList[0];
        if (lagosEvent) {
          setFormData(prev => ({ ...prev, eventId: lagosEvent.id }));
        }
      }
    }).catch(() => {});
    setStatus('idle');
    setErrorMessage('');
  };

  // Store all pricing configurations
  const [allPrices, setAllPrices] = useState({
    'Default': {
      'Royal Booth': 390000,
      'Food Slot': 320000,
      'Drinks': 320000,
      'Half Booth': 195000
    }
  });

  // Prices — single location (Lagos) for 2026
  const boothPrices = allPrices['Default'] || allPrices;

  useEffect(() => {
    // Fetch prices configuration
    apiRequest('/vendors/prices').then(data => {
      if (data) {
        setAllPrices(data);
      }
    }).catch(err => console.error('Failed to load prices', err));

    // Fetch events and auto-select Lagos or first available event
    apiRequest('/events').then(data => {
      if (data) {
        const eventsList = Array.isArray(data) ? data : [data];
        const lagosEvent = eventsList.find(e =>
          e.location?.toLowerCase().includes('lagos')
        ) || eventsList[0];
        if (lagosEvent) {
          setFormData(prev => ({ ...prev, eventId: lagosEvent.id }));
        }
      }
    }).catch(err => console.error('Failed to fetch events:', err));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData(prev => ({
      ...prev,
      [name]: val
    }));

    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    const errorList = [];

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full Name is required.';
      errorList.push('Full Name is missing.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email address is required.';
      errorList.push('Email address is missing.');
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address (e.g. name@example.com).';
      errorList.push('Email address format is invalid.');
    }

    const phoneRegex = /^\+?[0-9]{10,15}$/;
    const phoneClean = formData.phoneNumber.replace(/\s/g, '');
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required.';
      errorList.push('Phone number is missing.');
    } else if (!phoneRegex.test(phoneClean)) {
      errors.phoneNumber = 'Please enter a valid phone number (10-15 digits).';
      errorList.push('Phone number must be between 10 and 15 digits.');
    }

    const whatsappClean = formData.whatsappNumber.replace(/\s/g, '');
    if (!formData.whatsappNumber.trim()) {
      errors.whatsappNumber = 'WhatsApp number is required.';
      errorList.push('WhatsApp number is missing.');
    } else if (!phoneRegex.test(whatsappClean)) {
      errors.whatsappNumber = 'Please enter a valid WhatsApp number (10-15 digits).';
      errorList.push('WhatsApp number must be between 10 and 15 digits.');
    }

    if (!formData.instagramHandle.trim()) {
      errors.instagramHandle = 'Instagram handle is required.';
      errorList.push('Instagram handle is missing.');
    }

    if (!formData.businessName.trim()) {
      errors.businessName = 'Business Name is required.';
      errorList.push('Business Name is missing.');
    }

    if (!formData.sector) {
      errors.sector = 'Please select a business sector.';
      errorList.push('Business Sector selection is required.');
    }

    if (!formData.boothType) {
      errors.boothType = 'Please select a booth type.';
      errorList.push('Booth Type selection is required.');
    }

    if (!formData.liveInLagos) {
      errors.liveInLagos = 'You must confirm availability to exhibit in Lagos.';
      errorList.push('Lagos exhibition availability confirmation required.');
    }

    if (!formData.categoryAccepted) {
      errors.categoryAccepted = 'You must confirm your business category is accepted.';
      errorList.push('Business category acceptance confirmation required.');
    }

    if (!formData.agreeToMarket) {
      errors.agreeToMarket = 'You must agree to actively market your business.';
      errorList.push('Marketing commitment agreement required.');
    }

    if (!formData.agreeToWhatsapp) {
      errors.agreeToWhatsapp = 'You must agree to join the official WhatsApp group.';
      errorList.push('WhatsApp group participation agreement required.');
    }

    if (!formData.agreeToTerms) {
      errors.agreeToTerms = 'You must accept the Wodibenuah Fair Terms & Conditions.';
      errorList.push('Terms & Conditions agreement required.');
    }

    return { errors, errorList };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { errors, errorList } = validateForm();
    if (errorList.length > 0) {
      setFieldErrors(errors);
      setErrorMessage(errorList.join('\n'));
      setStatus('error');
      
      const firstErrorKey = Object.keys(errors)[0];
      const element = document.getElementById(`field-${firstErrorKey}`) || errorRef.current;
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setStatus('submitting');
    setErrorMessage('');
    setFieldErrors({});
    toast.loading('Registering vendor...', { id: 'register-toast' });

    try {
      const data = await apiRequest('/vendors/register', {
        method: 'POST',
        body: formData
      });

      if (data.vendor) {
        toast.success('Registration submitted successfully!', { id: 'register-toast' });
        setStatus('success');
        setErrorMessage('');
        setFieldErrors({});
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
          <h2 className="text-3xl font-heading font-bold uppercase tracking-widest mb-2">Verifying Registration</h2>
          <p className="text-gray-400 text-sm tracking-wider uppercase">Please wait a moment...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-cream text-deep-black font-body flex flex-col">
        <SEO 
          title="Registration Received" 
          description="Your vendor registration for Wodibenuah Fair Lagos 2026 has been received."
          url="/register"
        />
        <div className="w-full px-2 md:px-8 py-3 md:py-6 border-b border-deep-black">
          <div className="relative w-full max-w-[1920px] mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-heading font-bold tracking-tighter text-deep-black uppercase">
              Registration Received
            </h1>
          </div>
        </div>
        <Navigation activeItem="Register" />

        <div className="flex-grow flex items-center justify-center px-4 py-16 md:py-24">
          <div className="bg-white p-8 md:p-16 border border-deep-black max-w-3xl text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-2 bg-deep-black"></div>
            
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-700">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <span className="text-xs font-bold tracking-[0.25em] uppercase text-gold bg-deep-black px-4 py-1.5 inline-block mb-4">
              Application Submitted
            </span>

            <h2 className="text-3xl md:text-5xl font-heading font-bold uppercase text-deep-black mb-4 leading-tight">
              Thank You For Registering!
            </h2>
            <div className="w-20 h-[2px] bg-gold mx-auto mb-6"></div>

            <p className="text-base md:text-lg text-gray-700 mb-8 leading-relaxed font-body">
              Your vendor registration application for <strong className="text-deep-black">Wodibenuah Fair Lagos 2026</strong> has been received successfully.
            </p>

            {/* Next Steps Box */}
            <div className="bg-cream/70 border border-deep-black p-6 text-left mb-8 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-deep-black flex items-center gap-2 border-b border-gray-300 pb-3">
                <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                What Happens Next?
              </h3>
              
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-deep-black text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <p><strong className="text-deep-black">Application Review:</strong> Our team is reviewing your details for booth selection and category confirmation.</p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-deep-black text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <p><strong className="text-deep-black">Payment Link via Email:</strong> You will receive an email with your official payment link at <span className="underline font-bold text-deep-black">{formData.email || 'your registered email'}</span> within <strong>24 hours</strong>.</p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-deep-black text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <p><strong className="text-deep-black">Secure Your Booth:</strong> Complete payment via your email link to lock in your preferred slot!</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={resetForm}
                className="bg-deep-black text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-deep-black border border-deep-black transition-all duration-300"
              >
                Register Another Vendor
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-transparent text-deep-black px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-deep-black hover:text-white border border-deep-black transition-all duration-300"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-deep-black font-body flex flex-col">
      <SEO 
        title="Vendor Registration" 
        description="Book your vendor booth for the upcoming Wodifair exhibitions. Select your location and booth type to secure your spot today."
        url="/register"
      />
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
            Received your payment link or completing an existing booking? <a href="/complete-payment" className="underline hover:text-gold transition-colors">Click here to complete your payment</a>
          </p>
        </div>

        <div className="max-w-5xl mx-auto border border-deep-black bg-white relative">

          {/* Header Section inside Box */}
          <div className="bg-deep-black text-white p-10 md:p-16 text-center relative overflow-hidden border-b border-deep-black">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <img
                src="https://res.cloudinary.com/dwmz4youk/image/upload/v1779310064/wodifair/Gemini_Generated_Image_euj3e6euj3e6euj3.png"
                alt="Background"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-deep-black/20"></div>
            </div>

            <div className="relative z-10">
              <p className="text-xs md:text-sm font-bold tracking-[0.3em] uppercase mb-4 text-gray-300">
                Wodibenuah Fair Lagos 2026
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
          <form onSubmit={handleSubmit} noValidate className="p-8 md:p-16 space-y-12">

            {/* Error Message Display */}
            {status === 'error' && (
              <div ref={errorRef} className="bg-red-50 border-2 border-red-500 p-6 mb-8 shadow-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg leading-6 font-bold text-red-800 uppercase tracking-wider">
                      Please Check Required Information
                    </h3>
                    <p className="mt-1 text-sm text-red-700 font-medium">
                      {Object.keys(fieldErrors).length > 0
                        ? `We found ${Object.keys(fieldErrors).length} missing or invalid item(s). Please check the highlighted field(s) below:`
                        : 'Please correct the issue(s) below and try again:'}
                    </p>
                    <ul className="mt-3 space-y-1.5 list-disc list-inside text-sm font-semibold text-red-800 bg-red-100/70 p-3 border border-red-200">
                      {errorMessage.split('\n').map((msg, i) => (
                        <li key={i}>{msg}</li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs uppercase tracking-widest font-bold text-red-700">
                      Scroll down to view highlighted fields on the page.
                    </p>
                    {errorMessage.toLowerCase().includes('already registered') && (
                      <div className="mt-3 p-3 bg-red-100 border-l-4 border-red-600 text-sm">
                        This email is already registered. If you need to complete payment or require assistance, please{' '}
                        <a href="/contact" className="text-red-900 underline font-bold hover:text-red-700">Contact Support</a>.
                      </div>
                    )}
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
                {/* Lagos-only event for 2026 — location is pre-set */}
                <div className="md:col-span-2 group">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 group-focus-within:text-deep-black transition-colors">Event Location</label>
                  <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wide">This year&apos;s edition is Lagos only.</p>
                  <div className="w-full px-0 py-3 border-b border-gray-300 text-lg font-body text-deep-black flex items-center justify-between">
                    <span>Lagos, Nigeria</span>
                    <span className="text-xs text-gold font-bold uppercase tracking-wider">2026 Edition</span>
                  </div>
                  <input type="hidden" name="selectedLocation" value={formData.selectedLocation} />
                </div>

                <div className="md:col-span-2 group" id="field-fullName">
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 transition-colors ${fieldErrors.fullName ? 'text-red-600' : 'text-gray-500 group-focus-within:text-deep-black'}`}>
                    Full Name *
                  </label>
                  <input
                    required type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                    className={`w-full px-0 py-3 border-b bg-transparent outline-none transition-colors text-lg font-body placeholder-gray-300 ${
                      fieldErrors.fullName
                        ? 'border-red-500 text-red-900 focus:border-red-600 bg-red-50/20'
                        : 'border-gray-300 focus:border-deep-black'
                    }`}
                    placeholder="ENTER YOUR FULL NAME"
                  />
                  {fieldErrors.fullName && (
                    <p className="text-xs text-red-600 font-semibold mt-1.5 flex items-center gap-1">
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.fullName}
                    </p>
                  )}
                </div>

                <div className="group" id="field-email">
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 transition-colors ${fieldErrors.email ? 'text-red-600' : 'text-gray-500 group-focus-within:text-deep-black'}`}>
                    Email Address *
                  </label>
                  <input
                    required type="email" name="email" value={formData.email} onChange={handleChange}
                    className={`w-full px-0 py-3 border-b bg-transparent outline-none transition-colors text-lg font-body placeholder-gray-300 ${
                      fieldErrors.email
                        ? 'border-red-500 text-red-900 focus:border-red-600 bg-red-50/20'
                        : 'border-gray-300 focus:border-deep-black'
                    }`}
                    placeholder="EMAIL@ADDRESS.COM"
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-red-600 font-semibold mt-1.5 flex items-center gap-1">
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div className="group" id="field-phoneNumber">
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 transition-colors ${fieldErrors.phoneNumber ? 'text-red-600' : 'text-gray-500 group-focus-within:text-deep-black'}`}>
                    Phone Number *
                  </label>
                  <input
                    required type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange}
                    className={`w-full px-0 py-3 border-b bg-transparent outline-none transition-colors text-lg font-body placeholder-gray-300 ${
                      fieldErrors.phoneNumber
                        ? 'border-red-500 text-red-900 focus:border-red-600 bg-red-50/20'
                        : 'border-gray-300 focus:border-deep-black'
                    }`}
                    placeholder="+234..."
                  />
                  {fieldErrors.phoneNumber && (
                    <p className="text-xs text-red-600 font-semibold mt-1.5 flex items-center gap-1">
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.phoneNumber}
                    </p>
                  )}
                </div>

                <div className="group" id="field-whatsappNumber">
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 transition-colors ${fieldErrors.whatsappNumber ? 'text-red-600' : 'text-gray-500 group-focus-within:text-deep-black'}`}>
                    WhatsApp Number *
                  </label>
                  <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wide">Must be an active number for vendor group communication</p>
                  <input
                    required type="tel" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange}
                    className={`w-full px-0 py-3 border-b bg-transparent outline-none transition-colors text-lg font-body placeholder-gray-300 ${
                      fieldErrors.whatsappNumber
                        ? 'border-red-500 text-red-900 focus:border-red-600 bg-red-50/20'
                        : 'border-gray-300 focus:border-deep-black'
                    }`}
                    placeholder="+234..."
                  />
                  {fieldErrors.whatsappNumber && (
                    <p className="text-xs text-red-600 font-semibold mt-1.5 flex items-center gap-1">
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.whatsappNumber}
                    </p>
                  )}
                </div>

                <div className="group" id="field-instagramHandle">
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 transition-colors ${fieldErrors.instagramHandle ? 'text-red-600' : 'text-gray-500 group-focus-within:text-deep-black'}`}>
                    Instagram Handle *
                  </label>
                  <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wide">Your primary business social media account</p>
                  <input
                    required type="text" name="instagramHandle" value={formData.instagramHandle} onChange={handleChange}
                    className={`w-full px-0 py-3 border-b bg-transparent outline-none transition-colors text-lg font-body placeholder-gray-300 ${
                      fieldErrors.instagramHandle
                        ? 'border-red-500 text-red-900 focus:border-red-600 bg-red-50/20'
                        : 'border-gray-300 focus:border-deep-black'
                    }`}
                    placeholder="@YOURHANDLE"
                  />
                  {fieldErrors.instagramHandle && (
                    <p className="text-xs text-red-600 font-semibold mt-1.5 flex items-center gap-1">
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.instagramHandle}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2 group" id="field-businessName">
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 transition-colors ${fieldErrors.businessName ? 'text-red-600' : 'text-gray-500 group-focus-within:text-deep-black'}`}>
                    Business Name *
                  </label>
                  <input
                    required type="text" name="businessName" value={formData.businessName} onChange={handleChange}
                    className={`w-full px-0 py-3 border-b bg-transparent outline-none transition-colors text-lg font-body placeholder-gray-300 ${
                      fieldErrors.businessName
                        ? 'border-red-500 text-red-900 focus:border-red-600 bg-red-50/20'
                        : 'border-gray-300 focus:border-deep-black'
                    }`}
                    placeholder="YOUR BUSINESS NAME"
                  />
                  {fieldErrors.businessName && (
                    <p className="text-xs text-red-600 font-semibold mt-1.5 flex items-center gap-1">
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.businessName}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2 group" id="field-sector">
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 transition-colors ${fieldErrors.sector ? 'text-red-600' : 'text-gray-500 group-focus-within:text-deep-black'}`}>
                    Business Sector *
                  </label>
                  <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wide">Choose the category that best fits your products or services</p>
                  <select
                    required name="sector" value={formData.sector} onChange={handleChange}
                    className={`w-full px-0 py-3 border-b bg-transparent outline-none transition-colors text-lg font-body cursor-pointer ${
                      fieldErrors.sector
                        ? 'border-red-500 text-red-900 focus:border-red-600 bg-red-50/20'
                        : 'border-gray-300 focus:border-deep-black'
                    }`}
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
                  {fieldErrors.sector && (
                    <p className="text-xs text-red-600 font-semibold mt-1.5 flex items-center gap-1">
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.sector}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2 group" id="field-boothType">
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 transition-colors ${fieldErrors.boothType ? 'text-red-600' : 'text-gray-500 group-focus-within:text-deep-black'}`}>
                    Booth Type *
                  </label>
                  <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wide">Select the size and type of booth you require.</p>
                  <select
                    required name="boothType" value={formData.boothType} onChange={handleChange}
                    className={`w-full px-0 py-3 border-b bg-transparent outline-none transition-colors text-lg font-body cursor-pointer ${
                      fieldErrors.boothType
                        ? 'border-red-500 text-red-900 focus:border-red-600 bg-red-50/20'
                        : 'border-gray-300 focus:border-deep-black'
                    }`}
                  >
                    <option value="">SELECT A BOOTH TYPE</option>
                    {Object.entries(boothPrices).map(([type, price]) => (
                      <option key={type} value={type}>
                        {type} - ₦{price.toLocaleString()}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.boothType && (
                    <p className="text-xs text-red-600 font-semibold mt-1.5 flex items-center gap-1">
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.boothType}
                    </p>
                  )}

                  {/* Vendor Slot Amenities */}
                  <div className="mt-8 bg-gray-50 border border-gray-200 p-6 md:p-8">
                    <h4 className="text-sm font-bold uppercase tracking-[0.15em] text-deep-black mb-6 flex items-center gap-3">
                      <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Your slot comes with
                    </h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                      {[
                        'Your access tag',
                        'Your vendor flyer',
                        'Electricity socket',
                        'The space of your preferred booth',
                        'A table',
                        '3 chairs'
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3 group">
                          <div className="mt-1 w-4 h-4 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 group-hover:bg-gold transition-colors">
                            <div className="w-1.5 h-1.5 rounded-full bg-gold group-hover:bg-white transition-colors"></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700 leading-tight">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
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
                  { name: 'liveInLagos', label: 'I live in Lagos / am available to exhibit in Lagos *' },
                  { name: 'categoryAccepted', label: 'I confirm my business category is accepted by the exhibition *' },
                  { name: 'agreeToMarket', label: 'I agree to ACTIVELY Market my business and contribute to the Fair *' },
                  { name: 'agreeToWhatsapp', label: 'I agree to JOIN & REMAIN ACTIVE in the assigned WhatsApp group *' }
                ].map((item) => (
                  <div key={item.name} id={`field-${item.name}`} className={`p-3 rounded transition-colors ${fieldErrors[item.name] ? 'bg-red-50 border border-red-300' : ''}`}>
                    <label className="flex items-start gap-4 cursor-pointer group">
                      <div className="relative flex items-center mt-0.5">
                        <input
                          type="checkbox"
                          name={item.name}
                          checked={formData[item.name]}
                          onChange={handleChange}
                          className={`peer h-6 w-6 cursor-pointer appearance-none border transition-all checked:bg-deep-black ${
                            fieldErrors[item.name] ? 'border-red-500 ring-2 ring-red-200' : 'border-deep-black'
                          }`}
                        />
                        <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <div className="flex-1">
                        <span className={`text-sm md:text-base transition-colors ${fieldErrors[item.name] ? 'text-red-800 font-bold' : 'text-gray-600 group-hover:text-deep-black'}`}>
                          {item.label}
                        </span>
                        {fieldErrors[item.name] && (
                          <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {fieldErrors[item.name]}
                          </p>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Terms & Conditions & Submission */}
            <div className="border-t border-deep-black pt-12">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-xs font-bold tracking-[0.2em] uppercase bg-deep-black text-white px-3 py-1">Step 03</span>
                <h3 className="text-2xl font-heading font-bold uppercase text-deep-black">Terms & Conditions</h3>
              </div>

              {/* Visible Terms & Conditions Box */}
              <div className="bg-gray-50 border border-deep-black p-6 md:p-8 mb-6">
                <div className="flex items-center justify-between mb-4 border-b border-gray-300 pb-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-deep-black flex items-center gap-2">
                    <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Wodibenuah Fair Vendor Terms & Rules
                  </h4>
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-gold uppercase tracking-wider hover:underline flex items-center gap-1">
                    Full Document
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                </div>

                <div className="max-h-60 overflow-y-auto pr-2 space-y-4 text-xs md:text-sm text-gray-700 font-body leading-relaxed border border-gray-200 p-4 bg-white">
                  <div>
                    <h5 className="font-bold text-deep-black uppercase tracking-wider mb-1">1. Respect & Professional Conduct</h5>
                    <p>All vendors must engage respectfully and professionally with fair team members and fellow vendors. Hostile or rude behavior will result in immediate disqualification.</p>
                  </div>

                  <div>
                    <h5 className="font-bold text-deep-black uppercase tracking-wider mb-1">2. Non-Refundable Policy</h5>
                    <p>All vendor payments for Wodibenuah Fair are non-refundable once made. Slots can only be carried over or transferred if written notification is received at least 30 days prior to the fair.</p>
                  </div>

                  <div>
                    <h5 className="font-bold text-deep-black uppercase tracking-wider mb-1">3. Active Brand Marketing</h5>
                    <p>Vendors are required to actively market their brand before and during the fair via social media, word-of-mouth, and booth branding to drive engagement.</p>
                  </div>

                  <div>
                    <h5 className="font-bold text-deep-black uppercase tracking-wider mb-1">4. Product Category Rules</h5>
                    <p>Vendors may not combine more than two product categories at their booth. Food vendors serving drinks must ensure drinks do not exceed 30% of total offering.</p>
                  </div>

                  <div>
                    <h5 className="font-bold text-deep-black uppercase tracking-wider mb-1">5. Safety, Security & Legality</h5>
                    <p>Vendors are fully responsible for the safety and security of their goods. Counterfeit, illegal, or prohibited items are strictly forbidden.</p>
                  </div>
                </div>

                <div className={`mt-6 pt-4 border-t border-gray-200 p-3 rounded transition-colors ${fieldErrors.agreeToTerms ? 'bg-red-50 border border-red-300' : ''}`} id="field-agreeToTerms">
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <div className="relative flex items-center mt-0.5">
                      <input
                        type="checkbox" name="agreeToTerms" checked={formData.agreeToTerms} onChange={handleChange}
                        className={`peer h-6 w-6 cursor-pointer appearance-none border transition-all checked:bg-deep-black ${
                          fieldErrors.agreeToTerms ? 'border-red-500 ring-2 ring-red-200' : 'border-deep-black'
                        }`}
                      />
                      <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div className="flex-1">
                      <span className={`text-sm font-bold uppercase tracking-wider ${fieldErrors.agreeToTerms ? 'text-red-800' : 'text-deep-black'}`}>
                        I have read, understood, and agree to the Wodibenuah Fair Terms & Conditions *
                      </span>
                      {fieldErrors.agreeToTerms && (
                        <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {fieldErrors.agreeToTerms}
                        </p>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Email Payment Notice */}
              <div className="bg-gold/10 border border-gold p-4 mb-8 flex items-start gap-3">
                <svg className="w-6 h-6 text-deep-black flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div className="text-xs md:text-sm text-deep-black font-medium leading-normal">
                  <strong className="uppercase tracking-wider block font-bold mb-0.5">Note on Payment:</strong>
                  After submitting your registration, our team will review your application and send your official payment link via email within <strong>24 hours</strong>.
                </div>
              </div>

              <div className="text-center">
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="bg-deep-black text-white px-12 py-5 text-sm font-bold uppercase tracking-[0.25em] hover:bg-gold hover:text-deep-black border border-deep-black transition-all duration-300 shadow-lg hover:shadow-xl w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 mx-auto"
                >
                  {status === 'submitting' ? (
                    <>Submitting Application...</>
                  ) : (
                    <>
                      Submit Vendor Application
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
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
