import React from 'react';

function ProfilePicture({ 
  profilePictureUrl, 
  name, 
  size = 'md', 
  className = '',
  showBorder = false 
}) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-2xl'
  };

  const borderClass = showBorder ? 'border-4 border-yellow-200' : '';

  return (
    <div className={`${sizeClasses[size]} bg-yellow-100 rounded-full flex items-center justify-center overflow-hidden ${borderClass} ${className}`}>
      {profilePictureUrl ? (
        <img
          src={profilePictureUrl}
          alt={name || 'Profile'}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-yellow-600 font-semibold">
          {name ? name.charAt(0).toUpperCase() : '?'}
        </span>
      )}
    </div>
  );
}

export default ProfilePicture;
