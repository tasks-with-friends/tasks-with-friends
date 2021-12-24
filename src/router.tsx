import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { App } from './pages/app';
import { Login } from './pages/login';
import { useProfileOrNull } from './profile-provider';

export const Router: React.VFC = () => {
  const profile = useProfileOrNull();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={profile ? <App /> : <Login />} />
      </Routes>
    </BrowserRouter>
  );
};
