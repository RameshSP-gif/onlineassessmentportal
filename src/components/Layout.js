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

  // Role-specific menu items
  const getMenuItems = () => {
    switch(user.role) {
      case 'admin':
        return [
          { path: '/admin/dashboard', icon: '🏠', label: 'Admin Dashboard' },
          { path: '/admin/exams', icon: '📝', label: 'Manage Exams' },
          { path: '/admin/students', icon: '👥', label: 'Manage Students' },
          { path: '/admin/users', icon: '👤', label: 'User Management' },
          { path: '/admin/roles', icon: '🔑', label: 'Role Management' },
          { path: '/admin/payments', icon: '💳', label: 'Exam Payment Approvals' },
          { path: '/admin/interview-payments', icon: '🎤', label: 'Interview Payment Approvals' },
          { path: '/admin/results', icon: '📊', label: 'Reports & Analytics' }
        ];
      
      case 'hr':
        return [
          { path: '/hr/dashboard', icon: '🏠', label: 'HR Dashboard' },
          { path: '/hr/interview-requests', icon: '📋', label: 'Interview Requests' },
          { path: '/hr/schedule', icon: '📅', label: 'Interview Schedule' },
          { path: '/hr/candidates', icon: '👥', label: 'Manage Candidates' },
          { path: '/hr/reports', icon: '📊', label: 'HR Reports' }
        ];
      
      case 'interviewer':
        return [
          { path: '/interviewer/dashboard', icon: '🏠', label: 'Interviewer Dashboard' },
          { path: '/interviewer/schedule', icon: '📅', label: 'My Schedule' },
          { path: '/interviewer/interviews', icon: '🎤', label: 'Conduct Interviews' },
          { path: '/interviewer/reviews', icon: '📝', label: 'Interview Reviews' },
          { path: '/interviewer/availability', icon: '🕒', label: 'Set Availability' }
        ];
      
      case 'student':
      default:
        return [
          { path: '/dashboard', icon: '🏠', label: 'Student Dashboard' },
          { path: '/exams', icon: '📝', label: 'Browse Exams' },
          { path: '/payment-status', icon: '💰', label: 'Exam Payments & Take Test' },
          { path: '/interviews', icon: '🎤', label: 'Browse Interviews' },
          { path: '/interview-status', icon: '💳', label: 'Interview Payments & Schedule' },
          { path: '/results', icon: '📊', label: 'My Results' }
        ];
    }
  };

  const menuItems = getMenuItems();

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
