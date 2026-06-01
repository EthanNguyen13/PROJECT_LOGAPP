/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, X, Building, Anchor, Trash2, Scale, Layers } from 'lucide-react';
import { Shipment, Dimension, Warehouse, Customer, Vessel, ShipmentMode, CargoItem } from '../types';

interface CreateShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (shipment: Shipment) => void;
  warehouses: Warehouse[];
  customers: Customer[];
  vessels: Vessel[];
}

export default function CreateShipmentModal({ isOpen, onClose, onAdd, warehouses, customers, vessels }: CreateShipmentModalProps) {
  const [awb, setAwb] = useState('');
  const [vesselName, setVesselName] = useState('');
  const [clientName, setClientName] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [shipmentMode, setShipmentMode] = useState<ShipmentMode>('A/F');

  // Multi-cargo items state with default initial item
  const [cargoList, setCargoList] = useState<{
    poNumber: string;
    weight: number;
    length: number;
    width: number;
    height: number;
    pieces: number;
    description: string;
  }[]>([
    { poNumber: '', weight: 100, length: 120, width: 80, height: 100, pieces: 1, description: '' }
  ]);

  if (!isOpen) return null;

  const addCargoLine = () => {
    setCargoList([
      ...cargoList,
      { poNumber: '', weight: 100, length: 120, width: 80, height: 100, pieces: 1, description: '' }
    ]);
  };

  const removeCargoLine = (idx: number) => {
    if (cargoList.length === 1) return;
    setCargoList(cargoList.filter((_, i) => i !== idx));
  };

  const updateCargoLine = (idx: number, key: string, value: any) => {
    const updated = [...cargoList];
    updated[idx] = { ...updated[idx], [key]: value };
    setCargoList(updated);
  };

  // Live calculator for modal overview
  const totalWeight = cargoList.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
  const totalPieces = cargoList.reduce((sum, item) => sum + (Number(item.pieces) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!awb.trim() || !vesselName || !origin || !destination || !clientName) {
      alert('Please fill in all required global fields.');
      return;
    }

    // Validate cargo lines
    const invalidCargo = cargoList.some(
      item => !item.poNumber.trim() || !item.description.trim() || Number(item.weight) <= 0 || Number(item.pieces) <= 0
    );
    if (invalidCargo) {
      alert('Please complete all cargo items details with valid PO numbers, descriptions, weight > 0, and pieces > 0.');
      return;
    }

    const selectedWarehouse = warehouses.find(w => w.id === warehouseId);
    const resolvedWarehouseId = warehouseId === '' ? null : warehouseId;

    // Build cargoItems array
    const finalCargoItems: CargoItem[] = cargoList.map((item, idx) => ({
      id: `citem-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
      poNumber: item.poNumber.trim().toUpperCase().startsWith('PO-')
        ? item.poNumber.trim().toUpperCase()
        : `PO-${item.poNumber.trim().toUpperCase()}`,
      weight: Number(item.weight),
      dimensions: {
        length: Number(item.length),
        width: Number(item.width),
        height: Number(item.height)
      },
      pieces: Number(item.pieces),
      description: item.description.trim()
    }));

    // Aggregate values
    const uniquePos = Array.from(new Set(finalCargoItems.map(item => item.poNumber)));
    const poString = uniquePos.join(', ');
    const descString = finalCargoItems.map(item => `${item.pieces} pkg ${item.description}`).join('; ');

    // Find the largest volume item for bounding dimension representative
    let largestItem = finalCargoItems[0];
    let maxVolume = 0;
    finalCargoItems.forEach(item => {
      const vol = item.dimensions.length * item.dimensions.width * item.dimensions.height;
      if (vol > maxVolume) {
        maxVolume = vol;
        largestItem = item;
      }
    });
    const mainDims = largestItem ? largestItem.dimensions : { length: 0, width: 0, height: 0 };

    const initialDescription = resolvedWarehouseId && selectedWarehouse
      ? `Initial shipment docket registered for client: ${clientName}. Total Weight: ${totalWeight} kg (${totalPieces} pkgs). Dims of largest: ${mainDims.length}x${mainDims.width}x${mainDims.height} cm. Housed at Warehouse: ${selectedWarehouse.name} (${selectedWarehouse.code}).`
      : `Initial shipment docket registered for client: ${clientName}. Total Weight: ${totalWeight} kg (${totalPieces} pkgs).`;

    const newShipment: Shipment = {
      id: `shp-${Date.now()}`,
      awb: awb.trim().toUpperCase(),
      poNumber: poString,
      vesselName,
      clientName: clientName.trim(),
      supplierName: supplierName.trim() || undefined,
      cargoDescription: descString,
      weight: totalWeight,
      dimensions: mainDims,
      origin,
      destination,
      status: 'Received',
      consolidationId: null,
      currentWarehouseId: resolvedWarehouseId,
      shipmentMode,
      cargoItems: finalCargoItems,
      movements: [
        {
          id: `mov-${Date.now()}-1`,
          timestamp: new Date().toISOString(),
          location: selectedWarehouse ? selectedWarehouse.name : origin,
          activity: resolvedWarehouseId ? 'Cargo Received & Warehoused' : 'Cargo Received',
          description: initialDescription
        }
      ],
      charges: []
    };

    onAdd(newShipment);

    // Reset fields
    setAwb('');
    setVesselName('');
    setClientName('');
    setSupplierName('');
    setOrigin('');
    setDestination('');
    setWarehouseId('');
    setShipmentMode('A/F');
    setCargoList([{ poNumber: '', weight: 100, length: 120, width: 80, height: 100, pieces: 1, description: '' }]);
    onClose();
  };

  return (
    <div id="create-shipment-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden border border-slate-100 my-8 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Plus className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-md font-extrabold text-slate-800">Register New Cargo Shipment (AWB)</h2>
              <p className="text-[10px] text-slate-400 font-medium">Create a consolidated Air Waybill entry with multiple packages and PO lines.</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form - scrollable to handle multiple items nicely */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Global Shipment Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-1">
                Air Waybill (AWB) # <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AWB-48209381"
                value={awb}
                onChange={(e) => setAwb(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 rounded-lg text-slate-700 font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-1">
                Client / Customer <span className="text-red-500">*</span>
              </label>
              {customers.length === 0 ? (
                <div className="p-2 border border-rose-200 bg-rose-50 rounded-lg text-[11px] text-rose-700 font-semibold">
                  No active customers registered! Go to the "Customers Directory" tab.
                </div>
              ) : (
                <select
                  required
                  value={clientName}
                  onChange={(e) => {
                    setClientName(e.target.value);
                    setVesselName(''); // Reset vessel on client change
                  }}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer font-semibold"
                >
                  <option value="">-- Select Registered Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.name} disabled={c.status !== 'Active'}>
                      {c.name} ({c.code}){c.status !== 'Active' ? ' (Suspended)' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-1">
                Supplier Name
              </label>
              <input
                type="text"
                placeholder="e.g. Asia Pacific Mfg Ltd"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 rounded-lg text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-1">
                Shipment Mode <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={shipmentMode}
                onChange={(e) => setShipmentMode(e.target.value as ShipmentMode)}
                className="w-full px-3 py-2 border border-slate-250 bg-white rounded-lg text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer font-semibold"
              >
                <option value="A/F">A/F (Air Freight)</option>
                <option value="COURIER">COURIER</option>
                <option value="CONSOL">CONSOL</option>
                <option value="LCL">LCL (Less than Container Load)</option>
                <option value="FCL">FCL (Full Container Load)</option>
                <option value="LOCAL">LOCAL</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Anchor className="w-3.5 h-3.5 text-slate-400" /> Connecting Vessel <span className="text-red-500">*</span>
              </label>
              {!clientName ? (
                <div className="p-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-500 font-mono text-[10.5px]">
                  Select customer first...
                </div>
              ) : vessels.filter(v => v.clientName === clientName && v.status === 'Active').length === 0 ? (
                <div className="p-2 border border-rose-200 bg-rose-50 rounded-lg font-semibold text-rose-700 text-[10.5px]">
                  No vessels! Register fleet first.
                </div>
              ) : (
                <select
                  required
                  value={vesselName}
                  onChange={(e) => setVesselName(e.target.value)}
                  className="w-full px-2 py-2 border border-slate-250 bg-white rounded-lg text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer font-semibold"
                >
                  <option value="">-- Select Vessel --</option>
                  {vessels
                    .filter((v) => v.clientName === clientName && v.status === 'Active')
                    .map((v) => (
                      <option key={v.id} value={v.name}>
                        {v.name} ({v.imo})
                      </option>
                    ))}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-1">
                Port of Origin <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Singapore (SIN)"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 rounded-lg text-slate-705 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-1">
                Consignee Destination <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Seattle (SEA)"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 rounded-lg text-slate-705 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* DYNAMIC CARGO ITEMS BREAKDOWN */}
          <div className="border border-indigo-100 rounded-xl bg-indigo-50/10 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span className="font-extrabold text-indigo-950 uppercase tracking-wider text-[11px]">Consigned Packages & PO Breakdown</span>
              </div>
              <button
                type="button"
                onClick={addCargoLine}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1 transition-all cursor-pointer font-bold active:scale-95 text-[10.5px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Package Line</span>
              </button>
            </div>

            {/* Live Counter Alert */}
            <div className="flex items-center gap-4 bg-white/80 border border-indigo-100 p-2.5 rounded-lg text-[11px] text-slate-650">
              <div className="flex items-center gap-1 text-slate-800 font-bold font-mono">
                <Scale className="w-3.5 h-3.5 text-indigo-500" />
                <span>Total Calculated Weight: <span className="text-indigo-600">{totalWeight.toLocaleString()} kg</span></span>
              </div>
              <div className="text-slate-300">|</div>
              <div className="font-semibold text-slate-800">
                Total Packages Count: <span className="text-indigo-600 font-bold font-mono">{totalPieces.toLocaleString()} pcs</span>
              </div>
            </div>

            {/* List of custom lines */}
            <div className="space-y-3 pt-1">
              {cargoList.map((item, idx) => (
                <div key={idx} className="p-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      Line Item #{idx + 1}
                    </span>
                    {cargoList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCargoLine(idx)}
                        className="p-1 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove package row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[9.5px] text-slate-450 font-bold uppercase mb-0.5">PO Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 98402"
                        value={item.poNumber}
                        onChange={(e) => updateCargoLine(idx, 'poNumber', e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400 font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[9.5px] text-slate-450 font-bold uppercase mb-0.5">Pieces *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.pieces}
                        onChange={(e) => updateCargoLine(idx, 'pieces', Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[9.5px] text-slate-450 font-bold uppercase mb-0.5">Package Weight (kg) *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.weight}
                        onChange={(e) => updateCargoLine(idx, 'weight', Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400 font-mono"
                      />
                    </div>
                  </div>

                  {/* Dimensions and Description */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9.5px] text-slate-450 font-bold uppercase mb-1">Dimensions (L × W × H in cm)</label>
                      <div className="grid grid-cols-3 gap-1 px-1 py-0.5 border border-slate-150 rounded-lg bg-slate-50/50">
                        <div className="flex items-center">
                          <span className="text-[9px] text-slate-400 font-mono mr-1">L:</span>
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.length}
                            onChange={(e) => updateCargoLine(idx, 'length', Number(e.target.value))}
                            className="w-full py-0.5 bg-transparent border-none text-center outline-none text-xs font-mono"
                          />
                        </div>
                        <div className="flex items-center border-l border-slate-200">
                          <span className="text-[9px] text-slate-400 font-mono mx-1">W:</span>
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.width}
                            onChange={(e) => updateCargoLine(idx, 'width', Number(e.target.value))}
                            className="w-full py-0.5 bg-transparent border-none text-center outline-none text-xs font-mono"
                          />
                        </div>
                        <div className="flex items-center border-l border-slate-200">
                          <span className="text-[9px] text-slate-400 font-mono mx-1">H:</span>
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.height}
                            onChange={(e) => updateCargoLine(idx, 'height', Number(e.target.value))}
                            className="w-full py-0.5 bg-transparent border-none text-center outline-none text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9.5px] text-slate-450 font-bold uppercase mb-0.5">Cargo Line Description *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Copper pipeline connectors, steel joints"
                        value={item.description}
                        onChange={(e) => updateCargoLine(idx, 'description', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-indigo-500" /> Initial Warehouse Assignment
            </label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-250 rounded-lg bg-white text-slate-705 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer font-semibold"
            >
              <option value="">-- No static warehouse assignment (Loose/In transit) --</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code}) — {wh.city}, {wh.country}
                </option>
              ))}
            </select>
            <span className="text-[9px] text-slate-400 mt-1 block">Ties the cargo straight into the inventory of the selected hub.</span>
          </div>

          {/* Footer controls */}
          <div className="pt-4 flex justify-end gap-2 border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-650 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              Add Shipment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
