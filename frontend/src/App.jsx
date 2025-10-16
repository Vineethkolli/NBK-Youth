import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HiddenProfileProvider } from './context/HiddenProfileContext';
import { LanguageProvider } from './context/LanguageContext';
import { MaintenanceModeProvider, useMaintenanceMode } from './context/MaintenanceModeContext';
import { MusicProvider } from './context/MusicContext';
import { EventLabelProvider } from './context/EventLabelContext';
import { LockProvider } from './context/LockContext';
import FloatingMusicIcon from './components/vibe/FloatingMusicIcon';
import PopupBanner from './components/adminPanel/PopupBanner';
import { initializeAnalytics, trackPageView } from './utils/analytics';

// Lazy loaded pages & layouts
const AuthLayout = React.lazy(() => import('./layouts/AuthLayout'));
const DashboardLayout = React.lazy(() => import('./layouts/DashboardLayout'));
const SignIn = React.lazy(() => import('./pages/SignIn'));
const SignUp = React.lazy(() => import('./pages/SignUp'));
const Home = React.lazy(() => import('./pages/Home'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Users = React.lazy(() => import('./pages/Users'));
const PayOnline = React.lazy(() => import('./pages/PayOnline'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Stats = React.lazy(() => import('./pages/Stats'));
const Income = React.lazy(() => import('./pages/Income'));
const Expense = React.lazy(() => import('./pages/Expense'));
const Estimation = React.lazy(() => import('./pages/Estimation'));
const Verification = React.lazy(() => import('./pages/Verification'));
const RecycleBin = React.lazy(() => import('./pages/RecycleBin'));
const AdminPanel = React.lazy(() => import('./pages/AdminPanel'));
const DeveloperOptions = React.lazy(() => import('./pages/DeveloperOptions'));
const Vibe = React.lazy(() => import('./pages/Vibe'));
const Moments = React.lazy(() => import('./pages/Moments'));
const LetsPlay = React.lazy(() => import('./pages/LetsPlay'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const TechStack = React.lazy(() => import('./pages/TechStack'));
const ActivityLogs = React.lazy(() => import('./pages/ActivityLogs'));
const Committee = React.lazy(() => import('./pages/Committee'));
const ViniPage = React.lazy(() => import('./pages/vini'));
const Records = React.lazy(() => import('./pages/Records'));
const Histories = React.lazy(() => import('./pages/Histories'));
const Monitor = React.lazy(() => import('./pages/Monitor'));
const MaintenancePage = React.lazy(() => import('./pages/Maintenance'));

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
    return <Suspense fallback={<div>Loading...</div>}><MaintenancePage /></Suspense>;
  }

  return (
    <>
      <RouteTracker />
      <Toaster position="top-right" />
      <PopupBanner />

      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          {/* Public Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
          </Route>

          {/* Protected Dashboard Routes */}
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
            <Route path="/histories" element={<Histories />} />
            <Route path="/monitor" element={<Monitor />} />
          </Route>
        </Routes>
      </Suspense>

      {user && <ViniPage />}
      {user && <FloatingMusicIcon />}
    </>
  );
}

function App() {
  useEffect(() => {
    initializeAnalytics();
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
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
