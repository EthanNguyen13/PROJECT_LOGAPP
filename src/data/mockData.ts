/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Shipment, ConsolidatedCargo, DriverTask, Warehouse, DeliveryOrder, Customer, Vessel, StandardTariff, ClientTariffOverride } from '../types';

export const INITIAL_SHIPMENTS: Shipment[] = [
  {
    id: 'shp-1',
    awb: 'AWB-58204918',
    poNumber: 'PO-98402',
    vesselName: 'MS Ocean Navigator',
    clientName: 'Acme Corp',
    weight: 1250,
    dimensions: { length: 240, width: 120, height: 160 },
    origin: 'Singapore (SIN)',
    destination: 'San Francisco (SFO)',
    status: 'Cleared',
    supplierName: 'Singapore Logistics Mfg Ltd',
    cargoDescription: 'Heavy-duty industrial generator spare parts and cooling nozzles',
    consolidationId: null,
    currentWarehouseId: 'WH-SFO',
    shipmentMode: 'LCL',
    cargoItems: [
      {
        id: 'citem-1-1',
        poNumber: 'PO-98402',
        weight: 500,
        dimensions: { length: 240, width: 120, height: 160 },
        pieces: 2,
        description: 'Heavy industrial pump spares'
      },
      {
        id: 'citem-1-2',
        poNumber: 'PO-98402',
        weight: 450,
        dimensions: { length: 100, width: 80, height: 90 },
        pieces: 4,
        description: 'High-pressure cooling nozzles'
      },
      {
        id: 'citem-1-3',
        poNumber: 'PO-98511',
        weight: 300,
        dimensions: { length: 80, width: 80, height: 100 },
        pieces: 1,
        description: 'Titanium air duct connectors'
      }
    ],
    movements: [
      {
        id: 'mov-1-1',
        timestamp: '2026-05-24T09:30:00Z',
        location: 'Singapore Terminal 2',
        activity: 'Cargo Received',
        description: 'Shipment accepted and verified at source terminal.'
      },
      {
        id: 'mov-1-2',
        timestamp: '2026-05-25T14:15:00Z',
        location: 'MS Ocean Navigator',
        activity: 'Departed Port',
        description: 'Vessel departed for San Francisco.'
      },
      {
        id: 'mov-1-3',
        timestamp: '2026-05-29T10:00:00Z',
        location: 'Oakland Port Terminal',
        activity: 'Arrived at Port',
        description: 'Vessel docked. Unloading procedures commenced.'
      },
      {
        id: 'mov-1-4',
        timestamp: '2026-05-30T08:00:00Z',
        location: 'San Francisco Hub (Customs)',
        activity: 'Clearance',
        description: 'Customs duty calculated and documents approved.'
      }
    ],
    charges: [
      {
        id: 'chg-1-1',
        type: 'Clearance',
        amount: 320.00,
        dateAdded: '2026-05-30T08:00:00Z',
        description: 'Import Customs Entry filing and clearance handling.',
        status: 'Invoiced'
      }
    ],
    attachments: [
      {
        id: 'att-1',
        name: 'commercial_invoice_58204.pdf',
        type: 'document',
        url: '#',
        size: '142 KB',
        uploadedAt: '2026-05-24T09:35:00Z',
        uploadedBy: 'System Admin'
      },
      {
        id: 'att-2',
        name: 'cargo_visual_gate_inspection.jpg',
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=800',
        size: '1.2 MB',
        uploadedAt: '2026-05-24T09:40:00Z',
        uploadedBy: 'SIN Terminal Operator'
      }
    ]
  },
  {
    id: 'shp-2',
    awb: 'AWB-88301928',
    poNumber: 'PO-74023',
    vesselName: 'Silver Breeze V-12',
    clientName: 'Acme Corp',
    weight: 480,
    dimensions: { length: 120, width: 100, height: 110 },
    origin: 'Yokohama (YOK)',
    destination: 'Los Angeles (LAX)',
    status: 'In Transit',
    supplierName: 'Tokyo Electronic Components',
    cargoDescription: 'High-frequency silicon diodes and integrated semiconductor wafers',
    consolidationId: 'con-101',
    currentWarehouseId: 'WH-YOK',
    shipmentMode: 'CONSOL',
    movements: [
      {
        id: 'mov-2-1',
        timestamp: '2026-05-26T11:00:00Z',
        location: 'Yokohama Cargo Depot',
        activity: 'Cargo Received',
        description: 'Item weighed, measured, and labeled.'
      },
      {
        id: 'mov-2-2',
        timestamp: '2026-05-27T08:20:00Z',
        location: 'Yokohama Consol Depot',
        activity: 'Consolidated',
        description: 'Grouped into container CON-YOK-LAX-401 for ocean transit.'
      }
    ],
    charges: []
  },
  {
    id: 'shp-3',
    awb: 'AWB-10928401',
    poNumber: 'PO-33921',
    vesselName: 'Silver Breeze V-12',
    clientName: 'Globex Logistics',
    weight: 950,
    dimensions: { length: 200, width: 150, height: 180 },
    origin: 'Yokohama (YOK)',
    destination: 'Los Angeles (LAX)',
    status: 'In Transit',
    supplierName: 'Kobe Heavy Industries Corp',
    cargoDescription: 'Galvanized steel pipes and pressure valve fittings',
    consolidationId: 'con-101',
    currentWarehouseId: 'WH-YOK',
    shipmentMode: 'FCL',
    movements: [
      {
        id: 'mov-3-1',
        timestamp: '2026-05-26T11:45:00Z',
        location: 'Yokohama Cargo Depot',
        activity: 'Cargo Received',
        description: 'Cargo loaded on local handling pallet.'
      },
      {
        id: 'mov-3-2',
        timestamp: '2026-05-27T08:20:00Z',
        location: 'Yokohama Consol Depot',
        activity: 'Consolidated',
        description: 'Packed into Container CON-YOK-LAX-401.'
      }
    ],
    charges: []
  },
  {
    id: 'shp-4',
    awb: 'AWB-44910293',
    poNumber: 'PO-88123',
    vesselName: 'Atlantic Express',
    clientName: 'Global Biotech Solutions',
    weight: 3500,
    dimensions: { length: 400, width: 220, height: 240 },
    origin: 'Rotterdam (RTM)',
    destination: 'New York (NYC)',
    status: 'Received',
    supplierName: 'EuroPharma Chemicals BV',
    cargoDescription: 'Medical grade active pharmaceutical ingredients and glass vials',
    consolidationId: null,
    currentWarehouseId: 'WH-RTM',
    shipmentMode: 'LOCAL',
    movements: [
      {
        id: 'mov-4-1',
        timestamp: '2026-05-29T16:45:00Z',
        location: 'Rotterdam Port Terminal 1',
        activity: 'Cargo Received',
        description: 'Heavy industrial parts received. Crane loading scheduled.'
      }
    ],
    charges: [
       {
        id: 'chg-4-1',
        type: 'Handling',
        amount: 550.00,
        dateAdded: '2026-05-29T16:50:00Z',
        description: 'Heavy crane loading surcharge.',
        status: 'Pending'
      }
    ]
  },
  {
    id: 'shp-5',
    awb: 'AWB-77201948',
    poNumber: 'PO-29401',
    vesselName: 'Pacific Empress',
    clientName: 'Pacific Rim Importers',
    weight: 150,
    dimensions: { length: 80, width: 60, height: 60 },
    origin: 'Hong Kong (HKG)',
    destination: 'Seattle (SEA)',
    status: 'Released',
    supplierName: 'HK Electronics Ltd',
    cargoDescription: 'Lithium battery packs and micro-USB charging accessories',
    consolidationId: null,
    currentWarehouseId: 'WH-SEA',
    shipmentMode: 'A/F',
    movements: [
      {
        id: 'mov-5-1',
        timestamp: '2026-05-20T10:00:00Z',
        location: 'Hong Kong Air Cargo Hub',
        activity: 'Cargo Received',
        description: 'Electronics parts checked in.'
      },
      {
        id: 'mov-5-2',
        timestamp: '2026-05-22T22:00:00Z',
        location: 'Seattle Customs Terminal',
        activity: 'Arrived at Port',
        description: 'Flight completed cargo unloading.'
      },
      {
        id: 'mov-5-3',
        timestamp: '2026-05-25T11:00:00Z',
        location: 'Seattle Customs Terminal',
        activity: 'Clearance',
        description: 'Customs cleared. Released for pickup.'
      },
      {
        id: 'mov-5-4',
        timestamp: '2026-05-28T14:30:00Z',
        location: 'Seattle Gateway Warehouse',
        activity: 'Release',
        description: 'Shipment released to local dispatcher.'
      }
    ],
    charges: [
      {
        id: 'chg-5-1',
        type: 'Clearance',
        amount: 150.00,
        dateAdded: '2026-05-25T11:00:00Z',
        description: 'Air customs clearance processing fee.',
        status: 'Paid'
      },
      {
        id: 'chg-5-2',
        type: 'Release',
        amount: 75.00,
        dateAdded: '2026-05-28T14:30:00Z',
        description: 'Gate pass and document release fee.',
        status: 'Paid'
      }
    ]
  }
];

