import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exams } from '../api';
import './CreateExam.css';

function CreateExam() {
  const [examData, setExamData] = useState({
    title: '',
    description: '',
    duration: 30,
    total_marks: 0
  });
  const [questions, setQuestions] = useState([{
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'a',
    marks: 1
  }]);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleExamChange = (field, value) => {
    setExamData({ ...examData, [field]: value });
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([...questions, {
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'a',
      marks: 1
    }]);
  };

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      const newQuestions = questions.filter((_, i) => i !== index);
      setQuestions(newQuestions);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (questions.some(q => !q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d)) {
      alert('Please fill in all question fields');
      return;
    }

    const totalMarks = questions.reduce((sum, q) => sum + parseInt(q.marks), 0);

    setSubmitting(true);
    try {
      await exams.create({
        ...examData,
        total_marks: totalMarks,
        questions
      });
      alert('Exam created successfully!');
      navigate('/admin');
    } catch (error) {
      console.error('Error creating exam:', error);
      alert('Failed to create exam');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <h2>Create New Exam</h2>
        <button onClick={() => navigate('/admin')} className="btn btn-secondary">Back to Admin</button>
      </nav>

      <div className="container">
        <div className="card">
          <form onSubmit={handleSubmit}>
            <h2>Exam Details</h2>
            
            <div className="form-group">
              <label>Exam Title *</label>
              <input
                type="text"
                placeholder="e.g., JavaScript Basics Quiz"
                value={examData.title}
                onChange={(e) => handleExamChange('title', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                placeholder="Brief description of the exam"
                value={examData.description}
                onChange={(e) => handleExamChange('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Duration (minutes) *</label>
              <input
                type="number"
                min="1"
                value={examData.duration}
                onChange={(e) => handleExamChange('duration', parseInt(e.target.value))}
                required
              />
            </div>

            <div className="questions-section">
              <div className="section-header">
                <h2>Questions</h2>
                <button type="button" onClick={addQuestion} className="btn btn-success">
                  + Add Question
                </button>
              </div>

              {questions.map((question, index) => (
                <div key={index} className="question-form-card">
                  <div className="question-header">
                    <h3>Question {index + 1}</h3>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="btn btn-danger btn-small"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Question Text *</label>
                    <textarea
                      placeholder="Enter the question"
                      value={question.question_text}
                      onChange={(e) => handleQuestionChange(index, 'question_text', e.target.value)}
                      rows={2}
                      required
                    />
                  </div>

                  <div className="options-grid">
                    <div className="form-group">
                      <label>Option A *</label>
                      <input
                        type="text"
                        placeholder="First option"
                        value={question.option_a}
                        onChange={(e) => handleQuestionChange(index, 'option_a', e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Option B *</label>
                      <input
                        type="text"
                        placeholder="Second option"
                        value={question.option_b}
                        onChange={(e) => handleQuestionChange(index, 'option_b', e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Option C *</label>
                      <input
                        type="text"
                        placeholder="Third option"
                        value={question.option_c}
                        onChange={(e) => handleQuestionChange(index, 'option_c', e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Option D *</label>
                      <input
                        type="text"
                        placeholder="Fourth option"
                        value={question.option_d}
                        onChange={(e) => handleQuestionChange(index, 'option_d', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Correct Answer *</label>
                      <select
                        value={question.correct_answer}
                        onChange={(e) => handleQuestionChange(index, 'correct_answer', e.target.value)}
                        required
                      >
                        <option value="a">Option A</option>
                        <option value="b">Option B</option>
                        <option value="c">Option C</option>
                        <option value="d">Option D</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Marks *</label>
                      <input
                        type="number"
                        min="1"
                        value={question.marks}
                        onChange={(e) => handleQuestionChange(index, 'marks', parseInt(e.target.value))}
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="form-footer">
              <p>Total Marks: {questions.reduce((sum, q) => sum + parseInt(q.marks || 0), 0)}</p>
              <button type="submit" disabled={submitting} className="btn btn-primary btn-large">
                {submitting ? 'Creating Exam...' : 'Create Exam'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateExam;
