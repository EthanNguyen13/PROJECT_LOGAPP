/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Calendar, 
  DollarSign, 
  Plus, 
  ScrollText, 
  Timer, 
  ChevronRight, 
  Calculator, 
  CheckCircle2, 
  Building, 
  ArrowRightLeft, 
  ArrowRight,
  Edit,
  X,
  Save,
  AlertCircle,
  Anchor,
  History,
  FileText,
  Activity,
  Upload,
  Trash2,
  Download,
  Maximize2,
  Image,
  Eye,
  Paperclip
} from 'lucide-react';
import { Shipment, Charge, ChargeType, Movement, Warehouse, Customer, Vessel, ShipmentLog, StandardTariff, ClientTariffOverride, ShipmentMode, ShipmentAttachment, CargoItem } from '../types';

interface ShipmentDetailsProps {
  shipment: Shipment | null;
  onAddCharge: (shipmentId: string, charge: Charge) => void;
  onAddMovement: (shipmentId: string, activity: string, location: string, description: string) => void;
  warehouses?: Warehouse[];
  onTransferWarehouse?: (shipmentId: string, targetWarehouseId: string | null) => void;
  onUpdateShipment?: (updatedShipment: Shipment) => void;
  customers?: Customer[];
  vessels?: Vessel[];
  tariffs?: StandardTariff[];
  overrides?: ClientTariffOverride[];
}

