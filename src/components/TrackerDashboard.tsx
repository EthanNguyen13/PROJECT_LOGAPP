/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shipment, Warehouse } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  ComposedChart,
  Line
} from 'recharts';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  Scale, 
  Activity, 
  ChevronDown, 
  ChevronUp,
  Warehouse as WarehouseIcon,
  Package,
  TrendingUp,
  Info
} from 'lucide-react';

interface TrackerDashboardProps {
  shipments: Shipment[];
  warehouses: Warehouse[];
}

export default function TrackerDashboard({ shipments, warehouses }: TrackerDashboardProps) {
  const [isOpen, setIsOpen] = useState(true);

  // 1. Calculate Warehouse Weights vs Capacity
  const warehouseData = warehouses.map(wh => {
    const warehouseShipments = shipments.filter(s => s.currentWarehouseId === wh.id);
    const totalWeight = warehouseShipments.reduce((sum, s) => sum + s.weight, 0);
    return {
      name: wh.code || wh.name.split(' ')[0],
      fullName: wh.name,
      'Active Cargo (kg)': totalWeight,
      'Capacity (kg)': wh.capacityKg,
      utilizationPercentage: wh.capacityKg > 0 ? Math.round((totalWeight / wh.capacityKg) * 100) : 0
    };
  });

  // Calculate global statistics
  const totalStockOnShelf = shipments
    .filter(s => s.currentWarehouseId !== null && s.currentWarehouseId !== undefined)
    .reduce((sum, s) => sum + s.weight, 0);

  const inTransitCount = shipments.filter(s => s.status === 'In Transit').length;
  const deliveredCount = shipments.filter(s => s.status === 'Delivered').length;
  const incomingCount = shipments.filter(s => s.status === 'INCOMING').length;

  // 2. Calculate Shipment Status Distribution
  const statusCounts: { [key: string]: number } = {};
  shipments.forEach(s => {
    const status = s.status || 'UNKNOWN';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const pieData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status,
    value: count
  }));

  // 3. Calculate Shipments by Client
  const clientDataMap: { [key: string]: { name: string; 'Shipments': number; 'Total Weight (kg)': number } } = {};
  shipments.forEach(s => {
    const client = s.clientName || 'General Client';
    if (!clientDataMap[client]) {
      clientDataMap[client] = {
        name: client,
        'Shipments': 0,
        'Total Weight (kg)': 0
      };
    }
    clientDataMap[client]['Shipments'] += 1;
    clientDataMap[client]['Total Weight (kg)'] += s.weight;
  });

  const clientData = Object.values(clientDataMap).sort((a, b) => b['Total Weight (kg)'] - a['Total Weight (kg)']);

  // Match corresponding statuses with dedicated beautiful hex colors to align with our visual standards
  const COLORS_MAP: { [key: string]: string } = {
    'INCOMING': '#3b82f6',          // blue
    'RECEIVED': '#0d9488',          // teal
    'DISPATCHING': '#8b5cf6',       // violet
    'CONNECTED ON BOARD': '#ec4899',// fuchsia
    'In Transit': '#2563eb',        // deeper blue
    'Consolidated': '#4f46e5',     // indigo
    'Customs Hold': '#ef4444',      // red
    'Cleared': '#10b981',           // emerald
    'Released': '#059669',          // dark emerald
    'Out for Delivery': '#f59e0b',  // amber
    'Delivered': '#6366f1',         // indigo-purple
  };

  const DEFAULT_COLORS = ['#64748b', '#475569', '#334155', '#1e293b', '#0f172a'];

  const getStatusColor = (status: string, index: number) => {
    return COLORS_MAP[status] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-300">
      {/* Header Banner */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between cursor-pointer select-none hover:bg-slate-850 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl">
            <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold tracking-wide uppercase font-sans flex items-center gap-2">
              Shipment Analytics & Logistics Board
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">
              Real-time monitoring of global warehouse utilization rates and active cargo distribution cycles.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-md text-slate-300">
            {shipments.length} Active Cargoes
          </span>
          <button className="p-1 rounded-md text-slate-400 hover:text-white transition-colors">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-6 space-y-6 bg-slate-50/40 animate-in fade-in duration-300">
          {/* Statistical Highlights Widget Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-2xs flex items-center gap-3.5">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <WarehouseIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider">Total Shelf Weight</span>
                <span className="text-sm font-bold text-slate-850 font-mono">{(totalStockOnShelf).toLocaleString()} kg</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-2xs flex items-center gap-3.5">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider">In Transit (Active)</span>
                <span className="text-sm font-bold text-slate-850 font-mono">{inTransitCount} Lots</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-2xs flex items-center gap-3.5">
              <div className="p-2.5 bg-teal-50 text-teal-600 rounded-lg">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider">Handover Completed</span>
                <span className="text-sm font-bold text-indigo-700 font-mono">{deliveredCount} Items</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-2xs flex items-center gap-3.5">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider">Pending Arrival</span>
                <span className="text-sm font-bold text-slate-850 font-mono">{incomingCount} lots</span>
              </div>
            </div>
          </div>

          {/* Graphical Analytics Canvas Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* BAR CHART: CARGO WEIGHT BY WAREHOUSE */}
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Cargo Weight by Warehouse</h3>
                </div>
                <span className="text-[10px] text-slate-400 italic">kg utilized vs capacity</span>
              </div>

              <div className="h-[240px] w-full font-sans text-[11px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={warehouseData}
                    margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      tickLine={false} 
                      axisLine={false}
                      stroke="#64748b" 
                      fontWeight={600} 
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false}
                      stroke="#64748b" 
                      fontWeight={600}
                      tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} 
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 border border-slate-850 text-white p-3 rounded-lg text-xs shadow-lg space-y-1">
                              <p className="font-bold text-indigo-400">{data.fullName}</p>
                              <p className="font-medium text-[11px]">Active Cargo: <span className="font-mono font-bold text-white">{data['Active Cargo (kg)'].toLocaleString()} kg</span></p>
                              <p className="font-medium text-[11px]">Capacity: <span className="font-mono font-bold text-slate-350">{data['Capacity (kg)'].toLocaleString()} kg</span></p>
                              <div className="pt-1.5 border-t border-slate-800 mt-1 flex justify-between gap-4 text-[10px] text-teal-400">
                                <span>Utilization Rate:</span>
                                <span className="font-mono font-black">{data.utilizationPercentage}%</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconSize={10} 
                      iconType="circle"
                      wrapperStyle={{ paddingBottom: '10px' }}
                    />
                    <Bar dataKey="Active Cargo (kg)" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={26} />
                    <Bar dataKey="Capacity (kg)" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={26} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PIE CHART: SHIPMENT STATUS DISTRIBUTION */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Shipment Status Distribution</h3>
                </div>
                <span className="text-[10px] text-slate-400 italic">cargo statuses</span>
              </div>

              {pieData.length === 0 ? (
                <div className="h-[240px] flex items-center justify-center text-slate-400 italic text-xs">
                  No active cargo status metrics.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <div className="sm:col-span-7 h-[240px] w-full font-sans text-[11px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={getStatusColor(entry.name, index)} 
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0];
                              const total = pieData.reduce((acc, curr) => acc + curr.value, 0);
                              const pct = ((data.value / total) * 100).toFixed(1);
                              return (
                                <div className="bg-slate-900 text-white px-2.5 py-1.5 rounded-lg text-xs shadow-lg space-y-0.5">
                                  <p className="font-bold flex items-center gap-1.5">
                                    <span 
                                      className="w-2 h-2 rounded-full inline-block" 
                                      style={{ backgroundColor: getStatusColor(data.name, 0) }} 
                                    />
                                    {data.name}
                                  </p>
                                  <p className="font-medium text-slate-350">
                                    Total: <span className="font-bold font-mono text-white">{data.value} Lots</span> ({pct}%)
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Status Legend */}
                  <div className="sm:col-span-5 flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {pieData.map((entry, index) => {
                      const total = pieData.reduce((acc, curr) => acc + curr.value, 0);
                      const percentage = Math.round((entry.value / total) * 100);
                      return (
                        <div key={entry.name} className="flex items-center justify-between text-[10px] bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span 
                              className="w-1.5 h-1.5 rounded-full shrink-0" 
                              style={{ backgroundColor: getStatusColor(entry.name, index) }} 
                            />
                            <span className="font-bold text-slate-700 truncate" title={entry.name}>{entry.name}</span>
                          </div>
                          <span className="text-slate-500 font-semibold font-mono whitespace-nowrap pl-1">
                            {entry.value} ({percentage}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* DUAL-AXIS COMPOSED CHART: SHIPMENT BY CLIENT */}
            <div className="lg:col-span-12 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-650" />
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Client Shipment & Weight Analysis</h3>
                    <p className="text-[10px] text-slate-400 font-medium font-sans">Active cargo statistics grouped by client account.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 bg-indigo-600 rounded"></span>
                    <span className="text-[10px] font-bold text-slate-500 font-mono uppercase">Cargo Weight (kg)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-0.5 bg-amber-500 inline-block relative bottom-0.5 font-sans"></span>
                    <span className="text-[10px] font-bold text-slate-500 font-mono uppercase">Shipment Count (Lots)</span>
                  </div>
                </div>
              </div>

              <div className="h-[280px] w-full font-sans text-[11px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={clientData}
                    margin={{ top: 15, right: -5, left: -15, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      tickLine={false} 
                      axisLine={false}
                      stroke="#64748b" 
                      fontWeight={600} 
                    />
                    {/* Left Y-Axis for Weight */}
                    <YAxis 
                      yAxisId="left"
                      tickLine={false} 
                      axisLine={false}
                      stroke="#4f46e5" 
                      fontWeight={600}
                      tickFormatter={(val) => `${(val / 1000).toFixed(0)}k kg`} 
                    />
                    {/* Right Y-Axis for Count */}
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tickLine={false} 
                      axisLine={false}
                      stroke="#d97706" 
                      fontWeight={605}
                      tickFormatter={(val) => `${val} lots`} 
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 border border-slate-850 text-white p-3 rounded-lg text-xs shadow-lg space-y-1">
                              <p className="font-extrabold text-indigo-400 text-sm border-b border-slate-800 pb-1">{data.name}</p>
                              <div className="space-y-1 pt-1">
                                <p className="font-medium text-[11px] flex justify-between gap-6">
                                  <span>Total Cargo Weight:</span> 
                                  <span className="font-mono font-bold text-indigo-300">{(data['Total Weight (kg)']).toLocaleString()} kg</span>
                                </p>
                                <p className="font-medium text-[11px] flex justify-between gap-6">
                                  <span>Active Shipments:</span> 
                                  <span className="font-mono font-bold text-amber-400">{data['Shipments']} Lots</span>
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar yAxisId="left" dataKey="Total Weight (kg)" fill="#4f46e5" radius={[5, 5, 0, 0]} barSize={40} />
                    <Line yAxisId="right" type="monotone" dataKey="Shipments" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, stroke: '#f59e0b', strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
