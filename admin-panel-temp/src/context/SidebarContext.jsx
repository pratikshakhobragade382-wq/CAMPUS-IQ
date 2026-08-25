/**
 * Sidebar Context for CampusIQ
 * Manages sidebar state (collapsed/expanded)
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../utils/constants';

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Initialize sidebar state from localStorage
  useEffect(() => {
    const storedState = localStorage.getItem(STORAGE_KEYS.SIDEBAR_STATE);
    if (storedState !== null) {
      setIsCollapsed(JSON.parse(storedState));
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_STATE, JSON.stringify(newState));
  };

  const value = {
    isCollapsed,
    toggleSidebar,
  };

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
};
