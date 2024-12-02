import { Link, useLocation } from 'react-router-dom';
import { Home, User, Users, Download, Bell, CreditCard, Settings, IndianRupee, Trash2, CheckSquare, BarChart2, Terminal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Sidebar({ isOpen, onNavigate }) {
  const location = useLocation();
  const { user } = useAuth();

  const links = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/stats', icon: BarChart2, label: 'Stats' },
    { to: '/income', icon: IndianRupee, label: 'Income' },
    { to: '/expense', icon: IndianRupee, label: 'Expense' },
    { to: '/profile', icon: User, label: 'Profile' },
    { to: '/pay-online', icon: CreditCard, label: 'Pay Online' },
    { to: '/notifier', icon: Bell, label: 'Notifications' },
    { to: '/settings', icon: Settings, label: 'Settings' },
    ...(user?.role === 'developer' ? [
      { to: '/users', icon: Users, label: 'Users' }
    ] : []),
    ...(user?.role === 'developer' || user?.role === 'financier' ? [
      { to: '/verification', icon: CheckSquare, label: 'Verification' }
    ] : []),
    ...(user?.role === 'developer' || user?.role === 'financier' ? [
      { to: '/recycle-bin', icon: Trash2, label: 'Recycle Bin' }
    ] : []),
    ...(user?.role === 'developer' ? [
      { to: '/developer-options', icon: Terminal, label: 'Developer Options' }
    ] : []),
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
            const isSeparator = [0, 3, 7].includes(index); // Indices after which to place separators
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
        </nav>
      </div>
    </div>
  );
}

export default Sidebar;
