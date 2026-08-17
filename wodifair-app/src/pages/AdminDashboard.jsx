import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { apiRequest } from '../services/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();

  const [stats, setStats] = useState({ vendors: 0, blogs: 0, events: 0, highlights: 0, messages: 0 });
  const [vendors, setVendors] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [events, setEvents] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination State (Vendors)
  const [vendorPage, setVendorPage] = useState(1);
  const [vendorTotalPages, setVendorTotalPages] = useState(1);
  const vendorLimit = 20;

  // Vendor Details Modal State
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [currentVendor, setCurrentVendor] = useState(null);
  const [sendingEmailId, setSendingEmailId] = useState(null);

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

  // Event Modal State
  const [showEventModal, setShowEventModal] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
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

  // ==========================================
  // FILTER & SEARCH STATES ACROSS SECTIONS
  // ==========================================

  // 1. Vendors Section Filter States
  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorApprovalFilter, setVendorApprovalFilter] = useState('all');
  const [vendorStatusFilter, setVendorStatusFilter] = useState('all');
  const [vendorLocationFilter, setVendorLocationFilter] = useState('all');
  const [vendorBoothFilter, setVendorBoothFilter] = useState('all');
  const [vendorSectorFilter, setVendorSectorFilter] = useState('all');
  const [vendorSort, setVendorSort] = useState('newest');
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  // 2. Registrations Section Filter States
  const [regSearch, setRegSearch] = useState('');
  const [regApprovalFilter, setRegApprovalFilter] = useState('all');
  const [regStatusFilter, setRegStatusFilter] = useState('all');
  const [regLocationFilter, setRegLocationFilter] = useState('all');
  const [regBoothFilter, setRegBoothFilter] = useState('all');
  const [regSort, setRegSort] = useState('newest');

  // 3. Events Section Filter States
  const [eventSearch, setEventSearch] = useState('');
  const [eventStatusFilter, setEventStatusFilter] = useState('all');
  const [eventRegFilter, setEventRegFilter] = useState('all');
  const [eventSort, setEventSort] = useState('date_desc');

  // 4. Blog Posts Section Filter States
  const [blogSearch, setBlogSearch] = useState('');
  const [blogCategoryFilter, setBlogCategoryFilter] = useState('all');
  const [blogStatusFilter, setBlogStatusFilter] = useState('all');
  const [blogSort, setBlogSort] = useState('newest');

  // 5. Highlights Section Filter States
  const [highlightSearch, setHighlightSearch] = useState('');
  const [highlightBadgeFilter, setHighlightBadgeFilter] = useState('all');
  const [highlightSort, setHighlightSort] = useState('order_asc');

  // 6. Messages Section Filter States
  const [messageSearch, setMessageSearch] = useState('');
  const [messageTypeFilter, setMessageTypeFilter] = useState('all');
  const [messageSort, setMessageSort] = useState('newest');

  // ==========================================
  // DYNAMIC OPTION LISTS FOR DROPDOWNS
  // ==========================================
  const uniqueVendorLocations = useMemo(() => {
    return Array.from(new Set(vendors.map(v => v.selected_location).filter(Boolean))).sort();
  }, [vendors]);

  const uniqueVendorBooths = useMemo(() => {
    return Array.from(new Set(vendors.map(v => v.booth_type).filter(Boolean))).sort();
  }, [vendors]);

  const uniqueVendorSectors = useMemo(() => {
    return Array.from(new Set(vendors.map(v => v.sector).filter(Boolean))).sort();
  }, [vendors]);

  const uniqueBlogCategories = useMemo(() => {
    return Array.from(new Set(blogs.map(b => b.category).filter(Boolean))).sort();
  }, [blogs]);

  const uniqueHighlightBadges = useMemo(() => {
    return Array.from(new Set(highlights.map(h => h.badge).filter(Boolean))).sort();
  }, [highlights]);

  const uniqueMessageTypes = useMemo(() => {
    return Array.from(new Set(messages.map(m => m.inquiry_type).filter(Boolean))).sort();
  }, [messages]);

  // ==========================================
  // FILTERED & SORTED DATA COMPUTATIONS
  // ==========================================

  // Filtered Vendors
  const filteredVendors = useMemo(() => {
    return vendors
      .filter(vendor => {
        const matchesSearch = !vendorSearch.trim() || [
          vendor.business_name,
          vendor.full_name,
          vendor.email,
          vendor.phone_number,
          vendor.instagram_handle,
          vendor.payment_reference,
          vendor.sector,
          vendor.selected_location,
          vendor.booth_type
        ].some(val => val && String(val).toLowerCase().includes(vendorSearch.toLowerCase().trim()));

        const matchesApproval =
          vendorApprovalFilter === 'all' ||
          (vendorApprovalFilter === 'approved' && (vendor.is_approved || vendor.approval_status === 'approved' || vendor.payment_status === 'paid')) ||
          (vendorApprovalFilter === 'pending' && (!vendor.is_approved && vendor.approval_status !== 'rejected' && vendor.payment_status !== 'paid')) ||
          (vendorApprovalFilter === 'rejected' && vendor.approval_status === 'rejected');

        const matchesStatus =
          vendorStatusFilter === 'all' ||
          String(vendor.payment_status || '').toLowerCase() === vendorStatusFilter.toLowerCase();

        const matchesLocation =
          vendorLocationFilter === 'all' ||
          String(vendor.selected_location || '').toLowerCase() === vendorLocationFilter.toLowerCase();

        const matchesBooth =
          vendorBoothFilter === 'all' ||
          String(vendor.booth_type || '').toLowerCase() === vendorBoothFilter.toLowerCase();

        const matchesSector =
          vendorSectorFilter === 'all' ||
          String(vendor.sector || '').toLowerCase() === vendorSectorFilter.toLowerCase();

        return matchesSearch && matchesApproval && matchesStatus && matchesLocation && matchesBooth && matchesSector;
      })
      .sort((a, b) => {
        if (vendorSort === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
        if (vendorSort === 'amount_desc') return (Number(b.amount_paid) || 0) - (Number(a.amount_paid) || 0);
        if (vendorSort === 'amount_asc') return (Number(a.amount_paid) || 0) - (Number(b.amount_paid) || 0);
        if (vendorSort === 'name_asc') return (a.business_name || '').localeCompare(b.business_name || '');
        return new Date(b.created_at) - new Date(a.created_at); // default newest
      });
  }, [vendors, vendorSearch, vendorApprovalFilter, vendorStatusFilter, vendorLocationFilter, vendorBoothFilter, vendorSectorFilter, vendorSort]);

  // Filtered Registrations
  const filteredRegistrations = useMemo(() => {
    return vendors
      .filter(vendor => {
        const matchesSearch = !regSearch.trim() || [
          vendor.business_name,
          vendor.full_name,
          vendor.email,
          vendor.phone_number,
          vendor.instagram_handle,
          vendor.payment_reference,
          vendor.selected_location,
          vendor.booth_type
        ].some(val => val && String(val).toLowerCase().includes(regSearch.toLowerCase().trim()));

        const matchesApproval =
          regApprovalFilter === 'all' ||
          (regApprovalFilter === 'approved' && (vendor.is_approved || vendor.approval_status === 'approved' || vendor.payment_status === 'paid')) ||
          (regApprovalFilter === 'pending' && (!vendor.is_approved && vendor.approval_status !== 'rejected' && vendor.payment_status !== 'paid')) ||
          (regApprovalFilter === 'rejected' && vendor.approval_status === 'rejected');

        const matchesStatus =
          regStatusFilter === 'all' ||
          String(vendor.payment_status || '').toLowerCase() === regStatusFilter.toLowerCase();

        const matchesLocation =
          regLocationFilter === 'all' ||
          String(vendor.selected_location || '').toLowerCase() === regLocationFilter.toLowerCase();

        const matchesBooth =
          regBoothFilter === 'all' ||
          String(vendor.booth_type || '').toLowerCase() === regBoothFilter.toLowerCase();

        return matchesSearch && matchesApproval && matchesStatus && matchesLocation && matchesBooth;
      })
      .sort((a, b) => {
        if (regSort === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
        if (regSort === 'amount_desc') return (Number(b.amount_paid) || 0) - (Number(a.amount_paid) || 0);
        if (regSort === 'name_asc') return (a.business_name || '').localeCompare(b.business_name || '');
        return new Date(b.created_at) - new Date(a.created_at);
      });
  }, [vendors, regSearch, regApprovalFilter, regStatusFilter, regLocationFilter, regBoothFilter, regSort]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter(event => {
        const matchesSearch = !eventSearch.trim() || [
          event.title,
          event.location,
          event.description,
          event.status
        ].some(val => val && String(val).toLowerCase().includes(eventSearch.toLowerCase().trim()));

        let matchesStatus = true;
        if (eventStatusFilter === 'upcoming') {
          matchesStatus = event.start_date ? new Date(event.start_date) >= now : true;
        } else if (eventStatusFilter === 'past') {
          matchesStatus = event.start_date ? new Date(event.start_date) < now : false;
        } else if (eventStatusFilter === 'featured') {
          matchesStatus = Boolean(event.is_featured);
        }

        let matchesReg = true;
        if (eventRegFilter === 'open') {
          matchesReg = Boolean(event.is_registration_open);
        } else if (eventRegFilter === 'closed') {
          matchesReg = !event.is_registration_open;
        }

        return matchesSearch && matchesStatus && matchesReg;
      })
      .sort((a, b) => {
        if (eventSort === 'date_asc') return new Date(a.start_date || 0) - new Date(b.start_date || 0);
        if (eventSort === 'date_desc') return new Date(b.start_date || 0) - new Date(a.start_date || 0);
        if (eventSort === 'title_asc') return (a.title || '').localeCompare(b.title || '');
        return 0;
      });
  }, [events, eventSearch, eventStatusFilter, eventRegFilter, eventSort]);

  // Filtered Blogs
  const filteredBlogs = useMemo(() => {
    return blogs
      .filter(blog => {
        const matchesSearch = !blogSearch.trim() || [
          blog.title,
          blog.slug,
          blog.excerpt,
          blog.category,
          blog.content
        ].some(val => val && String(val).toLowerCase().includes(blogSearch.toLowerCase().trim()));

        const matchesCategory =
          blogCategoryFilter === 'all' ||
          String(blog.category || '').toLowerCase() === blogCategoryFilter.toLowerCase();

        let matchesStatus = true;
        if (blogStatusFilter === 'published') {
          matchesStatus = Boolean(blog.is_published);
        } else if (blogStatusFilter === 'draft') {
          matchesStatus = !blog.is_published;
        }

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (blogSort === 'oldest') return new Date(a.published_at || a.created_at || 0) - new Date(b.published_at || b.created_at || 0);
        if (blogSort === 'title_asc') return (a.title || '').localeCompare(b.title || '');
        return new Date(b.published_at || b.created_at || 0) - new Date(a.published_at || a.created_at || 0);
      });
  }, [blogs, blogSearch, blogCategoryFilter, blogStatusFilter, blogSort]);

  // Filtered Highlights
  const filteredHighlights = useMemo(() => {
    return highlights
      .filter(highlight => {
        const matchesSearch = !highlightSearch.trim() || [
          highlight.title,
          highlight.description,
          highlight.badge
        ].some(val => val && String(val).toLowerCase().includes(highlightSearch.toLowerCase().trim()));

        const matchesBadge =
          highlightBadgeFilter === 'all' ||
          String(highlight.badge || '').toLowerCase() === highlightBadgeFilter.toLowerCase();

        return matchesSearch && matchesBadge;
      })
      .sort((a, b) => {
        if (highlightSort === 'order_asc') return (Number(a.display_order) || 0) - (Number(b.display_order) || 0);
        if (highlightSort === 'order_desc') return (Number(b.display_order) || 0) - (Number(a.display_order) || 0);
        if (highlightSort === 'title_asc') return (a.title || '').localeCompare(b.title || '');
        return 0;
      });
  }, [highlights, highlightSearch, highlightBadgeFilter, highlightSort]);

  // Filtered Messages
  const filteredMessages = useMemo(() => {
    return messages
      .filter(msg => {
        const matchesSearch = !messageSearch.trim() || [
          msg.name,
          msg.email,
          msg.inquiry_type,
          msg.message
        ].some(val => val && String(val).toLowerCase().includes(messageSearch.toLowerCase().trim()));

        const matchesType =
          messageTypeFilter === 'all' ||
          String(msg.inquiry_type || '').toLowerCase() === messageTypeFilter.toLowerCase();

        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        if (messageSort === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
  }, [messages, messageSearch, messageTypeFilter, messageSort]);

  // Helpers to detect active filter states
  const isVendorFilterActive = vendorSearch || vendorApprovalFilter !== 'all' || vendorStatusFilter !== 'all' || vendorLocationFilter !== 'all' || vendorBoothFilter !== 'all' || vendorSectorFilter !== 'all' || vendorSort !== 'newest';
  const isRegFilterActive = regSearch || regApprovalFilter !== 'all' || regStatusFilter !== 'all' || regLocationFilter !== 'all' || regBoothFilter !== 'all' || regSort !== 'newest';
  const isEventFilterActive = eventSearch || eventStatusFilter !== 'all' || eventRegFilter !== 'all' || eventSort !== 'date_desc';
  const isBlogFilterActive = blogSearch || blogCategoryFilter !== 'all' || blogStatusFilter !== 'all' || blogSort !== 'newest';
  const isHighlightFilterActive = highlightSearch || highlightBadgeFilter !== 'all' || highlightSort !== 'order_asc';
  const isMessageFilterActive = messageSearch || messageTypeFilter !== 'all' || messageSort !== 'newest';

  const resetVendorFilters = () => {
    setVendorSearch('');
    setVendorApprovalFilter('all');
    setVendorStatusFilter('all');
    setVendorLocationFilter('all');
    setVendorBoothFilter('all');
    setVendorSectorFilter('all');
    setVendorSort('newest');
  };

  const resetRegFilters = () => {
    setRegSearch('');
    setRegApprovalFilter('all');
    setRegStatusFilter('all');
    setRegLocationFilter('all');
    setRegBoothFilter('all');
    setRegSort('newest');
  };

  // Vendor Approval Status Handler
  const handleUpdateVendorStatus = async (vendorId, newStatus) => {
    if (!vendorId) return;
    setUpdatingStatusId(vendorId);
    toast.loading(`Updating vendor status to ${newStatus}...`, { id: 'status-toast' });
    try {
      const res = await apiRequest(`/vendors/${vendorId}/status`, {
        method: 'PATCH',
        body: { approvalStatus: newStatus }
      });
      const updated = res.vendor;
      setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, ...updated } : v));
      if (currentVendor && currentVendor.id === vendorId) {
        setCurrentVendor(prev => ({ ...prev, ...updated }));
      }
      toast.success(`Vendor marked as ${newStatus}!`, { id: 'status-toast' });
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to update vendor status', { id: 'status-toast' });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const resetEventFilters = () => {
    setEventSearch('');
    setEventStatusFilter('all');
    setEventRegFilter('all');
    setEventSort('date_desc');
  };

  const resetBlogFilters = () => {
    setBlogSearch('');
    setBlogCategoryFilter('all');
    setBlogStatusFilter('all');
    setBlogSort('newest');
  };

  const resetHighlightFilters = () => {
    setHighlightSearch('');
    setHighlightBadgeFilter('all');
    setHighlightSort('order_asc');
  };

  const resetMessageFilters = () => {
    setMessageSearch('');
    setMessageTypeFilter('all');
    setMessageSort('newest');
  };

  // Vendor Email Link Handler
  const handleSendEmailLink = async (vendor) => {
    if (!vendor || !vendor.id) return;
    setSendingEmailId(vendor.id);
    toast.loading(`Sending payment link email to ${vendor.email}...`, { id: 'email-link-toast' });
    try {
      const res = await apiRequest(`/vendors/${vendor.id}/send-payment-link`, {
        method: 'POST'
      });
      const sentTime = res.payment_link_sent_at || new Date().toISOString();
      setVendors(prev => prev.map(v => v.id === vendor.id ? {
        ...v,
        payment_link_sent_at: sentTime,
        payment_link_sent_count: (v.payment_link_sent_count || 0) + 1
      } : v));
      if (currentVendor && currentVendor.id === vendor.id) {
        setCurrentVendor(prev => ({
          ...prev,
          payment_link_sent_at: sentTime,
          payment_link_sent_count: (prev.payment_link_sent_count || 0) + 1
        }));
      }
      toast.success(`Payment link email sent successfully to ${vendor.email}!`, { id: 'email-link-toast' });
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to send email. Please check server email settings.', { id: 'email-link-toast' });
    } finally {
      setSendingEmailId(null);
    }
  };

  // Export CSV Handler
  const handleExportCSV = async () => {
    try {
      toast.loading('Preparing export...', { id: 'export-toast' });
      const data = await apiRequest('/vendors?limit=10000');
      const allVendors = data.vendors || [];

      if (allVendors.length === 0) {
        toast.error('No data to export', { id: 'export-toast' });
        return;
      }

      const headers = ['Business Name', 'Contact Name', 'Email', 'Phone', 'Instagram', 'Booth Type', 'Location', 'Sector', 'Payment Status', 'Amount Paid', 'Reference', 'Date'];
      const csvContent = [
        headers.join(','),
        ...allVendors.map(v => [
          `"${v.business_name || ''}"`,
          `"${v.full_name || ''}"`,
          `"${v.email || ''}"`,
          `"${v.phone_number || ''}"`,
          `"${v.instagram_handle || ''}"`,
          `"${v.booth_type || ''}"`,
          `"${v.selected_location || ''}"`,
          `"${v.sector || ''}"`,
          v.payment_status || 'pending',
          v.amount_paid || 0,
          v.payment_reference || '',
          v.created_at ? new Date(v.created_at).toLocaleDateString() : ''
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `vendors_export_full_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Export completed!', { id: 'export-toast' });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data', { id: 'export-toast' });
    }
  };

  // Fetch Dashboard Data
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const results = await Promise.allSettled([
          apiRequest(`/vendors?page=${vendorPage}&limit=${vendorLimit}`),
          apiRequest('/blog/all'),
          apiRequest('/events/admin'),
          apiRequest('/highlights'),
          apiRequest('/contact')
        ]);

        const getValue = (result, defaultValue = []) =>
          result.status === 'fulfilled' ? (result.value || defaultValue) : defaultValue;

        const vendorsData = results[0].status === 'fulfilled' ? results[0].value : { vendors: [], pagination: { total: 0, totalPages: 1 } };
        const blogsData = getValue(results[1]);
        const eventsData = getValue(results[2]);
        const highlightsData = getValue(results[3]);
        const messagesData = getValue(results[4]);

        setVendors(vendorsData.vendors || []);
        if (vendorsData.pagination) {
          setVendorTotalPages(vendorsData.pagination.totalPages);
        }

        setBlogs(Array.isArray(blogsData) ? blogsData : []);
        setEvents(Array.isArray(eventsData) ? eventsData : []);
        setHighlights(Array.isArray(highlightsData) ? highlightsData : []);
        setMessages(Array.isArray(messagesData) ? messagesData : []);

        setStats({
          vendors: vendorsData.pagination?.total || (vendorsData.vendors ? vendorsData.vendors.length : 0),
          blogs: Array.isArray(blogsData) ? blogsData.length : 0,
          events: Array.isArray(eventsData) ? eventsData.length : 0,
          highlights: Array.isArray(highlightsData) ? highlightsData.length : 0,
          messages: Array.isArray(messagesData) ? messagesData.length : 0
        });

        const failures = results.map((r, i) => r.status === 'rejected' ? ['Vendors', 'Blogs', 'Events', 'Highlights', 'Messages'][i] : null).filter(Boolean);
        if (failures.length > 0) {
          toast.error(`Some data failed to load: ${failures.join(', ')}`, { icon: '⚠️' });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, vendorPage]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  const openVendorModal = (vendor) => {
    setCurrentVendor(vendor);
    setShowVendorModal(true);
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
    const endpoint = currentEvent ? `/events/${currentEvent.id}` : `/events`;

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
    const endpoint = currentBlog ? `/blog/${currentBlog.id}` : `/blog`;

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
    const endpoint = currentHighlight ? `/highlights/${currentHighlight.id}` : `/highlights`;

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
    if (!window.confirm('Are you sure you want to delete this item?')) return;

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
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error deleting item');
    }
  };

  // ==========================================
  // RENDER: VENDORS TAB
  // ==========================================
  const renderVendors = () => {
    const approvedCount = vendors.filter(v => v.is_approved || v.approval_status === 'approved' || v.payment_status === 'paid').length;
    const pendingReviewCount = vendors.filter(v => !v.is_approved && v.approval_status !== 'rejected' && v.payment_status !== 'paid').length;
    const rejectedCount = vendors.filter(v => v.approval_status === 'rejected').length;
    const paidCount = vendors.filter(v => v.payment_status === 'paid').length;

    return (
      <div className="bg-white border border-deep-black shadow-sm overflow-hidden space-y-4">
        {/* Header & Quick Action */}
        <div className="p-6 border-b border-gray-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gray-50">
          <div>
            <h3 className="text-xl font-heading font-bold uppercase text-deep-black">Registered Vendors</h3>
            <p className="text-xs text-gray-500 mt-1">Review applications, approve or reject waitlist vendors, and send payment links.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="text-xs bg-deep-black text-white px-4 py-2.5 hover:bg-gold hover:text-deep-black transition-colors font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* Filter Controls Toolbar */}
        <div className="p-6 space-y-4">
          {/* Search and Status Pills */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            {/* Search Input */}
            <div className="relative flex-grow max-w-md">
              <input
                type="text"
                placeholder="Search business, name, email, ref, sector..."
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-deep-black text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              {vendorSearch && (
                <button onClick={() => setVendorSearch('')} className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-deep-black">✕</button>
              )}
            </div>

            {/* Quick Status Pill Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => { setVendorApprovalFilter('all'); setVendorStatusFilter('all'); }}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors ${vendorApprovalFilter === 'all' && vendorStatusFilter === 'all' ? 'bg-deep-black text-white border-deep-black' : 'bg-white text-gray-600 border-gray-300 hover:border-deep-black'}`}
              >
                All ({vendors.length})
              </button>
              <button
                onClick={() => { setVendorApprovalFilter('approved'); setVendorStatusFilter('all'); }}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors ${vendorApprovalFilter === 'approved' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-600'}`}
              >
                Approved ({approvedCount})
              </button>
              <button
                onClick={() => { setVendorApprovalFilter('pending'); setVendorStatusFilter('all'); }}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors ${vendorApprovalFilter === 'pending' ? 'bg-amber-600 text-white border-amber-600' : 'bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-600'}`}
              >
                Pending Review ({pendingReviewCount})
              </button>
              <button
                onClick={() => { setVendorApprovalFilter('rejected'); setVendorStatusFilter('all'); }}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors ${vendorApprovalFilter === 'rejected' ? 'bg-rose-700 text-white border-rose-700' : 'bg-rose-50 text-rose-800 border-rose-200 hover:border-rose-600'}`}
              >
                Rejected ({rejectedCount})
              </button>
              <button
                onClick={() => { setVendorStatusFilter('paid'); setVendorApprovalFilter('all'); }}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors ${vendorStatusFilter === 'paid' ? 'bg-green-700 text-white border-green-700' : 'bg-green-50 text-green-800 border-green-200 hover:border-green-600'}`}
              >
                Paid ({paidCount})
              </button>
            </div>
          </div>

          {/* Secondary Dropdown Filters */}
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-3 pt-2 border-t border-gray-100 items-center">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Approval</label>
              <select
                value={vendorApprovalFilter}
                onChange={(e) => setVendorApprovalFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 bg-white text-xs font-medium focus:outline-none focus:border-gold"
              >
                <option value="all">All Approvals</option>
                <option value="approved">Approved Only</option>
                <option value="pending">Pending Review</option>
                <option value="rejected">Rejected Only</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Payment</label>
              <select
                value={vendorStatusFilter}
                onChange={(e) => setVendorStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 bg-white text-xs font-medium focus:outline-none focus:border-gold"
              >
                <option value="all">All Payment</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Location</label>
              <select
                value={vendorLocationFilter}
                onChange={(e) => setVendorLocationFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 bg-white text-xs font-medium focus:outline-none focus:border-gold"
              >
                <option value="all">All Locations</option>
                {uniqueVendorLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Booth Type</label>
              <select
                value={vendorBoothFilter}
                onChange={(e) => setVendorBoothFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 bg-white text-xs font-medium focus:outline-none focus:border-gold"
              >
                <option value="all">All Booths</option>
                {uniqueVendorBooths.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Sort By</label>
              <select
                value={vendorSort}
                onChange={(e) => setVendorSort(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 bg-white text-xs font-medium focus:outline-none focus:border-gold"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount_desc">Amount (High to Low)</option>
                <option value="amount_asc">Amount (Low to High)</option>
                <option value="name_asc">Business Name (A-Z)</option>
              </select>
            </div>

            {isVendorFilterActive && (
              <div className="flex items-end h-full pt-4 md:pt-0">
                <button
                  onClick={resetVendorFilters}
                  className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-deep-black text-xs font-bold uppercase tracking-wider border border-gray-300 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>

          {/* Results Summary Bar */}
          <div className="flex justify-between items-center text-xs text-gray-500 pt-2">
            <span>
              Showing <strong className="text-deep-black">{filteredVendors.length}</strong> of <strong>{vendors.length}</strong> vendors
              {isVendorFilterActive && ' (Filtered)'}
            </span>
          </div>
        </div>

        {/* Vendors Table */}
        <div className="overflow-x-auto border-t border-gray-200">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-bold border-b border-gray-200">
                <th className="p-4">Vendor</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Booth & Location</th>
                <th className="p-4">Approval Status</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-400">
                    <p className="text-base font-medium text-gray-500">No vendors match the current filter criteria.</p>
                    {isVendorFilterActive && (
                      <button
                        onClick={resetVendorFilters}
                        className="mt-3 text-xs font-bold uppercase text-gold hover:underline"
                      >
                        Clear all filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => {
                  const isApproved = vendor.is_approved || vendor.approval_status === 'approved' || vendor.payment_status === 'paid';
                  const isRejected = vendor.approval_status === 'rejected';

                  return (
                    <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-deep-black">{vendor.business_name}</div>
                        <div className="text-gray-500 text-xs">{vendor.full_name}</div>
                        <div className="text-gray-400 text-xs italic">{vendor.sector}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-gray-600">{vendor.email}</div>
                        <div className="text-gray-500 text-xs">{vendor.phone_number}</div>
                        <div className="text-blue-500 text-xs">{vendor.instagram_handle}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-deep-black">{vendor.booth_type}</div>
                        <div className="text-gray-500 text-xs">{vendor.selected_location}</div>
                      </td>
                      <td className="p-4">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                            <span>✓</span> Approved
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800">
                            <span>✕</span> Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                            <span>⏳</span> Pending Review
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                          ${vendor.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {vendor.payment_status || 'Pending'}
                        </span>
                        {vendor.payment_status === 'paid' && (
                          <div className="text-xs text-gray-500 mt-1 font-mono font-bold">{vendor.amount_paid ? `₦${Number(vendor.amount_paid).toLocaleString()}` : ''}</div>
                        )}
                        {vendor.payment_status !== 'paid' && vendor.payment_link_sent_at && (
                          <div className="text-[10px] text-blue-700 font-bold mt-1">✓ Link Sent</div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {!isApproved && !isRejected && (
                            <>
                              <button
                                onClick={() => handleUpdateVendorStatus(vendor.id, 'approved')}
                                disabled={updatingStatusId === vendor.id}
                                className="text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 transition-colors disabled:opacity-50"
                                title="Approve this vendor"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateVendorStatus(vendor.id, 'rejected')}
                                disabled={updatingStatusId === vendor.id}
                                className="text-xs font-bold uppercase tracking-wider bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-300 px-2.5 py-1.5 transition-colors disabled:opacity-50"
                                title="Reject this vendor"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {isApproved && vendor.payment_status !== 'paid' && (
                            <button
                              onClick={() => handleSendEmailLink(vendor)}
                              disabled={sendingEmailId === vendor.id}
                              className="text-xs font-bold uppercase tracking-wider bg-gold text-deep-black hover:bg-black hover:text-white px-2.5 py-1.5 transition-colors disabled:opacity-50"
                              title="Send payment link email"
                            >
                              {sendingEmailId === vendor.id ? 'Sending...' : 'Send Link'}
                            </button>
                          )}
                          {isRejected && (
                            <button
                              onClick={() => handleUpdateVendorStatus(vendor.id, 'approved')}
                              disabled={updatingStatusId === vendor.id}
                              className="text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 transition-colors disabled:opacity-50"
                              title="Re-approve this vendor"
                            >
                              Re-Approve
                            </button>
                          )}
                          <button
                            onClick={() => openVendorModal(vendor)}
                            className="text-xs font-bold uppercase tracking-wider border border-gray-300 hover:border-deep-black hover:bg-deep-black hover:text-white px-2.5 py-1.5 transition-colors"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {vendorTotalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <p className="text-xs text-gray-500">
              Page <span className="font-bold">{vendorPage}</span> of <span className="font-bold">{vendorTotalPages}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setVendorPage(prev => Math.max(1, prev - 1))}
                disabled={vendorPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-xs font-bold uppercase transition-colors hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setVendorPage(prev => Math.min(vendorTotalPages, prev + 1))}
                disabled={vendorPage === vendorTotalPages}
                className="px-3 py-1 border border-gray-300 rounded text-xs font-bold uppercase transition-colors hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==========================================
  // RENDER: REGISTRATIONS TAB (Full Filter Support)
  // ==========================================
  const renderRegistrations = () => {
    const totalFilteredAmount = filteredRegistrations
      .filter(v => v.payment_status === 'paid')
      .reduce((sum, v) => sum + (Number(v.amount_paid) || 0), 0);

    const approvedCount = filteredRegistrations.filter(v => v.is_approved || v.approval_status === 'approved' || v.payment_status === 'paid').length;
    const pendingReviewCount = filteredRegistrations.filter(v => !v.is_approved && v.approval_status !== 'rejected' && v.payment_status !== 'paid').length;
    const rejectedCount = filteredRegistrations.filter(v => v.approval_status === 'rejected').length;
    const paidCount = filteredRegistrations.filter(v => v.payment_status === 'paid').length;

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-heading font-bold uppercase">Registrations</h2>
            <p className="text-xs text-gray-500 mt-1">Review incoming vendor sign-ups, approve/reject waitlist applicants, and send payment links.</p>
          </div>
        </div>

        {/* Quick Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white border border-deep-black p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Total Applicants</p>
            <p className="text-2xl font-bold">{filteredRegistrations.length}</p>
          </div>
          <div className="bg-white border border-deep-black p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Approved</p>
            <p className="text-2xl font-bold text-emerald-700">{approvedCount}</p>
          </div>
          <div className="bg-white border border-deep-black p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Pending Review</p>
            <p className="text-2xl font-bold text-amber-600">{pendingReviewCount}</p>
          </div>
          <div className="bg-white border border-deep-black p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Rejected</p>
            <p className="text-2xl font-bold text-rose-700">{rejectedCount}</p>
          </div>
          <div className="bg-white border border-deep-black p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Revenue (Paid)</p>
            <p className="text-2xl font-bold font-mono text-green-700">₦{totalFilteredAmount.toLocaleString()}</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white border border-deep-black p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2 relative">
              <input
                type="text"
                placeholder="Search business, contact, email, phone, reference..."
                value={regSearch}
                onChange={(e) => setRegSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-deep-black text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              {regSearch && (
                <button onClick={() => setRegSearch('')} className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-deep-black">✕</button>
              )}
            </div>

            <div>
              <select
                value={regApprovalFilter}
                onChange={(e) => setRegApprovalFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-deep-black bg-white text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-gold"
              >
                <option value="all">All Approvals</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending Review</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <select
                value={regStatusFilter}
                onChange={(e) => setRegStatusFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-deep-black bg-white text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-gold"
              >
                <option value="all">All Payment Statuses</option>
                <option value="paid">Paid Only</option>
                <option value="pending">Pending Only</option>
              </select>
            </div>

            <div>
              <select
                value={regSort}
                onChange={(e) => setRegSort(e.target.value)}
                className="w-full px-3 py-2.5 border border-deep-black bg-white text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-gold"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount_desc">Highest Amount</option>
                <option value="name_asc">Business Name A-Z</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-gray-100 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-gray-500 font-bold uppercase text-[10px]">Filter by Location:</span>
              <select
                value={regLocationFilter}
                onChange={(e) => setRegLocationFilter(e.target.value)}
                className="px-2 py-1 border border-gray-300 bg-white text-xs"
              >
                <option value="all">All Locations</option>
                {uniqueVendorLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>

              <span className="text-gray-500 font-bold uppercase text-[10px] ml-2">Booth:</span>
              <select
                value={regBoothFilter}
                onChange={(e) => setRegBoothFilter(e.target.value)}
                className="px-2 py-1 border border-gray-300 bg-white text-xs"
              >
                <option value="all">All Booths</option>
                {uniqueVendorBooths.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {isRegFilterActive && (
              <button
                onClick={resetRegFilters}
                className="text-xs font-bold uppercase text-red-600 hover:underline"
              >
                Clear Filters (Showing {filteredRegistrations.length} of {vendors.length})
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-deep-black overflow-x-auto shadow-sm">
          <table className="w-full text-left min-w-[850px]">
            <thead>
              <tr className="border-b border-deep-black bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-600">
                <th className="p-4">Business</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Booth & Location</th>
                <th className="p-4">Approval Status</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {filteredRegistrations.length > 0 ? (
                filteredRegistrations.map(vendor => {
                  const isApproved = vendor.is_approved || vendor.approval_status === 'approved' || vendor.payment_status === 'paid';
                  const isRejected = vendor.approval_status === 'rejected';

                  return (
                    <tr key={vendor.id} className="group hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-deep-black">{vendor.business_name}</div>
                        <div className="text-xs text-gray-500">{vendor.full_name}</div>
                        <div className="text-xs text-gray-400 italic">{vendor.sector}</div>
                      </td>
                      <td className="p-4 text-sm">
                        <div>{vendor.email}</div>
                        <div className="text-xs text-gray-500">{vendor.phone_number}</div>
                      </td>
                      <td className="p-4 text-sm">
                        <div className="font-bold text-deep-black">{vendor.booth_type || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{vendor.selected_location || 'N/A'}</div>
                      </td>
                      <td className="p-4">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                            <span>✓</span> Approved
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800">
                            <span>✕</span> Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                            <span>⏳</span> Pending Review
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          vendor.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {vendor.payment_status || 'Pending'}
                        </span>
                        {vendor.amount_paid > 0 && (
                          <div className="text-xs mt-1 font-mono text-gray-600">₦{Number(vendor.amount_paid).toLocaleString()}</div>
                        )}
                        {vendor.payment_status !== 'paid' && vendor.payment_link_sent_at && (
                          <div className="text-[10px] text-blue-700 font-bold mt-1 flex items-center gap-1">
                            <span>✓ Link Sent</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {!isApproved && !isRejected && (
                            <>
                              <button
                                onClick={() => handleUpdateVendorStatus(vendor.id, 'approved')}
                                disabled={updatingStatusId === vendor.id}
                                className="text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 transition-colors disabled:opacity-50"
                                title="Approve application"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateVendorStatus(vendor.id, 'rejected')}
                                disabled={updatingStatusId === vendor.id}
                                className="text-xs font-bold uppercase tracking-wider bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-300 px-2.5 py-1.5 transition-colors disabled:opacity-50"
                                title="Reject application"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {isApproved && vendor.payment_status !== 'paid' && (
                            <button
                              onClick={() => handleSendEmailLink(vendor)}
                              disabled={sendingEmailId === vendor.id}
                              className="text-xs font-bold uppercase tracking-wider bg-gold text-deep-black hover:bg-black hover:text-white px-2.5 py-1.5 transition-colors disabled:opacity-50 flex items-center gap-1 shadow-sm"
                              title="Send payment link email to vendor"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                              {sendingEmailId === vendor.id ? 'Sending...' : 'Send Link'}
                            </button>
                          )}
                          {isRejected && (
                            <button
                              onClick={() => handleUpdateVendorStatus(vendor.id, 'approved')}
                              disabled={updatingStatusId === vendor.id}
                              className="text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 transition-colors disabled:opacity-50"
                              title="Re-approve vendor"
                            >
                              Re-Approve
                            </button>
                          )}
                          <button
                            onClick={() => openVendorModal(vendor)}
                            className="text-xs font-bold uppercase tracking-wider text-gray-700 hover:text-deep-black border border-gray-300 px-2.5 py-1.5 bg-white hover:bg-gray-100 transition-colors"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-500 italic">
                    <p className="text-base font-medium">No registrations match your search and filter criteria.</p>
                    {isRegFilterActive && (
                      <button onClick={resetRegFilters} className="mt-2 text-xs font-bold uppercase text-gold hover:underline">
                        Reset Filters
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {vendorTotalPages > 1 && (
            <div className="p-4 border-t border-deep-black flex items-center justify-between bg-gray-50">
              <p className="text-xs font-bold uppercase tracking-widest">
                Page <span className="text-gold">{vendorPage}</span> / {vendorTotalPages}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setVendorPage(prev => Math.max(1, prev - 1))}
                  disabled={vendorPage === 1}
                  className="px-4 py-1.5 border border-deep-black text-xs font-bold uppercase tracking-widest transition-all hover:bg-deep-black hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-deep-black"
                >
                  Prev
                </button>
                <button
                  onClick={() => setVendorPage(prev => Math.min(vendorTotalPages, prev + 1))}
                  disabled={vendorPage === vendorTotalPages}
                  className="px-4 py-1.5 border border-deep-black text-xs font-bold uppercase tracking-widest transition-all hover:bg-deep-black hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-deep-black"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==========================================
  // RENDER: EVENTS TAB
  // ==========================================
  const renderEvents = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-heading font-bold uppercase">Manage Events</h2>
          <p className="text-xs text-gray-500 mt-1">Schedule fairs, set the active countdown event, and manage registrations.</p>
        </div>
        <button
          onClick={() => openEventModal()}
          className="bg-deep-black text-white px-6 py-3 text-sm font-bold uppercase tracking-wider hover:bg-gold hover:text-deep-black transition-colors flex items-center gap-2 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add New Event
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-deep-black p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search events, locations..."
              value={eventSearch}
              onChange={(e) => setEventSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 text-xs focus:outline-none focus:border-gold"
            />
            <svg className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>

          <div>
            <select
              value={eventStatusFilter}
              onChange={(e) => setEventStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 bg-white text-xs focus:outline-none focus:border-gold"
            >
              <option value="all">All Dates / Status</option>
              <option value="upcoming">Upcoming Events</option>
              <option value="past">Past Events</option>
              <option value="featured">Featured Next Event</option>
            </select>
          </div>

          <div>
            <select
              value={eventRegFilter}
              onChange={(e) => setEventRegFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 bg-white text-xs focus:outline-none focus:border-gold"
            >
              <option value="all">All Registration Status</option>
              <option value="open">Registration Open</option>
              <option value="closed">Registration Closed</option>
            </select>
          </div>

          <div>
            <select
              value={eventSort}
              onChange={(e) => setEventSort(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 bg-white text-xs focus:outline-none focus:border-gold"
            >
              <option value="date_desc">Start Date (Latest First)</option>
              <option value="date_asc">Start Date (Earliest First)</option>
              <option value="title_asc">Title (A-Z)</option>
            </select>
          </div>
        </div>

        {isEventFilterActive && (
          <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-xs text-gray-500">
            <span>Showing <strong>{filteredEvents.length}</strong> of <strong>{events.length}</strong> events</span>
            <button onClick={resetEventFilters} className="text-red-600 font-bold uppercase text-[10px] hover:underline">
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Events Table */}
      <div className="bg-white border border-deep-black p-6 overflow-x-auto shadow-sm">
        <table className="w-full text-left min-w-[650px]">
          <thead>
            <tr className="border-b border-deep-black text-xs uppercase tracking-wider font-bold text-gray-600">
              <th className="pb-4">Event</th>
              <th className="pb-4">Location</th>
              <th className="pb-4">Date</th>
              <th className="pb-4">Status</th>
              <th className="pb-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {filteredEvents.length > 0 ? (
              filteredEvents.map(event => (
                <tr key={event.id} className="group hover:bg-gray-50">
                  <td className="py-4 font-medium">
                    <div className="font-bold text-deep-black">{event.title}</div>
                    {event.is_featured && (
                      <span className="mt-1 inline-block bg-gold text-deep-black text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                        Next Event Countdown
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-gray-600 text-xs">{event.location}</td>
                  <td className="py-4 text-gray-600 text-xs">
                    {event.start_date ? new Date(event.start_date).toLocaleDateString() : 'TBD'}
                  </td>
                  <td className="py-4">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                      event.is_registration_open ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {event.is_registration_open ? 'Reg Open' : 'Reg Closed'}
                    </span>
                  </td>
                  <td className="py-4">
                    <button onClick={() => openEventModal(event)} className="text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-deep-black mr-4">Edit</button>
                    <button onClick={() => handleDelete('events', event.id)} className="text-xs font-bold uppercase tracking-wider text-red-500 hover:text-red-700">Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-12 text-center text-gray-500 italic">
                  No events match the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ==========================================
  // RENDER: BLOG POSTS TAB
  // ==========================================
  const renderBlogs = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-heading font-bold uppercase">Manage Blog Posts</h2>
          <p className="text-xs text-gray-500 mt-1">Publish editorial articles, exhibitor features, and announcements.</p>
        </div>
        <button
          onClick={() => openBlogModal()}
          className="bg-deep-black text-white px-6 py-3 text-sm font-bold uppercase tracking-wider hover:bg-gold hover:text-deep-black transition-colors flex items-center gap-2 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add New Post
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-deep-black p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search post titles, content..."
              value={blogSearch}
              onChange={(e) => setBlogSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 text-xs focus:outline-none focus:border-gold"
            />
            <svg className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>

          <div>
            <select
              value={blogCategoryFilter}
              onChange={(e) => setBlogCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 bg-white text-xs focus:outline-none focus:border-gold"
            >
              <option value="all">All Categories</option>
              {uniqueBlogCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={blogStatusFilter}
              onChange={(e) => setBlogStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 bg-white text-xs focus:outline-none focus:border-gold"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          </div>

          <div>
            <select
              value={blogSort}
              onChange={(e) => setBlogSort(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 bg-white text-xs focus:outline-none focus:border-gold"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title_asc">Title (A-Z)</option>
            </select>
          </div>
        </div>

        {isBlogFilterActive && (
          <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-xs text-gray-500">
            <span>Showing <strong>{filteredBlogs.length}</strong> of <strong>{blogs.length}</strong> posts</span>
            <button onClick={resetBlogFilters} className="text-red-600 font-bold uppercase text-[10px] hover:underline">
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Blog Table */}
      <div className="bg-white border border-deep-black p-6 overflow-x-auto shadow-sm">
        <table className="w-full text-left min-w-[650px]">
          <thead>
            <tr className="border-b border-deep-black text-xs uppercase tracking-wider font-bold text-gray-600">
              <th className="pb-4">Title</th>
              <th className="pb-4">Date</th>
              <th className="pb-4">Category</th>
              <th className="pb-4">Status</th>
              <th className="pb-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {filteredBlogs.length > 0 ? (
              filteredBlogs.map(post => (
                <tr key={post.id} className="group hover:bg-gray-50">
                  <td className="py-4 font-medium">
                    <div className="font-bold text-deep-black">{post.title}</div>
                    <div className="text-xs text-gray-400 font-mono">/{post.slug}</div>
                  </td>
                  <td className="py-4 text-gray-600 text-xs">
                    {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Draft'}
                  </td>
                  <td className="py-4">
                    <span className="bg-gray-100 text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
                      {post.category || 'General'}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      post.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {post.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="py-4">
                    <button onClick={() => openBlogModal(post)} className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-deep-black mr-4">Edit</button>
                    <button onClick={() => handleDelete('blog', post.id)} className="text-xs font-bold uppercase tracking-wider text-red-500 hover:text-red-700">Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-12 text-center text-gray-500 italic">
                  No blog posts match your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ==========================================
  // RENDER: HIGHLIGHTS TAB
  // ==========================================
  const renderHighlights = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-heading font-bold uppercase">Manage Highlights</h2>
          <p className="text-xs text-gray-500 mt-1">Curate gallery highlights, exhibition features, and badge overlays.</p>
        </div>
        <button
          onClick={() => openHighlightModal()}
          className="bg-deep-black text-white px-6 py-3 text-sm font-bold uppercase tracking-wider hover:bg-gold hover:text-deep-black transition-colors flex items-center gap-2 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add New Highlight
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-deep-black p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search highlights, badges..."
              value={highlightSearch}
              onChange={(e) => setHighlightSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 text-xs focus:outline-none focus:border-gold"
            />
            <svg className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>

          <div>
            <select
              value={highlightBadgeFilter}
              onChange={(e) => setHighlightBadgeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 bg-white text-xs focus:outline-none focus:border-gold"
            >
              <option value="all">All Badges</option>
              {uniqueHighlightBadges.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={highlightSort}
              onChange={(e) => setHighlightSort(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 bg-white text-xs focus:outline-none focus:border-gold"
            >
              <option value="order_asc">Display Order (1 to 10)</option>
              <option value="order_desc">Display Order (Highest First)</option>
              <option value="title_asc">Title (A-Z)</option>
            </select>
          </div>
        </div>

        {isHighlightFilterActive && (
          <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-xs text-gray-500">
            <span>Showing <strong>{filteredHighlights.length}</strong> of <strong>{highlights.length}</strong> highlights</span>
            <button onClick={resetHighlightFilters} className="text-red-600 font-bold uppercase text-[10px] hover:underline">
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Highlights Table */}
      <div className="bg-white border border-deep-black p-6 overflow-x-auto shadow-sm">
        <table className="w-full text-left min-w-[600px]">
          <thead>
            <tr className="border-b border-deep-black text-xs uppercase tracking-wider font-bold text-gray-600">
              <th className="pb-4">Title</th>
              <th className="pb-4">Badge</th>
              <th className="pb-4">Order</th>
              <th className="pb-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {filteredHighlights.length > 0 ? (
              filteredHighlights.map(highlight => (
                <tr key={highlight.id} className="group hover:bg-gray-50">
                  <td className="py-4 font-medium">
                    <div className="font-bold text-deep-black">{highlight.title}</div>
                    <div className="text-xs text-gray-500 line-clamp-1">{highlight.description}</div>
                  </td>
                  <td className="py-4">
                    {highlight.badge ? (
                      <span className="bg-gold text-deep-black text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
                        {highlight.badge}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-4 font-mono font-medium">{highlight.display_order}</td>
                  <td className="py-4">
                    <button onClick={() => openHighlightModal(highlight)} className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-deep-black mr-4">Edit</button>
                    <button onClick={() => handleDelete('highlights', highlight.id)} className="text-xs font-bold uppercase tracking-wider text-red-500 hover:text-red-700">Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="py-12 text-center text-gray-500 italic">
                  No highlights found matching filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ==========================================
  // RENDER: MESSAGES / CONTACT TAB
  // ==========================================
  const renderMessages = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-heading font-bold uppercase">Messages & Inquiries</h2>
          <p className="text-xs text-gray-500 mt-1">Review contact form submissions and partnership requests.</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-deep-black p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search sender name, email, message..."
              value={messageSearch}
              onChange={(e) => setMessageSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 text-xs focus:outline-none focus:border-gold"
            />
            <svg className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>

          <div>
            <select
              value={messageTypeFilter}
              onChange={(e) => setMessageTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 bg-white text-xs focus:outline-none focus:border-gold"
            >
              <option value="all">All Inquiry Types</option>
              {uniqueMessageTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={messageSort}
              onChange={(e) => setMessageSort(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 bg-white text-xs focus:outline-none focus:border-gold"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {isMessageFilterActive && (
          <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-xs text-gray-500">
            <span>Showing <strong>{filteredMessages.length}</strong> of <strong>{messages.length}</strong> inquiries</span>
            <button onClick={resetMessageFilters} className="text-red-600 font-bold uppercase text-[10px] hover:underline">
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Messages Table */}
      <div className="bg-white border border-deep-black p-6 overflow-x-auto shadow-sm">
        <table className="w-full text-left min-w-[700px]">
          <thead>
            <tr className="border-b border-deep-black text-xs uppercase tracking-wider font-bold text-gray-600">
              <th className="pb-4">Date</th>
              <th className="pb-4">Sender</th>
              <th className="pb-4">Email</th>
              <th className="pb-4">Inquiry Type</th>
              <th className="pb-4">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {filteredMessages.length > 0 ? (
              filteredMessages.map(msg => (
                <tr key={msg.id} className="group hover:bg-gray-50">
                  <td className="py-4 text-gray-600 text-xs whitespace-nowrap">
                    {msg.created_at ? new Date(msg.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-4 font-bold text-deep-black">{msg.name}</td>
                  <td className="py-4 text-sm text-gray-700">{msg.email}</td>
                  <td className="py-4">
                    <span className="bg-gray-100 text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
                      {msg.inquiry_type || 'General'}
                    </span>
                  </td>
                  <td className="py-4 text-xs text-gray-600 max-w-sm">
                    <p className="line-clamp-2">{msg.message}</p>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-12 text-center text-gray-500 italic">
                  No messages found matching criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ==========================================
  // TAB ROUTER
  // ==========================================
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-deep-black"></div>
          <p className="text-sm font-bold uppercase tracking-wider text-gray-500">Loading dashboard data...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': {
        const approvedVendorsCount = vendors.filter(v => v.is_approved || v.approval_status === 'approved' || v.payment_status === 'paid').length;
        const pendingVendorsCount = vendors.filter(v => !v.is_approved && v.approval_status !== 'rejected' && v.payment_status !== 'paid').length;
        const totalRevenue = vendors.filter(v => v.payment_status === 'paid').reduce((sum, v) => sum + (Number(v.amount_paid) || 0), 0);

        return (
          <div className="space-y-8">
            <h2 className="text-3xl font-heading font-bold uppercase">Dashboard Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div
                onClick={() => { setVendorApprovalFilter('all'); setActiveTab('vendors'); }}
                className="bg-white border border-deep-black p-6 hover:border-gold hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-xs font-heading font-bold uppercase text-gray-500 tracking-wider">Total Vendors</h3>
                  <span className="text-xs text-gold font-bold group-hover:translate-x-1 transition-transform">→</span>
                </div>
                <p className="text-4xl font-bold mt-3 text-deep-black">{stats.vendors}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-2">All registered</p>
              </div>

              <div
                onClick={() => { setVendorApprovalFilter('approved'); setActiveTab('vendors'); }}
                className="bg-white border border-emerald-600 p-6 hover:border-gold hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-xs font-heading font-bold uppercase text-emerald-700 tracking-wider">Approved Vendors</h3>
                  <span className="text-xs text-emerald-600 font-bold group-hover:translate-x-1 transition-transform">→</span>
                </div>
                <p className="text-4xl font-bold mt-3 text-emerald-700">{approvedVendorsCount}</p>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-2">Ready / Confirmed</p>
              </div>

              <div
                onClick={() => { setVendorApprovalFilter('pending'); setActiveTab('vendors'); }}
                className="bg-white border border-amber-500 p-6 hover:border-gold hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-xs font-heading font-bold uppercase text-amber-700 tracking-wider">Pending Review</h3>
                  <span className="text-xs text-amber-600 font-bold group-hover:translate-x-1 transition-transform">→</span>
                </div>
                <p className="text-4xl font-bold mt-3 text-amber-600">{pendingVendorsCount}</p>
                <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mt-2">Waitlist applicants</p>
              </div>

              <div
                onClick={() => { setVendorStatusFilter('paid'); setActiveTab('vendors'); }}
                className="bg-white border border-deep-black p-6 hover:border-gold hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-xs font-heading font-bold uppercase text-gray-500 tracking-wider">Total Revenue</h3>
                  <span className="text-xs text-gold font-bold group-hover:translate-x-1 transition-transform">→</span>
                </div>
                <p className="text-3xl font-bold mt-3 font-mono text-green-700">₦{totalRevenue.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-2">Verified payments</p>
              </div>
            </div>

            {/* Quick Vendors Table in Overview */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-heading font-bold uppercase text-deep-black">Recent Vendor Applications</h3>
                <button
                  onClick={() => setActiveTab('vendors')}
                  className="text-xs font-bold uppercase tracking-wider text-gold hover:text-deep-black"
                >
                  View All With Filters →
                </button>
              </div>
              {renderVendors()}
            </div>
          </div>
        );
      }

      case 'vendors':
        return renderVendors();

      case 'register':
        return renderRegistrations();

      case 'events':
        return renderEvents();

      case 'blog':
        return renderBlogs();

      case 'highlights':
        return renderHighlights();

      case 'messages':
        return renderMessages();

      default:
        return (
          <div className="bg-white border border-deep-black p-8 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-heading font-bold uppercase mb-6">Overview</h2>
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
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-3xl font-heading font-bold tracking-tighter uppercase">
              Admin Dashboard
            </h1>
            <span className="hidden sm:inline-block bg-gold text-deep-black text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
              Control Panel
            </span>
          </div>
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
        <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-deep-black flex-shrink-0">
          <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`text-left px-6 py-4 md:py-6 text-xs md:text-sm font-bold uppercase tracking-wider border-b border-r md:border-r-0 border-gray-100 hover:bg-gray-50 transition-colors whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-deep-black text-white hover:bg-deep-black' : ''}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('vendors')}
              className={`text-left px-6 py-4 md:py-6 text-xs md:text-sm font-bold uppercase tracking-wider border-b border-r md:border-r-0 border-gray-100 hover:bg-gray-50 transition-colors whitespace-nowrap ${activeTab === 'vendors' ? 'bg-deep-black text-white hover:bg-deep-black' : ''}`}
            >
              Vendors ({vendors.length})
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`text-left px-6 py-4 md:py-6 text-xs md:text-sm font-bold uppercase tracking-wider border-b border-r md:border-r-0 border-gray-100 hover:bg-gray-50 transition-colors whitespace-nowrap ${activeTab === 'register' ? 'bg-deep-black text-white hover:bg-deep-black' : ''}`}
            >
              Registrations
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`text-left px-6 py-4 md:py-6 text-xs md:text-sm font-bold uppercase tracking-wider border-b border-r md:border-r-0 border-gray-100 hover:bg-gray-50 transition-colors whitespace-nowrap ${activeTab === 'events' ? 'bg-deep-black text-white hover:bg-deep-black' : ''}`}
            >
              Events ({events.length})
            </button>
            <button
              onClick={() => setActiveTab('blog')}
              className={`text-left px-6 py-4 md:py-6 text-xs md:text-sm font-bold uppercase tracking-wider border-b border-r md:border-r-0 border-gray-100 hover:bg-gray-50 transition-colors whitespace-nowrap ${activeTab === 'blog' ? 'bg-deep-black text-white hover:bg-deep-black' : ''}`}
            >
              Blog ({blogs.length})
            </button>
            <button
              onClick={() => setActiveTab('highlights')}
              className={`text-left px-6 py-4 md:py-6 text-xs md:text-sm font-bold uppercase tracking-wider border-b border-r md:border-r-0 border-gray-100 hover:bg-gray-50 transition-colors whitespace-nowrap ${activeTab === 'highlights' ? 'bg-deep-black text-white hover:bg-deep-black' : ''}`}
            >
              Highlights ({highlights.length})
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`text-left px-6 py-4 md:py-6 text-xs md:text-sm font-bold uppercase tracking-wider border-b border-gray-100 hover:bg-gray-50 transition-colors whitespace-nowrap ${activeTab === 'messages' ? 'bg-deep-black text-white hover:bg-deep-black' : ''}`}
            >
              Contact ({messages.length})
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow p-6 md:p-10 bg-cream max-w-full overflow-x-hidden">
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
                  onChange={e => setBlogForm({ ...blogForm, title: e.target.value })}
                  className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Slug</label>
                <input
                  type="text"
                  value={blogForm.slug}
                  onChange={e => setBlogForm({ ...blogForm, slug: e.target.value })}
                  className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Category</label>
                <input
                  type="text"
                  value={blogForm.category}
                  onChange={e => setBlogForm({ ...blogForm, category: e.target.value })}
                  className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Image URL</label>
                <input
                  type="text"
                  value={blogForm.imageUrl}
                  onChange={e => setBlogForm({ ...blogForm, imageUrl: e.target.value })}
                  className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Excerpt</label>
                <textarea
                  value={blogForm.excerpt}
                  onChange={e => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                  className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold h-20"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Content</label>
                <textarea
                  value={blogForm.content}
                  onChange={e => setBlogForm({ ...blogForm, content: e.target.value })}
                  className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold h-48"
                  required
                ></textarea>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 p-6 border border-gray-200">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={blogForm.isPublished}
                  onChange={e => setBlogForm({ ...blogForm, isPublished: e.target.checked })}
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
                  onChange={e => setHighlightForm({ ...highlightForm, title: e.target.value })}
                  className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={highlightForm.description}
                  onChange={e => setHighlightForm({ ...highlightForm, description: e.target.value })}
                  className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold h-32"
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Image URL</label>
                <input
                  type="text"
                  value={highlightForm.imageUrl}
                  onChange={e => setHighlightForm({ ...highlightForm, imageUrl: e.target.value })}
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
                    onChange={e => setHighlightForm({ ...highlightForm, badge: e.target.value })}
                    className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold"
                    placeholder="e.g. Premium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2">Display Order</label>
                  <input
                    type="number"
                    value={highlightForm.displayOrder}
                    onChange={e => setHighlightForm({ ...highlightForm, displayOrder: parseInt(e.target.value) || 0 })}
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
                  onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Location</label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={e => setEventForm({ ...eventForm, location: e.target.value })}
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
                    onChange={e => setEventForm({ ...eventForm, startDate: e.target.value })}
                    className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2">End Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={eventForm.endDate}
                    onChange={e => setEventForm({ ...eventForm, endDate: e.target.value })}
                    className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={eventForm.description}
                  onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold h-32"
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Image URL (Optional)</label>
                <input
                  type="text"
                  value={eventForm.imageUrl}
                  onChange={e => setEventForm({ ...eventForm, imageUrl: e.target.value })}
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
                    onChange={e => setEventForm({ ...eventForm, isRegistrationOpen: e.target.checked })}
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
                    onChange={e => setEventForm({ ...eventForm, isFeatured: e.target.checked })}
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

      {/* Vendor Details Modal */}
      {showVendorModal && currentVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowVendorModal(false)}>
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 border border-white/20 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowVendorModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-deep-black"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
              <h2 className="text-2xl font-heading font-bold uppercase text-deep-black">
                Vendor Application
              </h2>
              <div>
                {(currentVendor.is_approved || currentVendor.approval_status === 'approved' || currentVendor.payment_status === 'paid') ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                    <span>✓</span> Approved
                  </span>
                ) : currentVendor.approval_status === 'rejected' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800">
                    <span>✕</span> Rejected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                    <span>⏳</span> Pending Review
                  </span>
                )}
              </div>
            </div>

            {/* Approval Action Bar in Modal */}
            <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-deep-black">Review & Approval Decision</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {(currentVendor.is_approved || currentVendor.approval_status === 'approved' || currentVendor.payment_status === 'paid')
                    ? 'This vendor is approved. You can send payment links or revoke approval.'
                    : currentVendor.approval_status === 'rejected'
                    ? 'This vendor application is currently rejected.'
                    : 'This application is waiting for admin approval before payment link is sent.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!(currentVendor.is_approved || currentVendor.approval_status === 'approved' || currentVendor.payment_status === 'paid') && (
                  <button
                    onClick={() => handleUpdateVendorStatus(currentVendor.id, 'approved')}
                    disabled={updatingStatusId === currentVendor.id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase px-3 py-2 transition-colors disabled:opacity-50"
                  >
                    ✓ Approve Application
                  </button>
                )}
                {currentVendor.approval_status !== 'rejected' && currentVendor.payment_status !== 'paid' && (
                  <button
                    onClick={() => handleUpdateVendorStatus(currentVendor.id, 'rejected')}
                    disabled={updatingStatusId === currentVendor.id}
                    className="bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-300 text-xs font-bold uppercase px-3 py-2 transition-colors disabled:opacity-50"
                  >
                    ✕ Reject Application
                  </button>
                )}
                {currentVendor.approval_status === 'rejected' && (
                  <button
                    onClick={() => handleUpdateVendorStatus(currentVendor.id, 'approved')}
                    disabled={updatingStatusId === currentVendor.id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase px-3 py-2 transition-colors disabled:opacity-50"
                  >
                    ✓ Re-Approve Application
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Business Name</p>
                  <p className="font-medium text-lg text-deep-black">{currentVendor.business_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Contact Person</p>
                  <p className="font-medium text-lg text-deep-black">{currentVendor.full_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Email Address</p>
                  <p className="font-medium text-deep-black">{currentVendor.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Phone & WhatsApp</p>
                  <p className="font-medium text-deep-black">{currentVendor.phone_number || 'N/A'} {currentVendor.whatsapp_number ? ` / ${currentVendor.whatsapp_number}` : ''}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Instagram</p>
                  <p className="font-medium text-deep-black">{currentVendor.instagram_handle || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Sector</p>
                  <p className="font-medium text-deep-black">{currentVendor.sector || 'N/A'}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Selected Location</p>
                  <p className="font-medium text-deep-black">{currentVendor.selected_location || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Booth Type</p>
                  <p className="font-medium text-deep-black">{currentVendor.booth_type || 'N/A'}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Payment Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 mt-1 rounded-full text-xs font-medium capitalize
                    ${currentVendor.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {currentVendor.payment_status || 'Pending'}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Payment Link Status</p>
                  <p className="text-xs font-medium mt-1">
                    {currentVendor.payment_status === 'paid' ? (
                      <span className="text-green-700 font-bold">✓ Paid & Verified</span>
                    ) : currentVendor.payment_link_sent_at ? (
                      <span className="text-blue-700 font-bold">
                        ✓ Sent ({new Date(currentVendor.payment_link_sent_at).toLocaleDateString()})
                        {currentVendor.payment_link_sent_count > 1 ? ` [${currentVendor.payment_link_sent_count}x]` : ''}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Not sent yet</span>
                    )}
                  </p>
                </div>
                {currentVendor.payment_status === 'paid' && (
                  <div className="col-span-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Amount Paid</p>
                    <p className="font-medium font-mono text-deep-black">₦{currentVendor.amount_paid ? Number(currentVendor.amount_paid).toLocaleString() : 0}</p>
                  </div>
                )}
                {currentVendor.payment_reference && (
                  <div className="col-span-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Payment Reference</p>
                    <p className="font-medium font-mono text-gray-600 text-sm break-all">{currentVendor.payment_reference}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-6 flex flex-wrap gap-4 text-xs">
                <div className={`px-2 py-1 rounded ${currentVendor.is_previous_vendor ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                  Previous Vendor: {currentVendor.is_previous_vendor ? 'Yes' : 'No'}
                </div>
                <div className={`px-2 py-1 rounded ${currentVendor.live_in_lagos ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                  Local Resident: {currentVendor.live_in_lagos ? 'Yes' : 'No'}
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 justify-end border-t border-gray-200 pt-6">
              {currentVendor.payment_status !== 'paid' && (
                <>
                  <button
                    onClick={() => handleSendEmailLink(currentVendor)}
                    disabled={sendingEmailId === currentVendor.id}
                    className="bg-deep-black text-white px-5 py-3 text-xs font-bold uppercase tracking-wider hover:bg-gold hover:text-deep-black transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {sendingEmailId === currentVendor.id ? 'Sending Email...' : 'Send Payment Email'}
                  </button>

                  <button
                    onClick={() => {
                      const payUrl = `${window.location.origin}/complete-payment?email=${encodeURIComponent(currentVendor.email)}`;
                      navigator.clipboard.writeText(payUrl);
                      toast.success('Payment link copied to clipboard!');
                    }}
                    className="bg-gold text-deep-black px-5 py-3 text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 012-2v-8a2 2 0 01-2-2h-8a2 2 0 01-2 2v8a2 2 0 012 2z" />
                    </svg>
                    Copy Payment Link
                  </button>
                </>
              )}
              <a
                href={`mailto:${currentVendor.email}?subject=${encodeURIComponent('Wodibenuah Fair Lagos 2026 - Vendor Registration Payment Link')}&body=${encodeURIComponent(`Dear ${currentVendor.full_name || currentVendor.business_name},\n\nThank you for registering your business (${currentVendor.business_name}) for Wodibenuah Fair Lagos 2026.\n\nYour application has been reviewed and approved for your selected booth type (${currentVendor.booth_type}).\n\nPlease complete your booth payment using the secure link below:\n${window.location.origin}/complete-payment?email=${encodeURIComponent(currentVendor.email)}\n\nIf you have any questions, feel free to reply to this email.\n\nBest regards,\nWodibenuah Fair Team`)}`}
                className="bg-gray-100 text-deep-black border border-gray-300 px-5 py-3 text-xs font-bold uppercase tracking-wider hover:bg-deep-black hover:text-white transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Open Mail App
              </a>
              <button
                onClick={() => setShowVendorModal(false)}
                className="bg-deep-black text-white px-8 py-3 text-xs font-bold uppercase tracking-wider hover:bg-gold hover:text-deep-black transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
