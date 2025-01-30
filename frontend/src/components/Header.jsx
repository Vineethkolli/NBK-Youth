import { useState } from 'react';
import { Menu, User, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Header({ toggleSidebar }) {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    toggleSidebar();
  };

  return (
    <header className="bg-white shadow-sm h-16 fixed top-0 left-0 right-0 z-20">
      <div className="h-full px-4 flex items-center justify-between">
        <button
          onClick={handleToggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg"
          aria-label="Toggle Sidebar"
        >
          {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        <h1 className="text-2xl font-bold text-yellow-700">NBK Youth</h1>
        <button
          onClick={() => navigate('/profile')}
          className="p-2 hover:bg-gray-100 rounded-full"
          aria-label="Profile"
        >
          <User className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
}

export default Header;
