/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Vessel, Customer, User } from '../types';
import { 
  Anchor, 
  Search, 
  Plus, 
  ShieldCheck, 
  Tag, 
  Edit3, 
  Trash2, 
  CheckCircle,
  HelpCircle,
  Briefcase,
  Lock,
  Compass
} from 'lucide-react';

interface VesselPanelProps {
  vessels: Vessel[];
  customers: Customer[];
  currentUser: User;
  onCreateVessel: (newVessel: Vessel) => void;
  onDeleteVessel: (vesselId: string) => void;
  onUpdateVessel: (updatedVessel: Vessel) => void;
}

export default function VesselPanel({
  vessels,
  customers,
  currentUser,
  onCreateVessel,
  onDeleteVessel,
  onUpdateVessel
}: VesselPanelProps) {
  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [imo, setImo] = useState('');
  const [clientName, setClientName] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editImo, setEditImo] = useState('');
  const [editClientName, setEditClientName] = useState('');
  const [editStatus, setEditStatus] = useState<'Active' | 'Inactive'>('Active');

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const isAdmin = currentUser.securityLevel === 'ADMIN';

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const handleCreateVessel = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      showNotification('Access Denied. Only users with ADMIN security level can register or modify vessels.', 'error');
      return;
    }

    if (!name.trim() || !imo.trim() || !clientName) {
      showNotification('Vessel Name, IMO #, and Associated Client are required fields.', 'error');
      return;
    }

    const cleanedImo = imo.trim().toUpperCase();

    // Valid IMO is usually 'IMO ' followed by 7 digits, let's keep it format friendly
    const formattedImo = cleanedImo.startsWith('IMO') ? cleanedImo : `IMO ${cleanedImo}`;

    // Verify duplication
    if (vessels.some(v => v.imo.toUpperCase() === formattedImo.toUpperCase() && v.clientName === clientName)) {
      showNotification(`Vessel with IMO "${formattedImo}" is already registered under "${clientName}".`, 'error');
      return;
    }

    const newVessel: Vessel = {
      id: `vsl-${Date.now()}`,
      name: name.trim(),
      imo: formattedImo,
      clientName: clientName,
      status: status,
      dateCreated: new Date().toISOString()
    };

    onCreateVessel(newVessel);

    // Reset Form
    setName('');
    setImo('');
    setClientName('');
    setStatus('Active');

    showNotification(`Vessel "${newVessel.name}" was successfully registered.`, 'success');
  };

  const startEditing = (vsl: Vessel) => {
    if (!isAdmin) {
      alert('Access Denied. Only ADMIN security level can update vessel registrations.');
      return;
    }
    setEditingId(vsl.id);
    setEditName(vsl.name);
    setEditImo(vsl.imo);
    setEditClientName(vsl.clientName);
    setEditStatus(vsl.status);
  };

  const saveEdit = (id: string) => {
    if (!isAdmin) {
      alert('Access Denied. Only ADMIN security level can update vessel registrations.');
      return;
    }
    if (!editName.trim() || !editImo.trim() || !editClientName) {
      alert('Name, IMO Number, and Associated Client are required.');
      return;
    }

    const formattedImo = editImo.trim().toUpperCase().startsWith('IMO') ? editImo.trim().toUpperCase() : `IMO ${editImo.trim().toUpperCase()}`;

    const target = vessels.find(v => v.id === id);
    if (!target) return;

    const updatedVessel: Vessel = {
      ...target,
      name: editName.trim(),
      imo: formattedImo,
      clientName: editClientName,
      status: editStatus
    };

    onUpdateVessel(updatedVessel);
    setEditingId(null);
    showNotification(`Updated registration details for "${updatedVessel.name}".`, 'success');
  };

  const handleDelete = (id: string, name: string) => {
    if (!isAdmin) {
      alert('Access Denied. Only ADMIN security level can delete vessel records.');
      return;
    }
    if (confirm(`Are you sure you want to permanently delete vessel "${name}"?\nThis will remove it from AWB assignment templates.`)) {
      onDeleteVessel(id);
      showNotification(`Vessel "${name}" has been deleted.`, 'success');
    }
  };

  const filteredVessels = vessels.filter(v => {
    const q = searchQuery.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      v.imo.toLowerCase().includes(q) ||
      v.clientName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header Info area */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Anchor className="w-4 h-4" />
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 font-mono">Maritime Fleet Management</span>
          </div>
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">Fleet & Vessel Directory</h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
            Register sea-going vessels with verified IMO numbers and bind them to their respective charterers and clients. When creating a new shipment dockets, vessels are queried specifically based on the chosen client.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/60 p-3 shrink-0 flex items-center gap-4 text-center">
          <div>
            <span className="block text-[18px] font-extrabold font-mono text-slate-800">{vessels.length}</span>
            <span className="text-[8px] font-bold text-slate-400 font-mono uppercase">Total Sea Vessels</span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <span className="block text-[18px] font-extrabold font-mono text-indigo-600">
              {vessels.filter(v => v.status === 'Active').length}
            </span>
            <span className="text-[8px] font-bold text-slate-400 font-mono uppercase">Active Fleet</span>
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

      {/* Grid: Create vs List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT: Creator (Cols 4) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 relative overflow-hidden">
          
          {/* Security Overlay block */}
          {!isAdmin && (
            <div className="absolute inset-0 bg-slate-50/95 z-10 flex flex-col items-center justify-center p-6 text-center backdrop-blur-xs">
              <Lock className="w-10 h-10 text-slate-400 mb-3" />
              <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider">Access Restrained</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
                Only personnel with <span className="text-indigo-600 font-bold font-mono">ADMIN</span> security credentials can register or change vessel dockets.
              </p>
              <div className="mt-4 text-[10px] bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100 font-mono">
                Your Role: {currentUser.securityLevel}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Plus className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider">Register Master Vessel</h3>
          </div>

          <form onSubmit={handleCreateVessel} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Vessel Name <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                placeholder="e.g. MV Ever Given, container ship"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs leading-relaxed focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-semibold text-slate-850"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                IMO Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 9514028 (7 digit IMO)"
                value={imo}
                onChange={(e) => setImo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs font-mono focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800"
              />
              <span className="text-[9px] text-slate-400 mt-0.5 block">Unique 7-digit Lloyd's maritime registry number</span>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Associated Client Name <span className="text-rose-500">*</span>
              </label>
              {customers.length === 0 ? (
                <div className="p-2 border border-rose-200 bg-rose-50 rounded-lg text-[10px] text-rose-700 font-semibold">
                  No registered active customers available! Register one first to pair.
                </div>
              ) : (
                <select
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-2.5 py-2 border border-slate-250 rounded-lg text-xs bg-white text-slate-700 focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer font-medium"
                >
                  <option value="">-- Bind to Client Company --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              )}
              <span className="text-[9px] text-slate-400 mt-0.5 block">Determines which Client shipment form can select this vessel.</span>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fleet Service Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                className="w-full px-2.5 py-2 border border-slate-250 rounded-lg text-xs bg-white text-slate-700 focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="Active">Active in Fleet</option>
                <option value="Inactive">Dry Dock / Inactive</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Vessel to Registry</span>
            </button>
          </form>
        </div>

        {/* RIGHT: Vessels Directory list (Cols 8) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Search bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search vessels by name, IMO #, or associated client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
              />
            </div>
            
            <div className="text-[10px] text-slate-400 font-mono hidden sm:block">
              Listing {filteredVessels.length} of {vessels.length} vessels
            </div>
          </div>

          {filteredVessels.length === 0 ? (
            <div className="p-12 text-center bg-white border border-dashed border-slate-250 rounded-2xl text-xs text-slate-400">
              <Compass className="w-8 h-8 mx-auto text-slate-300 mb-2 font-light animate-spin-slow" />
              No matching vessels found in master fleet registry.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVessels.map((v) => {
                const isEditing = editingId === v.id;

                return (
                  <div key={v.id} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                    {isEditing ? (
                      /* Editing Form Block */
                      <div className="p-4 space-y-3 bg-slate-50/80">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans mb-1">
                          Edit Vessel particulars: {v.name}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div className="md:col-span-2">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Vessel Name</label>
                            <input
                              type="text"
                              required
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-semibold text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">IMO Number</label>
                            <input
                              type="text"
                              required
                              value={editImo}
                              onChange={(e) => setEditImo(e.target.value)}
                              className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Fleet Status</label>
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value as 'Active' | 'Inactive')}
                              className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
                            >
                              <option value="Active">Active</option>
                              <option value="Inactive">Dry Dock</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Bind to Customer account</label>
                          <select
                            required
                            value={editClientName}
                            onChange={(e) => setEditClientName(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-semibold"
                          >
                            <option value="">-- Select Registered customer --</option>
                            {customers.map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name} ({c.code})
                              </option>
                            ))}
                          </select>
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
                            onClick={() => saveEdit(v.id)}
                            className="px-3 py-1 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md cursor-pointer transition-all uppercase"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display Visual Block */
                      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                        <div className="space-y-2 flex-1 min-w-0">
                          {/* Title and Badge row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="p-1 rounded bg-slate-50 text-indigo-700 border border-slate-150">
                              <Anchor className="w-3.5 h-3.5" />
                            </span>
                            <span className="font-extrabold text-xs text-slate-800 leading-none">{v.name}</span>
                            <span className="font-mono text-[9px] font-semibold bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 text-indigo-700">
                              {v.imo}
                            </span>
                            <span className={`text-[8px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${
                              v.status === 'Active' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {v.status === 'Active' ? 'In Service' : 'Dry Dock / Suspended'}
                            </span>
                          </div>

                          {/* Client Binding description */}
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Partner Client:</span>
                            <span className="font-bold text-slate-700">{v.clientName}</span>
                          </div>

                          <div className="text-[9px] text-slate-400">
                            Registered: {new Date(v.dateCreated).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Actions block - Active only for ADMIN */}
                        <div className="flex gap-1.5 items-center justify-end sm:shrink-0 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-100">
                          <button
                            onClick={() => startEditing(v)}
                            disabled={!isAdmin}
                            className={`p-1.5 rounded-lg border transition-all ${
                              isAdmin
                                ? 'bg-white hover:bg-slate-50 border-slate-250 text-slate-600 hover:border-slate-350 cursor-pointer shadow-xs active:scale-95'
                                : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                            }`}
                            title={isAdmin ? "Edit vessel IMO & partner binding" : "Requires ADMIN permissions to modify"}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(v.id, v.name)}
                            disabled={!isAdmin}
                            className={`p-1.5 rounded-lg border transition-all ${
                              isAdmin
                                ? 'bg-rose-50 hover:bg-rose-100 border-rose-250 text-rose-600 hover:border-rose-350 cursor-pointer shadow-xs active:scale-95'
                                : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                            }`}
                            title={isAdmin ? "Permanently remove vessel registration" : "Requires ADMIN permissions to delete"}
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
