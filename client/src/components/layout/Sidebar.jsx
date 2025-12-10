import React, { useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Video, 
  TrendingUp, 
  Gem, 
  Settings,
  Home,
  Target,
  X,
  Menu,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import Logo from '../Logo';
import { useSidebar } from './SidebarContext';
import './Sidebar.css';

// Prefetch components on hover for faster navigation
const prefetchMap = {
  '/dashboard': () => import('../../components/Dashboard'),
  '/analyses': () => import('../../pages/MyAnalysesPage'),
  '/grades': () => import('../../pages/MyProgressPage'),
  '/practice': () => import('../../pages/PracticePage'),
  '/subscription': () => import('../../pages/SubscriptionPage'),
  '/settings': () => import('../../pages/SettingsPage'),
};

const prefetchComponent = (path) => {
  const prefetchFn = prefetchMap[path];
  if (prefetchFn) {
    // Prefetch the component chunk
    prefetchFn().catch(() => {
      // Silently fail if prefetch doesn't work
    });
  }
};

export default function Sidebar() {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { isOpen, close, toggle, isCollapsed, toggleCollapse, expand } = useSidebar();

const SIDEBAR_ITEMS = [
  {
    id: 'home',
      label: t('sidebar.home'),
    icon: Home,
    path: '/',
    external: true,
  },
  {
    id: 'dashboard',
      label: t('sidebar.dashboard'),
    icon: LayoutDashboard,
    path: 'dashboard',
  },
  {
    id: 'analyses',
      label: t('sidebar.myAnalyses'),
    icon: Video,
    path: 'analyses',
  },
  {
    id: 'grades',
      label: t('sidebar.myProgress'),
    icon: TrendingUp,
    path: 'grades',
  },
  {
    id: 'practice',
      label: t('sidebar.practice'),
    icon: Target,
    path: 'practice',
  },
  {
    id: 'subscription',
      label: t('sidebar.subscription'),
    icon: Gem,
    path: 'subscription',
  },
  {
    id: 'settings',
      label: t('sidebar.settings'),
    icon: Settings,
    path: 'settings',
  },
];

  const getActivePage = () => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path === '/dashboard') return 'dashboard';
    if (path === '/analyses') return 'analyses';
    if (path === '/grades') return 'grades';
    if (path === '/practice') return 'practice';
    if (path === '/subscription') return 'subscription';
    if (path === '/settings') return 'settings';
    return 'dashboard';
  };

  const activePage = getActivePage();

  // Prefetch component on hover for faster navigation
  const handleMouseEnter = useCallback((path) => {
    if (path && path !== location.pathname) {
      prefetchComponent(path);
    }
  }, [location.pathname]);

  // Close sidebar on navigation (mobile only)
  const handleNavigation = (path) => {
    // Prefetch before navigation for instant load
    prefetchComponent(path);
    navigate(path);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      close();
      // ensure expanded when closing mobile drawer
      expand();
    }
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (window.innerWidth < 768 && !e.target.closest('.sidebar') && !e.target.closest('.sidebar-toggle')) {
        close();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen, close]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile hamburger button - shows when sidebar is closed */}
      {!isOpen && (
        <button
          className="sidebar__mobileToggle sidebar-toggle"
          onClick={toggle}
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Overlay backdrop for mobile */}
      {isOpen && (
        <div 
          className="sidebar__overlay" 
          onClick={close}
          aria-hidden="true"
        />
      )}
      
      <aside 
        className={`sidebar ${isOpen ? 'sidebar--open' : ''} ${isCollapsed ? 'sidebar--collapsed' : ''}`} 
        role="navigation" 
        aria-label="Main navigation"
      >
        <div className="sidebar__header">
          <div className="sidebar__logo">
            <Logo size={24} className="sidebar__logoIcon" />
            <span className="sidebar__logoText">BodAI</span>
          </div>
          <div className="sidebar__actions">
            <button
              className="sidebar__collapse"
              onClick={toggleCollapse}
              aria-label={isCollapsed ? t('sidebar.expand', 'Expand sidebar') : t('sidebar.collapse', 'Collapse sidebar')}
              title={isCollapsed ? t('sidebar.expand', 'Expand sidebar') : t('sidebar.collapse', 'Collapse sidebar')}
            >
              {isCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
            </button>
            <button 
              className="sidebar__close"
              onClick={close}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="sidebar__nav">
          <ul className="sidebar__list">
          {SIDEBAR_ITEMS.map((item) => {
            const IconComponent = item.icon;
            const isActive = item.external 
              ? activePage === 'home' 
              : activePage === item.path;
            const path = item.external ? item.path : `/${item.path}`;
            
            return (
              <li key={item.id} className="sidebar__item">
                <button
                  className={`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
                  onClick={() => handleNavigation(path)}
                  onMouseEnter={() => handleMouseEnter(path)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <IconComponent className="sidebar__icon" size={20} />
                  <span className="sidebar__label">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          {user?.imageUrl && (
            <img 
              src={user.imageUrl} 
              alt={user.firstName || 'User'} 
              className="sidebar__userAvatar"
            />
          )}
          <div className="sidebar__userInfo">
            <div className="sidebar__userName">
              {user?.firstName || user?.emailAddresses?.[0]?.emailAddress || 'User'}
            </div>
            <div className="sidebar__userEmail">
              {user?.emailAddresses?.[0]?.emailAddress}
            </div>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}

