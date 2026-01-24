import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exams, submissions } from '../api';
import api from '../api';
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
      
      const userData = JSON.parse(localStorage.getItem('user'));
      
      const [examsRes, submissionsRes, interviewCoursesRes] = await Promise.all([
        exams.getAll().catch(err => {
          console.error('Failed to load exams:', err);
          return { data: [] };
        }),
        submissions.getMine().catch(err => {
          console.error('Failed to load submissions:', err);
          return { data: [] };
        }),
        api.get('/interview-courses').catch(err => {
          console.error('Failed to load interview courses:', err);
          return { data: [] };
        })
      ]);
      
      // Count interviews with proper status checking
      let availableCount = 0;
      let pendingCount = 0;
      let scheduledCount = 0;
      
      for (const course of (interviewCoursesRes.data || [])) {
        try {
          const paymentRes = await api.get(`/interview-payments/status/${course.id}/${userData.id}`);
          const requestRes = await api.get(`/student/${userData.id}/interview-requests`).catch(() => ({ data: [] }));
          const courseRequest = (requestRes.data || []).find(r => 
            String(r.courseId) === String(course.id) || String(r.courseId?._id) === String(course.id)
          );
          
          if (!paymentRes.data.paid && paymentRes.data.status !== 'pending_verification' && paymentRes.data.status !== 'pending') {
            availableCount++;
          } else if (paymentRes.data.status === 'pending_verification' || paymentRes.data.status === 'pending' || (courseRequest && courseRequest.status === 'pending')) {
            pendingCount++;
          } else if (paymentRes.data.paid && courseRequest && (courseRequest.status === 'approved' || courseRequest.status === 'scheduled')) {
            scheduledCount++;
          }
        } catch (err) {
          availableCount++; // Default to available if status check fails
        }
      }
      
      setStats({
        exams: Array.isArray(examsRes.data) ? examsRes.data.length : 0,
        submissions: Array.isArray(submissionsRes.data) ? submissionsRes.data.length : 0,
        interviews: availableCount,
        pendingInterviews: pendingCount,
        scheduledInterviews: scheduledCount,
        totalInterviews: (interviewCoursesRes.data || []).length
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

          <div className="stat-card" onClick={() => navigate('/interviews')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon" style={{ background: '#f56565' }}>🎥</div>
            <div>
              <h3>{stats.totalInterviews || stats.interviews}</h3>
              <p>Total Interviews</p>
              <div style={{ fontSize: '12px', marginTop: '5px', color: '#718096' }}>
                {stats.interviews > 0 && <span>💰 {stats.interviews} Available</span>}
                {stats.pendingInterviews > 0 && <span> • ⏳ {stats.pendingInterviews} Pending</span>}
                {stats.scheduledInterviews > 0 && <span> • 📅 {stats.scheduledInterviews} Scheduled</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button onClick={() => navigate('/exams')} className="btn btn-primary">
              📝 Take Exam
          </button>
            <button 
              onClick={() => navigate('/interview-list')} 
              className="btn btn-success"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontSize: '16px',
                fontWeight: '700',
                padding: '12px 24px',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                cursor: 'pointer',
                color: 'white'
              }}
            >
              🎤💰 Pay and Schedule Interview Now
          </button>
          <button onClick={() => navigate('/results')} className="btn btn-secondary">
              📊 View Results
          </button>
          {user?.role === 'admin' && (
            <button onClick={() => navigate('/admin')} className="btn btn-danger">
                ⚙️ Admin Panel
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;
