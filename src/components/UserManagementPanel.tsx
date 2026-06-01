/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, SecurityLevel } from '../types';
import { 
  Users, 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Trash2, 
  Edit3, 
  Plus, 
  UserPlus, 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  X,
  RefreshCw,
  Key
} from 'lucide-react';

interface UserManagementPanelProps {
  users: User[];
  currentUser: User;
  onSetCurrentUser: (user: User) => void;
  onCreateUser: (newUser: User) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateUser: (updatedUser: User) => void;
}

export default function UserManagementPanel({
  users,
  currentUser,
  onSetCurrentUser,
  onCreateUser,
  onDeleteUser,
  onUpdateUser
}: UserManagementPanelProps) {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Registration Form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [level, setLevel] = useState<SecurityLevel>('VIEWER');
  const [department, setDepartment] = useState('Logistics Operations');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Editing state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editLevel, setEditLevel] = useState<SecurityLevel>('VIEWER');
  const [editDepartment, setEditDepartment] = useState('');

  const isAdmin = currentUser.securityLevel === 'ADMIN';

  // Handle creating user
  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim() || !email.trim()) {
      setErrorMessage('Please fill in Name, Username, and Email.');
      return;
    }

    if (!isAdmin) {
      setErrorMessage('Access Denied. Only users with ADMIN security level can create new users.');
      return;
    }

    const cleanedUsername = username.trim().toLowerCase().replace(/\s+/g, '');
    
    // Check if username already exists
    if (users.some(u => u.username.toLowerCase() === cleanedUsername)) {
      setErrorMessage(`Username "${cleanedUsername}" is already taken.`);
      return;
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: fullName.trim(),
      username: cleanedUsername,
      email: email.trim().toLowerCase(),
      securityLevel: level,
      department: department.trim(),
      isActive: true,
      dateCreated: new Date().toISOString()
    };

    onCreateUser(newUser);

    // Reset Form
    setFullName('');
    setUsername('');
    setEmail('');
    setLevel('VIEWER');
    setErrorMessage('');
    setSuccessMessage(`User "${newUser.name}" was successfully registered with ${newUser.securityLevel} credentials.`);
    
    setTimeout(() => {
      setSuccessMessage('');
    }, 4000);
  };

  // Handle starting edit
  const startEditing = (user: User) => {
    if (!isAdmin) {
      alert('Access Denied. Only ADMIN security level can edit or change user details.');
      return;
    }
    setEditingUserId(user.id);
    setEditFullName(user.name);
    setEditLevel(user.securityLevel);
    setEditDepartment(user.department);
  };

  // Handle saving edit
  const saveUserEdit = (userId: string) => {
    if (!isAdmin) {
      alert('Access Denied. Only ADMIN security level can update user details.');
      return;
    }
    if (!editFullName.trim()) {
      alert('Full Name cannot be empty.');
      return;
    }

    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const updatedUser: User = {
      ...targetUser,
      name: editFullName.trim(),
      securityLevel: editLevel,
      department: editDepartment.trim()
    };

    onUpdateUser(updatedUser);

    // If we updated ourselves, also update the global current session
    if (currentUser.id === idOfCurrentUser) {
      // Wait, let's compare targetUser.id with currentUser.id
      if (currentUser.id === userId) {
        onSetCurrentUser(updatedUser);
      }
    }

    setEditingUserId(null);
    setSuccessMessage(`Changes saved successfully for user "${updatedUser.name}".`);
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  // Handle deleting user
  const handleDeleteUser = (userId: string) => {
    if (!isAdmin) {
      alert('Permission Denied. Only users with ADMIN security level can delete users.');
      return;
    }

    if (userId === currentUser.id) {
      alert('Security violation. You cannot delete your own currently simulated active user profile.');
      return;
    }

    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    if (confirm(`Are you sure you want to permanently delete user "${targetUser.name}"?`)) {
      onDeleteUser(userId);
      setSuccessMessage(`User "${targetUser.name}" has been deleted.`);
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    }
  };

  const idOfCurrentUser = currentUser.id;

  // Filtered users by query
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q)
    );
  });

  // Grouped users by Security level
  const admins = filteredUsers.filter((u) => u.securityLevel === 'ADMIN');
  const operators = filteredUsers.filter((u) => u.securityLevel === 'OPERATOR');
  const viewers = filteredUsers.filter((u) => u.securityLevel === 'VIEWER');

  return (
    <div className="space-y-6">
      
      {/* Top Credentials Simulator box to let user change acting user context to verify ADMIN vs other guard */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-5 border border-slate-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300">
              <Key className="w-4 h-4 animate-pulse" />
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 font-mono">Role Simulation Environment</span>
          </div>
          <h2 className="text-sm font-bold text-white tracking-tight">Active Security Identity Session</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Verify permission constraints in real-time. Change your current active user session below to experience restrictions. Only <span className="font-bold text-amber-300 font-mono">ADMINs</span> have structural mutation access (Create, Edit, Delete).
          </p>
        </div>

        <div className="bg-slate-800/80 rounded-xl border border-slate-700/50 p-3 shrink-0 flex items-center gap-3">
          <div>
            <label className="block text-[8px] font-bold text-slate-400 font-mono uppercase mb-1">Acting Logged-In User</label>
            <select
              value={currentUser.id}
              onChange={(e) => {
                const found = users.find(u => u.id === e.target.value);
                if (found) onSetCurrentUser(found);
              }}
              className="bg-slate-900/90 border border-slate-700/60 rounded-lg text-xs px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.securityLevel})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col items-center justify-center p-1 rounded-lg bg-slate-900/50">
            {isAdmin ? (
              <div className="flex flex-col items-center text-emerald-400 px-1" title="ADMIN Cleared">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-[8px] font-mono font-bold mt-0.5">ADMIN</span>
              </div>
            ) : currentUser.securityLevel === 'OPERATOR' ? (
              <div className="flex flex-col items-center text-blue-400 px-1" title="OPERATOR Cleared">
                <Shield className="w-5 h-5" />
                <span className="text-[8px] font-mono font-bold mt-0.5">OPERATOR</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-amber-400 px-1" title="VIEWER restricted">
                <ShieldAlert className="w-5 h-5" />
                <span className="text-[8px] font-mono font-bold mt-0.5">VIEWER</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Create form vs List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT FORM (Cols 4) - User Registration */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 relative overflow-hidden">
          
          {/* Security Banner alert overlay when session is not ADMIN */}
          {!isAdmin && (
            <div className="absolute inset-0 bg-slate-50/95 z-10 flex flex-col items-center justify-center p-6 text-center backdrop-blur-xs">
              <Lock className="w-10 h-10 text-slate-400 mb-3" />
              <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider">Creation Blocked</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
                Only personnel with <span className="text-indigo-600 font-bold font-mono">ADMIN</span> security level can register new credentials.
              </p>
              <div className="mt-4 text-[10px] bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100 font-mono">
                Active: {currentUser.name} ({currentUser.securityLevel})
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Register Security Account</h3>
              <p className="text-[10px] text-slate-400">Generate local credential access</p>
            </div>
          </div>

          <form onSubmit={handleCreateUserSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Full Name <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                placeholder="e.g. Robert Downey"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs text-slate-700 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Username <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                placeholder="e.g. rdowney"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs font-mono text-slate-700 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Work Email Address <span className="text-rose-500">*</span></label>
              <input
                type="email"
                required
                placeholder="e.g. rdowney@cargobridge.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs text-slate-700 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                  Security Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as SecurityLevel)}
                  className="w-full px-2.5 py-2 border border-slate-250 rounded-lg text-xs text-slate-700 bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="VIEWER">VIEWER (Read-Only)</option>
                  <option value="OPERATOR">OPERATOR (Read/Write)</option>
                  <option value="ADMIN">ADMIN (Full Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Customs Terminal"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs text-slate-700 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register User Profile</span>
            </button>
          </form>
        </div>

        {/* RIGHT LIST (Cols 8) - Separated by Security Levels */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Filtering Search Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff user directories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
              />
            </div>
            
            <div className="text-[10px] text-slate-400 font-mono font-medium hidden sm:block">
              Listing {filteredUsers.length} of {users.length} Active System Handles
            </div>
          </div>

          {/* Grouped Lists - ADMINS, OPERATORS, VIEWERS */}
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center bg-white border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
              <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              No matching system users found.
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* ADMIN DIVISION */}
              {admins.length > 0 && (
                <div className="bg-white rounded-2xl border border-rose-100/75 shadow-xs overflow-hidden">
                  <div className="bg-rose-50/70 border-b border-rose-100/50 px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                      <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider text-rose-800">
                        Administrative Division (ADMIN)
                      </span>
                    </div>
                    <span className="text-[9px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded font-mono">
                      {admins.length} {admins.length === 1 ? 'User' : 'Users'}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {renderUserRows(admins)}
                  </div>
                </div>
              )}

              {/* OPERATOR DIVISION */}
              {operators.length > 0 && (
                <div className="bg-white rounded-2xl border border-blue-100 shadow-xs overflow-hidden">
                  <div className="bg-blue-50/50 border-b border-blue-100 px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider text-blue-850">
                        Operational Division (OPERATOR)
                      </span>
                    </div>
                    <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded font-mono">
                      {operators.length} {operators.length === 1 ? 'User' : 'Users'}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {renderUserRows(operators)}
                  </div>
                </div>
              )}

              {/* VIEWER DIVISION */}
              {viewers.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="bg-slate-50/80 border-b border-slate-250/30 px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-slate-400" />
                      <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider text-slate-500">
                        Supervisory & Viewer Division (VIEWER)
                      </span>
                    </div>
                    <span className="text-[9px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded font-mono">
                      {viewers.length} {viewers.length === 1 ? 'User' : 'Users'}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {renderUserRows(viewers)}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );

  // Render Row logic
  function renderUserRows(userList: User[]) {
    return userList.map((u) => {
      const isEditing = editingUserId === u.id;
      const isSelf = u.id === currentUser.id;

      return (
        <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
          
          {isEditing ? (
            /* Editing form block */
            <div className="w-full space-y-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wilder mb-0.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-350 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wilder mb-0.5">Security Level</label>
                  <select
                    value={editLevel}
                    onChange={(e) => setEditLevel(e.target.value as SecurityLevel)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-350 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="VIEWER">VIEWER (Read-Only)</option>
                    <option value="OPERATOR">OPERATOR (Read/Write)</option>
                    <option value="ADMIN">ADMIN (Full Access)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wilder mb-0.5">Department</label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-350 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setEditingUserId(null)}
                  className="px-3 py-1 text-[10px] font-bold text-slate-500 bg-slate-200 hover:bg-slate-300 rounded-md cursor-pointer transition-all uppercase"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => saveUserEdit(u.id)}
                  className="px-3 py-1 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md cursor-pointer transition-all uppercase"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            /* Normal visual row */
            <React.Fragment>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 shrink-0 select-none border border-slate-200">
                  {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-slate-800">{u.name}</span>
                    <span className="font-mono text-[10px] text-slate-400">@{u.username}</span>
                    {isSelf && (
                      <span className="px-1.5 py-0.2 text-[8px] font-mono bg-violet-100 border border-violet-200 text-violet-800 font-extrabold rounded">
                        Active Simulation Session
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-x-2.5 flex-wrap">
                    <span>{u.email}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-medium">{u.department}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1">
                    Credentials Issued: {new Date(u.dateCreated).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Action buttons (Only displayed or active depending on ADMIN check) */}
              <div className="flex items-center gap-1.5 shrink-0 sm:justify-end self-end sm:self-center">
                <button
                  onClick={() => startEditing(u)}
                  disabled={!isAdmin}
                  className={`p-1.5 rounded-lg border transition-all ${
                    isAdmin
                      ? 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer hover:border-slate-300'
                      : 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                  }`}
                  title={isAdmin ? "Edit credentials name & level" : "Requires ADMIN permission level"}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteUser(u.id)}
                  disabled={!isAdmin || isSelf}
                  className={`p-1.5 rounded-lg border transition-all ${
                    !isAdmin 
                      ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                      : isSelf
                      ? 'border-rose-100 bg-rose-50/20 text-rose-300 cursor-not-allowed'
                      : 'border-rose-200 bg-rose-50/50 hover:bg-rose-100 hover:border-rose-300 text-rose-600 cursor-pointer active:scale-95'
                  }`}
                  title={!isAdmin ? "Requires ADMIN permission level" : isSelf ? "Cannot delete yourself" : "Permanently revoke user credentials"}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </React.Fragment>
          )}

        </div>
      );
    });
  }
}
