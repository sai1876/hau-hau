import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export function StaffAccountForm() {
  const { createNewStaff } = useApp();

  const [name, setName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [monthlyTokenLimit, setMonthlyTokenLimit] = useState('1000');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !emailOrPhone || !username || !password) return;

    const parsedLimit = parseInt(monthlyTokenLimit);

    const success = await createNewStaff({
      name,
      emailOrPhone,
      username: username.trim().toLowerCase(),
      password: password.trim(),
      monthlyTokenLimit: isNaN(parsedLimit) ? 1000 : parsedLimit
    });

    if (success) {
      setName('');
      setEmailOrPhone('');
      setUsername('');
      setPassword('');
      setMonthlyTokenLimit('1000');
    }
  };

  return (
    <div className="minimal-card rounded-xl flex flex-col overflow-hidden relative">
      <div className="absolute -left-12 -top-12 w-24 h-24 bg-orange-500/5 rounded-full blur-xl pointer-events-none" />

      {/* Header */}
      <div className="bg-zinc-950/80 px-4 py-3.5 border-b border-white/5 relative z-10">
        <h3 className="text-[10px] uppercase font-extrabold tracking-widest text-zinc-400">Register Staff Account</h3>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4.5 flex flex-col gap-4 text-xs relative z-10">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] text-zinc-550 uppercase font-extrabold tracking-widest">Staff Name</label>
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
          <label className="text-[9px] text-zinc-550 uppercase font-extrabold tracking-widest">Email or Phone</label>
          <input
            type="text"
            required
            placeholder="e.g. john@hauhau.com"
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-zinc-700 font-mono"
          />
        </div>

        {/* Username */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] text-zinc-550 uppercase font-extrabold tracking-widest">Operator Username</label>
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
          <label className="text-[9px] text-zinc-550 uppercase font-extrabold tracking-widest">Security Password</label>
          <input
            type="password"
            required
            placeholder="Password for login"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-zinc-700"
          />
        </div>

        {/* Monthly Limit */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] text-zinc-550 uppercase font-extrabold tracking-widest">Monthly Token Sale Limit</label>
          <div className="relative flex items-center">
            <input
              type="number"
              required
              min="0"
              placeholder="1000"
              value={monthlyTokenLimit}
              onChange={(e) => setMonthlyTokenLimit(e.target.value)}
              className="minimal-input pl-3.5 pr-8 py-2.5 text-xs text-white placeholder-zinc-700 font-mono w-full"
            />
            <span className="absolute right-2.5 text-[9px] text-zinc-500 font-bold uppercase select-none pointer-events-none">
              TK
            </span>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="minimal-btn-primary text-white font-extrabold py-2.5 rounded-lg uppercase tracking-wider transition-transform active:scale-[0.98] mt-2 text-[10px] h-10 flex items-center justify-center cursor-pointer shadow-sm"
        >
          Provision Account
        </button>
      </form>
    </div>
  );
}
export default StaffAccountForm;
