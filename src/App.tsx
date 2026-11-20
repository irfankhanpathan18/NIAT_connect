import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { FloatingChatbot } from './components/FloatingChatbot';

// Auth Pages
import { AdminLogin } from './pages/auth/AdminLogin';
import { StudentLogin } from './pages/auth/StudentLogin';
import { StudentRegister } from './pages/auth/StudentRegister';
import { ForgotPassword } from './pages/auth/ForgotPassword';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { LeadManagement } from './pages/admin/LeadManagement';
import { AILeadFiltration } from './pages/admin/AILeadFiltration';
import { LeadAnalytics } from './pages/admin/LeadAnalytics';
import { FollowUpManagement } from './pages/admin/FollowUpManagement';
import { EventManager } from './pages/admin/EventManager';
import { KnowledgeBaseManager } from './pages/admin/KnowledgeBaseManager';
import { ReferralManagement } from './pages/admin/ReferralManagement';
import { SwagStoreManagement } from './pages/admin/SwagStoreManagement';
import { AIFactsManagement } from './pages/admin/AIFactsManagement';
import { PuzzleManagement } from './pages/admin/PuzzleManagement';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { EventCalendar } from './pages/student/EventCalendar';
import { AIChatbot } from './pages/student/AIChatbot';
import { StudentProfilePage } from './pages/student/StudentProfile';
import { FAQAndGuidelines } from './pages/student/FAQAndGuidelines';
import { StudentReferrals } from './pages/student/StudentReferrals';
import { SwagStore } from './pages/student/SwagStore';
import { AIFactsPage } from './pages/student/AIFactsPage';
import { PuzzleGames } from './pages/student/PuzzleGames';

const AuthenticatedLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto bg-slate-50/70">
          <Routes>
            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/leads" element={<LeadManagement />} />
              <Route path="/admin/ai-leads" element={<AILeadFiltration />} />
              <Route path="/admin/analytics" element={<LeadAnalytics />} />
              <Route path="/admin/referrals" element={<ReferralManagement />} />
              <Route path="/admin/swag-store" element={<SwagStoreManagement />} />
              <Route path="/admin/ai-facts" element={<AIFactsManagement />} />
              <Route path="/admin/puzzles" element={<PuzzleManagement />} />
              <Route path="/admin/follow-ups" element={<FollowUpManagement />} />
              <Route path="/admin/events" element={<EventManager />} />
              <Route path="/admin/knowledge-base" element={<KnowledgeBaseManager />} />
            </Route>

            {/* Student Routes */}
            <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/referrals" element={<StudentReferrals />} />
              <Route path="/student/swag-store" element={<SwagStore />} />
              <Route path="/student/ai-facts" element={<AIFactsPage />} />
              <Route path="/student/puzzles" element={<PuzzleGames />} />
              <Route path="/student/calendar" element={<EventCalendar />} />
              <Route path="/student/ai-assistant" element={<AIChatbot />} />
              <Route path="/student/profile" element={<StudentProfilePage />} />
              <Route path="/student/faq" element={<FAQAndGuidelines />} />
            </Route>

            {/* Default Catch-all */}
            <Route path="/" element={<HomeRedirect />} />
            <Route path="*" element={<HomeRedirect />} />
          </Routes>
        </main>

        {/* Global Student Floating Chatbot */}
        <FloatingChatbot />
      </div>
    </div>
  );
};

const HomeRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'ADMIN' ? (
    <Navigate to="/admin/dashboard" replace />
  ) : (
    <Navigate to="/student/dashboard" replace />
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Separate Public Authentication Systems */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/forgot-password" element={<ForgotPassword />} />
            
            <Route path="/login" element={<StudentLogin />} />
            <Route path="/student/login" element={<StudentLogin />} />
            <Route path="/register" element={<StudentRegister />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Authenticated Protected Shell */}
            <Route path="/*" element={<AuthenticatedLayout />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
