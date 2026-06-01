/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Dimension {
  length: number;
  width: number;
  height: number;
}

export interface Movement {
  id: string;
  timestamp: string;
  location: string;
  activity: string; // e.g. "Received at Warehouse", "Customs Clearance Initiated", "Vessel Arrived", etc.
  description: string;
}

export type ChargeType = string;

export interface Charge {
  id: string;
  type: ChargeType;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
  totalAmount?: number;
  dateAdded: string;
  description: string;
  status: 'Pending' | 'Invoiced' | 'Paid';
}

export interface StandardTariff {
  id: string;
  name: string;
  defaultAmount: number;
  taxRate: number; // percentage, e.g. 10
  description: string;
}

export interface ClientTariffOverride {
  id: string;
  clientName: string;
  chargeName: string;
  customAmount: number;
  customTaxRate: number;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  city: string;
  country: string;
  capacityKg: number;
  address: string;
}

export interface ShipmentLog {
  id: string;
  timestamp: string;
  updatedBy: string; // User who made the change
  changes: string; // Log description
}

export interface ShipmentAttachment {
  id: string;
  name: string;
  type: 'document' | 'photo';
  url: string; // Base64 image/file data or mock URL
  size?: string;
  uploadedAt: string;
  uploadedBy?: string;
}

export interface CargoItem {
  id: string;
  poNumber: string;
  weight: number; // in kg
  dimensions: Dimension; // L x W x H in cm
  pieces: number; // quantity of packages
  description: string;
}

export type ShipmentMode = 'A/F' | 'COURIER' | 'CONSOL' | 'LCL' | 'FCL' | 'LOCAL';

export interface Shipment {
  id: string;
  awb: string;
  poNumber: string;
  vesselName: string;
  clientName: string; // Associated client/customer name
  weight: number; // in kg
  dimensions: Dimension; // L x W x H in cm
  origin: string;
  destination: string;
  status: 'INCOMING' | 'RECEIVED' | 'DISPATCHING' | 'CONNECTED ON BOARD' | 'Received' | 'In Transit' | 'Consolidated' | 'Customs Hold' | 'Cleared' | 'Released' | 'Out for Delivery' | 'Delivered';
  supplierName?: string;
  cargoDescription?: string;
  movements: Movement[];
  charges: Charge[];
  consolidationId: string | null;
  currentWarehouseId?: string | null;
  auditLogs?: ShipmentLog[];
  shipmentMode?: ShipmentMode;
  attachments?: ShipmentAttachment[];
  cargoItems?: CargoItem[];
}

export interface ConsolidatedCargo {
  id: string;
  consolidationCode: string; // e.g., CON-20260530-001
  containerNumber: string;
  vesselName: string;
  totalWeight: number;
  shipmentIds: string[];
  status: 'Consolidated' | 'In Transit' | 'Arrived' | 'Broken Down';
  origin: string;
  destination: string;
  dateCreated: string;
}

export interface DriverTask {
  id: string;
  deliveryOrderId: string; // Links to DeliveryOrder
  doNumber: string; // Delivery Order Number
  driverName: string;
  driverPhone: string;
  origin: string;
  destination: string;
  status: 'Assigned' | 'Picked Up' | 'In Transit' | 'Delivered' | 'Cancelled';
  assignedAt: string;
  pickedUpAt?: string;
  completedAt?: string;
  currentLat?: number;
  currentLng?: number;
  notes: string;
  cargoPhotoUrl?: string;
  recipientName?: string;
}

export interface DeliveryOrder {
  id: string;
  doNumber: string;
  clientName: string; // Client associated with all AWB/Shipments in this DO
  from: string;
  deliveryAddress: string;
  consignee: string;
  deliveryDate: string;
  deliveryTime: string;
  shipmentIds: string[]; // shipments grouped into this DO
  status: 'Picking List' | 'Picked' | 'Created' | 'In Transit' | 'Delivered' | 'Cancelled';
  createdAt: string;
  charges?: Charge[];
  vesselOption?: 'RELEASE' | 'LOADING AT MSW' | 'LOADING AT PT' | 'DELIVERY AT JZ' | 'DELIVERY AT SHIP YARD' | 'DELIVERY TO WORK SHOP' | 'DISPATCH TO OTHER PORT';
  shippingAwb?: string;
  workshopAddress?: string;
  recipientEmail?: string;
}

export type SecurityLevel = 'ADMIN' | 'OPERATOR' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  securityLevel: SecurityLevel;
  department: string;
  isActive: boolean;
  dateCreated: string;
}

export interface Customer {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  status: 'Active' | 'Inactive';
  dateCreated: string;
}

export interface Vessel {
  id: string;
  name: string;
  imo: string; // International Maritime Organization unique number
  clientName: string; // Associated customer/client name
  status: 'Active' | 'Inactive';
  dateCreated: string;
}
