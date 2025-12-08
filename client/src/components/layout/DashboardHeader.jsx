import React from 'react';
import { UserButton } from '@clerk/clerk-react';
import { Menu } from 'lucide-react';
import Logo from '../Logo';
import { useSidebar } from './SidebarContext';
import './DashboardHeader.css';

export default function DashboardHeader({ title, subtitle, action, onNavigate }) {
  const { toggle } = useSidebar();

  const handleHomeClick = (e) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('home');
    } else {
      window.location.href = '/';
    }
  };

  return (
    <header className="dashboardHeader">
      <div className="dashboardHeader__content">
        <div className="dashboardHeader__left">
          <button 
            className="dashboardHeader__menuToggle sidebar-toggle"
            onClick={toggle}
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>
          <a className="dashboardHeader__brand" href="/" onClick={handleHomeClick}>
            <Logo size={24} className="dashboardHeader__logo" />
          </a>
        </div>
        <div className="dashboardHeader__center">
          <div className="dashboardHeader__text">
            {title && <h1 className="dashboardHeader__title">{title}</h1>}
            {subtitle && <p className="dashboardHeader__subtitle">{subtitle}</p>}
          </div>
        </div>
        <div className="dashboardHeader__right">
          <div className="dashboardHeader__actions">
            {action}
            <div className="dashboardHeader__user">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}


