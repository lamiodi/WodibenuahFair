import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ReactGA from 'react-ga4';
import ScrollToTop from './components/ScrollToTop';
import Header from './components/Header';
import WhatsAppChat from './components/WhatsAppChat';
import SEO from './components/SEO';
import Loading from './components/Loading';

// Helper to add minimum delay for smoother transition
const lazyWithDelay = (importFunc) => {
  return lazy(() => {
    return Promise.all([
      importFunc(),
      new Promise(resolve => setTimeout(resolve, 800)) // 800ms delay
    ]).then(([moduleExports]) => moduleExports);
  });
};

// Lazy load pages
const Home = lazyWithDelay(() => import('./pages/Home'));
const EventInfo = lazyWithDelay(() => import('./pages/EventInfo'));
const Vendors = lazyWithDelay(() => import('./pages/Vendors'));
const Register = lazyWithDelay(() => import('./pages/Register'));
const Contact = lazyWithDelay(() => import('./pages/Contact'));
const Terms = lazyWithDelay(() => import('./pages/Terms'));
const Privacy = lazyWithDelay(() => import('./pages/Privacy'));
const About = lazyWithDelay(() => import('./pages/About'));
const Blog = lazyWithDelay(() => import('./pages/Blog'));
const BlogPost = lazyWithDelay(() => import('./pages/BlogPost'));
const FAQ = lazyWithDelay(() => import('./pages/FAQ'));
const AdminDashboard = lazyWithDelay(() => import('./pages/AdminDashboard'));
const AdminLogin = lazyWithDelay(() => import('./pages/AdminLogin'));
const ThankYou = lazyWithDelay(() => import('./pages/ThankYou'));
const NotFound = lazyWithDelay(() => import('./pages/NotFound'));

// Initialize GA4
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
if (GA_MEASUREMENT_ID) {
  ReactGA.initialize(GA_MEASUREMENT_ID);
}

const PageTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (GA_MEASUREMENT_ID) {
      ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
    }
  }, [location]);

  return null;
};

function App() {
  return (
    <Router>
      <PageTracker />
      <SEO />
      <ScrollToTop />
      <Toaster position="top-center" reverseOrder={false} />
      <WhatsAppChat />
      <div className="min-h-screen bg-white font-body text-deep-black">
        <Header />
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/event-info" element={<EventInfo />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/register" element={<Register />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
