import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
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

function App() {
  const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
  };

  const ProtectedRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/exams" element={<ProtectedRoute><ExamList /></ProtectedRoute>} />
        <Route path="/payment-status" element={<ProtectedRoute><PaymentStatus /></ProtectedRoute>} />
        <Route path="/payment/:examId" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
        <Route path="/take-exam/:id" element={<ProtectedRoute><TakeExam /></ProtectedRoute>} />
        <Route path="/exam/:id" element={<ProtectedRoute><TakeExam /></ProtectedRoute>} />
        <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
        <Route path="/interview" element={<ProtectedRoute><VideoInterview /></ProtectedRoute>} />
        
        {/* Interview Routes */}
        <Route path="/interviews" element={<ProtectedRoute><InterviewList /></ProtectedRoute>} />
        <Route path="/interview-status" element={<ProtectedRoute><InterviewStatus /></ProtectedRoute>} />
        <Route path="/interview-payment/:courseId" element={<ProtectedRoute><InterviewPayment /></ProtectedRoute>} />
        <Route path="/take-interview/:courseId" element={<ProtectedRoute><TakeInterview /></ProtectedRoute>} />
        
        {/* Interviewer Routes */}
        <Route path="/interviewer/register" element={<InterviewerRegister />} />
        <Route path="/interviewer/login" element={<InterviewerLogin />} />
        <Route path="/interviewer/dashboard" element={<ProtectedRoute><InterviewerDashboard /></ProtectedRoute>} />
        <Route path="/interviewer/interview/:sessionId" element={<ProtectedRoute><InterviewerVideoInterview /></ProtectedRoute>} />
        <Route path="/interviewer/review/:sessionId" element={<ProtectedRoute><InterviewReview /></ProtectedRoute>} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/students" element={<ProtectedRoute><StudentManagement /></ProtectedRoute>} />
        <Route path="/admin/exams" element={<ProtectedRoute><ExamManagement /></ProtectedRoute>} />
        <Route path="/admin/payments" element={<ProtectedRoute><AdminPaymentVerification /></ProtectedRoute>} />
        <Route path="/admin/interview-payments" element={<ProtectedRoute><AdminInterviewPayments /></ProtectedRoute>} />
        <Route path="/admin/fees" element={<ProtectedRoute><FeeManagement /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/admin/submissions" element={<ProtectedRoute><SubmissionsView /></ProtectedRoute>} />
        
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
