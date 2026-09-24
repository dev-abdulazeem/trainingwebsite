import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';
import { useEffect } from 'react';

// Layouts
import MainLayout from '@components/layouts/MainLayout';
import DashboardLayout from '@components/layouts/DashboardLayout';
import AdminLayout from '@components/layouts/AdminLayout';

// Public pages
import LandingPage from '@pages/LandingPage';
import LoginPage from '@pages/auth/LoginPage';
import RegisterPage from '@pages/auth/RegisterPage';
import PaymentPage from '@pages/payment/PaymentPage';
import PaymentSuccess from '@pages/payment/PaymentSuccess';

// Student pages
import StudentDashboard from '@pages/student/Dashboard';
import CoursePage from '@pages/student/CoursePage';
import LessonPage from '@pages/student/LessonPage';
import AssignmentsPage from '@pages/student/AssignmentsPage';
import CommunityPage from '@pages/student/CommunityPage';
import SettingsPage from '@pages/student/SettingsPage';
import CommunityPost from '@pages/student/CommunityPost'; 

// Admin pages
import AdminDashboard from '@pages/admin/Dashboard';
import AdminStudents from '@pages/admin/Students';
import AdminCourses from '@pages/admin/Courses';
import AdminCourseDetail from '@pages/admin/CourseDetail';
import AdminCoupons from '@pages/admin/Coupons';
import AdminSubmissions from '@pages/admin/Submissions';
import AdminCommunity from '@pages/admin/Community';

// Components
import ProtectedRoute from '@components/auth/ProtectedRoute';
import AdminRoute from '@components/auth/AdminRoute';

function App() {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes - Landing Page Layout ONLY */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
      </Route>

      {/* Student dashboard routes - Dashboard Layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<StudentDashboard />} />
          
          {/*  MOVED HERE: /course now uses DashboardLayout, not MainLayout */}
          <Route path="/course" element={<CoursePage />} />
          <Route path="/course/:courseId" element={<CoursePage />} />
          
          <Route path="/lesson/:lessonId" element={<LessonPage />} />
          <Route path="/assignments" element={<AssignmentsPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/community/:id" element={<CommunityPost />} />
        </Route>
      </Route>

      {/* Admin routes */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/students" element={<AdminStudents />} />
          <Route path="/admin/courses" element={<AdminCourses />} />
          <Route path="/admin/courses/:courseId" element={<AdminCourseDetail />} />
          <Route path="/admin/coupons" element={<AdminCoupons />} />
          <Route path="/admin/submissions" element={<AdminSubmissions />} />
          <Route path="/admin/community" element={<AdminCommunity />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;