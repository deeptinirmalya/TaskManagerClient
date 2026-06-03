import React, { useState } from 'react';
import '../styles/loginPage.css';
import { BASE_API_URL } from '../config';

// Local storage helpers
export function setItemWithExpiry(key, value, ttlInMs) {
  const now = new Date();
  const item = {
    value: value,
    expiry: now.getTime() + ttlInMs
  };
  localStorage.setItem(key, JSON.stringify(item));
}

export function getItemWithExpiry(key) {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;

  const item = JSON.parse(itemStr);
  const now = new Date();

  if (now.getTime() > item.expiry) {
    localStorage.removeItem(key);
    return null;
  }
  return item.value;
}

import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setStatus({ type: 'error', message: 'SYS_ERR: MISSING DATA' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await fetch(`${BASE_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email,
          password: password,
          remember_me: rememberMe
        }),
      });

      // Parse JSON to get standard response format
      const data = await response.json();

      if (response.ok && data.success !== false) {
        setStatus({ type: 'success', message: data.message || 'SYS_OK: AUTH VERIFIED' });

        // Dynamically extract the token from data payload
        const token = data.data?.token || data.data?.access_token || data.token;
        if (token) {
          // Set TTL: 7 days if remember_me is true, otherwise 15 minute
          const ttlInMs = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 15 * 60 * 1000;
          setItemWithExpiry('authToken', token, ttlInMs);
        }

        // Redirect to dashboard
        navigate('/');
      } else {
        // Target the `message` from your standard response format
        setStatus({ type: 'error', message: data.message || 'SYS_ERR: ACCESS DENIED' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'SYS_ERR: OFFLINE OR SERVER ERROR' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="brutal-body">
      <div className="brutal-container">
        <h1 className="brutal-header">LOGIN_</h1>

        {status.message && (
          <div className={`brutal-alert ${status.type}`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="brutal-input-group">
            <label className="brutal-label">IDENTIFIER [USERNAME]</label>
            <input
              type="text"
              className="brutal-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="USER@DOMAIN.COM"
            />
          </div>

          <div className="brutal-input-group">
            <label className="brutal-label">SECURITY [KEY]</label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="brutal-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
            />
            <button
              type="button"
              className="brutal-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'HIDE' : 'VIEW'}
            </button>
          </div>

          <div className="brutal-input-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ width: '25px', height: '25px', accentColor: '#000000', cursor: 'pointer', border: '4px solid #000' }}
            />
            <label htmlFor="rememberMe" className="brutal-label" style={{ margin: 0, cursor: 'pointer' }}>
              REMEMBER_ME
            </label>
          </div>

          <button type="submit" className="brutal-button" disabled={loading}>
            {loading ? 'PROCESSING...' : 'EXECUTE_'}
          </button>
        </form>

      </div>
    </div>
  );
}
