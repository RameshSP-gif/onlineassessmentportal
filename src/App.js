import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ChangePassword from './components/ChangePassword';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import ExamList from './components/ExamList';
import TakeExam from './components/TakeExam';
import Payment from './components/Payment';
import PaymentStatus from './components/PaymentStatus';
import Results from './components/Results';
import VideoInterview from './components/VideoInterview';
import InterviewList from './components/InterviewList';
import InterviewPayment from './components/InterviewPayment';
import TakeInterview from './components/TakeInterview';
import InterviewStatus from './components/InterviewStatus';
import AdminInterviewPayments from './components/AdminInterviewPayments';
import AdminDashboard from './components/AdminDashboard';
import StudentManagement from './components/StudentManagement';
import ExamManagement from './components/ExamManagement';
import FeeManagement from './components/FeeManagement';
import ReportsPage from './components/ReportsPage';
import NotificationsPage from './components/NotificationsPage';
import SubmissionsView from './components/SubmissionsView';
import AdminPaymentVerification from './components/AdminPaymentVerification';
import InterviewerRegister from './components/InterviewerRegister';
import InterviewerLogin from './components/InterviewerLogin';
import InterviewerDashboard from './components/InterviewerDashboard';
import InterviewerVideoInterview from './components/InterviewerVideoInterview';
import InterviewReview from './components/InterviewReview';
import RoleManagement from './components/RoleManagement';
import UserManagement from './components/UserManagement';
import HRDashboard from './components/HRDashboard';
import StudentInterviewRequests from './components/StudentInterviewRequests';

function App() {
  const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
  };

  const getUserRole = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role;
  };

  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!isAuthenticated()) {
      return <Navigate to="/login" />;
    }
    if (allowedRoles && !allowedRoles.includes(getUserRole())) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  return (
    <Router>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Password Management - Protected Routes */}
        <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
        
        {/* Profile Route - Available to all authenticated users */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        
        {/* Student Routes */}
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['student']}><Dashboard /></ProtectedRoute>} />
        <Route path="/exams" element={<ProtectedRoute allowedRoles={['student']}><ExamList /></ProtectedRoute>} />
        <Route path="/payment-status" element={<ProtectedRoute allowedRoles={['student']}><PaymentStatus /></ProtectedRoute>} />
        <Route path="/payment/:examId" element={<ProtectedRoute allowedRoles={['student']}><Payment /></ProtectedRoute>} />
        <Route path="/take-exam/:id" element={<ProtectedRoute allowedRoles={['student']}><TakeExam /></ProtectedRoute>} />
        <Route path="/exam/:id" element={<ProtectedRoute allowedRoles={['student']}><TakeExam /></ProtectedRoute>} />
        <Route path="/results" element={<ProtectedRoute allowedRoles={['student']}><Results /></ProtectedRoute>} />
        <Route path="/interview" element={<ProtectedRoute allowedRoles={['student']}><VideoInterview /></ProtectedRoute>} />
        
        {/* Student Interview Routes */}
        <Route path="/interviews" element={<ProtectedRoute allowedRoles={['student']}><InterviewList /></ProtectedRoute>} />
        <Route path="/interview-status" element={<ProtectedRoute allowedRoles={['student']}><InterviewStatus /></ProtectedRoute>} />
        <Route path="/interview-payment/:courseId" element={<ProtectedRoute allowedRoles={['student']}><InterviewPayment /></ProtectedRoute>} />
        <Route path="/take-interview/:courseId" element={<ProtectedRoute allowedRoles={['student']}><TakeInterview /></ProtectedRoute>} />
        <Route path="/interview-requests" element={<ProtectedRoute allowedRoles={['student']}><StudentInterviewRequests /></ProtectedRoute>} />
        
        {/* Interviewer Routes */}
        <Route path="/interviewer/register" element={<InterviewerRegister />} />
        <Route path="/interviewer/login" element={<InterviewerLogin />} />
        <Route path="/interviewer/dashboard" element={<ProtectedRoute allowedRoles={['interviewer']}><InterviewerDashboard /></ProtectedRoute>} />
        <Route path="/interviewer/interview/:sessionId" element={<ProtectedRoute allowedRoles={['interviewer']}><InterviewerVideoInterview /></ProtectedRoute>} />
        <Route path="/interviewer/review/:sessionId" element={<ProtectedRoute allowedRoles={['interviewer']}><InterviewReview /></ProtectedRoute>} />
        
        {/* HR Routes */}
        <Route path="/hr/dashboard" element={<ProtectedRoute allowedRoles={['hr']}><HRDashboard /></ProtectedRoute>} />
        <Route path="/hr/interview-requests" element={<ProtectedRoute allowedRoles={['hr']}><StudentInterviewRequests /></ProtectedRoute>} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['admin']}><StudentManagement /></ProtectedRoute>} />
        <Route path="/admin/exams" element={<ProtectedRoute allowedRoles={['admin']}><ExamManagement /></ProtectedRoute>} />
        <Route path="/admin/payments" element={<ProtectedRoute allowedRoles={['admin']}><AdminPaymentVerification /></ProtectedRoute>} />
        <Route path="/admin/interview-payments" element={<ProtectedRoute allowedRoles={['admin']}><AdminInterviewPayments /></ProtectedRoute>} />
        <Route path="/admin/fees" element={<ProtectedRoute allowedRoles={['admin']}><FeeManagement /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><ReportsPage /></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={['admin']}><NotificationsPage /></ProtectedRoute>} />
        <Route path="/admin/submissions" element={<ProtectedRoute allowedRoles={['admin']}><SubmissionsView /></ProtectedRoute>} />
        <Route path="/admin/roles" element={<ProtectedRoute allowedRoles={['admin']}><RoleManagement /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
        
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
