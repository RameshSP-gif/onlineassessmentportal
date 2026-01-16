import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { exams } from '../api';
import axios from 'axios';
import Layout from './Layout';
import './TakeExam.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function TakeExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState('Starting...');
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const streamRef = useRef(null);

  useEffect(() => {
    checkPaymentAndLoadExam();
    
    return () => {
      stopCamera();
    };
  }, [id]);

  const checkPaymentAndLoadExam = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Check payment status
      const paymentResponse = await axios.get(`${API_URL}/payments/status/${id}/${user.id}`);
      
      if (!paymentResponse.data.paid) {
        alert('Payment required to take this exam!');
        navigate(`/payment/${id}`);
        return;
      }
      
      // Payment verified, proceed to load exam and start camera
      loadExam();
      startCamera();
    } catch (error) {
      console.error('Error checking payment:', error);
      alert('Failed to verify payment status');
      navigate('/exams');
    }
  };

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && exam) {
      handleSubmit();
    }
  }, [timeLeft]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 }, 
        audio: true 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setCameraActive(true);
      setRecordingStatus('🔴 Recording');
      
      // Start recording
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start(1000); // Capture in 1-second chunks
    } catch (error) {
      console.error('Camera access error:', error);
      setRecordingStatus('❌ Camera access denied');
      alert('Camera access is required to take this exam. Please allow camera permissions and refresh.');
    }
  };

  const stopCamera = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
    setRecordingStatus('Recording stopped');
  };

  const loadExam = async () => {
    try {
      const response = await exams.getById(id);
      setExam(response.data);
      setTimeLeft(response.data.duration * 60);
    } catch (error) {
      console.error('Error loading exam:', error);
      alert('Failed to load exam');
      navigate('/exams');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleSubmit = async () => {
    if (submitting) return;
    
    const confirmed = window.confirm('Are you sure you want to submit your exam?');
    if (!confirmed && timeLeft > 0) return;

    setSubmitting(true);
    setRecordingStatus('Submitting...');
    
    // Stop recording
    stopCamera();
    
    try {
      // Create video blob
      const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const videoSize = (videoBlob.size / (1024 * 1024)).toFixed(2);
      console.log(`Exam recording: ${videoSize}MB`);
      
      // Submit exam with answers
      const response = await exams.submit(id, answers);
      
      // Note: Video would be uploaded to cloud storage (AWS S3, Firebase, etc.)
      // For now, we're just logging it
      alert(`Exam submitted! Your score: ${response.data.score} / ${exam.total_marks}\nRecording: ${videoSize}MB captured`);
      navigate('/results');
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert('Failed to submit exam');
      setSubmitting(false);
      setRecordingStatus('❌ Submission failed');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <Layout><div className="loading">Loading exam...</div></Layout>;
  }

  if (!exam) {
    return <Layout><div className="loading">Exam not found</div></Layout>;
  }

  return (
    <Layout>
      <div className="exam-container">
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          marginBottom: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0 }}>{exam.title}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: cameraActive ? '#f56565' : '#666',
              padding: '8px 12px',
              backgroundColor: cameraActive ? '#fff5f5' : '#f7fafc',
              borderRadius: '6px'
            }}>
              {recordingStatus}
            </span>
            <span style={{ fontWeight: '600', color: timeLeft < 60 ? '#f56565' : '#667eea' }}>
              ⏱️ Time Left: {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        <div className="container">
        {/* Camera Feed */}
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          width: '240px',
          zIndex: 1000,
          backgroundColor: '#000',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          border: cameraActive ? '3px solid #f56565' : '3px solid #666'
        }}>
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            style={{ 
              width: '100%', 
              height: '180px', 
              objectFit: 'cover',
              display: 'block'
            }}
          />
          <div style={{
            padding: '8px',
            backgroundColor: cameraActive ? '#f56565' : '#666',
            color: 'white',
            fontSize: '12px',
            textAlign: 'center',
            fontWeight: '600'
          }}>
            {cameraActive ? '🎥 Recording Your Exam' : '📹 Camera Off'}
          </div>
        </div>
        <div className="card">
          <div className="exam-info">
            <p>{exam.description}</p>
            <div className="flex gap-10 mt-20">
              <span className="badge badge-info">Total Questions: {exam.questions.length}</span>
              <span className="badge badge-success">Total Marks: {exam.total_marks}</span>
            </div>
          </div>

          <div className="questions-container">
            {exam.questions.map((question, index) => (
              <div key={question.id} className="question-card">
                <h3>Question {index + 1} ({question.marks} mark{question.marks > 1 ? 's' : ''})</h3>
                <p className="question-text">{question.question_text}</p>

                <div className="options">
                  {['a', 'b', 'c', 'd'].map((option) => (
                    <label key={option} className="option-label">
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={() => handleAnswerChange(question.id, option)}
                      />
                      <span className="option-text">
                        {option.toUpperCase()}. {question[`option_${option}`]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="submit-section">
            <p>Answered: {Object.keys(answers).length} / {exam.questions.length}</p>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn btn-success"
              style={{ padding: '15px 40px', fontSize: '18px' }}
            >
              {submitting ? 'Submitting...' : 'Submit Exam'}
            </button>
          </div>
        </div>
        </div>
      </div>
    </Layout>
  );
}

export default TakeExam;
