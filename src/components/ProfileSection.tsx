import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import StatusBadge from './StatusBadge';

export function ProfileSection() {
  const { currentUser, staffList, orders, tokenTransactions, updateProfile } = useApp();

  // Find the full database details of the logged-in user
  const dbUser = staffList.find(s => s.username === currentUser?.username);

  // Form states
  const [name, setName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI states
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    match: false,
  });

  // Prepopulate form when dbUser is loaded
  useEffect(() => {
    if (dbUser) {
      setName(dbUser.name);
      setEmailOrPhone(dbUser.emailOrPhone);
    } else if (currentUser) {
      setName(currentUser.name);
    }
  }, [dbUser, currentUser]);

  // Track password strength & validation
  useEffect(() => {
    setPasswordStrength({
      length: password.length >= 6,
      match: password.length > 0 && password === confirmPassword,
    });
  }, [password, confirmPassword]);

  if (!currentUser) return null;

  // Retrieve initials for avatar
  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Metric calculations
  const totalSystemRevenue = orders
    .filter(o => o.orderStatus === 'completed')
    .reduce((sum, o) => sum + o.total, 0);

  const completedSystemOrders = orders.filter(o => o.orderStatus === 'completed').length;
  const activeStaffCount = staffList.filter(s => s.status === 'active').length;

  // Staff-specific stats
  const staffOrders = orders.filter(
    o => o.staffId === currentUser.username && o.orderStatus === 'completed'
  );
  const staffVolume = staffOrders.reduce((sum, o) => sum + o.total, 0);

  const staffTransactions = tokenTransactions.filter(
    tx => tx.soldBy === currentUser.username
  );
  const staffTokensSold = staffTransactions.reduce((sum, tx) => sum + tx.tokens, 0);
  const staffRupeesCollected = staffTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const updatedFields: { name?: string; emailOrPhone?: string } = {
      name: name.trim(),
      emailOrPhone: emailOrPhone.trim(),
    };

    const success = await updateProfile(updatedFields);
    if (success) {
      setIsEditing(false);
    }
    setIsSubmitting(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    if (password.length < 6) return;
    if (password !== confirmPassword) return;

    setIsSubmitting(true);
    const success = await updateProfile({ password: password.trim() });
    if (success) {
      setPassword('');
      setConfirmPassword('');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-slide-in">
      
      {/* 1. Profile Overview Card */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        <div className="minimal-card rounded-md overflow-hidden relative">
          {/* Glowing Top Decoration */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-transparent via-orange-500 to-transparent" />
          
          <div className="p-6 flex flex-col items-center text-center">
            {/* Avatar badge */}
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/8 flex items-center justify-center text-white font-extrabold text-lg shadow-inner shadow-black relative mb-4">
              {getInitials(name || currentUser.name)}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border border-zinc-950" />
            </div>

            <h2 className="text-sm font-bold text-white uppercase tracking-wider">{name || currentUser.name}</h2>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">@{currentUser.username}</p>

            <div className="mt-3 flex gap-2">
              <span className="text-[9px] bg-zinc-900 text-zinc-400 px-2 py-0.5 border border-zinc-800 rounded-sm font-bold uppercase tracking-wider">
                {currentUser.role === 'owner' ? 'System Administrator' : 'POS Floor Staff'}
              </span>
              <StatusBadge status={dbUser?.status || 'active'} />
            </div>

            {/* Info list */}
            <div className="w-full mt-6 flex flex-col gap-3.5 border-t border-white/3 pt-6 text-xs text-left">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-[8px]">Registered Email</span>
                <span className="text-zinc-300 font-semibold truncate max-w-[180px]">{emailOrPhone || dbUser?.emailOrPhone || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-[8px]">Security Status</span>
                <span className="text-emerald-400 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                  🛡 Verified
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-[8px]">System ID</span>
                <span className="text-zinc-600 font-mono text-[9px] truncate max-w-[120px]">{dbUser?.id || 'default'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Block */}
        <div className="minimal-card rounded-md overflow-hidden">
          <div className="bg-zinc-950/80 px-4 py-3 border-b border-white/3">
            <h3 className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Update Credentials</h3>
          </div>
          
          <form onSubmit={handleChangePassword} className="p-5 flex flex-col gap-4 text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">New Password</label>
              <input
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-zinc-700"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Confirm Password</label>
              <input
                type="password"
                required
                placeholder="Verify password match"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-zinc-700"
              />
            </div>

            {/* Verification checklist */}
            {password.length > 0 && (
              <div className="flex flex-col gap-1 bg-zinc-950/50 p-2.5 border border-white/2 rounded-sm text-[9px]">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className={passwordStrength.length ? 'text-emerald-500' : 'text-zinc-600'}>
                    {passwordStrength.length ? '✓' : '✗'}
                  </span>
                  <span className={passwordStrength.length ? 'text-zinc-300' : 'text-zinc-500'}>
                    At least 6 characters long
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className={passwordStrength.match ? 'text-emerald-500' : 'text-zinc-600'}>
                    {passwordStrength.match ? '✓' : '✗'}
                  </span>
                  <span className={passwordStrength.match ? 'text-zinc-300' : 'text-zinc-500'}>
                    Passwords match exactly
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !passwordStrength.length || !passwordStrength.match}
              className={`text-white font-bold py-2.5 rounded-sm uppercase tracking-wider transition-transform active:scale-[0.98] mt-2 text-[10px] h-10 flex items-center justify-center cursor-pointer shadow-sm ${
                passwordStrength.length && passwordStrength.match
                  ? 'bg-orange-500 hover:bg-orange-600 active:scale-95'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
              }`}
            >
              {isSubmitting ? 'Securing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>

      {/* 2. Details & Statistics Section */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* Statistics Panels */}
        <div className="flex flex-col gap-3">
          <h3 className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">
            {currentUser.role === 'owner' ? 'Business Operations Intelligence' : 'Your Floor Performance'}
          </h3>
          
          {currentUser.role === 'owner' ? (
            /* OWNER ANALYTICS */
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-zinc-900/10 border border-white/3 p-4 rounded-sm">
                <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider">Total Sales</span>
                <span className="block font-mono font-black text-sm text-emerald-400 mt-1">₹{totalSystemRevenue.toFixed(2)}</span>
              </div>
              <div className="bg-zinc-900/10 border border-white/3 p-4 rounded-sm">
                <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider">Orders Dispatched</span>
                <span className="block font-mono font-black text-sm text-white mt-1">{completedSystemOrders}</span>
              </div>
              <div className="bg-zinc-900/10 border border-white/3 p-4 rounded-sm">
                <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider">Active Staff</span>
                <span className="block font-mono font-black text-sm text-blue-400 mt-1">{activeStaffCount} members</span>
              </div>
              <div className="bg-zinc-900/10 border border-white/3 p-4 rounded-sm">
                <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider">Avg Ticket Size</span>
                <span className="block font-mono font-black text-sm text-amber-500 mt-1">
                  ₹{completedSystemOrders > 0 ? (totalSystemRevenue / completedSystemOrders).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          ) : (
            /* STAFF ANALYTICS */
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-zinc-900/10 border border-white/3 p-4 rounded-sm">
                <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider">Orders Cleared</span>
                <span className="block font-mono font-black text-sm text-white mt-1">{staffOrders.length}</span>
              </div>
              <div className="bg-zinc-900/10 border border-white/3 p-4 rounded-sm">
                <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider">Shift Sales Vol.</span>
                <span className="block font-mono font-black text-sm text-emerald-400 mt-1">₹{staffVolume.toFixed(2)}</span>
              </div>
              <div className="bg-zinc-900/10 border border-white/3 p-4 rounded-sm">
                <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider">Tokens Dispensed</span>
                <span className="block font-mono font-black text-sm text-blue-400 mt-1">{staffTokensSold.toFixed(2)} TK</span>
              </div>
              <div className="bg-zinc-900/10 border border-white/3 p-4 rounded-sm">
                <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider">Token Revenue</span>
                <span className="block font-mono font-black text-sm text-amber-500 mt-1">₹{staffRupeesCollected.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Profile Details Edit Card */}
        <div className="minimal-card rounded-md overflow-hidden">
          <div className="bg-zinc-950/80 px-5 py-4 border-b border-white/3 flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Identity Directory</span>
              <span className="text-xs font-bold text-white mt-0.5">Profile Information</span>
            </div>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="minimal-btn-secondary px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-sm cursor-pointer active:scale-95 transition-transform"
              >
                ✏ Edit Profile
              </button>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="p-5 flex flex-col gap-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Full Name</label>
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  placeholder="e.g. Sarah Connor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`minimal-input px-3.5 py-2.5 text-xs text-white placeholder-zinc-700 ${
                    !isEditing ? 'opacity-55 cursor-not-allowed bg-zinc-950/20' : ''
                  }`}
                />
              </div>

              {/* Email / Phone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Email or Phone Number</label>
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  placeholder="e.g. sarah@hauhau.com"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className={`minimal-input px-3.5 py-2.5 text-xs text-white placeholder-zinc-700 ${
                    !isEditing ? 'opacity-55 cursor-not-allowed bg-zinc-950/20' : ''
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {/* Username (Immutable) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Username (Immutable)</label>
                <div className="minimal-input px-3.5 py-2.5 text-xs text-zinc-500 bg-zinc-950/40 select-none opacity-60 border-dashed">
                  {currentUser.username}
                </div>
              </div>

              {/* Assigned Role (Immutable) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Assigned Role</label>
                <div className="minimal-input px-3.5 py-2.5 text-xs text-zinc-500 bg-zinc-950/40 select-none opacity-60 border-dashed uppercase font-bold">
                  {currentUser.role}
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end gap-2.5 border-t border-white/3 pt-4 mt-2 shrink-0 animate-slide-in">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    // Reset fields
                    if (dbUser) {
                      setName(dbUser.name);
                      setEmailOrPhone(dbUser.emailOrPhone);
                    }
                  }}
                  className="minimal-btn-secondary px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-sm cursor-pointer active:scale-95 transition-transform"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="minimal-btn-primary px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-white rounded-sm cursor-pointer active:scale-95 transition-transform"
                >
                  {isSubmitting ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            )}
          </form>
        </div>

      </div>

    </div>
  );
}

export default ProfileSection;
