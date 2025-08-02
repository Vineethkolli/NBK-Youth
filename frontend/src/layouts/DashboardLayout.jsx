import { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { Menu, Home, BarChart2, IndianRupee, DollarSign, Wallet } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import InstallApp from '../components/home/InstallApp';

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
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

  // Disable body scroll when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    // Cleanup on component unmount in case sidebar is still open
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen bg-gray-100 relative">
      {/* Overlay Install Prompt */}
      <InstallApp />
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} onNavigate={closeSidebar} />

      {/* Overlay that closes sidebar when clicked */}
      {sidebarOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 z-5 bg-transparent"
        />
      )}

      <main
        className={`flex-1 overflow-auto p-4 mt-14 md:ml-64 pb-20 min-h-[calc(100vh-3rem)] ${sidebarOpen ? 'pointer-events-none' : ''}`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
        <div className="flex justify-around items-center h-16">
          {/* Menu Button */}
          <button
            onClick={toggleSidebar}
            className={`flex flex-col items-center justify-center w-1/3 ${sidebarOpen ? 'text-indigo-600' : 'text-gray-600'}`}
          >
            {sidebarOpen ? (
              <div className="bg-indigo-600 rounded-full p-3 -mt-8">
                <Menu className="h-6 w-6 text-white" />
              </div>
            ) : (
              <Menu className="h-6 w-6" />
            )}
            <span className="text-xs mt-1">Menu</span>
          </button>

          {/* Home Button */}
          <button
            onClick={() => handleNavigation('/')}
            className={`flex flex-col items-center justify-center w-1/3 ${isActive('/') ? 'text-indigo-600' : 'text-gray-600'}`}
          >
            {isActive('/') ? (
              <div className="bg-indigo-600 rounded-full p-3 -mt-8">
                <Home className="h-6 w-6 text-white" />
              </div>
            ) : (
              <Home className="h-6 w-6" />
            )}
            <span className="text-xs mt-1">Home</span>
          </button>

          {/* Budget Button */}
          <button
            onClick={handleBudgetClick}
            className={`flex flex-col items-center justify-center w-1/3 ${budgetOpen ? 'text-indigo-600' : 'text-gray-600'}`}
          >
            {budgetOpen ? (
              <div className="bg-indigo-600 rounded-full p-3 -mt-8">
                <Wallet className="h-6 w-6 text-white" />
              </div>
            ) : (
              <Wallet className="h-6 w-6" />
            )}
            <span className="text-xs mt-1">Budget</span>
          </button>

          {/* Budget Popup Menu */}
          {budgetOpen && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="relative">
                <div className="flex items-end justify-center space-x-4 mb-4">
                  {/* Stats Button */}
                  <button
                    onClick={() => handleNavigation('/stats')}
                    className="transform -translate-y-16 -translate-x-8"
                  >
                    <div className={`rounded-full p-4 flex flex-col items-center justify-center w-16 h-16 shadow-lg ${isActive('/stats') ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}>
                      <BarChart2 className="h-6 w-6" />
                      <span className="text-xs mt-1">Stats</span>
                    </div>
                  </button>

                  {/* Income Button */}
                  <button
                    onClick={() => handleNavigation('/income')}
                    className="transform -translate-y-20"
                  >
                    <div className={`rounded-full p-4 flex flex-col items-center justify-center w-16 h-16 shadow-lg ${isActive('/income') ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}>
                      <IndianRupee className="h-6 w-6" />
                      <span className="text-xs mt-1">Income</span>
                    </div>
                  </button>

                  {/* Expense Button */}
                  <button
                    onClick={() => handleNavigation('/expense')}
                    className="transform -translate-y-16 translate-x-8"
                  >
                    <div className={`rounded-full p-4 flex flex-col items-center justify-center w-16 h-16 shadow-lg ${isActive('/expense') ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}>
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
