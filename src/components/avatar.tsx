import React from 'react';
import { UserStatus } from '../../__generated__/globalTypes';

export interface AvatarPropTypes {
  name: string;
  avatarUrl?: string;
  status?: UserStatus;
  size: AvatarSize;
  transparent?: boolean;
}

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export const Avatar: React.VFC<AvatarPropTypes> = ({
  name,
  avatarUrl,
  status,
  size,
  transparent,
}) => {
  return (
    <span className="inline-block relative">
      <img
        className={`${getAvatarSize(size)} rounded-full${
          transparent ? ' opacity-50 grayscale' : ''
        }`}
        src={avatarUrl}
        alt={name}
      />
      {!!status && (
        <span
          className={`absolute bottom-0 right-0 block ${getStatusSize(
            size,
          )} rounded-full ring-2 ring-white ${getBgColor(status)}`}
        />
      )}
    </span>
  );
};

function getBgColor(userStatus: UserStatus): string {
  switch (userStatus) {
    case UserStatus.IDLE:
      return 'bg-green-300';
    case UserStatus.FLOW:
      return 'bg-red-300';
    default:
      return 'bg-gray-300';
  }
}

function getAvatarSize(size: AvatarSize): string {
  switch (size) {
    case 'xs':
      return 'h-6 w-6';
    case 'sm':
      return 'h-8 w-8';
    case 'md':
      return 'h-10 w-10';
    case 'lg':
      return 'h-12 w-12';
    case 'xl':
      return 'h-14 w-14';
    case '2xl':
      return 'h-16 w-16';
    default:
      throw new Error('absurd');
  }
}

function getStatusSize(size: AvatarSize): string {
  switch (size) {
    case 'xs':
      return 'h-1.5 w-1.5';
    case 'sm':
      return 'h-2 w-2';
    case 'md':
      return 'h-2.5 w-2.5';
    case 'lg':
      return 'h-3 w-3';
    case 'xl':
      return 'h-3.5 w-3.5';
    case '2xl':
      return 'h-4 w-4';
    default:
      throw new Error('absurd');
  }
}
