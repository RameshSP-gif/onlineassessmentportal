import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import './VideoInterview.css';

function InterviewReview() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('video'); // video, transcript, evaluation
  const videoRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const response = await api.get(`/interview-session/${sessionId}`);
      setSession(response.data);
    } catch (error) {
      console.error('Failed to load session:', error);
      alert('Failed to load interview session');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score) => {
    if (score >= 75) return '#4caf50';
    if (score >= 60) return '#ff9800';
    if (score >= 45) return '#ff5722';
    return '#f44336';
  };

  if (loading) {
    return <div className="loading">Loading interview review...</div>;
  }

  if (!session) {
    return <div className="error-message">Interview session not found</div>;
  }

  const aiEval = session.aiEvaluation || {};

  return (
    <div className="interview-review-container">
      <div className="review-header">
        <button className="btn-back" onClick={() => navigate('/interviewer/dashboard')}>
          ← Back to Dashboard
        </button>
        <div className="review-title">
          <h2>Interview Review - {session.studentId?.username}</h2>
          <p>Conducted on {formatDate(session.endedAt || session.scheduledAt)}</p>
        </div>
      </div>

      <div className="interview-summary">
        <div className="summary-card">
          <div className="summary-item">
            <span className="summary-label">Student:</span>
            <span className="summary-value">{session.studentId?.username}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Email:</span>
            <span className="summary-value">{session.studentId?.email}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Duration:</span>
            <span className="summary-value">{session.duration || 'N/A'} minutes</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Status:</span>
            <span className={`status-badge status-${session.status}`}>{session.status}</span>
          </div>
        </div>
        
        {aiEval.overallScore !== undefined && (
          <div className="overall-score-card">
            <div className="score-circle" style={{ borderColor: getScoreColor(aiEval.overallScore) }}>
              <span className="score-value" style={{ color: getScoreColor(aiEval.overallScore) }}>
                {aiEval.overallScore}
              </span>
              <span className="score-label">/100</span>
            </div>
            <p className="score-recommendation">{aiEval.recommendation}</p>
          </div>
        )}
      </div>

      <div className="review-tabs">
        <button
          className={activeTab === 'video' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('video')}
        >
          📹 Video Playback
        </button>
        <button
          className={activeTab === 'transcript' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('transcript')}
        >
          📝 Transcript
        </button>
        <button
          className={activeTab === 'evaluation' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('evaluation')}
        >
          🎯 AI Evaluation
        </button>
      </div>

      <div className="review-content">
        {activeTab === 'video' && (
          <div className="video-playback-panel">
            {session.videoRecordingUrl ? (
              <div className="video-player">
                <video
                  ref={videoRef}
                  controls
                  className="recorded-video"
                  src={session.videoRecordingUrl}
                >
                  Your browser does not support video playback.
                </video>
                <div className="video-info">
                  <p>📹 Interview recording captured during the session</p>
                  <p>You can pause, rewind, and review specific moments</p>
                </div>
              </div>
            ) : (
              <div className="no-video">
                <p>⚠️ Video recording not available for this session</p>
                <p>The recording may still be processing or was not captured</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transcript' && (
          <div className="transcript-panel">
            <div className="panel-header">
              <h3>Interview Transcript</h3>
              <p className="panel-subtitle">Auto-generated from speech recognition</p>
            </div>
            {session.transcript ? (
              <div className="transcript-content scrollable">
                <p className="transcript-text">{session.transcript}</p>
              </div>
            ) : (
              <div className="no-data">
                <p>No transcript available for this interview</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'evaluation' && (
          <div className="evaluation-panel">
            {aiEval.overallScore !== undefined ? (
              <>
                <div className="scores-grid">
                  <div className="score-card">
                    <h4>Technical Skills</h4>
                    <div className="score-bar">
                      <div 
                        className="score-fill" 
                        style={{ 
                          width: `${aiEval.technicalScore}%`,
                          backgroundColor: getScoreColor(aiEval.technicalScore)
                        }}
                      />
                    </div>
                    <span className="score-text">{aiEval.technicalScore}/100</span>
                  </div>

                  <div className="score-card">
                    <h4>Communication</h4>
                    <div className="score-bar">
                      <div 
                        className="score-fill" 
                        style={{ 
                          width: `${aiEval.communicationScore}%`,
                          backgroundColor: getScoreColor(aiEval.communicationScore)
                        }}
                      />
                    </div>
                    <span className="score-text">{aiEval.communicationScore}/100</span>
                  </div>

                  <div className="score-card">
                    <h4>Problem Solving</h4>
                    <div className="score-bar">
                      <div 
                        className="score-fill" 
                        style={{ 
                          width: `${aiEval.problemSolvingScore}%`,
                          backgroundColor: getScoreColor(aiEval.problemSolvingScore)
                        }}
                      />
                    </div>
                    <span className="score-text">{aiEval.problemSolvingScore}/100</span>
                  </div>
                </div>

                <div className="strengths-weaknesses">
                  <div className="strengths-section">
                    <h3>✅ Strengths</h3>
                    <ul>
                      {aiEval.strengths?.map((strength, index) => (
                        <li key={index}>{strength}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="weaknesses-section">
                    <h3>⚠️ Areas for Improvement</h3>
                    <ul>
                      {aiEval.weaknesses?.map((weakness, index) => (
                        <li key={index}>{weakness}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="ai-feedback">
                  <h3>🤖 AI-Generated Feedback</h3>
                  <div className="feedback-content">
                    <pre>{aiEval.feedback}</pre>
                  </div>
                </div>

                {session.interviewerFeedback && (
                  <div className="interviewer-feedback">
                    <h3>👨‍💼 Interviewer's Notes</h3>
                    <div className="feedback-content">
                      <p>{session.interviewerFeedback}</p>
                    </div>
                  </div>
                )}

                <div className="recommendation-box" style={{ borderLeftColor: getScoreColor(aiEval.overallScore) }}>
                  <h3>📊 Final Recommendation</h3>
                  <p>{aiEval.recommendation}</p>
                </div>
              </>
            ) : (
              <div className="no-data">
                <p>AI evaluation not available yet</p>
                <p>Evaluation is generated automatically after the interview completes</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default InterviewReview;
