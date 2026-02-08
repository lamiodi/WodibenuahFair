import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    
    // Simulate API call
    setTimeout(() => {
      setStatus('success');
      setEmail('');
      // Reset status after 3 seconds
      setTimeout(() => setStatus('idle'), 3000);
    }, 1500);
  };

  return (
    <footer className="bg-deep-black text-white pt-16 pb-8 border-t border-gray-800 mt-auto">
      <div className="max-w-[1920px] mx-auto px-4 md:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand Column */}
          <div className="space-y-6">
            <h2 className="text-2xl font-heading font-bold uppercase tracking-wider">Wodibenuah Fair</h2>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Curating the finest vendor experiences, celebrating culture, luxury, and innovation.
            </p>
            {/* Socials */}
            <div className="flex gap-4">
              <a href="https://www.instagram.com/wodibenuahfair?igsh=MXhia2tuMWRyaWl3dw==" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-deep-black hover:bg-white hover:border-white transition-all duration-300 rounded-full" aria-label="Instagram">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.46 2.9c.636-.247 1.363-.416 2.427-.465C8.901 2.385 9.256 2.373 12 2.373c2.744 0 3.099.012 4.119.062.966.046 1.543.193 2.065.396.696.27 1.25.666 1.799 1.215.549.549.945 1.103 1.215 1.799.203.522.35 1.099.396 2.065.05 1.02.062 1.375.062 4.119 0 2.744-.012 3.099-.062 4.119-.046.966-.193 1.543-.396 2.065a4.88 4.88 0 01-1.215 1.799 4.88 4.88 0 01-1.799 1.215c-.522.203-1.099.35-2.065.396-1.02.05-1.375.062-4.119.062-2.744 0-3.099-.012-4.119-.062-.966-.046-1.543-.193-2.065-.396a4.88 4.88 0 01-1.799-1.215 4.88 4.88 0 01-1.215-1.799c-.203-.522-.35-1.099-.396-2.065-.05-1.02-.062-1.375-.062-4.119 0-2.744.012-3.099.062-4.119.046-.966.193-1.543.396-2.065a4.88 4.88 0 011.215-1.799 4.88 4.88 0 011.799-1.215c.522-.203 1.099-.35 2.065-.396.947-.047 1.322-.058 3.52-.058 2.348 0 2.658.01 3.73.058zM12 7a5 5 0 100 10 5 5 0 000-10zm0 1.834a3.166 3.166 0 110 6.332 3.166 3.166 0 010-6.332zM16.924 5.924a1.1 1.1 0 110 2.2 1.1 1.1 0 010-2.2z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="https://www.threads.com/@wodibenuahfair?igshid=NTc4MTIwNjQ2YQ==" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-deep-black hover:bg-white hover:border-white transition-all duration-300 rounded-full" aria-label="Threads">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M6.321 6.016c-.27-.18-1.166-.802-1.166-.802.756-1.081 1.753-1.502 3.132-1.502.975 0 1.803.327 2.394.948s.928 1.509 1.005 2.644q.492.207.905.484c1.109.745 1.719 1.86 1.719 3.137 0 2.716-2.226 5.075-6.256 5.075C4.594 16 1 13.987 1 7.994 1 2.034 4.482 0 8.044 0 9.69 0 13.55.243 15 5.036l-1.36.353C12.516 1.974 10.163 1.43 8.006 1.43c-3.565 0-5.582 2.171-5.582 6.79 0 4.143 2.254 6.343 5.63 6.343 2.777 0 4.847-1.443 4.847-3.556 0-1.438-1.208-2.127-1.27-2.127-.236 1.234-.868 3.31-3.644 3.31-1.618 0-3.013-1.118-3.013-2.582 0-2.09 1.984-2.847 3.55-2.847.586 0 1.294.04 1.663.114 0-.637-.54-1.728-1.9-1.728-1.25 0-1.566.405-1.967.868ZM8.716 8.19c-2.04 0-2.304.87-2.304 1.416 0 .878 1.043 1.168 1.6 1.168 1.02 0 2.067-.282 2.232-2.423a6.2 6.2 0 0 0-1.528-.161"/>
                </svg>
              </a>
              <a href="https://www.youtube.com/@WodibenuahFair" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-deep-black hover:bg-white hover:border-white transition-all duration-300 rounded-full" aria-label="YouTube">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-gold mb-6">Explore</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/event-info" className="hover:text-white transition-colors">Event Info</Link></li>
              <li><Link to="/vendors" className="hover:text-white transition-colors">Vendors</Link></li>
              <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-gold mb-6">Support</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Register as Vendor</Link></li>
              <li><Link to="/contact?type=Sponsorship" className="hover:text-white transition-colors">Sponsorship</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms & Privacy</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-gold mb-6">Stay Updated</h3>
            <p className="text-gray-400 text-sm mb-4">Subscribe to our newsletter for the latest updates.</p>
            <form className="space-y-2" onSubmit={handleSubmit}>
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address" 
                  disabled={status === 'loading' || status === 'success'}
                  className="w-full bg-transparent border border-gray-700 p-3 text-sm focus:border-gold outline-none text-white transition-colors placeholder-gray-600 disabled:opacity-50" 
                  required
                />
                {status === 'success' && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
              </div>
              <button 
                type="submit"
                disabled={status === 'loading' || status === 'success'}
                className={`w-full font-bold uppercase text-xs tracking-widest py-3 transition-colors ${
                  status === 'success' 
                    ? 'bg-green-600 text-white cursor-default'
                    : 'bg-white text-deep-black hover:bg-gold cursor-pointer'
                }`}
              >
                {status === 'loading' ? 'Subscribing...' : status === 'success' ? 'Subscribed!' : 'Subscribe'}
              </button>
            </form>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 uppercase tracking-wider">
          <p>© 2026 Wodibenuah Fair. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/admin" className="opacity-50 hover:opacity-100 hover:text-white transition-colors">Admin</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
