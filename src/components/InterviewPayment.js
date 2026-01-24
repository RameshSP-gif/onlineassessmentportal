import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from './Layout';
import './Payment.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

function InterviewPayment() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [currentOrderId, setCurrentOrderId] = useState('');
  const [pollingInterval, setPollingInterval] = useState(null);
  const [qrIndex, setQrIndex] = useState(0);
  const [qrFailed, setQrFailed] = useState(false);

  const qrSources = useMemo(() => {
    const root = process.env.PUBLIC_URL || '';
    // Try explicit root path then plain path as a fallback. Add a final data URL guard so UI never stays blank.
    return [
      `${root}/phonepe-qr.jpg`,
      '/phonepe-qr.jpg',
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320"%3E%3Crect width="320" height="320" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23667eea" font-family="Arial" font-size="16"%3EQR unavailable%3C/text%3E%3Ctext x="50%25" y="60%25" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-family="Arial" font-size="12"%3EUse UPI ID below%3C/text%3E%3C/svg%3E'
    ];
  }, []);

  useEffect(() => {
    initializePayment();
    loadCourse();
    checkPaymentStatus();
    
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [courseId]);

  const initializePayment = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const orderResponse = await axios.post(`${API_URL}/interview-payments/create-order`, {
        courseId,
        userId: user.id
      });
      setCurrentOrderId(orderResponse.data.orderId);
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const loadCourse = async () => {
    try {
      const response = await axios.get(`${API_URL}/interview-courses/${courseId}`);
      setCourse(response.data);
    } catch (error) {
      console.error('Error loading course:', error);
      setError('Failed to load interview details');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await axios.get(`${API_URL}/interview-payments/status/${courseId}/${user.id}`);
      
      if (response.data.paid) {
        navigate(`/take-interview/${courseId}`);
      }
    } catch (error) {
      console.error('Error checking payment:', error);
    }
  };

  const handlePaymentSubmit = async () => {
    console.log('Submit button clicked');
    console.log('currentOrderId:', currentOrderId);
    console.log('screenshot:', screenshot);
    
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
      
      const formData = new FormData();
      formData.append('screenshot', screenshot);
      formData.append('orderId', currentOrderId);
      formData.append('courseId', courseId);
      formData.append('userId', user.id);
      formData.append('transactionId', 'Not provided');
      formData.append('upiId', 'Not provided');
      
      console.log('Sending request to:', `${API_URL}/interview-payments/upload-screenshot`);
      
      const uploadResponse = await axios.post(`${API_URL}/interview-payments/upload-screenshot`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Upload response:', uploadResponse.data);
      
      if (uploadResponse.data.success) {
        setPaymentMessage('✅ Payment proof submitted! Awaiting admin verification...');
        setProcessing(false);
        
        // Redirect after 3 seconds
        setTimeout(() => {
          navigate('/interviews');
        }, 3000);
      }
    } catch (error) {
      console.error('Payment error:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.error || 'Failed to upload screenshot. Please try again.');
      setProcessing(false);
      setPaymentMessage('');
    }
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Screenshot size must be less than 5MB');
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only images (JPEG, PNG, GIF) and PDF files are allowed');
        return;
      }
      
      setScreenshot(file);
      setError('');
      
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
            <h2>💳 Interview Payment</h2>
            {course && <span className="exam-title-compact">{course.title}</span>}
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          <div className="qr-code-section-compact">
            <div className="qr-card">
              <h3>Scan & Pay ₹200</h3>
              <div className="qr-image-container">
                <img 
                  src={qrSources[qrIndex]}
                  alt="UPI Payment QR Code"
                  className="qr-image"
                  onError={() => {
                    if (qrIndex < qrSources.length - 1) {
                      setQrIndex((idx) => idx + 1);
                    } else {
                      setQrFailed(true);
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn-download"
                  onClick={() => window.open('/phonepe-qr.jpg', '_blank')}
                  style={{ marginTop: '10px' }}
                >
                  ⬇️ Download QR (opens new tab)
                </button>
                {qrFailed && (
                  <div className="qr-fallback-text">
                    QR image fallback shown. If you still can't see it, use the UPI ID below or download the QR.
                  </div>
                )}
              </div>
              <p className="merchant-info">Pay to: RAMESH S P</p>
              <p className="upi-note">Use any UPI app to scan & pay. UPI ID: <strong>rameshsp@ybl</strong></p>
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
              disabled={processing || !screenshot}
              style={{ opacity: (processing || !screenshot) ? 0.6 : 1 }}
            >
              {processing ? 'Submitting...' : 'Submit for Verification'}
            </button>
            <button 
              className="btn-cancel"
              onClick={() => navigate('/interviews')}
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

export default InterviewPayment;
