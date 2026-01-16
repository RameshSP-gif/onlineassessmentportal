import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api';
import Layout from './Layout';

function SubmissionsView() {
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [viewingDetails, setViewingDetails] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subsRes, studentsRes, examsRes] = await Promise.all([
        axios.get('/admin/dashboard'),
        axios.get('/admin/students'),
        axios.get('/exams')
      ]);
      setSubmissions(subsRes.data.recentSubmissions);
      setStudents(studentsRes.data);
      setExams(examsRes.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getStudentName = (userId) => {
    const student = students.find(s => s.id === userId);
    return student?.username || 'Unknown';
  };

  const getExamTitle = (examId) => {
    const exam = exams.find(e => e.id === examId);
    return exam?.title || 'Unknown';
  };

  const getPercentage = (score, examId) => {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return 0;
    return ((score / exam.total_marks) * 100).toFixed(1);
  };

  const viewDetails = (submission) => {
    setViewingDetails(submission);
  };

  return (
    <Layout>
      <div style={styles.container}>
      <div style={styles.header}>
        <h1>All Submissions</h1>
        <button onClick={() => navigate('/admin/dashboard')} style={styles.backBtn}>
          Back
        </button>
      </div>

      {viewingDetails && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2>Submission Details</h2>
            <p><strong>Student:</strong> {getStudentName(viewingDetails.user_id)}</p>
            <p><strong>Exam:</strong> {getExamTitle(viewingDetails.exam_id)}</p>
            <p><strong>Score:</strong> {viewingDetails.score}</p>
            <p><strong>Percentage:</strong> {getPercentage(viewingDetails.score, viewingDetails.exam_id)}%</p>
            <p><strong>Submitted:</strong> {new Date(viewingDetails.submitted_at).toLocaleString()}</p>
            
            <h3>Answers:</h3>
            <div style={styles.answersGrid}>
              {viewingDetails.answers && Object.entries(viewingDetails.answers).map(([qId, answer]) => (
                <div key={qId} style={styles.answerCard}>
                  <strong>Q{qId}:</strong> {answer.toUpperCase()}
                </div>
              ))}
            </div>
            
            <button onClick={() => setViewingDetails(null)} style={styles.closeBtn}>
              Close
            </button>
          </div>
        </div>
      )}

      <table style={styles.table}>
        <thead>
          <tr>
            <th>Student</th>
            <th>Exam</th>
            <th>Score</th>
            <th>Percentage</th>
            <th>Submitted</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map(sub => (
            <tr key={sub._id}>
              <td>{getStudentName(sub.user_id)}</td>
              <td>{getExamTitle(sub.exam_id)}</td>
              <td>{sub.score}</td>
              <td>
                <span style={{
                  ...styles.badge,
                  backgroundColor: getPercentage(sub.score, sub.exam_id) >= 60 ? '#28a745' : '#dc3545'
                }}>
                  {getPercentage(sub.score, sub.exam_id)}%
                </span>
              </td>
              <td>{new Date(sub.submitted_at).toLocaleDateString()}</td>
              <td>
                <button onClick={() => viewDetails(sub)} style={styles.viewBtn}>
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </Layout>
  );
}

const styles = {
  container: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  backBtn: { padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  badge: { padding: '5px 10px', borderRadius: '12px', color: 'white', fontSize: '12px', fontWeight: 'bold' },
  viewBtn: { padding: '5px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: 'white', padding: '30px', borderRadius: '10px', maxWidth: '600px', maxHeight: '80vh', overflow: 'auto' },
  answersGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px', margin: '15px 0' },
  answerCard: { padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px', textAlign: 'center' },
  closeBtn: { width: '100%', padding: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '15px' }
};

export default SubmissionsView;
