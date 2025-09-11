
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentQuizList from './pages/student/StudentQuizList';
import StudentQuizView from './pages/student/StudentQuizView';
import StudentProgress from './pages/student/StudentProgress';
import MentorDashboard from './pages/mentor/MentorDashboard';
import MentorCourseManagement from './pages/mentor/MentorCourseManagement';
import MentorQuizManagement from './pages/mentor/MentorQuizManagement';
import MentorStudentAnalytics from './pages/mentor/MentorStudentAnalytics';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUserManagement from './pages/admin/AdminUserManagement';
import AdminCreateUser from './pages/admin/AdminCreateUser';
import AdminCourseAnalytics from './pages/admin/AdminCourseAnalytics';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
};

const AppRoutes: React.FC = () => {
    const { user } = useAuth();

    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route 
                path="/" 
                element={
                    <ProtectedRoute>
                        <Layout>
                            <Dashboard />
                        </Layout>
                    </ProtectedRoute>
                } 
            />

            {/* Student Routes */}
            <Route path="/student" element={<ProtectedRoute roles={['student']}><Layout><StudentDashboard /></Layout></ProtectedRoute>} />
            <Route path="/student/quizzes" element={<ProtectedRoute roles={['student']}><Layout><StudentQuizList /></Layout></ProtectedRoute>} />
            <Route path="/student/quiz/:quizId" element={<ProtectedRoute roles={['student']}><Layout><StudentQuizView /></Layout></ProtectedRoute>} />
            <Route path="/student/progress" element={<ProtectedRoute roles={['student']}><Layout><StudentProgress /></Layout></ProtectedRoute>} />
            
            {/* Mentor Routes */}
            <Route path="/mentor" element={<ProtectedRoute roles={['mentor']}><Layout><MentorDashboard /></Layout></ProtectedRoute>} />
            <Route path="/mentor/courses" element={<ProtectedRoute roles={['mentor']}><Layout><MentorCourseManagement /></Layout></ProtectedRoute>} />
            <Route path="/mentor/course/:courseId/quizzes" element={<ProtectedRoute roles={['mentor']}><Layout><MentorQuizManagement /></Layout></ProtectedRoute>} />
            <Route path="/mentor/analytics" element={<ProtectedRoute roles={['mentor']}><Layout><MentorStudentAnalytics /></Layout></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><Layout><AdminUserManagement /></Layout></ProtectedRoute>} />
            <Route path="/admin/users/create" element={<ProtectedRoute roles={['admin']}><Layout><AdminCreateUser /></Layout></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute roles={['admin']}><Layout><AdminCourseAnalytics /></Layout></ProtectedRoute>} />

            <Route path="*" element={<Navigate to={user ? '/' : '/login'} />} />
        </Routes>
    );
}


export default App;