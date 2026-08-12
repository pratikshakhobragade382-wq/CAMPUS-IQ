/**
 * Profile Page
 * Shows the logged-in admin/staff's own details.
 * Data comes from AuthContext (which was filled in when they logged in).
 */

import React from 'react';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  // Small helper so we never show "undefined" on screen —
  // if a field doesn't exist on the user object yet, show a dash instead.
  const showValue = (value) => value || '—';

  return (
    <div className="max-w-3xl mx-auto">

      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">
          Your account details as stored in the system.
        </p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">

        {/* Top section: avatar + name + role */}
        <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
          <Avatar name={user?.name || 'Admin'} size="lg" />

          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {showValue(user?.name)}
            </h2>
            <p className="text-sm text-gray-500">{showValue(user?.role)}</p>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">

          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Email
            </p>
            <p className="text-sm text-gray-900 mt-1">{showValue(user?.email)}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Phone
            </p>
            <p className="text-sm text-gray-900 mt-1">{showValue(user?.phone)}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Staff ID
            </p>
            <p className="text-sm text-gray-900 mt-1">{showValue(user?.staffId)}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Role
            </p>
            <p className="text-sm text-gray-900 mt-1">{showValue(user?.role)}</p>
          </div>

        </div>

        {/* Placeholder for later — not wired up yet on purpose */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <button
            disabled
            title="Coming soon"
            className="px-4 py-2 text-sm font-medium text-gray-400 border border-gray-200 rounded-lg cursor-not-allowed"
          >
            Edit Profile (coming soon)
          </button>
        </div>

      </div>
    </div>
  );
};

export default Profile;