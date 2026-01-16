import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Layout from './Layout';
import './Payment.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function Payment() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [exam, setExam] = useState(null);
  const [error, setError] = useState('');
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');

  useEffect(() => {
    checkPaymentStatus();
    loadExam();
    initializePayment();
    
    return () => {
      // Clean up polling on unmount
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [examId]);

  const initializePayment = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const orderResponse = await axios.post(`${API_URL}/payments/create-order`, {
        examId,
        userId: user.id
      });
      setCurrentOrderId(orderResponse.data.orderId);
    } catch (error) {
      console.error('Error creating order:', error);
      // Silent initialization - no need to show error
    }
  };

  const loadExam = async () => {
    try {
      const response = await axios.get(`${API_URL}/exams/${examId}`);
      setExam(response.data);
    } catch (error) {
      console.error('Error loading exam:', error);
      setError('Failed to load exam details');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await axios.get(`${API_URL}/payments/status/${examId}/${user.id}`);
      
      if (response.data.paid) {
        // Already paid, redirect to exam
        navigate(`/take-exam/${examId}`);
      }
    } catch (error) {
      console.error('Error checking payment:', error);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!currentOrderId) {
      setError('Please wait for payment system to initialize');
      return;
    }
    
    if (!screenshot) {
      setError('Please upload payment screenshot');
      return;
    }
    
    setProcessing(true);
    setError('');
    setPaymentMessage('📤 Uploading payment proof...');
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Upload screenshot
      const formData = new FormData();
      formData.append('screenshot', screenshot);
      formData.append('orderId', currentOrderId);
      formData.append('examId', examId);
      formData.append('userId', user.id);
      formData.append('transactionId', 'Not provided');
      formData.append('upiId', 'Not provided');
      
      const uploadResponse = await axios.post(`${API_URL}/payments/upload-screenshot`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (uploadResponse.data.success) {
        setPaymentMessage('✅ Payment proof submitted! Awaiting admin verification...');
        setProcessing(false);
        
        // Start polling for admin approval
        startAdminApprovalPolling(currentOrderId);
      }
    } catch (error) {
      console.error('UPI payment error:', error);
      setError(error.response?.data?.error || 'Failed to upload screenshot. Please try again.');
      setProcessing(false);
      setPaymentMessage('');
    }
  };

  const startAdminApprovalPolling = (orderId) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_URL}/payments/poll/${orderId}`);
        
        if (response.data.status === 'completed') {
          clearInterval(interval);
          setPaymentMessage('✅ Payment verified by admin! Redirecting to exam...');
          setTimeout(() => {
            navigate(`/take-exam/${examId}`);
          }, 2000);
        } else if (response.data.status === 'rejected') {
          clearInterval(interval);
          setPaymentMessage('❌ Payment rejected. Please contact support or try again.');
          setProcessing(false);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000); // Poll every 3 seconds
    
    setPollingInterval(interval);
  };
  
  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Screenshot size must be less than 5MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only images (JPEG, PNG, GIF) and PDF files are allowed');
        return;
      }
      
      setScreenshot(file);
      setError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="payment-container">
          <div className="loading">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="payment-container">
      <div className="payment-card">
        <div className="payment-header-compact">
          <h2>💳 Exam Payment</h2>
          {exam && <span className="exam-title-compact">{exam.title}</span>}
        </div>

        {error && (
          <div className="error-message">{error}</div>
        )}

        <div className="qr-code-section-compact">
          <div className="qr-card">
            <h3>Scan & Pay ₹200</h3>
            <div className="qr-image-container">
              <img 
                src="/phonepe-qr.jpg" 
                alt="UPI Payment QR Code"
                className="qr-image"
              />
            </div>
            <p className="merchant-info">Pay to: RAMESH S P</p>
            <p className="upi-note">Use any UPI app to scan & pay</p>
          </div>
        </div>

        {paymentMessage && (
          <div className={`payment-status-message ${paymentMessage.includes('✅') ? 'success' : paymentMessage.includes('⚠️') || paymentMessage.includes('❌') ? 'warning' : 'info'}`}>
            {paymentMessage}
          </div>
        )}

        <div className="upload-section-compact">
          <label className="upload-label">📤 Upload Payment Screenshot</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleScreenshotChange}
            disabled={processing}
            className="file-input-compact"
          />
          {screenshotPreview && (
            <div className="screenshot-preview-compact">
              <img src={screenshotPreview} alt="Payment Screenshot" />
            </div>
          )}
        </div>

        <div className="payment-actions-compact">
          <button 
            className="btn-submit"
            onClick={handlePaymentSubmit}
            disabled={processing || !currentOrderId || !screenshot}
          >
            {processing ? 'Submitting...' : 'Submit for Verification'}
          </button>
          <button 
            className="btn-cancel"
            onClick={() => navigate('/exams')}
            disabled={processing}
          >
            Cancel
          </button>
        </div>

        <p className="verify-note">Admin will verify & approve within 5 minutes</p>
      </div>
      </div>
    </Layout>
  );
}

export default Payment;
