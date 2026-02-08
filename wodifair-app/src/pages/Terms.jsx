import React from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

const Terms = () => {
  return (
    <div className="min-h-screen bg-cream text-deep-black font-body flex flex-col">
      {/* Title Banner */}
      <div className="w-full px-2 md:px-8 py-3 md:py-6 border-b border-deep-black">
        <div className="relative w-full max-w-[1920px] mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-heading font-bold tracking-tighter text-deep-black uppercase">
            Terms & Conditions
          </h1>
        </div>
      </div>

      <Navigation activeItem="Terms" />

      <div className="flex-grow max-w-4xl mx-auto px-4 py-16 md:py-24">
        <div className="prose prose-lg max-w-none font-body text-deep-black">
          <p className="text-xl md:text-2xl font-heading font-medium leading-relaxed mb-12 border-b border-deep-black pb-8">
            By registering for the Wodibenuah Fair, you confirm that you have read, understood, and agreed to these Terms and Conditions. Non-compliance may result in immediate disqualification and blacklisting from future editions of the fair.
          </p>

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-6 flex items-center gap-4">
              <span className="text-xs bg-deep-black text-white px-2 py-1 tracking-widest">01</span>
              Respect and Professional Conduct
            </h2>
            <p className="mb-4">All vendors must engage respectfully and professionally with Wodibenuah Fair team members and fellow vendors.</p>
            <ul className="list-disc pl-5 space-y-2 mb-4 marker:text-deep-black">
              <li>Hostile behavior, rude conduct, or any form of unhealthy competition will not be tolerated.</li>
              <li>Our team pledges to treat every vendor with equal courtesy and support.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-6 flex items-center gap-4">
              <span className="text-xs bg-deep-black text-white px-2 py-1 tracking-widest">02</span>
              Non-Refundable Policy
            </h2>
            <p className="mb-4 font-bold">At Wodibenuah Fair, we strive to provide a clear and transparent policy to ensure a smooth experience for all our valued vendors. Please carefully read and understand our non-refundable policy before making any payments. By engaging with our services, you agree to the terms outlined below:</p>
            
            <h3 className="text-xl font-bold mt-6 mb-2 uppercase tracking-wide">1. Non-Refundable Policy</h3>
            <p className="mb-4">All vendor payments for Wodibenuah Fair are non-refundable. Once payment is made, no refunds will be issued under any circumstances.</p>

            <h3 className="text-xl font-bold mt-6 mb-2 uppercase tracking-wide">2. Slot Transfer for Next Fair</h3>
            <p className="mb-2">If a vendor is unable to attend the current fair, their slot can be carried over to the next fair or replaced by another interested vendor.</p>
            <p className="mb-2">Vendors must notify the Wodibenuah Fair team in writing (via email or official correspondence) at least 30 days before the event to request a transfer.</p>
            <p className="mb-4">Failure to notify within the specified period will result in forfeiture of the slot without the possibility of transfer.</p>

            <h3 className="text-xl font-bold mt-6 mb-2 uppercase tracking-wide">3. Event Cancellation</h3>
            <p className="mb-4">In the unlikely event that Wodibenuah Fair is canceled by the organizers, all vendor slots will be automatically transferred to the next scheduled fair.</p>

            <h3 className="text-xl font-bold mt-6 mb-2 uppercase tracking-wide">4. Special Considerations</h3>
            <p className="mb-4">Wodibenuah Fair reserves the right to make exceptions in exceptional circumstances. Such exceptions will be evaluated on a case-by-case basis and are at the sole discretion of Wodibenuah Fair management.</p>

            <h3 className="text-xl font-bold mt-6 mb-2 uppercase tracking-wide">5. Contact Information</h3>
            <p className="mb-4">For any inquiries regarding this policy, please contact our support team at [info@wodibenuahfair.com].</p>
            
            <p className="italic mt-4">We appreciate your understanding and cooperation in adhering to this policy. Wodibenuah Fair reserves the right to amend this policy as needed, and any changes will be communicated to vendors through official channels.</p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-6 flex items-center gap-4">
              <span className="text-xs bg-deep-black text-white px-2 py-1 tracking-widest">03</span>
              Brand Marketing Expectations
            </h2>
            <p className="mb-4">Vendors are required to actively market their brand before and during the fair.</p>
            <p>Social media engagement, word-of-mouth promotions, and booth branding are highly encouraged to increase visibility and sales.</p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-6 flex items-center gap-4">
              <span className="text-xs bg-deep-black text-white px-2 py-1 tracking-widest">04</span>
              Product Category Compliance
            </h2>
            <p className="mb-4">To ensure fairness and a better experience for shoppers, the following rules apply:</p>
            
            <h3 className="text-xl font-bold mt-6 mb-2 uppercase tracking-wide">No Multi-Category Mixing</h3>
            <p className="mb-2">Vendors may not combine more than two different product categories at their booth (e.g., selling hair, jewelry, and fashion together is not allowed).</p>
            <p className="mb-4">Vendors are strictly limited to one or two product categories only.</p>

            <h3 className="text-xl font-bold mt-6 mb-2 uppercase tracking-wide">Food and Drinks Vendors</h3>
            <p className="mb-2">If you’re a food vendor and wish to serve drinks, drinks must not exceed 30% of your total offerings.</p>
            <p className="mb-2">You must choose to be either a food or drinks vendor — not both — unless the above condition is met.</p>
            <p>This ensures exclusive drink vendors also receive fair visibility and sales opportunities.</p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-6 flex items-center gap-4">
              <span className="text-xs bg-deep-black text-white px-2 py-1 tracking-widest">05</span>
              Sponsors and Partners Compliance
            </h2>
            <p className="mb-4">Vendors must honor any reasonable requests made by fair sponsors or partners.</p>
            <p>These requests will always respect your brand’s integrity and are designed to ensure a smooth and successful event.</p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-6 flex items-center gap-4">
              <span className="text-xs bg-deep-black text-white px-2 py-1 tracking-widest">06</span>
              Booth Setup and Operation
            </h2>
            <p className="mb-4">All vendors must follow booth setup instructions and adhere to event setup and teardown timelines.</p>
            <p>Vendors are responsible for any damage caused to fair property.</p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-6 flex items-center gap-4">
              <span className="text-xs bg-deep-black text-white px-2 py-1 tracking-widest">07</span>
              Product and Service Guidelines
            </h2>
            <p className="mb-4">All displayed products and services must align with ethical standards and comply with local laws and regulations.</p>
            <p>Counterfeit, prohibited, or illegal items are strictly forbidden and will lead to immediate disqualification.</p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-6 flex items-center gap-4">
              <span className="text-xs bg-deep-black text-white px-2 py-1 tracking-widest">08</span>
              Security and Safety
            </h2>
            <p className="mb-4">Vendors are fully responsible for the safety and security of their goods and belongings.</p>
            <p>Wodibenuah Fair organizers are not liable for any loss, theft, or damage during the event.</p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-6 flex items-center gap-4">
              <span className="text-xs bg-deep-black text-white px-2 py-1 tracking-widest">09</span>
              Fairground Rules and Regulations
            </h2>
            <p className="mb-4">Vendors must comply with all fairground rules and guidelines as provided by the organizing team.</p>
            <p>Any breach of these rules may lead to removal from the fair without a refund and potential blacklisting from future events.</p>
          </section>

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Terms;
