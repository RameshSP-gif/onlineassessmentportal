import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../api';

const ReportsPage = () => {
  const [dashboardStats, setDashboardStats] = useState({});
  const [examStats, setExamStats] = useState([]);
  const [userPerformance, setUserPerformance] = useState([]);
  const [examPayments, setExamPayments] = useState([]);
  const [interviewPayments, setInterviewPayments] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const [
        dashboardResponse,
        examsResponse,
        usersResponse,
        examPaymentsResponse,
        interviewPaymentsResponse,
        interviewsResponse,
        submissionsResponse
      ] = await Promise.all([
        axios.get('http://localhost:5001/api/admin/dashboard-stats', {
          headers: { 'x-auth-token': token }
        }).catch(() => ({ data: {} })),
        
        axios.get('http://localhost:5001/api/exams', {
          headers: { 'x-auth-token': token }
        }).catch(() => ({ data: [] })),
        
        axios.get('http://localhost:5001/api/admin/users', {
          headers: { 'x-auth-token': token }
        }).catch(() => ({ data: [] })),
        
        axios.get('http://localhost:5001/api/payments', {
          headers: { 'x-auth-token': token }
        }).catch(() => ({ data: [] })),
        
        axios.get('http://localhost:5001/api/interview-payments', {
          headers: { 'x-auth-token': token }
        }).catch(() => ({ data: [] })),
        
        axios.get('http://localhost:5001/api/interviews', {
          headers: { 'x-auth-token': token }
        }).catch(() => ({ data: [] })),
        
        axios.get('http://localhost:5001/api/submissions', {
          headers: { 'x-auth-token': token }
        }).catch(() => ({ data: [] }))
      ]);

      setDashboardStats(dashboardResponse.data);
      
      // Ensure arrays are valid
      const examsData = Array.isArray(examsResponse.data) ? examsResponse.data : [];
      const usersData = Array.isArray(usersResponse.data) ? usersResponse.data : [];
      const examPaymentsData = Array.isArray(examPaymentsResponse.data) ? examPaymentsResponse.data : [];
      const interviewPaymentsData = Array.isArray(interviewPaymentsResponse.data) ? interviewPaymentsResponse.data : [];
      const interviewsData = Array.isArray(interviewsResponse.data) ? interviewsResponse.data : [];
      const submissionsData = Array.isArray(submissionsResponse.data) ? submissionsResponse.data : [];

      // Calculate exam statistics
      const examStatsData = examsData.map(exam => {
        const examSubmissions = submissionsData.filter(sub => 
          sub.examId?.toString() === exam._id?.toString()
        );
        
        const totalAttempts = examSubmissions.length;
        const avgScore = totalAttempts > 0 
          ? (examSubmissions.reduce((sum, sub) => sum + (sub.score || 0), 0) / totalAttempts).toFixed(2)
          : 0;
        
        return {
          examId: exam._id,
          examTitle: exam.title,
          totalQuestions: exam.questions?.length || 0,
          totalAttempts,
          avgScore
        };
      });

      // Calculate user performance
      const userPerformanceData = usersData.filter(user => user.role === 'student').map(user => {
        const userSubmissions = submissionsData.filter(sub => 
          sub.userId?.toString() === user._id?.toString()
        );
        
        const totalExams = userSubmissions.length;
        const avgScore = totalExams > 0
          ? (userSubmissions.reduce((sum, sub) => sum + (sub.score || 0), 0) / totalExams).toFixed(2)
          : 0;
        
        return {
          userId: user._id,
          userName: user.name,
          email: user.email,
          totalExams,
          avgScore
        };
      });

      setExamStats(examStatsData);
      setUserPerformance(userPerformanceData);
      setExamPayments(examPaymentsData);
      setInterviewPayments(interviewPaymentsData);
      setInterviews(interviewsData);
      setSubmissions(submissionsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reports data:', error);
      setLoading(false);
    }
  };

  const getExamTitle = (examId) => {
    const exam = examStats.find(e => e.examId?.toString() === examId?.toString());
    return exam ? exam.examTitle : 'Unknown';
  };

  const getStudentName = (userId) => {
    const user = userPerformance.find(u => u.userId?.toString() === userId?.toString());
    return user ? user.userName : 'Unknown';
  };

  const getCourseTitle = (courseId) => {
    const course = interviews.find(c => c._id?.toString() === courseId?.toString());
    return course ? course.title : 'Unknown';
  };

  const downloadCSV = () => {
    let csvContent = '';
    
    // Overall Statistics
    csvContent += '=== OVERALL STATISTICS ===\n';
    csvContent += `Total Students,${dashboardStats.totalStudents || 0}\n`;
    csvContent += `Total Exams,${dashboardStats.totalExams || 0}\n`;
    csvContent += `Total Interviews,${dashboardStats.totalInterviews || 0}\n`;
    csvContent += `Total Revenue,₹${dashboardStats.totalRevenue || 0}\n`;
    csvContent += `Pending Payments,${dashboardStats.pendingPayments || 0}\n`;
    csvContent += `Total Submissions,${submissions.length}\n\n`;

    // Exam Performance Report
    csvContent += '=== EXAM PERFORMANCE REPORT ===\n';
    csvContent += 'Exam Title,Total Questions,Total Attempts,Average Score\n';
    examStats.forEach(stat => {
      csvContent += `"${stat.examTitle}",${stat.totalQuestions},${stat.totalAttempts},${stat.avgScore}\n`;
    });
    csvContent += '\n';

    // Student Performance Report
    csvContent += '=== STUDENT PERFORMANCE REPORT ===\n';
    csvContent += 'Student Name,Email,Total Exams Taken,Average Score\n';
    userPerformance.forEach(user => {
      csvContent += `"${user.userName}","${user.email}",${user.totalExams},${user.avgScore}\n`;
    });
    csvContent += '\n';

    // Pending Exam Payments
    csvContent += '=== PENDING EXAM PAYMENTS ===\n';
    csvContent += 'Student Name,Exam Title,Amount,Order ID,Status\n';
    examPayments.filter(p => p.status === 'pending').forEach(payment => {
      csvContent += `"${getStudentName(payment.userId)}","${getExamTitle(payment.examId)}",₹${payment.amount},"${payment.orderId}",${payment.status}\n`;
    });
    csvContent += '\n';

    // Pending Interview Payments
    csvContent += '=== PENDING INTERVIEW PAYMENTS ===\n';
    csvContent += 'Student Name,Interview Course,Amount,Order ID,Status\n';
    interviewPayments.filter(p => p.status === 'pending').forEach(payment => {
      csvContent += `"${getStudentName(payment.userId)}","${getCourseTitle(payment.courseId)}",₹${payment.amount},"${payment.orderId}",${payment.status}\n`;
    });
    csvContent += '\n';

    // Exam Inventory
    csvContent += '=== EXAM INVENTORY ===\n';
    csvContent += 'Exam Title,Duration (minutes),Total Questions,Active\n';
    examStats.forEach(exam => {
      csvContent += `"${exam.examTitle}",${exam.duration || 'N/A'},${exam.totalQuestions},${exam.active ? 'Yes' : 'No'}\n`;
    });
    csvContent += '\n';

    // Interview Courses
    csvContent += '=== INTERVIEW COURSES ===\n';
    csvContent += 'Course Title,Duration (minutes),Total Enrolled\n';
    interviews.forEach(interview => {
      const enrolled = interviewPayments.filter(p => 
        p.courseId?.toString() === interview._id?.toString() && p.status === 'approved'
      ).length;
      csvContent += `"${interview.title}",${interview.duration || 'N/A'},${enrolled}\n`;
    });

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `comprehensive_reports_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h1>Loading Reports...</h1>
      </div>
    );
  }

  const pendingExamPayments = Array.isArray(examPayments) 
    ? examPayments.filter(p => p.status === 'pending') 
    : [];
  
  const pendingInterviewPayments = Array.isArray(interviewPayments) 
    ? interviewPayments.filter(p => p.status === 'pending') 
    : [];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📊 Comprehensive Reports Dashboard</h1>
        <button onClick={downloadCSV} style={styles.downloadBtn}>
          📥 Download Full Report (CSV)
        </button>
      </div>

      {/* Overall Statistics */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📈 Overall Statistics</h2>
        <div style={styles.statsGrid}>
          <div style={{...styles.statCard, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
            <div style={styles.statIcon}>👥</div>
            <div style={styles.statValue}>{dashboardStats.totalStudents || 0}</div>
            <div style={styles.statLabel}>Total Students</div>
          </div>
          <div style={{...styles.statCard, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'}}>
            <div style={styles.statIcon}>📝</div>
            <div style={styles.statValue}>{dashboardStats.totalExams || 0}</div>
            <div style={styles.statLabel}>Total Exams</div>
          </div>
          <div style={{...styles.statCard, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'}}>
            <div style={styles.statIcon}>🎤</div>
            <div style={styles.statValue}>{dashboardStats.totalInterviews || 0}</div>
            <div style={styles.statLabel}>Interview Courses</div>
          </div>
          <div style={{...styles.statCard, background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'}}>
            <div style={styles.statIcon}>💰</div>
            <div style={styles.statValue}>₹{dashboardStats.totalRevenue || 0}</div>
            <div style={styles.statLabel}>Total Revenue</div>
          </div>
          <div style={{...styles.statCard, background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'}}>
            <div style={styles.statIcon}>⏳</div>
            <div style={styles.statValue}>{dashboardStats.pendingPayments || 0}</div>
            <div style={styles.statLabel}>Pending Payments</div>
          </div>
          <div style={{...styles.statCard, background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'}}>
            <div style={styles.statIcon}>✅</div>
            <div style={styles.statValue}>{submissions.length}</div>
            <div style={styles.statLabel}>Total Submissions</div>
          </div>
        </div>
      </div>

      {/* Exam Performance Report */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📚 Exam Performance Report</h2>
        {examStats.length > 0 ? (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Exam Title</th>
                  <th style={styles.th}>Total Questions</th>
                  <th style={styles.th}>Total Attempts</th>
                  <th style={styles.th}>Average Score</th>
                </tr>
              </thead>
              <tbody>
                {examStats.map((stat, index) => (
                  <tr key={index} style={styles.tableRow}>
                    <td style={styles.td}>{stat.examTitle}</td>
                    <td style={styles.td}>{stat.totalQuestions}</td>
                    <td style={styles.td}>{stat.totalAttempts}</td>
                    <td style={styles.td}>{stat.avgScore}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={styles.noData}>No exam performance data available.</p>
        )}
      </div>

      {/* Student Performance Report */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🎓 Student Performance Report</h2>
        {userPerformance.length > 0 ? (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Student Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Total Exams Taken</th>
                  <th style={styles.th}>Average Score</th>
                </tr>
              </thead>
              <tbody>
                {userPerformance.map((user, index) => (
                  <tr key={index} style={styles.tableRow}>
                    <td style={styles.td}>{user.userName}</td>
                    <td style={styles.td}>{user.email}</td>
                    <td style={styles.td}>{user.totalExams}</td>
                    <td style={styles.td}>{user.avgScore}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={styles.noData}>No student performance data available.</p>
        )}
      </div>

      {/* Pending Payments Report */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>⏳ Pending Payments Report</h2>
        
        <h3 style={styles.subTitle}>Exam Payments</h3>
        {pendingExamPayments.length > 0 ? (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Student Name</th>
                  <th style={styles.th}>Exam Title</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Order ID</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingExamPayments.map((payment, index) => (
                  <tr key={index} style={styles.tableRow}>
                    <td style={styles.td}>{getStudentName(payment.userId)}</td>
                    <td style={styles.td}>{getExamTitle(payment.examId)}</td>
                    <td style={styles.td}>₹{payment.amount}</td>
                    <td style={styles.td}>{payment.orderId}</td>
                    <td style={styles.td}>
                      <span style={styles.pendingBadge}>Pending</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={styles.noData}>No pending exam payments.</p>
        )}

        <h3 style={{...styles.subTitle, marginTop: '30px'}}>Interview Payments</h3>
        {pendingInterviewPayments.length > 0 ? (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Student Name</th>
                  <th style={styles.th}>Interview Course</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Order ID</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingInterviewPayments.map((payment, index) => (
                  <tr key={index} style={styles.tableRow}>
                    <td style={styles.td}>{getStudentName(payment.userId)}</td>
                    <td style={styles.td}>{getCourseTitle(payment.courseId)}</td>
                    <td style={styles.td}>₹{payment.amount}</td>
                    <td style={styles.td}>{payment.orderId}</td>
                    <td style={styles.td}>
                      <span style={styles.pendingBadge}>Pending</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={styles.noData}>No pending interview payments.</p>
        )}
      </div>

      {/* Exam Inventory Report */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📋 Exam Inventory</h2>
        {examStats.length > 0 ? (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Exam Title</th>
                  <th style={styles.th}>Total Questions</th>
                  <th style={styles.th}>Total Attempts</th>
                  <th style={styles.th}>Average Score</th>
                </tr>
              </thead>
              <tbody>
                {examStats.map((exam, index) => (
                  <tr key={index} style={styles.tableRow}>
                    <td style={styles.td}>{exam.examTitle}</td>
                    <td style={styles.td}>{exam.totalQuestions}</td>
                    <td style={styles.td}>{exam.totalAttempts}</td>
                    <td style={styles.td}>{exam.avgScore}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={styles.noData}>No exams available.</p>
        )}
      </div>

      {/* Interview Courses Report */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🎤 Interview Courses Report</h2>
        {interviews.length > 0 ? (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Course Title</th>
                  <th style={styles.th}>Duration</th>
                  <th style={styles.th}>Total Enrolled</th>
                  <th style={styles.th}>Pending Approvals</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map((interview, index) => {
                  const approvedCount = interviewPayments.filter(p => 
                    p.courseId?.toString() === interview._id?.toString() && p.status === 'approved'
                  ).length;
                  const pendingCount = interviewPayments.filter(p => 
                    p.courseId?.toString() === interview._id?.toString() && p.status === 'pending'
                  ).length;

                  return (
                    <tr key={index} style={styles.tableRow}>
                      <td style={styles.td}>{interview.title}</td>
                      <td style={styles.td}>{interview.duration ? `${interview.duration} mins` : 'N/A'}</td>
                      <td style={styles.td}>{approvedCount}</td>
                      <td style={styles.td}>{pendingCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={styles.noData}>No interview courses available.</p>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '15px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1a202c',
    margin: 0,
  },
  downloadBtn: {
    backgroundColor: '#4299e1',
    color: 'white',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  section: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: '20px',
    borderBottom: '3px solid #4299e1',
    paddingBottom: '10px',
  },
  subTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#4a5568',
    marginBottom: '15px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  },
  statCard: {
    padding: '25px',
    borderRadius: '12px',
    color: 'white',
    textAlign: 'center',
    boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
    transition: 'transform 0.3s ease',
  },
  statIcon: {
    fontSize: '36px',
    marginBottom: '10px',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  statLabel: {
    fontSize: '14px',
    opacity: 0.9,
    fontWeight: '500',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white',
  },
  tableHeader: {
    backgroundColor: '#4299e1',
    color: 'white',
  },
  th: {
    padding: '15px',
    textAlign: 'left',
    fontWeight: 'bold',
    fontSize: '14px',
    borderBottom: '2px solid #e2e8f0',
  },
  tableRow: {
    borderBottom: '1px solid #e2e8f0',
    transition: 'background-color 0.2s ease',
  },
  td: {
    padding: '15px',
    fontSize: '14px',
    color: '#4a5568',
  },
  pendingBadge: {
    backgroundColor: '#fbbf24',
    color: '#78350f',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  noData: {
    textAlign: 'center',
    color: '#a0aec0',
    fontSize: '16px',
    padding: '30px',
    fontStyle: 'italic',
  },
};

export default ReportsPage;
