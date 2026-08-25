/**
 * Avatar Component
 * User avatar with initials
 */

import React from 'react';
import clsx from 'clsx';
import { getInitials, stringToColor } from '../../utils/helpers';

export const Avatar = ({
  src,
  alt = 'Avatar',
  name,
  size = 'md',
  className,
}) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={clsx(
          'rounded-full object-cover',
          sizes[size],
          className
        )}
      />
    );
  }

  const initials = getInitials(name);
  const backgroundColor = stringToColor(name);

  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center font-semibold text-white',
        sizes[size],
        className
      )}
      style={{ backgroundColor }}
    >
      {initials}
    </div>
  );
};
