/**
 * Sidebar Context for CampusIQ
 * Manages sidebar state (collapsed/expanded)
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../utils/constants';

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Clear any existing collapsed state from localStorage so it stays always expanded
  useEffect(() => {
    localStorage.removeItem(STORAGE_KEYS.SIDEBAR_STATE);
    setIsCollapsed(false);
  }, []);

  const toggleSidebar = () => {
    // Keep sidebar always expanded
    setIsCollapsed(false);
  };

  const value = {
    isCollapsed: false,
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
