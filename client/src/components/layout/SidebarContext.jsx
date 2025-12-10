import React, { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
};

const STORAGE_KEY = 'sidebarCollapsed';

export const SidebarProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Hydrate collapse state from localStorage (desktop only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'true' && window.innerWidth >= 768) {
      setIsCollapsed(true);
    }
  }, []);

  // Close sidebar on window resize to desktop; reset collapse for mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      } else {
        setIsCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggle = () => setIsOpen(prev => !prev);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      }
      return next;
    });
  };

  const collapse = () => {
    setIsCollapsed(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, 'true');
    }
  };

  const expand = () => {
    setIsCollapsed(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, 'false');
    }
  };

  return (
    <SidebarContext.Provider
      value={{ isOpen, toggle, open, close, isCollapsed, toggleCollapse, collapse, expand }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
