import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import Layout from './Layout';
import './Payment.css';

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
      const orderResponse = await api.post('/payments/create-order', {
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
      const response = await api.get(`/exams/${examId}`);
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
      const response = await api.get(`/payments/status/${examId}/${user.id}`);
      
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
      
      console.log('Submitting payment proof for order:', currentOrderId);
      
      const uploadResponse = await api.post('/payments/upload-screenshot', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Upload response:', uploadResponse.data);
      
      if (uploadResponse.data.success) {
        // Show success message
        setPaymentMessage('✅ Payment proof submitted successfully! Admin will verify & approve within 5 minutes.');
        
        // Show browser alert for confirmation
        alert('✅ Success!\n\nYour payment proof has been submitted for verification.\n\nAdmin will review and approve within 5 minutes.\n\nYou will be automatically redirected once approved.');
        
        // Keep processing true while waiting for approval
        // Start polling for admin approval
        startAdminApprovalPolling(currentOrderId);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Payment submission error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to upload screenshot. Please try again.';
      setError(errorMsg);
      setProcessing(false);
      setPaymentMessage('');
      alert('❌ Upload Failed\n\n' + errorMsg);
    }
  };

  const startAdminApprovalPolling = (orderId) => {
    console.log('Starting admin approval polling for order:', orderId);
    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/payments/poll/${orderId}`);
        console.log('Polling response:', response.data);
        
        if (response.data.status === 'completed') {
          clearInterval(interval);
          setPaymentMessage('✅ Payment verified by admin! Redirecting to exam...');
          alert('✅ Payment Approved!\n\nYour payment has been verified by the admin.\n\nRedirecting to exam now...');
          setTimeout(() => {
            navigate(`/take-exam/${examId}`);
          }, 2000);
        } else if (response.data.status === 'rejected') {
          clearInterval(interval);
          setPaymentMessage('❌ Payment rejected. Please contact support or try again.');
          setProcessing(false);
          alert('❌ Payment Rejected\n\nYour payment proof was rejected.\n\nPlease contact support or submit again with correct details.');
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
