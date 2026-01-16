import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from './Layout';
import './TakeExam.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function TakeInterview() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [recording, setRecording] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    checkPaymentAndLoadInterview();
    
    return () => {
      stopCamera();
    };
  }, [courseId]);

  const checkPaymentAndLoadInterview = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Check payment status
      const paymentResponse = await axios.get(`${API_URL}/interview-payments/status/${courseId}/${user.id}`);
      
      if (!paymentResponse.data.paid) {
        alert('Payment required to take this interview!');
        navigate(`/interview-payment/${courseId}`);
        return;
      }
      
      // Payment verified, load interview
      loadInterview();
      startCamera();
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to verify payment status');
      navigate('/interviews');
    }
  };

  const loadInterview = async () => {
    try {
      const response = await axios.get(`${API_URL}/interview-courses/${courseId}`);
      setCourse(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading interview:', error);
      alert('Failed to load interview');
      navigate('/interviews');
    }
  };

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Your browser does not support camera access');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      setVideoStream(stream);
      setPermissionGranted(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError('Failed to access camera. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
  };

  const handleStartRecording = () => {
    setRecording(true);
  };

  const handleStopRecording = () => {
    setRecording(false);
  };

  const handleNextQuestion = () => {
    if (course && currentQuestion < course.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setRecording(false);
    } else {
      handleCompleteInterview();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setRecording(false);
    }
  };

  const handleCompleteInterview = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      await axios.post(`${API_URL}/interviews/submit`, {
        course_id: courseId,
        user_id: user.id,
        completed: true,
        submitted_at: new Date()
      });
      
      setCompleted(true);
      stopCamera();
      
      setTimeout(() => {
        navigate('/interviews');
      }, 3000);
    } catch (error) {
      console.error('Error submitting interview:', error);
      alert('Failed to submit interview');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="interview-container">
          <div className="loading">Loading interview...</div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="interview-container">
          <div className="alert alert-danger">Interview not found</div>
        </div>
      </Layout>
    );
  }

  if (completed) {
    return (
      <Layout>
        <div className="interview-container">
          <div className="completion-card">
            <div className="completion-icon">✅</div>
            <h2>Interview Completed!</h2>
            <p>Thank you for completing the interview.</p>
            <p>Our team will review your responses and get back to you soon.</p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/interviews')}
            >
              Back to Interviews
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const currentQ = course.questions[currentQuestion];

  return (
    <Layout>
      <div className="interview-container">
        <div className="interview-header">
          <h2>{course.title}</h2>
          <div className="interview-progress">
            Question {currentQuestion + 1} of {course.questions.length}
          </div>
        </div>

        <div className="interview-content">
          <div className="video-section">
            {cameraError ? (
              <div className="camera-error">
                <p>❌ {cameraError}</p>
                <button onClick={startCamera} className="btn btn-primary">
                  Try Again
                </button>
              </div>
            ) : (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  className="video-preview"
                />
                {recording && (
                  <div className="recording-indicator">
                    🔴 Recording...
                  </div>
                )}
              </>
            )}
          </div>

          <div className="question-section">
            <div className="question-card">
              <h3>Question {currentQuestion + 1}</h3>
              <p className="question-text">{currentQ.question}</p>
              
              <div className="recording-controls">
                {!recording ? (
                  <button 
                    className="btn btn-danger btn-lg"
                    onClick={handleStartRecording}
                    disabled={!permissionGranted}
                  >
                    🎤 Start Recording Answer
                  </button>
                ) : (
                  <button 
                    className="btn btn-warning btn-lg"
                    onClick={handleStopRecording}
                  >
                    ⏹️ Stop Recording
                  </button>
                )}
              </div>

              <div className="interview-timer">
                <p>⏱️ Recommended time: 2-3 minutes per question</p>
              </div>
            </div>

            <div className="navigation-controls">
              <button 
                className="btn btn-secondary"
                onClick={handlePreviousQuestion}
                disabled={currentQuestion === 0}
              >
                ← Previous
              </button>
              
              {currentQuestion < course.questions.length - 1 ? (
                <button 
                  className="btn btn-primary"
                  onClick={handleNextQuestion}
                >
                  Next →
                </button>
              ) : (
                <button 
                  className="btn btn-success"
                  onClick={handleCompleteInterview}
                >
                  ✅ Complete Interview
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="interview-tips">
          <h4>💡 Interview Tips:</h4>
          <ul>
            <li>Look at the camera while speaking</li>
            <li>Speak clearly and at a moderate pace</li>
            <li>Take a moment to think before answering</li>
            <li>Be honest and authentic in your responses</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}

export default TakeInterview;
