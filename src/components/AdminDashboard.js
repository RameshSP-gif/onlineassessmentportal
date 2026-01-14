import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submissions, interviews } from '../api';
import './AdminDashboard.css';

function AdminDashboard() {
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [allInterviews, setAllInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('submissions');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subsRes, intsRes] = await Promise.all([
        submissions.getAll(),
        interviews.getAll()
      ]);
      setAllSubmissions(subsRes.data);
      setAllInterviews(intsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="loading">Loading admin dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <h2>Admin Dashboard</h2>
        <div className="nav-right">
          <button onClick={() => navigate('/admin/create-exam')} className="btn btn-success">
            Create New Exam
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
            Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="container">
        <div className="card">
          <h1>Manage Assessments</h1>

          <div className="admin-stats">
            <div className="stat-card">
              <h3>{allSubmissions.length}</h3>
              <p>Total Submissions</p>
            </div>
            <div className="stat-card">
              <h3>{allInterviews.length}</h3>
              <p>Total Interviews</p>
            </div>
            <div className="stat-card">
              <h3>
                {allSubmissions.length > 0
                  ? (
                      allSubmissions.reduce((acc, s) => acc + (s.score / s.total_marks) * 100, 0) /
                      allSubmissions.length
                    ).toFixed(1)
                  : 0}
                %
              </h3>
              <p>Average Score</p>
            </div>
          </div>

          <div className="tabs">
            <button
              className={`tab ${activeTab === 'submissions' ? 'active' : ''}`}
              onClick={() => setActiveTab('submissions')}
            >
              Exam Submissions ({allSubmissions.length})
            </button>
            <button
              className={`tab ${activeTab === 'interviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('interviews')}
            >
              Video Interviews ({allInterviews.length})
            </button>
          </div>

          {activeTab === 'submissions' && (
            <div className="table-container">
              {allSubmissions.length === 0 ? (
                <p className="text-center" style={{ padding: '40px', color: '#718096' }}>
                  No submissions yet.
                </p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Email</th>
                      <th>Exam</th>
                      <th>Score</th>
                      <th>Percentage</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allSubmissions.map((sub) => (
                      <tr key={sub.id}>
                        <td>{sub.username}</td>
                        <td>{sub.email}</td>
                        <td>{sub.title}</td>
                        <td>{sub.score} / {sub.total_marks}</td>
                        <td>
                          <span
                            className={`badge ${
                              (sub.score / sub.total_marks) * 100 >= 70
                                ? 'badge-success'
                                : (sub.score / sub.total_marks) * 100 >= 50
                                ? 'badge-warning'
                                : 'badge-danger'
                            }`}
                          >
                            {((sub.score / sub.total_marks) * 100).toFixed(2)}%
                          </span>
                        </td>
                        <td>{formatDate(sub.submitted_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'interviews' && (
            <div className="table-container">
              {allInterviews.length === 0 ? (
                <p className="text-center" style={{ padding: '40px', color: '#718096' }}>
                  No interviews yet.
                </p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Email</th>
                      <th>Title</th>
                      <th>Question</th>
                      <th>Score</th>
                      <th>Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allInterviews.map((interview) => (
                      <tr key={interview.id}>
                        <td>{interview.username}</td>
                        <td>{interview.email}</td>
                        <td>{interview.title}</td>
                        <td>{interview.question.substring(0, 50)}...</td>
                        <td>
                          <span
                            className={`badge ${
                              interview.score >= 70
                                ? 'badge-success'
                                : interview.score >= 50
                                ? 'badge-warning'
                                : 'badge-danger'
                            }`}
                          >
                            {interview.score}/100
                          </span>
                        </td>
                        <td>{formatDate(interview.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
