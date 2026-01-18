import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Layout from './Layout';
import './Profile.css';

function ChangePassword() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.currentPassword) {
      setError('Please enter your current password');
      return;
    }

    if (!formData.newPassword || formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      setSuccess(response.data.message || 'Password changed successfully!');
      
      // Clear form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Optional: Redirect to profile after success
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (err) {
      console.error('Change password error:', err);
      setError(err.response?.data?.error || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: '', color: '#e2e8f0' };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    const levels = [
      { strength: 0, text: '', color: '#e2e8f0' },
      { strength: 1, text: 'Weak', color: '#fc8181' },
      { strength: 2, text: 'Fair', color: '#f6ad55' },
      { strength: 3, text: 'Good', color: '#68d391' },
      { strength: 4, text: 'Strong', color: '#48bb78' },
      { strength: 5, text: 'Very Strong', color: '#38a169' }
    ];

    return levels[strength] || levels[0];
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <Layout>
      <div className="profile-container">
        <div className="profile-card card">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
            <button
              onClick={() => navigate('/profile')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '5px 10px',
                marginRight: '10px',
                color: '#667eea'
              }}
            >
              ←
            </button>
            <h1 style={{ margin: 0 }}>Change Password</h1>
          </div>

          <p style={{ color: '#718096', marginBottom: '30px' }}>
            Keep your account secure by using a strong password
          </p>

          {/* Security Tips */}
          <div style={{
            backgroundColor: '#f7fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '25px'
          }}>
            <p style={{ fontWeight: '600', marginBottom: '10px', color: '#2d3748' }}>
              🔒 Password Tips:
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#718096', fontSize: '14px' }}>
              <li>Use at least 8 characters</li>
              <li>Include uppercase and lowercase letters</li>
              <li>Add numbers and special characters</li>
              <li>Avoid common words or personal information</li>
            </ul>
          </div>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <form onSubmit={handleSubmit}>
            {/* Current Password */}
            <div className="form-group">
              <label>Current Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  placeholder="Enter your current password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  required
                  style={{ paddingRight: '50px' }}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '20px',
                    color: '#718096'
                  }}
                >
                  {showPasswords.current ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="form-group">
              <label>New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  placeholder="Enter new password (min 6 characters)"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  required
                  style={{ paddingRight: '50px' }}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '20px',
                    color: '#718096'
                  }}
                >
                  {showPasswords.new ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.newPassword && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{
                    height: '4px',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${(passwordStrength.strength / 5) * 100}%`,
                      backgroundColor: passwordStrength.color,
                      transition: 'all 0.3s ease'
                    }} />
                  </div>
                  <small style={{ color: passwordStrength.color, fontSize: '12px' }}>
                    {passwordStrength.text}
                  </small>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="form-group">
              <label>Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  style={{ paddingRight: '50px' }}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '20px',
                    color: '#718096'
                  }}
                >
                  {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                <small style={{ color: '#fc8181', fontSize: '12px' }}>
                  ❌ Passwords do not match
                </small>
              )}
              {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
                <small style={{ color: '#48bb78', fontSize: '12px' }}>
                  ✅ Passwords match
                </small>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="btn"
                style={{
                  flex: 1,
                  backgroundColor: 'white',
                  color: '#718096',
                  border: '1px solid #e2e8f0'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

export default ChangePassword;
