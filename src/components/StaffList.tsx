import React from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from './StatusBadge';

export function StaffList() {
  const { staffList, toggleStaff, removeStaff, confirmAction } = useApp();

  const handleDelete = (id: string, name: string) => {
    confirmAction(
      `Are you sure you want to delete the staff account for "${name}"?`,
      () => removeStaff(id)
    );
  };

  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="minimal-card rounded-xl flex flex-col overflow-hidden relative bg-surface border border-border">
      <div className="absolute -left-12 -top-12 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />

      {/* Header */}
      <div className="bg-surface-header px-5 py-4 border-b border-border relative z-10">
        <h3 className="text-xs text-foreground font-bold">Staff Members</h3>
      </div>
      
      {staffList.length === 0 ? (
        <div className="p-12 text-center opacity-65 relative z-10">
          <span className="text-xs font-bold block text-text-muted">No staff accounts found</span>
          <span className="text-xs text-text-muted mt-1.5 block">Create staff accounts using the registration panel</span>
        </div>
      ) : (
        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-header/40 text-text-muted">
                <th className="p-3.5 pl-5 text-xs font-semibold">Staff</th>
                <th className="p-3.5 text-xs font-semibold">Contact</th>
                <th className="p-3.5 text-xs font-semibold">Username</th>
                <th className="p-3.5 text-xs font-semibold">Role</th>
                <th className="p-3.5 text-xs font-semibold">Status</th>
                <th className="p-3.5 pr-5 text-xs font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface/10">
              {staffList.map((staff) => (
                <tr key={staff.id} className="hover:bg-surface-container/20 transition-colors duration-250">
                  <td className="p-3.5 pl-5">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-surface-container border border-border flex items-center justify-center text-text-muted text-[11px] font-bold uppercase tracking-wide shadow-inner">
                        {getInitials(staff.name)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground text-xs">{staff.name}</span>
                        <span className="text-[9px] bg-surface-container text-text-muted px-1.5 py-0.2 rounded-sm border border-border font-bold mt-1 w-max capitalize">
                          {staff.role === 'owner' ? 'Owner' : 'Floor Staff'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 text-text-muted font-mono">{staff.emailOrPhone}</td>
                  <td className="p-3.5 text-foreground font-mono font-semibold">@{staff.username}</td>
                  <td className="p-3.5 text-foreground font-semibold capitalize">
                    {staff.role === 'owner' ? 'Owner' : 'Floor Staff'}
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${staff.status === 'active' ? 'bg-[#71d384] animate-pulse-ring-emerald' : 'bg-error'} inline-block`} />
                      <StatusBadge status={staff.status} />
                    </div>
                  </td>
                  <td className="p-3.5 pr-5 text-right flex justify-end gap-2 shrink-0">
                    <button
                      onClick={() => toggleStaff(staff.id)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer active:scale-95 ${
                        staff.status === 'active'
                          ? 'border-primary/20 text-primary hover:bg-primary/5'
                          : 'border-success/20 text-[#71d384] hover:bg-success/5'
                      }`}
                    >
                      {staff.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(staff.id, staff.name)}
                      className="px-2.5 py-1 border border-error/20 rounded-md text-[10px] font-bold text-error hover:bg-error/5 transition-colors cursor-pointer active:scale-95"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
export default StaffList;
