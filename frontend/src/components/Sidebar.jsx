import { Link, useLocation } from 'react-router-dom';
import { Home, User, History, FolderOpen, UserCog, Users, Bell, ShieldCheck, Settings, IndianRupee, DollarSign,
  Trash2, CheckSquare, BarChart2, Terminal, MusicIcon, CameraIcon, TrophyIcon, X, ChevronLeft, Calculator, 
  Layers, LayoutDashboard, FileClock, Cpu, Fingerprint } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Sidebar({ isOpen, onNavigate }) {
  const location = useLocation();
  const { hasAccess } = useAuth();

  const links = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/committee', icon: Users, label: 'Committee' },
  { to: '/moments', icon: CameraIcon, label: 'Moments' },
  { to: '/vibe', icon: MusicIcon, label: 'Vibe' },
  { to: '/stats', icon: BarChart2, label: 'Stats' },
  { to: '/income', icon: IndianRupee, label: 'Income' },
  { to: '/expense', icon: DollarSign, label: 'Expense' },
  { to: '/estimation', icon: Calculator, label: 'Estimation' },
  { to: '/histories', icon: History, label: 'Histories' },
  { to: '/records', icon: FolderOpen, label: 'Records' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/pay-online', icon: ShieldCheck, label: 'Pay Online' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/lets-play', icon: TrophyIcon, label: 'Activities' },
  { to: '/tech-stack', icon: Layers, label: 'Tech Stack' },
  
  ...(hasAccess('Pro') ? [
    { to: '/verification', icon: CheckSquare, label: 'Verification' },
    { to: '/recycle-bin', icon: Trash2, label: 'Recycle Bin' },
  ] : []),

  ...(hasAccess('Privileged') ? [
    { to: '/users', icon: UserCog, label: 'Users & Roles' },
    { to: '/admin-panel', icon: LayoutDashboard, label: 'Admin Panel' },
  ] : []),

  ...(hasAccess('Developer') ? [
    { to: '/developer-options', icon: Terminal, label: 'Developer Options' },
    { to: '/activity-logs', icon: FileClock, label: 'Activity Logs' },
    { to: '/auth-sessions', icon: Fingerprint, label: 'Auth Sessions' },
    { to: '/monitor', icon: Cpu, label: 'Monitor' },
  ] : []),
];


  const handleClick = () => {
    if (window.innerWidth < 1024) { 
      onNavigate();
    }
  };

  return (
    <div
      className={`fixed top-14 left-0 h-[calc(100vh-3rem)] bg-white shadow-lg transition-transform duration-300 ease-in-out transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } xl:translate-x-0 z-10 overflow-y-scroll`}
      style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
    >
      <div className="w-50 h-full flex flex-col">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {links.map((link, index) => {
            const Icon = link.icon;
            const isSeparator = [3, 7, 9, 13, 15, 19].includes(index); 
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
            className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-12 py-2 text-sm font-medium rounded-md mt-2 xl:hidden"
          >
            <X className="mr-3 h-6 w-6 text-gray-800" />
            <span>Close</span>
          </button>
        </nav>
      </div>
      <button
        onClick={onNavigate}
        className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-gray-200 hover:bg-gray-300 text-gray-800 p-2 rounded-full shadow-md z-20 xl:hidden"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
    </div>
  );
}

export default Sidebar;
