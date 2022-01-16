import React from 'react';
import { render } from 'react-dom';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';

import { buildInfo } from './build-info';
import { ProfileProvider } from './profile-provider';
import { Router } from './router';

import { RealTimeProvider } from './components/real-time-provider';
import { NotificationProvider } from './components/notification-provider';

console.log(JSON.stringify(buildInfo, null, 2));

const apolloClient = new ApolloClient({
  uri: '/graphql',
  cache: new InMemoryCache(),
});

render(
  <ApolloProvider client={apolloClient}>
    <ProfileProvider>
      <NotificationProvider>
        <RealTimeProvider>
          <Router />
        </RealTimeProvider>
      </NotificationProvider>
    </ProfileProvider>
  </ApolloProvider>,
  document.getElementById('app-root'),
);

// Hot Module Replacement API
if (module['hot']) {
  module['hot'].accept();
}
