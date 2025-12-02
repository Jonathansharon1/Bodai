import React from 'react';
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
  Target
} from 'lucide-react';
import Logo from '../Logo';
import './Sidebar.css';

export default function Sidebar() {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

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

  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      <div className="sidebar__header">
        <div className="sidebar__logo">
          <Logo size={24} className="sidebar__logoIcon" />
          <span className="sidebar__logoText">BodAI</span>
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
                  onClick={() => navigate(path)}
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
  );
}

