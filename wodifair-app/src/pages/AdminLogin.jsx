import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiRequest } from '../services/api';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password }
      });
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Login successful');
      navigate('/admin');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border border-deep-black p-8 shadow-lg">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-heading font-bold uppercase tracking-wider">Admin Login</h2>
          <p className="text-gray-500 mt-2">Enter your credentials to access the dashboard</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-deep-black focus:outline-none focus:ring-2 focus:ring-gold"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-deep-black text-white py-4 font-bold uppercase tracking-widest hover:bg-gold hover:text-deep-black transition-colors disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
