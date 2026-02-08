import React from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-cream text-deep-black font-body flex flex-col">
      {/* Title Banner */}
      <div className="w-full px-2 md:px-8 py-3 md:py-6 border-b border-deep-black">
        <div className="relative w-full max-w-[1920px] mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-heading font-bold tracking-tighter text-deep-black uppercase">
            Privacy Policy
          </h1>
        </div>
      </div>

      <Navigation activeItem="Privacy" />

      <div className="flex-grow max-w-4xl mx-auto px-4 py-16 md:py-24">
        <div className="prose prose-lg max-w-none font-body text-deep-black">
          <p className="text-xl md:text-2xl font-heading font-medium leading-relaxed mb-12 border-b border-deep-black pb-8">
            At Wodibenuah Fair, we prioritize the privacy and security of our vendors, attendees, and partners. This policy outlines how we collect, use, and protect your personal information.
          </p>

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-6 flex items-center gap-4">
              <span className="text-xs bg-deep-black text-white px-2 py-1 tracking-widest">01</span>
              Information We Collect
            </h2>
            <p className="mb-4">We collect information you provide directly to us, including:</p>
            <ul className="list-disc pl-5 space-y-2 mb-4 marker:text-deep-black">
              <li>Contact details (name, email address, phone number).</li>
              <li>Business information (for vendors and sponsors).</li>
              <li>Payment information (processed securely via our payment partners).</li>
              <li>Communications and correspondence with our team.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-6 flex items-center gap-4">
              <span className="text-xs bg-deep-black text-white px-2 py-1 tracking-widest">02</span>
              How We Use Your Information
            </h2>
            <p className="mb-4">We use the collected information for the following purposes:</p>
            <ul className="list-disc pl-5 space-y-2 mb-4 marker:text-deep-black">
              <li>To facilitate event registration and vendor onboarding.</li>
              <li>To process payments and transactions securely.</li>
              <li>To communicate important event updates, schedules, and changes.</li>
              <li>To provide customer support and respond to inquiries.</li>
              <li>To improve our services and future event planning.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-6 flex items-center gap-4">
              <span className="text-xs bg-deep-black text-white px-2 py-1 tracking-widest">03</span>
              Information Sharing
            </h2>
            <p className="mb-4">We do not sell or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
            <ul className="list-disc pl-5 space-y-2 mb-4 marker:text-deep-black">
              <li>With trusted service providers who assist in event operations (e.g., payment processors, venue security).</li>
              <li>To comply with legal obligations or protect our rights and safety.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-6 flex items-center gap-4">
              <span className="text-xs bg-deep-black text-white px-2 py-1 tracking-widest">04</span>
              Data Security
            </h2>
            <p className="mb-4">We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.</p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-6 flex items-center gap-4">
              <span className="text-xs bg-deep-black text-white px-2 py-1 tracking-widest">05</span>
              Your Rights
            </h2>
            <p className="mb-4">You have the right to access, correct, or request deletion of your personal information held by us. Please contact our support team for any privacy-related requests.</p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-6 flex items-center gap-4">
              <span className="text-xs bg-deep-black text-white px-2 py-1 tracking-widest">06</span>
              Changes to This Policy
            </h2>
            <p className="mb-4">We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date.</p>
          </section>

          <div className="mt-16 pt-8 border-t border-deep-black">
            <p className="font-bold">Contact Us</p>
            <p>If you have any questions about this Privacy Policy, please contact us at info@wodibenuahfair.com.</p>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Privacy;
