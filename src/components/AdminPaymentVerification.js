import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from './Layout';
import './AdminPaymentVerification.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function AdminPaymentVerification() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [error, setError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [adminRemarks, setAdminRemarks] = useState('');

  useEffect(() => {
    fetchPendingPayments();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPendingPayments, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/payments/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data.payments || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to load pending payments');
      setLoading(false);
    }
  };

  const handleApprove = async (paymentId) => {
    if (!window.confirm('Are you sure you want to approve this payment?')) {
      return;
    }

    setProcessing(paymentId);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/admin/payments/approve`, {
        orderId: paymentId,
        adminRemarks: adminRemarks || 'Payment verified and approved'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('✅ Payment approved successfully!');
      setAdminRemarks('');
      setSelectedPayment(null);
      fetchPendingPayments();
    } catch (err) {
      console.error('Error approving payment:', err);
      alert('Failed to approve payment: ' + (err.response?.data?.message || err.message));
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (paymentId) => {
    const reason = window.prompt('Enter rejection reason:');
    if (!reason) return;

    setProcessing(paymentId);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/admin/payments/reject`, {
        orderId: paymentId,
        adminRemarks: reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('❌ Payment rejected');
      setSelectedPayment(null);
      fetchPendingPayments();
    } catch (err) {
      console.error('Error rejecting payment:', err);
      alert('Failed to reject payment: ' + (err.response?.data?.message || err.message));
    } finally {
      setProcessing(null);
    }
  };

  const viewPaymentDetails = (payment) => {
    setSelectedPayment(payment);
    setAdminRemarks('');
  };

  if (loading) {
    return (
      <Layout>
        <div className="admin-payment-container">
          <div className="loading-spinner">Loading payments...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="admin-payment-container">
      <div className="admin-payment-header">
        <h1>💳 Payment Verification Dashboard</h1>
        <p>Review and approve student payment proofs</p>
        <button 
          className="btn-refresh" 
          onClick={fetchPendingPayments}
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      <div className="payment-stats">
        <div className="stat-card">
          <div className="stat-value">{payments.length}</div>
          <div className="stat-label">Pending Verifications</div>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="no-payments">
          <p>✅ No pending payments to verify</p>
        </div>
      ) : (
        <div className="payments-grid">
          {payments.map((payment) => (
            <div key={payment._id} className="payment-card">
              <div className="payment-card-header">
                <h3>{payment.examDetails?.title || 'Exam'}</h3>
                <span className="payment-status pending">Pending</span>
              </div>

              <div className="payment-details">
                <div className="detail-row">
                  <span className="label">Student:</span>
                  <span className="value">{payment.userDetails?.name || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Email:</span>
                  <span className="value">{payment.userDetails?.email || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Amount:</span>
                  <span className="value">₹{payment.amount}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Order ID:</span>
                  <span className="value">{payment.order_id || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Transaction ID:</span>
                  <span className="value">{payment.transaction_id || 'Not provided'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">UPI ID:</span>
                  <span className="value">{payment.upi_id || 'Not provided'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Payment Method:</span>
                  <span className="value">{payment.paymentMethod || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Submitted:</span>
                  <span className="value">
                    {new Date(payment.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {payment.screenshot && (
                <div className="payment-screenshot">
                  <h4>Payment Screenshot:</h4>
                  <a 
                    href={`${API_URL.replace('/api', '')}/${payment.screenshot}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <img 
                      src={`${API_URL.replace('/api', '')}/${payment.screenshot}`} 
                      alt="Payment Proof" 
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <p style={{ display: 'none' }}>Click to view file</p>
                  </a>
                </div>
              )}

              <div className="payment-actions">
                <button
                  className="btn-approve"
                  onClick={() => handleApprove(payment.order_id)}
                  disabled={processing === payment.order_id}
                >
                  {processing === payment.order_id ? 'Processing...' : '✅ Approve'}
                </button>
                <button
                  className="btn-reject"
                  onClick={() => handleReject(payment.order_id)}
                  disabled={processing === payment.order_id}
                >
                  {processing === payment.order_id ? 'Processing...' : '❌ Reject'}
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

export default AdminPaymentVerification;
