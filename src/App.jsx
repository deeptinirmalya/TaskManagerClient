import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/loginPage';
import Dashboard from './pages/dashboard';
import ViewExpenses from './pages/viewExpenses';
import ViewTasks from './pages/viewTasks';
import LiveTracking from './pages/LiveTracking';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/view-expenses" element={<ViewExpenses />} />
        <Route path="/view-tasks" element={<ViewTasks />} />
        <Route path="/tracking" element={<LiveTracking />} />
        <Route path="/tracking/:sessionId" element={<LiveTracking />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
