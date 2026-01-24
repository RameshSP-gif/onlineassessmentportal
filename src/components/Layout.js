import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Layout.css';

function Layout({ children }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.clear();
      navigate('/login');
    }
  };

  return (
    <div className="layout-container">
      {/* Header */}
      <header className="layout-header">
        <div className="header-left">
          <div className="logo-container" onClick={() => navigate('/dashboard')}>
            <img 
              src="/nimblix-logo.png" 
              alt="Nimblix Technologies" 
              className="nimblix-logo"
            />
          </div>
          <h1 className="header-title">Assessment Portal</h1>
        </div>
        <div className="header-right">
          <button 
            className="btn-profile"
            onClick={() => navigate('/profile')}
            title="View Profile"
          >
            👤 Profile
          </button>
          <div className="user-info">
            <span className="user-name">{user.username || user.name}</span>
            <span className="user-role">{user.role}</span>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </header>

      <div className="layout-body">
        {/* Main Content */}
        <main className="layout-main-full">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="layout-footer">
        <div className="footer-content">
          <p>© 2026 Assessment Portal. All rights reserved.</p>
          <div className="footer-links">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#support">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
