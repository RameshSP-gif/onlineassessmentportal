import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviews } from '../api';
import Layout from './Layout';
import './VideoInterview.css';

function VideoInterview() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [recording, setRecording] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [result, setResult] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [permissionGranted, setPermissionGranted] = useState(false);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  const loadQuestions = async () => {
    try {
      const response = await interviews.getQuestions();
      setQuestions(response.data);
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  const checkCameraPermissions = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Your browser does not support camera access. Please use a modern browser like Chrome, Firefox, or Edge.');
        return false;
      }

      // Try to get camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      // Permission granted - stop the stream for now
      stream.getTracks().forEach(track => track.stop());
      setPermissionGranted(true);
      setCameraError('');
      return true;
    } catch (error) {
      let errorMessage = 'Unable to access camera. ';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Please grant camera and microphone permissions in your browser settings.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'No camera or microphone found. Please connect a camera device.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage += 'Camera is already in use by another application. Please close other apps using the camera.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage += 'Camera does not meet the required specifications.';
      } else if (error.name === 'SecurityError') {
        errorMessage += 'Camera access is blocked due to security settings.';
      } else {
        errorMessage += 'An unexpected error occurred. Please check your browser settings.';
      }
      
      setCameraError(errorMessage);
      console.error('Camera error:', error);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      setCameraError('');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setVideoStream(stream);
      setRecording(true);
      setPermissionGranted(true);
    } catch (error) {
      await checkCameraPermissions();
    }
  };

  const stopRecording = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    setRecording(false);
  };

  const submitAnswer = async () => {
    stopRecording();

    try {
      const response = await interviews.submit({
        title: `Interview Question ${currentQuestion + 1}`,
        question: questions[currentQuestion].question,
        videoData: 'recorded_video_data'
      });

      setResult(response.data);
      setCompleted(true);
    } catch (error) {
      console.error('Error submitting interview:', error);
      alert('Failed to submit interview');
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setCompleted(false);
      setResult(null);
    } else {
      navigate('/results');
    }
  };

  if (questions.length === 0) {
    return <Layout><div className="loading">Loading interview questions...</div></Layout>;
  }

  return (
    <Layout>
      <div className="container">
        <div className="card">
          <div className="interview-header">
            <h2>Question {currentQuestion + 1} of {questions.length}</h2>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {!completed ? (
            <div className="interview-content">
              <div className="question-box">
                <h3>{questions[currentQuestion].question}</h3>
              </div>

              {cameraError && (
                <div className="camera-error-box">
                  <h4>⚠️ Camera Access Issue</h4>
                  <p>{cameraError}</p>
                  <div className="error-instructions">
                    <strong>How to fix:</strong>
                    <ol>
                      <li>Click the camera icon 🎥 in your browser's address bar</li>
                      <li>Select "Allow" for camera and microphone</li>
                      <li>Refresh the page if needed</li>
                      <li>Make sure no other application is using the camera</li>
                    </ol>
                  </div>
                  <button onClick={checkCameraPermissions} className="btn btn-primary">
                    🔄 Try Again
                  </button>
                </div>
              )}

              <div className="video-section">
                <div className="video-container">
                  {recording && (
                    <>
                      <video ref={videoRef} autoPlay muted className="video-preview" />
                      <div className="recording-indicator">🔴 Recording...</div>
                    </>
                  )}
                  {!recording && !videoStream && !cameraError && (
                    <div className="video-placeholder">
                      <p>📹 Click "Start Recording" to begin your answer</p>
                      {!permissionGranted && (
                        <p style={{ fontSize: '14px', marginTop: '10px', color: '#718096' }}>
                          You will be asked to grant camera permissions
                        </p>
                      )}
                    </div>
                  )}
                  {cameraError && (
                    <div className="video-placeholder">
                      <p>⚠️ Camera access is required for video interviews</p>
                    </div>
                  )}
                </div>

                <div className="recording-controls">
                  {!recording ? (
                    <button onClick={startRecording} className="btn btn-success btn-large" disabled={!!cameraError && !permissionGranted}>
                      🎥 Start Recording
                    </button>
                  ) : (
                    <button onClick={submitAnswer} className="btn btn-danger btn-large">
                      ⏹️ Stop & Submit
                    </button>
                  )}
                </div>
              </div>

              <div className="tips-box">
                <h4>💡 Tips for a great interview:</h4>
                <ul>
                  <li>Speak clearly and confidently</li>
                  <li>Look at the camera while answering</li>
                  <li>Take a moment to think before responding</li>
                  <li>Be authentic and honest</li>
                  <li>Ensure good lighting and minimal background noise</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="result-section">
              <h2>✅ Answer Submitted!</h2>
              
              <div className="ai-result-card">
                <h3>AI Analysis Results</h3>
                <div className="score-display">
                  <div className="score-circle">
                    <span className="score-number">{result.score}</span>
                    <span className="score-label">/100</span>
                  </div>
                </div>

                <div className="metrics-grid">
                  <div className="metric">
                    <span className="metric-label">Confidence</span>
                    <div className="metric-bar">
                      <div
                        className="metric-fill"
                        style={{ width: `${result.analysis.confidence}%` }}
                      />
                    </div>
                    <span className="metric-value">{result.analysis.confidence}%</span>
                  </div>

                  <div className="metric">
                    <span className="metric-label">Clarity</span>
                    <div className="metric-bar">
                      <div
                        className="metric-fill"
                        style={{ width: `${result.analysis.clarity}%` }}
                      />
                    </div>
                    <span className="metric-value">{result.analysis.clarity}%</span>
                  </div>

                  <div className="metric">
                    <span className="metric-label">Relevance</span>
                    <div className="metric-bar">
                      <div
                        className="metric-fill"
                        style={{ width: `${result.analysis.relevance}%` }}
                      />
                    </div>
                    <span className="metric-value">{result.analysis.relevance}%</span>
                  </div>

                  <div className="metric">
                    <span className="metric-label">Communication</span>
                    <div className="metric-bar">
                      <div
                        className="metric-fill"
                        style={{ width: `${result.analysis.communication}%` }}
                      />
                    </div>
                    <span className="metric-value">{result.analysis.communication}%</span>
                  </div>
                </div>

                <div className="feedback-box">
                  <h4>Feedback:</h4>
                  <p>{result.analysis.feedback}</p>
                </div>
              </div>

              <button onClick={nextQuestion} className="btn btn-primary btn-large">
                {currentQuestion < questions.length - 1 ? 'Next Question' : 'View All Results'}
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default VideoInterview;
