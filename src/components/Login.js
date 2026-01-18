import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../api';
import './Auth.css';

function Login() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.username || !formData.password) {
        setError('Please enter both username and password');
        setLoading(false);
        return;
      }

      const response = await auth.login(formData);
      
      if (!response.data.token) {
        setError('Login failed: No token received');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect admin to admin dashboard, others to student dashboard
      if (response.data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (response.data.user.role === 'hr') {
        navigate('/hr/dashboard');
      } else if (response.data.user.role === 'interviewer') {
        navigate('/interviewer/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Provide user-friendly error messages
      if (err.response?.status === 401) {
        setError('Invalid username or password');
      } else if (err.response?.status === 429) {
        setError('Too many login attempts. Please try again later.');
      } else if (!err.response) {
        setError('Connection error: Unable to reach the server. Is the backend running?');
      } else {
        setError(err.response?.data?.error || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card card">
        <h1 className="text-center">Login</h1>
        <p className="text-center" style={{ color: '#718096', marginBottom: '30px' }}>
          Welcome back to Assessment Portal
        </p>

        <div style={{
          backgroundColor: '#ebf4ff',
          border: '1px solid #bee3f8',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '20px',
          fontSize: '13px',
          color: '#2c5282'
        }}>
          <strong>💡 Testing Tip:</strong> To login as Admin & Student simultaneously, use different browsers (Chrome, Firefox) or open an Incognito/Private window.
        </div>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            marginBottom: '20px' 
          }}>
            <Link 
              to="/forgot-password" 
              style={{ 
                color: '#667eea', 
                fontSize: '14px', 
                textDecoration: 'none',
                fontWeight: '500'
              }}
            >
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center mt-20">
          Don't have an account? <Link to="/register" style={{ color: '#667eea', fontWeight: '600' }}>Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
