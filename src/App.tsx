/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Shipment, 
  ConsolidatedCargo, 
  DriverTask, 
  Charge, 
  Movement,
  Warehouse,
  DeliveryOrder,
  User,
  SecurityLevel,
  Customer,
  Vessel,
  StandardTariff,
  ClientTariffOverride
} from './types';
import { 
  INITIAL_SHIPMENTS, 
  INITIAL_CONSOLIDATIONS, 
  INITIAL_DRIVER_TASKS,
  INITIAL_WAREHOUSES,
  INITIAL_DELIVERY_ORDERS,
  INITIAL_CUSTOMERS,
  INITIAL_VESSELS,
  INITIAL_STANDARD_TARIFFS,
  INITIAL_CLIENT_TARIFF_OVERRIDES
} from './data/mockData';

// Subcomponents
import CreateShipmentModal from './components/CreateShipmentModal';
import DriverSimulation from './components/DriverSimulation';
import ShipmentDetails from './components/ShipmentDetails';
import WarehousePanel from './components/WarehousePanel';
import DeliveryOrderPanel from './components/DeliveryOrderPanel';
import UserManagementPanel from './components/UserManagementPanel';
import CustomerPanel from './components/CustomerPanel';
import VesselPanel from './components/VesselPanel';
import TariffBillingPanel from './components/TariffBillingPanel';
import TrackerDashboard from './components/TrackerDashboard';

// Icons
import { 
  Search, 
  Plus, 
  Truck, 
  ClipboardList, 
  TrendingUp, 
  Scale, 
  Compass, 
  Maximize2, 
  Calculator, 
  AlertCircle,
  Building,
  FileText,
  Download,
  Users,
  Building2,
  Anchor,
  Receipt,
  ArrowUpDown
} from 'lucide-react';

const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Bui Thang (Admin)',
    username: 'buithang',
    email: 'buithang2011@gmail.com',
    securityLevel: 'ADMIN',
    department: 'Logistics Operations',
    isActive: true,
    dateCreated: '2026-05-01T08:00:00Z'
  },
  {
    id: 'usr-2',
    name: 'Sarah Connor',
    username: 'sconnor',
    email: 'sconnor@cargobridge.com',
    securityLevel: 'OPERATOR',
    department: 'Customs Terminal',
    isActive: true,
    dateCreated: '2026-05-15T09:30:00Z'
  },
  {
    id: 'usr-3',
    name: 'John Doe',
    username: 'jdoe',
    email: 'jdoe@cargobridge.com',
    securityLevel: 'VIEWER',
    department: 'Executive Board',
    isActive: true,
    dateCreated: '2026-05-20T14:45:00Z'
  }
];

