import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Layout from './Layout';
import './Dashboard.css';

function InterviewList() {
  const [interviews, setInterviews] = useState([]);
  const [paymentStatuses, setPaymentStatuses] = useState({});
  const [requestsByCourse, setRequestsByCourse] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, available, pending, approved
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadInterviews();
  }, []);

  const normalizeId = (val) => {
    if (!val) return null;
    if (typeof val === 'string') return val;
    if (val.$oid) return val.$oid;
    if (val._id) return `${val._id}`;
    try { return `${val}`; } catch { return null; }
  };

  const loadInterviews = async () => {
    setLoading(true);
    try {
      const response = await api.get('/interview-courses');
      setInterviews(response.data);
      
      // Load payment status for each interview
      const statuses = {};
      for (const interview of response.data) {
        try {
          const statusRes = await api.get(`/interview-payments/status/${interview.id}/${user.id}`);
          statuses[interview.id] = statusRes.data;
        } catch (error) {
          statuses[interview.id] = { paid: false, status: 'not_paid', orderId: null };
        }
      }
      setPaymentStatuses(statuses);

      // Load student's interview requests and index by courseId
      try {
        const reqRes = await api.get(`/interview-requests/student/${user.id}`);
        const byCourse = {};
        (reqRes.data || []).forEach(r => {
          const cid = normalizeId(r.courseId);
          if (!cid) return;
          // Keep the most recently updated request per course
          if (!byCourse[cid] || new Date(r.updated_at || r.created_at) > new Date(byCourse[cid].updated_at || byCourse[cid].created_at)) {
            byCourse[cid] = r;
          }
        });
        setRequestsByCourse(byCourse);
      } catch (err) {
        console.warn('Unable to load student interview requests', err?.response?.data || err.message);
        setRequestsByCourse({});
      }
    } catch (error) {
      console.error('Error loading interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredInterviews = () => {
    return interviews.filter(interview => {
      const pay = paymentStatuses[interview.id];
      const req = requestsByCourse[interview.id];
      
      if (filter === 'available') {
        // Not paid and no pending payment
        return !pay?.paid && pay?.status !== 'pending_verification' && pay?.status !== 'pending';
      }
      if (filter === 'pending') {
        // Payment pending OR request pending
        return (pay?.status === 'pending_verification' || pay?.status === 'pending') || (req && req.status === 'pending');
      }
      if (filter === 'approved') {
        // Payment completed and either no request or scheduled/approved request
        return pay?.paid && (!req || req.status === 'approved' || req.status === 'scheduled');
      }
      return true;
    });
  };

  const handlePayAndSchedule = (interviewId) => {
    navigate(`/interview-payment/${interviewId}`);
  };

  const handleStartInterview = (interviewId) => {
    navigate(`/schedule-interview-request/${interviewId}`);
  };

  const filteredInterviews = getFilteredInterviews();

  if (loading) {
    return (
      <Layout>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>Loading interviews...</p>
        </div>
      </Layout>
    );
  }

  const stats = {
    available: interviews.filter(i => {
      const pay = paymentStatuses[i.id];
      return !pay?.paid && pay?.status !== 'pending_verification' && pay?.status !== 'pending';
    }).length,
    pending: interviews.filter(i => {
      const pay = paymentStatuses[i.id];
      const req = requestsByCourse[i.id];
      return (pay?.status === 'pending_verification' || pay?.status === 'pending') || (req && req.status === 'pending');
    }).length,
    approved: interviews.filter(i => {
      const pay = paymentStatuses[i.id];
      const req = requestsByCourse[i.id];
      return pay?.paid && (!req || req.status === 'approved' || req.status === 'scheduled');
    }).length
  };

  return (
    <Layout>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h1>🎤 Video Interviews</h1>
            <p style={{ color: '#718096', marginTop: '5px' }}>Browse, pay, and schedule interviews</p>
          </div>
          <button
            onClick={loadInterviews}
            style={{
              padding: '9px 16px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '18px' }}>
          <div onClick={() => setFilter('all')} style={{
            padding: '14px',
            backgroundColor: filter === 'all' ? '#667eea' : '#f0f4ff',
            color: filter === 'all' ? 'white' : '#667eea',
            borderRadius: '10px',
            cursor: 'pointer',
            textAlign: 'center',
            fontWeight: '600'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>📚</div>
            <div>All Interviews</div>
            <div style={{ fontSize: '18px', marginTop: '5px' }}>{interviews.length}</div>
          </div>
          <div onClick={() => setFilter('available')} style={{
            padding: '14px',
            backgroundColor: filter === 'available' ? '#fbbf24' : '#fffbf0',
            color: filter === 'available' ? 'white' : '#f59e0b',
            borderRadius: '10px',
            cursor: 'pointer',
            textAlign: 'center',
            fontWeight: '600'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>💰</div>
            <div>Available to Pay</div>
            <div style={{ fontSize: '18px', marginTop: '5px' }}>{stats.available}</div>
          </div>
          <div onClick={() => setFilter('pending')} style={{
            padding: '14px',
            backgroundColor: filter === 'pending' ? '#f59e0b' : '#fffbf0',
            color: filter === 'pending' ? 'white' : '#f59e0b',
            borderRadius: '10px',
            cursor: 'pointer',
            textAlign: 'center',
            fontWeight: '600'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>⏳</div>
            <div>Pending Approval</div>
            <div style={{ fontSize: '18px', marginTop: '5px' }}>{stats.pending}</div>
          </div>
          <div onClick={() => setFilter('approved')} style={{
            padding: '14px',
            backgroundColor: filter === 'approved' ? '#38a169' : '#f0fdf4',
            color: filter === 'approved' ? 'white' : '#38a169',
            borderRadius: '10px',
            cursor: 'pointer',
            textAlign: 'center',
            fontWeight: '600'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>✅</div>
            <div>Approved & Ready</div>
            <div style={{ fontSize: '18px', marginTop: '5px' }}>{stats.approved}</div>
          </div>
        </div>

        {/* Interview Cards */}
        {filteredInterviews.length === 0 ? (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            backgroundColor: '#f7fafc',
            borderRadius: '10px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📭</div>
            <h3>No interviews found</h3>
            <p style={{ color: '#718096' }}>Try selecting a different filter or check back later</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {filteredInterviews.map((interview) => {
              const paymentStatus = paymentStatuses[interview.id] || { paid: false, status: 'not_paid', orderId: null };
              const isPaid = paymentStatus.paid;
              const payStatus = paymentStatus.status;
              const req = requestsByCourse[interview.id];
              const reqStatus = req?.status;

              return (
                <div key={interview.id} style={{
                  backgroundColor: 'white',
                  borderRadius: '10px',
                  padding: '16px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: '#1f2937', fontSize: '16px' }}>{interview.title}</h3>
                    <span style={{ padding: '6px 10px', background: '#eef2ff', color: '#4338ca', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>
                      {interview.duration || 30} mins
                    </span>
                  </div>

                  <p style={{ margin: 0, color: '#4b5563', fontSize: '13px', lineHeight: 1.4 }}>
                    {interview.description}
                  </p>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '0px', flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '5px 12px',
                      backgroundColor: '#dcfce7',
                      color: '#166534',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      ❓ {interview.questions?.length || 3} questions
                    </span>
                    <span style={{
                      padding: '5px 12px',
                      backgroundColor: '#e0f2fe',
                      color: '#075985',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      🎯 {interview.level || 'All levels'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    {!isPaid && (
                      <span style={{
                        padding: '6px 14px',
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        💰 Pay ₹200
                      </span>
                    )}
                    {payStatus === 'pending_verification' && (
                      <span style={{
                        padding: '6px 14px',
                        backgroundColor: '#fed7aa',
                        color: '#9a3412',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        ⏳ Pending Admin Approval
                      </span>
                    )}
                    {isPaid && !req && (
                      <span style={{
                        padding: '6px 14px',
                        backgroundColor: '#dcfce7',
                        color: '#166534',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        ✅ Approved - Ready to Schedule
                      </span>
                    )}
                    {isPaid && reqStatus === 'pending' && (
                      <span style={{
                        padding: '6px 14px',
                        backgroundColor: '#e0e7ff',
                        color: '#3730a3',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        📨 Schedule Request Pending
                      </span>
                    )}
                    {isPaid && (reqStatus === 'approved' || reqStatus === 'scheduled') && (
                      <span style={{
                        padding: '6px 14px',
                        backgroundColor: '#bbf7d0',
                        color: '#14532d',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        📅 Scheduled {req?.scheduledDate ? `on ${new Date(req.scheduledDate).toLocaleDateString()} ${req.scheduledTime || ''}` : ''}
                      </span>
                    )}
                    {isPaid && reqStatus === 'rejected' && (
                      <span style={{
                        padding: '6px 14px',
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        ❌ Schedule Request Rejected
                      </span>
                    )}
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
                    {!isPaid && (payStatus === 'not_paid' || !payStatus) ? (
                      <button
                        onClick={() => handlePayAndSchedule(interview.id)}
                        style={{
                          flex: 1,
                          padding: '12px 20px',
                          backgroundColor: '#667eea',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}
                      >
                        💳 Pay & Schedule
                      </button>
                    ) : (payStatus === 'pending_verification' || payStatus === 'pending') ? (
                      <button
                        disabled
                        style={{
                          flex: 1,
                          padding: '12px 20px',
                          backgroundColor: '#e5e7eb',
                          color: '#6b7280',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'not-allowed',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}
                      >
                        ⏳ Awaiting Approval
                      </button>
                    ) : isPaid && !req ? (
                      <button
                        onClick={() => handleStartInterview(interview.id)}
                        style={{
                          flex: 1,
                          padding: '12px 20px',
                          backgroundColor: '#38a169',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}
                      >
                        📅 Request Interview
                      </button>
                    ) : reqStatus === 'pending' ? (
                      <button
                        disabled
                        style={{
                          flex: 1,
                          padding: '12px 20px',
                          backgroundColor: '#e0e7ff',
                          color: '#3730a3',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'not-allowed',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}
                      >
                        📨 Pending Scheduling
                      </button>
                    ) : (reqStatus === 'approved' || reqStatus === 'scheduled') ? (
                      <button
                        onClick={() => navigate(`/take-interview/${interview.id}`)}
                        style={{
                          flex: 1,
                          padding: '12px 20px',
                          backgroundColor: '#2563eb',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}
                      >
                        ▶️ Go to Interview
                      </button>
                    ) : reqStatus === 'rejected' ? (
                      <button
                        onClick={() => handleStartInterview(interview.id)}
                        style={{
                          flex: 1,
                          padding: '12px 20px',
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}
                      >
                        🔁 Reschedule
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default InterviewList;
