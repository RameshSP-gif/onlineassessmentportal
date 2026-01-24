import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../api';
import Alert from './Alert';
import LoadingSpinner from './LoadingSpinner';
import './Auth.css';

function Login() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
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
      
      setSuccess('Login successful! Redirecting...');
      
      // Redirect based on role
      setTimeout(() => {
        if (response.data.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (response.data.user.role === 'hr') {
          navigate('/hr/dashboard');
        } else if (response.data.user.role === 'interviewer') {
          navigate('/interviewer/dashboard');
        } else {
          navigate('/dashboard');
        }
      }, 500);
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

  if (loading) {
    return <LoadingSpinner message="Logging in..." fullScreen />;
  }

  return (
    <div className="auth-container">
      <div className="auth-card card slide-in">
        <div className="text-center mb-20">
          <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>Welcome Back</h1>
          <p style={{ color: '#718096', fontSize: '14px' }}>
            Login to your assessment portal account
          </p>
        </div>

        {error && (
          <Alert 
            type="danger" 
            message={error} 
            onClose={() => setError('')}
            autoClose={false}
          />
        )}

        {success && (
          <Alert 
            type="success" 
            message={success} 
            onClose={() => setSuccess('')}
            autoClose={true}
          />
        )}

        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid var(--info-color)',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          fontSize: '13px',
          color: '#1a365d'
        }}>
          <strong>💡 Test Accounts:</strong> student2/student123 or hr1/hr123
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="flex-between mb-20">
            <label style={{ margin: 0 }}>
              <input type="checkbox" /> Remember me
            </label>
            <Link 
              to="/forgot-password" 
              style={{ 
                color: 'var(--primary-color)', 
                fontSize: '14px', 
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'color var(--transition-fast)'
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--primary-dark)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--primary-color)'}
            >
              Forgot Password?
            </Link>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block" 
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner spinner-sm"></span> Logging in...</>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <p className="text-center mt-20" style={{ color: '#718096', fontSize: '14px' }}>
          Don't have an account? {' '}
          <Link 
            to="/register" 
            style={{ 
              color: 'var(--primary-color)', 
              fontWeight: '600',
              textDecoration: 'none',
              transition: 'color var(--transition-fast)'
            }}
            onMouseEnter={(e) => e.target.style.color = 'var(--primary-dark)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--primary-color)'}
          >
            Register Here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
