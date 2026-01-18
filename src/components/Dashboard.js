import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exams, submissions, interviews } from '../api';
import Layout from './Layout';
import './Dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ exams: 0, submissions: 0, interviews: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(userData);
    loadStats();
  }, [navigate]);

  const loadStats = async (retry = 0) => {
    try {
      setError(null);
      setLoading(true);
      
      const [examsRes, submissionsRes, interviewsRes] = await Promise.all([
        exams.getAll().catch(err => {
          console.error('Failed to load exams:', err);
          throw err;
        }),
        submissions.getMine().catch(err => {
          console.error('Failed to load submissions:', err);
          throw err;
        }),
        interviews.getMine().catch(err => {
          console.error('Failed to load interviews:', err);
          throw err;
        })
      ]);
      
      setStats({
        exams: Array.isArray(examsRes.data) ? examsRes.data.length : 0,
        submissions: Array.isArray(submissionsRes.data) ? submissionsRes.data.length : 0,
        interviews: Array.isArray(interviewsRes.data) ? interviewsRes.data.length : 0
      });
      setError(null);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      
      // Retry logic for network errors
      if (!error.response && retry < 2) {
        setTimeout(() => {
          setRetrying(true);
          loadStats(retry + 1).finally(() => setRetrying(false));
        }, 2000);
      } else {
        setError(
          error.response?.data?.error || 
          'Failed to load dashboard. Please refresh the page.'
        );
        setStats({ exams: 0, submissions: 0, interviews: 0 });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadStats();
  };

  if (loading && !retrying) {
    return <Layout><div className="loading">Loading dashboard...</div></Layout>;
  }

  if (error && !retrying) {
    return (
      <Layout>
        <div className="error-container" style={{ padding: '20px', textAlign: 'center' }}>
          <h2>⚠️ Error Loading Dashboard</h2>
          <p>{error}</p>
          <button onClick={handleRetry} className="btn btn-primary">
            🔄 Retry
          </button>
        </div>
      </Layout>
    );
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
