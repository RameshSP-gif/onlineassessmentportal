import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from './Layout';
import './Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function InterviewStatus() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadInterviewStatuses();
  }, []);

  const loadInterviewStatuses = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/interview-courses`);
      const allInterviews = response.data;

      const user = JSON.parse(localStorage.getItem('user'));
      
      const interviewStatuses = await Promise.all(
        allInterviews.map(async (interview) => {
          try {
            const statusResponse = await axios.get(
              `${API_URL}/interview-payments/status/${interview.id}/${user.id}`
            );
            console.log(`Interview ${interview.title} status:`, statusResponse.data);
            return {
              ...interview,
              paymentStatus: statusResponse.data.status,
              paid: statusResponse.data.paid,
              orderId: statusResponse.data.orderId
            };
          } catch (error) {
            return {
              ...interview,
              paymentStatus: 'not_paid',
              paid: false,
              orderId: null
            };
          }
        })
      );

      setInterviews(interviewStatuses);
    } catch (error) {
      console.error('Error loading interview statuses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (interview) => {
    if (interview.paid) {
      return (
        <span className="badge badge-success" style={{ fontSize: '14px', padding: '8px 16px' }}>
          ✅ Approved - Ready to Interview
        </span>
      );
    } else if (interview.paymentStatus === 'pending_verification') {
      return (
        <span className="badge" style={{ 
          fontSize: '14px', 
          padding: '8px 16px',
          background: '#f59e0b',
          color: 'white'
        }}>
          ⏳ Payment Pending Admin Approval
        </span>
      );
    } else if (interview.paymentStatus === 'rejected') {
      return (
        <span className="badge" style={{ 
          fontSize: '14px', 
          padding: '8px 16px',
          background: '#ef4444',
          color: 'white'
        }}>
          ❌ Payment Rejected
        </span>
      );
    } else {
      return (
        <span className="badge" style={{ 
          fontSize: '14px', 
          padding: '8px 16px',
          background: '#6b7280',
          color: 'white'
        }}>
          💰 Not Paid
        </span>
      );
    }
  };

  const handleAction = (interview) => {
    if (interview.paid) {
      navigate(`/take-interview/${interview.id}`);
    } else {
      navigate(`/interview-payment/${interview.id}`);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="exam-list-content">
          <p style={{ textAlign: 'center', padding: '40px' }}>Loading interview payment status...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="exam-list-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1>Interview Payment Status</h1>
            <p style={{ color: '#718096', marginTop: '8px' }}>
              Track your interview payment and approval status
            </p>
          </div>
          <button
            onClick={loadInterviewStatuses}
            style={{
              padding: '10px 20px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🔄 Refresh Status
          </button>
        </div>

        {interviews.length === 0 ? (
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <p style={{ fontSize: '18px', color: '#718096' }}>No interviews available</p>
          </div>
        ) : (
          <div className="grid grid-2">
            {interviews.map((interview) => (
              <div key={interview.id} className="card" style={{ background: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, flex: 1 }}>{interview.title}</h3>
                  {getStatusBadge(interview)}
                </div>
                
                <p style={{ color: '#718096', margin: '10px 0', fontSize: '14px' }}>
                  {interview.description}
                </p>
                
                <div style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  marginTop: '15px',
                  paddingTop: '15px',
                  borderTop: '1px solid #e2e8f0'
                }}>
                  <span className="badge badge-info">⏱️ {interview.duration} mins</span>
                  <span className="badge badge-info">❓ {interview.questions} questions</span>
                  <span className="badge badge-warning">💰 ₹{interview.fee}</span>
                </div>

                {interview.orderId && (
                  <div style={{
                    marginTop: '12px',
                    padding: '10px',
                    background: '#f7fafc',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#4a5568'
                  }}>
                    <strong>Order ID:</strong> {interview.orderId}
                  </div>
                )}

                <div style={{ marginTop: '15px' }}>
                  {interview.paid ? (
                    <button
                      onClick={() => handleAction(interview)}
                      className="btn btn-success"
                      style={{ width: '100%' }}
                    >
                      🎤 Start Interview
                    </button>
                  ) : interview.paymentStatus === 'pending_verification' ? (
                    <button
                      className="btn"
                      style={{ 
                        width: '100%',
                        background: '#f59e0b',
                        color: 'white',
                        cursor: 'not-allowed'
                      }}
                      disabled
                    >
                      ⏳ Awaiting Admin Approval
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction(interview)}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      💳 Pay Now (₹200)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default InterviewStatus;
