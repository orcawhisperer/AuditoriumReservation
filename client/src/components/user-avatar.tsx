import React, { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@shared/schema';

type UserAvatarProps = {
  user: Pick<User, 'id' | 'username'> | null | undefined;
  className?: string;
  fallbackClassName?: string;
};

// Function to get a deterministic color based on username
function getUserColor(username: string): string {
  // List of pastel colors
  const colors = [
    'bg-red-200 text-red-800',
    'bg-pink-200 text-pink-800',
    'bg-purple-200 text-purple-800',
    'bg-indigo-200 text-indigo-800',
    'bg-blue-200 text-blue-800',
    'bg-cyan-200 text-cyan-800',
    'bg-teal-200 text-teal-800',
    'bg-green-200 text-green-800',
    'bg-lime-200 text-lime-800',
    'bg-yellow-200 text-yellow-800',
    'bg-orange-200 text-orange-800',
  ];
  
  // Create a simple hash from the username for deterministic colors
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Get a positive index
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

// Function to get initials from username
function getInitials(username: string): string {
  if (!username) return '?';
  
  // If username contains spaces, get initials from each part
  if (username.includes(' ')) {
    return username
      .split(' ')
      .map(part => part[0]?.toUpperCase() || '')
      .join('')
      .slice(0, 2);
  }
  
  // If single word, take first two characters
  return username.slice(0, 2).toUpperCase();
}

export function UserAvatar({ user, className = '', fallbackClassName = '' }: UserAvatarProps) {
  const initials = useMemo(() => {
    if (!user?.username) return '?';
    return getInitials(user.username);
  }, [user?.username]);
  
  const colorClass = useMemo(() => {
    if (!user?.username) return 'bg-gray-200 text-gray-800';
    return getUserColor(user.username);
  }, [user?.username]);

  // Generate a unique avatar URL based on user ID and username
  const avatarUrl = useMemo(() => {
    if (!user) return null;
    // Use the DiceBear API to generate avatars
    // This ensures consistent avatars based on the user's unique identifiers
    return `https://api.dicebear.com/7.x/initials/svg?seed=${user.id}-${user.username}`;
  }, [user?.id, user?.username]);

  return (
    <Avatar className={className}>
      <AvatarImage src={avatarUrl || undefined} alt={user?.username || 'User'} />
      <AvatarFallback className={`${colorClass} ${fallbackClassName}`}>{initials}</AvatarFallback>
    </Avatar>
  );
}