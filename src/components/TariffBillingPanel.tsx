/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StandardTariff, ClientTariffOverride, Customer } from '../types';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Percent, 
  DollarSign, 
  CheckCircle2, 
  Calculator, 
  AlertCircle, 
  FileText, 
  X, 
  Users,
  Settings,
  ShieldCheck,
  Tag
} from 'lucide-react';

interface TariffBillingPanelProps {
  customers: Customer[];
  tariffs: StandardTariff[];
  overrides: ClientTariffOverride[];
  onAddTariff: (newTariff: StandardTariff) => void;
  onUpdateTariff: (updatedTariff: StandardTariff) => void;
  onDeleteTariff: (id: string) => void;
  onAddOverride: (newOverride: ClientTariffOverride) => void;
  onUpdateOverride: (updatedOverride: ClientTariffOverride) => void;
  onDeleteOverride: (id: string) => void;
}

export default function TariffBillingPanel({
  customers,
  tariffs,
  overrides,
  onAddTariff,
  onUpdateTariff,
  onDeleteTariff,
  onAddOverride,
  onUpdateOverride,
  onDeleteOverride
}: TariffBillingPanelProps) {
  // Navigation Tabs
  const [activeSubTab, setActiveSubTab] = useState<'standard' | 'client'>('standard');

  // Customer selection in client tab
  const [selectedClientName, setSelectedClientName] = useState<string>(customers[0]?.name || '');

  // Dynamic notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // STANDARD TARIFF FORM STATES (ADD NEW / EDIT)
  const [isTariffModalOpen, setIsTariffModalOpen] = useState(false);
  const [editingTariffId, setEditingTariffId] = useState<string | null>(null);
  const [tariffName, setTariffName] = useState('');
  const [tariffAmount, setTariffAmount] = useState<number>(100);
  const [tariffTaxRate, setTariffTaxRate] = useState<number>(10);
  const [tariffDesc, setTariffDesc] = useState('');

  // CLIENT OVERRIDE FORM STATES
  const [overrideChargeName, setOverrideChargeName] = useState<string>('');
  const [overrideAmount, setOverrideAmount] = useState<number>(100);
  const [overrideTaxRate, setOverrideTaxRate] = useState<number>(10);
  const [isEditingOverride, setIsEditingOverride] = useState<string | null>(null);

  // Trigger modal for creating standard tariff
  const handleOpenCreateTariff = () => {
    setEditingTariffId(null);
    setTariffName('');
    setTariffAmount(100);
    setTariffTaxRate(10);
    setTariffDesc('');
    setIsTariffModalOpen(true);
  };

  // Trigger modal for editing standard tariff
  const handleOpenEditTariff = (t: StandardTariff) => {
    setEditingTariffId(t.id);
    setTariffName(t.name);
    setTariffAmount(t.defaultAmount);
    setTariffTaxRate(t.taxRate);
    setTariffDesc(t.description);
    setIsTariffModalOpen(true);
  };

  // Submit standard tariff action
  const handleTariffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tariffName.trim()) return;

    if (editingTariffId) {
      // Edit
      onUpdateTariff({
        id: editingTariffId,
        name: tariffName.trim(),
        defaultAmount: Number(tariffAmount),
        taxRate: Number(tariffTaxRate),
        description: tariffDesc.trim() || `${tariffName} standard logistics tariff.`
      });
      showToast(`Tariff category "${tariffName}" successfully updated.`);
    } else {
      // Add dynamic category (ADD IN)
      const isDuplicate = tariffs.some(t => t.name.toLowerCase() === tariffName.trim().toLowerCase());
      if (isDuplicate) {
        alert(`A tariff called "${tariffName}" already exists. Please choose another name or modify the existing category.`);
        return;
      }

      onAddTariff({
        id: `tariff-${Date.now()}`,
        name: tariffName.trim(),
        defaultAmount: Number(tariffAmount),
        taxRate: Number(tariffTaxRate),
        description: tariffDesc.trim() || `${tariffName} standard logistics tariff.`
      });
      showToast(`New dynamic tariff code "${tariffName}" added to supply chain network.`);
    }

    setIsTariffModalOpen(false);
  };

  // Safe standard tariff delete
  const handleTariffDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to decommission standard pricing tariff "${name}"?\nExisting associated custom overrides for this tariff will be deleted.`)) {
      onDeleteTariff(id);
      showToast(`Decommissioned standard tariff "${name}".`);
    }
  };

  // Submit client tariff override details
  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientName || !overrideChargeName) {
      alert("Please select a customer and target charge category first.");
      return;
    }

    const matchedOverride = overrides.find(
      o => o.clientName === selectedClientName && o.chargeName === overrideChargeName
    );

    if (matchedOverride) {
      onUpdateOverride({
        id: matchedOverride.id,
        clientName: selectedClientName,
        chargeName: overrideChargeName,
        customAmount: Number(overrideAmount),
        customTaxRate: Number(overrideTaxRate)
      });
      showToast(`Custom client agreement modified for ${selectedClientName}.`);
    } else {
      onAddOverride({
        id: `override-${Date.now()}`,
        clientName: selectedClientName,
        chargeName: overrideChargeName,
        customAmount: Number(overrideAmount),
        customTaxRate: Number(overrideTaxRate)
      });
      showToast(`Custom client tariff registered for ${selectedClientName}.`);
    }

    // Reset Override input
    setOverrideChargeName('');
    setIsEditingOverride(null);
  };

  // Quick edit trigger in client table
  const startQuickOverrideEdit = (o: ClientTariffOverride) => {
    setIsEditingOverride(o.id);
    setOverrideChargeName(o.chargeName);
    setOverrideAmount(o.customAmount);
    setOverrideTaxRate(o.customTaxRate);
  };

  // Get list of standard tariffs that haven't been overridden yet for selected client
  const getAvailableTariffsForOverride = () => {
    return tariffs.filter(
      t => !overrides.some(o => o.clientName === selectedClientName && o.chargeName === t.name)
    );
  };

  // Filter overrides for current selected client
  const clientOverrides = overrides.filter(o => o.clientName === selectedClientName);

  return (
    <div className="space-y-6 text-left" id="tariff-billing-container">
      
      {/* Toast Alert Header */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 border border-indigo-500 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-medium animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 font-bold" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Hero Header Area */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-[10px] font-mono tracking-widest text-indigo-400 uppercase font-bold">
              Logistics Finance Hub
            </span>
            <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
              <ShieldCheck className="w-3 h-3" /> Secure Audit
            </span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight mt-2 flex items-center gap-2">
            <Calculator className="w-5.5 h-5.5 text-indigo-400" />
            Tariffs & Dynamic Billing Surcharges
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl font-sans leading-relaxed">
            Configure logistics system standard and custom customer-specific pricing rates. Change tax rates and add-in custom charge profiles dynamically in real-time.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="bg-slate-850/50 border border-slate-800 rounded-2xl p-3 text-center min-w-[100px]">
            <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wide font-sans">Surcharge Types</span>
            <span className="text-xl font-black font-mono text-indigo-300">{tariffs.length}</span>
          </div>
          <div className="bg-slate-850/50 border border-slate-800 rounded-2xl p-3 text-center min-w-[100px]">
            <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wide font-sans">Arrangements</span>
            <span className="text-xl font-black font-mono text-indigo-300">{overrides.length}</span>
          </div>
        </div>
      </div>

      {/* Main Tab Controls */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveSubTab('standard')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
              activeSubTab === 'standard'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Standard Surcharge Types ({tariffs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('client')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
              activeSubTab === 'client'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Client Tariff Agreements ({overrides.length})
          </button>
        </div>

        {activeSubTab === 'standard' && (
          <button
            type="button"
            onClick={handleOpenCreateTariff}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer text-xs transition-colors shadow-sm shadow-indigo-600/10"
          >
            <Plus className="w-4 h-4" />
            Add Tariff Type
          </button>
        )}
      </div>

      {/* SUB TAB CONTENT: STANDARD TARIFF MANAGMENT */}
      {activeSubTab === 'standard' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tariffs.map((t) => {
              const baseAmount = t.defaultAmount;
              const taxAmount = baseAmount * (t.taxRate / 100);
              const totalWithTax = baseAmount + taxAmount;
              return (
                <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all space-y-4 relative group flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1.5">
                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                          <Tag className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm leading-tight group-hover:text-indigo-700 transition-colors">
                          {t.name} Charge
                        </h4>
                      </div>
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleOpenEditTariff(t)}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 cursor-pointer"
                          title="Edit standard parameters"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTariffDelete(t.id, t.name)}
                          className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 cursor-pointer"
                          title="Decommission rate"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <p className="text-slate-500 text-[11px] font-sans leading-relaxed mt-2.5">
                      {t.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center gap-2">
                    <div>
                      <span className="block text-[8.5px] uppercase font-bold text-slate-400 font-sans tracking-wide">Base Rate</span>
                      <span className="text-xs font-mono font-bold text-slate-700">${baseAmount.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="block text-[8.5px] uppercase font-bold text-slate-400 font-sans tracking-wide">Tax Surcharge</span>
                      <span className="text-xs font-mono font-bold text-indigo-600 flex items-center justify-center gap-0.5">
                        <Percent className="w-3 h-3 text-indigo-400 shrink-0" />
                        {t.taxRate}%
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[8.5px] uppercase font-bold text-slate-400 font-sans tracking-wide">Standard Total</span>
                      <span className="text-xs font-mono font-black text-emerald-600">${totalWithTax.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {tariffs.length === 0 && (
            <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-3xl text-xs text-slate-500 space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="font-bold">No Tariffs Defined</h4>
              <p>Add logistics billable categories dynamically using the configuration controls.</p>
            </div>
          )}
        </div>
      )}

      {/* SUB TAB CONTENT: CLIENT OVERRIDES AGREEMENTS */}
      {activeSubTab === 'client' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Manage client Agreement override form */}
          <div className="lg:col-span-1 bg-white border border-slate-205 rounded-2xl p-4 shadow-sm h-fit space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-indigo-600" />
                Configure Client Override Surcharges
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Define client-specific tariff price overrides that pre-populate dynamically based on the shipment's customer index.
              </p>
            </div>

            <form onSubmit={handleOverrideSubmit} className="space-y-3.5 text-xs text-left">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Select Client Account</label>
                <select
                  value={selectedClientName}
                  onChange={(e) => {
                    setSelectedClientName(e.target.value);
                    setOverrideChargeName('');
                    setIsEditingOverride(null);
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-205 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-505 uppercase mb-1 font-mono">Logistics Surcharge Type</label>
                {isEditingOverride ? (
                  <div className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700">
                    {overrideChargeName} (Editing Override)
                  </div>
                ) : (
                  <select
                    value={overrideChargeName}
                    onChange={(e) => {
                      const name = e.target.value;
                      setOverrideChargeName(name);
                      const std = tariffs.find(t => t.name === name);
                      if (std) {
                        setOverrideAmount(std.defaultAmount);
                        setOverrideTaxRate(std.taxRate);
                      }
                    }}
                    required
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-205 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  >
                    <option value="">-- Choose standard charge category --</option>
                    {getAvailableTariffsForOverride().map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} Charge (Std: ${t.defaultAmount.toFixed(2)})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {overrideChargeName && (
                <div className="grid grid-cols-2 gap-2.5 animate-in slide-in-from-top-2 duration-200">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-505 uppercase mb-1 font-mono">Client Custom Rate ($)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      step="0.01"
                      value={overrideAmount}
                      onChange={(e) => setOverrideAmount(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-205 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-indigo-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-505 uppercase mb-1 font-mono">Client Custom Tax (%)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      step="0.1"
                      value={overrideTaxRate}
                      onChange={(e) => setOverrideTaxRate(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-205 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-indigo-700"
                    />
                  </div>
                </div>
              )}

              {overrideChargeName && (
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl space-y-1.5">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-500 text-[10px] font-sans">Standard Rate Total:</span>
                    <span className="text-slate-600 font-mono text-[11px]">
                      {(() => {
                        const std = tariffs.find(t => t.name === overrideChargeName);
                        if (std) return `$${(std.defaultAmount + (std.defaultAmount * std.taxRate/100)).toFixed(2)}`;
                        return "$0.00";
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-indigo-700 text-[10px] font-sans">Negotiated Overridden Rate:</span>
                    <span className="text-emerald-600 font-mono text-[11.5px]">
                      ${(Number(overrideAmount) + (Number(overrideAmount) * Number(overrideTaxRate)/100)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {isEditingOverride && (
                  <button
                    type="button"
                    onClick={() => {
                      setOverrideChargeName('');
                      setIsEditingOverride(null);
                    }}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold font-sans cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!overrideChargeName}
                  className="flex-1 py-2 bg-indigo-650 hover:bg-indigo-750 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-lg text-xs font-bold font-sans cursor-pointer select-none transition-colors"
                >
                  {isEditingOverride ? 'Update Override' : 'Bind Agreement'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Columns: Active Agreements audit matrix table */}
          <div className="lg:col-span-2 bg-white border border-slate-205 rounded-2xl p-4 shadow-sm space-y-3.5 h-fit">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-emerald-500" />
                  Overridden Pricing Matrix for {selectedClientName || "Client"}
                </h3>
                <p className="text-[11px] text-slate-500 font-sans">Handshake pricing overrides configured for custom shipment accounts.</p>
              </div>
              <span className="px-2.5 py-0.5 bg-slate-900 text-white rounded-full font-mono text-[9.5px] font-bold">
                {clientOverrides.length} active custom rules
              </span>
            </div>

            {clientOverrides.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-4 text-xs text-slate-400 italic">
                No active custom overrides have been registered for {selectedClientName || 'this customer'}.
                Standard tariff rates will be automatically applied to their shipment audit sheets.
              </div>
            ) : (
              <div className="border border-slate-150 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-500 font-mono text-[9px] uppercase border-b border-slate-200">
                      <th className="py-2.5 px-3">Service Category</th>
                      <th className="py-2.5 px-2">Negotiated Base</th>
                      <th className="py-2.5 px-2 text-center font-sans tracking-wide">Client Tax</th>
                      <th className="py-2.5 px-2 text-right">Negotiated Total</th>
                      <th className="py-2.5 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {clientOverrides.map((o) => {
                      const stdTar = tariffs.find(t => t.name === o.chargeName);
                      const customTotal = o.customAmount + (o.customAmount * (o.customTaxRate/100));
                      const isSaferRateThanStd = stdTar ? customTotal < (stdTar.defaultAmount + (stdTar.defaultAmount * stdTar.taxRate/100)) : false;

                      return (
                        <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-700">
                            {o.chargeName} Surcharge
                            {stdTar && (
                              <span className="block text-[9.5px] text-slate-400 font-normal mt-0.5 font-mono">
                                Standard Base: ${stdTar.defaultAmount.toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-2 font-mono font-bold text-indigo-700">
                            ${o.customAmount.toFixed(2)}
                          </td>
                          <td className="py-3 px-2 text-center text-slate-600 font-mono">
                            {o.customTaxRate}%
                          </td>
                          <td className="py-3 px-2 text-right font-mono text-emerald-600 font-black">
                            ${customTotal.toFixed(2)}
                            {isSaferRateThanStd && (
                              <span className="block text-[8.5px] font-bold text-indigo-650 tracking-tight font-sans mt-0.5">
                                discount rate
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => startQuickOverrideEdit(o)}
                                className="p-1 rounded bg-slate-100 hover:bg-slate-200 hover:text-indigo-600 text-slate-500 cursor-pointer transition-colors"
                                title="Edit agreement details"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Remove custom client agreement for "${o.chargeName}" tariff?`)) {
                                    onDeleteOverride(o.id);
                                    showToast("Negociated pricing rule dismantled.");
                                  }
                                }}
                                className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-705 cursor-pointer transition-colors"
                                title="Dismantle rule"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STANDARD TARIFF CREATER/EDITOR LIGHTBOX MODAL */}
      {isTariffModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-100 shadow-xl p-6 space-y-4 relative text-left">
            <button 
              onClick={() => setIsTariffModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-450 hover:text-slate-600 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-mono font-bold text-indigo-650 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-full select-none">
                System Billing Manifest
              </span>
              <h3 className="text-base font-bold text-slate-800 mt-2 flex items-center gap-1.5 leading-none">
                <Tag className="w-5 h-5 text-indigo-500" />
                {editingTariffId ? 'Configure Logistics Tariff parameters' : 'Register New Surcharge Category'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-sans">Define supply chain billing ledger standard values and tax parameters.</p>
            </div>

            <form onSubmit={handleTariffSubmit} className="space-y-4 text-xs font-sans text-left">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Surcharge Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quay Crane handling, Port Demurrage."
                  value={tariffName}
                  onChange={(e) => setTariffName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-lg text-slate-705 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Default Base Fee ($)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    value={tariffAmount}
                    onChange={(e) => setTariffAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-205 rounded-lg text-slate-705 text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Standard Tax Surcharge (%)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    step="0.1"
                    value={tariffTaxRate}
                    onChange={(e) => setTariffTaxRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-205 rounded-lg text-slate-705 text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Tariff Description & Intent</label>
                <textarea
                  placeholder="Official billing reference guidelines for cargo handlers."
                  value={tariffDesc}
                  onChange={(e) => setTariffDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-205 rounded-lg text-slate-705 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTariffModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Discard Changes
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  {editingTariffId ? 'Save Surcharge Parameters' : 'Deploy Surcharge category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
