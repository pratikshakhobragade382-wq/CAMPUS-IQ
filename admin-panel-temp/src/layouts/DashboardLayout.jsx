/**
 * Dashboard Layout Component
 * Main layout wrapper with sidebar and navbar
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import clsx from 'clsx';
import { Sidebar } from '../components/sidebar/Sidebar';
import { Navbar } from '../components/navbar/Navbar';
import { useSidebar } from '../context/SidebarContext';

export const DashboardLayout = () => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className={clsx(
        'flex-1 flex flex-col transition-all duration-300',
        isCollapsed ? 'ml-20' : 'ml-64'
      )}>
        {/* Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className={clsx(
          'flex-1 overflow-y-auto transition-all duration-300',
          'pt-16'
        )}>
          <div className="p-6 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
