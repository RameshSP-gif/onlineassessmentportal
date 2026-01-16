import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from './Layout';
import './AdminDashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function AdminInterviewPayments() {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    loadPendingPayments();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadPendingPayments, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadPendingPayments = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/interview-payments/pending`);
      setPendingPayments(response.data);
    } catch (error) {
      console.error('Error loading pending payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (orderId) => {
    if (!window.confirm('Approve this interview payment?')) return;
    
    setProcessing({ ...processing, [orderId]: true });
    try {
      await axios.post(`${API_URL}/admin/interview-payments/approve`, { orderId });
      alert('Interview payment approved successfully!');
      loadPendingPayments();
    } catch (error) {
      alert('Failed to approve payment: ' + error.message);
    } finally {
      setProcessing({ ...processing, [orderId]: false });
    }
  };

  const handleReject = async (orderId) => {
    const reason = window.prompt('Enter rejection reason:');
    if (!reason) return;
    
    setProcessing({ ...processing, [orderId]: true });
    try {
      await axios.post(`${API_URL}/admin/interview-payments/reject`, { orderId, reason });
      alert('Interview payment rejected');
      loadPendingPayments();
    } catch (error) {
      alert('Failed to reject payment: ' + error.message);
    } finally {
      setProcessing({ ...processing, [orderId]: false });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="admin-container">
          <div className="loading">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="admin-container">
        <div className="admin-header">
          <h1>💳 Interview Payment Verification</h1>
          <p>Review and approve interview payment submissions</p>
          <button className="btn btn-primary" onClick={loadPendingPayments}>
            🔄 Refresh
          </button>
        </div>

        {pendingPayments.length === 0 ? (
          <div className="alert alert-info">
            <h3>✅ All Clear!</h3>
            <p>No pending interview payments to review at this time.</p>
          </div>
        ) : (
          <div className="payments-grid">
            {pendingPayments.map((payment) => (
              <div key={payment.id} className="payment-card">
                <div className="payment-header">
                  <h3>{payment.courseTitle}</h3>
                  <span className="badge badge-warning">Pending</span>
                </div>
                
                <div className="payment-details">
                  <div className="detail-row">
                    <span className="label">Student:</span>
                    <span className="value">{payment.username}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Email:</span>
                    <span className="value">{payment.userEmail}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Order ID:</span>
                    <span className="value">{payment.orderId}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Amount:</span>
                    <span className="value">₹{payment.amount}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Submitted:</span>
                    <span className="value">
                      {new Date(payment.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {payment.screenshot && (
                  <div className="screenshot-preview">
                    <p><strong>Payment Screenshot:</strong></p>
                    <img 
                      src={`http://localhost:5001${payment.screenshot}`} 
                      alt="Payment proof" 
                      style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #ddd' }}
                    />
                  </div>
                )}

                <div className="payment-actions">
                  <button
                    className="btn btn-success"
                    onClick={() => handleApprove(payment.orderId)}
                    disabled={processing[payment.orderId]}
                  >
                    {processing[payment.orderId] ? '⏳ Processing...' : '✅ Approve'}
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleReject(payment.orderId)}
                    disabled={processing[payment.orderId]}
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default AdminInterviewPayments;
