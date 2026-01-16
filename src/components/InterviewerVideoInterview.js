import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import './VideoInterview.css';

function InterviewerVideoInterview() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [localStream, setLocalStream] = useState(null);
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [feedback, setFeedback] = useState('');
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadSession();
    initializeMedia();
    return () => {
      stopMedia();
    };
  }, [sessionId]);

  useEffect(() => {
    let interval;
    if (recording && recordingStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [recording, recordingStartTime]);

  const loadSession = async () => {
    try {
      const response = await api.get(`/interview-session/${sessionId}`);
      setSession(response.data);
    } catch (error) {
      console.error('Failed to load session:', error);
      alert('Failed to load interview session');
    }
  };

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      setLocalStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Initialize speech recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            setTranscript(prev => prev + finalTranscript);
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
        };
      }
    } catch (error) {
      console.error('Failed to initialize media:', error);
      alert('Failed to access camera/microphone. Please grant permissions.');
    }
  };

  const stopMedia = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const startRecording = async () => {
    try {
      // Update session status to in-progress
      await api.patch(`/interview-session/${sessionId}/status`, {
        status: 'in-progress',
        startedAt: new Date().toISOString()
      });

      // Start video recording
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm';
      }

      mediaRecorderRef.current = new MediaRecorder(localStream, options);
      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start(1000); // Collect data every second
      setRecording(true);
      setRecordingStartTime(Date.now());

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      loadSession(); // Refresh session data
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to start recording');
    }
  };

  const stopRecording = async () => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && recording) {
        mediaRecorderRef.current.onstop = async () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          
          // Create a download link for the recording
          const url = URL.createObjectURL(blob);
          const videoRecordingUrl = url;

          // Stop speech recognition
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }

          const duration = Math.floor(elapsedTime / 60);

          try {
            // Update session with recording URL and end time
            await api.patch(`/interview-session/${sessionId}/recording-complete`, {
              videoRecordingUrl
            });

            // Save transcript
            if (transcript) {
              await api.post(`/interview-session/${sessionId}/transcript`, {
                transcript
              });
            }

            // Update session status to completed
            await api.patch(`/interview-session/${sessionId}/status`, {
              status: 'completed',
              endedAt: new Date().toISOString()
            });

            // Trigger AI evaluation
            await api.post(`/interview-session/${sessionId}/evaluate`);

            setRecording(false);
            resolve();
          } catch (error) {
            console.error('Failed to save recording:', error);
            alert('Failed to save recording data');
            resolve();
          }
        };

        mediaRecorderRef.current.stop();
      } else {
        resolve();
      }
    });
  };

  const handleEndInterview = async () => {
    if (window.confirm('Are you sure you want to end this interview?')) {
      await stopRecording();
      
      // Save interviewer feedback if provided
      if (feedback.trim()) {
        try {
          await api.post(`/interview-session/${sessionId}/feedback`, {
            interviewerFeedback: feedback
          });
        } catch (error) {
          console.error('Failed to save feedback:', error);
        }
      }

      alert('Interview completed successfully! AI evaluation has been generated.');
      navigate('/interviewer/dashboard');
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!session) {
    return <div className="loading">Loading interview session...</div>;
  }

  return (
    <div className="video-interview-container">
      <div className="interview-header">
        <div className="interview-info">
          <h2>Live Interview - {session.studentId?.username}</h2>
          <p>Student Email: {session.studentId?.email}</p>
        </div>
        {recording && (
          <div className="recording-indicator">
            <span className="pulse-dot"></span>
            Recording: {formatTime(elapsedTime)}
          </div>
        )}
      </div>

      <div className="video-section">
        <div className="video-container">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="interviewer-video"
          />
          <div className="video-controls">
            {!recording ? (
              <button className="btn-start-recording" onClick={startRecording}>
                🎥 Start Interview & Recording
              </button>
            ) : (
              <button className="btn-stop-recording" onClick={handleEndInterview}>
                ⏹️ End Interview
              </button>
            )}
          </div>
        </div>

        {recording && (
          <div className="interview-panels">
            <div className="transcript-panel">
              <h3>Live Transcript</h3>
              <div className="transcript-content">
                {transcript || 'Transcript will appear here as you speak...'}
              </div>
            </div>

            <div className="feedback-panel">
              <h3>Interviewer Notes</h3>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Add your observations and feedback here..."
                rows="10"
              />
            </div>
          </div>
        )}
      </div>

      <div className="interview-instructions">
        <h4>Interview Guidelines:</h4>
        <ul>
          <li>Click "Start Interview & Recording" to begin the session</li>
          <li>The video and audio will be recorded automatically</li>
          <li>Live transcription will capture the conversation</li>
          <li>Add your notes and feedback during the interview</li>
          <li>Click "End Interview" when finished - AI evaluation will be generated</li>
          <li>You can review the recording and AI analysis from your dashboard</li>
        </ul>
      </div>
    </div>
  );
}

export default InterviewerVideoInterview;