export const INITIAL_CONSOLIDATIONS: ConsolidatedCargo[] = [
  {
    id: 'con-101',
    consolidationCode: 'CON-YOK-LAX-401',
    containerNumber: 'TCKU-491028-3',
    vesselName: 'Silver Breeze V-12',
    totalWeight: 1430, // shp-2 weight (480) + shp-3 weight (950)
    shipmentIds: ['shp-2', 'shp-3'],
    status: 'In Transit',
    origin: 'Yokohama (YOK)',
    destination: 'Los Angeles (LAX)',
    dateCreated: '2026-05-27T08:20:00Z'
  }
];

export const INITIAL_DRIVERS = [
  { id: 'drv-1', name: 'John Miller', phone: '+1 (555) 234-5678', vehicle: 'EcoBox Freight Van #4' },
  { id: 'drv-2', name: 'Angela Sanchez', phone: '+1 (555) 876-5432', vehicle: 'Flatbed Carrier #11' },
  { id: 'drv-3', name: 'Devon Lee', phone: '+1 (555) 432-8761', vehicle: 'Metro Delivery Truck #9' }
];

export const INITIAL_DRIVER_TASKS: DriverTask[] = [
  {
    id: 'tsk-1',
    deliveryOrderId: 'do-1',
    doNumber: 'DO-20260530-001',
    driverName: 'John Miller',
    driverPhone: '+1 (555) 234-5678',
    origin: 'Singapore Changi Hub (WH-SIN)',
    destination: 'Jurong Logistics Park, Block A, Singapore',
    status: 'Assigned',
    assignedAt: '2026-05-30T10:30:00Z',
    notes: 'Please buzz warehouse gate 4. Contact person: Sam.'
  }
];

