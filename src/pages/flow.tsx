import React from 'react';
import { UserStatus } from '../../__generated__/globalTypes';
import { useStatus } from '../components/use-status';

export const Flow: React.VFC = () => {
  const { setStatus } = useStatus();
  return (
    <div
      style={{
        position: 'absolute',
        backgroundImage:
          'url(https://images.pexels.com/photos/3312569/pexels-photo-3312569.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        top: 0,
        bottom: 0,
        right: 0,
        left: 0,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          <h1 className="text-7xl sm:text-8xl md:text-9xl text-white/50 mt-36 sm:mt-40 md:mt-44 drop-shadow-xl">focusing</h1>
          <button
            type="button"
            className="mt-24 drop-shadow-xl inline-flex items-center px-8 py-4 border border-gray-300/75 shadow-sm text-base font-medium rounded-md text-gray-700/75 bg-white/50 hover:bg-gray-50/75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500/75"
            onClick={() => setStatus(UserStatus.IDLE)}
          >
            Done for now
          </button>
        </div>
      </div>
    </div>
  );
};
