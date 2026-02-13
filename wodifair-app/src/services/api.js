const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Helper to perform API requests with standardized error handling and auth headers.
 * Automatically appends '/api' if not present in the path (or assumes base URL points to root).
 * 
 * @param {string} endpoint - The API endpoint (e.g., '/vendors', '/auth/login').
 * @param {Object} options - Fetch options (method, body, headers).
 * @returns {Promise<any>} - The JSON response.
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  // Ensure endpoint starts with /api if not already included
  // The backend routes are defined as /api/..., so we construct the full URL carefully.
  // If the endpoint passed is '/vendors', we want 'http://localhost:5000/api/vendors'.
  
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const path = cleanEndpoint.startsWith('/api') ? cleanEndpoint : `/api${cleanEndpoint}`;
  const url = `${API_BASE_URL}${path}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    
    // Handle 401 Unauthorized (Session expired)
    if (response.status === 401) {
      localStorage.removeItem('token');
      // Optional: Redirect to login or dispatch event
      if (!window.location.pathname.includes('/admin/login')) {
         window.location.href = '/admin/login'; 
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'API Request Failed');
    }

    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

export default apiRequest;
