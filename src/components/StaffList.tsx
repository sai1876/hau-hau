import React from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from './StatusBadge';

export function StaffList() {
  const { staffList, toggleStaff, removeStaff, updateStaffLimit, confirmAction } = useApp();

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
    <div className="minimal-card rounded-xl flex flex-col overflow-hidden relative">
      <div className="absolute -left-12 -top-12 w-24 h-24 bg-orange-500/5 rounded-full blur-xl pointer-events-none" />

      {/* Header */}
      <div className="bg-zinc-950/80 px-5 py-4 border-b border-white/5 relative z-10">
        <h3 className="text-[10px] uppercase font-extrabold tracking-widest text-zinc-400">Registered Staff Registry</h3>
      </div>
      
      {staffList.length === 0 ? (
        <div className="p-12 text-center opacity-65 relative z-10">
          <span className="text-xs font-bold uppercase tracking-widest block text-zinc-500">No Staff Accounts Found</span>
          <span className="text-[10px] text-zinc-650 mt-1.5 block font-semibold">Provision staff operator keys using the registration panel</span>
        </div>
      ) : (
        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-zinc-950/40 text-zinc-500">
                <th className="p-3.5 pl-5 font-bold uppercase tracking-widest text-[8px]">Operator Info</th>
                <th className="p-3.5 font-bold uppercase tracking-widest text-[8px]">Contact Info</th>
                <th className="p-3.5 font-bold uppercase tracking-widest text-[8px]">Operator ID</th>
                <th className="p-3.5 font-bold uppercase tracking-widest text-[8px]">Operator Pass</th>
                <th className="p-3.5 font-bold uppercase tracking-widest text-[8px]">Status</th>
                <th className="p-3.5 pr-5 font-bold uppercase tracking-widest text-[8px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/2 bg-zinc-950/10">
              {staffList.map((staff) => (
                <tr key={staff.id} className="hover:bg-white/1.5 transition-colors duration-250">
                  <td className="p-3.5 pl-5">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-350 text-[10px] font-black uppercase tracking-wider shadow-inner">
                        {getInitials(staff.name)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-extrabold text-zinc-200 text-xs">{staff.name}</span>
                        <span className="text-[8px] bg-zinc-900 text-zinc-500 px-1.5 py-0.2 rounded-sm border border-white/3 font-extrabold uppercase tracking-widest mt-1 w-max">
                          Floor Staff
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 text-zinc-550 font-semibold font-mono">{staff.emailOrPhone}</td>
                  <td className="p-3.5 text-zinc-300 font-mono font-bold">@{staff.username}</td>
                  <td className="p-3.5 text-zinc-650 font-mono tracking-widest">••••••••</td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${staff.status === 'active' ? 'bg-emerald-500 animate-pulse-ring-emerald' : 'bg-red-500'} inline-block`} />
                      <StatusBadge status={staff.status} />
                    </div>
                  </td>
                  <td className="p-3.5 pr-5 text-right flex justify-end gap-2 shrink-0">
                    <button
                      onClick={() => toggleStaff(staff.id)}
                      className={`px-2.5 py-1 rounded-md text-[9px] uppercase font-extrabold border transition-colors cursor-pointer active:scale-95 ${
                        staff.status === 'active'
                          ? 'border-amber-500/20 text-amber-450 hover:bg-amber-500/5'
                          : 'border-emerald-500/20 text-emerald-450 hover:bg-emerald-500/5'
                      }`}
                    >
                      {staff.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(staff.id, staff.name)}
                      className="px-2.5 py-1 border border-red-500/20 rounded-md text-[9px] uppercase font-extrabold text-red-400 hover:bg-red-500/5 transition-colors cursor-pointer active:scale-95"
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
