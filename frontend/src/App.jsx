import { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { initializeAnalytics, trackPageView, setAnalyticsUser, clearAnalyticsUser } from './utils/analytics';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HiddenProfileProvider } from './context/HiddenProfileContext';
import { LanguageProvider } from './context/LanguageContext';
import { MaintenanceModeProvider, useMaintenanceMode } from './context/MaintenanceModeContext';
import { MusicProvider } from './context/MusicContext';
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
import LetsPlay from './pages/LetsPlay';
import Notifications from './pages/Notifications';
import MaintenancePage from './pages/Maintenance';
import TechStack from './pages/TechStack';
import ActivityLogs from './pages/ActivityLogs';
import Committee from './pages/Committee';
import Records from './pages/Records';
import Histories from './pages/Histories';
import Monitor from './pages/Monitor';
import ViniPage from './pages/vini';
import AuthLogs from './pages/AuthLogs';
import Explore from './components/Explore';

import ProtectedRoute from './components/ProtectedRoute';
import PopupBanner from './components/adminPanel/PopupBanner';
import FloatingMusicIcon from './components/vibe/FloatingMusicIcon';
import OfflineIndicator from './components/common/OfflineIndicator';
import ErrorBoundary from './components/common/ErrorBoundary';
import UpdatePrompt from './components/common/UpdatePrompt';


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
          <Route path="/lets-play" element={<LetsPlay />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/tech-stack" element={<TechStack />} />
          <Route path="/activity-logs" element={<ActivityLogs />} />
          <Route path="/committee" element={<Committee />} />
          <Route path="/records" element={<Records />} />
          <Route path="/histories" element={<Histories />} />
          <Route path="/monitor" element={<Monitor />} />
          <Route path="/auth-logs" element={<AuthLogs />} />
          <Route path="/explore" element={<Explore />} />
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
  const [updateVisible, setUpdateVisible] = useState(false);
  const [waitingReg, setWaitingReg] = useState(null);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    initializeAnalytics();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          // If there's already an updated worker waiting, prompt immediately
          if (registration.waiting) {
            setWaitingReg(registration);
            setUpdateVisible(true);
          }

          // Listen for new updates found
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller // only prompt if already under SW control
              ) {
                setWaitingReg(registration);
                setUpdateVisible(true);
              }
            });
          });
        })
        .catch((error) => console.error('Service Worker registration failed:', error));

      // Reload only when we explicitly requested a refresh
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (isRefreshingRef.current) {
          window.location.reload();
        }
      });
    }
  }, []);

  const handleRefresh = () => {
    try {
      if (waitingReg?.waiting) {
        // Tell the waiting service worker to activate now
        waitingReg.waiting.postMessage({ type: 'SKIP_WAITING' });
        isRefreshingRef.current = true;
      }
    } finally {
      setUpdateVisible(false);
    }
  };

  const handleCancel = () => {
    // Do nothing: the waiting SW will activate next time the app is opened
    setUpdateVisible(false);
  };


  return (
    <AuthProvider>
      <LanguageProvider>
        <HiddenProfileProvider>
          <MaintenanceModeProvider>
            <EventLabelProvider>
              <LockProvider>
                <MusicProvider>
                  <Router>
                    <ErrorBoundary>
                      <AppContent />
                    </ErrorBoundary>
                  </Router>
                  <UpdatePrompt visible={!!updateVisible} onRefresh={handleRefresh} onCancel={handleCancel} />
                </MusicProvider>
              </LockProvider>
            </EventLabelProvider>
          </MaintenanceModeProvider>
        </HiddenProfileProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
