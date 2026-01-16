import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from './Layout';
import './Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function InterviewList() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentStatuses, setPaymentStatuses] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    try {
      const response = await axios.get(`${API_URL}/interview-courses`);
      setInterviews(response.data);
      
      // Load payment status for each interview
      const user = JSON.parse(localStorage.getItem('user'));
      const statuses = {};
      
      for (const interview of response.data) {
        try {
          const paymentRes = await axios.get(`${API_URL}/interview-payments/status/${interview.id}/${user.id}`);
          console.log(`Payment status for ${interview.title}:`, paymentRes.data);
          statuses[interview.id] = paymentRes.data;
        } catch (error) {
          console.error(`Error fetching payment for ${interview.title}:`, error);
          statuses[interview.id] = { paid: false, status: 'not_paid' };
        }
      }
      
      setPaymentStatuses(statuses);
    } catch (error) {
      console.error('Error loading interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTakeInterview = (interviewId) => {
    const status = paymentStatuses[interviewId];
    
    if (!status || !status.paid) {
      // Redirect to payment page
      navigate(`/interview-payment/${interviewId}`);
    } else {
      // Proceed to interview
      navigate(`/take-interview/${interviewId}`);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="exam-list-content">
          <p style={{ textAlign: 'center', padding: '40px' }}>Loading interviews...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="exam-list-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>Available Interviews</h1>
          <button
            onClick={() => {
              setLoading(true);
              loadInterviews();
            }}
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
            🔄 Refresh
          </button>
        </div>

        {interviews.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#718096', padding: '40px' }}>
            No interviews available at the moment.
          </p>
        ) : (
          <div className="grid grid-2">
            {interviews.map((interview) => {
              const paymentStatus = paymentStatuses[interview.id];
              const isPaid = paymentStatus?.paid;
              const status = paymentStatus?.status;
              
              return (
                <div key={interview.id} className="card" style={{ background: '#f7fafc' }}>
                  <h3>{interview.title}</h3>
                  <p style={{ color: '#718096', margin: '10px 0' }}>{interview.description}</p>
                  <div className="flex-between mt-20">
                    <div>
                      <span className="badge badge-info">⏱️ {interview.duration} mins</span>
                      <span className="badge badge-success" style={{ marginLeft: '10px' }}>
                        ❓ {interview.questions} questions
                      </span>
                      {!isPaid && (
                        <span className="badge" style={{ 
                          marginLeft: '10px', 
                          background: '#fbbf24', 
                          color: 'white' 
                        }}>
                          💰 Pay ₹200
                        </span>
                      )}
                      {status === 'pending_verification' && (
                        <span className="badge" style={{ 
                          marginLeft: '10px', 
                          background: '#f59e0b', 
                          color: 'white' 
                        }}>
                          ⏳ Pending Approval
                        </span>
                      )}
                      {isPaid && (
                        <span className="badge badge-success" style={{ marginLeft: '10px' }}>
                          ✅ Approved
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-20">
                    {isPaid ? (
                      <button
                        onClick={() => handleTakeInterview(interview.id)}
                        className="btn btn-success"
                        style={{ width: '100%' }}
                      >
                        🎤 Start Interview
                      </button>
                    ) : (
                      <button
                        onClick={() => handleTakeInterview(interview.id)}
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                      >
                        💳 Pay & Schedule
                      </button>
                    )}
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
