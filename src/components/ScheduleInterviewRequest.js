import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import Layout from './Layout';
import './Dashboard.css';

function ScheduleInterviewRequest() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [interview, setInterview] = useState(null);
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadInterviewDetails();
  }, [courseId]);

  const loadInterviewDetails = async () => {
    try {
      const response = await api.get(`/interview-courses/${courseId}`);
      setInterview(response.data);
    } catch (error) {
      console.error('Error loading interview:', error);
      setError('Failed to load interview details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    
    if (!proposedDate || !proposedTime) {
      setError('Please select a date and time');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/interview-requests', {
        courseId,
        userId: user.id,
        proposedDate,
        proposedTime,
        notes,
        status: 'pending'
      });

      setSuccessMessage('Interview request submitted successfully! Admin will review and confirm shortly.');
      
      setTimeout(() => {
        navigate('/interview-list');
      }, 2000);
    } catch (error) {
      console.error('Error submitting request:', error);
      setError(error.response?.data?.message || 'Failed to submit interview request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>Loading interview details...</p>
        </div>
      </Layout>
    );
  }

  if (!interview) {
    return (
      <Layout>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>Interview not found</p>
          <button onClick={() => navigate('/interview-list')} className="btn btn-primary">
            Back to Interviews
          </button>
        </div>
      </Layout>
    );
  }

  // Calculate min date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <Layout>
      <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
          <button
            onClick={() => navigate('/interview-list')}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#e5e7eb',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ←
          </button>
          <div>
            <h1 style={{ margin: '0 0 5px 0' }}>📅 Request Interview</h1>
            <p style={{ color: '#718096', margin: '0' }}>{interview.title}</p>
          </div>
        </div>

        {successMessage && (
          <div style={{
            padding: '15px 20px',
            backgroundColor: '#dcfce7',
            color: '#166534',
            borderRadius: '8px',
            marginBottom: '20px',
            borderLeft: '4px solid #22c55e'
          }}>
            ✅ {successMessage}
          </div>
        )}

        {error && (
          <div style={{
            padding: '15px 20px',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            borderRadius: '8px',
            marginBottom: '20px',
            borderLeft: '4px solid #ef4444'
          }}>
            ❌ {error}
          </div>
        )}

        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          {/* Interview Info */}
          <div style={{
            padding: '20px',
            backgroundColor: '#f0f4ff',
            borderRadius: '10px',
            marginBottom: '30px',
            borderLeft: '4px solid #667eea'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <p style={{ margin: '0 0 5px 0', color: '#718096', fontSize: '12px', fontWeight: '600' }}>
                  INTERVIEW TYPE
                </p>
                <p style={{ margin: '0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                  {interview.type === 'ai' ? '🤖 AI-Powered' : '👤 Human Interview'}
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 5px 0', color: '#718096', fontSize: '12px', fontWeight: '600' }}>
                  DURATION
                </p>
                <p style={{ margin: '0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                  {interview.duration || 30} minutes
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 5px 0', color: '#718096', fontSize: '12px', fontWeight: '600' }}>
                  QUESTIONS
                </p>
                <p style={{ margin: '0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                  {interview.questions?.length || 3} questions
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 5px 0', color: '#718096', fontSize: '12px', fontWeight: '600' }}>
                  FEE
                </p>
                <p style={{ margin: '0', fontSize: '16px', fontWeight: '600', color: '#38a169' }}>
                  ₹{interview.price || 200}
                </p>
              </div>
            </div>
          </div>

          {/* Schedule Form */}
          <form onSubmit={handleSubmitRequest}>
            <div style={{ marginBottom: '25px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#1f2937'
              }}>
                📅 Proposed Date
              </label>
              <input
                type="date"
                value={proposedDate}
                onChange={(e) => setProposedDate(e.target.value)}
                min={today}
                required
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
              <p style={{ margin: '5px 0 0 0', color: '#718096', fontSize: '12px' }}>
                Select a date from today onwards
              </p>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#1f2937'
              }}>
                🕐 Proposed Time
              </label>
              <input
                type="time"
                value={proposedTime}
                onChange={(e) => setProposedTime(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
              <p style={{ margin: '5px 0 0 0', color: '#718096', fontSize: '12px' }}>
                Choose a time between 9:00 AM - 6:00 PM
              </p>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#1f2937'
              }}>
                💬 Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requirements or notes for the interviewer..."
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  minHeight: '100px',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{
              padding: '20px',
              backgroundColor: '#fef3c7',
              borderRadius: '8px',
              marginBottom: '25px',
              borderLeft: '4px solid #f59e0b'
            }}>
              <p style={{ margin: '0', color: '#92400e', fontSize: '14px' }}>
                ℹ️ <strong>Note:</strong> Your request will be reviewed by the admin. You'll receive a notification once your interview is scheduled.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  backgroundColor: submitting ? '#d1d5db' : '#38a169',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '16px'
                }}
              >
                {submitting ? '⏳ Submitting...' : '✅ Submit Request'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/interview-list')}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  backgroundColor: '#e5e7eb',
                  color: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '16px'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

export default ScheduleInterviewRequest;
