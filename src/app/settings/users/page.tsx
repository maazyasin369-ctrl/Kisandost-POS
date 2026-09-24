'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, UserPlus, ArrowLeft, Pencil, Power, X, Check, Search, ShieldCheck } from 'lucide-react';
import { dataStore } from '@/lib/data-store';
import { Profile, Role } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

export default function UserManagementPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<Profile[]>(() => dataStore.getProfiles());
  const [branches, setBranches] = useState(() => dataStore.getBranches());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setUsers(dataStore.getProfiles());
    setBranches(dataStore.getBranches());
  }, []);

  // Add Staff Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState<{
    full_name: string;
    phone: string;
    role: Role;
    branch_id: string;
  }>({
    full_name: '',
    phone: '',
    role: 'salesman',
    branch_id: '',
  });

  // Edit Staff Modal State
  const [editingStaff, setEditingStaff] = useState<Profile | null>(null);
  const [editForm, setEditForm] = useState<{
    full_name: string;
    phone: string;
    role: Role;
    branch_id: string;
    is_active: boolean;
  }>({
    full_name: '',
    phone: '',
    role: 'salesman',
    branch_id: '',
    is_active: true,
  });

  const filteredUsers = users.filter((u) => {
    const assignedBranch = branches.find((b) => b.id === u.branch_id);
    const branchName = assignedBranch ? assignedBranch.name : 'All Branches';
    const q = searchQuery.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      u.role.toLowerCase().includes(q) ||
      branchName.toLowerCase().includes(q)
    );
  });

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.full_name.trim() || !newStaff.phone.trim()) return;

    const created = dataStore.addProfile({
      full_name: newStaff.full_name.trim(),
      phone: newStaff.phone.trim(),
      role: newStaff.role,
      branch_id: newStaff.branch_id || undefined,
    });

    setUsers(dataStore.getProfiles().slice());
    setIsAddModalOpen(false);
    setNewStaff({ full_name: '', phone: '', role: 'salesman', branch_id: '' });
    showToast(`Staff member '${created.full_name}' added successfully!`, 'success');
  };

  const openEditModal = (staff: Profile) => {
    setEditingStaff(staff);
    setEditForm({
      full_name: staff.full_name,
      phone: staff.phone,
      role: staff.role,
      branch_id: staff.branch_id || '',
      is_active: staff.is_active,
    });
  };

  const handleUpdateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || !editForm.full_name.trim() || !editForm.phone.trim()) return;

    dataStore.updateProfile(editingStaff.id, {
      full_name: editForm.full_name.trim(),
      phone: editForm.phone.trim(),
      role: editForm.role,
      branch_id: editForm.branch_id || undefined,
      is_active: editForm.is_active,
    });

    setUsers(dataStore.getProfiles().slice());
    setEditingStaff(null);
    showToast(`Staff account '${editForm.full_name}' updated!`, 'success');
  };

  const handleToggleStatus = (staff: Profile) => {
    const updated = dataStore.toggleProfileStatus(staff.id);
    setUsers(dataStore.getProfiles().slice());
    if (updated) {
      showToast(
        `Staff account '${staff.full_name}' ${updated.is_active ? 'activated' : 'disabled'}`,
        updated.is_active ? 'success' : 'info'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <Link href="/settings" className="hover:text-emerald-700 font-bold flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Settings
            </Link>
            <span>/</span>
            <span>User Management</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Users className="h-6 w-6 text-emerald-800" />
            <span>Staff Logins &amp; Role Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage owner, branch manager, and salesman access roles across physical store locations.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2.5 rounded-lg text-xs flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add New Staff Member</span>
        </button>
      </div>

      {/* Toolbar / Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff by full name, phone number, role, or assigned branch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Staff List Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 font-bold text-slate-900 text-sm flex items-center justify-between">
          <span>Active Staff Accounts ({filteredUsers.length})</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Phone / Contact</th>
                <th className="py-3 px-4">System Role</th>
                <th className="py-3 px-4">Assigned Branch</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-sm">
                    No staff accounts found. Click &quot;Add New Staff Member&quot; to register a staff member.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const assignedBranch = branches.find((b) => b.id === u.branch_id);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-extrabold text-slate-900">{u.full_name}</td>
                      <td className="py-3 px-4 font-mono text-slate-700">{u.phone}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase ${
                            u.role === 'owner'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : u.role === 'branch_manager'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}
                        >
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {assignedBranch ? assignedBranch.name : '🌐 All Branches'}
                      </td>
                      <td className="py-3 px-4">
                        {u.is_active ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded">
                            Active
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2.5 py-0.5 rounded">
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded text-xs transition-colors"
                        >
                          <Pencil className="h-3 w-3" />
                          <span>Edit Role</span>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`p-1 rounded transition-colors cursor-pointer inline-flex items-center ${
                            u.is_active
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={u.is_active ? 'Disable Staff Account' : 'Activate Staff Account'}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Staff Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-emerald-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-emerald-700" />
                <span>Add New Staff Member</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muhammad Usman"
                  value={newStaff.full_name}
                  onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone / Mobile Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +92 300 9876543"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">System Access Role *</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as Role })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                >
                  <option value="salesman">Salesman (POS Counter &amp; Sales Billing)</option>
                  <option value="branch_manager">Branch Manager (Stock, FEFO &amp; Credit Ledger)</option>
                  <option value="owner">Owner / Director (Full System Access)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Branch Location</label>
                <select
                  value={newStaff.branch_id}
                  onChange={(e) => setNewStaff({ ...newStaff, branch_id: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">🌐 All Branches (Multi-branch / Owner)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newStaff.full_name.trim() || !newStaff.phone.trim()}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center space-x-1 shadow-sm transition-colors cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Create Staff Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-emerald-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
                <Pencil className="h-5 w-5 text-emerald-700" />
                <span>Edit Staff Member &amp; Access Role</span>
              </h2>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone / Mobile Number *</label>
                <input
                  type="text"
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">System Access Role *</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as Role })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                >
                  <option value="salesman">Salesman (POS Counter &amp; Sales Billing)</option>
                  <option value="branch_manager">Branch Manager (Stock, FEFO &amp; Credit Ledger)</option>
                  <option value="owner">Owner / Director (Full System Access)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Branch Location</label>
                <select
                  value={editForm.branch_id}
                  onChange={(e) => setEditForm({ ...editForm, branch_id: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">🌐 All Branches (Multi-branch / Owner)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="is_active_checkbox"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  className="h-4 w-4 text-emerald-700 rounded focus:ring-emerald-500 border-slate-300 cursor-pointer"
                />
                <label htmlFor="is_active_checkbox" className="font-bold text-slate-700 cursor-pointer">
                  Account Active &amp; Login Enabled
                </label>
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editForm.full_name.trim() || !editForm.phone.trim()}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center space-x-1 shadow-sm transition-colors cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>Update Staff Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

