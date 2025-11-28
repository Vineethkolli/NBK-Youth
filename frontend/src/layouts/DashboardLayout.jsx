import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { Users, LayoutGrid, Home, BarChart2, IndianRupee, DollarSign, Wallet, CameraIcon } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import InstallApp from '../components/common/InstallApp';
import NotificationPrompt from '../components/common/NotificationPrompt';
import NotificationAutoRegister from '../components/notifications/NotificationAutoRegister';

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef(null);

  const toggleSidebar = () => {
    const isLargeScreen = window.innerWidth >= 1280;
    if (isLargeScreen) {
      setSidebarCollapsed((prev) => !prev);
    } else {
      setSidebarOpen((prev) => !prev);
    }
  };
  const closeSidebar = () => setSidebarOpen(false);

  const isActive = (path) => location.pathname === path;

  const handleBudgetClick = () => {
    setBudgetOpen(!budgetOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setBudgetOpen(false);
    closeSidebar();
  };

  useLayoutEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, left: 0, behavior: 'auto' }); // Scroll to top on route change
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  // Device detection
  useEffect(() => {
  const ua = navigator.userAgent;
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|Windows Phone/i.test(ua) ||
    (navigator.userAgentData?.platform === 'macOS' && navigator.maxTouchPoints > 1);

  setIsMobileDevice(isMobile);
}, []);

  // Disable body scroll when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);


  return (
    <div className="flex h-screen bg-gray-100 relative overflow-hidden">
      {/* Overlay Install Prompt */}
      {isMobileDevice && <InstallApp />}
      {isMobileDevice && <NotificationPrompt />}
      <NotificationAutoRegister />

      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} isCollapsed={sidebarCollapsed} onNavigate={closeSidebar} />
      {sidebarOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 z-5 bg-transparent"
        />
      )}

      <main
        ref={mainRef}
        className={`flex-1 overflow-auto p-4 mt-12 pb-20 min-h-[calc(100vh-3rem)] ${sidebarOpen ? 'pointer-events-none' : ''} ${
          sidebarCollapsed ? 'xl:ml-24' : 'xl:ml-64'
        }`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t xl:hidden z-10">
        <div className="flex justify-around items-center h-14">

          {/* Committee Button */}
          <button
            onClick={() => handleNavigation('/committee')}
            className={`flex flex-col items-center justify-center w-1/5 ${isActive('/committee') ? 'text-indigo-600' : 'text-gray-600'}`}
          >
            {isActive('/committee') ? (
              <div className="bg-indigo-600 rounded-full p-2 -mt-4">
                <Users className="h-6 w-6 text-white" />
              </div>
            ) : (
              <Users className="h-6 w-6" />
            )}
            <span className="text-xs mt-1">Committee</span>
          </button>

          {/* Explore Button */}
          <button
            onClick={() => handleNavigation('/explore')}
            className={`flex flex-col items-center justify-center w-1/5 ${isActive('/explore') ? 'text-indigo-600' : 'text-gray-600'}`}
          >
            {isActive('/explore') ? (
              <div className="bg-indigo-600 rounded-full p-2 -mt-4">
                <LayoutGrid className="h-6 w-6 text-white" />
              </div>
            ) : (
              <LayoutGrid className="h-6 w-6" />
            )}
            <span className="text-xs mt-1">Explore</span>
          </button>

          {/* Home Button */}
          <button
            onClick={() => handleNavigation('/')}
            className={`flex flex-col items-center justify-center w-1/5 ${isActive('/') ? 'text-indigo-600' : 'text-gray-600'}`}
          >
            {isActive('/') ? (
              <div className="bg-indigo-600 rounded-full p-2 -mt-4">
                <Home className="h-6 w-6 text-white" />
              </div>
            ) : (
              <Home className="h-6 w-6" />
            )}
            <span className="text-xs mt-1">Home</span>
          </button>

          {/* Moments Button */}
          <button
            onClick={() => handleNavigation('/moments')}
            className={`flex flex-col items-center justify-center w-1/5 ${isActive('/moments') ? 'text-indigo-600' : 'text-gray-600'}`}
          >
            {isActive('/moments') ? (
              <div className="bg-indigo-600 rounded-full p-2 -mt-4">
                <CameraIcon className="h-6 w-6 text-white" />
              </div>
            ) : (
              <CameraIcon className="h-6 w-6" />
            )}
            <span className="text-xs mt-1">Moments</span>
          </button>

          {/* Budget Button */}
          <button
            onClick={handleBudgetClick}
            className={`flex flex-col items-center justify-center w-1/5 ${budgetOpen ? 'text-indigo-600' : 'text-gray-600'}`}
          >
            {budgetOpen ? (
              <div className="bg-indigo-600 rounded-full p-2 -mt-4">
                <Wallet className="h-6 w-6 text-white" />
              </div>
            ) : (
              <Wallet className="h-6 w-6" />
            )}
            <span className="text-xs mt-1">Budget</span>
          </button>

          {/* Budget Popup */}
          {budgetOpen && (
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none">
              <div className="relative">
                <div className="flex items-end justify-center space-x-2 mb-4">

  {/* Income Button */}
  <button
    onClick={() => handleNavigation('/income')}
    className="transform translate-y-2 -translate-x-8 pointer-events-auto"
  >
    <div className={`rounded-full p-3.5 flex flex-col items-center justify-center w-16 h-16 shadow-lg ${
      isActive('/income') ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'
    }`}>
      <IndianRupee className="h-6 w-6" />
      <span className="text-xs mt-1">Income</span>
    </div>
  </button>

  {/* Stats Button */}
  <button
    onClick={() => handleNavigation('/stats')}
    className="transform -translate-y-2 pointer-events-auto"
  >
    <div className={`rounded-full p-3.5 flex flex-col items-center justify-center w-16 h-16 shadow-lg ${
      isActive('/stats') ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'
    }`}>
      <BarChart2 className="h-6 w-6" />
      <span className="text-xs mt-1">Stats</span>
    </div>
  </button>

  {/* Expense Button */}
  <button
    onClick={() => handleNavigation('/expense')}
    className="transform translate-y-2 translate-x-8 pointer-events-auto"
  >
    <div className={`rounded-full p-3.5 flex flex-col items-center justify-center w-16 h-16 shadow-lg ${
      isActive('/expense') ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'
    }`}>
      <DollarSign className="h-6 w-6" />
      <span className="text-xs mt-1">Expense</span>
    </div>
  </button>
</div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
