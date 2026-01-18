import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../api';
import api from '../api';
import './Auth.css';

function Register() {
  const [step, setStep] = useState(1); // 1: Form, 2: OTP Verification
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
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return;
    }

    if (!/^[0-9]{10}$/.test(formData.phone.replace(/[\D]/g, ''))) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/send-otp', { email: formData.email });
      setSuccess('OTP sent successfully to your email!');
      setOtpSent(true);
      setStep(2);
      
      // In development, show OTP
      if (response.data.otp) {
        setSuccess(`OTP sent to ${formData.email}! (Dev: ${response.data.otp})`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await auth.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        otp: formData.otp,
        role: formData.role
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      setSuccess('Registration successful! Redirecting...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card card">
        <h1 className="text-center">Register</h1>
        <p className="text-center" style={{ color: '#718096', marginBottom: '30px' }}>
          Create your account to get started
        </p>

        {error && <div className="error">{error}</div>}
        {success && <div style={{ padding: '12px', background: '#d4edda', color: '#155724', borderRadius: '8px', marginBottom: '15px', border: '1px solid #c3e6cb' }}>{success}</div>}

        {step === 1 && (
        <form onSubmit={handleSendOTP}>
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
            <input
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              placeholder="Enter your 10-digit phone number"
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
              placeholder="Create a password"
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

          <div className="form-group">
            <label>Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="student">Student</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
        )}

        {step === 2 && (
        <form onSubmit={handleVerifyAndRegister}>
          <div className="form-group">
            <label>Enter OTP</label>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={formData.otp}
              onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              required
              maxLength="6"
              style={{ fontSize: '20px', letterSpacing: '8px', textAlign: 'center' }}
            />
            <p style={{ fontSize: '13px', color: '#718096', marginTop: '8px' }}>
              OTP sent to {formData.email}
            </p>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginBottom: '10px' }}>
            {loading ? 'Verifying...' : 'Verify & Register'}
          </button>
          
          <button 
            type="button" 
            onClick={() => { setStep(1); setOtpSent(false); setFormData({ ...formData, otp: '' }); }}
            className="btn"
            style={{ width: '100%', background: '#e2e8f0', color: '#2d3748' }}
          >
            ← Back to Form
          </button>
        </form>
        )}

        <p className="text-center mt-20">
          Already have an account? <Link to="/login" style={{ color: '#667eea', fontWeight: '600' }}>Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
