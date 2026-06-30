'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { login, currentUser, authLoading } = useApp();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && currentUser) {
      if (currentUser.role === 'owner') {
        router.replace('/owner');
      } else {
        router.replace('/staff');
      }
    }
  }, [authLoading, currentUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Username and password are required.');
      return;
    }

    setIsLoading(true);
    const success = await login(username.trim(), password);
    setIsLoading(false);

    if (!success) {
      setErrorMsg('Invalid credentials or account is disabled.');
    }
  };

  return (
    <div className="login-page-root">
      {/* Animated background orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Grid texture overlay */}
      <div className="grid-overlay" />

      {/* Main content */}
      <div className={`login-card ${mounted ? 'login-card--visible' : ''}`}>

        {/* Brand header */}
        <div className="brand-section">
          <div className="brand-logo">
            <span>HH</span>
          </div>
          <div className="brand-text">
            <h1 className="brand-name">Hau Hau</h1>
            <p className="brand-tagline">Operations Portal</p>
          </div>
        </div>

        {/* Divider */}
        <div className="login-divider" />

        {/* Title */}
        <div className="login-title-section">
          <h2 className="login-title">Welcome back</h2>
          <p className="login-subtitle">Sign in to your dashboard</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {errorMsg && (
            <div className="error-alert" role="alert">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Username field */}
          <div className="field-group">
            <label className="field-label" htmlFor="login-username">Operator ID</label>
            <div className="input-wrapper">
              <div className="input-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <input
                id="login-username"
                type="text"
                placeholder="Username or email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="login-input"
                autoComplete="username"
                autoFocus
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password field */}
          <div className="field-group">
            <label className="field-label" htmlFor="login-password">Security Pass</label>
            <div className="input-wrapper">
              <div className="input-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input login-input--password"
                autoComplete="current-password"
                disabled={isLoading}
              />
              <button
                type="button"
                className="eye-toggle"
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="login-btn"
            disabled={isLoading}
            id="login-submit"
          >
            {isLoading ? (
              <span className="btn-inner">
                <svg className="spin-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Signing in...
              </span>
            ) : (
              <span className="btn-inner">
                Sign In
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </span>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="login-footer">
          Hau Hau POS &amp; Operations System &mdash; Secure Access Only
        </p>
      </div>

      <style>{`
        .login-page-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #09090b;
          position: relative;
          overflow: hidden;
          padding: 1.5rem;
        }

        /* Animated ambient orbs */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          animation: orbFloat 8s ease-in-out infinite;
        }
        .orb-1 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(224, 123, 57, 0.12) 0%, transparent 70%);
          top: -180px;
          left: -180px;
          animation-delay: 0s;
        }
        .orb-2 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(224, 123, 57, 0.07) 0%, transparent 70%);
          bottom: -140px;
          right: -100px;
          animation-delay: -3s;
        }
        .orb-3 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(245, 158, 11, 0.05) 0%, transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: -6s;
        }
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -20px) scale(1.03); }
          66% { transform: translate(-10px, 15px) scale(0.97); }
        }
        .orb-3 {
          animation: orbFloat3 8s ease-in-out infinite;
          animation-delay: -6s;
        }
        @keyframes orbFloat3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          33% { transform: translate(calc(-50% + 20px), calc(-50% - 20px)) scale(1.03); }
          66% { transform: translate(calc(-50% - 10px), calc(-50% + 15px)) scale(0.97); }
        }

        /* Grid overlay */
        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }

        /* Card */
        .login-card {
          position: relative;
          width: 100%;
          max-width: 400px;
          background: linear-gradient(145deg, rgba(24, 24, 27, 0.92) 0%, rgba(12, 12, 14, 0.96) 100%);
          backdrop-filter: blur(32px);
          -webkit-backdrop-filter: blur(32px);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 20px;
          padding: 2.25rem 2rem;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.03),
            0 20px 60px rgba(0, 0, 0, 0.6),
            0 0 80px rgba(224, 123, 57, 0.04),
            inset 0 1px 0 rgba(255,255,255,0.05);
          opacity: 0;
          transform: translateY(16px) scale(0.98);
          transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .login-card--visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        /* Top accent line */
        .login-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 10%;
          right: 10%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(224, 123, 57, 0.6), transparent);
          border-radius: 999px;
        }

        /* Brand */
        .brand-section {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          margin-bottom: 1.5rem;
        }
        .brand-logo {
          width: 42px;
          height: 42px;
          background: linear-gradient(135deg, #1c1c1f 0%, #111113 100%);
          border: 1px solid rgba(224, 123, 57, 0.3);
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 13px;
          color: #e07b39;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 12px rgba(224, 123, 57, 0.15), inset 0 1px 0 rgba(255,255,255,0.04);
          flex-shrink: 0;
        }
        .brand-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .brand-name {
          font-size: 16px;
          font-weight: 800;
          color: #fafafa;
          margin: 0;
          letter-spacing: -0.3px;
          line-height: 1.2;
        }
        .brand-tagline {
          font-size: 9.5px;
          font-weight: 700;
          color: #71717a;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin: 0;
        }

        .login-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
          margin-bottom: 1.5rem;
        }

        /* Title */
        .login-title-section {
          margin-bottom: 1.5rem;
        }
        .login-title {
          font-size: 22px;
          font-weight: 800;
          color: #fafafa;
          margin: 0 0 4px 0;
          letter-spacing: -0.5px;
          line-height: 1.2;
        }
        .login-subtitle {
          font-size: 13px;
          color: #52525b;
          margin: 0;
          font-weight: 500;
        }

        /* Form */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .field-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          color: #71717a;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 13px;
          color: #52525b;
          display: flex;
          align-items: center;
          pointer-events: none;
          transition: color 0.2s;
        }
        .input-wrapper:focus-within .input-icon {
          color: #e07b39;
        }

        .login-input {
          width: 100%;
          background: rgba(9, 9, 11, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 10px;
          color: #fafafa;
          font-size: 13px;
          font-weight: 500;
          padding: 11px 13px 11px 40px;
          outline: none;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: inherit;
        }
        .login-input--password {
          padding-right: 42px;
        }
        .login-input::placeholder {
          color: #3f3f46;
        }
        .login-input:focus {
          border-color: rgba(224, 123, 57, 0.5);
          background: rgba(9, 9, 11, 0.85);
          box-shadow: 0 0 0 3px rgba(224, 123, 57, 0.1), 0 1px 4px rgba(0,0,0,0.3);
        }
        .login-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .eye-toggle {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #52525b;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
          border-radius: 4px;
        }
        .eye-toggle:hover {
          color: #a1a1aa;
        }

        /* Error */
        .error-alert {
          background: rgba(192, 57, 43, 0.08);
          border: 1px solid rgba(192, 57, 43, 0.25);
          border-radius: 8px;
          padding: 10px 12px;
          color: #fca5a5;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: slideDown 0.2s ease;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Button */
        .login-btn {
          margin-top: 4px;
          width: 100%;
          min-height: 46px;
          border-radius: 11px;
          background: linear-gradient(135deg, #e07b39 0%, #c96525 100%);
          color: #ffffff;
          font-weight: 800;
          font-size: 13px;
          letter-spacing: 0.3px;
          border: none;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 16px rgba(224, 123, 57, 0.3), inset 0 1px 0 rgba(255,255,255,0.12);
          font-family: inherit;
        }
        .login-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%);
          pointer-events: none;
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(224, 123, 57, 0.4), inset 0 1px 0 rgba(255,255,255,0.15);
          background: linear-gradient(135deg, #e88440 0%, #d06a28 100%);
        }
        .login-btn:active:not(:disabled) {
          transform: translateY(1px) scale(0.99);
          box-shadow: 0 2px 8px rgba(224, 123, 57, 0.25);
        }
        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .spin-icon {
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Footer */
        .login-footer {
          margin-top: 1.5rem;
          font-size: 10.5px;
          color: #3f3f46;
          text-align: center;
          line-height: 1.5;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}

