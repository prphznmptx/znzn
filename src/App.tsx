import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import Dashboard from './pages/Dashboard';
import Account from './pages/Account';
import FeedPage from './pages/FeedPage';
import Media from './pages/Media';
import Masterclass from './pages/Masterclass';
import CourseDetailPage from './pages/CourseDetailPage';
import EnrollmentCallback from './pages/EnrollmentCallback';
import Content from './pages/Content';
import Events from './pages/Events';
import Portfolio from './pages/Portfolio';
import Projects from './pages/Projects';
import HelpCenter from './pages/HelpCenter';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-xl font-medium text-slate-700">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { loading } = useAuth();

  useEffect(() => {
    // Pre-load Mux Player script for seamless video playback
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@mux/mux-player';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-xl font-medium text-slate-700">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <FeedPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />
        {/* Media and Content routes */}
        <Route path="/media" element={<Media />} />
        <Route
          path="/content"
          element={
            <ProtectedRoute>
              <Content />
            </ProtectedRoute>
          }
        />
        {/* Masterclass routes */}
        <Route path="/masterclass" element={<Masterclass />} />
        <Route path="/course/:courseId" element={<CourseDetailPage />} />
        <Route path="/enrollment-callback" element={<EnrollmentCallback />} />
        {/* Help Center route */}
        <Route path="/help-center" element={<HelpCenter />} />
        {/* Events route */}
        <Route path="/events" element={<Events />} />
        {/* Portfolio route */}
        <Route
          path="/portfolio"
          element={
            <ProtectedRoute>
              <Portfolio />
            </ProtectedRoute>
          }
        />
        <Route path="/projects" element={<Projects />} />
        <Route path="/settings" element={<LandingPage />} />
        <Route path="/account" element={<LandingPage />} />
        <Route path="/connect" element={<LandingPage />} />
        <Route path="/member-membership" element={<LandingPage />} />
        <Route path="/creator-membership" element={<LandingPage />} />
        <Route path="/profile" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
