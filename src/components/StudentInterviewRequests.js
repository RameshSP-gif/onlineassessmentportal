import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './StudentInterviewRequests.css';

function StudentInterviewRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const loadRequests = useCallback(async () => {
    if (!user?.id) {
      setRequests([]);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get(`/interview-requests/student/${user.id}`);
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [loadRequests]);

  const handleCancel = async (requestId) => {
    if (window.confirm('Are you sure you want to cancel this interview request?')) {
      try {
        await api.patch(`/interview-requests/${requestId}/cancel`);
        loadRequests();
      } catch (error) {
        alert('Failed to cancel request');
      }
    }
  };

  const handleScheduleClick = (requestId) => {
    setScheduling(requestId);
    setScheduleDate('');
    setScheduleTime('');
  };

  const handleSubmitSchedule = async (requestId) => {
    if (!scheduleDate || !scheduleTime) {
      alert('Please select both date and time');
      return;
    }
    setScheduleSubmitting(true);
    try {
      await api.patch(`/interview-requests/${requestId}/schedule`, {
        proposedDate: scheduleDate,
        proposedTime: scheduleTime
      });
      setScheduling(null);
      setScheduleDate('');
      setScheduleTime('');
      loadRequests();
    } catch (error) {
      alert('Failed to schedule: ' + (error.response?.data?.message || error.message));
    } finally {
      setScheduleSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: '⏳ Pending Review', class: 'status-pending' },
      approved: { text: '✅ Approved', class: 'status-approved' },
      rejected: { text: '❌ Rejected', class: 'status-rejected' },
      scheduled: { text: '📅 Scheduled', class: 'status-scheduled' },
      completed: { text: '✓ Completed', class: 'status-completed' },
      cancelled: { text: '⊗ Cancelled', class: 'status-cancelled' }
    };
    return badges[status] || { text: status, class: '' };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="student-requests-container">
        <div className="loading">Loading your interview requests...</div>
      </div>
    );
  }

  const scheduledRequests = requests.filter((r) => r.status === 'scheduled');

  return (
    <div className="student-requests-container">
      <div className="requests-header">
        <div>
          <button className="btn-back" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <h1>My Interview Requests</h1>
          <p className="subtitle">Track and manage your interview applications</p>
        </div>
        <button className="btn-new-request" onClick={() => navigate('/interview-list')}>
          + New Interview Request
        </button>
      </div>

      {scheduledRequests.length > 0 && (
        <div className="scheduled-summary">
          <h2>📅 Scheduled Interviews</h2>
          <div className="requests-grid">
            {scheduledRequests.map((request) => (
              <div key={request._id || request.id} className="request-card scheduled-card">
                <div className="card-header">
                  <div className="interview-type-badge">
                    {request.interviewType === 'human' ? '👨‍💼 Human' : '🤖 AI'}
                  </div>
                  <span className="status-badge status-scheduled">📅 Scheduled</span>
                </div>
                <div className="card-body">
                  <h3>{request.specialization || request.courseName}</h3>
                  <div className="info-row">
                    <span className="label">When:</span>
                    <span className="value">{formatDate(request.scheduledDate || request.proposedDate)}</span>
                  </div>
                  {request.scheduledTimeSlot && (
                    <div className="info-row">
                      <span className="label">Time:</span>
                      <span className="value">{request.scheduledTimeSlot}</span>
                    </div>
                  )}
                  {request.meetingLink && (
                    <a 
                      href={request.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="meeting-link"
                    >
                      🔗 Join Meeting
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No Interview Requests Yet</h3>
          <p>Start by scheduling your first interview</p>
          <button className="btn-primary" onClick={() => navigate('/interview-list')}>
            Schedule Interview
          </button>
        </div>
      ) : (
        <div className="requests-grid">
          {requests.map((request) => {
            const statusInfo = getStatusBadge(request.status);
            return (
              <div key={request._id} className="request-card">
                <div className="card-header">
                  <div className="interview-type-badge">
                    {request.interviewType === 'human' ? '👨‍💼 Human' : '🤖 AI'}
                  </div>
                  <span className={`status-badge ${statusInfo.class}`}>
                    {statusInfo.text}
                  </span>
                </div>

                <div className="card-body">
                  <h3>{request.specialization}</h3>
                  
                  <div className="info-row">
                    <span className="label">Interview Mode:</span>
                    <span className="value">
                      {request.interviewMode === 'online' && '💻 Online'}
                      {request.interviewMode === 'f2f' && '🏢 Face-to-Face'}
                      {request.interviewMode === 'n/a' && 'N/A (AI Interview)'}
                    </span>
                  </div>

                  <div className="info-row">
                    <span className="label">Requested on:</span>
                    <span className="value">{formatDate(request.created_at)}</span>
                  </div>

                  {request.proposedDates && request.proposedDates.length > 0 && (
                    <div className="proposed-dates-section">
                      <span className="label">Proposed Dates:</span>
                      <div className="proposed-dates-list">
                        {request.proposedDates.slice(0, 3).map((dateSlot, index) => (
                          <div key={index} className="date-chip">
                            📅 {new Date(dateSlot.date).toLocaleDateString()} • {dateSlot.timeSlot}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {request.status === 'scheduled' && request.scheduledDate && (
                    <div className="scheduled-info">
                      <h4>🎯 Final Schedule:</h4>
                      <p className="scheduled-date">
                        {formatDate(request.scheduledDate)}
                      </p>
                      <p className="time-slot">{request.scheduledTimeSlot}</p>
                      
                      {request.meetingLink && (
                        <a 
                          href={request.meetingLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="meeting-link"
                        >
                          🔗 Join Meeting Link
                        </a>
                      )}
                      
                      {request.location && (
                        <p className="location">📍 {request.location}</p>
                      )}

                      {request.assignedInterviewerId && (
                        <div className="interviewer-info">
                          <strong>Interviewer:</strong> {request.assignedInterviewerId.fullName}
                          <br/>
                          <small>{request.assignedInterviewerId.specialization}</small>
                        </div>
                      )}
                    </div>
                  )}

                  {request.status === 'rejected' && request.rejectionReason && (
                    <div className="rejection-info">
                      <strong>Rejection Reason:</strong>
                      <p>{request.rejectionReason}</p>
                    </div>
                  )}

                  {request.hrComments && (
                    <div className="hr-comments">
                      <strong>HR Comments:</strong>
                      <p>{request.hrComments}</p>
                    </div>
                  )}
                </div>

                <div className="card-actions">
                  {request.status === 'pending' && (
                    <button 
                      className="btn-cancel"
                      onClick={() => handleCancel(request._id)}
                    >
                      Cancel Request
                    </button>
                  )}
                  {request.status === 'approved' && scheduling !== request._id && (
                    <button 
                      className="btn-schedule"
                      onClick={() => handleScheduleClick(request._id)}
                    >
                      📅 Schedule Interview
                    </button>
                  )}
                  {scheduling === request._id && (
                    <div className="schedule-form">
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="schedule-input"
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="schedule-input"
                      />
                      <button
                        className="btn-confirm"
                        onClick={() => handleSubmitSchedule(request._id)}
                        disabled={scheduleSubmitting}
                      >
                        {scheduleSubmitting ? '⏳ Scheduling...' : '✅ Confirm'}
                      </button>
                      <button
                        className="btn-cancel-form"
                        onClick={() => setScheduling(null)}
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  )}
                  {request.status === 'scheduled' && (
                    <button 
                      className="btn-join"
                      onClick={() => {
                        // Navigate to appropriate interview page
                        if (request.interviewType === 'ai') {
                          navigate(`/ai-interview/${request._id}`);
                        } else {
                          navigate(`/interview-session/${request._id}`);
                        }
                      }}
                    >
                      {request.interviewType === 'ai' ? 'Start AI Interview' : 'View Details'}
                    </button>
                  )}
                  {request.status === 'completed' && (
                    <button 
                      className="btn-view-results"
                      onClick={() => navigate(`/interview-results/${request._id}`)}
                    >
                      View Results
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default StudentInterviewRequests;
