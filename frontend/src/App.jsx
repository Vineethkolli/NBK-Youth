import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import TechStack from './pages/TechStack';

function AppContent() {
  const { user } = useAuth();
  const { isMaintenanceMode } = useMaintenanceMode();
  if (isMaintenanceMode && user?.role !== 'developer') {
    return <MaintenancePage />;
  }

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
        </Route>
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
          <Route path="/developer-options" element={<DeveloperOptions />} />
          <Route path="/vibe" element={<Vibe />} />
          <Route path="/moments" element={<Moments />} />
          <Route path="/lets-play" element={<LetsPlay />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/tech-stack" element={<TechStack />} />
        </Route>
      </Routes>
    </>
  );
}

function App() {
  // Listen for the new service worker taking control
  useEffect(() => {
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
            <Router>
              <AppContent />
            </Router>
          </MaintenanceModeProvider>
        </HiddenProfileProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
