/**
 * Navbar Component
 * Top navigation bar
 */

import React, { useRef } from 'react';
import { Search, Bell, Mail, Settings } from 'lucide-react';
import clsx from 'clsx';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { useClickOutside } from '../../hooks';
import { useState } from 'react';

export const Navbar = () => {
  const { toggleSidebar, isCollapsed } = useSidebar();
  const { user } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  useClickOutside(profileMenuRef, () => setShowProfileMenu(false));

  return (
    <nav className={clsx(
      'fixed top-0 right-0 h-16 bg-white border-b border-gray-200 transition-all duration-300 z-30',
      isCollapsed ? 'left-20' : 'left-64'
    )}>
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left Section - Search */}
        <div className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white hover:border-gray-300"
            />
          </div>
        </div>

        {/* Right Section - Icons & Profile */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Notifications */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
          </button>

          {/* Messages */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
            <Mail className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
          </button>

          {/* Settings */}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
            <Settings className="w-5 h-5 text-gray-600" />
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-200"></div>

          {/* Profile */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200"
            >
              <Avatar
                name={user?.name || 'Admin'}
                size="sm"
              />
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-500">{user?.role || 'Admin'}</p>
              </div>
            </button>

            {/* Profile Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200">
                  Profile
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200">
                  Settings
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200">
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
