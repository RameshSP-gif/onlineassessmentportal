import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import './Auth.css';

function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter OTP, 3: Enter new password
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Step 1: Send reset OTP to email
  const handleSendResetCode = async (e) => {
    e.preventDefault();
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

    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email: formData.email });
      
      // Show OTP in development mode
      if (response.data.otp) {
        setSuccess(`✅ Reset code sent! Check your email (Dev code: ${response.data.otp})`);
      } else {
        setSuccess('✅ Reset code sent to your email! Please check your inbox.');
      }
      
      setStep(2);
    } catch (err) {
      console.error('Send reset code error:', err);
      setError(err.response?.data?.error || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.otp || formData.otp.length !== 6) {
      setError('Please enter the 6-digit reset code');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/verify-reset-otp', {
        email: formData.email,
        otp: formData.otp
      });

      setResetToken(response.data.resetToken);
      setSuccess('✅ Code verified! Please enter your new password.');
      setStep(3);
    } catch (err) {
      console.error('Verify OTP error:', err);
      setError(err.response?.data?.error || 'Invalid or expired reset code');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.newPassword || formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        resetToken,
        newPassword: formData.newPassword
      });

      setSuccess('✅ Password reset successful! Redirecting to login...');
      
      // Clear form
      setFormData({ email: '', otp: '', newPassword: '', confirmPassword: '' });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email: formData.email });
      
      if (response.data.otp) {
        setSuccess(`✅ New code sent! (Dev code: ${response.data.otp})`);
      } else {
        setSuccess('✅ New reset code sent to your email!');
      }
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card card">
        <h1 className="text-center">Reset Password</h1>
        <p className="text-center" style={{ color: '#718096', marginBottom: '30px' }}>
          {step === 1 && 'Enter your email to receive a reset code'}
          {step === 2 && 'Enter the 6-digit code sent to your email'}
          {step === 3 && 'Create your new password'}
        </p>

        {/* Progress Indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '30px',
          gap: '10px'
        }}>
          <div style={{
            width: '80px',
            height: '4px',
            backgroundColor: step >= 1 ? '#667eea' : '#e2e8f0',
            borderRadius: '2px'
          }} />
          <div style={{
            width: '80px',
            height: '4px',
            backgroundColor: step >= 2 ? '#667eea' : '#e2e8f0',
            borderRadius: '2px'
          }} />
          <div style={{
            width: '80px',
            height: '4px',
            backgroundColor: step >= 3 ? '#667eea' : '#e2e8f0',
            borderRadius: '2px'
          }} />
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        {/* Step 1: Enter Email */}
        {step === 1 && (
          <form onSubmit={handleSendResetCode}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Enter your registered email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                autoFocus
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
        )}

        {/* Step 2: Enter OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP}>
            <div className="form-group">
              <label>Reset Code</label>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={formData.otp}
                onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                maxLength="6"
                required
                autoFocus
                style={{
                  fontSize: '24px',
                  letterSpacing: '10px',
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}
              />
              <small style={{ color: '#718096', fontSize: '12px' }}>
                Check your email for the reset code
              </small>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ width: '100%', marginBottom: '10px' }}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <button
              type="button"
              onClick={handleResendCode}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #667eea',
                backgroundColor: 'white',
                color: '#667eea',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Resend Code
            </button>
          </form>
        )}

        {/* Step 3: Enter New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                placeholder="Enter new password (min 6 characters)"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                placeholder="Re-enter new password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <p className="text-center mt-20">
          Remember your password? <Link to="/login" style={{ color: '#667eea', fontWeight: '600' }}>Login</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
