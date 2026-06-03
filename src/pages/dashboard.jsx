import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getItemWithExpiry } from './loginPage';
import '../styles/dashboard.css';
import { BASE_API_URL } from '../config';

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Get token with expiry check
    const token = getItemWithExpiry('authToken');

    if (!token) {
      // 2. If no token or expired, clear storage and redirect
      localStorage.clear();
      navigate('/login');
      return;
    }

    // 3. Hit API with token in Bearer header
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(`${BASE_API_URL}/auth/verify`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 401 || response.status === 403) {
          // Token invalid or expired according to backend
          localStorage.clear();
          navigate('/login');
          return;
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError('SYS_ERR: FAILED TO FETCH DATA (API OFFLINE)');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="brutal-dash-body">
      <div className="brutal-dash-container">
        <header className="brutal-dash-header">
          <h1>DASHBOARD_</h1>
          <button className="brutal-logout-btn" onClick={handleLogout}>LOGOUT_</button>
        </header>

        {error && (
          <div className="brutal-dash-alert error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="brutal-dash-alert">LOADING SYSTEM DATA...</div>
        ) : (
          <div className="brutal-button-stack">
            <button className="brutal-action-btn" onClick={() => navigate('/view-expenses')}>ACTION [01]: VIEW_EXPENSES</button>
            <button className="brutal-action-btn" onClick={() => navigate('/view-tasks')}>ACTION [02]: VIEW_TASKS</button>
            <button className="brutal-action-btn">ACTION [03]: FLUSH_CACHE</button>
            <button className="brutal-action-btn">ACTION [04]: MANAGE_USERS</button>
            <button className="brutal-action-btn">ACTION [05]: SYSTEM_SETTINGS</button>
          </div>
        )}
      </div>
    </div>
  );
}
