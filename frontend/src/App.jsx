import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HiddenProfileProvider } from './context/HiddenProfileContext';
import { LanguageProvider } from './context/LanguageContext';
import { MaintenanceModeProvider, useMaintenanceMode } from './context/MaintenanceModeContext';
import { MusicProvider } from './context/MusicContext';
import { EventLabelProvider } from './context/EventLabelContext';
import { LockProvider } from './context/LockContext';
import FloatingMusicIcon from './components/vibe/FloatingMusicIcon';
import TechStack from './pages/TechStack'
import PopupBanner from './components/adminPanel/PopupBanner';
import { initializeAnalytics, trackPageView } from './utils/analytics';
import ActivityLogs from './pages/ActivityLogs'; 
import Committee from './pages/Committee';
import ViniPage from './pages/vini';
import Records from './pages/Records';

function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);
  return null; 
}

function AppContent() {
  const { user } = useAuth();
  const { isMaintenanceMode } = useMaintenanceMode();

  if (isMaintenanceMode && user?.role !== 'developer') {
    return <MaintenancePage />;
  }

  return (
    <>
      <RouteTracker />
      <Toaster position="top-right" />
      <PopupBanner />

      <Routes>
        {/* Public (Auth) Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
        </Route>

        {/* Protected (Dashboard) Routes */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
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
        </Route>
      </Routes>
      
      {user &&  <ViniPage />}
      {user && <FloatingMusicIcon />}
    </>
  );
}

function App() {
  useEffect(() => {
    initializeAnalytics();
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // reload the page to apply the new version
        window.location.reload();
      });
    }
  }, []);

  return (
    <AuthProvider>
      <LanguageProvider>
        <HiddenProfileProvider>
          <MaintenanceModeProvider>
            <EventLabelProvider>
              <LockProvider>
                <MusicProvider>
                  <Router>
                    <AppContent />
                  </Router>
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
