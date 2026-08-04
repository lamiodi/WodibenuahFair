import React, { useState } from 'react';
import toast from 'react-hot-toast';

const VenueMap = () => {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText('The Five Palm Oniru, Lagos, Nigeria');
    setCopied(true);
    toast.success('Address copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-deep-black/15 bg-white p-8 md:p-12 shadow-xl my-8 mx-auto max-w-[1600px]">
      <div className="grid gap-10 lg:grid-cols-2 items-center">
        {/* Left Content */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-deep-black px-4 py-2 text-xs font-bold uppercase tracking-widest text-gold">
            📍 Event Venue
          </span>

          <h2 className="mt-6 text-4xl md:text-5xl font-heading font-bold text-deep-black uppercase leading-tight">
            The Five Palm Oniru
          </h2>

          <p className="mt-4 text-base md:text-lg text-neutral-600 font-body leading-relaxed">
            Join us at one of Lagos&apos; premier luxury event destinations,
            offering an elegant atmosphere and easy accessibility for
            all guests.
          </p>

          <div className="mt-8 space-y-6 font-body">

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0 text-gold text-lg">
                📍
              </div>
              <div>
                <p className="font-heading font-bold uppercase text-sm tracking-wider text-deep-black">Venue</p>
                <p className="text-neutral-600 text-sm mt-1 leading-normal">
                  The Five Palm Oniru<br />
                  Oniru, Victoria Island<br />
                  Lagos, Nigeria
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0 text-gold text-lg">
                🚗
              </div>
              <div>
                <p className="font-heading font-bold uppercase text-sm tracking-wider text-deep-black">Parking</p>
                <p className="text-neutral-600 text-sm mt-1 leading-normal">
                  Ample parking available for guests.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0 text-gold text-lg">
                🕒
              </div>
              <div>
                <p className="font-heading font-bold uppercase text-sm tracking-wider text-deep-black">Date & Arrival</p>
                <p className="text-neutral-600 text-sm mt-1 leading-normal">
                  <span className="font-bold text-deep-black">December 13th, 2026</span><br />
                  Please arrive at least 30 minutes before the event begins.
                </p>
              </div>
            </div>

          </div>

          <div className="mt-10 flex flex-wrap gap-4">

            <a
              href="https://maps.google.com/?q=The+Five+Palm+Oniru"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-deep-black px-8 py-4 text-xs font-bold uppercase tracking-[0.15em] text-white transition-all duration-300 hover:bg-gold hover:text-deep-black shadow-md"
            >
              <span>Get Directions</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            <button
              onClick={handleCopyAddress}
              className="inline-flex items-center gap-2 rounded-full border border-deep-black px-8 py-4 text-xs font-bold uppercase tracking-[0.15em] text-deep-black transition-all duration-300 hover:bg-deep-black hover:text-white"
            >
              <span>{copied ? 'Address Copied!' : 'Copy Address'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>

          </div>
        </div>

        {/* Google Map */}
        <div className="overflow-hidden rounded-3xl shadow-2xl border border-deep-black/10 min-h-[400px] md:min-h-[500px]">

          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d209927.16994260912!2d3.3535174980813856!3d6.520877071059808!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103bf57f27da3ee1%3A0x3a690cd5fd98ed0e!2sThe%20Five%20Palm%20Oniru!5e1!3m2!1sen!2sng!4v1785822446153!5m2!1sen!2sng"
            width="100%"
            height="500"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            title="The Five Palm Oniru Location"
          />

        </div>
      </div>
    </section>
  );
};

export default VenueMap;
