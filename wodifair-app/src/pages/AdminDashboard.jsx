import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { apiRequest } from '../services/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({ vendors: 0, blogs: 0, events: 0, highlights: 0 });
  const [vendors, setVendors] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [events, setEvents] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  
  // Blog Modal State
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [currentBlog, setCurrentBlog] = useState(null);
  const [blogForm, setBlogForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    imageUrl: '',
    isPublished: false
  });

  // Highlight Modal State
  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const [currentHighlight, setCurrentHighlight] = useState(null);
  const [highlightForm, setHighlightForm] = useState({
    title: '',
    description: '',
    imageUrl: '',
    badge: '',
    displayOrder: 0
  });

  const [eventForm, setEventForm] = useState({
    title: '',
    location: '',
    startDate: '',
    endDate: '',
    description: '',
    imageUrl: '',
    status: 'upcoming',
    isRegistrationOpen: true,
    isFeatured: false
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [vendorsData, blogsData, eventsData, highlightsData, messagesData] = await Promise.all([
          apiRequest('/vendors'),
          apiRequest('/blog/all'),
          apiRequest('/admin/events'),
          apiRequest('/highlights'),
          apiRequest('/contact')
        ]);

        setVendors(Array.isArray(vendorsData) ? vendorsData : []);
        setBlogs(Array.isArray(blogsData) ? blogsData : []);
        setEvents(Array.isArray(eventsData) ? eventsData : []);
        setHighlights(Array.isArray(highlightsData) ? highlightsData : []);
        setMessages(Array.isArray(messagesData) ? messagesData : []);
        
        setStats({
          vendors: Array.isArray(vendorsData) ? vendorsData.length : 0,
          blogs: Array.isArray(blogsData) ? blogsData.length : 0,
          events: Array.isArray(eventsData) ? eventsData.length : 0,
          highlights: Array.isArray(highlightsData) ? highlightsData.length : 0,
          messages: Array.isArray(messagesData) ? messagesData.length : 0
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  const openEventModal = (event = null) => {
    if (event) {
      setCurrentEvent(event);
      setEventForm({
        title: event.title,
        location: event.location,
        startDate: event.start_date ? new Date(event.start_date).toISOString().slice(0, 16) : '',
        endDate: event.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : '',
        description: event.description || '',
        imageUrl: event.image_url || '',
        status: event.status || 'upcoming',
        isRegistrationOpen: event.is_registration_open,
        isFeatured: event.is_featured
      });
    } else {
      setCurrentEvent(null);
      setEventForm({
        title: '',
        location: '',
        mapLink: '',
        startDate: '',
        endDate: '',
        description: '',
        imageUrl: '',
        status: 'upcoming',
        isRegistrationOpen: true,
        isFeatured: false
      });
    }
    setShowEventModal(true);
  };

  const openBlogModal = (post = null) => {
    if (post) {
      setCurrentBlog(post);
      setBlogForm({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || '',
        content: post.content || '',
        category: post.category || '',
        imageUrl: post.image_url || '',
        isPublished: post.is_published
      });
    } else {
      setCurrentBlog(null);
      setBlogForm({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        category: '',
        imageUrl: '',
        isPublished: false
      });
    }
    setShowBlogModal(true);
  };

  const openHighlightModal = (highlight = null) => {
    if (highlight) {
      setCurrentHighlight(highlight);
      setHighlightForm({
        title: highlight.title,
        description: highlight.description,
        imageUrl: highlight.image_url || '',
        badge: highlight.badge || '',
        displayOrder: highlight.display_order || 0
      });
    } else {
      setCurrentHighlight(null);
      setHighlightForm({
        title: '',
        description: '',
        imageUrl: '',
        badge: '',
        displayOrder: 0
      });
    }
    setShowHighlightModal(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    const method = currentEvent ? 'PUT' : 'POST';
    const endpoint = currentEvent 
      ? `/events/${currentEvent.id}`
      : `/events`;

    try {
      const savedEvent = await apiRequest(endpoint, {
        method,
        body: eventForm
      });

      toast.success(`Event ${currentEvent ? 'updated' : 'created'} successfully`);
      
      if (currentEvent) {
        setEvents(events.map(e => e.id === savedEvent.id ? savedEvent : e));
      } else {
        setEvents([savedEvent, ...events]);
        setStats(prev => ({ ...prev, events: prev.events + 1 }));
      }
      setShowEventModal(false);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error saving event');
    }
  };

  const handleSaveBlog = async (e) => {
    e.preventDefault();
    const method = currentBlog ? 'PUT' : 'POST';
    const endpoint = currentBlog 
      ? `/blog/${currentBlog.id}`
      : `/blog`;

    try {
      const savedPost = await apiRequest(endpoint, {
        method,
        body: blogForm
      });

      toast.success(`Blog post ${currentBlog ? 'updated' : 'created'} successfully`);
      
      if (currentBlog) {
        setBlogs(blogs.map(b => b.id === savedPost.id ? savedPost : b));
      } else {
        setBlogs([savedPost, ...blogs]);
        setStats(prev => ({ ...prev, blogs: prev.blogs + 1 }));
      }
      setShowBlogModal(false);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error saving blog post');
    }
  };

  const handleSaveHighlight = async (e) => {
    e.preventDefault();
    const method = currentHighlight ? 'PUT' : 'POST';
    const endpoint = currentHighlight 
      ? `/highlights/${currentHighlight.id}`
      : `/highlights`;

    try {
      const savedHighlight = await apiRequest(endpoint, {
        method,
        body: highlightForm
      });

      toast.success(`Highlight ${currentHighlight ? 'updated' : 'created'} successfully`);
      
      if (currentHighlight) {
        setHighlights(highlights.map(h => h.id === savedHighlight.id ? savedHighlight : h));
      } else {
        setHighlights([...highlights, savedHighlight]);
        setStats(prev => ({ ...prev, highlights: prev.highlights + 1 }));
      }
      setShowHighlightModal(false);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error saving highlight');
    }
  };

  const handleDelete = async (type, id) => {
    if(!window.confirm('Are you sure you want to delete this item?')) return;
    
    // Adjust endpoint for highlights
    const endpoint = type === 'highlights' ? `/highlights/${id}` : `/${type}/${id}`;
    
    try {
        await apiRequest(endpoint, {
            method: 'DELETE'
        });
        
        toast.success('Item deleted successfully');
        if (type === 'blog') {
            setBlogs(blogs.filter(b => b.id !== id));
            setStats(prev => ({ ...prev, blogs: prev.blogs - 1 }));
        }
        if (type === 'events') {
            setEvents(events.filter(e => e.id !== id));
            setStats(prev => ({ ...prev, events: prev.events - 1 }));
        }
        if (type === 'highlights') {
            setHighlights(highlights.filter(h => h.id !== id));
            setStats(prev => ({ ...prev, highlights: prev.highlights - 1 }));
        }
    } catch(err) {
        console.error(err);
        toast.error(err.message || 'Error deleting item');
    }
  };

  const renderContent = () => {
    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading dashboard data...</div>;
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            <h2 className="text-3xl font-heading font-bold uppercase">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white border border-deep-black p-8">
                <h3 className="text-xl font-heading font-bold uppercase mb-4">Total Vendors</h3>
                <p className="text-4xl font-bold">{stats.vendors}</p>
              </div>
              <div className="bg-white border border-deep-black p-8">
                <h3 className="text-xl font-heading font-bold uppercase mb-4">Blog Posts</h3>
                <p className="text-4xl font-bold">{stats.blogs}</p>
              </div>
              <div className="bg-white border border-deep-black p-8">
                <h3 className="text-xl font-heading font-bold uppercase mb-4">Upcoming Events</h3>
                <p className="text-4xl font-bold">{stats.events}</p>
              </div>
              <div className="bg-white border border-deep-black p-8">
                <h3 className="text-xl font-heading font-bold uppercase mb-4">Highlights</h3>
                <p className="text-4xl font-bold">{stats.highlights}</p>
              </div>
            </div>
          </div>
        );
      case 'blog':
        return (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-heading font-bold uppercase">Manage Blog Posts</h2>
              <button onClick={() => openBlogModal()} className="bg-deep-black text-white px-6 py-3 text-sm font-bold uppercase tracking-wider hover:bg-gold hover:text-deep-black transition-colors">
                Add New Post
              </button>
            </div>
            <div className="bg-white border border-deep-black p-8 overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="border-b border-deep-black">
                    <th className="pb-4 font-heading font-bold uppercase">Title</th>
                    <th className="pb-4 font-heading font-bold uppercase">Date</th>
                    <th className="pb-4 font-heading font-bold uppercase">Category</th>
                    <th className="pb-4 font-heading font-bold uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {blogs.length > 0 ? blogs.map(post => (
                    <tr key={post.id} className="group hover:bg-gray-50">
                        <td className="py-4 font-medium">{post.title}</td>
                        <td className="py-4 text-gray-600">
                            {new Date(post.published_at).toLocaleDateString()}
                        </td>
                        <td className="py-4">
                            <span className="bg-gray-100 text-xs font-bold px-2 py-1 uppercase tracking-wider">
                                {post.category || 'Uncategorized'}
                            </span>
                        </td>
                        <td className="py-4">
                        <button onClick={() => openBlogModal(post)} className="text-sm font-bold uppercase tracking-wider text-gray-500 hover:text-deep-black mr-4">Edit</button>
                        <button onClick={() => handleDelete('blog', post.id)} className="text-sm font-bold uppercase tracking-wider text-red-500 hover:text-red-700">Delete</button>
                        </td>
                    </tr>
                  )) : (
                    <tr>
                        <td colSpan="4" className="py-8 text-center text-gray-500 italic">No blog posts found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'highlights':
        return (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-heading font-bold uppercase">Manage Highlights</h2>
              <button onClick={() => openHighlightModal()} className="bg-deep-black text-white px-6 py-3 text-sm font-bold uppercase tracking-wider hover:bg-gold hover:text-deep-black transition-colors">
                Add New Highlight
              </button>
            </div>
            <div className="bg-white border border-deep-black p-8 overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="border-b border-deep-black">
                    <th className="pb-4 font-heading font-bold uppercase">Title</th>
                    <th className="pb-4 font-heading font-bold uppercase">Badge</th>
                    <th className="pb-4 font-heading font-bold uppercase">Order</th>
                    <th className="pb-4 font-heading font-bold uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {highlights.length > 0 ? highlights.map(highlight => (
                    <tr key={highlight.id} className="group hover:bg-gray-50">
                        <td className="py-4 font-medium">{highlight.title}</td>
                        <td className="py-4">
                            <span className="bg-gold text-deep-black text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
                                {highlight.badge}
                            </span>
                        </td>
                        <td className="py-4 font-medium">{highlight.display_order}</td>
                        <td className="py-4">
                        <button onClick={() => openHighlightModal(highlight)} className="text-sm font-bold uppercase tracking-wider text-gray-500 hover:text-deep-black mr-4">Edit</button>
                        <button onClick={() => handleDelete('highlights', highlight.id)} className="text-sm font-bold uppercase tracking-wider text-red-500 hover:text-red-700">Delete</button>
                        </td>
                    </tr>
                  )) : (
                    <tr>
                        <td colSpan="4" className="py-8 text-center text-gray-500 italic">No highlights found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'events':
        return (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-heading font-bold uppercase">Manage Events</h2>
              <button onClick={() => openEventModal()} className="bg-deep-black text-white px-6 py-3 text-sm font-bold uppercase tracking-wider hover:bg-gold hover:text-deep-black transition-colors">
                Add New Event
              </button>
            </div>
            <div className="bg-white border border-deep-black p-8 overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                    <thead>
                    <tr className="border-b border-deep-black">
                        <th className="pb-4 font-heading font-bold uppercase">Event</th>
                        <th className="pb-4 font-heading font-bold uppercase">Date</th>
                        <th className="pb-4 font-heading font-bold uppercase">Status</th>
                        <th className="pb-4 font-heading font-bold uppercase">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {events.length > 0 ? events.map(event => (
                        <tr key={event.id} className="group hover:bg-gray-50">
                            <td className="py-4 font-medium">
                              {event.title}
                              {event.is_featured && <span className="ml-2 bg-gold text-deep-black text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Next</span>}
                            </td>
                            <td className="py-4 text-gray-600">
                                {new Date(event.start_date).toLocaleDateString()}
                            </td>
                            <td className="py-4">
                              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${event.is_registration_open ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {event.is_registration_open ? 'Reg Open' : 'Reg Closed'}
                              </span>
                            </td>
                            <td className="py-4">
                            <button onClick={() => openEventModal(event)} className="text-sm font-bold uppercase tracking-wider text-gray-500 hover:text-deep-black mr-4">Edit</button>
                            <button onClick={() => handleDelete('events', event.id)} className="text-sm font-bold uppercase tracking-wider text-red-500 hover:text-red-700">Delete</button>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="4" className="py-8 text-center text-gray-500 italic">No events found.</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
          </div>
        );
      case 'vendors':
        return (
          <div className="space-y-8">
            <h2 className="text-3xl font-heading font-bold uppercase">Registered Vendors</h2>
             <div className="bg-white border border-deep-black p-8 overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                    <thead>
                    <tr className="border-b border-deep-black">
                        <th className="pb-4 font-heading font-bold uppercase">Business</th>
                        <th className="pb-4 font-heading font-bold uppercase">Contact</th>
                        <th className="pb-4 font-heading font-bold uppercase">Sector</th>
                        <th className="pb-4 font-heading font-bold uppercase">Payment</th>
                        <th className="pb-4 font-heading font-bold uppercase">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {vendors.length > 0 ? vendors.map(vendor => (
                        <tr key={vendor.id} className="group hover:bg-gray-50">
                            <td className="py-4">
                                <div className="font-bold">{vendor.business_name}</div>
                                <div className="text-xs text-gray-500">{vendor.full_name}</div>
                            </td>
                            <td className="py-4 text-sm">
                                <div>{vendor.email}</div>
                                <div>{vendor.phone_number}</div>
                            </td>
                            <td className="py-4">{vendor.sector}</td>
                            <td className="py-4">
                                <span className={`text-xs font-bold px-2 py-1 uppercase tracking-wider ${
                                    vendor.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {vendor.payment_status}
                                </span>
                            </td>
                            <td className="py-4">
                                <button onClick={() => toast('Feature coming soon')} className="text-sm font-bold uppercase tracking-wider text-gray-500 hover:text-deep-black">Details</button>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="5" className="py-8 text-center text-gray-500 italic">No vendors registered yet.</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
          </div>
        );
      case 'register':
        return (
          <div className="space-y-8">
            <h2 className="text-3xl font-heading font-bold uppercase">Registrations</h2>
             <div className="bg-white border border-deep-black p-8 overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                    <thead>
                    <tr className="border-b border-deep-black">
                        <th className="pb-4 font-heading font-bold uppercase">Business</th>
                        <th className="pb-4 font-heading font-bold uppercase">Contact</th>
                        <th className="pb-4 font-heading font-bold uppercase">Sector</th>
                        <th className="pb-4 font-heading font-bold uppercase">Payment</th>
                        <th className="pb-4 font-heading font-bold uppercase">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {vendors.length > 0 ? vendors.map(vendor => (
                        <tr key={vendor.id} className="group hover:bg-gray-50">
                            <td className="py-4">
                                <div className="font-bold">{vendor.business_name}</div>
                                <div className="text-xs text-gray-500">{vendor.full_name}</div>
                            </td>
                            <td className="py-4 text-sm">
                                <div>{vendor.email}</div>
                                <div>{vendor.phone_number}</div>
                            </td>
                            <td className="py-4">{vendor.sector}</td>
                            <td className="py-4">
                                <span className={`text-xs font-bold px-2 py-1 uppercase tracking-wider ${
                                    vendor.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {vendor.payment_status}
                                </span>
                            </td>
                            <td className="py-4">
                                <button onClick={() => toast('Feature coming soon')} className="text-sm font-bold uppercase tracking-wider text-gray-500 hover:text-deep-black">Details</button>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="5" className="py-8 text-center text-gray-500 italic">No registrations found.</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
          </div>
        );
      case 'messages':
        return (
          <div className="space-y-8">
            <h2 className="text-3xl font-heading font-bold uppercase">Messages</h2>
            <div className="bg-white border border-deep-black p-8 overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="border-b border-deep-black">
                    <th className="pb-4 font-heading font-bold uppercase">Date</th>
                    <th className="pb-4 font-heading font-bold uppercase">Name</th>
                    <th className="pb-4 font-heading font-bold uppercase">Email</th>
                    <th className="pb-4 font-heading font-bold uppercase">Type</th>
                    <th className="pb-4 font-heading font-bold uppercase">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {messages.length > 0 ? messages.map(msg => (
                    <tr key={msg.id} className="group hover:bg-gray-50">
                      <td className="py-4 text-gray-600 text-sm">{new Date(msg.created_at).toLocaleDateString()}</td>
                      <td className="py-4 font-medium">{msg.name}</td>
                      <td className="py-4 text-sm">{msg.email}</td>
                      <td className="py-4">
                        <span className="bg-gray-100 text-xs font-bold px-2 py-1 uppercase tracking-wider">
                          {msg.inquiry_type}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-gray-600 max-w-xs truncate">{msg.message}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-500 italic">No messages found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      default:
        return (
            <div className="bg-white border border-deep-black p-8 text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-heading font-bold uppercase mb-6">Coming Soon</h2>
              <p className="text-gray-600 mb-8">
                We are working on this feature. Please check back later.
              </p>
              <button onClick={() => setActiveTab('dashboard')} className="text-sm font-bold uppercase tracking-wider text-gold hover:text-deep-black">
                Back to Dashboard
              </button>
            </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-cream text-deep-black font-body flex flex-col">
      {/* Title Banner */}
      <div className="w-full px-2 md:px-8 py-3 md:py-6 border-b border-deep-black bg-deep-black text-white">
        <div className="relative w-full max-w-[1920px] mx-auto flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tighter uppercase">
            Admin Dashboard
          </h1>
          <button 
            onClick={handleLogout}
            className="text-xs font-bold uppercase tracking-widest border border-white px-4 py-2 hover:bg-white hover:text-deep-black transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <Navigation activeItem="Admin" />

      <div className="flex flex-col md:flex-row flex-grow min-h-[600px]">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-deep-black">
          <div className="flex flex-col">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`text-left px-8 py-6 text-sm font-bold uppercase tracking-wider border-b border-gray-100 hover:bg-gray-50 transition-colors ${activeTab === 'dashboard' ? 'bg-deep-black text-white hover:bg-deep-black' : ''}`}
            >
              Home
            </button>
            <button 
              onClick={() => setActiveTab('events')}
              className={`text-left px-8 py-6 text-sm font-bold uppercase tracking-wider border-b border-gray-100 hover:bg-gray-50 transition-colors ${activeTab === 'events' ? 'bg-deep-black text-white hover:bg-deep-black' : ''}`}
            >
              Event Info
            </button>
            <button 
              onClick={() => setActiveTab('vendors')}
              className={`text-left px-8 py-6 text-sm font-bold uppercase tracking-wider border-b border-gray-100 hover:bg-gray-50 transition-colors ${activeTab === 'vendors' ? 'bg-deep-black text-white hover:bg-deep-black' : ''}`}
            >
              Vendors
            </button>
            <button 
              onClick={() => setActiveTab('blog')}
              className={`text-left px-8 py-6 text-sm font-bold uppercase tracking-wider border-b border-gray-100 hover:bg-gray-50 transition-colors ${activeTab === 'blog' ? 'bg-deep-black text-white hover:bg-deep-black' : ''}`}
            >
              Blog
            </button>
            <button 
              onClick={() => setActiveTab('register')}
              className={`text-left px-8 py-6 text-sm font-bold uppercase tracking-wider border-b border-gray-100 hover:bg-gray-50 transition-colors ${activeTab === 'register' ? 'bg-deep-black text-white hover:bg-deep-black' : ''}`}
            >
              Register
            </button>
            <button 
              onClick={() => setActiveTab('messages')}
              className={`text-left px-8 py-6 text-sm font-bold uppercase tracking-wider border-b border-gray-100 hover:bg-gray-50 transition-colors ${activeTab === 'messages' ? 'bg-deep-black text-white hover:bg-deep-black' : ''}`}
            >
              Contact
            </button>
            <button 
              onClick={() => setActiveTab('highlights')}
              className={`text-left px-8 py-6 text-sm font-bold uppercase tracking-wider border-b border-gray-100 hover:bg-gray-50 transition-colors ${activeTab === 'highlights' ? 'bg-deep-black text-white hover:bg-deep-black' : ''}`}
            >
              Highlights
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow p-8 md:p-12 bg-cream">
          {renderContent()}
        </div>
      </div>

      <Footer />

      {/* Blog Modal */}
      {showBlogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowBlogModal(false)}>
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 border border-white/20 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setShowBlogModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-deep-black"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <h2 className="text-2xl font-heading font-bold uppercase mb-6">
              {currentBlog ? 'Edit Post' : 'Add New Post'}
            </h2>
            
            <form onSubmit={handleSaveBlog} className="space-y-6">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Title</label>
                <input 
                  type="text" 
                  value={blogForm.title}
                  onChange={e => setBlogForm({...blogForm, title: e.target.value})}
                  className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Slug</label>
                <input 
                  type="text" 
                  value={blogForm.slug}
                  onChange={e => setBlogForm({...blogForm, slug: e.target.value})}
                  className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Category</label>
                <input 
                  type="text" 
                  value={blogForm.category}
                  onChange={e => setBlogForm({...blogForm, category: e.target.value})}
                  className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Image URL</label>
                <input 
                  type="text" 
                  value={blogForm.imageUrl}
                  onChange={e => setBlogForm({...blogForm, imageUrl: e.target.value})}
                  className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Excerpt</label>
                <textarea 
                  value={blogForm.excerpt}
                  onChange={e => setBlogForm({...blogForm, excerpt: e.target.value})}
                  className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold h-20"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Content</label>
                <textarea 
                  value={blogForm.content}
                  onChange={e => setBlogForm({...blogForm, content: e.target.value})}
                  className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold h-48"
                  required
                ></textarea>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 p-6 border border-gray-200">
                <input 
                  type="checkbox" 
                  id="isPublished"
                  checked={blogForm.isPublished}
                  onChange={e => setBlogForm({...blogForm, isPublished: e.target.checked})}
                  className="w-5 h-5 text-gold border-deep-black focus:ring-gold"
                />
                <label htmlFor="isPublished" className="text-sm font-bold uppercase tracking-wider cursor-pointer">
                  Publish Immediately
                </label>
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  type="button"
                  onClick={() => setShowBlogModal(false)}
                  className="mr-4 px-6 py-3 text-sm font-bold uppercase tracking-wider text-gray-500 hover:text-deep-black"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-deep-black text-white px-8 py-3 text-sm font-bold uppercase tracking-wider hover:bg-gold hover:text-deep-black transition-colors"
                >
                  {currentBlog ? 'Update Post' : 'Create Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Highlight Modal */}
      {showHighlightModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowHighlightModal(false)}>
          <div className="bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto p-8 border border-white/20 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setShowHighlightModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-deep-black"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <h2 className="text-2xl font-heading font-bold uppercase mb-6">
              {currentHighlight ? 'Edit Highlight' : 'Add Highlight'}
            </h2>
            
            <form onSubmit={handleSaveHighlight} className="space-y-6">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Title</label>
                <input 
                  type="text" 
                  value={highlightForm.title}
                  onChange={e => setHighlightForm({...highlightForm, title: e.target.value})}
                  className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Description</label>
                <textarea 
                  value={highlightForm.description}
                  onChange={e => setHighlightForm({...highlightForm, description: e.target.value})}
                  className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold h-32"
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Image URL</label>
                <input 
                  type="text" 
                  value={highlightForm.imageUrl}
                  onChange={e => setHighlightForm({...highlightForm, imageUrl: e.target.value})}
                  className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold"
                  placeholder="https://..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2">Badge Text</label>
                  <input 
                    type="text" 
                    value={highlightForm.badge}
                    onChange={e => setHighlightForm({...highlightForm, badge: e.target.value})}
                    className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold"
                    placeholder="e.g. Premium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2">Display Order</label>
                  <input 
                    type="number" 
                    value={highlightForm.displayOrder}
                    onChange={e => setHighlightForm({...highlightForm, displayOrder: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  type="button"
                  onClick={() => setShowHighlightModal(false)}
                  className="mr-4 px-6 py-3 text-sm font-bold uppercase tracking-wider text-gray-500 hover:text-deep-black"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-deep-black text-white px-8 py-3 text-sm font-bold uppercase tracking-wider hover:bg-gold hover:text-deep-black transition-colors"
                >
                  {currentHighlight ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowEventModal(false)}>
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 border border-white/20 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setShowEventModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-deep-black"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <h2 className="text-2xl font-heading font-bold uppercase mb-6">
              {currentEvent ? 'Edit Event' : 'Add New Event'}
            </h2>
            
            <form onSubmit={handleSaveEvent} className="space-y-6">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Title</label>
                <input 
                  type="text" 
                  value={eventForm.title}
                  onChange={e => setEventForm({...eventForm, title: e.target.value})}
                  className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Location</label>
                <input 
                  type="text" 
                  value={eventForm.location}
                  onChange={e => setEventForm({...eventForm, location: e.target.value})}
                  className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2">Start Date</label>
                  <input 
                    type="datetime-local" 
                    value={eventForm.startDate}
                    onChange={e => setEventForm({...eventForm, startDate: e.target.value})}
                    className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2">End Date (Optional)</label>
                  <input 
                    type="datetime-local" 
                    value={eventForm.endDate}
                    onChange={e => setEventForm({...eventForm, endDate: e.target.value})}
                    className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Description</label>
                <textarea 
                  value={eventForm.description}
                  onChange={e => setEventForm({...eventForm, description: e.target.value})}
                  className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold h-32"
                  required
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Image URL (Optional)</label>
                <input 
                  type="text" 
                  value={eventForm.imageUrl}
                  onChange={e => setEventForm({...eventForm, imageUrl: e.target.value})}
                  className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold"
                  placeholder="https://..."
                />
              </div>
              
              <div className="flex flex-col gap-4 bg-gray-50 p-6 border border-gray-200">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="isRegistrationOpen"
                    checked={eventForm.isRegistrationOpen}
                    onChange={e => setEventForm({...eventForm, isRegistrationOpen: e.target.checked})}
                    className="w-5 h-5 text-gold border-deep-black focus:ring-gold"
                  />
                  <label htmlFor="isRegistrationOpen" className="text-sm font-bold uppercase tracking-wider cursor-pointer">
                    Registration Open
                  </label>
                </div>
                
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="isFeatured"
                    checked={eventForm.isFeatured}
                    onChange={e => setEventForm({...eventForm, isFeatured: e.target.checked})}
                    className="w-5 h-5 text-gold border-deep-black focus:ring-gold"
                  />
                  <label htmlFor="isFeatured" className="text-sm font-bold uppercase tracking-wider cursor-pointer flex flex-col">
                    <span>Set as Next Event</span>
                    <span className="text-xs text-gray-500 font-normal normal-case tracking-normal">This will replace the countdown on the home page. Only one event can be the &quot;Next Event&quot;.</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <button 
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="mr-4 px-6 py-3 text-sm font-bold uppercase tracking-wider text-gray-500 hover:text-deep-black"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-deep-black text-white px-8 py-3 text-sm font-bold uppercase tracking-wider hover:bg-gold hover:text-deep-black transition-colors"
                >
                  {currentEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
