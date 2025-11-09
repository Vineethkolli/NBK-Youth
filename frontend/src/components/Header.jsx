import { Menu, User, LayoutGrid, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Header({ toggleSidebar }) {
  const navigate = useNavigate();

  const handleMenuClick = () => {
    toggleSidebar();
  };

  return (
    <header className="bg-white shadow-sm h-14 fixed top-0 left-0 right-0 z-20">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleMenuClick}
            className="p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Toggle Sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Explore visible only in large screens */}
          <button
            onClick={() => navigate('/explore')}
            className="hidden xl:flex p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Explore"
          >
            <LayoutGrid className="h-6 w-6" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-yellow-700">NYouth</h1>
        </div>

         <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/notifications')}
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="Notifications"
          >
            <Bell className="h-6 w-6" />
          </button>

          <button
            onClick={() => navigate('/profile')}
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="Profile"
          >
            <User className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
