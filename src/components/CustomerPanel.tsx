/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Customer } from '../types';
import { 
  Building2, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  Edit3, 
  Trash2, 
  UserCheck, 
  UserMinus, 
  CheckCircle,
  FileSpreadsheet,
  Users
} from 'lucide-react';

interface CustomerPanelProps {
  customers: Customer[];
  onCreateCustomer: (newCustomer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onUpdateCustomer: (updatedCustomer: Customer) => void;
}

export default function CustomerPanel({
  customers,
  onCreateCustomer,
  onDeleteCustomer,
  onUpdateCustomer
}: CustomerPanelProps) {
  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editStatus, setEditStatus] = useState<'Active' | 'Inactive'>('Active');

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !code.trim() || !email.trim()) {
      showNotification('Customer Name, Code, and Email are required fields.', 'error');
      return;
    }

    const cleanedCode = code.trim().toUpperCase().replace(/\s+/g, '');

    // Check code duplication
    if (customers.some(c => c.code.toUpperCase() === cleanedCode)) {
      showNotification(`A customer with code "${cleanedCode}" already exists.`, 'error');
      return;
    }

    // Check name duplication (to keep name tally perfectly unique)
    if (customers.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
      showNotification(`A customer with name "${name.trim()}" is already registered.`, 'error');
      return;
    }

    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name: name.trim(),
      code: cleanedCode.startsWith('CUST-') ? cleanedCode : `CUST-${cleanedCode}`,
      email: email.trim().toLowerCase(),
      phone: phone.trim() || 'N/A',
      address: address.trim() || 'No address specified',
      status: status,
      dateCreated: new Date().toISOString()
    };

    onCreateCustomer(newCustomer);

    // Reset Form
    setName('');
    setCode('');
    setEmail('');
    setPhone('');
    setAddress('');
    setStatus('Active');

    showNotification(`Customer "${newCustomer.name}" was successfully registered.`, 'success');
  };

  const startEditing = (cust: Customer) => {
    setEditingId(cust.id);
    setEditName(cust.name);
    setEditCode(cust.code);
    setEditEmail(cust.email);
    setEditPhone(cust.phone);
    setEditAddress(cust.address);
    setEditStatus(cust.status);
  };

  const saveEdit = (id: string) => {
    if (!editName.trim() || !editCode.trim() || !editEmail.trim()) {
      alert('Name, Code, and Email are required properties.');
      return;
    }

    // Check duplication for others
    const cleanedCode = editCode.trim().toUpperCase();
    if (customers.some(c => c.id !== id && c.code.toUpperCase() === cleanedCode)) {
      alert(`Customer Code "${cleanedCode}" is already in use by another account.`);
      return;
    }

    if (customers.some(c => c.id !== id && c.name.toLowerCase() === editName.trim().toLowerCase())) {
      alert(`Customer Name "${editName.trim()}" is already registered for another account.`);
      return;
    }

    const target = customers.find(c => c.id === id);
    if (!target) return;

    const updatedCustomer: Customer = {
      ...target,
      name: editName.trim(),
      code: cleanedCode.startsWith('CUST-') ? cleanedCode : `CUST-${cleanedCode}`,
      email: editEmail.trim().toLowerCase(),
      phone: editPhone.trim(),
      address: editAddress.trim(),
      status: editStatus
    };

    onUpdateCustomer(updatedCustomer);
    setEditingId(null);
    showNotification(`Updated profile for "${updatedCustomer.name}" successfully.`, 'success');
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to permanently delete customer "${name}"?\nThis might affect shipment records looking for this client.`)) {
      onDeleteCustomer(id);
      showNotification(`Customer "${name}" has been deleted.`, 'success');
    }
  };

  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header Info area */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Building2 className="w-4 h-4" />
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 font-mono">Consignees & Corporate Accounts</span>
          </div>
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">Customer Directory Hub</h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
            Register and monitor verified clients. Cargo dockets tally directly with names listed here. Registering verified clients maintains precise tracking integrity and streamlines formal delivery orders.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/60 p-3 shrink-0 flex items-center gap-4 text-center">
          <div>
            <span className="block text-[18px] font-extrabold font-mono text-slate-800">{customers.length}</span>
            <span className="text-[8px] font-bold text-slate-400 font-mono uppercase">Total Registered</span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <span className="block text-[18px] font-extrabold font-mono text-emerald-600">
              {customers.filter(c => c.status === 'Active').length}
            </span>
            <span className="text-[8px] font-bold text-slate-400 font-mono uppercase">Active Corporate</span>
          </div>
        </div>
      </div>

      {notification && (
        <div className={`p-3 border rounded-xl text-xs flex items-center gap-2 font-medium transition-all animate-in fade-in slide-in-from-top-2 ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <CheckCircle className={`w-4 h-4 ${notification.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`} />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Grid: Create or List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT: Creator (Cols 4) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Plus className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider">Register Master Customer</h3>
          </div>

          <form onSubmit={handleCreateCustomer} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Company / Customer Name <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                placeholder="e.g. Paramount Foods Inc"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs leading-relaxed focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Customer Code <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PMFOODS"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs font-mono uppercase focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Account Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                  className="w-full px-2.5 py-2 border border-slate-250 rounded-lg text-xs bg-white text-slate-700 focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer"
                >
                  <option value="Active">Active / Approved</option>
                  <option value="Inactive">Suspended</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Contact Email address <span className="text-rose-500">*</span></label>
              <input
                type="email"
                required
                placeholder="e.g. logistics@paramount.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Contact Phone Number</label>
              <input
                type="text"
                placeholder="e.g. +1 (555) 728-1029"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Corporate Headquarters Address</label>
              <textarea
                rows={2}
                placeholder="e.g. 702 Broadway Blvd, Seattle, WA 98101"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Corporate Account</span>
            </button>
          </form>
        </div>

        {/* RIGHT: Customer Directory list (Cols 8) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Search bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search master corporate registry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
              />
            </div>
            
            <div className="text-[10px] text-slate-400 font-mono hidden sm:block">
              Listing {filteredCustomers.length} of {customers.length} companies
            </div>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="p-12 text-center bg-white border border-dashed border-slate-250 rounded-2xl text-xs text-slate-400">
              <Users className="w-8 h-8 mx-auto text-slate-300 mb-2 font-light" />
              No matching registered customers registered in system.
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredCustomers.map((c) => {
                const isEditing = editingId === c.id;

                return (
                  <div key={c.id} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                    {isEditing ? (
                      /* Editing Form Block */
                      <div className="p-4 space-y-3 bg-slate-50/80">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans mb-1">
                          Editing Customer profile : {c.name}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Company Name</label>
                            <input
                              type="text"
                              required
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Customer Code</label>
                            <input
                              type="text"
                              required
                              value={editCode}
                              onChange={(e) => setEditCode(e.target.value)}
                              className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono uppercase focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Status</label>
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value as 'Active' | 'Inactive')}
                              className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            >
                              <option value="Active">Active / Approved</option>
                              <option value="Inactive">Suspended</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Contact Email</label>
                            <input
                              type="email"
                              required
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Contact Phone</label>
                            <input
                              type="text"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Address</label>
                          <input
                            type="text"
                            value={editAddress}
                            onChange={(e) => setEditAddress(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          />
                        </div>

                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1 text-[10px] font-bold text-slate-500 bg-slate-200 hover:bg-slate-300 rounded-md cursor-pointer transition-all uppercase"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEdit(c.id)}
                            className="px-3 py-1 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md cursor-pointer transition-all uppercase"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display Visual Block */
                      <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                        <div className="space-y-2.5 flex-1 min-w-0">
                          {/* Top row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-xs text-slate-800 leading-none">{c.name}</span>
                            <span className="font-mono text-[9px] font-bold bg-slate-100 hover:bg-slate-150 rounded border border-slate-200 px-1.5 py-0.5 text-slate-500 uppercase">
                              {c.code}
                            </span>
                            <span className={`text-[8px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${
                              c.status === 'Active' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {c.status}
                            </span>
                          </div>

                          {/* Contact and credentials */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1.5 text-[11px] text-slate-500">
                            <div className="flex items-center gap-1.5 truncate">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{c.email}</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{c.phone}</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 text-slate-350" />
                              <span className="truncate" title={c.address}>{c.address}</span>
                            </div>
                          </div>

                          <div className="text-[9px] text-slate-400">
                            Registered: {new Date(c.dateCreated).toLocaleDateString()} at {new Date(c.dateCreated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>

                        {/* Actions block */}
                        <div className="flex gap-1.5 items-center justify-end md:shrink-0 self-end md:self-center border-t md:border-t-0 pt-2.5 md:pt-0 border-slate-100">
                          <button
                            onClick={() => startEditing(c)}
                            className="p-1.5 bg-white hover:bg-slate-50 border border-slate-250 text-slate-600 rounded-lg hover:border-slate-300 transition-all cursor-pointer shadow-xs active:scale-95"
                            title="Edit corporate registration particulars"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, c.name)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 text-rose-600 rounded-lg transition-all cursor-pointer shadow-xs active:scale-95"
                            title="Permanently remove profile"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
