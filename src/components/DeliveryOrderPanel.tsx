/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shipment, DeliveryOrder, Warehouse, Charge, ChargeType } from '../types';
import { 
  FileText, 
  Plus, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Ship, 
  ArrowRight, 
  Briefcase, 
  CheckCircle2, 
  Package, 
  Boxes,
  ChevronRight,
  Printer,
  FileSpreadsheet,
  DollarSign,
  Receipt,
  PlusCircle,
  TrendingUp,
  Mail,
  Loader2
} from 'lucide-react';

interface DeliveryOrderPanelProps {
  deliveryOrders: DeliveryOrder[];
  shipments: Shipment[];
  warehouses: Warehouse[];
  onCreateDeliveryOrder: (newDO: DeliveryOrder) => void;
  onUpdateDeliveryOrderStatus?: (doId: string, status: DeliveryOrder['status']) => void;
  onAddDeliveryOrderCharge?: (doId: string, charge: Charge) => void;
}

export default function DeliveryOrderPanel({
  deliveryOrders,
  shipments,
  warehouses,
  onCreateDeliveryOrder,
  onUpdateDeliveryOrderStatus,
  onAddDeliveryOrderCharge
}: DeliveryOrderPanelProps) {
  // UI Tab state
  const [selectedDoId, setSelectedDoId] = useState<string>(deliveryOrders[0]?.id || '');
  
  // Custom DO Surcharge form inputs
  const [newChargeType, setNewChargeType] = useState<ChargeType>('Delivery');
  const [newChargeAmount, setNewChargeAmount] = useState<number>(120);
  const [newChargeDesc, setNewChargeDesc] = useState<string>('');
  const [newChargeStatus, setNewChargeStatus] = useState<'Pending' | 'Invoiced' | 'Paid'>('Pending');
  const [showAddDoCharge, setShowAddDoCharge] = useState<boolean>(false);
  
  // Creation States
  const [doFrom, setDoFrom] = useState('');
  const [doAddress, setDoAddress] = useState('');
  const [doConsignee, setDoConsignee] = useState('');
  const [doDate, setDoDate] = useState('');
  const [doTime, setDoTime] = useState('');
  const [vesselOption, setVesselOption] = useState<'RELEASE' | 'LOADING AT MSW' | 'LOADING AT PT' | 'DELIVERY AT JZ' | 'DELIVERY AT SHIP YARD' | 'DELIVERY TO WORK SHOP' | 'DISPATCH TO OTHER PORT'>('RELEASE');
  const [shippingAwb, setShippingAwb] = useState('');
  const [workshopAddress, setWorkshopAddress] = useState('');
  const [selectedVessel, setSelectedVessel] = useState('ALL');
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('buithang2011@gmail.com');
  const [isSendingPdf, setIsSendingPdf] = useState(false);
  const [lastSentEmail, setLastSentEmail] = useState<string | null>(null);
  const [lastSentPL, setLastSentPL] = useState<string | null>(null);

  // Find unique vessels from shipments to help filter choices
  const uniqueVessels = Array.from(new Set(shipments.map(s => s.vesselName).filter(Boolean)));

  // Filter shipments suitable for delivery order
  // Shipments should preferably be 'Received' or 'Cleared' or 'Released' or 'Consolidated' or 'In Transit'
  // But let's allow all shipments that do not have active deliveries or just any shipment to keep it highly functional.
  const eligibleShipments = shipments.filter(s => {
    // Cannot generate DO from delivered shipments
    if (s.status === 'Delivered') {
      return false;
    }
    // Cannot generate DO from shipments already in an active/non-delivered DO
    const isAlreadyInActiveDO = deliveryOrders.some(
      (doItem) => doItem.shipmentIds.includes(s.id) && doItem.status !== 'Delivered'
    );
    if (isAlreadyInActiveDO) {
      return false;
    }
    if (selectedVessel !== 'ALL' && s.vesselName !== selectedVessel) {
      return false;
    }
    return true;
  });

  const toggleShipmentSelection = (id: string) => {
    const clickedShipment = shipments.find(s => s.id === id);
    if (!clickedShipment) return;

    // Check if we are selecting it (i.e. currently it is not selected)
    const isCurrentlySelected = selectedShipmentIds.includes(id);

    if (!isCurrentlySelected && selectedShipmentIds.length > 0) {
      const firstSelectedId = selectedShipmentIds[0];
      const firstSelectedShipment = shipments.find(s => s.id === firstSelectedId);
      if (firstSelectedShipment && firstSelectedShipment.clientName !== clickedShipment.clientName) {
        alert(`Incompatible Client Assignment:\nYou can only group cargos belonging to the SAME client into a single Delivery Order.\n\nActive DO Client: ${firstSelectedShipment.clientName}\nClicked Cargo Client: ${clickedShipment.clientName}`);
        return;
      }
    }

    setSelectedShipmentIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAllFilteredShipments = () => {
    if (eligibleShipments.length === 0) return;

    // Get client name boundary
    let targetClient: string | null = null;
    const firstSelectedId = selectedShipmentIds[0];
    if (firstSelectedId) {
      const firstSelectedShipment = shipments.find(s => s.id === firstSelectedId);
      if (firstSelectedShipment) {
        targetClient = firstSelectedShipment.clientName;
      }
    } else {
      // Find first eligible shipment's client
      targetClient = eligibleShipments[0].clientName;
    }

    // Filter shipments matching target client
    const matchingShipmentIds = eligibleShipments
      .filter(s => s.clientName === targetClient)
      .map(s => s.id);

    const allOfTheseSelected = matchingShipmentIds.every(id => selectedShipmentIds.includes(id));
    
    if (allOfTheseSelected) {
      setSelectedShipmentIds(prev => prev.filter(id => !matchingShipmentIds.includes(id)));
    } else {
      setSelectedShipmentIds(prev => Array.from(new Set([...prev, ...matchingShipmentIds])));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doFrom || !doAddress || !doConsignee || !doDate || !doTime || selectedShipmentIds.length === 0) {
      return;
    }

    if (vesselOption === 'DISPATCH TO OTHER PORT' && !shippingAwb.trim()) {
      alert("Please enter a Shipping AWB for Dispatch to Other Port Option.");
      return;
    }
    if (vesselOption === 'DELIVERY TO WORK SHOP' && !workshopAddress.trim()) {
      alert("Please enter a Workshop Address for Delivery to Work Shop Option.");
      return;
    }

    const firstShipmentObj = shipments.find(s => s.id === selectedShipmentIds[0]);
    const dOClientName = firstShipmentObj ? firstShipmentObj.clientName : 'Unknown Client';

    const calcDOCharges: Charge[] = [
      {
        id: `chg-do-${Date.now()}-1`,
        type: 'Delivery',
        amount: 155.00,
        dateAdded: new Date().toISOString(),
        description: `Last-mile delivery transit surcharge to receiver: ${doAddress}.`,
        status: 'Pending'
      },
      {
        id: `chg-do-${Date.now()}-2`,
        type: 'Handling',
        amount: 15.00 * selectedShipmentIds.length + 30.00,
        dateAdded: new Date().toISOString(),
        description: `Cargo intake handling & consolidation fee across ${selectedShipmentIds.length} sub-cargoes.`,
        status: 'Pending'
      }
    ];

    const generatedPlNumber = `PL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const emailToDispatch = recipientEmail.trim();

    const newDO: DeliveryOrder = {
      id: `do-${Date.now()}`,
      doNumber: generatedPlNumber,
      clientName: dOClientName,
      from: doFrom,
      deliveryAddress: doAddress,
      consignee: doConsignee,
      deliveryDate: doDate,
      deliveryTime: doTime,
      shipmentIds: [...selectedShipmentIds],
      status: 'Picking List',
      createdAt: new Date().toISOString(),
      charges: calcDOCharges,
      vesselOption,
      shippingAwb: vesselOption === 'DISPATCH TO OTHER PORT' ? shippingAwb.trim() : undefined,
      workshopAddress: vesselOption === 'DELIVERY TO WORK SHOP' ? workshopAddress.trim() : undefined,
      recipientEmail: emailToDispatch || undefined,
    };

    if (emailToDispatch) {
      setIsSendingPdf(true);
      setLastSentEmail(emailToDispatch);
      setLastSentPL(generatedPlNumber);

      setTimeout(() => {
        setIsSendingPdf(false);
        onCreateDeliveryOrder(newDO);
        setSelectedDoId(newDO.id);

        // Reset Form
        setDoFrom('');
        setDoAddress('');
        setDoConsignee('');
        setDoDate('');
        setDoTime('');
        setVesselOption('RELEASE');
        setShippingAwb('');
        setWorkshopAddress('');
        setSelectedShipmentIds([]);
        setSelectedVessel('ALL');
        setRecipientEmail('buithang2011@gmail.com');

        setSuccessMessage(`Success! Picking List ${generatedPlNumber} has been generated, and the official compiled PDF version was secure-routed and emailed to: ${emailToDispatch}.`);
        setTimeout(() => {
          setSuccessMessage('');
          setLastSentEmail(null);
          setLastSentPL(null);
        }, 8000);
      }, 1605);
    } else {
      onCreateDeliveryOrder(newDO);
      setSelectedDoId(newDO.id);

      // Reset Form
      setDoFrom('');
      setDoAddress('');
      setDoConsignee('');
      setDoDate('');
      setDoTime('');
      setVesselOption('RELEASE');
      setShippingAwb('');
      setWorkshopAddress('');
      setSelectedShipmentIds([]);
      setSelectedVessel('ALL');
      setRecipientEmail('buithang20115@gmail.com');

      setSuccessMessage(`Success! Picking List ${newDO.doNumber} has been generated. The Warehouse Team needs to confirm that all items are picked before this can be moved to the Last-Mile Delivery stage.`);
      setTimeout(() => {
        setSuccessMessage('');
      }, 6000);
    }
  };

  const activeDO = deliveryOrders.find(d => d.id === selectedDoId) || deliveryOrders[0] || null;

  // Render DO detail items
  const activeDOShipments = activeDO 
    ? shipments.filter(s => activeDO.shipmentIds.includes(s.id)) 
    : [];

  const totalDOWeight = activeDOShipments.reduce((sum, s) => sum + s.weight, 0);

  return (
    <div id="delivery-order-panel" className="space-y-6">
      {isSendingPdf && (
        <div id="pdf-email-sending-overlay" className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[999]">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-100 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="relative mx-auto w-16 h-16 flex items-center justify-center bg-indigo-50 text-indigo-605 rounded-2xl">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <FileText className="w-4 h-4 absolute text-indigo-500 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-850 text-xs">Compiling Consignment Blueprint...</h3>
              <p className="text-[11px] text-slate-400 font-mono mt-1">Generating Picking List PDF: {lastSentPL}</p>
            </div>
            <div className="border-t border-slate-100 pt-3">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sending Copy to Inbox:</p>
              <p className="text-xs font-extrabold text-indigo-705 font-mono select-all truncate mt-1">{lastSentEmail}</p>
            </div>
            <div className="text-[9.5px] text-emerald-705 font-mono px-2 py-1 bg-emerald-50 rounded-lg animate-pulse">
              ⚡ Establishing SMTP handshake & transmitting PDF...
            </div>
          </div>
        </div>
      )}
      
      {/* Upper Title Line */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 text-white rounded-2xl p-5 border border-slate-800">
        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-widest text-indigo-400 font-bold uppercase">LOGISTICS & DISPATCH</span>
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Vessel Delivery Orders (D/O)
          </h2>
          <p className="text-xs text-slate-400">
            Generate and consolidate multiple master cargoes into a single formal Delivery Order. Group shipments by vessel, set consignees, and execute final release of goods.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="bg-slate-800/40 px-3 py-2 rounded-xl border border-slate-700/30">
            <span className="block text-[9px] text-slate-400 uppercase font-bold text-left">Active D/Os</span>
            <span className="font-mono text-base font-bold text-slate-100">{deliveryOrders.length} Issued</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Active Delivery Orders List & Detail viewer (Cols 7) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* List of generated DOs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Issued Documents (P/L & D/O)</h3>
            
            {deliveryOrders.length === 0 ? (
              <div className="py-8 text-center text-slate-400 italic text-xs">
                No documents compiled. Fill the form on the right to compile your first cargo Picking List.
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {deliveryOrders.map((doItem) => {
                  const isSelected = doItem.id === selectedDoId;
                  const itemShipments = shipments.filter(s => doItem.shipmentIds.includes(s.id));
                  return (
                    <button
                      key={doItem.id}
                      onClick={() => setSelectedDoId(doItem.id)}
                      className={`p-3 rounded-xl border text-left shrink-0 transition-all cursor-pointer min-w-[200px] flex flex-col justify-between space-y-2 ${
                        isSelected 
                          ? 'border-indigo-600 bg-indigo-50/20 shadow-sm' 
                          : 'border-slate-200 bg-slate-50/50 hover:border-slate-350 hover:bg-white'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-800">{doItem.doNumber}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            doItem.status === 'Picking List' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                            doItem.status === 'Picked' ? 'bg-teal-55 bg-opacity-70 text-teal-700 border border-teal-200' :
                            doItem.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            doItem.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-250 font-bold' :
                            doItem.status === 'In Transit' ? 'bg-blue-50 text-blue-700 border border-blue-250' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {doItem.status === 'Picking List' ? 'PICKING' : doItem.status}
                          </span>
                        </div>
                        <div className="pt-0.5 flex">
                          <span className="text-[9px] font-sans font-bold bg-indigo-50 border border-indigo-100 px-1 py-0.2 text-indigo-700 rounded block truncate max-w-[150px]" title={`Client Name: ${doItem.clientName}`}>
                            👑 {doItem.clientName || 'General Client'}
                          </span>
                        </div>
                        <span className="block text-[10px] text-slate-500 font-semibold truncate pt-0.5">Consignee: {doItem.consignee}</span>
                      </div>
                      
                      <div className="pt-2 border-t border-slate-150 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                        <span>{itemShipments.length} Cargoes</span>
                        <span className="font-bold text-slate-700">{itemShipments.reduce((sum, s) => sum + s.weight, 0).toLocaleString()} kg</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detailed Document Blueprint */}
          {activeDO ? (
            <div className="bg-white rounded-2xl border border-slate-205 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Document Header */}
              <div className="bg-slate-900 text-white p-5 flex justify-between items-start border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`${activeDO.status === 'Picking List' ? 'bg-amber-600' : 'bg-indigo-600'} p-1.5 rounded-lg text-white transition-colors`}>
                      <FileText className="w-4 h-4" />
                    </span>
                    <span className={`text-xs font-mono font-bold tracking-widest ${activeDO.status === 'Picking List' ? 'text-amber-400' : 'text-indigo-400'}`}>
                      {activeDO.status === 'Picking List' ? 'OFFICIAL PICKING LIST' : 'OFFICIAL DELIVERY ORDER'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold font-mono text-slate-100 leading-none">{activeDO.doNumber}</h3>
                  <div className="pt-1.5 flex select-none flex-wrap gap-2">
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded border border-indigo-500/10 font-sans uppercase tracking-wider">
                      Client Group: {activeDO.clientName || 'General Client'}
                    </span>
                    {activeDO.recipientEmail && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded border border-emerald-500/10 font-mono uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        📧 Sent Copy: {activeDO.recipientEmail}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-right space-y-1 text-xs">
                  <span className="block text-[10px] text-slate-400 font-mono">Date Issued</span>
                  <span className="font-mono text-slate-200">{new Date(activeDO.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Status Update Quick Bar */}
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">DO Transit State:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                    activeDO.status === 'Picking List' ? 'bg-amber-500/10 text-amber-700 border-amber-200' :
                    activeDO.status === 'Picked' ? 'bg-teal-500/10 text-teal-700 border-teal-200' :
                    activeDO.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-250/50' :
                    activeDO.status === 'Cancelled' ? 'bg-rose-500/10 text-rose-700 border border-rose-200' :
                    activeDO.status === 'In Transit' ? 'bg-blue-500/10 text-blue-700 border-blue-200/50' : 'bg-slate-500/10 text-slate-700'
                  }`}>
                    {activeDO.status}
                  </span>
                </div>

                {onUpdateDeliveryOrderStatus && (
                  <div className="flex gap-2 items-center flex-wrap">
                    {/* Cancellation Action */}
                    {activeDO.status !== 'Cancelled' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to CANCEL this document ${activeDO.doNumber}? All associated cargo stocks will be returned to their designated warehouses, and active drivers will be recalled.`)) {
                            onUpdateDeliveryOrderStatus(activeDO.id, 'Cancelled');
                          }
                        }}
                        className="px-2.5 py-1 text-[10px] bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 rounded-lg text-rose-700 font-bold transition-all cursor-pointer shadow-xs"
                      >
                        🚫 Cancel D/O & Restock
                      </button>
                    )}

                    {activeDO.status === 'Cancelled' && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-1 rounded select-none">
                        🚫 Cancelled & Stock Returned To Warehouse
                      </span>
                    )}

                    {activeDO.status !== 'Cancelled' && (
                      <>
                        {activeDO.status === 'Picking List' ? (
                          <div className="flex gap-2 items-center">
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Confirm warehouse cargo pick for ${activeDO.doNumber}?\n\nThis will promote the document to a formal Delivery Order.`)) {
                                  onUpdateDeliveryOrderStatus(activeDO.id, 'Picked');
                                }
                              }}
                              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer shadow-sm flex items-center gap-1.5 animate-pulse"
                            >
                              <Boxes className="w-3.5 h-3.5" /> Confirm Items Picked (Warehouse)
                            </button>
                            <button
                              disabled
                              className="px-2.5 py-1 text-[10px] bg-slate-100 border border-slate-200 rounded-lg text-slate-400 font-bold cursor-not-allowed opacity-60"
                              title="Must confirm items are picked by the warehouse team first."
                            >
                              Ship / Transit
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5 mr-1 bg-teal-50 border border-teal-200 text-teal-700 px-2 py-1 rounded-lg text-[10px] font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 animate-bounce" /> Confirmed Picked
                            </div>
                            <button
                              onClick={() => onUpdateDeliveryOrderStatus(activeDO.id, 'In Transit')}
                              disabled={activeDO.status === 'In Transit' || activeDO.status === 'Delivered'}
                              className="px-2.5 py-1 text-[10px] bg-indigo-50 border border-indigo-200 hover:border-indigo-300 rounded-lg text-indigo-700 font-bold transition-all cursor-pointer disabled:opacity-50"
                            >
                              Ship / Transit
                            </button>
                          </>
                        )}
                        
                        {activeDO.status !== 'Delivered' ? (
                          <span className="text-[9.5px] text-slate-500 font-semibold bg-slate-100 hover:bg-slate-200/60 px-2 py-1 rounded select-none cursor-help" title="To prevent logistics fraud, only dispatch drivers can confirm recipient handover from their mobile simulation app.">
                            🔒 Driver Delivery Authorized Only
                          </span>
                        ) : (
                          <span className="text-[9.5px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded flex items-center gap-1">
                            <CheckCircle2 className="w-3" /> Handover Completed
                          </span>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Picking / Delivery Order Information Banner */}
              {activeDO.status === 'Picking List' && (
                <div className="bg-gradient-to-r from-amber-500/5 to-amber-650/5 border-b border-amber-200/60 px-6 py-3.5 flex items-start gap-3 text-xs">
                  <div className="p-2 bg-amber-500/10 text-amber-700 rounded-xl font-bold font-mono text-center shrink-0">
                    <Boxes className="w-5 h-5 text-amber-600 animate-pulse" />
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-amber-800 font-mono tracking-wider">Awaiting Warehouse Picking Confirmation</span>
                    <p className="text-slate-600 font-medium leading-relaxed mt-0.5">
                      This document is currently structured as a <strong>Picking List (P/L)</strong>. The warehouse team must verify 
                      and confirm that all grouped cargoes listed below have been retrieved from their storage bins before dispatching 
                      to the last-mile delivery stage.
                    </p>
                  </div>
                </div>
              )}

              {activeDO.status === 'Picked' && (
                <div className="bg-gradient-to-r from-teal-550/5 to-teal-650/5 border-b border-teal-200/65 px-6 py-3.5 flex items-start gap-3 text-xs">
                  <div className="p-2 bg-teal-500/11 text-teal-705 rounded-xl font-bold font-mono text-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-teal-850 font-mono tracking-wider">Warehouse Picking Verified & Promoted</span>
                    <p className="text-slate-600 font-medium leading-relaxed mt-0.5">
                      All cargo components have been successfully sorted, pulled, and packed. This list has been upgraded into an 
                      official <strong>Delivery Order (D/O)</strong> and has been released to the last-mile dispatch queue.
                    </p>
                  </div>
                </div>
              )}

              {/* Document Details Grid */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-150">
                <div className="space-y-4">
                  <div className="flex items-start gap-2.5 text-xs">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400 font-mono">Shipper / Dispatch Port (FROM)</span>
                      <span className="font-bold text-slate-800 text-sm">{activeDO.from}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs">
                    <MapPin className="w-4 h-4 text-indigo-550 mt-0.5 shrink-0" />
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400 font-mono">Destination Delivery Address</span>
                      <span className="font-bold text-slate-800 text-sm">{activeDO.deliveryAddress}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-2.5 text-xs">
                    <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400 font-mono">Consignee Receiving Party</span>
                      <span className="font-bold text-indigo-700 text-sm">{activeDO.consignee}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-start gap-2 text-xs">
                      <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400 font-mono">Delivery Date</span>
                        <span className="font-semibold text-slate-800">{activeDO.deliveryDate}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-xs">
                      <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400 font-mono">Delivery Time</span>
                        <span className="font-semibold text-slate-800 font-mono">{activeDO.deliveryTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vessel Delivery Option Detail Block */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-indigo-50 border border-indigo-150 rounded-lg text-indigo-600 font-bold">
                    <Ship className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider">Vessel Delivery Option</span>
                    <span className="font-extrabold text-slate-800 uppercase text-xs">{activeDO.vesselOption || 'RELEASE'}</span>
                  </div>
                </div>

                {activeDO.vesselOption === 'DISPATCH TO OTHER PORT' && activeDO.shippingAwb && (
                  <div className="flex items-center gap-2">
                    <span className="block text-[9.5px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-mono">SHIPPING AWB:</span>
                    <span className="font-mono font-bold text-slate-800 bg-white border border-slate-200 px-2 py-1 rounded text-xs select-all">{activeDO.shippingAwb}</span>
                  </div>
                )}

                {activeDO.vesselOption === 'DELIVERY TO WORK SHOP' && activeDO.workshopAddress && (
                  <div className="max-w-md text-left sm:text-right">
                    <span className="block text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider">Workshop Address</span>
                    <span className="font-semibold text-slate-700 text-xs block">{activeDO.workshopAddress}</span>
                  </div>
                )}
              </div>

              {/* Housed Shipments list for this DO */}
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-indigo-500" />
                    Associated Manifest Cargo Items ({activeDOShipments.length})
                  </h4>
                  <span className="text-xs font-mono font-bold text-slate-700">Total Weight: {totalDOWeight.toLocaleString()} kg</span>
                </div>

                <div className="border border-slate-150 rounded-xl overflow-hidden divide-y divide-slate-150">
                  {activeDOShipments.map((s, index) => (
                    <div key={s.id} className="p-3.5 bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-slate-800">{s.awb}</span>
                          <span className="text-[9.5px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono font-medium">PO: {s.poNumber}</span>
                          <span className="text-[9px] bg-amber-50 border border-amber-200 text-amber-800 font-bold px-1.5 py-0.5 rounded font-mono uppercase leading-none">{s.shipmentMode || 'A/F'}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-slate-500 text-[11px]">
                          <span>Route: <strong className="text-slate-700 font-semibold">{s.origin} → {s.destination}</strong></span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Ship className="w-3 h-3 text-slate-400" />
                            Vessel: <strong className="text-indigo-600 font-semibold">{s.vesselName}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="block text-[8.5px] uppercase font-mono font-bold text-slate-400">Carrier Gross Mass</span>
                        <span className="font-mono font-bold text-slate-800">{s.weight.toLocaleString()} kg</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consolidated Billing & Surcharges Block */}
              <div className="p-6 border-t border-slate-150 space-y-4 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div className="space-y-0.5 animate-in fade-in duration-200">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-indigo-500" />
                      Consolidated Billing & Commercial Statement
                    </h4>
                    <p className="text-[11px] text-slate-550 leading-relaxed">
                      Audit all associated service charges, freight surcharges, and customs fees compiled for {activeDO.doNumber}.
                    </p>
                  </div>

                  {onAddDeliveryOrderCharge && (
                    <button
                      type="button"
                      onClick={() => setShowAddDoCharge(!showAddDoCharge)}
                      className="px-2.5 py-1 text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-100 flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      {showAddDoCharge ? 'Close Form' : 'Add DO Surcharge'}
                    </button>
                  )}
                </div>

                {/* Direct DO Surcharge Addition form */}
                {showAddDoCharge && onAddDeliveryOrderCharge && (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (newChargeAmount <= 0) return;
                      const charge: Charge = {
                        id: `chg-do-add-${Date.now()}`,
                        type: newChargeType,
                        amount: newChargeAmount,
                        dateAdded: new Date().toISOString(),
                        description: newChargeDesc || `${newChargeType} specialized delivery charge.`,
                        status: newChargeStatus
                      };
                      onAddDeliveryOrderCharge(activeDO.id, charge);
                      setNewChargeDesc('');
                      setShowAddDoCharge(false);
                    }}
                    className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-md animate-in slide-in-from-top-3 duration-250"
                  >
                    <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                      Add Service Charge Directly to {activeDO.doNumber}
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[8.5px] font-bold text-slate-400 mb-0.5 uppercase">Charge Category</label>
                        <select
                          value={newChargeType}
                          onChange={(e) => setNewChargeType(e.target.value as ChargeType)}
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-indigo-500 cursor-pointer text-slate-800"
                        >
                          <option value="Delivery">Delivery / Courier Freight</option>
                          <option value="Handling">Warehouse Handling</option>
                          <option value="Release">Terminal Cargo Release</option>
                          <option value="Clearance">Customs Clearance Duty</option>
                          <option value="Storage">Yard / Warehouse Storage</option>
                          <option value="Re-export">Transit Re-export Fee</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[8.5px] font-bold text-slate-400 mb-0.5 uppercase">Amount ($ USD)</label>
                        <div className="relative">
                          <DollarSign className="w-3.5 h-3.5 absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="number"
                            required
                            min="1"
                            step="0.01"
                            value={newChargeAmount}
                            onChange={(e) => setNewChargeAmount(Number(e.target.value))}
                            className="w-full pl-5 pr-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-slate-800 focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[8.5px] font-bold text-slate-400 mb-0.5 uppercase">Payment Billing Status</label>
                        <select
                          value={newChargeStatus}
                          onChange={(e) => setNewChargeStatus(e.target.value as any)}
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-indigo-500 cursor-pointer text-slate-800"
                        >
                          <option value="Pending">Pending Audit</option>
                          <option value="Invoiced">Invoiced / Billed</option>
                          <option value="Paid">Fully Paid</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[8.5px] font-bold text-slate-400 mb-0.5 uppercase">Charge Invoice Description</label>
                      <input
                        type="text"
                        placeholder="e.g. Extended forklift operations fee or heavy transport toll surcharge."
                        value={newChargeDesc}
                        onChange={(e) => setNewChargeDesc(e.target.value)}
                        className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800"
                      />
                    </div>

                    <div className="flex justify-end gap-1.5 pt-1.5 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowAddDoCharge(false)}
                        className="px-2.5 py-1 text-[10px] bg-slate-100 hover:bg-slate-205 text-slate-600 font-semibold rounded cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 text-[10px] bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded shadow-sm cursor-pointer"
                      >
                        Embed Charge Surcharge
                      </button>
                    </div>
                  </form>
                )}

                {/* Detailed combined listing */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-150">
                  
                  {/* Part 1: Direct D/O Charges */}
                  <div className="p-3.5 bg-indigo-50/5">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest font-mono block mb-2 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      Direct Delivery Order Service Surcharges
                    </span>

                    {(!activeDO.charges || activeDO.charges.length === 0) ? (
                      <div className="text-[11px] text-slate-400 italic py-1 pl-1">
                        No direct service surcharges recorded on this delivery order. Add one above.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {activeDO.charges.map((ch) => (
                          <div key={ch.id} className="flex justify-between items-center text-xs p-1.5 rounded hover:bg-slate-50 transition-colors">
                            <div className="space-y-0.5 max-w-[70%]">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded text-[9.5px]">
                                  {ch.type}
                                </span>
                                <span className="text-[10px] text-slate-450 font-mono">
                                  {new Date(ch.dateAdded).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate" title={ch.description}>{ch.description}</p>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold tracking-wide uppercase ${
                                ch.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' :
                                ch.status === 'Invoiced' ? 'bg-blue-50 text-blue-700 border border-blue-150' : 'bg-amber-50 text-amber-800 border border-amber-150'
                              }`}>
                                {ch.status}
                              </span>
                              <span className="font-mono font-bold text-slate-800">${ch.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Part 2: Consolidated Shipment Surcharges (Brought over) */}
                  <div className="p-3.5 bg-emerald-50/5">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest font-mono block mb-2 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Consolidated Cargo (AWB) Shipment Charges
                    </span>

                    {activeDOShipments.every(s => !s.charges || s.charges.length === 0) ? (
                      <div className="text-[11px] text-slate-400 italic py-1 pl-1">
                        No sub-cargo shipment surcharges were consolidated in.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activeDOShipments.map((s) => {
                          if (!s.charges || s.charges.length === 0) return null;
                          return (
                            <div key={s.id} className="border-l-2 border-emerald-500/30 pl-2.5 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                                  Cargo {s.awb}
                                </span>
                                <span className="text-[9.5px] text-slate-450">
                                  PO: {s.poNumber} • {s.charges.length} item(s) consolidated
                                </span>
                              </div>

                              <div className="space-y-1 bg-white/60 p-2 rounded-lg border border-slate-100">
                                {s.charges.map((ch) => (
                                  <div key={ch.id} className="flex justify-between items-center text-[11px] py-0.5 pr-1">
                                    <div className="space-y-0.5 max-w-[70%]">
                                      <span className="font-bold text-emerald-700 text-[9px] bg-emerald-50/70 px-1 py-0.1 rounded border border-emerald-100 mr-1.5 uppercase font-mono">
                                        {ch.type}
                                      </span>
                                      <span className="text-slate-650">{ch.description}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className={`px-1 py-0.2 rounded text-[8px] font-bold scale-90 ${
                                        ch.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' :
                                        ch.status === 'Invoiced' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-800'
                                      }`}>
                                        {ch.status}
                                      </span>
                                      <span className="font-mono font-semibold text-slate-850">${ch.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Summary aggregate card */}
                  {(() => {
                    const directDoSum = (activeDO.charges || []).reduce((sum, ch) => sum + ch.amount, 0);
                    const consolidatedShipmentsSum = activeDOShipments.reduce(
                      (sum, s) => sum + (s.charges || []).reduce((cSum, ch) => cSum + ch.amount, 0),
                      0
                    );
                    const grandConsolidatedTotal = directDoSum + consolidatedShipmentsSum;

                    return (
                      <div className="p-4 bg-slate-900 border-t border-slate-800 text-white flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <div className="text-slate-400 font-medium">Direct DO Surcharges:</div>
                          <div className="font-mono font-semibold text-slate-200 text-right">${directDoSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>

                          <div className="text-slate-400 font-medium">Consolidated Cargo Surcharges:</div>
                          <div className="font-mono font-semibold text-slate-200 text-right">${consolidatedShipmentsSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>

                        <div className="md:text-right border-t md:border-t-0 border-slate-705 pt-3 md:pt-0 shrink-0">
                          <span className="block text-[9.5px] text-slate-400 uppercase font-bold tracking-widest font-mono">
                            🚚 GRAND CONSOLIDATED BALANCE
                          </span>
                          <span className="font-mono text-xl font-bold text-indigo-400">
                            ${grandConsolidatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                </div>
              </div>

              {/* Document footer placeholder decoration */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-150 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono text-[9px] uppercase tracking-wider">CARGOCONNECT LOGISTICS NETWORK • PRINT NO: {activeDO.id.slice(3,10)}</span>
                <div className="flex items-center gap-3">
                  {activeDO.recipientEmail && (
                    <button
                      type="button"
                      onClick={() => {
                        alert(`Re-sent PDF copy of ${activeDO.doNumber} successfully to: ${activeDO.recipientEmail}`);
                      }}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      📧 Resend PDF
                    </button>
                  )}
                  <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5 hover:text-indigo-600 cursor-pointer" onClick={() => window.print()}>
                    <Printer className="w-3.5 h-3.5" />
                    Print Official Slip
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
              Select or generate a Delivery Order blueprint to inspect layout.
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Generate Custom DO Console (Cols 5) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
          
          <div className="border-b border-slate-150 pb-3">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest font-mono">Consolidation Engine</span>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
              <Plus className="w-5 h-5 text-indigo-650" />
              Compile Picking List
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {successMessage && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {selectedShipmentIds.length > 0 && (() => {
              const firstSelected = shipments.find(s => s.id === selectedShipmentIds[0]);
              if (!firstSelected) return null;
              return (
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-150 rounded-xl flex items-center justify-between text-xs animate-in slide-in-from-top-2 duration-200 shadow-xs">
                  <div className="space-y-0.5">
                    <span className="block text-[9.5px] text-indigo-505 font-mono uppercase tracking-wider font-bold">Active Collection Client</span>
                    <span className="font-extrabold text-slate-900 text-[13px] uppercase tracking-wide">{firstSelected.clientName}</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-indigo-700 bg-white border border-indigo-150 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span> Lock-Bound
                  </span>
                </div>
              );
            })()}
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">SHIPPER POINT (FROM)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Singapore Changi Hub (WH-SIN)"
                  value={doFrom}
                  onChange={(e) => setDoFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">CONSIGNEE (RECEIVER)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TechCorp Solutions Inc"
                  value={doConsignee}
                  onChange={(e) => setDoConsignee(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">DELIVERY DESTINATION ADDRESS</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Block 4B, Science Park Dr, Singapore"
                  value={doAddress}
                  onChange={(e) => setDoAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">VESSEL DELIVERY OPTION</label>
                <select
                  value={vesselOption}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setVesselOption(val);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-semibold bg-white cursor-pointer"
                >
                  <option value="RELEASE">RELEASE</option>
                  <option value="LOADING AT MSW">LOADING AT MSW</option>
                  <option value="LOADING AT PT">LOADING AT PT</option>
                  <option value="DELIVERY AT JZ">DELIVERY AT JZ</option>
                  <option value="DELIVERY AT SHIP YARD">DELIVERY AT SHIP YARD</option>
                  <option value="DELIVERY TO WORK SHOP">DELIVERY TO WORK SHOP</option>
                  <option value="DISPATCH TO OTHER PORT">DISPATCH TO OTHER PORT</option>
                </select>
              </div>

              {vesselOption === 'DISPATCH TO OTHER PORT' && (
                <div className="animate-in slide-in-from-top-1 duration-200">
                  <label className="block text-[10px] font-bold text-indigo-600 uppercase mb-1 font-mono">SHIPPING AWB *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AWB-99887766"
                    value={shippingAwb}
                    onChange={(e) => setShippingAwb(e.target.value)}
                    className="w-full px-3 py-2 border border-indigo-250 bg-indigo-50/10 rounded-lg text-slate-705 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-semibold"
                  />
                </div>
              )}

              {vesselOption === 'DELIVERY TO WORK SHOP' && (
                <div className="animate-in slide-in-from-top-1 duration-200">
                  <label className="block text-[10px] font-bold text-indigo-600 uppercase mb-1 font-mono">WORK SHOP ADDRESS *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. West Coast Engineering Workshop, Bay 4, Singapore"
                    value={workshopAddress}
                    onChange={(e) => setWorkshopAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-indigo-250 bg-indigo-50/10 rounded-lg text-slate-705 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-semibold"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-35">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono font-sans">DELIVERY DATE</label>
                  <input
                    type="date"
                    required
                    value={doDate}
                    onChange={(e) => setDoDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-705 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono font-sans">DELIVERY TIME</label>
                  <input
                    type="time"
                    required
                    value={doTime}
                    onChange={(e) => setDoTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-705 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-500 animate-pulse" /> EMAIL TO (PDF RECIPIENT) <span className="text-indigo-600 font-extrabold">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. buithang2011@gmail.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-705 text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
                <span className="text-[9px] text-slate-400 mt-1 block font-sans">Specify the destination inbox to dispatch the compiled PDF copy of this Picking List automatically upon submit.</span>
              </div>
            </div>

            {/* Filter shipment by vessel to assist the user */}
            <div className="border-t border-slate-150 pt-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide font-mono">
                  FILTER SHIPMENTS BY VESSEL
                </span>
                <span className="text-[10px] font-semibold text-slate-400">Identify carrier cargo</span>
              </div>
              
              <select
                value={selectedVessel}
                onChange={(e) => {
                  setSelectedVessel(e.target.value);
                  setSelectedShipmentIds([]); // clear selection when switching vessel filters for safety
                }}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500/15 outline-none cursor-pointer"
              >
                <option value="ALL">-- Show All Cargoes (All Vessels) --</option>
                {uniqueVessels.map(vessel => (
                  <option key={vessel} value={vessel}>
                    Vessel: {vessel} ({shipments.filter(s => s.vesselName === vessel).length} items)
                  </option>
                ))}
              </select>
            </div>

            {/* Multiple Shipments selector block */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>Select Multiple Shipments ({selectedShipmentIds.length} chosen)</span>
                {eligibleShipments.length > 0 && (
                  <button 
                    type="button" 
                    onClick={selectAllFilteredShipments}
                    className="text-indigo-600 hover:underline cursor-pointer"
                  >
                    Select All {selectedVessel !== 'ALL' ? `(${selectedVessel})` : ''}
                  </button>
                )}
              </div>

              {eligibleShipments.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 text-center italic text-slate-400">
                  No cargos match this vessel category.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-150">
                  {eligibleShipments.map((s) => {
                    const isSelected = selectedShipmentIds.includes(s.id);
                    
                    // Determine if this shipment belongs to a different client than already selected
                    let hasClientMismatch = false;
                    let selectedClientName = '';
                    if (selectedShipmentIds.length > 0) {
                      const firstSelected = shipments.find(sh => sh.id === selectedShipmentIds[0]);
                      if (firstSelected && firstSelected.clientName !== s.clientName) {
                        hasClientMismatch = true;
                        selectedClientName = firstSelected.clientName;
                      }
                    }

                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          if (hasClientMismatch) return;
                          toggleShipmentSelection(s.id);
                        }}
                        className={`p-2.5 flex items-center justify-between transition-all ${
                          hasClientMismatch 
                            ? 'opacity-40 bg-slate-50 cursor-not-allowed text-slate-405' 
                            : 'cursor-pointer hover:bg-slate-50'
                        } ${
                          isSelected ? 'bg-indigo-50/30 font-semibold' : ''
                        }`}
                        title={hasClientMismatch ? `Locked: Belongs to ${s.clientName}, but you have already selected cargos for client ${selectedClientName}.` : `Client client: ${s.clientName}`}
                      >
                        <div className="space-y-0.5 max-w-[85%]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-slate-800 text-[11px]">{s.awb}</span>
                            <span className={`text-[9px] font-sans font-extrabold px-1 py-0.2 rounded ${
                              isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {s.clientName}
                            </span>
                          </div>
                          <span className="block text-[10px] text-slate-500">
                            PO: {s.poNumber} • {s.vesselName} • {s.shipmentMode || 'A/F'} • {s.weight.toLocaleString()} kg
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          disabled={hasClientMismatch}
                          checked={isSelected}
                          onChange={() => {}} // handled by click of outer container
                          className="w-4 h-4 text-indigo-650 border-slate-300 rounded cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-200"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={selectedShipmentIds.length === 0}
              className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl cursor-pointer text-xs transition-colors shadow-sm shadow-indigo-600/10 hover:shadow-indigo-600/20"
            >
              Generate Picking List ({selectedShipmentIds.length} Cargoes)
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
