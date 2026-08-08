/**
 * Card Component
 * Reusable card container
 */

import React from 'react';
import clsx from 'clsx';

export const Card = React.forwardRef(({
  children,
  className,
  hover = true,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={clsx(
        'bg-white rounded-xl shadow-sm border border-gray-100 p-6',
        hover && 'transition-all duration-200 hover:shadow-md hover:border-gray-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

/**
 * Card Header Component
 */
export const CardHeader = ({ children, className }) => (
  <div className={clsx('mb-6', className)}>
    {children}
  </div>
);

/**
 * Card Title Component
 */
export const CardTitle = ({ children, className }) => (
  <h2 className={clsx('text-xl font-semibold text-gray-900', className)}>
    {children}
  </h2>
);

/**
 * Card Description Component
 */
export const CardDescription = ({ children, className }) => (
  <p className={clsx('text-sm text-gray-600 mt-1', className)}>
    {children}
  </p>
);

/**
 * Card Content Component
 */
export const CardContent = ({ children, className }) => (
  <div className={className}>
    {children}
  </div>
);

/**
 * Card Footer Component
 */
export const CardFooter = ({ children, className }) => (
  <div className={clsx('mt-6 pt-6 border-t border-gray-100 flex items-center justify-between', className)}>
    {children}
  </div>
);
