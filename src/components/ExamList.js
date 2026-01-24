import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exams } from '../api';
import axios from 'axios';
import Layout from './Layout';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function ExamList() {
  const [examList, setExamList] = useState([]);
  const [paymentStatuses, setPaymentStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const response = await exams.getAll();
      setExamList(response.data);
      
      // Load payment status for each exam
      const user = JSON.parse(localStorage.getItem('user'));
      const statuses = {};
      
      for (const exam of response.data) {
        try {
          const paymentRes = await axios.get(`${API_URL}/payments/status/${exam.id}/${user.id}`);
          console.log(`Payment status for ${exam.title}:`, paymentRes.data);
          statuses[exam.id] = paymentRes.data;
        } catch (error) {
          console.error(`Error fetching payment for ${exam.title}:`, error);
          statuses[exam.id] = { paid: false, status: 'not_paid' };
        }
      }
      
      setPaymentStatuses(statuses);
    } catch (error) {
      console.error('Error loading exams:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Layout><div className="loading">Loading exams...</div></Layout>;
  }

  return (
    <Layout>
      <div className="exam-list-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>Available Exams</h1>
          <button
            onClick={() => {
              setLoading(true);
              loadExams();
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

        {examList.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#718096', padding: '40px' }}>
            No exams available at the moment.
          </p>
        ) : (
          <div className="grid grid-2">
              {examList.map((exam) => {
                const paymentStatus = paymentStatuses[exam.id];
                const isPaid = paymentStatus?.paid;
                const status = paymentStatus?.status;
                
                return (
                  <div key={exam.id} className="card" style={{ background: '#f7fafc' }}>
                    <h3>{exam.title}</h3>
                    <p style={{ color: '#718096', margin: '10px 0' }}>{exam.description}</p>
                    <div className="flex-between mt-20">
                      <div>
                        <span className="badge badge-info">⏱️ {exam.duration} mins</span>
                        <span className="badge badge-success" style={{ marginLeft: '10px' }}>
                          📝 {exam.total_marks} marks
                        </span>
                        {!isPaid && (
                          <span className="badge" style={{ 
                            marginLeft: '10px', 
                            background: '#fbbf24', 
                            color: '#78350f' 
                          }}>
                            💰 ₹200
                          </span>
                        )}
                        {(status === 'pending_verification' || status === 'pending') && (
                          <span className="badge" style={{ 
                            marginLeft: '10px', 
                            background: '#3b82f6', 
                            color: 'white' 
                          }}>
                            {status === 'pending' ? '⏳ Pending (Upload/Verify)' : '⏳ Pending Approval'}
                          </span>
                        )}
                        {isPaid && (
                          <span className="badge" style={{ 
                            marginLeft: '10px', 
                            background: '#10b981', 
                            color: 'white' 
                          }}>
                            ✅ Approved
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          if (isPaid) {
                            navigate(`/take-exam/${exam.id}`);
                          } else {
                            navigate(`/payment/${exam.id}`);
                          }
                        }}
                        className="btn btn-primary"
                        disabled={status === 'pending_verification' || status === 'pending'}
                      >
                        {status === 'pending_verification'
                          ? 'Awaiting Approval'
                          : status === 'pending'
                          ? 'Pending (Upload/Verify)'
                          : isPaid
                          ? 'Start Exam'
                          : 'Pay & Start'}
                      </button>
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

export default ExamList;
