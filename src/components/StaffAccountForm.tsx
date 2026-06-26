import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export function StaffAccountForm() {
  const { createNewStaff } = useApp();

  const [name, setName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !emailOrPhone || !username || !password) return;

    const success = await createNewStaff({
      name,
      emailOrPhone,
      username: username.trim().toLowerCase(),
      password: password.trim()
    });

    if (success) {
      setName('');
      setEmailOrPhone('');
      setUsername('');
      setPassword('');
    }
  };

  return (
    <div className="minimal-card rounded-md flex flex-col overflow-hidden">
      <div className="bg-zinc-950/80 px-4 py-3 border-b border-white/3">
        <h3 className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Register Staff Account</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4 text-xs">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Staff Name</label>
          <input
            type="text"
            required
            placeholder="e.g. John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-zinc-700"
          />
        </div>

        {/* Email or Phone */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Email or Phone</label>
          <input
            type="text"
            required
            placeholder="e.g. john@hauhau.com"
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-zinc-700"
          />
        </div>

        {/* Username */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Username</label>
          <input
            type="text"
            required
            placeholder="Username for login"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-zinc-700"
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Password</label>
          <input
            type="password"
            required
            placeholder="Password for login"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-zinc-700"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="minimal-btn-primary text-white font-bold py-2.5 rounded-sm uppercase tracking-wider transition-transform active:scale-[0.98] mt-2 text-[10px] h-10 flex items-center justify-center cursor-pointer"
        >
          Create Account
        </button>
      </form>
    </div>
  );
}
export default StaffAccountForm;
