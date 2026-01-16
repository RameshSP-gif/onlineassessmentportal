import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Dashboard.css';

function InterviewerDashboard() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, scheduled, in-progress, completed
  const navigate = useNavigate();
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    try {
      const response = await api.get(`/interviewer/${user.id}/interviews`);
      setInterviews(response.data);
    } catch (error) {
      console.error('Failed to load interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/interviewer/login');
  };

  const joinInterview = (sessionId) => {
    navigate(`/interviewer/interview/${sessionId}`);
  };

  const viewRecording = (sessionId) => {
    navigate(`/interviewer/review/${sessionId}`);
  };

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: '📅 Scheduled',
      'in-progress': '🔴 Live',
      completed: '✅ Completed',
      cancelled: '❌ Cancelled'
    };
    return badges[status] || status;
  };

  const getStatusClass = (status) => {
    return `status-badge status-${status}`;
  };

  const filteredInterviews = interviews.filter(interview => {
    if (filter === 'all') return true;
    return interview.status === filter;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isInterviewLive = (interview) => {
    const now = new Date();
    const scheduled = new Date(interview.scheduledAt);
    const diff = (now - scheduled) / (1000 * 60); // difference in minutes
    return diff >= -5 && diff <= 60 && interview.status !== 'completed';
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container interviewer-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>Interviewer Dashboard</h1>
            <p className="welcome-text">
              Welcome, <strong>{user.fullName}</strong> ({user.specialization})
            </p>
          </div>
          <div className="header-actions">
            <div className="interviewer-stats">
              <div className="stat-item">
                <span className="stat-value">{user.totalInterviews || 0}</span>
                <span className="stat-label">Total Interviews</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">⭐ {user.rating?.toFixed(1) || 'N/A'}</span>
                <span className="stat-label">Rating</span>
              </div>
            </div>
            <button onClick={handleLogout} className="btn-secondary">Logout</button>
          </div>
        </div>
      </header>

      <div className="dashboard-filters">
        <button 
          className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('all')}
        >
          All ({interviews.length})
        </button>
        <button 
          className={filter === 'scheduled' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('scheduled')}
        >
          Scheduled ({interviews.filter(i => i.status === 'scheduled').length})
        </button>
        <button 
          className={filter === 'in-progress' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('in-progress')}
        >
          In Progress ({interviews.filter(i => i.status === 'in-progress').length})
        </button>
        <button 
          className={filter === 'completed' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('completed')}
        >
          Completed ({interviews.filter(i => i.status === 'completed').length})
        </button>
      </div>

      <div className="interviews-grid">
        {filteredInterviews.length === 0 ? (
          <div className="no-data">
            <p>No interviews found for this filter.</p>
          </div>
        ) : (
          filteredInterviews.map((interview) => (
            <div key={interview._id} className="interview-card">
              <div className="interview-card-header">
                <div>
                  <h3>Interview Session</h3>
                  <p className="student-name">
                    Student: <strong>{interview.studentId?.username || 'N/A'}</strong>
                  </p>
                </div>
                <span className={getStatusClass(interview.status)}>
                  {getStatusBadge(interview.status)}
                </span>
              </div>
              
              <div className="interview-card-body">
                <div className="info-row">
                  <span className="info-label">📧 Email:</span>
                  <span>{interview.studentId?.email || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">📅 Scheduled:</span>
                  <span>{formatDate(interview.scheduledAt)}</span>
                </div>
                {interview.startedAt && (
                  <div className="info-row">
                    <span className="info-label">▶️ Started:</span>
                    <span>{formatDate(interview.startedAt)}</span>
                  </div>
                )}
                {interview.endedAt && (
                  <div className="info-row">
                    <span className="info-label">⏹️ Ended:</span>
                    <span>{formatDate(interview.endedAt)}</span>
                  </div>
                )}
                {interview.duration && (
                  <div className="info-row">
                    <span className="info-label">⏱️ Duration:</span>
                    <span>{interview.duration} minutes</span>
                  </div>
                )}
                {interview.aiEvaluation?.overallScore && (
                  <div className="info-row">
                    <span className="info-label">🎯 AI Score:</span>
                    <span className="score-badge">{interview.aiEvaluation.overallScore}/100</span>
                  </div>
                )}
              </div>
              
              <div className="interview-card-actions">
                {isInterviewLive(interview) && interview.status !== 'completed' && (
                  <button 
                    className="btn-primary"
                    onClick={() => joinInterview(interview._id)}
                  >
                    🎥 Join Interview
                  </button>
                )}
                {interview.status === 'completed' && (
                  <button 
                    className="btn-secondary"
                    onClick={() => viewRecording(interview._id)}
                  >
                    📹 View Recording & Evaluation
                  </button>
                )}
                {interview.status === 'scheduled' && !isInterviewLive(interview) && (
                  <button className="btn-disabled" disabled>
                    ⏳ Scheduled for later
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default InterviewerDashboard;
