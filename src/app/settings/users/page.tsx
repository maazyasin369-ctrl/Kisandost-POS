'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, UserPlus, ArrowLeft, Pencil, Power, X, Check, Search, ShieldCheck } from 'lucide-react';
import { dataStore } from '@/lib/data-store';
import { Profile, Role } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';

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
  const pagination = usePagination(filteredUsers, 10);

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
      <div className="bg-[var(--kd-surface)] p-6 rounded-xl shadow-[var(--kd-shadow)] border border-border flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-1">
            <Link href="/settings" className="hover:text-primary font-bold flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Settings
            </Link>
            <span>/</span>
            <span>User Management</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center space-x-2">
            <Users className="h-6 w-6 text-primary" />
            <span>Staff Logins &amp; Role Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage owner, branch manager, and salesman access roles across physical store locations.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary text-primary-foreground hover:opacity-90 text-white font-bold px-4 py-2.5 rounded-lg text-xs flex items-center space-x-1.5 shadow-[var(--kd-shadow)] transition-colors cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add New Staff Member</span>
        </button>
      </div>

      {/* Toolbar / Search */}
      <div className="bg-[var(--kd-surface)] p-4 rounded-xl shadow-[var(--kd-shadow)] border border-border flex items-center space-x-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search staff by full name, phone number, role, or assigned branch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Staff List Table */}
      <div className="bg-[var(--kd-surface)] rounded-xl shadow-[var(--kd-shadow)] border border-border overflow-hidden">
        <div className="p-4 border-b border-border font-bold text-foreground text-sm flex items-center justify-between">
          <span>Active Staff Accounts ({filteredUsers.length})</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-foreground">
            <thead className="bg-background text-foreground font-semibold uppercase tracking-wider border-b border-border">
              <tr>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Phone / Contact</th>
                <th className="py-3 px-4">System Role</th>
                <th className="py-3 px-4">Assigned Branch</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground text-sm">
                    No staff accounts found. Click &quot;Add New Staff Member&quot; to register a staff member.
                  </td>
                </tr>
              ) : (
                pagination.pageItems.map((u) => {
                  const assignedBranch = branches.find((b) => b.id === u.branch_id);
                  return (
                    <tr key={u.id} className="hover:bg-[var(--kd-primary-soft)] transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">{u.full_name}</td>
                      <td className="py-3 px-4 font-mono text-foreground">{u.phone}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded text-[10px] font-semibold uppercase ${
                            u.role === 'owner'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : u.role === 'branch_manager'
                              ? 'bg-blue-100 text-blue-800 border border-accent/20'
                              : 'bg-background text-foreground border border-border'
                          }`}
                        >
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground">
                        {assignedBranch ? assignedBranch.name : '🌐 All Branches'}
                      </td>
                      <td className="py-3 px-4">
                        {u.is_active ? (
                          <span className="bg-[var(--kd-primary-soft)] text-primary text-[10px] font-bold px-2.5 py-0.5 rounded">
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
                          className="text-primary hover:text-primary font-bold inline-flex items-center gap-1 cursor-pointer bg-background hover:bg-[var(--kd-primary-soft)] px-2.5 py-1 rounded text-xs transition-colors"
                        >
                          <Pencil className="h-3 w-3" />
                          <span>Edit Role</span>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`p-1 rounded transition-colors cursor-pointer inline-flex items-center ${
                            u.is_active
                              ? 'text-amber-600 hover:bg-[var(--kd-accent-soft)]'
                              : 'text-primary hover:bg-[var(--kd-primary-soft)]'
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
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          from={pagination.from}
          to={pagination.to}
          pageSize={pagination.pageSize}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />
      </div>

      {/* Add New Staff Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--kd-surface)] rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-primary/20">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-primary" />
                <span>Add New Staff Member</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-[var(--kd-primary-soft)] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-foreground mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muhammad Usman"
                  value={newStaff.full_name}
                  onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })}
                  className="w-full p-2.5 border border-border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Phone / Mobile Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +92 300 9876543"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  className="w-full p-2.5 border border-border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">System Access Role *</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as Role })}
                  className="w-full p-2.5 border border-border rounded-lg text-xs sm:text-sm bg-[var(--kd-surface)] focus:ring-2 focus:ring-primary focus:outline-none font-medium"
                >
                  <option value="salesman">Salesman (POS Counter &amp; Sales Billing)</option>
                  <option value="branch_manager">Branch Manager (Stock, FEFO &amp; Credit Ledger)</option>
                  <option value="owner">Owner / Director (Full System Access)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Assigned Branch Location</label>
                <select
                  value={newStaff.branch_id}
                  onChange={(e) => setNewStaff({ ...newStaff, branch_id: e.target.value })}
                  className="w-full p-2.5 border border-border rounded-lg text-xs sm:text-sm bg-[var(--kd-surface)] focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="">🌐 All Branches (Multi-branch / Owner)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 bg-background hover:bg-[var(--kd-primary-soft)] text-foreground font-bold py-2.5 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newStaff.full_name.trim() || !newStaff.phone.trim()}
                  className="flex-1 bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center space-x-1 shadow-[var(--kd-shadow)] transition-colors cursor-pointer"
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--kd-surface)] rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-primary/20">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center space-x-2">
                <Pencil className="h-5 w-5 text-primary" />
                <span>Edit Staff Member &amp; Access Role</span>
              </h2>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-[var(--kd-primary-soft)] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-foreground mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full p-2.5 border border-border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Phone / Mobile Number *</label>
                <input
                  type="text"
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full p-2.5 border border-border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">System Access Role *</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as Role })}
                  className="w-full p-2.5 border border-border rounded-lg text-xs sm:text-sm bg-[var(--kd-surface)] focus:ring-2 focus:ring-primary focus:outline-none font-medium"
                >
                  <option value="salesman">Salesman (POS Counter &amp; Sales Billing)</option>
                  <option value="branch_manager">Branch Manager (Stock, FEFO &amp; Credit Ledger)</option>
                  <option value="owner">Owner / Director (Full System Access)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Assigned Branch Location</label>
                <select
                  value={editForm.branch_id}
                  onChange={(e) => setEditForm({ ...editForm, branch_id: e.target.value })}
                  className="w-full p-2.5 border border-border rounded-lg text-xs sm:text-sm bg-[var(--kd-surface)] focus:ring-2 focus:ring-primary focus:outline-none"
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
                  className="h-4 w-4 text-primary rounded focus:ring-primary border-border cursor-pointer"
                />
                <label htmlFor="is_active_checkbox" className="font-bold text-foreground cursor-pointer">
                  Account Active &amp; Login Enabled
                </label>
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="flex-1 bg-background hover:bg-[var(--kd-primary-soft)] text-foreground font-bold py-2.5 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editForm.full_name.trim() || !editForm.phone.trim()}
                  className="flex-1 bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center space-x-1 shadow-[var(--kd-shadow)] transition-colors cursor-pointer"
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

