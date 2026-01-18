import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import './Auth.css';

function Register() {
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    otp: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async () => {
    setError('');
    setSuccess('');

    if (!formData.email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setSendingOtp(true);

    try {
      console.log('Sending OTP to:', formData.email);
      const response = await api.post('/auth/send-otp', { email: formData.email });
      console.log('OTP Response:', response.data);
      
      // Show OTP in development mode
      if (response.data.otp) {
        setSuccess(`✅ OTP sent! Check your email (Dev OTP: ${response.data.otp})`);
      } else {
        setSuccess(`✅ OTP sent successfully to ${formData.email}!`);
      }
      
      setShowOtpInput(true);
      
    } catch (err) {
      console.error('OTP Send Error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate all fields
    if (!formData.username.trim()) {
      setError('Username is required');
      setLoading(false);
      return;
    }

    if (!formData.phone.trim()) {
      setError('Phone number is required');
      setLoading(false);
      return;
    }

    if (!/^[0-9]{10}$/.test(formData.phone.replace(/[\D]/g, ''))) {
      setError('Please enter a valid 10-digit phone number');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (!formData.otp || formData.otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        otp: formData.otp,
        role: formData.role
      });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      setSuccess('✅ Registration successful! Redirecting...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Registration Error:', err);
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card card">
        <h1 className="text-center">Register</h1>
        <p className="text-center" style={{ color: '#718096', marginBottom: '30px' }}>
          Create your student account
        </p>

        {error && <div className="error">{error}</div>}
        {success && <div style={{ padding: '12px', background: '#d4edda', color: '#155724', borderRadius: '8px', marginBottom: '15px', border: '1px solid #c3e6cb' }}>{success}</div>}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Choose a username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={sendingOtp || !formData.email}
                className="btn"
                style={{ 
                  background: showOtpInput ? '#48bb78' : '#667eea',
                  color: 'white',
                  whiteSpace: 'nowrap',
                  minWidth: '120px'
                }}
              >
                {sendingOtp ? 'Sending...' : showOtpInput ? '✓ OTP Sent' : 'Send OTP'}
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#718096', marginTop: '5px' }}>
              Click "Send OTP" to receive verification code
            </p>
          </div>

          {showOtpInput && (
            <div className="form-group" style={{ background: '#f7fafc', padding: '15px', borderRadius: '8px', border: '2px solid #667eea' }}>
              <label style={{ color: '#667eea', fontWeight: 'bold' }}>Enter OTP</label>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={formData.otp}
                onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                required
                maxLength="6"
                style={{ 
                  fontSize: '24px', 
                  letterSpacing: '10px', 
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}
              />
              <p style={{ fontSize: '12px', color: '#667eea', marginTop: '8px', textAlign: 'center' }}>
                Check your email: {formData.email}
              </p>
            </div>
          )}

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              placeholder="Enter 10-digit phone number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
              required
              maxLength="10"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Create a password (min 6 characters)"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading || !showOtpInput} 
            style={{ width: '100%' }}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="text-center mt-20">
          Already have an account? <Link to="/login" style={{ color: '#667eea', fontWeight: '600' }}>Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
