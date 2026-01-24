import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Layout from './Layout';

function PaymentStatus() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    loadExamStatuses();
  }, []);

  const loadExamStatuses = async () => {
    try {
      // Fetch all exams
      const examsResponse = await api.get('/exams');
      const allExams = examsResponse.data;

      // Fetch payment status for each exam
      const examStatuses = await Promise.all(
        allExams.map(async (exam) => {
          try {
            const statusResponse = await api.get(`/payments/status/${exam.id}/${user.id}`);
            console.log(`Exam ${exam.title} status:`, statusResponse.data);
            return {
              ...exam,
              paymentStatus: statusResponse.data.status,
              paid: statusResponse.data.paid,
              orderId: statusResponse.data.orderId
            };
          } catch (error) {
            return {
              ...exam,
              paymentStatus: 'not_paid',
              paid: false,
              orderId: null
            };
          }
        })
      );

      setExams(examStatuses);
    } catch (error) {
      console.error('Error loading exam statuses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status, paid) => {
    // Check specific statuses first
    if (status === 'pending_verification') {
      return {
        text: 'Pending for Approval',
        className: 'status-pending',
        color: '#f56565',
        signal: '🔴'
      };
    }
    if (status === 'pending') {
      return {
        text: 'Pending for Approval',
        className: 'status-pending',
        color: '#f56565',
        signal: '🔴'
      };
    }
    if (status === 'completed' || paid) {
      return {
        text: 'Approved - Take Exam Now',
        className: 'status-approved',
        color: '#38a169',
        signal: '🟢'
      };
    }
    if (status === 'rejected') {
      return {
        text: '❌ Rejected',
        className: 'status-rejected',
        color: '#e53e3e',
        signal: '🔴'
      };
    }
    // If not paid and no specific status, show Not Paid
    if (!paid) {
      return {
        text: '❌ Not Paid',
        className: 'status-not-paid',
        color: '#e53e3e',
        signal: '🔴'
      };
    }
    return {
      text: '❓ Unknown',
      className: 'status-unknown',
      color: '#718096',
      signal: '⚪'
    };
  };

  const handleAction = (exam) => {
    const statusBadge = getStatusBadge(exam.paymentStatus, exam.paid);
    
    if (statusBadge.text === '❌ Not Paid') {
      navigate(`/payment/${exam.id}`);
    } else if (statusBadge.text === 'Approved - Take Exam Now') {
      navigate(`/take-exam/${exam.id}`);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading">Loading exam statuses...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={styles.title}>📋 Exam Approval Status</h1>
            <p style={styles.subtitle}>
              Track your payment and approval status for all exams
            </p>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              loadExamStatuses();
            }}
            style={{
              padding: '12px 24px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🔄 Refresh Status
          </button>
        </div>

        <div style={styles.examGrid}>
          {exams.map((exam) => {
            const statusBadge = getStatusBadge(exam.paymentStatus, exam.paid);
            const canTakeExam = statusBadge.text === 'Approved - Take Exam Now';
            const canPay = statusBadge.text === '❌ Not Paid';
            const isPending = statusBadge.text === 'Pending for Approval';

            return (
              <div key={exam.id} style={styles.examCard}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.examTitle}>{exam.title}</h3>
                  <span
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: statusBadge.color
                    }}
                  >
                    {statusBadge.signal} {statusBadge.text}
                  </span>
                </div>

                <p style={styles.examDescription}>{exam.description}</p>

                <div style={styles.examMeta}>
                  <span>⏱️ {exam.duration} min</span>
                  <span>📝 {exam.total_marks} marks</span>
                  <span>❓ {exam.questions?.length || 0} questions</span>
                </div>

                <div style={styles.examDetails}>
                  <div style={styles.detailRow}>
                    <strong>Payment Amount:</strong>
                    <span style={{ color: '#38a169', fontWeight: '600' }}>₹200</span>
                  </div>
                  {exam.orderId && (
                    <div style={styles.detailRow}>
                      <strong>Order ID:</strong>
                      <span style={{ fontSize: '12px', color: '#4a5568' }}>
                        {exam.orderId}
                      </span>
                    </div>
                  )}
                  <div style={{ ...styles.detailRow, marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0', fontSize: '12px' }}>
                    <strong>Debug Info:</strong>
                    <span style={{ color: '#718096' }}>
                      Status: {exam.paymentStatus || 'null'} | Paid: {exam.paid ? 'true' : 'false'}
                    </span>
                  </div>
                </div>

                <div style={styles.cardActions}>
                  {canPay && (
                    <button
                      onClick={() => handleAction(exam)}
                      style={styles.btnPrimary}
                    >
                      💳 Pay ₹200
                    </button>
                  )}
                  {isPending && (
                    <button
                      style={styles.btnDisabled}
                      disabled
                    >
                      ⏳ Awaiting Admin Approval
                    </button>
                  )}
                  {canTakeExam && (
                    <button
                      onClick={() => handleAction(exam)}
                      style={styles.btnSuccess}
                    >
                      🎯 Start Exam
                    </button>
                  )}
                  {statusBadge.text === '❌ Rejected' && (
                    <button
                      onClick={() => navigate(`/payment/${exam.id}`)}
                      style={styles.btnSecondary}
                    >
                      🔄 Retry Payment
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {exams.length === 0 && (
          <div style={styles.emptyState}>
            <p style={{ fontSize: '48px' }}>📭</p>
            <p style={{ fontSize: '18px', color: '#4a5568' }}>
              No exams available at the moment
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: '8px'
  },
  subtitle: {
    fontSize: '16px',
    color: '#718096',
    marginBottom: '30px'
  },
  examGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '24px',
    marginTop: '20px'
  },
  examCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'default',
    border: '1px solid #e2e8f0'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
    gap: '12px'
  },
  examTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#2d3748',
    margin: 0,
    flex: 1
  },
  statusBadge: {
    padding: '6px 14px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '13px',
    fontWeight: '600',
    whiteSpace: 'nowrap'
  },
  examDescription: {
    fontSize: '14px',
    color: '#4a5568',
    marginBottom: '16px',
    lineHeight: '1.6'
  },
  examMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '14px',
    color: '#718096',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e2e8f0'
  },
  examDetails: {
    backgroundColor: '#f7fafc',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '14px',
    color: '#2d3748'
  },
  cardActions: {
    display: 'flex',
    gap: '10px'
  },
  btnPrimary: {
    flex: 1,
    padding: '12px 20px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#5568d3'
    }
  },
  btnSuccess: {
    flex: 1,
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #38a169, #2f855a)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  btnSecondary: {
    flex: 1,
    padding: '12px 20px',
    backgroundColor: '#4299e1',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  btnDisabled: {
    flex: 1,
    padding: '12px 20px',
    backgroundColor: '#cbd5e0',
    color: '#718096',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'not-allowed',
    opacity: 0.7
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#718096'
  }
};

export default PaymentStatus;
