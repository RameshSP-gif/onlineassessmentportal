import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Layout.css';

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.clear();
      navigate('/login');
    }
  };

  const menuItems = user.role === 'admin' ? [
    { path: '/admin', icon: '🏠', label: 'Admin Dashboard' },
    { path: '/admin/exams', icon: '📝', label: 'Manage Exams' },
    { path: '/admin/students', icon: '👥', label: 'Students' },
    { path: '/admin/payments', icon: '💳', label: 'Approve Exam Payments' },
    { path: '/admin/interview-payments', icon: '🎤', label: 'Approve Interview Payments' },
    { path: '/admin/results', icon: '📊', label: 'Reports' }
  ] : [
    { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { path: '/exams', icon: '📝', label: 'Browse Exams, Pay & Book' },
    { path: '/payment-status', icon: '💰', label: 'Check Approvals & Take Exam' },
    { path: '/interviews', icon: '🎤', label: 'Browse Interviews, Pay & Schedule' },
    { path: '/interview-status', icon: '💳', label: 'Check Approvals & Take Interview' },
    { path: '/results', icon: '📊', label: 'My Results' }
  ];

  return (
    <div className="layout-container">
      {/* Header */}
      <header className="layout-header">
        <div className="header-left">
          <button 
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
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
          <div className="user-info">
            <span className="user-icon">👤</span>
            <span className="user-name">{user.username || user.name}</span>
            <span className="user-role">{user.role}</span>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </header>

      <div className="layout-body">
        {/* Sidebar */}
        <aside className={`layout-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <nav className="sidebar-nav">
            {menuItems.map((item) => (
              <button
                key={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                {sidebarOpen && <span className="nav-label">{item.label}</span>}
              </button>
            ))}
            <button
              className="nav-item nav-logout"
              onClick={handleLogout}
            >
              <span className="nav-icon">🚪</span>
              {sidebarOpen && <span className="nav-label">Logout</span>}
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className={`layout-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
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
