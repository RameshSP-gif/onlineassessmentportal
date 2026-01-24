import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api';
import Layout from './Layout';
import './HRDashboard.css';

function HRDashboard() {
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState({ exam: [], interview: [] });
  const [interviewRequests, setInterviewRequests] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [approvalInProgress, setApprovalInProgress] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      const [
        dashboardRes,
        examPaymentsRes,
        interviewPaymentsRes,
        interviewCoursesRes,
        pendingReqRes,
        approvedReqRes,
        scheduledReqRes
      ] = await Promise.all([
        axios.get('/hr/dashboard').catch(() => ({ data: { stats: {}, recentUsers: [] } })),
        axios.get('/hr/payments/pending').catch(() => ({ data: [] })),
        axios.get('/hr/interview-payments/pending').catch(() => ({ data: [] })),
        axios.get('/interview-courses').catch(() => ({ data: [] })),
        axios.get('/interview-requests?status=pending').catch(() => ({ data: [] })),
        axios.get('/interview-requests?status=approved').catch(() => ({ data: [] })),
        axios.get('/interview-requests?status=scheduled').catch(() => ({ data: [] }))
      ]);
      
      setStats(dashboardRes.data);
      setPayments({
        exam: Array.isArray(examPaymentsRes.data) ? examPaymentsRes.data : [],
        interview: Array.isArray(interviewPaymentsRes.data) ? interviewPaymentsRes.data : []
      });
      setInterviews(Array.isArray(interviewCoursesRes.data) ? interviewCoursesRes.data : []);

      // Merge pending, approved, scheduled without duplicates
      const buckets = [pendingReqRes, approvedReqRes, scheduledReqRes]
        .map(r => (Array.isArray(r.data) ? r.data : []))
        .flat();
      const merged = buckets.reduce((acc, req) => {
        const key = req?._id || req?.id;
        if (!req || !key) return acc;
        acc.set(key, { ...req, id: req.id || req._id });
        return acc;
      }, new Map());
      setInterviewRequests(Array.from(merged.values()));
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setStats({ stats: {}, recentUsers: [] });
      setPayments({ exam: [], interview: [] });
      setInterviews([]);
      setInterviewRequests([]);
      setLoading(false);
    }
  };

  const handleApproveInterview = async (requestId) => {
    setApprovalInProgress({ ...approvalInProgress, [requestId]: true });
    try {
      await axios.patch(`/interview-requests/${requestId}/approve`, { status: 'approved' });
      setSuccessMessage('✅ Interview request approved!');
      setTimeout(() => {
        setSuccessMessage('');
        fetchAllData();
      }, 2000);
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setApprovalInProgress({ ...approvalInProgress, [requestId]: false });
    }
  };

  const handleRejectInterview = async (requestId, reason) => {
    if (!reason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    setApprovalInProgress({ ...approvalInProgress, [requestId]: true });
    try {
      await axios.patch(`/interview-requests/${requestId}/reject`, { 
        status: 'rejected',
        rejectionReason: reason 
      });
      setSuccessMessage('❌ Interview request rejected');
      setTimeout(() => {
        setSuccessMessage('');
        fetchAllData();
      }, 2000);
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setApprovalInProgress({ ...approvalInProgress, [requestId]: false });
    }
  };

  if (loading) return <Layout><div style={styles.loading}>Loading dashboard...</div></Layout>;

  const pendingExamPayments = payments.exam.length;
  const pendingInterviewPayments = payments.interview.length;
  const pendingApprovals = interviewRequests.filter(r => r.status === 'pending').length;

  return (
    <Layout>
      <div style={styles.container}>
        {/* Header Section */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <h1 style={styles.title}>📊 HR Dashboard</h1>
            <p style={styles.subtitle}>Manage approvals, payments, and interview schedules</p>
          </div>
          <button onClick={fetchAllData} style={styles.refreshBtn}>🔄 Refresh</button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div style={styles.successBanner}>{successMessage}</div>
        )}

        {/* Key Metrics Row */}
        <div style={styles.metricsRow}>
          <div style={{...styles.metricCard, ...styles.metricPrimary}}>
            <div style={styles.metricValue}>{pendingApprovals}</div>
            <div style={styles.metricLabel}>Pending Approvals</div>
            <div style={styles.metricIcon}>⏳</div>
          </div>
          <div style={{...styles.metricCard, ...styles.metricWarning}}>
            <div style={styles.metricValue}>{pendingExamPayments}</div>
            <div style={styles.metricLabel}>Exam Payments</div>
            <div style={styles.metricIcon}>💳</div>
          </div>
          <div style={{...styles.metricCard, ...styles.metricInfo}}>
            <div style={styles.metricValue}>{pendingInterviewPayments}</div>
            <div style={styles.metricLabel}>Interview Payments</div>
            <div style={styles.metricIcon}>🎤</div>
          </div>
          <div style={{...styles.metricCard, ...styles.metricSuccess}}>
            <div style={styles.metricValue}>{stats?.stats?.totalStudents || 0}</div>
            <div style={styles.metricLabel}>Total Students</div>
            <div style={styles.metricIcon}>👥</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={styles.tabNav}>
          <button 
            onClick={() => setActiveTab('dashboard')}
            style={{...styles.tabBtn, ...(activeTab === 'dashboard' ? styles.tabActive : {})}}
          >
            📊 Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('overview')}
            style={{...styles.tabBtn, ...(activeTab === 'overview' ? styles.tabActive : {})}}
          >
            📈 Overview
          </button>
          <button 
            onClick={() => setActiveTab('approvals')}
            style={{...styles.tabBtn, ...(activeTab === 'approvals' ? styles.tabActive : {})}}
          >
            ⏳ Approvals ({pendingApprovals})
          </button>
          <button 
            onClick={() => setActiveTab('scheduling')}
            style={{...styles.tabBtn, ...(activeTab === 'scheduling' ? styles.tabActive : {})}}
          >
            📅 Scheduling
          </button>
          <button 
            onClick={() => setActiveTab('payments')}
            style={{...styles.tabBtn, ...(activeTab === 'payments' ? styles.tabActive : {})}}
          >
            💰 Payments
          </button>
          <button 
            onClick={() => setActiveTab('management')}
            style={{...styles.tabBtn, ...(activeTab === 'management' ? styles.tabActive : {})}}
          >
            ⚙️ Management
          </button>
        </div>

        {/* Tab Content */}
        <div style={styles.tabContent}>
          {/* Unified Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div style={styles.tabPanel}>
              <h2 style={styles.sectionTitle}>📊 Interview Management Dashboard</h2>
              
              {/* Unified View - All Items in Single Row */}
              <div style={styles.unifiedDashboard}>
                {/* Pending Approvals Card */}
                <div style={{...styles.dashboardCard, borderLeft: '5px solid #f59e0b'}}>
                  <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>⏳ Pending Approvals</h3>
                    <span style={styles.badgeCount}>{pendingApprovals}</span>
                  </div>
                  <div style={styles.cardContent}>
                    {interviewRequests.filter(r => r.status === 'pending').slice(0, 3).map(request => (
                      <div key={request._id} style={styles.itemRow}>
                        <span style={styles.itemName}>{request.studentName}</span>
                        <button 
                          onClick={() => setActiveTab('approvals')}
                          style={styles.quickBtn}
                        >
                          Review
                        </button>
                      </div>
                    ))}
                    {pendingApprovals > 3 && <p style={styles.viewMore}>+{pendingApprovals - 3} more...</p>}
                    {pendingApprovals === 0 && <p style={styles.emptyMsg}>No pending approvals</p>}
                  </div>
                </div>

                {/* Approved - Waiting to Schedule */}
                <div style={{...styles.dashboardCard, borderLeft: '5px solid #10b981'}}>
                  <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>✅ Ready to Schedule</h3>
                    <span style={styles.badgeCount}>{interviewRequests.filter(r => r.status === 'approved').length}</span>
                  </div>
                  <div style={styles.cardContent}>
                    {interviewRequests.filter(r => r.status === 'approved').slice(0, 3).map(request => (
                      <div key={request._id} style={styles.itemRow}>
                        <span style={styles.itemName}>{request.studentName}</span>
                        <button 
                          onClick={() => setActiveTab('scheduling')}
                          style={styles.quickBtn}
                        >
                          Schedule
                        </button>
                      </div>
                    ))}
                    {interviewRequests.filter(r => r.status === 'approved').length > 3 && (
                      <p style={styles.viewMore}>+{interviewRequests.filter(r => r.status === 'approved').length - 3} more...</p>
                    )}
                    {interviewRequests.filter(r => r.status === 'approved').length === 0 && (
                      <p style={styles.emptyMsg}>No approved interviews</p>
                    )}
                  </div>
                </div>

                {/* Payments Pending */}
                <div style={{...styles.dashboardCard, borderLeft: '5px solid #3b82f6'}}>
                  <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>💰 Pending Payments</h3>
                    <span style={styles.badgeCount}>{pendingExamPayments + pendingInterviewPayments}</span>
                  </div>
                  <div style={styles.cardContent}>
                    {pendingExamPayments > 0 && (
                      <div style={styles.itemRow}>
                        <span style={styles.itemName}>Exam Payments: {pendingExamPayments}</span>
                        <button 
                          onClick={() => setActiveTab('payments')}
                          style={styles.quickBtn}
                        >
                          Review
                        </button>
                      </div>
                    )}
                    {pendingInterviewPayments > 0 && (
                      <div style={styles.itemRow}>
                        <span style={styles.itemName}>Interview Payments: {pendingInterviewPayments}</span>
                        <button 
                          onClick={() => setActiveTab('payments')}
                          style={styles.quickBtn}
                        >
                          Review
                        </button>
                      </div>
                    )}
                    {pendingExamPayments === 0 && pendingInterviewPayments === 0 && (
                      <p style={styles.emptyMsg}>All payments verified</p>
                    )}
                  </div>
                </div>

                {/* Statistics Card */}
                <div style={{...styles.dashboardCard, borderLeft: '5px solid #667eea'}}>
                  <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>📈 Statistics</h3>
                  </div>
                  <div style={styles.statsSmall}>
                    <div style={styles.statSmall}>
                      <span style={styles.statSmallLabel}>Total Students</span>
                      <span style={styles.statSmallValue}>{stats?.stats?.totalStudents || 0}</span>
                    </div>
                    <div style={styles.statSmall}>
                      <span style={styles.statSmallLabel}>Interview Courses</span>
                      <span style={styles.statSmallValue}>{interviews.length}</span>
                    </div>
                    <div style={styles.statSmall}>
                      <span style={styles.statSmallLabel}>Scheduled</span>
                      <span style={styles.statSmallValue}>{interviewRequests.filter(r => r.status === 'scheduled').length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div style={styles.tabPanel}>
              <h2 style={styles.sectionTitle}>Overview Statistics</h2>
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
                  <div style={styles.statValue}>{interviews.length}</div>
                </div>
                <div style={{...styles.statCard, background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'}}>
                  <div style={styles.statIcon}>📋</div>
                  <h3 style={styles.statLabel}>Submissions</h3>
                  <div style={styles.statValue}>{stats?.stats?.totalSubmissions || 0}</div>
                </div>
              </div>

              <h2 style={styles.sectionTitle}>Revenue & Status</h2>
              <div style={styles.statsGrid}>
                <div style={{...styles.statCard, background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'}}>
                  <div style={styles.statIcon}>💰</div>
                  <h3 style={styles.statLabel}>Total Revenue</h3>
                  <div style={styles.statValue}>₹{stats?.stats?.totalRevenue || 0}</div>
                </div>
                <div style={{...styles.statCard, background: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)'}}>
                  <div style={styles.statIcon}>⏳</div>
                  <h3 style={styles.statLabel}>Total Pending</h3>
                  <div style={styles.statValue}>{pendingExamPayments + pendingInterviewPayments}</div>
                  <div style={styles.statSubtext}>Exam: {pendingExamPayments} | Interview: {pendingInterviewPayments}</div>
                </div>
              </div>

              {/* Recent Students Table */}
              <h2 style={styles.sectionTitle}>Recent Students</h2>
              <div style={styles.tableCard}>
                {stats?.recentUsers && stats.recentUsers.length > 0 ? (
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Username</th>
                        <th style={styles.th}>Email</th>
                        <th style={styles.th}>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentUsers.slice(0, 10).map(user => (
                        <tr key={user.id} style={styles.tr}>
                          <td style={styles.td}>{user.username}</td>
                          <td style={styles.td}>{user.email}</td>
                          <td style={styles.td}>{new Date(user.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={styles.emptyState}>No recent students</div>
                )}
              </div>
            </div>
          )}

          {/* Approvals Tab */}
          {activeTab === 'approvals' && (
            <div style={styles.tabPanel}>
              <h2 style={styles.sectionTitle}>⏳ Pending Interview Approvals</h2>
              {interviewRequests.filter(r => r.status === 'pending').length === 0 ? (
                <div style={styles.emptyState}>✅ No pending approvals</div>
              ) : (
                <div style={styles.approvalsList}>
                  {interviewRequests.filter(r => r.status === 'pending').map(request => (
                    <div key={request._id} style={styles.approvalCard}>
                      <div style={styles.approvalHeader}>
                        <div style={styles.approvalInfo}>
                          <h3 style={styles.approvalTitle}>{request.studentName}</h3>
                          <p style={styles.approvalEmail}>{request.studentEmail}</p>
                          <div style={styles.approvalDetails}>
                            <span style={styles.detailTag}>📚 {request.specialization}</span>
                            <span style={styles.detailTag}>🎤 {request.interviewType === 'human' ? 'Human Interview' : 'AI Interview'}</span>
                            <span style={styles.detailTag}>💻 {request.interviewMode === 'online' ? 'Online' : 'F2F'}</span>
                          </div>
                        </div>
                        <div style={styles.approvalIcon}>📋</div>
                      </div>
                      
                      <div style={styles.proposedDates}>
                        <h4 style={styles.datesTitle}>Proposed Dates:</h4>
                        <div style={styles.datesList}>
                          {request.proposedDates?.map((pd, idx) => (
                            <span key={idx} style={styles.dateChip}>
                              {new Date(pd.date).toLocaleDateString()} - {pd.timeSlot}
                            </span>
                          ))}
                        </div>
                      </div>

                      {request.additionalNotes && (
                        <div style={styles.notes}>
                          <strong>Notes:</strong> {request.additionalNotes}
                        </div>
                      )}

                      <div style={styles.approvalActions}>
                        <button 
                          onClick={() => handleApproveInterview(request.id || request._id)}
                          disabled={approvalInProgress[request._id]}
                          style={styles.approveBtn}
                        >
                          {approvalInProgress[request._id] ? '⏳ Approving...' : '✅ Approve'}
                        </button>
                        <button 
                          onClick={() => {
                            const reason = prompt('Enter rejection reason:');
                            if (reason) handleRejectInterview(request.id || request._id, reason);
                          }}
                          disabled={approvalInProgress[request._id]}
                          style={styles.rejectBtn}
                        >
                          {approvalInProgress[request._id] ? '⏳ Rejecting...' : '❌ Reject'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Scheduling Tab */}
          {activeTab === 'scheduling' && (
            <div style={styles.tabPanel}>
              <h2 style={styles.sectionTitle}>📅 Schedule Interviews</h2>
              {interviewRequests.filter(r => r.status === 'approved').length === 0 ? (
                <div style={styles.emptyState}>No approved interviews waiting for scheduling</div>
              ) : (
                <div style={styles.scheduleList}>
                  {interviewRequests.filter(r => r.status === 'approved').map(request => (
                    <div key={request.id || request._id} style={styles.scheduleCard}>
                      <div style={styles.scheduleHeader}>
                        <h3 style={styles.scheduleName}>{request.studentName}</h3>
                        <span style={styles.scheduleStatus}>✅ Approved</span>
                      </div>
                      <div style={styles.scheduleDetails}>
                        <p><strong>Email:</strong> {request.studentEmail}</p>
                        <p><strong>Specialization:</strong> {request.specialization}</p>
                        <p><strong>Interview Type:</strong> {request.interviewType === 'human' ? 'Human Interview' : 'AI Interview'}</p>
                        <p><strong>Mode:</strong> {request.interviewMode === 'online' ? 'Online' : 'Face to Face'}</p>
                      </div>
                      <div style={styles.scheduleAction}>
                        <button 
                          onClick={() => navigate('/hr/interview-requests')}
                          style={styles.scheduleBtn}
                        >
                          📅 Schedule Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div style={styles.tabPanel}>
              <h2 style={styles.sectionTitle}>💳 Payment Verification</h2>
              
              {pendingExamPayments === 0 && pendingInterviewPayments === 0 ? (
                <div style={styles.emptyState}>✅ All payments verified!</div>
              ) : (
                <>
                  {pendingExamPayments > 0 && (
                    <div>
                      <h3 style={styles.subsectionTitle}>Exam Payments ({pendingExamPayments})</h3>
                      <div style={styles.tableCard}>
                        <table style={styles.table}>
                          <thead>
                            <tr>
                              <th style={styles.th}>Student</th>
                              <th style={styles.th}>Exam</th>
                              <th style={styles.th}>Amount</th>
                              <th style={styles.th}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {payments.exam.map((payment, idx) => (
                              <tr key={idx} style={styles.tr}>
                                <td style={styles.td}>{payment.username}</td>
                                <td style={styles.td}>{payment.examTitle}</td>
                                <td style={styles.td}>₹{payment.amount}</td>
                                <td style={styles.td}>
                                  <button 
                                    onClick={() => navigate('/hr/payments')}
                                    style={styles.reviewBtn}
                                  >
                                    Review
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {pendingInterviewPayments > 0 && (
                    <div>
                      <h3 style={styles.subsectionTitle}>Interview Payments ({pendingInterviewPayments})</h3>
                      <div style={styles.tableCard}>
                        <table style={styles.table}>
                          <thead>
                            <tr>
                              <th style={styles.th}>Student</th>
                              <th style={styles.th}>Course</th>
                              <th style={styles.th}>Amount</th>
                              <th style={styles.th}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {payments.interview.map((payment, idx) => (
                              <tr key={idx} style={styles.tr}>
                                <td style={styles.td}>{payment.username}</td>
                                <td style={styles.td}>{payment.courseTitle}</td>
                                <td style={styles.td}>₹{payment.amount}</td>
                                <td style={styles.td}>
                                  <button 
                                    onClick={() => navigate('/hr/interview-payments')}
                                    style={styles.reviewBtn}
                                  >
                                    Review
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Management Tab */}
          {activeTab === 'management' && (
            <div style={styles.tabPanel}>
              <h2 style={styles.sectionTitle}>⚙️ Management Options</h2>
              <div style={styles.menuGrid}>
                <button onClick={() => navigate('/hr/students')} style={styles.menuCard}>
                  <div style={styles.menuIcon}>👥</div>
                  <h3 style={styles.menuTitle}>Students</h3>
                  <p style={styles.menuDesc}>Manage student accounts</p>
                </button>
                <button onClick={() => navigate('/hr/users')} style={styles.menuCard}>
                  <div style={styles.menuIcon}>👤</div>
                  <h3 style={styles.menuTitle}>User Management</h3>
                  <p style={styles.menuDesc}>CRUD on all users</p>
                </button>
                <button onClick={() => navigate('/hr/roles')} style={styles.menuCard}>
                  <div style={styles.menuIcon}>🔑</div>
                  <h3 style={styles.menuTitle}>Role Management</h3>
                  <p style={styles.menuDesc}>Create & manage roles</p>
                </button>
                <button onClick={() => navigate('/hr/exams')} style={styles.menuCard}>
                  <div style={styles.menuIcon}>📝</div>
                  <h3 style={styles.menuTitle}>Exams</h3>
                  <p style={styles.menuDesc}>CRUD exams & questions</p>
                </button>
                <button onClick={() => navigate('/hr/payments')} style={styles.menuCard}>
                  <div style={styles.menuIcon}>💳</div>
                  <h3 style={styles.menuTitle}>Exam Payments</h3>
                  <p style={styles.menuDesc}>Verify payment proofs</p>
                </button>
                <button onClick={() => navigate('/hr/interview-payments')} style={styles.menuCard}>
                  <div style={styles.menuIcon}>🎤</div>
                  <h3 style={styles.menuTitle}>Interview Payments</h3>
                  <p style={styles.menuDesc}>Verify interview payments</p>
                </button>
                <button onClick={() => navigate('/hr/interview-requests')} style={styles.menuCard}>
                  <div style={styles.menuIcon}>📅</div>
                  <h3 style={styles.menuTitle}>Interview Requests</h3>
                  <p style={styles.menuDesc}>Approve & schedule</p>
                </button>
                <button onClick={() => navigate('/hr/reports')} style={styles.menuCard}>
                  <div style={styles.menuIcon}>📊</div>
                  <h3 style={styles.menuTitle}>Reports</h3>
                  <p style={styles.menuDesc}>View analytics & reports</p>
                </button>
                <button onClick={() => navigate('/hr/submissions')} style={styles.menuCard}>
                  <div style={styles.menuIcon}>📋</div>
                  <h3 style={styles.menuTitle}>Submissions</h3>
                  <p style={styles.menuDesc}>View all exam answers</p>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

const styles = {
  container: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    background: '#f8fafc',
    minHeight: '100vh',
    padding: '30px 20px',
    '@media (max-width: 768px)': {
      padding: '20px 15px'
    },
    '@media (max-width: 480px)': {
      padding: '15px 10px'
    }
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '16px 24px',
    borderRadius: '12px',
    color: 'white',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
  },
  headerContent: {
    flex: 1
  },
  title: {
    margin: '0 0 5px 0',
    fontSize: '24px',
    fontWeight: '700',
    color: 'white'
  },
  subtitle: {
    margin: 0,
    fontSize: '12px',
    opacity: 0.9,
    color: 'white'
  },
  refreshBtn: {
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: '2px solid white',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginLeft: '16px'
  },
  successBanner: {
    background: '#dcfce7',
    color: '#166534',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '12px',
    fontWeight: '600',
    fontSize: '13px',
    border: '2px solid #86efac',
    animation: 'slideDown 0.3s ease'
  },
  metricsRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px',
    flexWrap: 'nowrap',
    overflow: 'auto'
  },
  unifiedDashboard: {
    display: 'flex',
    gap: '12px',
    marginBottom: '15px',
    flexWrap: 'nowrap',
    overflowX: 'auto'
  },
  dashboardCard: {
    background: 'white',
    borderRadius: '10px',
    padding: '14px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    transition: 'all 0.3s',
    flex: '1',
    minWidth: '220px'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e5e7eb'
  },
  cardTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0
  },
  badgeCount: {
    background: '#fee2e2',
    color: '#dc2626',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600'
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 8px',
    background: '#f9fafb',
    borderRadius: '6px',
    fontSize: '11px'
  },
  itemName: {
    color: '#374151',
    fontWeight: '500',
    flex: 1
  },
  quickBtn: {
    padding: '4px 10px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  viewMore: {
    fontSize: '10px',
    color: '#9ca3af',
    textAlign: 'center',
    margin: '6px 0 0 0',
    fontStyle: 'italic'
  },
  emptyMsg: {
    fontSize: '11px',
    color: '#9ca3af',
    textAlign: 'center',
    padding: '12px',
    margin: 0
  },
  statsSmall: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px'
  },
  statSmall: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '8px',
    background: '#f9fafb',
    borderRadius: '6px'
  },
  statSmallLabel: {
    fontSize: '10px',
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: '3px',
    textAlign: 'center'
  },
  statSmallValue: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#667eea'
  },
  metricCard: {
    background: 'white',
    padding: '12px 16px',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.3s',
    flex: '1',
    minWidth: '140px'
  },
  metricPrimary: {
    borderTop: '3px solid #667eea'
  },
  metricWarning: {
    borderTop: '3px solid #f59e0b'
  },
  metricInfo: {
    borderTop: '3px solid #3b82f6'
  },
  metricSuccess: {
    borderTop: '3px solid #10b981'
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 3px 0'
  },
  metricLabel: {
    fontSize: '11px',
    color: '#6b7280',
    fontWeight: '500',
    margin: 0
  },
  metricIcon: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    fontSize: '20px',
    opacity: 0.2
  },
  tabNav: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    borderBottom: '2px solid #e5e7eb',
    overflowX: 'auto',
    paddingBottom: '0',
    flexWrap: 'nowrap'
  },
  tabBtn: {
    padding: '8px 14px',
    background: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    color: '#6b7280',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
    whiteSpace: 'nowrap',
    minWidth: 'fit-content'
  },
  tabActive: {
    color: '#667eea',
    borderBottomColor: '#667eea'
  },
  tabContent: {
    animation: 'fadeIn 0.3s ease'
  },
  tabPanel: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  sectionTitle: {
    color: '#1f2937',
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '14px',
    marginTop: 0
  },
  subsectionTitle: {
    color: '#374151',
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '16px',
    marginTop: '24px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    color: 'white',
    padding: '24px',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    transition: 'all 0.3s',
    cursor: 'default',
    position: 'relative'
  },
  statIcon: {
    fontSize: '40px',
    marginBottom: '12px'
  },
  statLabel: {
    fontSize: '13px',
    fontWeight: '600',
    margin: '8px 0',
    opacity: 0.9,
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  statValue: {
    fontSize: '36px',
    fontWeight: '700',
    margin: '12px 0'
  },
  statSubtext: {
    fontSize: '12px',
    opacity: 0.85,
    marginTop: '8px'
  },
  approvalsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  approvalCard: {
    background: '#f9fafb',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    transition: 'all 0.3s',
    borderLeft: '4px solid #667eea'
  },
  approvalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  approvalInfo: {
    flex: 1
  },
  approvalTitle: {
    color: '#1f2937',
    fontSize: '18px',
    fontWeight: '700',
    margin: '0 0 4px 0'
  },
  approvalEmail: {
    color: '#6b7280',
    fontSize: '14px',
    margin: '0 0 8px 0'
  },
  approvalDetails: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginTop: '8px'
  },
  detailTag: {
    background: '#e5e7eb',
    color: '#374151',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500'
  },
  approvalIcon: {
    fontSize: '32px',
    opacity: 0.3
  },
  proposedDates: {
    background: 'white',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '12px'
  },
  datesTitle: {
    margin: '0 0 8px 0',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151'
  },
  datesList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  dateChip: {
    background: '#dbeafe',
    color: '#1e40af',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px'
  },
  notes: {
    background: '#fffbeb',
    border: '1px solid #fcd34d',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '12px',
    fontSize: '13px',
    color: '#92400e'
  },
  approvalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px'
  },
  approveBtn: {
    padding: '10px 20px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  rejectBtn: {
    padding: '10px 20px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  scheduleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  scheduleCard: {
    background: '#ecfdf5',
    border: '2px solid #a7f3d0',
    borderRadius: '12px',
    padding: '20px',
    transition: 'all 0.3s'
  },
  scheduleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  scheduleName: {
    color: '#1f2937',
    fontSize: '18px',
    fontWeight: '700',
    margin: 0
  },
  scheduleStatus: {
    background: '#d1fae5',
    color: '#065f46',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600'
  },
  scheduleDetails: {
    background: 'white',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '12px',
    fontSize: '13px'
  },
  scheduleAction: {
    display: 'flex',
    gap: '12px'
  },
  scheduleBtn: {
    flex: 1,
    padding: '12px 20px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  tableCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #e5e7eb',
    marginBottom: '24px'
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
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  tr: {
    borderBottom: '1px solid #f3f4f6',
    transition: 'background 0.2s'
  },
  td: {
    padding: '12px 8px',
    color: '#6b7280'
  },
  reviewBtn: {
    padding: '6px 16px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  menuGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '30px'
  },
  menuCard: {
    backgroundColor: 'white',
    padding: '20px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  menuIcon: {
    fontSize: '40px',
    marginBottom: '12px'
  },
  menuTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '8px 0'
  },
  menuDesc: {
    fontSize: '13px',
    color: '#6b7280',
    margin: '8px 0 0 0'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
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

export default HRDashboard;
