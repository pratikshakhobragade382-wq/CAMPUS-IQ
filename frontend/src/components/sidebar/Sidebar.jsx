/**
 * Sidebar Component
 * Main navigation sidebar
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import * as Icons from 'lucide-react';
import clsx from 'clsx';
import { useSidebar } from '../../context/SidebarContext';
import { SIDEBAR_MENU } from '../../utils/constants';
import logo from '../../assets/logo.png';

export const Sidebar = () => {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const location = useLocation();

  return (
    <>
      {/* Backdrop for mobile */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/30 lg:hidden z-30"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40',
          isCollapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Header */}
<div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
  <div className="flex items-center">
    <img
      src={logo}
      alt="CampusIQ"
      className="w-48 h-28 object-contain"
    />
  </div>

  <button
    onClick={toggleSidebar}
    className="p-1 hover:bg-gray-100 rounded-lg transition-colors duration-200 lg:hidden"
  >
    {isCollapsed ? (
      <Menu className="w-5 h-5" />
    ) : (
      <X className="w-5 h-5" />
    )}
  </button>
</div>

{/* Menu */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {SIDEBAR_MENU.map((item) => {
            const IconComponent = Icons[item.icon];
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.id}
                to={item.path}
                className={clsx(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors duration-200',
                  isActive
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
                title={isCollapsed ? item.label : undefined}
              >
                {IconComponent && <IconComponent className="w-5 h-5 flex-shrink-0" />}
                {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