export const INITIAL_WAREHOUSES: Warehouse[] = [
  {
    id: 'WH-SIN',
    name: 'Singapore Changi Hub',
    code: 'SIN-WH01',
    city: 'Singapore',
    country: 'Singapore',
    capacityKg: 50000,
    address: '8 Changi Air Cargo Rd, Cargo Agent\'s Building'
  },
  {
    id: 'WH-SFO',
    name: 'San Francisco Bay Depot',
    code: 'SFO-WH02',
    city: 'San Francisco',
    country: 'USA',
    capacityKg: 35000,
    address: '401 SFO Airport Cargo Access Rd, South San Francisco'
  },
  {
    id: 'WH-YOK',
    name: 'Yokohama Maritime Harbor',
    code: 'YOK-WH03',
    city: 'Yokohama',
    country: 'Japan',
    capacityKg: 40000,
    address: 'Dock 3, Honmoku Port, Yokohama'
  },
  {
    id: 'WH-RTM',
    name: 'Rotterdam Europort Terminal',
    code: 'RTM-WH04',
    city: 'Rotterdam',
    country: 'Netherlands',
    capacityKg: 65000,
    address: 'Rijnpoortweg Terminal 9, Port of Rotterdam'
  },
  {
    id: 'WH-SEA',
    name: 'Seattle Gateway Terminal',
    code: 'SEA-WH05',
    city: 'Seattle',
    country: 'USA',
    capacityKg: 30000,
    address: '1023 East Marginal Way S, Seattle'
  }
];

export const INITIAL_DELIVERY_ORDERS: DeliveryOrder[] = [
  {
    id: 'do-1',
    doNumber: 'DO-20260530-001',
    clientName: 'Global Biotech Solutions',
    from: 'Singapore Changi Hub (WH-SIN)',
    deliveryAddress: 'Jurong Logistics Park, Block A, Singapore',
    consignee: 'Global Biotech Solutions Pte Ltd',
    deliveryDate: '2026-06-01',
    deliveryTime: '14:30',
    shipmentIds: ['shp-4'],
    status: 'Created',
    createdAt: '2026-05-30T12:00:00Z',
    charges: [
      {
        id: 'chg-do-1-1',
        type: 'Delivery',
        amount: 185.00,
        dateAdded: '2026-05-30T12:00:00Z',
        description: 'Last-mile freight courier delivery surcharge.',
        status: 'Pending'
      },
      {
        id: 'chg-do-1-2',
        type: 'Handling',
        amount: 45.00,
        dateAdded: '2026-05-30T12:00:00Z',
        description: 'Multi-cargo consolidation handling & sorting fee.',
        status: 'Pending'
      }
    ]
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Acme Corp',
    code: 'CUST-ACME',
    email: 'operations@acme.com',
    phone: '+1 (555) 901-2139',
    address: '121 Industrial Way, Ste 3, San Francisco, CA',
    status: 'Active',
    dateCreated: '2026-01-10T12:00:00Z'
  },
  {
    id: 'cust-2',
    name: 'Globex Logistics',
    code: 'CUST-GLOBEX',
    email: 'freight@globexlogistics.com',
    phone: '+1 (555) 301-4482',
    address: '88 International Gateway Ave, Los Angeles, CA',
    status: 'Active',
    dateCreated: '2026-02-14T09:30:00Z'
  },
  {
    id: 'cust-3',
    name: 'Global Biotech Solutions',
    code: 'CUST-GBS',
    email: 'logistics@globalbiotech.com',
    phone: '+31 (0) 10 409-1234',
    address: 'Europoort Terminal Blvd 49, Rotterdam, Netherlands',
    status: 'Active',
    dateCreated: '2026-03-22T15:10:00Z'
  },
  {
    id: 'cust-4',
    name: 'Pacific Rim Importers',
    code: 'CUST-PACRIM',
    email: 'import@pacificrim.com',
    phone: '+852 2911 3921',
    address: 'Wan Chai Commercial Centre Tower B, Hong Kong',
    status: 'Active',
    dateCreated: '2026-04-05T11:20:00Z'
  }
];

