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

  return (
    <div className="minimal-card rounded-md flex flex-col overflow-hidden">
      <div className="bg-zinc-950/80 px-4 py-3 border-b border-white/3">
        <h3 className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Staff Accounts</h3>
      </div>
      
      {staffList.length === 0 ? (
        <div className="p-8 text-center opacity-65">
          <span className="text-xs font-semibold uppercase tracking-wider block text-zinc-400">No Staff Accounts</span>
          <span className="text-[10px] text-zinc-600 mt-1 block">Provision accounts using the registration panel</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/3 bg-zinc-950/40 text-zinc-500">
                <th className="p-3 font-semibold uppercase tracking-wider text-[9px]">Name</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[9px]">Email/Phone</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[9px]">Username</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[9px]">Password</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[9px]">Status</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[9px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/2 bg-zinc-950/10">
              {staffList.map((staff) => (
                <tr key={staff.id} className="hover:bg-white/1 transition-colors">
                  <td className="p-3 font-bold text-zinc-200">{staff.name}</td>
                  <td className="p-3 text-zinc-500">{staff.emailOrPhone}</td>
                  <td className="p-3 text-zinc-300 font-mono">{staff.username}</td>
                  <td className="p-3 text-zinc-600 font-mono">{staff.password}</td>
                  <td className="p-3">
                    <StatusBadge status={staff.status} />
                  </td>
                  <td className="p-3 text-right flex justify-end gap-2">
                    <button
                      onClick={() => toggleStaff(staff.id)}
                      className={`px-2.5 py-1 rounded-sm text-[9px] uppercase font-bold border transition-colors cursor-pointer active:scale-95 ${
                        staff.status === 'active'
                          ? 'border-amber-500/20 text-amber-400 hover:bg-amber-500/5'
                          : 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/5'
                      }`}
                    >
                      {staff.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(staff.id, staff.name)}
                      className="px-2.5 py-1 border border-red-500/20 rounded-sm text-[9px] uppercase font-bold text-red-400 hover:bg-red-500/5 transition-colors cursor-pointer active:scale-95"
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
