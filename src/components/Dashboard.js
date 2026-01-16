import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exams, submissions, interviews } from '../api';
import Layout from './Layout';
import './Dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ exams: 0, submissions: 0, interviews: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [examsRes, submissionsRes, interviewsRes] = await Promise.all([
        exams.getAll(),
        submissions.getMine(),
        interviews.getMine()
      ]);
      setStats({
        exams: examsRes.data.length,
        submissions: submissionsRes.data.length,
        interviews: interviewsRes.data.length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Layout><div className="loading">Loading dashboard...</div></Layout>;
  }

  return (
    <Layout>
      <div className="dashboard-content">
        <h1>Dashboard</h1>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#667eea' }}>📝</div>
            <div>
              <h3>{stats.exams}</h3>
              <p>Available Exams</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#48bb78' }}>✅</div>
            <div>
              <h3>{stats.submissions}</h3>
              <p>Completed Exams</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f56565' }}>🎥</div>
            <div>
              <h3>{stats.interviews}</h3>
              <p>Video Interviews</p>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button onClick={() => navigate('/exams')} className="btn btn-primary">
            Take Exam
          </button>
          <button onClick={() => navigate('/interview')} className="btn btn-success">
            Video Interview
          </button>
          <button onClick={() => navigate('/results')} className="btn btn-secondary">
            View Results
          </button>
          {user?.role === 'admin' && (
            <button onClick={() => navigate('/admin')} className="btn btn-danger">
              Admin Panel
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;
