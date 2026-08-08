/**
 * Modal Component
 * Reusable modal dialog
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={clsx(
          'relative bg-white rounded-2xl shadow-lg p-6 w-full mx-4 z-50',
          sizes[size],
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * Modal Body Component
 */
export const ModalBody = ({ children, className }) => (
  <div className={className}>
    {children}
  </div>
);

/**
 * Modal Footer Component
 */
export const ModalFooter = ({ children, className }) => (
  <div className={clsx('mt-6 pt-6 border-t border-gray-100 flex items-center justify-end gap-3', className)}>
    {children}
  </div>
);
