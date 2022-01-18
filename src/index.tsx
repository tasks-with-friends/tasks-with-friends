import React from 'react';
import { render } from 'react-dom';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { AnalyticsProvider } from 'use-analytics';

import { buildInfo } from './build-info';
import { ProfileProvider } from './profile-provider';
import { Router } from './router';

import { RealTimeProvider } from './components/real-time-provider';
import { NotificationProvider } from './components/notification-provider';
import { analytics } from './analytics';

console.log(JSON.stringify(buildInfo, null, 2));

const apolloClient = new ApolloClient({
  uri: '/graphql',
  cache: new InMemoryCache(),
});

render(
  <AnalyticsProvider instance={analytics}>
    <ApolloProvider client={apolloClient}>
      <ProfileProvider>
        <NotificationProvider>
          <RealTimeProvider>
            <Router />
          </RealTimeProvider>
        </NotificationProvider>
      </ProfileProvider>
    </ApolloProvider>
  </AnalyticsProvider>,
  document.getElementById('app-root'),
);

// Hot Module Replacement API
if (module['hot']) {
  module['hot'].accept();
}
