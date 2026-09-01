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
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 transition-all duration-300 z-40">
      {/* Header */}
      <div className="h-16 flex items-center justify-center px-4 border-b border-gray-200">
        <img
          src={logo}
          alt="CampusIQ"
          className="w-48 h-28 object-contain"
        />
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
                  ? 'bg-primary-100 text-primary-600 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              {IconComponent && <IconComponent className="w-5 h-5 flex-shrink-0" />}
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
