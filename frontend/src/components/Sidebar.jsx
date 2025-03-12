import { Link, useLocation } from 'react-router-dom';
import { Home, User, Users, Bell, ShieldCheck, Settings, IndianRupee, DollarSign, Trash2, CheckSquare, BarChart2, Terminal, MusicIcon, CameraIcon, TrophyIcon, X, Calculator, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Sidebar({ isOpen, onNavigate }) {
  const location = useLocation();
  const { user } = useAuth();

  const links = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/moments', icon: CameraIcon, label: 'Moments' },
    { to: '/vibe', icon: MusicIcon, label: 'Vibe' },
    { to: '/lets-play', icon: TrophyIcon, label: "Let's Play" },
    { to: '/stats', icon: BarChart2, label: 'Stats' },
    { to: '/income', icon: IndianRupee, label: 'Income' },
    { to: '/expense', icon: DollarSign, label: 'Expense' },
    { to: '/estimation', icon: Calculator, label: 'Estimation' },
    { to: '/profile', icon: User, label: 'Profile' },
    { to: '/pay-online', icon: ShieldCheck, label: 'Pay Online' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/settings', icon: Settings, label: 'Settings' },
    ...(user?.role === 'developer' ? [
      { to: '/users', icon: Users, label: 'Users' }
    ] : []),
    ...(user?.role === 'developer' || user?.role === 'financier' ? [
      { to: '/verification', icon: CheckSquare, label: 'Verification' }
    ] : []),
    ...(user?.role === 'developer' ? [
      { to: '/recycle-bin', icon: Trash2, label: 'Recycle Bin' }
    ] : []),
    ...(user?.role === 'developer' ? [
      { to: '/developer-options', icon: Terminal, label: 'Developer Options' }
    ] : []),
    
    { to: '/tech-stack', icon: Layers, label: 'Tech Stack' }
  ];

  const handleClick = () => {
    if (window.innerWidth < 768) {
      onNavigate();
    }
  };

  return (
    <div className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white shadow-lg transition-transform duration-300 ease-in-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 z-10 overflow-y-auto`}>
      <div className="w-60 h-full flex flex-col">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {links.map((link, index) => {
            const Icon = link.icon;
            const isSeparator = [3, 7, 11, 15].includes(index); // Line separator
            return (
              <div key={link.to}>
                <Link
                  to={link.to}
                  onClick={handleClick}
                  className={`${
                    location.pathname === link.to
                      ? 'bg-gray-200 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                >
                  <Icon className="mr-3 h-6 w-6" />
                  {link.label}
                </Link>
                {isSeparator && <hr className="my-1 border-t border-gray-300" />}
              </div>
            );
          })}
          <button
            onClick={onNavigate}
            className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-12 py-2 text-sm font-medium rounded-md mt-2"
          >
            <X className="mr-3 h-6 w-6 text-gray-800" />
            <span>Close</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

export default Sidebar;