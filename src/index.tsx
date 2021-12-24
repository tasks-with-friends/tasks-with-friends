import React from 'react';
import { render } from 'react-dom';

import { buildInfo } from './build-info';
import { ProfileProvider } from './profile-provider';
import { Router } from './router';

console.log(JSON.stringify(buildInfo, null, 2));

render(
  <ProfileProvider>
    <Router />
  </ProfileProvider>,
  document.getElementById('app-root'),
);

// Hot Module Replacement API
if (module['hot']) {
  module['hot'].accept();
}
