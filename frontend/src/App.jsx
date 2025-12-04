import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { initializeAnalytics, trackPageView, setAnalyticsUser, clearAnalyticsUser } from './utils/analytics';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HiddenProfileProvider } from './context/HiddenProfileContext';
import { LanguageProvider } from './context/LanguageContext';
import { MaintenanceModeProvider, useMaintenanceMode } from './context/MaintenanceModeContext';
import { EventLabelProvider } from './context/EventLabelContext';
import { LockProvider } from './context/LockContext';

import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Users from './pages/Users';
import PayOnline from './pages/PayOnline';
import Settings from './pages/Settings';
import Stats from './pages/Stats';
import Income from './pages/Income';
import Expense from './pages/Expense';
import Estimation from './pages/Estimation';
import Verification from './pages/Verification';
import RecycleBin from './pages/RecycleBin';
import AdminPanel from './pages/AdminPanel';
import DeveloperOptions from './pages/DeveloperOptions';
import Vibe from './pages/Vibe';
import Moments from './pages/Moments';
import Activities from './pages/Activities';
import Notifications from './pages/Notifications';
import MaintenancePage from './pages/Maintenance';
import TechStack from './pages/TechStack';
import ActivityLogs from './pages/ActivityLogs';
import Committee from './pages/Committee';
import Records from './pages/Records';
import Histories from './pages/Histories';
import Monitor from './pages/Monitor';
import ViniPage from './pages/vini';
import AuthSessions from './pages/AuthSessions';
import Tools from './pages/Tools';
import Explore from './components/Explore';

import ProtectedRoute from './components/ProtectedRoute';
import PopupBanner from './components/adminPanel/PopupBanner';
import FloatingMusicIcon from './components/vibe/FloatingMusicIcon';
import OfflineIndicator from './components/common/OfflineIndicator';
import ErrorBoundary from './components/common/ErrorBoundary';
import VersionUpdate from './components/common/VersionUpdate';


function AppContent() {
  const { user } = useAuth();
  const { isMaintenanceMode } = useMaintenanceMode();
  const location = useLocation(); 

  useEffect(() => {
    if (user && user.registerId) {
      setAnalyticsUser(user.registerId);
    } else {
      clearAnalyticsUser();
    }
    const path = location.pathname + location.search;
    trackPageView(path);
  }, [user, location]); 

  if (isMaintenanceMode && user?.role !== 'developer') {
    return <MaintenancePage />;
  }


  return (
    <>
      <Toaster position="top-right" />
      <PopupBanner />

      <Routes>
        {/* Public Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
        </Route>

        {/* Protected Dashboard Routes */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/users" element={<Users />} />
          <Route path="/pay-online" element={<PayOnline />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/income" element={<Income />} />
          <Route path="/expense" element={<Expense />} />
          <Route path="/estimation" element={<Estimation />} />
          <Route path="/verification" element={<Verification />} />
          <Route path="/recycle-bin" element={<RecycleBin />} />
          <Route path="/admin-panel" element={<AdminPanel />} />
          <Route path="/developer-options" element={<DeveloperOptions />} />
          <Route path="/vibe" element={<Vibe />} />
          <Route path="/moments" element={<Moments />} />
          <Route path="/moments/:id" element={<Moments />} />
          <Route path="/moments/:id/media/:mediaId" element={<Moments />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/tech-stack" element={<TechStack />} />
          <Route path="/activity-logs" element={<ActivityLogs />} />
          <Route path="/committee" element={<Committee />} />
          <Route path="/records" element={<Records />} />
          <Route path="/histories" element={<Histories />} />
          <Route path="/monitor" element={<Monitor />} />
          <Route path="/auth-sessions" element={<AuthSessions />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/tools" element={<Tools />} />
        </Route>
      </Routes>

      {user && <ViniPage />}
      {user && <FloatingMusicIcon />}
      <OfflineIndicator />
    </>
  );
}


// Root App Wrapper
function App() {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  useEffect(() => {
    initializeAnalytics();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .catch((error) => console.error('Service Worker registration failed:', error));

      // Only show dialog if a service worker was already controlling the page
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          setShowUpdateDialog(true);
        });
      }
    }
  }, []);

  const handleReload = () => {  window.location.reload(); };
  const handleLater = () => { setShowUpdateDialog(false); };


  return (
    <AuthProvider>
      <LanguageProvider>
        <HiddenProfileProvider>
          <MaintenanceModeProvider>
            <EventLabelProvider>
              <LockProvider>
                <Router>
                  <ErrorBoundary>
                    <AppContent />
                  </ErrorBoundary>
                </Router>
              </LockProvider>
            </EventLabelProvider>
          </MaintenanceModeProvider>
        </HiddenProfileProvider>
      </LanguageProvider>
      <VersionUpdate isOpen={showUpdateDialog} onReload={handleReload} onLater={handleLater} />
    </AuthProvider>
  );
}

export default App;
