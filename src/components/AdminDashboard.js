import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api';
import Layout from './Layout';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState({ exam: [], interview: [] });
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [dashboardRes, examPaymentsRes, interviewPaymentsRes, interviewCoursesRes] = await Promise.all([
        axios.get('/admin/dashboard').catch(() => ({ data: { stats: {}, recentUsers: [] } })),
        axios.get('/admin/payments/pending').catch(() => ({ data: [] })),
        axios.get('/admin/interview-payments/pending').catch(() => ({ data: [] })),
        axios.get('/interview-courses').catch(() => ({ data: [] }))
      ]);
      
      setStats(dashboardRes.data);
      setPayments({
        exam: Array.isArray(examPaymentsRes.data) ? examPaymentsRes.data : [],
        interview: Array.isArray(interviewPaymentsRes.data) ? interviewPaymentsRes.data : []
      });
      setInterviews(Array.isArray(interviewCoursesRes.data) ? interviewCoursesRes.data : []);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setStats({ stats: {}, recentUsers: [] });
      setPayments({ exam: [], interview: [] });
      setInterviews([]);
      setLoading(false);
    }
  };

  if (loading) return <Layout><div style={styles.loading}>Loading...</div></Layout>;

  const pendingExamPayments = Array.isArray(payments.exam) ? payments.exam.length : 0;
  const pendingInterviewPayments = Array.isArray(payments.interview) ? payments.interview.length : 0;
  const totalPendingPayments = pendingExamPayments + pendingInterviewPayments;
  const totalInterviews = Array.isArray(interviews) ? interviews.length : 0;

  return (
    <Layout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Admin Dashboard</h1>
          <button onClick={fetchAllData} style={styles.refreshBtn}>🔄 Refresh</button>
        </div>

        {/* Primary Statistics */}
        <h2 style={styles.sectionTitle}>📊 Overview Statistics</h2>
        <div style={styles.statsGrid}>
          <div style={{...styles.statCard, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
            <div style={styles.statIcon}>👥</div>
            <h3 style={styles.statLabel}>Total Students</h3>
            <div style={styles.statValue}>{stats?.stats?.totalStudents || 0}</div>
          </div>
          <div style={{...styles.statCard, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'}}>
            <div style={styles.statIcon}>📝</div>
            <h3 style={styles.statLabel}>Total Exams</h3>
            <div style={styles.statValue}>{stats?.stats?.totalExams || 0}</div>
          </div>
          <div style={{...styles.statCard, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'}}>
            <div style={styles.statIcon}>🎤</div>
            <h3 style={styles.statLabel}>Interview Courses</h3>
            <div style={styles.statValue}>{totalInterviews}</div>
          </div>
          <div style={{...styles.statCard, background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'}}>
            <div style={styles.statIcon}>📋</div>
            <h3 style={styles.statLabel}>Submissions</h3>
            <div style={styles.statValue}>{stats?.stats?.totalSubmissions || 0}</div>
          </div>
        </div>

        {/* Payment Statistics */}
        <h2 style={styles.sectionTitle}>💳 Payment Statistics</h2>
        <div style={styles.statsGrid}>
          <div style={{...styles.statCard, background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'}}>
            <div style={styles.statIcon}>💰</div>
            <h3 style={styles.statLabel}>Total Revenue</h3>
            <div style={styles.statValue}>₹{stats?.stats?.totalRevenue || 0}</div>
          </div>
          <div style={{...styles.statCard, background: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)'}}>
            <div style={styles.statIcon}>⏳</div>
            <h3 style={styles.statLabel}>Pending Payments</h3>
            <div style={styles.statValue}>{totalPendingPayments}</div>
            <div style={styles.statSubtext}>Exam: {pendingExamPayments} | Interview: {pendingInterviewPayments}</div>
          </div>
          <div style={{...styles.statCard, background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'}}>
            <div style={styles.statIcon}>📝</div>
            <h3 style={styles.statLabel}>Exam Payments</h3>
            <div style={styles.statValue}>{pendingExamPayments}</div>
            <button onClick={() => navigate('/admin/payments')} style={styles.actionBtn}>Review</button>
          </div>
          <div style={{...styles.statCard, background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'}}>
            <div style={styles.statIcon}>🎤</div>
            <h3 style={styles.statLabel}>Interview Payments</h3>
            <div style={styles.statValue}>{pendingInterviewPayments}</div>
            <button onClick={() => navigate('/admin/interview-payments')} style={styles.actionBtn}>Review</button>
          </div>
        </div>

        {/* Quick Actions */}
        <h2 style={styles.sectionTitle}>⚡ Quick Actions</h2>
        <div style={styles.menuGrid}>
          <button onClick={() => navigate('/admin/students')} style={styles.menuCard}>
            <div style={styles.menuIcon}>👥</div>
            <h3 style={styles.menuTitle}>Students</h3>
            <p style={styles.menuDesc}>Manage student accounts</p>
          </button>
          <button onClick={() => navigate('/admin/users')} style={styles.menuCard}>
            <div style={styles.menuIcon}>👤</div>
            <h3 style={styles.menuTitle}>User Management</h3>
            <p style={styles.menuDesc}>CRUD on all users</p>
          </button>
          <button onClick={() => navigate('/admin/roles')} style={styles.menuCard}>
            <div style={styles.menuIcon}>🔑</div>
            <h3 style={styles.menuTitle}>Role Management</h3>
            <p style={styles.menuDesc}>Create & manage roles</p>
          </button>
          <button onClick={() => navigate('/admin/exams')} style={styles.menuCard}>
            <div style={styles.menuIcon}>📝</div>
            <h3 style={styles.menuTitle}>Exams</h3>
            <p style={styles.menuDesc}>CRUD exams & questions</p>
          </button>
          <button onClick={() => navigate('/admin/payments')} style={styles.menuCard}>
            <div style={styles.menuIcon}>💳</div>
            <h3 style={styles.menuTitle}>Exam Payments</h3>
            <p style={styles.menuDesc}>Verify payment proofs</p>
            {pendingExamPayments > 0 && <span style={styles.badge}>{pendingExamPayments}</span>}
          </button>
          <button onClick={() => navigate('/admin/interview-payments')} style={styles.menuCard}>
            <div style={styles.menuIcon}>🎤</div>
            <h3 style={styles.menuTitle}>Interview Payments</h3>
            <p style={styles.menuDesc}>Verify interview payments</p>
            {pendingInterviewPayments > 0 && <span style={styles.badge}>{pendingInterviewPayments}</span>}
          </button>
          <button onClick={() => navigate('/admin/reports')} style={styles.menuCard}>
            <div style={styles.menuIcon}>📊</div>
            <h3 style={styles.menuTitle}>Reports</h3>
            <p style={styles.menuDesc}>View analytics & reports</p>
          </button>
          <button onClick={() => navigate('/admin/submissions')} style={styles.menuCard}>
            <div style={styles.menuIcon}>📋</div>
            <h3 style={styles.menuTitle}>Submissions</h3>
            <p style={styles.menuDesc}>View all exam answers</p>
          </button>
        </div>

        {/* Recent Activity */}
        <div style={styles.activitySection}>
          <div style={styles.activityColumn}>
            <h2 style={styles.sectionTitle}>👥 Recent Students</h2>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Username</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentUsers?.map(user => (
                    <tr key={user.id} style={styles.tr}>
                      <td style={styles.td}>{user.username}</td>
                      <td style={styles.td}>{user.email}</td>
                      <td style={styles.td}>{new Date(user.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={styles.activityColumn}>
            <h2 style={styles.sectionTitle}>⏳ Pending Exam Payments</h2>
            <div style={styles.tableContainer}>
              {pendingExamPayments === 0 ? (
                <div style={styles.emptyState}>✅ No pending exam payments</div>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Student</th>
                      <th style={styles.th}>Exam</th>
                      <th style={styles.th}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.exam.slice(0, 5).map((payment, idx) => (
                      <tr key={idx} style={styles.tr}>
                        <td style={styles.td}>{payment.username}</td>
                        <td style={styles.td}>{payment.examTitle}</td>
                        <td style={styles.td}>₹{payment.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div style={styles.activityColumn}>
            <h2 style={styles.sectionTitle}>⏳ Pending Interview Payments</h2>
            <div style={styles.tableContainer}>
              {pendingInterviewPayments === 0 ? (
                <div style={styles.emptyState}>✅ No pending interview payments</div>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Student</th>
                      <th style={styles.th}>Course</th>
                      <th style={styles.th}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.interview.slice(0, 5).map((payment, idx) => (
                      <tr key={idx} style={styles.tr}>
                        <td style={styles.td}>{payment.username}</td>
                        <td style={styles.td}>{payment.courseTitle}</td>
                        <td style={styles.td}>₹{payment.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    padding: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  title: {
    margin: 0,
    color: '#1f2937',
    fontSize: '32px',
    fontWeight: '700'
  },
  refreshBtn: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
    transition: 'all 0.3s'
  },
  sectionTitle: {
    color: '#374151',
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '16px',
    marginTop: '32px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '20px'
  },
  statCard: {
    color: 'white',
    padding: '24px',
    borderRadius: '16px',
    textAlign: 'center',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    transition: 'all 0.3s',
    cursor: 'default',
    position: 'relative'
  },
  statIcon: {
    fontSize: '48px',
    marginBottom: '12px'
  },
  statLabel: {
    fontSize: '14px',
    fontWeight: '500',
    margin: '8px 0',
    opacity: 0.9,
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  statValue: {
    fontSize: '42px',
    fontWeight: 'bold',
    margin: '12px 0'
  },
  statSubtext: {
    fontSize: '13px',
    opacity: 0.9,
    marginTop: '8px'
  },
  actionBtn: {
    marginTop: '12px',
    padding: '8px 20px',
    background: 'rgba(255,255,255,0.3)',
    color: 'white',
    border: '2px solid white',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  menuGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  menuCard: {
    backgroundColor: 'white',
    padding: '24px',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    position: 'relative'
  },
  menuIcon: {
    fontSize: '48px',
    marginBottom: '12px'
  },
  menuTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '8px 0'
  },
  menuDesc: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '8px 0 0 0'
  },
  badge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: '#ef4444',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '700'
  },
  activitySection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    marginTop: '32px'
  },
  activityColumn: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  tableContainer: {
    overflowX: 'auto',
    marginTop: '12px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  th: {
    textAlign: 'left',
    padding: '12px 8px',
    borderBottom: '2px solid #e5e7eb',
    color: '#374151',
    fontWeight: '600',
    fontSize: '13px',
    textTransform: 'uppercase'
  },
  tr: {
    borderBottom: '1px solid #f3f4f6',
    transition: 'background 0.2s'
  },
  td: {
    padding: '12px 8px',
    color: '#6b7280'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#10b981',
    fontSize: '16px',
    fontWeight: '500'
  },
  loading: {
    textAlign: 'center',
    padding: '100px',
    fontSize: '20px',
    color: '#6b7280'
  }
};

export default AdminDashboard;
