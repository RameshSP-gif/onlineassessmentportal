import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './HRDashboard.css';

function HRDashboard() {
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [interviewers, setInterviewers] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalData, setApprovalData] = useState({
    assignedInterviewerId: '',
    scheduledDate: '',
    scheduledTimeSlot: '',
    meetingLink: '',
    location: '',
    hrComments: ''
  });
  
  const navigate = useNavigate();
  const hr = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadDashboard();
    loadInterviewers();
  }, [filter]);

  const loadDashboard = async () => {
    try {
      const statsResponse = await api.get('/hr/dashboard-stats');
      setStats(statsResponse.data.stats);
      
      const requestsResponse = await api.get(`/hr/interview-requests?status=${filter === 'all' ? '' : filter}`);
      setRequests(requestsResponse.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInterviewers = async () => {
    try {
      const response = await api.get('/admin/interviewers');
      setInterviewers(response.data);
    } catch (error) {
      console.error('Failed to load interviewers:', error);
    }
  };

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setShowApprovalModal(true);
    
    // Pre-fill some data
    if (request.proposedDates && request.proposedDates.length > 0) {
      const firstDate = request.proposedDates[0];
      setApprovalData(prev => ({
        ...prev,
        scheduledDate: firstDate.date.split('T')[0],
        scheduledTimeSlot: firstDate.timeSlot
      }));
    }
  };

  const submitApproval = async () => {
    try {
      await api.post(`/hr/interview-request/${selectedRequest._id}/approve`, {
        hrId: hr.id,
        ...approvalData
      });
      
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setApprovalData({
        assignedInterviewerId: '',
        scheduledDate: '',
        scheduledTimeSlot: '',
        meetingLink: '',
        location: '',
        hrComments: ''
      });
      
      loadDashboard();
      alert('Interview request approved and scheduled successfully!');
    } catch (error) {
      alert('Failed to approve request: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleReject = async (requestId) => {
    const rejectionReason = prompt('Please provide a reason for rejection:');
    if (!rejectionReason) return;

    try {
      await api.post(`/hr/interview-request/${requestId}/reject`, {
        hrId: hr.id,
        rejectionReason
      });
      
      loadDashboard();
      alert('Interview request rejected');
    } catch (error) {
      alert('Failed to reject request');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/hr/login');
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

  const getStatusBadge = (status) => {
    const badges = {
      pending: '⏳ Pending',
      approved: '✅ Approved',
      rejected: '❌ Rejected',
      scheduled: '📅 Scheduled',
      completed: '✓ Completed',
      cancelled: '⊗ Cancelled'
    };
    return badges[status] || status;
  };

  if (loading) {
    return <div className="loading">Loading HR Dashboard...</div>;
  }

  return (
    <div className="hr-dashboard-container">
      <header className="hr-header">
        <div>
          <h1>HR Interview Management</h1>
          <p className="welcome-text">Welcome, <strong>{hr.fullName}</strong></p>
        </div>
        <button onClick={handleLogout} className="btn-logout">Logout</button>
      </header>

      {/* Statistics */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card pending">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>{stats.pendingRequests}</h3>
              <p>Pending Requests</p>
            </div>
          </div>
          <div className="stat-card scheduled">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>{stats.scheduledInterviews}</h3>
              <p>Scheduled Interviews</p>
            </div>
          </div>
          <div className="stat-card completed">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{stats.completedInterviews}</h3>
              <p>Completed Interviews</p>
            </div>
          </div>
          <div className="stat-card interviewers">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{stats.totalInterviewers}</h3>
              <p>Total Interviewers</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <button 
          className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={filter === 'pending' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button 
          className={filter === 'approved' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('approved')}
        >
          Approved
        </button>
        <button 
          className={filter === 'scheduled' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('scheduled')}
        >
          Scheduled
        </button>
        <button 
          className={filter === 'completed' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>

      {/* Requests List */}
      <div className="requests-list">
        {requests.length === 0 ? (
          <div className="no-requests">
            <p>No interview requests found for this filter</p>
          </div>
        ) : (
          requests.map(request => (
            <div key={request._id} className="request-item">
              <div className="request-header">
                <div>
                  <h3>{request.studentName}</h3>
                  <p className="student-email">{request.studentEmail}</p>
                </div>
                <span className={`status-badge status-${request.status}`}>
                  {getStatusBadge(request.status)}
                </span>
              </div>

              <div className="request-details">
                <div className="detail-row">
                  <span className="label">Interview Type:</span>
                  <span className="value">
                    {request.interviewType === 'human' ? '👨‍💼 Human Interviewer' : '🤖 Super AI'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Mode:</span>
                  <span className="value">
                    {request.interviewMode === 'online' && '💻 Online'}
                    {request.interviewMode === 'f2f' && '🏢 Face-to-Face'}
                    {request.interviewMode === 'n/a' && 'N/A'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Specialization:</span>
                  <span className="value">{request.specialization}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Requested on:</span>
                  <span className="value">{formatDate(request.created_at)}</span>
                </div>

                {request.proposedDates && request.proposedDates.length > 0 && (
                  <div className="proposed-dates">
                    <span className="label">Proposed Dates:</span>
                    <div className="dates-list">
                      {request.proposedDates.map((date, index) => (
                        <div key={index} className="date-item">
                          {new Date(date.date).toLocaleDateString()} • {date.timeSlot}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {request.additionalNotes && (
                  <div className="additional-notes">
                    <span className="label">Notes:</span>
                    <p>{request.additionalNotes}</p>
                  </div>
                )}
              </div>

              {request.status === 'pending' && (
                <div className="request-actions">
                  <button 
                    className="btn-approve"
                    onClick={() => handleApprove(request)}
                  >
                    ✓ Approve & Schedule
                  </button>
                  <button 
                    className="btn-reject"
                    onClick={() => handleReject(request._id)}
                  >
                    ✕ Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowApprovalModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Approve & Schedule Interview</h2>
            <p className="modal-subtitle">Student: {selectedRequest.studentName}</p>

            <div className="modal-form">
              {selectedRequest.interviewType === 'human' && (
                <div className="form-group">
                  <label>Assign Interviewer *</label>
                  <select
                    value={approvalData.assignedInterviewerId}
                    onChange={(e) => setApprovalData(prev => ({ ...prev, assignedInterviewerId: e.target.value }))}
                    required
                  >
                    <option value="">Select Interviewer</option>
                    {interviewers
                      .filter(i => i.specialization === selectedRequest.specialization)
                      .map(interviewer => (
                        <option key={interviewer._id} value={interviewer._id}>
                          {interviewer.fullName} - {interviewer.specialization} ({interviewer.totalInterviews} interviews)
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Schedule Date *</label>
                <input
                  type="date"
                  value={approvalData.scheduledDate}
                  onChange={(e) => setApprovalData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Time Slot *</label>
                <input
                  type="text"
                  value={approvalData.scheduledTimeSlot}
                  onChange={(e) => setApprovalData(prev => ({ ...prev, scheduledTimeSlot: e.target.value }))}
                  placeholder="e.g., 10:00 AM - 11:00 AM"
                  required
                />
              </div>

              {selectedRequest.interviewMode === 'online' && (
                <div className="form-group">
                  <label>Meeting Link</label>
                  <input
                    type="url"
                    value={approvalData.meetingLink}
                    onChange={(e) => setApprovalData(prev => ({ ...prev, meetingLink: e.target.value }))}
                    placeholder="https://meet.google.com/..."
                  />
                </div>
              )}

              {selectedRequest.interviewMode === 'f2f' && (
                <div className="form-group">
                  <label>Location *</label>
                  <input
                    type="text"
                    value={approvalData.location}
                    onChange={(e) => setApprovalData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Office address or room number"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>HR Comments</label>
                <textarea
                  value={approvalData.hrComments}
                  onChange={(e) => setApprovalData(prev => ({ ...prev, hrComments: e.target.value }))}
                  rows="3"
                  placeholder="Any additional information for the student..."
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel-modal" onClick={() => setShowApprovalModal(false)}>
                Cancel
              </button>
              <button className="btn-submit-modal" onClick={submitApproval}>
                Approve & Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HRDashboard;
