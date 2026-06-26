'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function LoginPage() {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Username and Password are required.');
      return;
    }

    const success = await login(username.trim(), password);
    if (!success) {
      setErrorMsg('Invalid credentials or disabled account.');
    }
  };


  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-screen bg-zinc-950 relative select-none">
      
      {/* Centered frosted minimal card */}
      <div className="w-full max-w-sm minimal-card rounded-xl p-8 shadow-2xl flex flex-col gap-6 relative">
        
        {/* Minimal branding */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="w-9 h-9 bg-zinc-900 border border-white/8 rounded-md flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
            HH
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white mt-1">
            Hau Hau
          </h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
            Operations Portal
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-semibold tracking-wider uppercase p-3 rounded-md text-center">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">
              Operator ID
            </label>
            <input
              type="text"
              placeholder="Username or Email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-zinc-700"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">
              Security Pass
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-zinc-700"
            />
          </div>

          <button
            type="submit"
            className="minimal-btn-primary text-white font-bold text-xs uppercase tracking-wider py-3 mt-2 cursor-pointer"
          >
            Log In
          </button>
        </form>


      </div>
    </div>
  );
}
