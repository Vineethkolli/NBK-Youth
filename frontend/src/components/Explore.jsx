import { Link } from 'react-router-dom';
import { Home, User, History, FolderOpen, UserCog, Users, Bell, ShieldCheck, Settings, IndianRupee, DollarSign, 
  Trash2, CheckSquare, BarChart2, Terminal, MusicIcon, CameraIcon, TrophyIcon, Calculator, Layers, LayoutDashboard, 
  FileClock, Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Explore() {
  const { user } = useAuth();

  const pages = [
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
    ...((['developer', 'financier'].includes(user?.role)) ? [
      { to: '/verification', icon: CheckSquare, label: 'Verification' }
    ] : []),
    ...((['admin', 'developer', 'financier'].includes(user?.role)) ? [
      { to: '/users', icon: UserCog, label: 'Users & Roles' }
    ] : []),
    ...((['admin', 'developer', 'financier'].includes(user?.role)) ? [
      { to: '/admin-panel', icon: LayoutDashboard, label: 'Admin Panel' }
    ] : []),
    ...(([ 'developer', 'financier'].includes(user?.role)) ? [
      { to: '/recycle-bin', icon: Trash2, label: 'Recycle Bin' }
    ] : []),
    ...(['developer'].includes(user?.role) ? [
      { to: '/developer-options', icon: Terminal, label: 'Developer Options' },
      { to: '/activity-logs', icon: FileClock, label: 'Activity Logs' },
      { to: '/monitor', icon: Cpu, label: 'Monitor' }
    ] : []),
    { to: '/tech-stack', icon: Layers, label: 'Tech Stack' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10 px-4">
      <div className="max-w-6xl mx-auto">

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {pages.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center justify-center bg-white shadow-sm hover:shadow-md rounded-xl py-5 px-3 text-center transition-all hover:-translate-y-1"
            >
              <Icon className="h-10 w-10 text-indigo-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Explore;
