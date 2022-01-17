import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { App } from './pages/app';
import { Friends } from './pages/friends';
import { Login } from './pages/login';
import { NewTask } from './pages/tasks/new-task';
import { Profile } from './pages/profile';
import { Tasks } from './pages/tasks/tasks';
import { useProfileOrNull } from './profile-provider';
import { EditTask } from './pages/tasks/edit-task';
import { Landing } from './pages/landing';

export const Router: React.VFC = () => {
  const profile = useProfileOrNull();

  return profile ? (
    // Authenticated Routes
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<App />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/tasks/new" element={<NewTask />} />
        <Route path="/tasks/edit/:taskId" element={<EditTask />} />
        <Route path="/settings" element={<Profile />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  ) : (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
};
