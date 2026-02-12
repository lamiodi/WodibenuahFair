import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ReactGA from 'react-ga4';
import ScrollToTop from './components/ScrollToTop';
import Header from './components/Header';
import SEO from './components/SEO';
import Home from './pages/Home';
import EventInfo from './pages/EventInfo';
import Vendors from './pages/Vendors';
import Register from './pages/Register';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import About from './pages/About';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import FAQ from './pages/FAQ';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import NotFound from './pages/NotFound';

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
      <div className="min-h-screen bg-white font-body text-deep-black">
        <Header />
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
