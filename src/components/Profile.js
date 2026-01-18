import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Profile.css';

function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      console.log('Loading user profile...');
      const response = await api.get('/auth/profile');
      console.log('Profile data:', response.data);
      setUser(response.data);
      setFormData({
        email: response.data.email || '',
        phone: response.data.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError('Failed to load profile');
      console.error('Profile load error:', err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validate phone if provided
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone.replace(/[^0-9]/g, ''))) {
      setError('Please enter a valid 10-digit phone number');
      setLoading(false);
      return;
    }

    // Validate password if changing
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        setError('Please enter your current password');
        setLoading(false);
        return;
      }
      if (formData.newPassword.length < 6) {
        setError('New password must be at least 6 characters');
        setLoading(false);
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError('New passwords do not match');
        setLoading(false);
        return;
      }
    }

    try {
      const updateData = {
        email: formData.email,
        phone: formData.phone
      };

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await api.put('/auth/profile', updateData);
      
      // Update localStorage with new user data
      const updatedUser = response.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setSuccess('✅ Profile updated successfully!');
      setUser(updatedUser);
      setEditing(false);
      
      // Clear password fields
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setError('');
    setSuccess('');
    setFormData({
      email: user.email || '',
      phone: user.phone || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  if (!user) {
    return (
      <div className="profile-container">
        <div className="card">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card card">
        <div className="profile-header">
          <div className="profile-avatar">
            <div className="avatar-circle">
              {user.username?.charAt(0).toUpperCase()}
            </div>
          </div>
          <h1>{user.username}</h1>
          <p className="user-role">{user.role?.toUpperCase()}</p>
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        {!editing ? (
          <div className="profile-view">
            <div className="info-section">
              <h2>Personal Information</h2>
              <div className="info-grid">
                <div className="info-item">
                  <label>Username</label>
                  <p>{user.username}</p>
                </div>
                <div className="info-item">
                  <label>Email</label>
                  <p>{user.email}</p>
                </div>
                <div className="info-item">
                  <label>Phone Number</label>
                  <p>{user.phone || 'Not provided'}</p>
                </div>
                <div className="info-item">
                  <label>Role</label>
                  <p className="role-badge">{user.role?.toUpperCase()}</p>
                </div>
                <div className="info-item">
                  <label>Phone Verified</label>
                  <p>{user.phoneVerified ? '✅ Yes' : '❌ No'}</p>
                </div>
                <div className="info-item">
                  <label>Member Since</label>
                  <p>{user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="profile-actions">
              <button 
                className="btn btn-primary" 
                onClick={() => setEditing(true)}
              >
                ✏️ Edit Profile
              </button>
              <button 
                className="btn"
                onClick={() => navigate('/change-password')}
                style={{ background: '#667eea', color: 'white' }}
              >
                🔒 Change Password
              </button>
              <button 
                className="btn" 
                onClick={() => navigate('/dashboard')}
                style={{ background: '#e2e8f0', color: '#2d3748' }}
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="profile-edit">
            <div className="info-section">
              <h2>Edit Profile</h2>
              <p style={{ fontSize: '14px', color: '#718096', marginBottom: '20px' }}>
                Update your account information and password
              </p>
              
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={user.username}
                  disabled
                  style={{ background: '#f5f5f5', cursor: 'not-allowed', color: '#718096' }}
                />
                <small style={{ color: '#718096' }}>Username cannot be changed (used for login)</small>
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  placeholder="Enter 10-digit phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                  maxLength="10"
                  required
                />
                <small style={{ color: '#718096' }}>10-digit phone number</small>
              </div>

              <div className="password-section">
                <h3>Change Password (Optional)</h3>
                <p style={{ fontSize: '14px', color: '#718096', marginBottom: '15px' }}>
                  Leave these fields blank if you don't want to change your password
                </p>

                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password (minimum 6 characters)"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="profile-actions">
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading}
              >
                {loading ? 'Saving...' : '💾 Save Changes'}
              </button>
              <button 
                type="button"
                className="btn" 
                onClick={handleCancel}
                disabled={loading}
                style={{ background: '#e2e8f0', color: '#2d3748' }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Profile;
