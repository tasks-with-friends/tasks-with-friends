import React, { useContext, useMemo } from 'react';

export type Profile = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

const ProfileContext = React.createContext<Profile | null>(null);

export function useProfile(): Profile {
  const profile = useProfileOrNull();
  if (!profile) throw new Error('Not logged in!');
  return profile;
}

export function useProfileOrNull(): Profile | null {
  return useContext(ProfileContext);
}

export const ProfileProvider: React.FC = ({ children }) => {
  const profile = useMemo(() => {
    try {
      const token = JSON.parse(
        atob(
          document.cookie
            .split(';')
            .map((cookie) => cookie.trim().split('='))
            .find(([key]) => key === 'token')?.[1]
            ?.split('.')?.[1] || '{}',
        ),
      );
      console.log(token);
      if (token.sub && token.name && token.email) {
        return {
          id: token.sub,
          name: token.name,
          email: token.email,
          avatarUrl: token.avatarUrl,
        };
      } else {
        return null;
      }
    } catch (err) {
      console.error(err);
      return null;
    }
  }, []);

  return (
    <ProfileContext.Provider value={profile}>
      {children}
    </ProfileContext.Provider>
  );
};
