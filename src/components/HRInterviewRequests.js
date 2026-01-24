import React, { useEffect, useState } from 'react';
import api from '../api';
import Layout from './Layout';
import './Dashboard.css';

function HRInterviewRequests() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [actionInProgress, setActionInProgress] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadInterviewRequests();
  }, [filter]);

  const loadInterviewRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/interview-requests?status=${filter}`);
      setRequests(response.data);
    } catch (error) {
      console.error('Error loading interview requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    setActionInProgress({ ...actionInProgress, [requestId]: 'approving' });
    try {
      await api.patch(`/interview-requests/${requestId}/approve`, {
        status: 'approved'
      });
      setSuccessMessage('Interview request approved successfully!');
      setTimeout(() => {
        setSuccessMessage('');
        loadInterviewRequests();
      }, 2000);
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionInProgress({ ...actionInProgress, [requestId]: null });
    }
  };

  const handleRejectRequest = async (requestId, reason) => {
    if (!reason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setActionInProgress({ ...actionInProgress, [requestId]: 'rejecting' });
    try {
      await api.patch(`/interview-requests/${requestId}/reject`, {
        status: 'rejected',
        rejectionReason: reason
      });
      setSuccessMessage('Interview request rejected.');
      setTimeout(() => {
        setSuccessMessage('');
        loadInterviewRequests();
      }, 2000);
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionInProgress({ ...actionInProgress, [requestId]: null });
    }
  };

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length
  };

  const statusColors = {
    pending: { bg: '#fef3c7', text: '#92400e', icon: '⏳' },
    approved: { bg: '#dcfce7', text: '#166534', icon: '✅' },
    rejected: { bg: '#fee2e2', text: '#991b1b', icon: '❌' }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>Loading interview requests...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: '30px' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1>🎤 Interview Requests</h1>
          <p style={{ color: '#718096' }}>Manage student interview scheduling requests</p>
        </div>

        {successMessage && (
          <div style={{
            padding: '15px 20px',
            backgroundColor: '#dcfce7',
            color: '#166534',
            borderRadius: '8px',
            marginBottom: '20px',
            borderLeft: '4px solid #22c55e'
          }}>
            ✅ {successMessage}
          </div>
        )}

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '30px' }}>
          <div
            onClick={() => setFilter('pending')}
            style={{
              padding: '20px',
              backgroundColor: filter === 'pending' ? '#fef3c7' : '#f9fafb',
              color: filter === 'pending' ? '#92400e' : '#6b7280',
              borderRadius: '10px',
              cursor: 'pointer',
              textAlign: 'center',
              fontWeight: '600',
              border: filter === 'pending' ? '2px solid #f59e0b' : '1px solid #e5e7eb'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>⏳</div>
            <div>Pending</div>
            <div style={{ fontSize: '18px', marginTop: '5px' }}>{stats.pending}</div>
          </div>
          <div
            onClick={() => setFilter('approved')}
            style={{
              padding: '20px',
              backgroundColor: filter === 'approved' ? '#dcfce7' : '#f9fafb',
              color: filter === 'approved' ? '#166534' : '#6b7280',
              borderRadius: '10px',
              cursor: 'pointer',
              textAlign: 'center',
              fontWeight: '600',
              border: filter === 'approved' ? '2px solid #22c55e' : '1px solid #e5e7eb'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>✅</div>
            <div>Approved</div>
            <div style={{ fontSize: '18px', marginTop: '5px' }}>{stats.approved}</div>
          </div>
          <div
            onClick={() => setFilter('rejected')}
            style={{
              padding: '20px',
              backgroundColor: filter === 'rejected' ? '#fee2e2' : '#f9fafb',
              color: filter === 'rejected' ? '#991b1b' : '#6b7280',
              borderRadius: '10px',
              cursor: 'pointer',
              textAlign: 'center',
              fontWeight: '600',
              border: filter === 'rejected' ? '2px solid #ef4444' : '1px solid #e5e7eb'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>❌</div>
            <div>Rejected</div>
            <div style={{ fontSize: '18px', marginTop: '5px' }}>{stats.rejected}</div>
          </div>
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            backgroundColor: '#f7fafc',
            borderRadius: '10px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📭</div>
            <h3>No {filter} requests</h3>
            <p style={{ color: '#718096' }}>Check back later or select a different filter</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {requests.map((request) => {
              const colors = statusColors[request.status] || statusColors.pending;
              const isExpanded = expandedId === request.id;

              return (
                <div key={request.id} style={{
                  backgroundColor: 'white',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden'
                }}>
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : request.id)}
                    style={{
                      padding: '20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px' }}>
                        <h3 style={{ margin: '0', color: '#1f2937' }}>
                          {request.studentName || request.studentEmail}
                        </h3>
                        <span style={{
                          padding: '4px 12px',
                          backgroundColor: colors.bg,
                          color: colors.text,
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {colors.icon} {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto', gap: '20px', color: '#718096', fontSize: '14px' }}>
                        <div>📚 <strong>{request.courseName}</strong></div>
                        <div>📅 <strong>{new Date(request.proposedDate).toLocaleDateString()}</strong></div>
                        <div>🕐 <strong>{request.proposedTime}</strong></div>
                      </div>
                    </div>
                    <div style={{ fontSize: '20px' }}>
                      {isExpanded ? '▼' : '▶'}
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ borderTop: '1px solid #e5e7eb', padding: '20px', backgroundColor: '#f9fafb' }}>
                      {request.notes && (
                        <div style={{ marginBottom: '20px' }}>
                          <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#1f2937' }}>📝 Notes:</p>
                          <p style={{ margin: '0', color: '#718096', backgroundColor: 'white', padding: '12px', borderRadius: '6px' }}>
                            {request.notes}
                          </p>
                        </div>
                      )}

                      <div style={{ marginBottom: '20px' }}>
                        <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#1f2937' }}>📧 Student Email:</p>
                        <p style={{ margin: '0', color: '#667eea' }}>{request.studentEmail}</p>
                      </div>

                      {request.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleApproveRequest(request.id)}
                            disabled={actionInProgress[request.id]}
                            style={{
                              padding: '10px 20px',
                              backgroundColor: actionInProgress[request.id] === 'approving' ? '#d1d5db' : '#38a169',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: actionInProgress[request.id] ? 'not-allowed' : 'pointer',
                              fontWeight: '600',
                              fontSize: '14px'
                            }}
                          >
                            {actionInProgress[request.id] === 'approving' ? '⏳ Approving...' : '✅ Approve'}
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for rejection:');
                              if (reason !== null) {
                                handleRejectRequest(request.id, reason);
                              }
                            }}
                            disabled={actionInProgress[request.id]}
                            style={{
                              padding: '10px 20px',
                              backgroundColor: actionInProgress[request.id] === 'rejecting' ? '#d1d5db' : '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: actionInProgress[request.id] ? 'not-allowed' : 'pointer',
                              fontWeight: '600',
                              fontSize: '14px'
                            }}
                          >
                            {actionInProgress[request.id] === 'rejecting' ? '⏳ Rejecting...' : '❌ Reject'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default HRInterviewRequests;
