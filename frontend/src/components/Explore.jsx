import { Link } from 'react-router-dom';
import { Home, User, History, FolderOpen, UserCog, Users, Bell, ShieldCheck, Settings, IndianRupee, DollarSign, 
  Trash2, CheckSquare, BarChart2, Terminal, MusicIcon, CameraIcon, TrophyIcon, Calculator, Layers, LayoutDashboard,
  FileClock, Cpu, Globe2, CreditCard, LockKeyhole, Code2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Footer from './Footer';

function Explore() {
  const { user } = useAuth();

  const groupedPages = [
    {
      title: 'General',
      icon: Globe2,
      pages: [
        { to: '/', icon: Home, label: 'Home' },
        { to: '/committee', icon: Users, label: 'Committee' },
        { to: '/moments', icon: CameraIcon, label: 'Moments' },
        { to: '/vibe', icon: MusicIcon, label: 'Vibe' },
        { to: '/lets-play', icon: TrophyIcon, label: 'Activities' },
      ],
    },
    {
      title: 'Finance',
      icon: CreditCard,
      pages: [
        { to: '/stats', icon: BarChart2, label: 'Stats' },
        { to: '/income', icon: IndianRupee, label: 'Income' },
        { to: '/expense', icon: DollarSign, label: 'Expense' },
        { to: '/estimation', icon: Calculator, label: 'Estimation' },
        { to: '/histories', icon: History, label: 'Histories' },
        { to: '/records', icon: FolderOpen, label: 'Records' },
      ],
    },
    {
      title: 'Account',
      icon: User,
      pages: [
        { to: '/profile', icon: User, label: 'Profile' },
        { to: '/notifications', icon: Bell, label: 'Notifications' },
        { to: '/settings', icon: Settings, label: 'Settings' },
        { to: '/pay-online', icon: ShieldCheck, label: 'Pay Online' },
        { to: '/tech-stack', icon: Layers, label: 'Tech Stack' },
      ],
    },
    {
      title: 'Admin Tools',
      icon: LockKeyhole,
      pages: [
        ...(['admin', 'developer', 'financier'].includes(user?.role)
          ? [
              { to: '/users', icon: UserCog, label: 'Users & Roles' },
              { to: '/admin-panel', icon: LayoutDashboard, label: 'Admin Panel' },
            ]
          : []),
        ...(['developer', 'financier'].includes(user?.role)
          ? [{ to: '/verification', icon: CheckSquare, label: 'Verification' }]
          : []),
        ...(['developer', 'financier'].includes(user?.role)
          ? [{ to: '/recycle-bin', icon: Trash2, label: 'Recycle Bin' }]
          : []),
      ],
    },
    {
      title: 'Developer Zone',
      icon: Code2,
      pages: [
        ...(['developer'].includes(user?.role)
          ? [
              { to: '/developer-options', icon: Terminal, label: 'Developer Options' },
              { to: '/activity-logs', icon: FileClock, label: 'Activity Logs' },
              { to: '/monitor', icon: Cpu, label: 'Monitor' },
            ]
          : []),
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {groupedPages.map(
        (section) =>
          section.pages.length > 0 && (
            <div key={section.title}>
              <div className="flex items-center gap-2 mb-2 border-b border-gray-200 pb-1">
                <section.icon className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                  {section.title}
                </h2>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {section.pages.map(({ to, icon: Icon, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex flex-col items-center justify-center bg-gradient-to-br from-white to-indigo-50 shadow-md hover:shadow-xl rounded-2xl py-4 px-3 text-center transition-all hover:-translate-y-1 hover:scale-105 duration-300 border border-gray-100"
                  >
                    <div className="p-3 bg-indigo-100 rounded-full mb-2 shadow-inner">
                      <Icon className="h-7 w-7 text-indigo-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )          
      )}
        <Footer />
    </div>
  );
}

export default Explore;
