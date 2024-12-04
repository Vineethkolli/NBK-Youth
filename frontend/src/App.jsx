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
import Notifier from './pages/Notifier';
import Settings from './pages/Settings';
import Stats from './pages/Stats';
import Income from './pages/Income';
import Expense from './pages/Expense';
import Verification from './pages/Verification';
import RecycleBin from './pages/RecycleBin';
import DeveloperOptions from './pages/DeveloperOptions';
import Vibe from './pages/Vibe';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { HiddenProfileProvider } from './context/HiddenProfileContext';

function App() {
  return (
    <AuthProvider> {/* AuthProvider should wrap the whole app */}
    <HiddenProfileProvider>
      <Router> {/* Only one Router here */}
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
            <Route path="/notifier" element={<Notifier />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/income" element={<Income />} />
            <Route path="/expense" element={<Expense />} />
            <Route path="/verification" element={<Verification />} />
            <Route path="/recycle-bin" element={<RecycleBin />} />
            <Route path="/developer-options" element={<DeveloperOptions />} />
            <Route path="/vibe" element={<Vibe />} />
          </Route>
        </Routes>
      </Router>
      </HiddenProfileProvider>
    </AuthProvider>
  );
}

export default App;
