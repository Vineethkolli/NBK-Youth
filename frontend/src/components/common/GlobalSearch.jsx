
import { useEffect, useRef, useState } from 'react';
import { Search, X, Sparkles, Home, User, History, FolderOpen, UserCog, Users, Bell, ShieldCheck, Settings, 
    IndianRupee, DollarSign, Trash2, CheckSquare, BarChart2, Terminal, MusicIcon, CameraIcon, TrophyIcon, 
    Calculator, Layers, LayoutDashboard, FileClock, Cpu, Fingerprint, ToolCase, MailCheck, Tractor, Files, 
    ContactRound, BookMarked, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const searchablePages = [
  { path: '/', label: 'Home', keywords: 'dashboard events', icon: Home },
  { path: '/explore', label: 'Explore', keywords: 'discover all', icon: LayoutGrid },
  { path: '/committee', label: 'Committee', keywords: 'youth members team', icon: Users },
  { path: '/moments', label: 'Moments', keywords: 'photos videos media content', icon: CameraIcon },
  { path: '/vibe', label: 'Vibe', keywords: 'music songs spotify', icon: MusicIcon },
  { path: '/stats', label: 'Stats', keywords: 'statistics finance budget overview', icon: BarChart2 },
  { path: '/income', label: 'Income', keywords: 'budget finance', icon: IndianRupee },
  { path: '/expense', label: 'Expense', keywords: 'budget finance', icon: DollarSign, },
  { path: '/estimation', label: 'Estimation', keywords: 'budget finance', icon: Calculator },
  { path: '/people', label: 'People', keywords: 'members contacts list youth villager', icon: ContactRound },
  { path: '/histories', label: 'Histories', keywords: 'history records previous', icon: History },
  { path: '/records', label: 'Records', keywords: 'events finance timeline', icon: FolderOpen },
  { path: '/profile', label: 'Profile', keywords: 'account user mysession', icon: User },
  { path: '/pay-online', label: 'Pay Online', keywords: 'payment upi', icon: ShieldCheck },
  { path: '/notifications', label: 'Notifications', keywords: 'alerts announcements', icon: Bell },
  { path: '/settings', label: 'Settings', keywords: 'language preferences download install privacy terms', icon: Settings },
  { path: '/activities', label: 'Activities', keywords: 'games events', icon: TrophyIcon },
  { path: '/tools', label: 'Tools', keywords: 'utilities weather timer toss pdf calculator voice recorder', icon: ToolCase },
  { path: '/tech-stack', label: 'Tech Stack', keywords: 'technology developer kolli vineeth owner access', icon: Layers },
  { path: '/my-village', label: 'My Village', keywords: 'village services gangavaram', icon: Tractor },
  {
    path: '/verification',
    label: 'Verification',
    keywords: 'verify',
    access: 'Privileged',
    icon: CheckSquare,
  },
  {
    path: '/recycle-bin',
    label: 'Recycle Bin',
    keywords: 'deleted',
    access: 'Privileged',
    icon: Trash2,
  },
  {
    path: '/users',
    label: 'Users & Roles',
    keywords: 'people permissions',
    access: 'Privileged',
    icon: UserCog,
  },
  {
    path: '/admin-panel',
    label: 'Admin Panel',
    keywords: 'administration popup banner maintenance scheduled notifications event label',
    access: 'Privileged',
    icon: LayoutDashboard,
  },
  {
    path: '/mailer',
    label: 'Mailer',
    keywords: 'email scheduled',
    access: 'Privileged',
    icon: MailCheck,
  },
  {
    path: '/my-files',
    label: 'My Files',
    keywords: 'documents assets notes dumps',
    access: 'Privileged',
    icon: Files,
  },
  {
    path: '/developer-options',
    label: 'Developer Options',
    keywords: 'developer health editing controls universal pin auth sessions reset roles clear snapshots processed',
    access: 'Developer',
    icon: Terminal,
  },
  {
    path: '/activity-logs',
    label: 'Activity Logs',
    keywords: 'audit logs actions entities',
    access: 'Developer',
    icon: FileClock,
  },
  {
    path: '/auth-sessions',
    label: 'Auth Sessions',
    keywords: 'login security access activity',
    access: 'Developer',
    icon: Fingerprint,
  },
  {
    path: '/monitor',
    label: 'Monitor',
    keywords: 'system status health cloudinary upstash redis mongodb github actions backend render',
    access: 'Developer',
    icon: Cpu,
  },
  {
    path: '/documentation',
    label: 'Documentation',
    keywords: 'help guide',
    access: 'Developer',
    icon: BookMarked,
  },
  { path: '/new', label: 'New', keywords: 'updates announcements', icon: Sparkles },
];

function GlobalSearch() {
  const navigate = useNavigate();
  const { hasAccess } = useAuth();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  const availablePages = searchablePages.filter(
    (page) => !page.access || hasAccess(page.access),
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const matchingPages = availablePages.filter((page) =>
    `${page.label} ${page.keywords}`
      .toLowerCase()
      .includes(normalizedQuery),
  );

  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen) return;

    const handleOutsideClick = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        closeSearch();
      }
    };

    document.addEventListener('pointerdown', handleOutsideClick);

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
    };
  }, [isSearchOpen]);

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const navigateToPage = (path) => {
    navigate(path);
    closeSearch();
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Escape') {
      closeSearch();
    } else if (event.key === 'Enter' && matchingPages[0]) {
      navigateToPage(matchingPages[0].path);
    }
  };

  return (
    <div ref={searchContainerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsSearchOpen((open) => !open)}
        className="rounded-full p-2  transition hover:bg-gray-100"
        aria-label={isSearchOpen ? 'Close page search' : 'Search pages'}
        aria-expanded={isSearchOpen}
        aria-controls="global-page-search"
      >
        {isSearchOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Search className="h-6 w-6" />
        )}
      </button>

      {isSearchOpen && (
        <div
          id="global-page-search"
          role="dialog"
          aria-label="Search pages"
          className="fixed left-1/2 top-16 z-50 flex
  max-h-[min(70dvh,28rem)]
  w-[calc(100vw-1.5rem)] max-w-90
  -translate-x-1/2 flex-col overflow-hidden
  rounded-xl border border-gray-200 bg-white p-3 shadow-xl
  sm:absolute sm:left-auto sm:right-0 sm:top-12
  sm:w-80 sm:max-w-none sm:translate-x-0
  sm:max-h-[min(75dvh,32rem)] md:w-90"
        >
          {/* Search input */}
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4
              -translate-y-1/2 text-gray-400" />

            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search pages..."
              aria-label="Search pages"
              className="w-full rounded-lg border border-gray-200
                bg-gray-50 py-2.5 pl-9 pr-3 text-base outline-none
                transition focus:border-indigo-500 focus:bg-white
                focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {/* Heading and result count */}
          <div className="flex items-center justify-between gap-2 px-1 pb-2 pt-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {normalizedQuery ? 'Search Results' : 'Available Pages'}
            </h3>

            <span className="rounded-full bg-indigo-50 px-2 py-0.5
              text-xs font-medium text-indigo-700">
              {matchingPages.length}
            </span>
          </div>

          {/* Page list */}
          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
            role="listbox"
            aria-label="Pages"
          >
            {matchingPages.length > 0 ? (
              matchingPages.map((page) => {
                const PageIcon = page.icon;

                return (
                  <button
                    key={page.path}
                    type="button"
                    onClick={() => navigateToPage(page.path)}
                    className="flex min-h-10 w-full items-center gap-3
                      rounded-lg px-3 py-2 text-left text-sm text-gray-700
                      transition hover:bg-indigo-50 hover:text-indigo-700
                      focus-visible:outline-none focus-visible:ring-2
                      focus-visible:ring-indigo-500"
                    role="option"
                    aria-selected="false"
                  >
                    <PageIcon className="h-4 w-4 shrink-0 text-gray-400
                      transition group-hover:text-indigo-600" />

                    <span className="min-w-0 truncate">{page.label}</span>
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-5 text-center text-sm text-gray-500">
                No pages found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
