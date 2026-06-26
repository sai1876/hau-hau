import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TokenIcon } from './TokenIcon';

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
    <div className="minimal-card rounded-xl flex flex-col overflow-hidden relative bg-surface border border-border">
      <div className="absolute -left-12 -top-12 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />

      {/* Header */}
      <div className="bg-surface-header px-4 py-3.5 border-b border-border relative z-10">
        <h3 className="text-xs text-foreground font-bold">Add Staff Account</h3>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4.5 flex flex-col gap-4 text-xs relative z-10">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-muted font-bold">Full Name</label>
          <input
            type="text"
            required
            placeholder="e.g. John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-text-muted/50 font-semibold"
          />
        </div>

        {/* Email or Phone */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-muted font-bold">Email or Phone</label>
          <input
            type="text"
            required
            placeholder="e.g. john@hauhau.com"
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-text-muted/50 font-mono font-semibold"
          />
        </div>

        {/* Username */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-muted font-bold">Username</label>
          <input
            type="text"
            required
            placeholder="Username for login"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-text-muted/50 font-semibold"
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-muted font-bold">Password</label>
          <input
            type="password"
            required
            placeholder="Password for login"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-text-muted/50 font-semibold"
          />
        </div>

        {/* Monthly Limit */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-muted font-bold">Monthly Token Limit</label>
          <div className="relative flex items-center">
            <input
              type="number"
              required
              min="0"
              placeholder="1000"
              value={monthlyTokenLimit}
              onChange={(e) => setMonthlyTokenLimit(e.target.value)}
              className="minimal-input pl-3.5 pr-8 py-2.5 text-xs text-white placeholder-text-muted/50 font-mono w-full font-semibold"
            />
            <span className="absolute right-2.5 flex items-center select-none pointer-events-none">
              <TokenIcon className="w-3.5 h-3.5 text-text-muted" />
            </span>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="minimal-btn-primary text-white font-bold py-2.5 rounded-lg transition-transform active:scale-[0.98] mt-2 text-xs h-10 flex items-center justify-center cursor-pointer shadow-sm"
        >
          Add Staff Account
        </button>
      </form>
    </div>
  );
}
export default StaffAccountForm;