export const INITIAL_VESSELS: Vessel[] = [
  {
    id: 'vsl-1',
    name: 'MS Ocean Navigator',
    imo: 'IMO 9320542',
    clientName: 'Acme Corp',
    status: 'Active',
    dateCreated: '2026-01-15T12:00:00Z'
  },
  {
    id: 'vsl-2',
    name: 'Silver Breeze V-12',
    imo: 'IMO 9514028',
    clientName: 'Acme Corp',
    status: 'Active',
    dateCreated: '2026-02-10T10:30:00Z'
  },
  {
    id: 'vsl-3',
    name: 'Silver Breeze V-12',
    imo: 'IMO 9514028',
    clientName: 'Globex Logistics',
    status: 'Active',
    dateCreated: '2026-02-12T14:15:00Z'
  },
  {
    id: 'vsl-4',
    name: 'Atlantic Express',
    imo: 'IMO 9128321',
    clientName: 'Global Biotech Solutions',
    status: 'Active',
    dateCreated: '2026-03-01T08:00:00Z'
  },
  {
    id: 'vsl-5',
    name: 'Pacific Empress',
    imo: 'IMO 9042918',
    clientName: 'Pacific Rim Importers',
    status: 'Active',
    dateCreated: '2026-04-02T09:00:00Z'
  },
  {
    id: 'vsl-6',
    name: 'Golden Horizon',
    imo: 'IMO 9184029',
    clientName: 'Globex Logistics',
    status: 'Active',
    dateCreated: '2026-04-20T11:45:00Z'
  },
  {
    id: 'vsl-7',
    name: 'Titan Raider',
    imo: 'IMO 9248102',
    clientName: 'Pacific Rim Importers',
    status: 'Active',
    dateCreated: '2026-05-10T16:20:00Z'
  }
];

export const INITIAL_STANDARD_TARIFFS: StandardTariff[] = [
  { id: 'tariff-1', name: 'Clearance', defaultAmount: 180.00, taxRate: 10, description: 'Standard customs brokerage & import/export clearance verification.' },
  { id: 'tariff-2', name: 'Delivery', defaultAmount: 250.00, taxRate: 8, description: 'Last-mile specialized dispatcher trucking, handling, and delivery.' },
  { id: 'tariff-3', name: 'Re-export', defaultAmount: 420.00, taxRate: 12, description: 'Customs-bonded transfer & high-security re-forwarding logistics.' },
  { id: 'tariff-4', name: 'Release', defaultAmount: 75.00, taxRate: 5, description: 'Depot physical inventory gate clearance & release registration.' },
  { id: 'tariff-5', name: 'Handling', defaultAmount: 90.00, taxRate: 8, description: 'Dockside pallet reorganization, forklifts, and staging services.' },
  { id: 'tariff-6', name: 'Storage', defaultAmount: 120.00, taxRate: 10, description: 'Climatized warehouse pallet storage billing fee (daily/monthly).' }
];

export const INITIAL_CLIENT_TARIFF_OVERRIDES: ClientTariffOverride[] = [
  { id: 'override-1', clientName: 'Acme Corp', chargeName: 'Clearance', customAmount: 150.00, customTaxRate: 5 },
  { id: 'override-2', clientName: 'Acme Corp', chargeName: 'Delivery', customAmount: 220.00, customTaxRate: 8 },
  { id: 'override-3', clientName: 'Globex Logistics', chargeName: 'Storage', customAmount: 100.00, customTaxRate: 10 }
];


