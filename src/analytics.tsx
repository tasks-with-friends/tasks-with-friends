import Analytics from 'analytics';
import doNotTrack from 'analytics-plugin-do-not-track';
import googleAnalytics from '@analytics/google-analytics';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

export const analytics = Analytics({
  app: 'tasks-with-friends',
  plugins: [
    doNotTrack(),
    googleAnalytics({
      trackingId: 'UA-217440704-1',
    }),
  ],
});

export const NavigationHandler: React.VFC = () => {
  const location = useLocation();

  useEffect(() => {
    analytics.page();
  }, [location.pathname, location.search, location.hash]);

  return null;
};
