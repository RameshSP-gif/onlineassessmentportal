import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exams } from '../api';

function ExamList() {
  const [examList, setExamList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const response = await exams.getAll();
      setExamList(response.data);
    } catch (error) {
      console.error('Error loading exams:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading exams...</div>;
  }

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <h2>Assessment Portal</h2>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">Back to Dashboard</button>
      </nav>

      <div className="container">
        <div className="card">
          <h1>Available Exams</h1>

          {examList.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#718096', padding: '40px' }}>
              No exams available at the moment.
            </p>
          ) : (
            <div className="grid grid-2">
              {examList.map((exam) => (
                <div key={exam.id} className="card" style={{ background: '#f7fafc' }}>
                  <h3>{exam.title}</h3>
                  <p style={{ color: '#718096', margin: '10px 0' }}>{exam.description}</p>
                  <div className="flex-between mt-20">
                    <div>
                      <span className="badge badge-info">⏱️ {exam.duration} mins</span>
                      <span className="badge badge-success" style={{ marginLeft: '10px' }}>
                        📝 {exam.total_marks} marks
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/exam/${exam.id}`)}
                      className="btn btn-primary"
                    >
                      Start Exam
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExamList;
