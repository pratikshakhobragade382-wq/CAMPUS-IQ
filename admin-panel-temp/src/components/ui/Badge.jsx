/**
 * Badge Component
 * Small label component
 */

import React from 'react';
import clsx from 'clsx';
import { getStatusColor } from '../../utils/helpers';

export const Badge = ({
  children,
  variant = 'gray',
  className,
  ...props
}) => {
  const variants = {
    gray: 'bg-gray-100 text-gray-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors duration-200',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

/**
 * Status Badge Component
 * Badge that uses status-specific colors
 */
export const StatusBadge = ({ status, children }) => {
  const colors = getStatusColor(status);
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', colors.bg, colors.text)}>
      {children || status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
};