export default function ShipmentDetails({
  shipment,
  onAddCharge,
  onAddMovement,
  warehouses = [],
  onTransferWarehouse,
  onUpdateShipment,
  customers = [],
  vessels = [],
  tariffs = [],
  overrides = []
}: ShipmentDetailsProps) {
  // Embedding Charge form states
  const [chargeType, setChargeType] = useState<string>('Clearance');
  const [chargeAmount, setChargeAmount] = useState<number>(180);
  const [chargeTaxRate, setChargeTaxRate] = useState<number>(10);
  const [chargeDesc, setChargeDesc] = useState('');
  const [chargeStatus, setChargeStatus] = useState<Charge['status']>('Pending');

  // Reactively populate rates and tax rates based on client override or standard tariff definitions
  React.useEffect(() => {
    if (!shipment) return;
    
    // Ensure chargeType is valid, if not, set to first tariff or 'Clearance'
    let currentType = chargeType;
    if (tariffs.length > 0 && !tariffs.some(t => t.name === chargeType)) {
      currentType = tariffs[0].name;
      setChargeType(currentType);
    }

    const clientName = shipment.clientName;
    const matchedOverride = overrides.find(o => o.clientName === clientName && o.chargeName === currentType);
    const matchedTariff = tariffs.find(t => t.name === currentType);

    if (matchedOverride) {
      setChargeAmount(matchedOverride.customAmount);
      setChargeTaxRate(matchedOverride.customTaxRate);
    } else if (matchedTariff) {
      setChargeAmount(matchedTariff.defaultAmount);
      setChargeTaxRate(matchedTariff.taxRate);
    } else {
      // Fallbacks
      setChargeAmount(180);
      setChargeTaxRate(10);
    }
  }, [chargeType, shipment?.clientName, tariffs, overrides]);

  // New Movement form states
  const [movementActivity, setMovementActivity] = useState('Customs Clearance');
  const [movementLocation, setMovementLocation] = useState('');
  const [movementDesc, setMovementDesc] = useState('');
  const [showAddMov, setShowAddMov] = useState(false);

  // EDIT SHIPMENT STATES
  const [isEditingShipment, setIsEditingShipment] = useState(false);
  const [editAwb, setEditAwb] = useState('');
  const [editPoNumber, setEditPoNumber] = useState('');
  const [editVesselName, setEditVesselName] = useState('');
  const [editClientName, setEditClientName] = useState('');
  const [editSupplierName, setEditSupplierName] = useState('');
  const [editCargoDescription, setEditCargoDescription] = useState('');
  const [editWeight, setEditWeight] = useState(0);
  const [editLength, setEditLength] = useState(0);
  const [editWidth, setEditWidth] = useState(0);
  const [editHeight, setEditHeight] = useState(0);
  const [editOrigin, setEditOrigin] = useState('');
  const [editDestination, setEditDestination] = useState('');
  const [editStatus, setEditStatus] = useState<Shipment['status']>('Received');
  const [editShipmentMode, setEditShipmentMode] = useState<ShipmentMode>('A/F');

  // ATTACHMENTS STATES
  const [isDragging, setIsDragging] = useState(false);
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);
  const [activePreviewName, setActivePreviewName] = useState<string | null>(null);
  const [activePreviewType, setActivePreviewType] = useState<'document' | 'photo' | null>(null);

  // CARGO ITEMS INLINE FORM STATES
  const [newItemPoNumber, setNewItemPoNumber] = useState('');
  const [newItemWeight, setNewItemWeight] = useState<number>(100);
  const [newItemLength, setNewItemLength] = useState<number>(120);
  const [newItemWidth, setNewItemWidth] = useState<number>(80);
  const [newItemHeight, setNewItemHeight] = useState<number>(100);
  const [newItemPieces, setNewItemPieces] = useState<number>(1);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [showAddCargoItem, setShowAddCargoItem] = useState(false);

  // EDIT SINGLE CARGO ITEM STATE (TO ALLOW DIRECT EDITS TO EXISTING CARGO LINES)
  const [editingCargoItemId, setEditingCargoItemId] = useState<string | null>(null);
  const [editCargoItemPo, setEditCargoItemPo] = useState('');
  const [editCargoItemWeight, setEditCargoItemWeight] = useState(0);
  const [editCargoItemLength, setEditCargoItemLength] = useState(0);
  const [editCargoItemWidth, setEditCargoItemWidth] = useState(0);
  const [editCargoItemHeight, setEditCargoItemHeight] = useState(0);
  const [editCargoItemPieces, setEditCargoItemPieces] = useState(1);
  const [editCargoItemDesc, setEditCargoItemDesc] = useState('');

  const syncShipmentWithCargoItems = (updatedItems: CargoItem[]) => {
    if (!shipment || !onUpdateShipment) return;

    // Recalculate totals
    const totalWeight = updatedItems.reduce((acc, item) => acc + item.weight, 0);
    
    // Unique list of POs
    const uniquePos = Array.from(new Set(updatedItems.map(item => item.poNumber.trim()).filter(Boolean)));
    const poString = uniquePos.join(', ');

    // Aggregate descriptions
    const descString = updatedItems.map(item => `${item.pieces || 1} pkg ${item.description}`).join('; ');

    // Find the largest volume item
    let largestItem = updatedItems[0];
    let maxVolume = 0;
    updatedItems.forEach(item => {
      const vol = item.dimensions.length * item.dimensions.width * item.dimensions.height;
      if (vol > maxVolume) {
        maxVolume = vol;
        largestItem = item;
      }
    });
    const mainDims = largestItem ? largestItem.dimensions : { length: 0, width: 0, height: 0 };

    const timestamp = new Date().toISOString();
    const actionDesc = `Updated Cargo Breakdown. Totals: Weight: ${totalWeight} kg, POs: [${poString}]`;
    
    const generatedLog: ShipmentLog = {
      id: `log-cargo-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      updatedBy: 'Dispatcher Administrator',
      changes: actionDesc
    };

    const updatedMovements = [
      ...shipment.movements,
      {
        id: `mvt-cargo-${Date.now()}`,
        timestamp,
        location: shipment.origin,
        activity: 'Cargo Items Audited',
        description: actionDesc
      }
    ];

    const updatedShipment: Shipment = {
      ...shipment,
      cargoItems: updatedItems,
      weight: totalWeight,
      poNumber: poString,
      cargoDescription: descString,
      dimensions: mainDims,
      movements: updatedMovements,
      auditLogs: [...(shipment.auditLogs || []), generatedLog]
    };

    onUpdateShipment(updatedShipment);
  };

  const handleAddCargoItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipment || !onUpdateShipment) return;

    const currentItems = shipment.cargoItems && shipment.cargoItems.length > 0
      ? shipment.cargoItems
      : [
          {
            id: `citem-init-${Date.now()}`,
            poNumber: shipment.poNumber,
            weight: shipment.weight,
            dimensions: shipment.dimensions,
            pieces: 1,
            description: shipment.cargoDescription || 'Registered Cargo Consignment'
          }
        ];

    const newItem: CargoItem = {
      id: `citem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      poNumber: newItemPoNumber.trim() ? (newItemPoNumber.trim().startsWith('PO-') ? newItemPoNumber.trim() : `PO-${newItemPoNumber.trim()}`) : (shipment.poNumber || 'PO-GENERIC'),
      weight: Number(newItemWeight),
      dimensions: {
        length: Number(newItemLength),
        width: Number(newItemWidth),
        height: Number(newItemHeight)
      },
      pieces: Number(newItemPieces),
      description: newItemDesc.trim() || 'General Cargo'
    };

    const updatedItems = [...currentItems, newItem];
    syncShipmentWithCargoItems(updatedItems);

    // Reset inline form
    setNewItemPoNumber('');
    setNewItemWeight(100);
    setNewItemLength(120);
    setNewItemWidth(80);
    setNewItemHeight(100);
    setNewItemPieces(1);
    setNewItemDesc('');
    setShowAddCargoItem(false);
  };

  const handleDeleteCargoItem = (id: string, description: string) => {
    if (!shipment || !onUpdateShipment) return;
    
    const currentItems = shipment.cargoItems || [];
    if (currentItems.length <= 1) {
      alert('An AWB must have at least one cargo item. Edit the existing item instead of deleting it.');
      return;
    }

    if (!window.confirm(`Remove cargo line: "${description}" from this Air Waybill?`)) {
      return;
    }

    const updatedItems = currentItems.filter(item => item.id !== id);
    syncShipmentWithCargoItems(updatedItems);
  };

  const startEditingCargoItem = (item: any) => {
    setEditingCargoItemId(item.id);
    setEditCargoItemPo(item.poNumber);
    setEditCargoItemWeight(item.weight);
    setEditCargoItemLength(item.dimensions.length);
    setEditCargoItemWidth(item.dimensions.width);
    setEditCargoItemHeight(item.dimensions.height);
    setEditCargoItemPieces(item.pieces || 1);
    setEditCargoItemDesc(item.description);
  };

  const cancelEditingCargoItem = () => {
    setEditingCargoItemId(null);
  };

  const handleSaveCargoItemEdit = (itemId: string) => {
    if (!shipment || !onUpdateShipment) return;

    const currentItems = shipment.cargoItems && shipment.cargoItems.length > 0
      ? shipment.cargoItems
      : [
          {
            id: `citem-default-${shipment.id}`,
            poNumber: shipment.poNumber,
            weight: shipment.weight,
            dimensions: shipment.dimensions,
            pieces: 1,
            description: shipment.cargoDescription || 'Registered Cargo Consignment'
          }
        ];

    const updatedItems = currentItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          poNumber: editCargoItemPo.trim() || item.poNumber,
          weight: Number(editCargoItemWeight),
          dimensions: {
            length: Number(editCargoItemLength),
            width: Number(editCargoItemWidth),
            height: Number(editCargoItemHeight)
          },
          pieces: Number(editCargoItemPieces),
          description: editCargoItemDesc.trim() || item.description
        };
      }
      return item;
    });

    syncShipmentWithCargoItems(updatedItems);
    setEditingCargoItemId(null);
  };

  const ensureCargoItemsArray = (): CargoItem[] => {
    if (shipment && shipment.cargoItems && shipment.cargoItems.length > 0) {
      return shipment.cargoItems;
    }
    return [
      {
        id: `citem-default-${shipment?.id}`,
        poNumber: shipment?.poNumber || 'PO-NOT-DEFINED',
        weight: shipment?.weight || 0,
        dimensions: shipment?.dimensions || { length: 0, width: 0, height: 0 },
        pieces: 1,
        description: shipment?.cargoDescription || 'Registered Cargo Consignment'
      }
    ];
  };

  const startEditingShipment = () => {
    if (!shipment) return;
    setEditAwb(shipment.awb);
    setEditPoNumber(shipment.poNumber);
    setEditVesselName(shipment.vesselName);
    setEditClientName(shipment.clientName);
    setEditSupplierName(shipment.supplierName || '');
    setEditCargoDescription(shipment.cargoDescription || '');
    setEditWeight(shipment.weight);
    setEditLength(shipment.dimensions.length);
    setEditWidth(shipment.dimensions.width);
    setEditHeight(shipment.dimensions.height);
    setEditOrigin(shipment.origin);
    setEditDestination(shipment.destination);
    setEditStatus(shipment.status);
    setEditShipmentMode(shipment.shipmentMode || 'A/F');
    setIsEditingShipment(true);
  };

  const saveShipmentChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipment || !onUpdateShipment) return;

    const diffLogs: string[] = [];
    if (shipment.awb !== editAwb.trim()) diffLogs.push(`AWB modified from '${shipment.awb}' to '${editAwb.trim()}'`);
    if (shipment.poNumber !== editPoNumber.trim()) diffLogs.push(`PO Reference modified from '${shipment.poNumber}' to '${editPoNumber.trim()}'`);
    if (shipment.vesselName !== editVesselName) diffLogs.push(`Vessel modified from '${shipment.vesselName}' to '${editVesselName}'`);
    if (shipment.clientName !== editClientName) diffLogs.push(`Client partner modified from '${shipment.clientName}' to '${editClientName}'`);
    if ((shipment.supplierName || '') !== editSupplierName.trim()) diffLogs.push(`Supplier modified from '${shipment.supplierName || 'None'}' to '${editSupplierName.trim()}'`);
    if ((shipment.cargoDescription || '') !== editCargoDescription.trim()) diffLogs.push(`Cargo description modified from '${shipment.cargoDescription || 'None'}' to '${editCargoDescription.trim()}'`);
    if (shipment.weight !== Number(editWeight)) diffLogs.push(`Gross weight altered from ${shipment.weight} kg to ${Number(editWeight)} kg`);
    
    if (
      shipment.dimensions.length !== Number(editLength) || 
      shipment.dimensions.width !== Number(editWidth) || 
      shipment.dimensions.height !== Number(editHeight)
    ) {
      diffLogs.push(`Box dimensions adjusted from ${shipment.dimensions.length}x${shipment.dimensions.width}x${shipment.dimensions.height} cm to ${Number(editLength)}x${Number(editWidth)}x${Number(editHeight)} cm`);
    }

    if (shipment.origin !== editOrigin.trim()) diffLogs.push(`Port of Origin shifted from '${shipment.origin}' to '${editOrigin.trim()}'`);
    if (shipment.destination !== editDestination.trim()) diffLogs.push(`Shipment destination shifted from '${shipment.destination}' to '${editDestination.trim()}'`);
    if (shipment.status !== editStatus) diffLogs.push(`Consignment status transitioned: '${shipment.status}' → '${editStatus}'`);
    if ((shipment.shipmentMode || 'A/F') !== editShipmentMode) diffLogs.push(`Shipment Mode modified from '${shipment.shipmentMode || 'A/F'}' to '${editShipmentMode}'`);

    if (diffLogs.length === 0) {
      setIsEditingShipment(false);
      return;
    }

    // Generate log records
    const timestamp = new Date().toISOString();
    const generatedLogs: ShipmentLog[] = diffLogs.map((changesText, i) => ({
      id: `log-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp,
      updatedBy: "Dispatcher Administrator",
      changes: changesText
    }));

    // Concurrently post movement logs to the normal tracking timeline so users can view everything seamlessly!
    const updatedMovements = [...shipment.movements];
    diffLogs.forEach((changesText) => {
      updatedMovements.push({
        id: `mvt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp,
        location: editOrigin.trim() || shipment.origin,
        activity: 'Consignment Updated',
        description: changesText
      });
    });

    const updatedShipment: Shipment = {
      ...shipment,
      awb: editAwb.trim(),
      poNumber: editPoNumber.trim(),
      vesselName: editVesselName,
      clientName: editClientName,
      supplierName: editSupplierName.trim() || undefined,
      cargoDescription: editCargoDescription.trim() || undefined,
      weight: Number(editWeight),
      dimensions: {
        length: Number(editLength),
        width: Number(editWidth),
        height: Number(editHeight)
      },
      origin: editOrigin.trim(),
      destination: editDestination.trim(),
      status: editStatus,
      shipmentMode: editShipmentMode,
      movements: updatedMovements,
      auditLogs: [...(shipment.auditLogs || []), ...generatedLogs]
    };

    onUpdateShipment(updatedShipment);
    setIsEditingShipment(false);
  };

  if (!shipment) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400 flex flex-col items-center justify-center h-full min-h-[350px]">
        <ScrollText className="w-12 h-12 text-slate-300 stroke-[1.5] mb-3 animate-pulse" />
        <h3 className="font-bold text-slate-700 text-sm">No Shipment Selected</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Pick a shipment from the dispatch board to trace interactive movements, calculate volumetric dimensions, and audit active customs/release charges.
        </p>
      </div>
    );
  }

  // Volumetric weight formula: sum of parts (cumulative of multiple items if cargoItems is present and non-empty):
  const tempItems: any[] = shipment.cargoItems && shipment.cargoItems.length > 0 ? shipment.cargoItems : [
    {
      dimensions: shipment.dimensions,
      pieces: 1,
      weight: shipment.weight
    }
  ];

  const standardVolumeCbm: number = tempItems.reduce((sum: number, item: any) => {
    return sum + ((item.dimensions.length * item.dimensions.width * item.dimensions.height * (item.pieces || 1)) / 1000000);
  }, 0);

  const volumetricWeight: number = tempItems.reduce((sum: number, item: any) => {
    return sum + ((item.dimensions.length * item.dimensions.width * item.dimensions.height * (item.pieces || 1)) / 5000);
  }, 0);

  const totalPieces: number = tempItems.reduce((sum: number, item: any) => {
    return sum + (item.pieces || 1);
  }, 0);

  const currentWarehouse = warehouses?.find(w => w.id === shipment.currentWarehouseId);

  const handleEmbedCharge = (e: React.FormEvent) => {
    e.preventDefault();
    const computedTax = chargeAmount * (chargeTaxRate / 100);
    const newCharge: Charge = {
      id: `chg-${Date.now()}`,
      type: chargeType,
      amount: chargeAmount,
      taxRate: chargeTaxRate,
      taxAmount: Number(computedTax.toFixed(2)),
      totalAmount: Number((chargeAmount + computedTax).toFixed(2)),
      dateAdded: new Date().toISOString(),
      description: chargeDesc || `${chargeType} activity logistics fee.`,
      status: chargeStatus
    };

    onAddCharge(shipment.id, newCharge);

    // Auto append a movement log detailing charges added! This has super neat synergy
    onAddMovement(
      shipment.id,
      'Billing Action',
      shipment.status === 'Released' || shipment.status === 'Delivered' ? shipment.destination : shipment.origin,
      `Calculated and embedded standard activity charge of $${chargeAmount} and tax of $${computedTax.toFixed(2)} (${chargeTaxRate}%) for ${chargeType} [Status: ${chargeStatus}].`
    );

    // Reset Form
    setChargeDesc('');
  };

  const handleAddMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementActivity || !movementLocation) return;
    onAddMovement(
      shipment.id,
      movementActivity,
      movementLocation,
      movementDesc || `${movementActivity} registered at ${movementLocation}.`
    );
    setMovementLocation('');
    setMovementDesc('');
    setShowAddMov(false);
  };

  const handleAddAttachment = (file: File, forcedType?: 'photo' | 'document') => {
    if (!shipment || !onUpdateShipment) return;

    const sizeStr = file.size > 1024 * 1024 
      ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' 
      : (file.size / 1024).toFixed(0) + ' KB';

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const computedType = forcedType || (file.type.startsWith('image/') ? 'photo' : 'document');
      
      const newAtt: ShipmentAttachment = {
        id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: file.name,
        type: computedType,
        url: dataUrl,
        size: sizeStr,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'Active Operator User'
      };

      const currentAttachments = shipment.attachments || [];
      const updatedAttachments = [...currentAttachments, newAtt];
      
      const timestamp = new Date().toISOString();
      const generatedLog: ShipmentLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp,
        updatedBy: 'Dispatcher Administrator',
        changes: `Attached copy of reference ${computedType === 'photo' ? 'cargo photology' : 'official document'}: ${file.name}`
      };

      const updatedMovements = [
        ...shipment.movements,
        {
          id: `mvt-att-${Date.now()}`,
          timestamp,
          location: shipment.origin,
          activity: computedType === 'photo' ? 'Photo Attached' : 'Document Attested',
          description: `Uploaded reference ${computedType === 'photo' ? 'photo' : 'document'}: ${file.name} (${sizeStr})`
        }
      ];

      const updatedShipment: Shipment = {
        ...shipment,
        attachments: updatedAttachments,
        movements: updatedMovements,
        auditLogs: [...(shipment.auditLogs || []), generatedLog]
      };

      onUpdateShipment(updatedShipment);
    };

    reader.readAsDataURL(file);
  };

  const handleDeleteAttachment = (attId: string, attName: string) => {
    if (!shipment || !onUpdateShipment) return;
    if (!window.confirm(`Discard reference file association: "${attName}"?`)) {
      return;
    }

    const currentAttachments = shipment.attachments || [];
    const updatedAttachments = currentAttachments.filter((a) => a.id !== attId);
    
    const timestamp = new Date().toISOString();
    const generatedLog: ShipmentLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp,
      updatedBy: 'Dispatcher Administrator',
      changes: `Discarded attachment: ${attName}`
    };

    const updatedMovements = [
      ...shipment.movements,
      {
        id: `mvt-att-del-${Date.now()}`,
        timestamp,
        location: shipment.origin,
        activity: 'Attachment Discarded',
        description: `Removed reference file association: ${attName}`
      }
    ];

    const updatedShipment: Shipment = {
      ...shipment,
      attachments: updatedAttachments,
      movements: updatedMovements,
      auditLogs: [...(shipment.auditLogs || []), generatedLog]
    };

    onUpdateShipment(updatedShipment);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach((file: any) => {
        handleAddAttachment(file);
      });
    }
  };

  const totalCharges = shipment.charges.reduce((sum, ch) => sum + ch.amount, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-6">
      
      {/* Detail Block Header */}
      <div className="bg-slate-900 text-white p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 rounded-full bg-indigo-500/15 blur-2xl"></div>
        <div className="relative z-10 space-y-1">
          <span className="text-[10px] font-mono tracking-widest text-indigo-400 font-bold uppercase">CONSIGNMENT TRACKING DETAILS</span>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-white font-mono">{shipment.awb}</h1>
              <button
                type="button"
                onClick={startEditingShipment}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/15 text-[10px] font-bold text-white rounded-lg flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm"
                title="Edit shipment parameters"
              >
                <Edit className="w-3.5 h-3.5 text-indigo-300" />
                <span>Edit Cargo</span>
              </button>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-sans tracking-wide uppercase ${
              shipment.status === 'Delivered' ? 'bg-indigo-500/25 text-indigo-300' :
              shipment.status === 'Released' || shipment.status === 'Cleared' ? 'bg-emerald-500/25 text-emerald-300' :
              shipment.status === 'Out for Delivery' ? 'bg-amber-500/25 text-amber-300' :
              shipment.status === 'INCOMING' ? 'bg-blue-500/30 text-blue-300' :
              shipment.status === 'RECEIVED' ? 'bg-teal-500/30 text-teal-300 font-extrabold' :
              shipment.status === 'DISPATCHING' ? 'bg-violet-500/30 text-violet-300' :
              shipment.status === 'CONNECTED ON BOARD' ? 'bg-fuchsia-500/30 text-fuchsia-300 font-extrabold' : 'bg-slate-500/25 text-slate-350'
            }`}>
              {shipment.status}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
            <p>Po Reference: <span className="font-mono text-slate-200 font-semibold">{shipment.poNumber}</span></p>
            <span className="text-slate-600">•</span>
            <p>Mode: <span className="text-amber-400 font-mono font-bold uppercase">{shipment.shipmentMode || 'A/F'}</span></p>
            <span className="text-slate-600">•</span>
            <p>Client: <span className="text-indigo-300 font-bold uppercase tracking-wide">{shipment.clientName}</span></p>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6 pb-6">
        {/* Core Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 border-b border-slate-100 pb-5 text-xs">
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/60 border border-indigo-100 p-2.5 rounded-xl shadow-xs text-center col-span-1 sm:col-span-2 md:col-span-1">
            <span className="block text-indigo-700 text-[9.5px] uppercase font-extrabold tracking-wider">🚢 Connecting Vessel</span>
            <span className="font-extrabold text-[13px] text-indigo-950 block truncate mt-0.5" title={shipment.vesselName}>{shipment.vesselName}</span>
          </div>
          <div>
            <span className="block text-slate-400 text-[10px] uppercase font-bold">Landed Weight</span>
            <span className="font-semibold text-slate-800 font-mono text-indigo-700 font-bold">{shipment.weight.toLocaleString()} kg</span>
          </div>
          <div>
            <span className="block text-slate-400 text-[10px] uppercase font-bold">Total Packages</span>
            <span className="font-semibold text-slate-800 font-mono text-indigo-700 font-bold">{totalPieces.toLocaleString()} pkgs</span>
          </div>
          <div>
            <span className="block text-slate-400 text-[10px] uppercase font-bold">Physical Route</span>
            <span className="font-semibold text-slate-800 text-[11px]">{shipment.origin} → {shipment.destination}</span>
          </div>
          <div>
            <span className="block text-slate-400 text-[10px] uppercase font-bold">Shipment Mode</span>
            <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded font-mono text-[10px] inline-block uppercase mt-0.5">{shipment.shipmentMode || 'A/F'}</span>
          </div>
          <div className="sm:col-span-1">
            <span className="block text-slate-400 text-[10px] uppercase font-bold">Package Dimensions</span>
            <span className="font-semibold text-slate-800 font-mono">
              {shipment.dimensions.length}×{shipment.dimensions.width}×{shipment.dimensions.height} cm
            </span>
          </div>
          <div>
            <span className="block text-slate-400 text-[10px] uppercase font-bold">Cargo Cube Volume</span>
            <span className="font-semibold text-slate-800 font-mono">{standardVolumeCbm.toFixed(3)} m³</span>
          </div>
          <div>
            <span className="block text-slate-400 text-[10px] uppercase font-bold">Volumetric Weight</span>
            <span className="font-semibold text-indigo-600 font-mono">{volumetricWeight.toFixed(1)} kg-v</span>
          </div>
        </div>

        {/* Supplier & Cargo Description Infobox */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 border border-slate-150 p-4 rounded-xl text-xs">
          <div>
            <span className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1 tracking-wider font-mono">
              Supplier Name
            </span>
            <p className="font-semibold text-slate-800">
              {shipment.supplierName || <span className="text-slate-400 italic">Not Specified</span>}
            </p>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-extrabold text-slate-400 mb-1 tracking-wider font-mono">
              Cargoes Description
            </span>
            <p className="font-semibold text-slate-800 leading-relaxed">
              {shipment.cargoDescription || <span className="text-slate-400 italic">No description provided</span>}
            </p>
          </div>
        </div>

        {/* Cargo & PO Breakdown Section */}
        <div className="border border-slate-200 p-5 rounded-2xl bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ScrollText className="w-4 h-4 text-indigo-500" />
              Consigned Cargo Items & PO Breakdown
            </h3>
            <button
              type="button"
              onClick={() => setShowAddCargoItem(!showAddCargoItem)}
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-[10.5px] font-bold text-indigo-650 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 text-xs"
            >
              <Plus className="w-3.5 h-3.5 animate-pulse" />
              <span>{showAddCargoItem ? 'Cancel Line' : 'Add Cargo Line'}</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-450 leading-normal">
            This Air Waybill consolidates individual cargo items belonging to multiple purchase orders (PO#). Adding, editing, or deleting lines automatically recalculates and synchronizes overall gross weight, bounding dimensions, and description summaries.
          </p>

          {/* Add Cargo Item Inline Form */}
          {showAddCargoItem && (
            <form onSubmit={handleAddCargoItem} className="bg-slate-50 border border-indigo-100 p-4 rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-150 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-indigo-700 uppercase tracking-wider text-[10px] font-mono border-b border-indigo-100/55 pb-1.5 mb-2">
                <Plus className="w-3.5 h-3.5 text-indigo-500" />
                <span>Append New Cargo Item / PO Ref</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-450 font-bold uppercase mb-0.5">PO Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PO-98402"
                    value={newItemPoNumber}
                    onChange={(e) => setNewItemPoNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-450 font-bold uppercase mb-0.5">Pieces (Count)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newItemPieces}
                    onChange={(e) => setNewItemPieces(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-450 font-bold uppercase mb-0.5">Gross Weight (kg)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newItemWeight}
                    onChange={(e) => setNewItemWeight(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-450 font-bold uppercase mb-0.5">Package Dimensions (L x W x H in cm)</label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-mono">L:</span>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newItemLength}
                      onChange={(e) => setNewItemLength(Number(e.target.value))}
                      className="w-full px-2 py-1 border border-slate-250 bg-white rounded-lg text-center text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-mono">W:</span>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newItemWidth}
                      onChange={(e) => setNewItemWidth(Number(e.target.value))}
                      className="w-full px-2 py-1 border border-slate-250 bg-white rounded-lg text-center text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-mono">H:</span>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newItemHeight}
                      onChange={(e) => setNewItemHeight(Number(e.target.value))}
                      className="w-full px-2 py-1 border border-slate-250 bg-white rounded-lg text-center text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-450 font-bold uppercase mb-0.5">Item Cargo Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Copper pipeline couplers, digital heat relays"
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1 border-t border-indigo-100/50 mt-1">
                <button
                  type="button"
                  onClick={() => setShowAddCargoItem(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Confirm Cargo Item
                </button>
              </div>
            </form>
          )}

          {/* Cargo Items List View & Inline Edit forms */}
          <div className="space-y-2">
            {ensureCargoItemsArray().map((item, idx) => {
              const isEditingThisItem = editingCargoItemId === item.id;
              const itemCbm = (item.dimensions.length * item.dimensions.width * item.dimensions.height * (item.pieces || 1)) / 1000000;
              const itemVolWeight = (item.dimensions.length * item.dimensions.width * item.dimensions.height * (item.pieces || 1)) / 5000;

              if (isEditingThisItem) {
                return (
                  <div key={item.id} className="p-3 border-2 border-indigo-500 bg-white rounded-xl space-y-3 shadow-md animate-in scale-95 duration-100 text-xs">
                    <div className="flex items-center justify-between font-bold text-indigo-700 uppercase tracking-wider text-[10px] font-mono border-b border-indigo-150 pb-1">
                      <span>Edit Cargo Line {idx + 1}</span>
                      <span className="text-slate-400 font-normal font-sans">ID: {item.id}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-450 font-bold uppercase mb-0.5">PO Number</label>
                        <input
                          type="text"
                          value={editCargoItemPo}
                          onChange={(e) => setEditCargoItemPo(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-indigo-200 bg-slate-50 rounded-lg text-xs font-semibold text-slate-850"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-450 font-bold uppercase mb-0.5">Pieces</label>
                        <input
                          type="number"
                          min="1"
                          value={editCargoItemPieces}
                          onChange={(e) => setEditCargoItemPieces(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-indigo-200 bg-slate-50 rounded-lg text-xs font-semibold text-slate-850 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-450 font-bold uppercase mb-0.5">Weight (kg)</label>
                        <input
                          type="number"
                          min="1"
                          value={editCargoItemWeight}
                          onChange={(e) => setEditCargoItemWeight(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-indigo-200 bg-slate-50 rounded-lg text-xs font-semibold text-slate-850 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] text-slate-450 font-bold uppercase mb-0.5">Dimensions (L x W x H in cm)</span>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="number"
                          value={editCargoItemLength}
                          onChange={(e) => setEditCargoItemLength(Number(e.target.value))}
                          className="w-full px-2 py-1 border border-indigo-200 rounded-lg text-center text-xs font-mono"
                        />
                        <input
                          type="number"
                          value={editCargoItemWidth}
                          onChange={(e) => setEditCargoItemWidth(Number(e.target.value))}
                          className="w-full px-2 py-1 border border-indigo-200 rounded-lg text-center text-xs font-mono"
                        />
                        <input
                          type="number"
                          value={editCargoItemHeight}
                          onChange={(e) => setEditCargoItemHeight(Number(e.target.value))}
                          className="w-full px-2 py-1 border border-indigo-200 rounded-lg text-center text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-450 font-bold uppercase mb-0.5">Description</label>
                      <input
                        type="text"
                        value={editCargoItemDesc}
                        onChange={(e) => setEditCargoItemDesc(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-indigo-200 rounded-lg text-xs font-semibold text-slate-850"
                      />
                    </div>

                    <div className="flex justify-end gap-2 border-t border-indigo-50 pt-2">
                      <button
                        type="button"
                        onClick={cancelEditingCargoItem}
                        className="px-3 py-1 bg-slate-150 hover:bg-slate-200 rounded-lg text-xs font-semibold cursor-pointer text-slate-705"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveCargoItemEdit(item.id)}
                        className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                      >
                        Apply Changes
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className="p-3 bg-slate-50/50 hover:bg-slate-100/50 border border-slate-200 hover:border-slate-350 rounded-xl transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group text-xs text-slate-800"
                >
                  <div className="space-y-1 w-full min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 font-mono text-[11px] bg-white border border-slate-250 py-0.5 px-2 rounded-md">
                        PO: {item.poNumber}
                      </span>
                      <span className="font-mono text-[10.5px] text-slate-500 font-semibold">
                        ({item.pieces || 1} pkg)
                      </span>
                      <span className="text-slate-300 font-normal text-[10px]">•</span>
                      <span className="font-bold text-indigo-650 font-mono text-[11px]">
                        {item.weight?.toLocaleString()} kg
                      </span>
                      <span className="text-slate-300 font-normal text-[10px]">•</span>
                      <span className="text-slate-500 font-mono text-[10.5px]">
                        {item.dimensions?.length}x{item.dimensions?.width}x{item.dimensions?.height} cm
                      </span>
                      <span className="text-slate-400 text-[10px] font-medium font-mono">
                        ({itemCbm.toFixed(3)} m³ | {itemVolWeight.toFixed(1)} kg-v)
                      </span>
                    </div>
                    <p className="font-semibold text-slate-650 truncate text-[11.5px] max-w-full">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 mt-1 sm:mt-0 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => startEditingCargoItem(item)}
                      className="p-1 px-2 text-[10.5px] text-slate-500 hover:text-indigo-655 hover:bg-white rounded-lg font-bold border border-transparent hover:border-slate-200 transition-all flex items-center gap-1 cursor-pointer"
                      title="Edit cargo specifications"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    {shipment.cargoItems && shipment.cargoItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCargoItem(item.id, item.description)}
                        className="p-1 px-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                        title="Delete cargo line"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Warehouse Storage & Quick Stock Transfer */}
        <div id="warehouse-transfer-section" className="bg-indigo-50/20 border border-indigo-100/80 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3 text-xs">
              <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shadow-sm shrink-0">
                <Building className="w-5 h-5" />
              </span>
              <div>
                <span className="block text-[10px] uppercase font-bold text-indigo-700 font-mono tracking-wider">Current Depot Location</span>
                <span className="font-bold text-slate-900 text-sm block mt-0.5">
                  {currentWarehouse ? `${currentWarehouse.name} (${currentWarehouse.code})` : 'Dispatched / In Ocean Transit (Loose Cargo)'}
                </span>
                {currentWarehouse ? (
                  <span className="block text-[11px] text-slate-500 font-medium mt-1">{currentWarehouse.address}, {currentWarehouse.city}, {currentWarehouse.country}</span>
                ) : (
                  <span className="block text-[11px] text-slate-500 font-medium mt-1">This cargo is currently loose, in maritime transit, or out on dispatch delivery.</span>
                )}
              </div>
            </div>

            {onTransferWarehouse && (
              <div className="bg-white p-3.5 border border-slate-150 rounded-xl space-y-2.5 sm:max-w-xs w-full shadow-xs">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 uppercase font-mono tracking-wider">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                  <span>Transfer Warehouse Stock</span>
                </div>
                
                <div className="space-y-2">
                  <select
                    value={shipment.currentWarehouseId || ''}
                    onChange={(e) => {
                      const targetId = e.target.value === '' ? null : e.target.value;
                      const fromLabel = currentWarehouse ? currentWarehouse.code : 'Transit';
                      const toWh = warehouses.find(wh => wh.id === targetId);
                      const toLabel = toWh ? toWh.code : 'Ocean Transit';
                      if (window.confirm(`Initiate stock relocation of Cargo ${shipment.awb} from [${fromLabel}] into hub [${toLabel}]?\n\nThis automatically adds an interactive reallocation movement audit log, and embeds a standard handling surcharge.`)) {
                        onTransferWarehouse(shipment.id, targetId);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-205 py-2 px-3 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="">-- Ocean Transit / Loose Cargo --</option>
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id} disabled={wh.id === shipment.currentWarehouseId}>
                        {wh.name} ({wh.code}) {wh.id === shipment.currentWarehouseId ? '• Stored Here' : ''}
                      </option>
                    ))}
                  </select>

                  <div className="text-[9.5px] text-slate-450 leading-normal flex items-start gap-1">
                    <span className="text-amber-500">⚡</span>
                    <span>Relocating inventory re-routes physical tracking and embeds a <strong>$115.00 Handling & Sorting Surcharge</strong>.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {currentWarehouse && warehouses.length > 1 && (
            <div className="bg-indigo-500/5 px-4 py-2.5 rounded-lg border border-indigo-500/10 flex flex-wrap items-center gap-2 text-[11px] text-indigo-800 font-medium">
              <span className="font-bold uppercase tracking-wider font-mono text-[9px] bg-indigo-500/10 px-1.5 py-0.5 rounded text-indigo-700">Relocation Route:</span>
              <span>{currentWarehouse.code} ({currentWarehouse.city})</span>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-500 italic">Select a target depot in the selector block above to dispatch.</span>
            </div>
          )}
        </div>

        {/* Chronological Movements Timeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Timer className="w-4 h-4 text-slate-400" />
              Chronological Movements Logs
            </h3>
            <button
              onClick={() => setShowAddMov(!showAddMov)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer transition-colors"
            >
              {showAddMov ? 'Close Logger' : '+ Custom Movement'}
            </button>
          </div>

          {/* Add custom movement */}
          {showAddMov && (
            <form onSubmit={handleAddMovementSubmit} className="p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-200 text-xs animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Activity Action</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Customs Clearance Finished"
                    value={movementActivity}
                    onChange={(e) => setMovementActivity(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Port/Terminal Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Oakland Port Gate 2"
                    value={movementLocation}
                    onChange={(e) => setMovementLocation(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Remarks / Detail Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Documents scanned and custom clearance taxes paid fully."
                  value={movementDesc}
                  onChange={(e) => setMovementDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-1 px-1">
                <button
                  type="button"
                  onClick={() => setShowAddMov(false)}
                  className="px-2.5 py-1 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Post Logs
                </button>
              </div>
            </form>
          )}

          {/* Timeline Nodes */}
          <div className="relative pl-6 space-y-4 border-l border-slate-100 ml-3">
            {shipment.movements.slice().sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((mov, index) => (
              <div key={mov.id} className="relative">
                {/* Visual marker */}
                <span className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center z-10 ${
                  index === 0 ? 'border-indigo-500 scale-110 shadow-sm shadow-indigo-500/30' : 'border-slate-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${index === 0 ? 'bg-indigo-500' : 'bg-slate-300'}`}></span>
                </span>

                <div className="text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="font-semibold text-slate-800">{mov.activity}</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {new Date(mov.timestamp).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">{mov.location}</div>
                  <p className="text-[11.5px] text-slate-600 mt-1 leading-relaxed bg-slate-50/50 p-2.5 rounded-lg border border-slate-150">
                    {mov.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AWB Reference Documents and Cargo Photos */}
        <div className="border-t border-slate-150 pt-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Paperclip className="w-4 h-4 text-slate-400" />
              AWB Documents & Photos
            </h3>
            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
              {(shipment.attachments || []).length} Attached
            </span>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all relative ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                : 'border-slate-205 bg-slate-50/50 hover:bg-slate-50/80 hover:border-slate-350'
            }`}
          >
            <input
              id="document-upload-input"
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.rtf,.xml,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  Array.from(e.target.files).forEach((file: any) => {
                    handleAddAttachment(file, 'document');
                  });
                }
              }}
            />
            <input
              id="photo-upload-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  Array.from(e.target.files).forEach((file: any) => {
                    handleAddAttachment(file, 'photo');
                  });
                }
              }}
            />

            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-extrabold text-indigo-500 font-mono tracking-wider mb-2">
                AWB Files Integration Suite
              </span>
              <h4 className="font-bold text-slate-800 text-xs mb-4">
                Drag any transport document & photo here, or select specific category below:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
                <label
                  htmlFor="document-upload-input"
                  className="bg-white hover:bg-indigo-50/20 border border-slate-200 hover:border-indigo-200 p-4 rounded-xl flex flex-col items-center text-center gap-2 cursor-pointer transition-all active:scale-95 text-xs shadow-xs"
                >
                  <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-650">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-850">Upload Cargo Document</p>
                    <p className="text-[9px] text-slate-450 mt-0.5">Commercial Invoice, Packing List, BL Copy, Customs Docket</p>
                  </div>
                </label>

                <label
                  htmlFor="photo-upload-input"
                  className="bg-white hover:bg-amber-50/20 border border-slate-200 hover:border-amber-200 p-4 rounded-xl flex flex-col items-center text-center gap-2 cursor-pointer transition-all active:scale-95 text-xs shadow-xs"
                >
                  <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700">
                    <Image className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-850">Upload Cargo Photo</p>
                    <p className="text-[9px] text-slate-450 mt-0.5">Physical Cargo damage records, Pallet condition, loading layout</p>
                  </div>
                </label>
              </div>

              <p className="text-[10px] text-slate-450 mt-4 font-mono">
                Drag-and-drop auto-identifies category based on file suffix (Max 15MB)
              </p>
            </div>
          </div>

          {/* Attachments List */}
          {(!shipment.attachments || shipment.attachments.length === 0) ? (
            <div className="text-center py-6 bg-slate-50/30 rounded-xl border border-dashed border-slate-200 text-xs text-slate-450 italic px-4">
              <p>No reference files or cargo photos have been attached to this AWB yet.</p>
              <p className="text-[10px] mt-1 text-slate-400 not-italic">Upload important shipment credentials to keep your team & clients aligned.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {shipment.attachments.map((att) => {
                const isPhoto = att.type === 'photo';
                return (
                  <div
                    key={att.id}
                    className="p-3 bg-white border border-slate-205 hover:border-slate-350 rounded-xl flex items-center justify-between gap-3 group/item transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Image Thumbnail or File Icon */}
                      {isPhoto ? (
                        <div
                          onClick={() => {
                            setActivePreviewUrl(att.url);
                            setActivePreviewName(att.name);
                            setActivePreviewType('photo');
                          }}
                          className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 cursor-zoom-in relative group/thumb"
                        >
                          <img
                            src={att.url}
                            alt={att.name}
                            className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-200"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity text-white">
                            <Eye className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setActivePreviewUrl(att.url);
                            setActivePreviewName(att.name);
                            setActivePreviewType('document');
                          }}
                          className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100/70 text-indigo-600 flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-indigo-100 transition-colors"
                          title="View document particulars"
                        >
                          <FileText className="w-5 h-5" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <p
                          className="font-bold text-slate-800 text-[11px] truncate cursor-pointer hover:text-indigo-600"
                          onClick={() => {
                            setActivePreviewUrl(att.url);
                            setActivePreviewName(att.name);
                            setActivePreviewType(isPhoto ? 'photo' : 'document');
                          }}
                        >
                          {att.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-[9.5px] text-slate-400 font-semibold mt-0.5">
                          <span className="font-mono">{att.size || 'N/A'}</span>
                          <span>•</span>
                          <span className="capitalize">{att.type}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Action buttons */}
                      <button
                        type="button"
                        onClick={() => {
                          setActivePreviewUrl(att.url);
                          setActivePreviewName(att.name);
                          setActivePreviewType(isPhoto ? 'photo' : 'document');
                        }}
                        className="p-1 px-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-105 transition-all font-bold text-[10px] flex items-center gap-1 shrink-0 cursor-pointer"
                        title="Open file preview"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {att.url && att.url !== '#' && (
                        <a
                          href={att.url}
                          download={att.name}
                          className="p-1 px-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-105 transition-all font-bold text-[10px] flex items-center gap-1 shrink-0 cursor-pointer"
                          title="Download file"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(att.id, att.name)}
                        className="p-1 px-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all shrink-0 cursor-pointer"
                        title="Remove attachment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity billing and embeds */}
        <div className="border-t border-slate-150 pt-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Activity Billing Auditing
          </h3>

          {/* Current Charges list customized into a stunning Service Charges card */}
          <div className="bg-slate-900 text-white rounded-xl p-5 shadow-md border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Embedded Charges Summary</span>
              <span className="text-[10px] font-mono text-slate-400">{shipment.charges.length} Line Items</span>
            </div>

            {shipment.charges.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                No active service charges have been embedded yet.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {shipment.charges.map((ch) => {
                  const hasTax = ch.taxRate !== undefined && ch.taxRate > 0;
                  const finalTotal = ch.totalAmount ?? (ch.amount + (ch.taxAmount ?? 0));
                  return (
                    <div key={ch.id} className="p-3 bg-slate-800/15 rounded-lg border border-slate-800/85 flex justify-between items-center text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">{ch.type} Charge</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                            ch.status === 'Paid' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/10' :
                            ch.status === 'Invoiced' ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/10' :
                            'bg-amber-500/15 text-amber-305 border border-amber-500/10'
                          }`}>
                            {ch.status}
                          </span>
                        </div>
                        <div className="text-[10.5px] text-slate-400 mt-0.5">
                          {ch.description}
                        </div>
                        {hasTax && (
                          <div className="text-[9.5px] text-indigo-300 mt-1 font-mono">
                            Base: ${ch.amount.toFixed(2)} | Tax ({ch.taxRate}%): ${ch.taxAmount?.toFixed(2)}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white font-mono text-xs">${finalTotal.toFixed(2)}</span>
                        <span className="block text-[9px] text-slate-500 font-mono mt-0.5">
                          {new Date(ch.dateAdded).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Custom calculation of subtotal, tax amount, and total with tax */}
            {(() => {
              const totalBase = shipment.charges.reduce((sum, c) => sum + c.amount, 0);
              const totalTax = shipment.charges.reduce((sum, c) => sum + (c.taxAmount ?? 0), 0);
              const totalWithTax = shipment.charges.reduce((sum, c) => sum + (c.totalAmount ?? c.amount), 0);
              return (
                <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs text-right">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="uppercase text-[9px] tracking-wider font-sans">Base Subtotal:</span>
                    <span className="font-mono">${totalBase.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="uppercase text-[9px] tracking-wider font-sans">Tax Surcharge:</span>
                    <span className="font-mono text-indigo-300">${totalTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-850 pt-2 font-bold text-white">
                    <span className="uppercase text-[10px] tracking-widest text-indigo-400 font-mono">Audit Invoice Total:</span>
                    <span className="text-emerald-400 font-mono text-base">${totalWithTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Embed charge Form */}
          <form onSubmit={handleEmbedCharge} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3.5 text-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-indigo-700 uppercase">
              <span className="flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Embed Custom Service Charge
              </span>
              {(() => {
                const client = shipment.clientName;
                const activeOverride = overrides.find(o => o.clientName === client && o.chargeName === chargeType);
                if (activeOverride) {
                  return (
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[9px] font-bold lowercase">
                      ⭐ client override rate applied
                    </span>
                  );
                }
                return null;
              })()}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Standard Charge Activity</label>
                <select
                  value={chargeType}
                  onChange={(e) => setChargeType(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 outline-none"
                >
                  {tariffs.length > 0 ? (
                    tariffs.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} ({t.description.length > 30 ? `${t.description.substring(0, 30)}...` : t.description})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Clearance">Clearance fee</option>
                      <option value="Delivery">Delivery fee</option>
                      <option value="Re-export">Re-export cargo fee</option>
                      <option value="Release">Release document fee</option>
                      <option value="Handling">Handling pallet fee</option>
                      <option value="Storage">Yard Storage fee</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Filing Fee Amount ($)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Tax Surcharge (%)</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.1"
                  value={chargeTaxRate}
                  onChange={(e) => setChargeTaxRate(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Billing Description & Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Inbound Customs entry #C-901 filings audit."
                  value={chargeDesc}
                  onChange={(e) => setChargeDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Billing Status</label>
                <select
                  value={chargeStatus}
                  onChange={(e) => setChargeStatus(e.target.value as Charge['status'])}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 outline-none"
                >
                  <option value="Pending">Unbilled / Pending</option>
                  <option value="Invoiced">Invoiced</option>
                  <option value="Paid">Received / Paid</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer text-xs transition-colors shadow-sm shadow-indigo-500/10"
            >
              Post Activity Surcharge (Total: ${(chargeAmount + (chargeAmount * chargeTaxRate / 100)).toFixed(2)})
            </button>
          </form>
        </div>

        {/* Shipment Updates Audit Logs (Factor Update Log) */}
        <div className="border-t border-slate-150 pt-5 space-y-4 text-left">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-4 h-4 text-slate-500 font-bold" />
            Consignment Modification Audit Trails
          </h3>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="text-[10px] text-slate-400 font-medium font-mono uppercase tracking-wider">
              Recorded Updates: {shipment.auditLogs?.length || 0} modifications
            </div>

            {!shipment.auditLogs || shipment.auditLogs.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs italic">
                No factor adjustments or modifications have been recorded yet for this consignment docket.
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {shipment.auditLogs.slice().reverse().map((log) => (
                  <div key={log.id} className="p-3 bg-white border border-slate-150 rounded-xl flex items-start gap-2.5 text-xs">
                    <span className="p-1 rounded bg-indigo-50 text-indigo-600 mt-0.5 shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 leading-normal">{log.changes}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 font-medium font-mono">
                        <span>By: {log.updatedBy}</span>
                        <span>•</span>
                        <span>
                          {new Date(log.timestamp).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Lightbox / File Preview Modal */}
      {activePreviewUrl && (
        <div className="fixed inset-0 z-55 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 text-slate-800 text-left flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                {activePreviewType === 'photo' ? (
                  <Image className="w-5 h-5 text-indigo-400" />
                ) : (
                  <FileText className="w-5 h-5 text-indigo-400" />
                )}
                <div>
                  <h3 className="font-bold text-xs font-mono tracking-tight">{activePreviewName}</h3>
                  <p className="text-[10px] text-slate-400 font-sans">AWB File Preview • Authorized Personnel Access Only</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActivePreviewUrl(null);
                  setActivePreviewName(null);
                  setActivePreviewType(null);
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
                title="Close preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 bg-slate-950/5 flex items-center justify-center min-h-[300px] max-h-[60vh] overflow-auto">
              {activePreviewType === 'photo' ? (
                <img
                  src={activePreviewUrl}
                  alt={activePreviewName || 'Preview'}
                  className="max-h-[50vh] max-w-full object-contain rounded-lg shadow-md border border-slate-200"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full bg-white rounded-xl border border-slate-200 p-8 shadow-sm max-w-md text-center space-y-4">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-850 text-sm">{activePreviewName}</h4>
                    <p className="text-[11px] text-slate-500 mt-1">Official Digital Reference Record Document</p>
                  </div>
                  
                  {activePreviewUrl && activePreviewUrl.startsWith('data:') ? (
                    <div className="bg-slate-50 border border-slate-150 p-3 rounded-lg text-left">
                      <p className="text-[9.5px] font-mono font-bold text-slate-400 uppercase tracking-widest border-b border-slate-150 pb-1.5 mb-1.5">File Metadata</p>
                      <div className="grid grid-cols-2 gap-y-1 text-[10.5px] font-medium text-slate-600">
                        <span>Format Mime:</span>
                        <span className="font-mono text-right font-semibold text-slate-800 truncate">{activePreviewUrl.substring(5, activePreviewUrl.indexOf(';'))}</span>
                        <span>Encoding:</span>
                        <span className="font-mono text-right font-semibold text-slate-800">Base64 Binary Stream</span>
                        <span>Source Integrity:</span>
                        <span className="text-right text-emerald-650 font-semibold flex items-center justify-end gap-1">Validated ✓</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 bg-slate-50 p-3 border border-slate-150 rounded-lg">
                      External reference link document. Live browser sandboxed pdf viewer simulated.
                    </div>
                  )}

                  <div className="pt-2 flex justify-center gap-2">
                    {activePreviewUrl && activePreviewUrl !== '#' && (
                      <a
                        href={activePreviewUrl}
                        download={activePreviewName || 'document'}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Original Resource</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setActivePreviewUrl(null);
                        setActivePreviewName(null);
                        setActivePreviewType(null);
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-605 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Edit overlay Modal */}
      {isEditingShipment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 text-slate-800 text-left">
            <div className="bg-slate-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-mono text-sm font-bold">Edit Consignment Particulars</h3>
                  <p className="text-[10px] text-slate-400 font-sans mt-0.5">AWB: {shipment.awb} | Client: {shipment.clientName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingShipment(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={saveShipmentChanges} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Row 1: AWB & PO */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Airway Bill (AWB) # <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editAwb}
                    onChange={(e) => setEditAwb(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs font-mono font-semibold text-slate-850 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Customer PO Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editPoNumber}
                    onChange={(e) => setEditPoNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs font-mono font-semibold text-slate-850 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Row 2: Client pairing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Associated Customer Partner <span className="text-rose-500">*</span>
                  </label>
                  {customers.length === 0 ? (
                    <div className="p-2 border border-rose-200 bg-rose-50 rounded-lg text-[10px] text-rose-700 font-semibold">
                      No customer accounts active!
                    </div>
                  ) : (
                    <select
                      required
                      value={editClientName}
                      onChange={(e) => {
                        setEditClientName(e.target.value);
                        // Reset vessel when customer changes so they choose a valid matching one
                        setEditVesselName('');
                      }}
                      className="w-full px-3.5 py-2 border border-slate-250 rounded-lg text-xs bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer font-semibold"
                    >
                      {customers.map((c) => (
                        <option key={c.id} value={c.name} disabled={c.status !== 'Active'}>
                          {c.name} ({c.code}){c.status !== 'Active' ? ' (Inactive)' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Anchor className="w-3.5 h-3.5 text-slate-400 font-bold" /> Associated Vessel <span className="text-rose-500">*</span>
                  </label>
                  {!editClientName ? (
                    <div className="p-2 border border-slate-200 bg-slate-50 rounded-lg text-xs text-slate-400">
                      Select customer first...
                    </div>
                  ) : vessels.filter(v => v.clientName === editClientName && v.status === 'Active').length === 0 ? (
                    <div className="p-2 border border-amber-200 bg-amber-50 rounded-lg text-[10px] font-semibold text-amber-800">
                      No vessels active under this customer! Direct typing below enabled.
                    </div>
                  ) : (
                    <select
                      required
                      value={editVesselName}
                      onChange={(e) => setEditVesselName(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-250 rounded-lg text-xs bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer font-semibold"
                    >
                      <option value="">-- Select fleet vessel --</option>
                      {vessels
                        .filter(v => v.clientName === editClientName && v.status === 'Active')
                        .map(v => (
                          <option key={v.id} value={v.name}>{v.name} ({v.imo})</option>
                        ))}
                    </select>
                  )}

                  {/* Manual input fallback if no vessels exist under that client */}
                  {(!editVesselName || vessels.filter(v => v.clientName === editClientName && v.status === 'Active').length === 0) && (
                    <input
                      type="text"
                      placeholder="Or enter custom vessel name manually..."
                      value={editVesselName}
                      onChange={(e) => setEditVesselName(e.target.value)}
                      className="w-full mt-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-xs font-semibold placeholder:text-slate-400 outline-none focus:border-indigo-500"
                    />
                  )}
                </div>
              </div>

              {/* Row: Supplier Name & Cargoes Description */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    value={editSupplierName}
                    onChange={(e) => setEditSupplierName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="e.g. Asia Pacific Mfg Ltd"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Cargoes Description
                  </label>
                  <input
                    type="text"
                    value={editCargoDescription}
                    onChange={(e) => setEditCargoDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="e.g. Parts / Machinery"
                  />
                </div>
              </div>

              {/* Row 3: Weight, Mode & Origin Port */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Landed Weight (kg) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editWeight}
                    onChange={(e) => setEditWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs font-mono font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Shipment Mode <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={editShipmentMode}
                    onChange={(e) => setEditShipmentMode(e.target.value as ShipmentMode)}
                    className="w-full px-3 py-2 border border-slate-250 bg-white rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer outline-none"
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
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Port of Origin <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editOrigin}
                    onChange={(e) => setEditOrigin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs font-semibold outline-none"
                  />
                </div>
              </div>

              {/* Row 4: Destination & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Cargo Destination <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editDestination}
                    onChange={(e) => setEditDestination(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs font-semibold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 text-indigo-700 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-indigo-550 mr-0.5" /> Tracking Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as Shipment['status'])}
                    className="w-full px-3 py-2 border border-slate-250 bg-white rounded-lg text-xs font-bold text-slate-850 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer outline-none"
                  >
                    <optgroup label="⚓ Demanded Maritime Statuses">
                      <option value="INCOMING">INCOMING (Vessel on Route)</option>
                      <option value="RECEIVED">RECEIVED (Deconsolidation Complete)</option>
                      <option value="DISPATCHING">DISPATCHING (Final Haulage)</option>
                      <option value="CONNECTED ON BOARD">CONNECTED ON BOARD (Lashed to vessel)</option>
                    </optgroup>
                    <optgroup label="📦 Standard Transit Milestones">
                      <option value="Received">Received at Depot</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Consolidated">Consolidated</option>
                      <option value="Customs Hold">Customs Hold</option>
                      <option value="Cleared">Customs Cleared</option>
                      <option value="Released">Released</option>
                      <option value="Out for Delivery">Out For Delivery</option>
                      <option value="Delivered">Delivered</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Volumetric Dimensions Specifications in cm */}
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3">
                <span className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider font-mono">Volumetric Dimension Specifications (cm)</span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-500 uppercase tracking-widest mb-1">
                      Length (cm)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={editLength}
                      onChange={(e) => setEditLength(Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-250 rounded-lg text-xs font-mono font-medium outline-none text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-500 uppercase tracking-widest mb-1">
                      Width (cm)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={editWidth}
                      onChange={(e) => setEditWidth(Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-250 rounded-lg text-xs font-mono font-medium outline-none text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-500 uppercase tracking-widest mb-1">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={editHeight}
                      onChange={(e) => setEditHeight(Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-250 rounded-lg text-xs font-mono font-medium outline-none text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingShipment(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer uppercase transition-colors"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer uppercase transition-all shadow-sm flex items-center gap-1"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Cargo Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
