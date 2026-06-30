import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import StatusBadge from './StatusBadge';
import { TokenIcon } from './TokenIcon';
import { PencilSimple, ShieldCheck, Check, X } from '@phosphor-icons/react';

export function ProfileSection() {
  const { currentUser, staffList, orders, tokenTransactions, updateProfile } = useApp();

  // Find the full database details of the logged-in user
  const dbUser = staffList.find(s => s.username === currentUser?.username);

  // Form states — initialized directly from data source
  const defaultName = dbUser?.name ?? currentUser?.name ?? '';
  const defaultEmail = dbUser?.emailOrPhone ?? '';

  const [name, setName] = useState(defaultName);
  const [emailOrPhone, setEmailOrPhone] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI states
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password strength is purely derived — computed via useMemo, not setState-in-effect
  const passwordStrength = useMemo(() => ({
    length: password.length >= 6,
    match: password.length > 0 && password === confirmPassword,
  }), [password, confirmPassword]);

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
    o => (o.staffId === currentUser.id || o.staffId === currentUser.username) && o.orderStatus === 'completed'
  );
  const staffVolume = staffOrders.reduce((sum, o) => sum + o.total, 0);

  const staffTransactions = tokenTransactions.filter(
    tx => tx.soldBy === currentUser.username
  );
  const staffRecharges = staffTransactions.filter(tx => tx.type === 'recharge');
  const staffTokensSold = staffRecharges.reduce((sum, tx) => sum + tx.tokens, 0);
  const staffRupeesCollected = staffRecharges.reduce((sum, tx) => sum + tx.amount, 0);

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
        <div className="minimal-card rounded-xl overflow-hidden relative bg-surface border border-border">
          {/* Glowing Top Decoration */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-transparent via-primary to-transparent" />
          
          <div className="p-6 flex flex-col items-center text-center">
            {/* Avatar badge */}
            <div className="w-16 h-16 rounded-full bg-surface-container border border-border flex items-center justify-center text-foreground font-bold text-lg shadow-inner relative mb-4">
              {getInitials(name || currentUser.name)}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border border-surface" />
            </div>

            <h2 className="text-sm font-bold text-foreground">{name || currentUser.name}</h2>
            <p className="text-xs text-text-muted font-mono mt-0.5">@{currentUser.username}</p>

            <div className="mt-3 flex gap-2">
              <span className="text-[10px] bg-surface-container text-text-muted px-2 py-0.5 border border-border rounded-md font-bold">
                {currentUser.role === 'owner' ? 'System Administrator' : 'POS Staff'}
              </span>
              <StatusBadge status={dbUser?.status || 'active'} />
            </div>

            {/* Info list */}
            <div className="w-full mt-6 flex flex-col gap-3.5 border-t border-border pt-6 text-xs text-left">
              <div className="flex justify-between items-center">
                <span className="text-text-muted font-bold text-xs">Registered Email</span>
                <span className="text-foreground font-semibold truncate max-w-[180px]">{emailOrPhone || dbUser?.emailOrPhone || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted font-bold text-xs">Security Status</span>
                <span className="text-[#71d384] font-bold text-xs flex items-center gap-1">
                  <ShieldCheck size={14} weight="duotone" /> Verified
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted font-bold text-xs">System ID</span>
                <span className="text-text-muted font-mono text-xs truncate max-w-[120px]">{dbUser?.id || 'default'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Block */}
        <div className="minimal-card rounded-xl overflow-hidden bg-surface border border-border">
          <div className="bg-surface-header px-4 py-3 border-b border-border">
            <h3 className="text-xs text-foreground font-bold">Update Credentials</h3>
          </div>
          
          <form onSubmit={handleChangePassword} className="p-5 flex flex-col gap-4 text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-muted font-bold">New Password</label>
              <input
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-text-muted/50 font-semibold"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-muted font-bold">Confirm Password</label>
              <input
                type="password"
                required
                placeholder="Verify password match"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-text-muted/50 font-semibold"
              />
            </div>

            {/* Verification checklist */}
            {password.length > 0 && (
              <div className="flex flex-col gap-1 bg-surface-container/30 p-2.5 border border-border rounded-md text-[10px]">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className={passwordStrength.length ? 'text-[#71d384]' : 'text-text-muted/40'}>
                    {passwordStrength.length ? <Check size={12} weight="bold" /> : <X size={12} weight="bold" />}
                  </span>
                  <span className={passwordStrength.length ? 'text-foreground' : 'text-text-muted'}>
                    At least 6 characters long
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className={passwordStrength.match ? 'text-[#71d384]' : 'text-text-muted/40'}>
                    {passwordStrength.match ? <Check size={12} weight="bold" /> : <X size={12} weight="bold" />}
                  </span>
                  <span className={passwordStrength.match ? 'text-foreground' : 'text-text-muted'}>
                    Passwords match exactly
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !passwordStrength.length || !passwordStrength.match}
              className={`font-bold py-2.5 rounded-lg transition-all mt-2 text-xs h-10 flex items-center justify-center cursor-pointer shadow-md ${
                passwordStrength.length && passwordStrength.match
                  ? 'bg-primary hover:bg-primary-hover text-white active:scale-95'
                  : 'bg-surface-container text-text-muted border border-border cursor-not-allowed opacity-50'
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
          <h3 className="text-xs text-foreground font-bold">
            {currentUser.role === 'owner' ? 'Business Operations Intelligence' : 'Your Performance'}
          </h3>
          
          {currentUser.role === 'owner' ? (
            /* OWNER ANALYTICS */
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-surface-container/30 border border-border p-4 rounded-lg">
                <span className="text-xs text-text-muted font-semibold">Total Sales</span>
                <span className="block font-mono font-bold text-base text-[#71d384] mt-1">₹{totalSystemRevenue.toFixed(2)}</span>
              </div>
              <div className="bg-surface-container/30 border border-border p-4 rounded-lg">
                <span className="text-xs text-text-muted font-semibold">Orders Dispatched</span>
                <span className="block font-mono font-bold text-base text-foreground mt-1">{completedSystemOrders}</span>
              </div>
              <div className="bg-surface-container/30 border border-border p-4 rounded-lg">
                <span className="text-xs text-text-muted font-semibold">Active Staff</span>
                <span className="block font-mono font-bold text-base text-blue-400 mt-1">{activeStaffCount} members</span>
              </div>
              <div className="bg-surface-container/30 border border-border p-4 rounded-lg">
                <span className="text-xs text-text-muted font-semibold">Avg Ticket Size</span>
                <span className="block font-mono font-bold text-base text-primary mt-1">
                  ₹{completedSystemOrders > 0 ? (totalSystemRevenue / completedSystemOrders).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          ) : (
            /* STAFF ANALYTICS */
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-surface-container/30 border border-border p-4 rounded-lg">
                <span className="text-xs text-text-muted font-semibold">Orders Cleared</span>
                <span className="block font-mono font-bold text-base text-foreground mt-1">{staffOrders.length}</span>
              </div>
              <div className="bg-surface-container/30 border border-border p-4 rounded-lg">
                <span className="text-xs text-text-muted font-semibold">Shift Sales Vol.</span>
                <span className="block font-mono font-bold text-base text-[#71d384] mt-1">₹{staffVolume.toFixed(2)}</span>
              </div>
              <div className="bg-surface-container/30 border border-border p-4 rounded-lg">
                <span className="text-xs text-text-muted font-semibold">Tokens Dispensed</span>
                <span className="block font-mono font-bold text-base text-blue-400 mt-1">{staffTokensSold.toFixed(0)} <TokenIcon className="ml-1 w-3.5 h-3.5 text-blue-400" /></span>
              </div>
              <div className="bg-surface-container/30 border border-border p-4 rounded-lg">
                <span className="text-xs text-text-muted font-semibold">Token Revenue</span>
                <span className="block font-mono font-bold text-base text-primary mt-1">₹{staffRupeesCollected.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Profile Details Edit Card */}
        <div className="minimal-card rounded-xl overflow-hidden bg-surface border border-border">
          <div className="bg-surface-header px-5 py-4 border-b border-border flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-xs text-text-muted font-semibold">Identity Directory</span>
              <span className="text-xs font-bold text-foreground mt-0.5">Profile Information</span>
            </div>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="minimal-btn-secondary px-3.5 py-1.5 text-[11px] font-bold rounded-md cursor-pointer active:scale-95 transition-transform flex items-center gap-1.5"
              >
                                <PencilSimple size={14} weight="duotone" /> Edit Profile
              </button>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="p-5 flex flex-col gap-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-muted font-bold">Full Name</label>
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  placeholder="e.g. Sarah Connor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`minimal-input px-3.5 py-2.5 text-xs text-white placeholder-text-muted/50 font-semibold ${
                    !isEditing ? 'opacity-55 cursor-not-allowed bg-surface-container/45' : ''
                  }`}
                />
              </div>

              {/* Email / Phone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-muted font-bold">Email or Phone Number</label>
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  placeholder="e.g. sarah@hauhau.com"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className={`minimal-input px-3.5 py-2.5 text-xs text-white placeholder-text-muted/50 font-semibold ${
                    !isEditing ? 'opacity-55 cursor-not-allowed bg-surface-container/45' : ''
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {/* Username (Immutable) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-muted font-bold">Username (Immutable)</label>
                <div className="minimal-input px-3.5 py-2.5 text-xs text-text-muted bg-surface-container select-none opacity-60 border-dashed font-semibold">
                  {currentUser.username}
                </div>
              </div>

              {/* Assigned Role (Immutable) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-muted font-bold">Assigned Role</label>
                <div className="minimal-input px-3.5 py-2.5 text-xs text-text-muted bg-surface-container select-none opacity-60 border-dashed font-bold capitalize">
                  {currentUser.role}
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end gap-2.5 border-t border-border pt-4 mt-2 shrink-0 animate-slide-in">
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
                  className="minimal-btn-secondary px-4 py-2 text-xs font-bold rounded-md cursor-pointer active:scale-95 transition-transform"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="minimal-btn-primary px-5 py-2 text-xs font-bold text-white rounded-md cursor-pointer active:scale-95 transition-transform"
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