export default function App() {
  // Application Data States
  const [shipments, setShipments] = useState<Shipment[]>(INITIAL_SHIPMENTS);
  const [consolidations, setConsolidations] = useState<ConsolidatedCargo[]>(INITIAL_CONSOLIDATIONS);
  const [driverTasks, setDriverTasks] = useState<DriverTask[]>(INITIAL_DRIVER_TASKS);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(INITIAL_WAREHOUSES);
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>(INITIAL_DELIVERY_ORDERS);
  
  // Interaction/UI States
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>('shp-1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'tracker' | 'driver' | 'warehouse' | 'delivery_order' | 'users' | 'customers' | 'vessels' | 'billing'>('tracker');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [shipmentModeFilter, setShipmentModeFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'weight_desc' | 'date_newest' | 'client_az'>('weight_desc');

  // Tariff / Billing Surcharge States
  const [tariffs, setTariffs] = useState<StandardTariff[]>(INITIAL_STANDARD_TARIFFS);
  const [overrides, setOverrides] = useState<ClientTariffOverride[]>(INITIAL_CLIENT_TARIFF_OVERRIDES);

  const handleAddTariff = (newTariff: StandardTariff) => {
    setTariffs((prev) => [...prev, newTariff]);
  };

  const handleUpdateTariff = (updatedTariff: StandardTariff) => {
    setTariffs((prev) =>
      prev.map((t) => (t.id === updatedTariff.id ? updatedTariff : t))
    );
  };

  const handleDeleteTariff = (tariffId: string) => {
    const tariff = tariffs.find(t => t.id === tariffId);
    setTariffs((prev) => prev.filter((t) => t.id !== tariffId));
    // Cascade delete overrides for this tariff category
    if (tariff) {
      setOverrides((prev) => prev.filter((o) => o.chargeName !== tariff.name));
    }
  };

  const handleAddOverride = (newOverride: ClientTariffOverride) => {
    setOverrides((prev) => [...prev, newOverride]);
  };

  const handleUpdateOverride = (updatedOverride: ClientTariffOverride) => {
    setOverrides((prev) =>
      prev.map((o) => (o.id === updatedOverride.id ? updatedOverride : o))
    );
  };

  const handleDeleteOverride = (overrideId: string) => {
    setOverrides((prev) => prev.filter((o) => o.id !== overrideId));
  };

  // User management states
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]);

  // Customer account states
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);

  // Vessel fleet states
  const [vessels, setVessels] = useState<Vessel[]>(INITIAL_VESSELS);

  const handleCreateVessel = (newVessel: Vessel) => {
    setVessels((prev) => [...prev, newVessel]);
  };

  const handleDeleteVessel = (vesselId: string) => {
    setVessels((prev) => prev.filter((v) => v.id !== vesselId));
  };

  const handleUpdateVessel = (updatedVessel: Vessel) => {
    setVessels((prev) =>
      prev.map((v) => (v.id === updatedVessel.id ? updatedVessel : v))
    );
  };

  const handleCreateCustomer = (newCustomer: Customer) => {
    setCustomers((prev) => [...prev, newCustomer]);
  };

  const handleDeleteCustomer = (customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
  };

  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c))
    );
  };

  const handleCreateUser = (newUser: User) => {
    setUsers((prev) => [...prev, newUser]);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
  };

  // --- handlers for data actions ---
  const handleAddShipment = (newShipment: Shipment) => {
    setShipments((prev) => [newShipment, ...prev]);
    setSelectedShipmentId(newShipment.id);
  };

  const handleAddCharge = (shipmentId: string, newCharge: Charge) => {
    setShipments((prev) =>
      prev.map((s) => {
        if (s.id === shipmentId) {
          return {
            ...s,
            charges: [...s.charges, newCharge]
          };
        }
        return s;
      })
    );
  };

  const handleAddMovement = (shipmentId: string, activity: string, location: string, description: string) => {
    const newMov: Movement = {
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      location,
      activity,
      description
    };

    setShipments((prev) =>
      prev.map((s) => {
        if (s.id === shipmentId) {
          return {
            ...s,
            movements: [...s.movements, newMov]
          };
        }
        return s;
      })
    );
  };

  const handleUpdateShipment = (updatedShipment: Shipment) => {
    setShipments((prev) =>
      prev.map((s) => (s.id === updatedShipment.id ? updatedShipment : s))
    );
  };

  const handleUpdateShipmentStatus = (shipmentId: string, status: Shipment['status']) => {
    setShipments((prev) =>
      prev.map((s) => {
        if (s.id === shipmentId) {
          return {
            ...s,
            status
          };
        }
        return s;
      })
    );
  };

  // Consolidation actions
  const handleConsolidate = (newConsol: ConsolidatedCargo) => {
    setConsolidations((prev) => [...prev, newConsol]);
    // Update original shipments with link id & shift status
    setShipments((prev) =>
      prev.map((s) => {
        if (newConsol.shipmentIds.includes(s.id)) {
          return {
            ...s,
            consolidationId: newConsol.id,
            status: 'Consolidated',
            movements: [
              ...s.movements,
              {
                id: `mov-con-${Date.now()}`,
                timestamp: new Date().toISOString(),
                location: newConsol.origin,
                activity: 'Consolidated',
                description: `Cargo grouped into master container ${newConsol.containerNumber} for transit on ${newConsol.vesselName}.`
              }
            ]
          };
        }
        return s;
      })
    );
  };

  // Breaking down shipment container (De-consolidation)
  const handleBreakdown = (consolId: string) => {
    const targetConsol = consolidations.find((c) => c.id === consolId);
    if (!targetConsol) return;

    // Remove consolidation structure
    setConsolidations((prev) => prev.filter((c) => c.id !== consolId));

    // Restore Original shipments - set status to "Released" or "Arrived" for release custom dispatch
    setShipments((prev) =>
      prev.map((s) => {
        if (s.consolidationId === consolId) {
          return {
            ...s,
            consolidationId: null,
            status: 'Released',
            movements: [
              ...s.movements,
              {
                id: `mov-bd-${Date.now()}`,
                timestamp: new Date().toISOString(),
                location: targetConsol.destination,
                activity: 'Container Breakdown',
                description: `Freight container ${targetConsol.containerNumber} stripped down. Original cargo extracted for individual local releases and consignee clearance.`
              }
            ]
          };
        }
        return s;
      })
    );
  };

  // Export filtered shipments to Excel (CSV with UTF-8 BOM representation)
  const handleExportToExcel = () => {
    const headers = [
      'AWB Number',
      'Client Name',
      'PO Number',
      'Vessel Name',
      'Weight (kg)',
      'Length (cm)',
      'Width (cm)',
      'Height (cm)',
      'Volume (cm³)',
      'Origin',
      'Destination',
      'Status',
      'Warehouse',
      'Total Surcharges ($)'
    ];

    const rows = filteredShipments.map(s => {
      const warehouseObj = warehouses.find(w => w.id === s.currentWarehouseId);
      const warehouseStr = warehouseObj ? `${warehouseObj.name} (${warehouseObj.code})` : 'N/A';
      const volume = s.dimensions.length * s.dimensions.width * s.dimensions.height;
      const totalCharges = s.charges.reduce((sum, c) => sum + (c.totalAmount ?? c.amount), 0);

      return [
        s.awb,
        s.clientName,
        s.poNumber,
        s.vesselName,
        s.weight,
        s.dimensions.length,
        s.dimensions.width,
        s.dimensions.height,
        volume,
        s.origin,
        s.destination,
        s.status,
        warehouseStr,
        totalCharges
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => {
        const cell = val === null || val === undefined ? '' : String(val);
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n') || cell.includes('\r')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `CargoBridge_Shipments_Export_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Driver actions
  const handleAssignTask = (newTask: DriverTask) => {
    setDriverTasks((prev) => [newTask, ...prev]);
  };

  const handleUpdateTask = (updatedTask: DriverTask) => {
    setDriverTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
  };

  // Warehouse actions
  const handleTransferWarehouse = (shipmentId: string, targetWarehouseId: string | null) => {
    setShipments((prev) =>
      prev.map((s) => {
        if (s.id === shipmentId) {
          const oldWarehouse = warehouses.find((w) => w.id === s.currentWarehouseId);
          const newWarehouse = warehouses.find((w) => w.id === targetWarehouseId);
          
          const oldName = oldWarehouse ? `${oldWarehouse.name} (${oldWarehouse.code})` : 'In Transit / Loose Cargo';
          const newName = newWarehouse ? `${newWarehouse.name} (${newWarehouse.code})` : 'Dispatched / In Transit';
          
          const newMov: Movement = {
            id: `mov-wh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            timestamp: new Date().toISOString(),
            location: newWarehouse ? newWarehouse.name : 'In Transit Detour',
            activity: 'Warehouse Stock Transfer',
            description: `Consignment stock transferred. Formerly housed at: ${oldName}. Now assigned to: ${newName}.`
          };

          // Let's add a dynamic handling/storage fee
          const newCharge: Charge = {
            id: `chg-wh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            type: 'Handling',
            amount: 115.00,
            dateAdded: new Date().toISOString(),
            description: `Stock reallocation fee: ${oldWarehouse?.code || 'External'} to ${newWarehouse?.code || 'External'}.`,
            status: 'Pending'
          };

          return {
            ...s,
            currentWarehouseId: targetWarehouseId,
            movements: [...s.movements, newMov],
            charges: [...s.charges, newCharge]
          };
        }
        return s;
      })
    );
  };

  const handleCreateWarehouse = (newWarehouse: Warehouse) => {
    setWarehouses((prev) => [...prev, newWarehouse]);
  };

  const handleUpdateWarehouse = (updatedWarehouse: Warehouse) => {
    setWarehouses((prev) =>
      prev.map((w) => (w.id === updatedWarehouse.id ? updatedWarehouse : w))
    );
  };

  const handleDeleteWarehouse = (warehouseId: string) => {
    setWarehouses((prev) => prev.filter((w) => w.id !== warehouseId));
  };

  const handleCreateDeliveryOrder = (newDO: DeliveryOrder) => {
    setDeliveryOrders((prev) => [newDO, ...prev]);
    // Tag shipment status to 'In Transit', and add movement updates
    setShipments((prev) =>
      prev.map((s) => {
        if (newDO.shipmentIds.includes(s.id)) {
          return {
            ...s,
            status: 'In Transit',
            movements: [
              ...s.movements,
              {
                id: `mov-do-${Date.now()}`,
                timestamp: new Date().toISOString(),
                location: newDO.deliveryAddress,
                activity: 'Associated with Delivery Order',
                description: `Consigned into multi-cargo delivery order ${newDO.doNumber} to consignee: ${newDO.consignee}.`
              }
            ]
          };
        }
        return s;
      })
    );
  };

  const handleUpdateDeliveryOrderStatus = (doId: string, status: DeliveryOrder['status']) => {
    setDeliveryOrders((prev) => {
      const updated = prev.map((d) => {
        if (d.id === doId) {
          let nextDoNumber = d.doNumber;
          if (status === 'Picked' && d.doNumber.startsWith('PL-')) {
            nextDoNumber = d.doNumber.replace('PL-', 'DO-');
          }
          return { ...d, status, doNumber: nextDoNumber };
        }
        return d;
      });
      const dOrder = updated.find((d) => d.id === doId);
      if (dOrder) {
        // Also cancel associated driver tasks if Cancelled
        if (status === 'Cancelled') {
          setDriverTasks((prevTasks) =>
            prevTasks.map((t) =>
              t.deliveryOrderId === doId && t.status !== 'Delivered'
                ? { ...t, status: 'Cancelled' as const }
                : t
            )
          );
        }

        setShipments((prevShipments) =>
          prevShipments.map((s) => {
            if (dOrder.shipmentIds.includes(s.id)) {
              let updatedStatus: Shipment['status'] = s.status;
              let updatedWHId = s.currentWarehouseId;

              if (status === 'In Transit') {
                updatedStatus = 'In Transit';
              } else if (status === 'Delivered') {
                updatedStatus = 'Delivered';
                updatedWHId = null;
              } else if (status === 'Cancelled') {
                updatedStatus = 'Received'; // return to warehouse stock
                if (!updatedWHId) {
                  const foundWH = warehouses.find(
                    (w) =>
                      dOrder.from.includes(w.id) ||
                      dOrder.from.includes(w.name) ||
                      s.origin.includes(w.id) ||
                      s.origin.includes(w.name)
                  );
                  updatedWHId = foundWH ? foundWH.id : 'WH-SIN';
                }
              }

              return {
                ...s,
                status: updatedStatus,
                currentWarehouseId: updatedWHId,
                movements: [
                  ...s.movements,
                  {
                    id: `mov-do-update-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    timestamp: new Date().toISOString(),
                    location: status === 'Cancelled' ? dOrder.from : dOrder.deliveryAddress,
                    activity: status === 'Delivered' ? 'Delivered' : status === 'Cancelled' ? 'Restored Stock' : status === 'Picked' ? 'Picked' : 'En Route',
                    description: status === 'Cancelled'
                      ? `Delivery Order ${dOrder.doNumber} was CANCELLED. Cargo stock returned and re-shelved at ${dOrder.from}.`
                      : status === 'Picked'
                      ? `Cargo verified and marked as PICKED by the warehouse team for document ${dOrder.doNumber}. Now eligible for dispatch.`
                      : `Delivery Order ${dOrder.doNumber} updated to state: ${status}.`
                  }
                ]
              };
            }
            return s;
          })
        );
      }
      return updated;
    });
  };
  
  const handleAddDeliveryOrderCharge = (doId: string, charge: Charge) => {
    setDeliveryOrders((prev) =>
      prev.map((d) => {
        if (d.id === doId) {
          const currentCharges = d.charges || [];
          return {
            ...d,
            charges: [...currentCharges, charge]
          };
        }
        return d;
      })
    );
  };

  // Filtering shipments
  const filteredShipments = shipments.filter((s) => {
    const query = searchQuery.trim().toLowerCase();
    const matchQuery =
      s.awb.toLowerCase().includes(query) ||
      s.poNumber.toLowerCase().includes(query) ||
      s.vesselName.toLowerCase().includes(query) ||
      s.origin.toLowerCase().includes(query) ||
      s.destination.toLowerCase().includes(query) ||
      s.status.toLowerCase().includes(query) ||
      (s.supplierName || '').toLowerCase().includes(query) ||
      (s.cargoDescription || '').toLowerCase().includes(query) ||
      (s.shipmentMode || 'A/F').toLowerCase().includes(query);

    const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchMode = shipmentModeFilter === 'ALL' || (s.shipmentMode || 'A/F') === shipmentModeFilter;

    return matchQuery && matchStatus && matchMode;
  }).sort((a, b) => {
    if (sortBy === 'weight_desc') {
      return b.weight - a.weight;
    } else if (sortBy === 'date_newest') {
      const getReceivedDate = (s: Shipment): number => {
        // Find earliest timestamp from movements, or fallback to 0
        if (s.movements && s.movements.length > 0) {
          const sortedMovements = [...s.movements].sort((m1, m2) => 
            new Date(m1.timestamp).getTime() - new Date(m2.timestamp).getTime()
          );
          return new Date(sortedMovements[0].timestamp).getTime();
        }
        return 0;
      };
      return getReceivedDate(b) - getReceivedDate(a);
    } else if (sortBy === 'client_az') {
      return a.clientName.localeCompare(b.clientName);
    }
    return 0;
  });

  const activeShipment = shipments.find((s) => s.id === selectedShipmentId) || null;

  // Key KPI stats calculation
  const totalCargoWeight = shipments.reduce((sum, s) => sum + s.weight, 0);
  const totalVolumeCbm = shipments.reduce((sum, s) => {
    return sum + (s.dimensions.length * s.dimensions.width * s.dimensions.height) / 1000000;
  }, 0);
  
  const totalAssignedCharges = shipments.reduce((sum, s) => {
    return sum + s.charges.reduce((cSum, ch) => cSum + (ch.totalAmount ?? ch.amount), 0);
  }, 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-900">
      {/* Top Professional Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold shadow-md shadow-indigo-500/10">
              <Compass className="w-6 h-6 animate-spin-slow text-indigo-100" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">CargoBridge Logistics Suite</h1>
              <p className="text-[11px] text-slate-400 font-mono">Consolidation • Activity Charges • Dispatch</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            {/* Live date-time context box */}
            <div className="text-right hidden md:block">
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Live System Clock (UTC)</span>
              <span className="font-mono text-xs font-semibold text-slate-600">2026-05-30 14:26:54</span>
            </div>
            <button
              id="add-cargo-button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-500/25 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Register Cargo AWB
            </button>
          </div>

        </div>
      </header>

      {/* Primary KPI Stats Summary Band */}
      <section className="bg-slate-900 text-white border-b border-slate-800 px-6 py-5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/30 flex items-center gap-3">
            <span className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <ClipboardList className="w-5 h-5" />
            </span>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Tracked Consignments</span>
              <span className="text-lg font-extrabold font-mono text-white">{shipments.length} <span className="text-xs font-normal text-slate-400">AWB</span></span>
            </div>
          </div>

          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/30 flex items-center gap-3">
            <span className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Scale className="w-5 h-5" />
            </span>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Gross Physical Weight</span>
              <span className="text-lg font-extrabold font-mono text-white">{totalCargoWeight.toLocaleString()} <span className="text-xs font-normal text-slate-400">kg</span></span>
            </div>
          </div>

          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/30 flex items-center gap-3">
            <span className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Maximize2 className="w-5 h-5" />
            </span>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Cubic Freight Volume</span>
              <span className="text-lg font-extrabold font-mono text-white">{totalVolumeCbm.toFixed(2)} <span className="text-xs font-normal text-slate-400">m³</span></span>
            </div>
          </div>

          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/30 flex items-center gap-3">
            <span className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Embedded Bill Surcharges</span>
              <span className="text-lg font-extrabold font-mono text-emerald-400">${totalAssignedCharges.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tab Navigation Bars */}
      <div className="bg-white border-b border-slate-200 shadow-sm px-6">
        <div className="max-w-7xl mx-auto flex items-center space-x-1 py-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('tracker')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'tracker'
                ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50'
            }`}
          >
            <Search className="w-4 h-4" />
            Shipment Tracing Hub
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('driver')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'driver'
                ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50'
            }`}
          >
            <Truck className="w-4 h-4" />
            Last-Mile Dispatch & Driver App Sim
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('warehouse')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'warehouse'
                ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50'
            }`}
          >
            <Building className="w-4 h-4" />
            Warehouse Management Hub
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('delivery_order')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'delivery_order'
                ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            Vessel Delivery Orders
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'customers'
                ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Customers Directory
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'billing'
                ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Tariffs & Billing Hub
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vessels')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'vessels'
                ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50'
            }`}
          >
            <Anchor className="w-4 h-4" />
            Vessels Registry
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4 text-slate-505" />
            Users & Security Controls
          </button>
        </div>
      </div>

      {/* Primary Interactive Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {activeTab === 'tracker' && (
          <div className="space-y-6">
            <TrackerDashboard shipments={shipments} warehouses={warehouses} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT: Master Shipment List (Cols 5) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Manifest Row</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded text-slate-600 font-mono">
                    Showing {filteredShipments.length} of {shipments.length}
                  </span>
                  <button
                    onClick={handleExportToExcel}
                    className="p-1 px-2.5 bg-emerald-50 hover:bg-emerald-100/70 text-emerald-800 rounded-md border border-emerald-250 hover:border-emerald-300 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    title="Export currently filtered shipments to an Excel-compatible document"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Excel Export</span>
                  </button>
                </div>
              </div>

              {/* Filtering Controls */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by AWB, PO#, Vessel, Ports, Mode..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
                  />
                </div>

                <div className="flex flex-wrap gap-1">
                  {['ALL', 'INCOMING', 'RECEIVED', 'DISPATCHING', 'CONNECTED ON BOARD', 'In Transit', 'Consolidated', 'Cleared', 'Released', 'Delivered'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-2 py-1 rounded text-[10px] font-semibold cursor-pointer ${
                        statusFilter === st
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* Shipment Mode Filters select line */}
                <div className="flex flex-wrap gap-1 items-center border-t border-slate-100 pt-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-1.5 font-sans">Shipment Mode:</span>
                  {['ALL', 'A/F', 'COURIER', 'CONSOL', 'LCL', 'FCL', 'LOCAL'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setShipmentModeFilter(mode)}
                      className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold font-mono cursor-pointer transition-colors ${
                        shipmentModeFilter === mode
                          ? 'bg-indigo-600 text-white'
                          : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100/70 border border-indigo-100'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                {/* Sort Order Selector */}
                <div className="flex items-center gap-2 border-t border-slate-100 pt-2">
                  <div className="flex items-center text-slate-400 gap-1 shrink-0 font-sans">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[9px] font-black uppercase text-slate-450 tracking-wider">Sort List:</span>
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'weight_desc' | 'date_newest' | 'client_az')}
                    className="flex-1 bg-white border border-slate-205 rounded-xl px-2.5 py-1 text-[10.5px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer shadow-3xs"
                  >
                    <option value="weight_desc">Weight (Descending)</option>
                    <option value="date_newest">Date Received (Newest)</option>
                    <option value="client_az">Client Name (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Shipment Cards list */}
              {filteredShipments.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  No matching cargos found.
                </div>
              ) : (
                <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                  {filteredShipments.map((s) => {
                    const isSelected = s.id === selectedShipmentId;

                    return (
                      <div
                        key={s.id}
                        id={`shipment-row-${s.id}`}
                        onClick={() => setSelectedShipmentId(s.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                          isSelected
                            ? 'bg-indigo-50/30 border-indigo-500 ring-1 ring-indigo-500/10 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-slate-900 tracking-tight">{s.awb}</span>
                              <span className="text-[9px] bg-amber-50 border border-amber-200 text-amber-800 font-bold px-1.5 py-0.5 rounded font-mono uppercase leading-none">{s.shipmentMode || 'A/F'}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">Ref PO: {s.poNumber}</div>
                          </div>
                          
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${
                            s.status === 'Delivered' ? 'bg-indigo-100 text-indigo-850' :
                            s.status === 'Released' || s.status === 'Cleared' ? 'bg-emerald-100 text-emerald-800' :
                            s.status === 'Out for Delivery' ? 'bg-amber-100 text-amber-800' :
                            s.status === 'Consolidated' ? 'bg-indigo-100 text-indigo-805' :
                            s.status === 'INCOMING' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            s.status === 'RECEIVED' ? 'bg-teal-100 text-teal-800 border border-teal-200' :
                            s.status === 'DISPATCHING' ? 'bg-violet-100 text-violet-800 border border-violet-200' :
                            s.status === 'CONNECTED ON BOARD' ? 'bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {s.status}
                          </span>
                        </div>

                        <div className="mt-2.5 grid grid-cols-4 gap-1 text-[10.5px] border-t border-slate-100 pt-2 text-slate-500">
                          <div>
                            <span className="block text-[8px] uppercase font-semibold text-slate-400">Routing</span>
                            <span className="font-semibold text-slate-800 truncate block">{s.origin.split(' ')[0]} → {s.destination.split(' ')[0]}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] uppercase font-semibold text-slate-400">Packages</span>
                            <span className="font-mono text-slate-850 font-bold block">
                              {((s.cargoItems && s.cargoItems.length > 0) ? s.cargoItems.reduce((sum, item) => sum + (item.pieces || 1), 0) : 1).toLocaleString()} pkgs
                            </span>
                          </div>
                          <div>
                            <span className="block text-[8px] uppercase font-semibold text-slate-400">Total Wt</span>
                            <span className="font-mono text-indigo-700 font-bold block">{s.weight.toLocaleString()} kg</span>
                          </div>
                          <div className="text-right flex flex-col justify-end items-end min-w-0">
                            <span className="block text-[8px] uppercase font-extrabold text-indigo-500 font-mono">Vessel</span>
                            <span className="max-w-full truncate font-extrabold text-[11px] text-indigo-905 bg-indigo-50/75 border border-indigo-100/80 rounded-md px-1.5 py-0.5 block mt-0.5 tracking-tight" title={s.vesselName}>
                              🚢 {s.vesselName}
                            </span>
                          </div>
                        </div>

                        {/* Charges Indicator Bar */}
                        {s.charges.length > 0 && (
                          <div className="mt-2 text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg font-medium flex items-center justify-between">
                            <span>Surcharges Linked: {s.charges.length}</span>
                            <span className="font-mono font-bold">${s.charges.reduce((sum, ch) => sum + (ch.totalAmount ?? ch.amount), 0).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT: Detailed Tracking Timeline, Specs & Embedded Surcharges (Cols 7) */}
            <div className="lg:col-span-7">
              <ShipmentDetails
                shipment={activeShipment}
                onAddCharge={handleAddCharge}
                onAddMovement={handleAddMovement}
                warehouses={warehouses}
                onTransferWarehouse={handleTransferWarehouse}
                onUpdateShipment={handleUpdateShipment}
                customers={customers}
                vessels={vessels}
                tariffs={tariffs}
                overrides={overrides}
              />
            </div>

          </div>
          </div>
        )}

        {activeTab === 'driver' && (
          <DriverSimulation
            shipments={shipments}
            deliveryOrders={deliveryOrders}
            tasks={driverTasks}
            onAssignTask={handleAssignTask}
            onUpdateTask={handleUpdateTask}
            onAddMovement={handleAddMovement}
            onUpdateShipmentStatus={handleUpdateShipmentStatus}
            onUpdateDeliveryOrderStatus={handleUpdateDeliveryOrderStatus}
          />
        )}

        {activeTab === 'warehouse' && (
          <WarehousePanel
            warehouses={warehouses}
            shipments={shipments}
            currentUser={currentUser}
            onCreateWarehouse={handleCreateWarehouse}
            onUpdateWarehouse={handleUpdateWarehouse}
            onDeleteWarehouse={handleDeleteWarehouse}
            onTransferWarehouse={handleTransferWarehouse}
          />
        )}

        {activeTab === 'delivery_order' && (
          <DeliveryOrderPanel
            deliveryOrders={deliveryOrders}
            shipments={shipments}
            warehouses={warehouses}
            onCreateDeliveryOrder={handleCreateDeliveryOrder}
            onUpdateDeliveryOrderStatus={handleUpdateDeliveryOrderStatus}
            onAddDeliveryOrderCharge={handleAddDeliveryOrderCharge}
          />
        )}
        {activeTab === 'users' && (
          <UserManagementPanel
            users={users}
            currentUser={currentUser}
            onSetCurrentUser={setCurrentUser}
            onCreateUser={handleCreateUser}
            onDeleteUser={handleDeleteUser}
            onUpdateUser={handleUpdateUser}
          />
        )}
        {activeTab === 'customers' && (
          <CustomerPanel
            customers={customers}
            onCreateCustomer={handleCreateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onUpdateCustomer={handleUpdateCustomer}
          />
        )}
        {activeTab === 'billing' && (
          <TariffBillingPanel
            customers={customers}
            tariffs={tariffs}
            overrides={overrides}
            onAddTariff={handleAddTariff}
            onUpdateTariff={handleUpdateTariff}
            onDeleteTariff={handleDeleteTariff}
            onAddOverride={handleAddOverride}
            onUpdateOverride={handleUpdateOverride}
            onDeleteOverride={handleDeleteOverride}
          />
        )}
        {activeTab === 'vessels' && (
          <VesselPanel
            vessels={vessels}
            customers={customers}
            currentUser={currentUser}
            onCreateVessel={handleCreateVessel}
            onDeleteVessel={handleDeleteVessel}
            onUpdateVessel={handleUpdateVessel}
          />
        )}
      </main>

      {/* Create Shipment Form Modal Overlay */}
      <CreateShipmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAdd={handleAddShipment}
        warehouses={warehouses}
        customers={customers}
        vessels={vessels}
      />

      {/* Fine-grain professional footing */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <span>© 2026 CargoBridge Inc. Ground Port Operations Control Console.</span>
          </div>
          <div className="flex gap-4">
            <span>Terminal: US-SFO-01</span>
            <span>Gate Authorization: MULTI-AWB-HUB</span>
            <span>API Status: Connected</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
