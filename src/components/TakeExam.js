import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { exams } from '../api';
import './TakeExam.css';

function TakeExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadExam();
  }, [id]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && exam) {
      handleSubmit();
    }
  }, [timeLeft]);

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
    try {
      const response = await exams.submit(id, answers);
      alert(`Exam submitted! Your score: ${response.data.score} / ${exam.total_marks}`);
      navigate('/results');
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert('Failed to submit exam');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="loading">Loading exam...</div>;
  }

  if (!exam) {
    return <div className="loading">Exam not found</div>;
  }

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <h2>{exam.title}</h2>
        <div className="timer">
          <span style={{ fontWeight: '600', color: timeLeft < 60 ? '#f56565' : '#667eea' }}>
            ⏱️ Time Left: {formatTime(timeLeft)}
          </span>
        </div>
      </nav>

      <div className="container">
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
  );
}

export default TakeExam;
