/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shipment, Warehouse, User } from '../types';
import { 
  Building, 
  Plus, 
  MapPin, 
  Scale, 
  TrendingUp, 
  AlertTriangle, 
  ArrowRightLeft, 
  Package, 
  Search,
  CheckCircle2,
  Boxes,
  Edit2,
  Trash2,
  X,
  Settings
} from 'lucide-react';

interface WarehousePanelProps {
  warehouses: Warehouse[];
  shipments: Shipment[];
  currentUser: User;
  onCreateWarehouse: (newWarehouse: Warehouse) => void;
  onUpdateWarehouse: (updatedWarehouse: Warehouse) => void;
  onDeleteWarehouse: (warehouseId: string) => void;
  onTransferWarehouse: (shipmentId: string, targetWarehouseId: string | null) => void;
}

export default function WarehousePanel({
  warehouses,
  shipments,
  currentUser,
  onCreateWarehouse,
  onUpdateWarehouse,
  onDeleteWarehouse,
  onTransferWarehouse
}: WarehousePanelProps) {
  // UI states
  const [selectedWhId, setSelectedWhId] = useState<string>(warehouses[0]?.id || '');
  const [searchStockQuery, setSearchStockQuery] = useState('');
  
  // Registration Form states
  const [whName, setWhName] = useState('');
  const [whCode, setWhCode] = useState('');
  const [whCity, setWhCity] = useState('');
  const [whCountry, setWhCountry] = useState('');
  const [whCapacity, setWhCapacity] = useState<number>(30000);
  const [whAddress, setWhAddress] = useState('');
  const [formSuccessMessage, setFormSuccessMessage] = useState('');

  // Edit and Delete Modal/Confirm states
  const [editingWhId, setEditingWhId] = useState<string | null>(null);
  const [editWhName, setEditWhName] = useState('');
  const [editWhCode, setEditWhCode] = useState('');
  const [editWhCity, setEditWhCity] = useState('');
  const [editWhCountry, setEditWhCountry] = useState('');
  const [editWhCapacity, setEditWhCapacity] = useState<number>(30000);
  const [editWhAddress, setEditWhAddress] = useState('');
  
  // Custom Alert and Confirmation Modal States
  const [deleteErrorWh, setDeleteErrorWh] = useState<{ code: string; count: number } | null>(null);
  const [deleteConfirmWh, setDeleteConfirmWh] = useState<{ id: string; code: string } | null>(null);

  // Start editing a warehouse populate fields
  const handleStartEdit = (wh: Warehouse, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent card selection trigger
    setEditingWhId(wh.id);
    setEditWhName(wh.name);
    setEditWhCode(wh.code);
    setEditWhCity(wh.city);
    setEditWhCountry(wh.country);
    setEditWhCapacity(wh.capacityKg);
    setEditWhAddress(wh.address);
  };

  // Submit edit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWhId) return;

    onUpdateWarehouse({
      id: editingWhId,
      name: editWhName,
      code: editWhCode.toUpperCase(),
      city: editWhCity,
      country: editWhCountry,
      capacityKg: editWhCapacity,
      address: editWhAddress
    });

    setEditingWhId(null);
  };

  // Safe delete handler
  const handleDeleteTrigger = (wh: Warehouse, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent card selection trigger
    const stats = getWarehouseStats(wh.id);
    if (stats.count > 0) {
      setDeleteErrorWh({ code: wh.code, count: stats.count });
      return;
    }
    setDeleteConfirmWh({ id: wh.id, code: wh.code });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmWh) return;
    onDeleteWarehouse(deleteConfirmWh.id);
    
    // Select another warehouse if we deleted the current selection
    if (selectedWhId === deleteConfirmWh.id) {
      const remainingWhs = warehouses.filter(w => w.id !== deleteConfirmWh.id);
      setSelectedWhId(remainingWhs[0]?.id || '');
    }
    setDeleteConfirmWh(null);
  };

  // Find shipments assigned to a specific warehouse
  const getWarehouseShipments = (warehouseId: string) => {
    return shipments.filter((s) => s.currentWarehouseId === warehouseId);
  };

  // Calculate stats for a specific warehouse
  const getWarehouseStats = (warehouseId: string) => {
    const whShipments = getWarehouseShipments(warehouseId);
    const totalWeight = whShipments.reduce((sum, s) => sum + s.weight, 0);
    return {
      count: whShipments.length,
      weight: totalWeight
    };
  };

  // Handle warehouse registration
  const handleRegisterWhSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whName || !whCode || !whCity || !whCountry || !whAddress || whCapacity <= 0) return;

    const newWh: Warehouse = {
      id: `WH-${whCode.toUpperCase()}-${Date.now().toString().slice(-4)}`,
      name: whName,
      code: whCode.toUpperCase(),
      city: whCity,
      country: whCountry,
      capacityKg: whCapacity,
      address: whAddress
    };

    onCreateWarehouse(newWh);
    setSelectedWhId(newWh.id);
    
    // Clear Form
    setWhName('');
    setWhCode('');
    setWhCity('');
    setWhCountry('');
    setWhCapacity(30000);
    setWhAddress('');

    // Success notification blink
    setFormSuccessMessage(`Warehouse ${newWh.code} registered!`);
    setTimeout(() => {
      setFormSuccessMessage('');
    }, 4000);
  };

  // Selected Warehouse Info
  const activeWh = warehouses.find((w) => w.id === selectedWhId) || warehouses[0] || null;
  const activeWhShipments = activeWh ? getWarehouseShipments(activeWh.id) : [];
  const activeWhStats = activeWh ? getWarehouseStats(activeWh.id) : { count: 0, weight: 0 };
  
  // Filter warehouse stockpiled items by query (AWB or PO)
  const filteredStock = activeWhShipments.filter((s) => {
    const q = searchStockQuery.trim().toLowerCase();
    return s.awb.toLowerCase().includes(q) || s.poNumber.toLowerCase().includes(q);
  });

  return (
    <div id="warehouse-panel" className="space-y-6">
      
      {/* Upper Info Header Line */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 text-white rounded-2xl p-5 border border-slate-800">
        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-widest text-indigo-400 font-bold uppercase">GLOBAL WAREHOUSE INFRASTRUCTURE</span>
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-400" />
            Supply Chain Hub & Depot Locations
          </h2>
          <p className="text-xs text-slate-400">
            Monitor real-time storage load capacity, track high-density stockpiles, and allocate inventory across maritime docks.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-right shrink-0">
          <div className="bg-slate-800/40 px-3 py-2 rounded-xl border border-slate-700/30">
            <span className="block text-[9px] text-slate-400 uppercase font-bold">Depots Registered</span>
            <span className="font-mono text-base font-bold text-slate-100">{warehouses.length} Stations</span>
          </div>
          <div className="bg-slate-800/40 px-3 py-2 rounded-xl border border-slate-700/30">
            <span className="block text-[9px] text-slate-400 uppercase font-bold">Total Stored Cargo</span>
            <span className="font-mono text-base font-bold text-slate-100">
              {shipments.filter(s => s.currentWarehouseId).length} Units
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Warehouse Capacity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {warehouses.map((wh) => {
          const stats = getWarehouseStats(wh.id);
          const percentLoad = (stats.weight / wh.capacityKg) * 100;
          const isSelected = wh.id === selectedWhId;
          
          let alertColor = 'bg-emerald-500';
          let borderAlertColor = 'border-slate-200';
          let bgAlertColor = 'bg-white';

          if (percentLoad >= 85) {
            alertColor = 'bg-rose-500';
            borderAlertColor = isSelected ? 'border-rose-505 ring-2 ring-rose-500/10' : 'border-rose-200';
            bgAlertColor = 'bg-rose-50/15';
          } else if (percentLoad >= 50) {
            alertColor = 'bg-amber-500';
            borderAlertColor = isSelected ? 'border-amber-550 ring-2 ring-amber-500/10' : 'border-amber-150';
            bgAlertColor = 'bg-amber-50/10';
          } else {
            borderAlertColor = isSelected ? 'border-indigo-505 ring-2 ring-indigo-500/10 shadow-sm' : 'border-slate-200';
          }

          return (
            <div
              key={wh.id}
              onClick={() => setSelectedWhId(wh.id)}
              className={`p-5 rounded-2xl border cursor-pointer hover:border-slate-350 transition-all text-left flex flex-col justify-between ${borderAlertColor} ${bgAlertColor} ${
                isSelected ? 'bg-indigo-50/10' : ''
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-1.5">
                  <div>
                    <h3 className="font-bold text-slate-850 text-sm leading-tight">{wh.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="inline-block text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-205">
                        ID: {wh.code}
                      </span>
                      {currentUser.securityLevel === 'ADMIN' && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            title="Edit Hub Details"
                            onClick={(e) => handleStartEdit(wh, e)}
                            className="p-1 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 transition-all cursor-pointer border border-indigo-150"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            title="Decommission Depot"
                            onClick={(e) => handleDeleteTrigger(wh, e)}
                            className="p-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-all cursor-pointer border border-rose-150"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`p-2.5 rounded-xl ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'} shadow-sm shadow-indigo-500/5 shrink-0`}>
                    <Building className="w-5 h-5" />
                  </span>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5 mt-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{wh.address}, <strong className="text-slate-750 font-semibold">{wh.city}</strong></span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-150/75 space-y-3">
                <div className="flex justify-between text-xs text-slate-500 font-mono">
                  <span>Capacity Load:</span>
                  <span className="font-bold text-slate-800">
                    {stats.weight.toLocaleString()} / {wh.capacityKg.toLocaleString()} kg
                  </span>
                </div>

                {/* Progress load slider */}
                <div className="w-full bg-slate-150 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${alertColor}`} 
                    style={{ width: `${Math.min(percentLoad, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    percentLoad >= 80 ? 'bg-rose-50 text-rose-700' : 
                    percentLoad >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {percentLoad.toFixed(1)}% Stored
                  </span>
                  <span className="text-slate-400 font-semibold flex items-center gap-1">
                    <Package className="w-3.5 h-3.5" />
                    {stats.count} Active AWBs
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Inventory & Create Station Hub Split Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANEL: Selected Storage Hub Inventory Stock listing (Cols 7) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
          {activeWh ? (
            <>
              {/* Warehouse Inventory Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-150 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">Depot Stockpile Inventory</span>
                  <h3 className="text-base font-bold text-slate-850 flex items-center gap-1.5 mt-0.5">
                    <Boxes className="w-5 h-5 text-indigo-500" />
                    {activeWh.name} <span className="text-slate-400 font-mono text-xs">({activeWh.code})</span>
                  </h3>
                </div>

                <div className="relative max-w-[200px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchStockQuery}
                    onChange={(e) => setSearchStockQuery(e.target.value)}
                    placeholder="Search inventory..."
                    className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs w-full focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Stock Items table */}
              {filteredStock.length === 0 ? (
                <div className="py-12 text-center text-slate-400 italic text-xs border border-dashed border-slate-150 rounded-xl">
                  {activeWhShipments.length === 0 
                    ? "This warehouse has no active stock. Transfer inventory from the tracker or dispatch list." 
                    : "No stock matches your search filters."}
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {filteredStock.map((s) => (
                    <div 
                      key={s.id} 
                      className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl hover:border-slate-350 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-900 tracking-tight">{s.awb}</span>
                          <span className="text-[9.5px] bg-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-600">PO: {s.poNumber}</span>
                          <span className="text-[9px] bg-amber-50 border border-amber-200 text-amber-800 font-bold px-1.5 py-0.5 rounded font-mono uppercase leading-none">{s.shipmentMode || 'A/F'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                          <div>
                            <span className="text-[9px] uppercase text-slate-400">Vessel:</span> {s.vesselName}
                          </div>
                          <div>
                            <span className="text-[9px] uppercase text-slate-400">Status:</span> <strong>{s.status}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 border-t sm:border-t-0 border-slate-150 pt-2.5 sm:pt-0">
                        {/* Weight info */}
                        <div className="text-right shrink-0">
                          <span className="block text-[8px] uppercase text-slate-400 font-bold font-mono">Gross Weight</span>
                          <span className="font-mono font-bold text-slate-800 text-xs">{s.weight.toLocaleString()} kg</span>
                        </div>

                        {/* Direct Stock Reallocation Transfer options */}
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[8px] uppercase font-bold text-slate-400 font-mono flex items-center gap-0.5">
                            <ArrowRightLeft className="w-3 h-3 text-indigo-500" />
                            Transfer Depot
                          </span>
                          <select
                            value={s.currentWarehouseId || ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : e.target.value;
                              onTransferWarehouse(s.id, value);
                            }}
                            className="bg-white border border-slate-200 py-1 px-2.5 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/15"
                          >
                            <option value="">-- Release Stored Cargo --</option>
                            {warehouses.map((wh) => (
                              <option key={wh.id} disabled={wh.id === activeWh.id} value={wh.id}>
                                {wh.name} ({wh.code})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-slate-400">No active warehouse selected. Click on a card above.</div>
          )}
        </div>

        {/* RIGHT PANEL: Register New Logistics Depot Warehouse (Cols 5) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="border-b border-slate-150 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide font-mono">System Expansion</span>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <Plus className="w-4.5 h-4.5 text-indigo-650" />
                Register Cargo Warehouse
              </h3>
            </div>
            <Building className="w-5 h-5 text-slate-400" />
          </div>

          <form onSubmit={handleRegisterWhSubmit} className="space-y-4 text-xs">
            {formSuccessMessage && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{formSuccessMessage}</span>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Warehouse Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tokyo Haneda Hub"
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 text-xs focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">CODE / ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HND-WH06"
                  value={whCode}
                  onChange={(e) => setWhCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 text-xs font-mono focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">City Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tokyo"
                  value={whCity}
                  onChange={(e) => setWhCity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 text-xs focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Country Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Japan"
                  value={whCountry}
                  onChange={(e) => setWhCountry(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 text-xs focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Max Capacity Weight (kg)</label>
              <input
                type="number"
                required
                min="1000"
                step="1000"
                placeholder="e.g. 45000"
                value={whCapacity}
                onChange={(e) => setWhCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-705 text-xs font-mono focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono font-medium">Physical Street Address</label>
              <textarea
                required
                rows={2}
                placeholder="e.g. Tokyo Port Area Cargo Terminal, Section 4"
                value={whAddress}
                onChange={(e) => setWhAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 text-xs focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500 outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer text-xs transition-colors shadow-sm shadow-indigo-600/10 hover:shadow-indigo-600/20"
            >
              Initialize Hub & Register Location
            </button>
          </form>
        </div>
      </div>

      {/* Edit Warehouse Modal */}
      {editingWhId && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-100 shadow-xl p-6 space-y-4 relative text-left">
            <button 
              onClick={() => setEditingWhId(null)}
              className="absolute top-4 right-4 p-1 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-450 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-mono font-bold text-indigo-650 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-full select-none">
                Hub Parameters Admin Config
              </span>
              <h3 className="text-base font-bold text-slate-800 mt-2 flex items-center gap-1.5 leading-none">
                <Settings className="w-5 h-5 text-indigo-500" />
                Configure Depot Hub Logistics
              </h3>
              <p className="text-xs text-slate-505 mt-1 font-sans">Modify storage depot locations, processing bounds, and parameters.</p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-505 uppercase mb-1 font-mono">Warehouse Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. London Terminal A"
                    value={editWhName}
                    onChange={(e) => setEditWhName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-205 rounded-lg text-slate-705 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1 font-mono">CODE / ID</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="e.g. LND-WH01"
                    value={editWhCode}
                    onChange={(e) => setEditWhCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-205 rounded-lg text-slate-705 text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-505 uppercase mb-1 font-mono">City Location</label>
                  <input
                    type="text"
                    required
                    value={editWhCity}
                    onChange={(e) => setEditWhCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-205 rounded-lg text-slate-705 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-550 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1 font-mono">Country Location</label>
                  <input
                    type="text"
                    required
                    value={editWhCountry}
                    onChange={(e) => setEditWhCountry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-205 rounded-lg text-slate-705 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-550 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1 font-mono">Max Capacity Weight (kg)</label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={editWhCapacity}
                    onChange={(e) => setEditWhCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-205 rounded-lg text-slate-705 text-xs font-mono focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1 font-mono">Physical Street Address</label>
                  <textarea
                    required
                    rows={2}
                    value={editWhAddress}
                    onChange={(e) => setEditWhAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-205 rounded-lg text-slate-705 text-xs focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500 outline-none resize-none font-sans"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingWhId(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Discard Changes
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Save Hub Definition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Error Modal - Warehouse has Stockpile */}
      {deleteErrorWh && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-100 shadow-xl p-5 space-y-4 relative text-left">
            <button 
              onClick={() => setDeleteErrorWh(null)}
              className="absolute top-4 right-4 p-1 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-650 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-rose-55 border border-rose-100 rounded-full text-rose-600">
                <AlertTriangle className="w-6 h-6 text-rose-550" />
              </div>
              <div>
                <h3 className="text-md font-bold text-slate-805">Decommission Blocked</h3>
                <p className="text-xs text-slate-505 mt-1.5 leading-relaxed">
                  Depot Hub <strong className="text-slate-755">{deleteErrorWh.code}</strong> cannot be deleted because it still holds <strong className="text-rose-650">{deleteErrorWh.count} active stockpiled shipments</strong> in physical inventory.
                </p>
                <p className="text-[11px] text-indigo-650 bg-indigo-50 border border-indigo-100 rounded-lg p-2.5 mt-3 leading-normal">
                  💡 <strong>Action Required:</strong> Select this depot, open "Depot Stockpile Inventory", and transfer or release all cargo containers first.
                </p>
              </div>
            </div>

            <button
              onClick={() => setDeleteErrorWh(null)}
              className="w-full py-2 bg-slate-850 hover:bg-slate-900 border border-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmWh && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-100 shadow-xl p-5 space-y-4 relative text-left">
            <button 
              onClick={() => setDeleteConfirmWh(null)}
              className="absolute top-4 right-4 p-1 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-650 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-full text-amber-600">
                <Trash2 className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-md font-bold text-slate-800 font-sans">Decommission Hub Location?</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-sans">
                  Are you absolutely sure you want to decommission logistics depot <strong className="text-slate-800">{deleteConfirmWh.code}</strong>?
                </p>
                <p className="text-[10px] text-red-600 bg-red-50 border border-red-100 rounded-lg p-2 mt-2 font-semibold">
                  ⚠️ WARNING: This will permanently remove this location from the Supply Chain Network index. 
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirmWh(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel Decommission
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Confirm Decommission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
