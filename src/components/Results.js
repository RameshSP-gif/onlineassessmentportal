import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submissions, interviews } from '../api';
import Layout from './Layout';

function Results() {
  const [examResults, setExamResults] = useState([]);
  const [interviewResults, setInterviewResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('exams');
  const navigate = useNavigate();

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const [examsRes, interviewsRes] = await Promise.all([
        submissions.getMine(),
        interviews.getMine()
      ]);
      setExamResults(examsRes.data);
      setInterviewResults(interviewsRes.data);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="loading">Loading results...</div>;
  }

  return (
    <Layout>
      <div className="container">
        <div className="card">
          <h1>My Results</h1>

          <div className="tabs">
            <button
              className={`tab ${activeTab === 'exams' ? 'active' : ''}`}
              onClick={() => setActiveTab('exams')}
            >
              Exam Results ({examResults.length})
            </button>
            <button
              className={`tab ${activeTab === 'interviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('interviews')}
            >
              Interview Results ({interviewResults.length})
            </button>
          </div>

          {activeTab === 'exams' && (
            <div className="results-container">
              {examResults.length === 0 ? (
                <p className="text-center" style={{ padding: '40px', color: '#718096' }}>
                  No exam results yet. Take an exam to see your results here.
                </p>
              ) : (
                <div className="results-list">
                  {examResults.map((result) => (
                    <div key={result.id} className="result-card">
                      <div className="result-header">
                        <h3>{result.title}</h3>
                        <span className="score-badge">
                          {result.score} / {result.total_marks}
                        </span>
                      </div>
                      <div className="result-details">
                        <p>
                          <strong>Percentage:</strong>{' '}
                          {((result.score / result.total_marks) * 100).toFixed(2)}%
                        </p>
                        <p>
                          <strong>Submitted:</strong> {formatDate(result.submitted_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'interviews' && (
            <div className="results-container">
              {interviewResults.length === 0 ? (
                <p className="text-center" style={{ padding: '40px', color: '#718096' }}>
                  No interview results yet. Complete a video interview to see results here.
                </p>
              ) : (
                <div className="results-list">
                  {interviewResults.map((interview) => (
                    <div key={interview.id} className="result-card">
                      <div className="result-header">
                        <h3>{interview.title}</h3>
                        <span className="score-badge">{interview.score}/100</span>
                      </div>
                      <div className="result-details">
                        <p><strong>Question:</strong> {interview.question}</p>
                        <div className="ai-analysis">
                          <h4>AI Analysis:</h4>
                          <div className="analysis-grid">
                            <div>Confidence: {interview.ai_analysis.confidence}%</div>
                            <div>Clarity: {interview.ai_analysis.clarity}%</div>
                            <div>Relevance: {interview.ai_analysis.relevance}%</div>
                            <div>Communication: {interview.ai_analysis.communication}%</div>
                          </div>
                          <p style={{ marginTop: '10px' }}><strong>Feedback:</strong> {interview.ai_analysis.feedback}</p>
                        </div>
                        <p style={{ marginTop: '10px' }}>
                          <strong>Completed:</strong> {formatDate(interview.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .tabs {
          display: flex;
          gap: 10px;
          margin: 20px 0;
          border-bottom: 2px solid #e2e8f0;
        }

        .tab {
          padding: 12px 24px;
          border: none;
          background: transparent;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.3s;
          color: #718096;
        }

        .tab.active {
          color: #667eea;
          border-bottom-color: #667eea;
        }

        .results-list {
          margin-top: 20px;
        }

        .result-card {
          background: #f7fafc;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 15px;
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .result-header h3 {
          margin: 0;
          color: #2d3748;
        }

        .score-badge {
          background: #48bb78;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 18px;
        }

        .result-details p {
          margin: 8px 0;
          color: #4a5568;
        }

        .ai-analysis {
          background: white;
          padding: 15px;
          border-radius: 8px;
          margin: 10px 0;
        }

        .ai-analysis h4 {
          margin: 0 0 10px 0;
          color: #667eea;
        }

        .analysis-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
          font-weight: 600;
          color: #2d3748;
        }
      `}</style>
    </Layout>
  );
}

export default Results;
