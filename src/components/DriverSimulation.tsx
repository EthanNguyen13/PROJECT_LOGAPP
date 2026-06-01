/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Smartphone, 
  Truck, 
  MapPin, 
  Navigation, 
  Phone, 
  Play, 
  CheckCircle2, 
  RefreshCw, 
  FileText, 
  ClipboardList,
  Camera,
  RotateCcw,
  Check,
  Upload,
  User,
  Image as ImageIcon,
  X,
  Lock,
  Eye,
  CheckSquare,
  AlertCircle
} from 'lucide-react';
import { Shipment, DriverTask, DeliveryOrder } from '../types';
import { INITIAL_DRIVERS } from '../data/mockData';

interface DriverSimulationProps {
  shipments: Shipment[];
  deliveryOrders: DeliveryOrder[];
  tasks: DriverTask[];
  onUpdateTask: (task: DriverTask) => void;
  onAddMovement: (shipmentId: string, activity: string, location: string, description: string) => void;
  onUpdateShipmentStatus: (shipmentId: string, status: Shipment['status']) => void;
  onUpdateDeliveryOrderStatus: (doId: string, status: DeliveryOrder['status']) => void;
  onAssignTask: (newTask: DriverTask) => void;
}

export default function DriverSimulation({
  shipments,
  deliveryOrders,
  tasks,
  onUpdateTask,
  onAddMovement,
  onUpdateShipmentStatus,
  onUpdateDeliveryOrderStatus,
  onAssignTask
}: DriverSimulationProps) {
  // Dispatch assignment form states
  const [selectedDoId, setSelectedDoId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState(INITIAL_DRIVERS[0].id);
  const [deliveryDestination, setDeliveryDestination] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');

  // Mobile App Simulation states
  const [activeDriverId, setActiveDriverId] = useState(INITIAL_DRIVERS[0].id);
  const [isDrivingSim, setIsDrivingSim] = useState(false);
  const [drivingProgress, setDrivingProgress] = useState(0);

  // Photo & Signoff States
  const [recipientName, setRecipientName] = useState('');
  const [cargoPhoto, setCargoPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [viewingPhotoTask, setViewingPhotoTask] = useState<DriverTask | null>(null);
  const [selectedProofTask, setSelectedProofTask] = useState<DriverTask | null>(null);
  const [activeLogTab, setActiveLogTab] = useState<'active' | 'completed'>('active');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Filter delivery orders ready for dispatch (not yet Delivered, not Cancelled, not in Picking stage, and not currently assigned under another active driver task)
  const readyDeliveryOrders = deliveryOrders.filter(
    (doItem) => doItem.status !== 'Delivered' && doItem.status !== 'Cancelled' && doItem.status !== 'Picking List' &&
                !tasks.some((t) => t.deliveryOrderId === doItem.id && t.status !== 'Cancelled' && t.status !== 'Delivered')
  );

  // Active tasks for the currently selected phone-holder (activeDriverId)
  const currentDriver = INITIAL_DRIVERS.find((d) => d.id === activeDriverId) || INITIAL_DRIVERS[0];
  const driverTask = tasks.find(
    (t) => t.driverName === currentDriver.name && (t.status === 'Assigned' || t.status === 'Picked Up' || t.status === 'In Transit')
  );

  const completedTasks = tasks.filter(
    (t) => t.driverName === currentDriver.name && t.status === 'Delivered'
  );

  // Get active delivery order item for Driver app displays
  const linkedDo = driverTask ? deliveryOrders.find(d => d.id === driverTask.deliveryOrderId) : null;

  // Cleanup stream on active driver change or unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [activeDriverId]);

  const startCamera = async () => {
    setIsCapturing(true);
    setCameraError(null);
    try {
      // Small timeout to allow video element to mount
      setTimeout(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (innerErr: any) {
          console.error("Inner camera getUserMedia failed:", innerErr);
          setCameraError("Webcam permission denied or camera device not accessible.");
        }
      }, 100);
    } catch (err: any) {
      console.error("Camera setup initiation failed:", err);
      setCameraError("Webcam support not detected or restricted.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      try {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg');
          setCargoPhoto(dataUrl);
          stopCamera();
        }
      } catch (err) {
        console.error("Canvas draw capture failed:", err);
        setCameraError("Failed to freeze frame. Please try Uploading or Simulating.");
      }
    }
  };

  const simulateCargoPhoto = () => {
    const mockCargoImages = [
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1566576912321-d58def7a9686?auto=format&fit=crop&q=80&w=400"
    ];
    const randomIndex = Math.floor(Math.random() * mockCargoImages.length);
    setCargoPhoto(mockCargoImages[randomIndex]);
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCargoPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Simulation timer for driving progress
  useEffect(() => {
    let interval: any;
    if (isDrivingSim && driverTask) {
      interval = setInterval(() => {
        setDrivingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsDrivingSim(false);
            return 100;
          }
          const next = prev + 25;
          if (next === 50) {
            // Log midway movement for all shipments belonging to this delivery order
            const activeOrder = deliveryOrders.find(d => d.id === driverTask.deliveryOrderId);
            if (activeOrder) {
              activeOrder.shipmentIds.forEach(shipmentId => {
                onAddMovement(
                  shipmentId,
                  'Last-Mile Transit (En Route)',
                  'Interstate Highway Route',
                  `Courier Driver ${driverTask.driverName} on ${currentDriver.vehicle} is 50% along the route to delivery locale: ${driverTask.destination}.`
                );
              });
            }
          }
          return next;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isDrivingSim, driverTask]);

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoId) {
      alert('Please select a Delivery Order to dispatch.');
      return;
    }
    if (!deliveryDestination) {
      alert('Please provide a physical delivery destination address.');
      return;
    }

    const doItem = deliveryOrders.find((d) => d.id === selectedDoId)!;
    const driver = INITIAL_DRIVERS.find((d) => d.id === selectedDriverId)!;

    const newTask: DriverTask = {
      id: `tsk-${Date.now()}`,
      deliveryOrderId: doItem.id,
      doNumber: doItem.doNumber,
      driverName: driver.name,
      driverPhone: driver.phone,
      origin: doItem.from,
      destination: deliveryDestination,
      status: 'Assigned',
      assignedAt: new Date().toISOString(),
      notes: dispatchNotes
    };

    onAssignTask(newTask);
    onUpdateDeliveryOrderStatus(doItem.id, 'In Transit');

    // Add dispatch movement updates to each shipment inside this Delivery Order
    doItem.shipmentIds.forEach(shipmentId => {
      onAddMovement(
        shipmentId,
        'DISPATCHED',
        doItem.from,
        `Consolidated cargo under Delivery Order ${doItem.doNumber} allocated to driver ${driver.name} (${driver.vehicle}) for last-mile delivery.`
      );
    });

    // Reset Form
    setSelectedDoId('');
    setDeliveryDestination('');
    setDispatchNotes('');
  };

  // Driver actions
  const handleDriverPickUp = () => {
    if (!driverTask) return;
    const updated = {
      ...driverTask,
      status: 'In Transit' as const,
      pickedUpAt: new Date().toISOString()
    };
    onUpdateTask(updated);
    
    // Ensure status is marked as In Transit
    onUpdateDeliveryOrderStatus(driverTask.deliveryOrderId, 'In Transit');

    const activeOrder = deliveryOrders.find(d => d.id === driverTask.deliveryOrderId);
    if (activeOrder) {
      activeOrder.shipmentIds.forEach(shipmentId => {
        onAddMovement(
          shipmentId,
          'Cargo Out for Delivery',
          driverTask.origin,
          `Courier Driver ${driverTask.driverName} accepted and loaded courier cargo. Currently en route onto highways.`
        );
      });
    }
    setDrivingProgress(0);
  };

  const handleStartDriving = () => {
    setIsDrivingSim(true);
    setDrivingProgress(0);
  };

  const handleDriverComplete = () => {
    if (!driverTask) return;
    if (!cargoPhoto) {
      alert('Cargo identification photo is strictly required to sign off the delivery!');
      return;
    }
    if (!recipientName.trim()) {
      alert('Recipient sign-off name is strictly required to complete the delivery!');
      return;
    }

    const updated = {
      ...driverTask,
      status: 'Delivered' as const,
      completedAt: new Date().toISOString(),
      cargoPhotoUrl: cargoPhoto,
      recipientName: recipientName.trim()
    };
    
    // Standard driver task completion state
    onUpdateTask(updated);
    
    // Explicitly update Delivery Order to Delivered state. 
    // This will set underlying shipment status as Delivered and clear warehouse presence dynamically!
    onUpdateDeliveryOrderStatus(driverTask.deliveryOrderId, 'Delivered');

    const activeOrder = deliveryOrders.find(d => d.id === driverTask.deliveryOrderId);
    if (activeOrder) {
      activeOrder.shipmentIds.forEach(shipmentId => {
        onAddMovement(
          shipmentId,
          'Delivered & Received',
          driverTask.destination,
          `Recipient verified and signed delivery confirmation. Handover verified by ${recipientName}. Visual cargo condition proof recorded.`
        );
      });
    }

    // Reset temporary driver app states
    setRecipientName('');
    setCargoPhoto(null);
    setDrivingProgress(0);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT: DISPATCH WORKSPACE */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-650" />
            Last-Mile Courier Dispatch
          </h2>
          <p className="text-xs text-slate-500">
            Link and dispatch generated multicargo <strong className="text-indigo-600 font-semibold">Delivery Orders (D/O)</strong> to heavy cargo couriers.
          </p>
        </div>

        <form onSubmit={handleDispatch} className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4 text-slate-500" />
            Assign Courier Driver to D/O
          </h3>
          
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Select Active Delivery Order (D/O)</label>
            {readyDeliveryOrders.length === 0 ? (
              <div className="text-xs text-slate-400 py-3 italic font-mono text-center bg-white border border-slate-200 rounded-lg">
                No Delivery Orders ready for couriers. Generate a D/O first.
              </div>
            ) : (
              <select
                required
                value={selectedDoId}
                onChange={(e) => {
                  setSelectedDoId(e.target.value);
                  const selectedItem = deliveryOrders.find((item) => item.id === e.target.value);
                  if (selectedItem) {
                    setDeliveryDestination(selectedItem.deliveryAddress);
                  }
                }}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="">-- Choose Delivery Order --</option>
                {readyDeliveryOrders.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.doNumber} to {d.consignee} ({d.shipmentIds.length} cargoes) - {d.status}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Assign Courier Driver</label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer"
              >
                {INITIAL_DRIVERS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.vehicle})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Destination Address</label>
              <input
                type="text"
                required
                readOnly
                placeholder="Auto-populated destination address"
                value={deliveryDestination}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600 outline-none cursor-not-allowed font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Gate Pass / Driver Directives</label>
            <input
              type="text"
              placeholder="e.g. Leave duplicate signed DO copy with warehouse receiver."
              value={dispatchNotes}
              onChange={(e) => setDispatchNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={!selectedDoId}
            className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/10"
          >
            <Truck className="w-4 h-4" />
            Issue Dispatch to Driver Device
          </button>
        </form>

        {/* DISPATCH OVERVIEW & COMPLETED PROOF TABS */}
        <div className="space-y-4 pt-2">
          <div className="flex border-b border-slate-100 pb-1">
            <button
              type="button"
              onClick={() => setActiveLogTab('active')}
              className={`pb-2 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeLogTab === 'active'
                  ? 'border-indigo-600 text-indigo-650'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Active Shipments ({tasks.filter((t) => t.status !== 'Delivered').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveLogTab('completed')}
              className={`pb-2 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeLogTab === 'completed'
                  ? 'border-indigo-600 text-indigo-650'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Delivered Proof ({tasks.filter((t) => t.status === 'Delivered').length})
            </button>
          </div>

          {activeLogTab === 'active' ? (
            <div className="space-y-3">
              {tasks.filter((t) => t.status !== 'Delivered').length === 0 ? (
                <div className="text-xs text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-lg">
                  No cargo tasks are currently out for active delivery.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {tasks.filter((t) => t.status !== 'Delivered').map((t) => (
                    <div key={t.id} className="border border-slate-150 bg-slate-50/50 rounded-lg p-3 text-xs flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-700">{t.driverName}</span>
                        <span className="text-indigo-650 ml-1.5 font-mono">({t.doNumber})</span>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Dispatch: {t.origin} → Dest: <strong className="text-slate-700">{t.destination}</strong>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                        t.status === 'Assigned' 
                          ? 'bg-amber-100 text-amber-850' 
                          : 'bg-blue-100 text-blue-850'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.filter((t) => t.status === 'Delivered').length === 0 ? (
                <div className="text-xs text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-lg">
                  No delivered cargo has been signed off yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {tasks.filter((t) => t.status === 'Delivered').map((t) => (
                    <div key={t.id} className="border border-slate-150 bg-slate-50/20 hover:bg-slate-50 rounded-lg p-3 text-xs flex justify-between items-center transition-all">
                      <div>
                        <span className="font-bold text-slate-700">{t.driverName}</span>
                        <span className="text-emerald-650 ml-1.5 font-semibold">({t.doNumber})</span>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Recipient: <strong className="text-indigo-650">{t.recipientName || 'Signed Receiver'}</strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedProofTask(t)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded border border-indigo-150 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-650" />
                        Verify Proof
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dispatcher's Lightbox Proof Modal */}
        {selectedProofTask && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-md w-full border border-slate-100 shadow-xl p-5 space-y-4 relative">
              <button 
                onClick={() => setSelectedProofTask(null)}
                className="absolute top-4 right-4 p-1 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-650 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-650 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-full">
                  POD: Proof of Delivery Verified
                </span>
                <h3 className="text-base font-bold text-slate-800 mt-2 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-indigo-600" />
                  Cargo Delivery Signoff Receipt
                </h3>
                <p className="text-xs text-slate-500 font-sans">Official handover completed on driver's handheld terminal.</p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Delivery Order</span>
                  <span className="text-slate-850 font-bold">{selectedProofTask.doNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold font-sans">Courier Driver</span>
                  <span className="text-slate-800 font-sans">{selectedProofTask.driverName}</span>
                </div>
                <div className="col-span-2 border-t border-slate-200/60 my-0.5 pt-1.5">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold font-sans">Destination Address</span>
                  <span className="text-slate-750 font-sans font-medium">{selectedProofTask.destination}</span>
                </div>
                <div className="border-t border-slate-200/60 pt-1.5">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold font-sans">Sign-off Recipient</span>
                  <span className="text-indigo-650 font-bold font-sans flex items-center gap-1 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                    {selectedProofTask.recipientName || 'Not signed'}
                  </span>
                </div>
                <div className="border-t border-slate-200/60 pt-1.5">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold font-sans">Completed Time</span>
                  <span className="text-slate-655 font-sans font-medium">
                    {selectedProofTask.completedAt ? new Date(selectedProofTask.completedAt).toLocaleTimeString() : 'Pending'}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block">Handover Cargo Condition Photographic Evidence</span>
                {selectedProofTask.cargoPhotoUrl ? (
                  <div className="rounded-xl overflow-hidden border border-slate-150 shadow-inner bg-slate-100">
                    <img 
                      src={selectedProofTask.cargoPhotoUrl} 
                      alt="Cargo Handover Proof"
                      className="w-full h-48 object-cover hover:scale-[1.02] transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="p-8 bg-slate-50 border border-slate-150 border-dashed rounded-xl text-center text-xs italic text-slate-400">
                    No photo photographed.
                    Cargo condition can not be confirmed.
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedProofTask(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: DRIVER MOBILE DEVICE SIMULATOR */}
      <div id="driver-app-simulation" className="flex flex-col items-center justify-center bg-slate-900 rounded-3xl p-6 shadow-xl border-4 border-slate-800 relative max-w-sm mx-auto w-full">
        <div className="absolute top-2 w-20 h-4 bg-slate-900 rounded-full z-10"></div>
        
        {/* Device select banner */}
        <div className="w-full mb-3 flex items-center justify-between text-slate-400 text-xs px-2">
          <span className="font-mono text-[10px]">DRIVER MOBILE APLET SIM</span>
          <select
            value={activeDriverId}
            onChange={(e) => {
              setActiveDriverId(e.target.value);
              setIsDrivingSim(false);
              setDrivingProgress(0);
            }}
            className="bg-slate-800 border border-slate-700 text-slate-250 py-0.5 px-2 rounded text-[11px] font-semibold focus:outline-none cursor-pointer"
          >
            {INITIAL_DRIVERS.map((d) => (
              <option key={d.id} value={d.id}>
                📱 {d.name.split(' ')[0]}'s Dev
              </option>
            ))}
          </select>
        </div>

        {/* PHONE SCREEN START */}
        <div className="w-full bg-slate-950 aspect-[9/18] rounded-2xl overflow-hidden border border-slate-800 flex flex-col justify-between relative shadow-inner text-white">
          
          {/* Overlay Cargo Proof details */}
          {viewingPhotoTask && (
            <div className="absolute inset-0 bg-slate-950/95 z-40 flex flex-col justify-between p-4 animate-in slide-in-from-bottom duration-250">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                  <span className="font-mono text-xs font-bold text-indigo-400">CLEARANCE RECEIPT</span>
                  <button 
                    onClick={() => setViewingPhotoTask(null)}
                    className="p-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-350 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-slate-900 border border-slate-850 rounded-lg p-2.5 space-y-2">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Order Ref:</span>
                    <span className="text-white font-bold">{viewingPhotoTask.doNumber}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Date/Time:</span>
                    <span className="text-slate-200">
                      {viewingPhotoTask.completedAt ? new Date(viewingPhotoTask.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just Now'}
                    </span>
                  </div>
                  <div className="border-t border-slate-850 my-1"></div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight block">Handover Verified by:</span>
                    <span className="text-[12px] text-indigo-300 font-bold flex items-center gap-1">
                      <User className="w-3 h-3 text-indigo-400" />
                      {viewingPhotoTask.recipientName || 'Unspecified'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight block">Signed Proof of Cargo Condition</span>
                  {viewingPhotoTask.cargoPhotoUrl ? (
                    <div className="rounded-lg overflow-hidden border border-slate-800">
                      <img 
                        src={viewingPhotoTask.cargoPhotoUrl} 
                        alt="Cargo proof condition"
                        className="w-full h-36 object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-900/40 text-center text-[11px] text-slate-400 border border-slate-850 rounded-lg italic">
                      No photo recorded.
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingPhotoTask(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Close Receipt
              </button>
            </div>
          )}
          
          {/* Status Bar */}
          <div className="bg-slate-900 text-[10px] text-slate-400 px-3 py-1 flex justify-between items-center select-none font-mono">
            <span>2:26 PM</span>
            <div className="flex items-center gap-1.5">
              <span>5G</span>
              <div className="w-4 h-2 border border-slate-400 rounded-xs bg-emerald-500"></div>
            </div>
          </div>

          {/* App Header */}
          <div className="bg-indigo-650 p-3.5 shadow-md flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-indigo-350 animate-pulse" />
            <div>
              <h4 className="text-xs font-bold tracking-tight text-white">CargoLink Driver App</h4>
              <p className="text-[9px] text-indigo-200 font-mono">{currentDriver.vehicle}</p>
            </div>
          </div>

          {/* App Body */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3">
            {driverTask ? (
              <div className="space-y-3">
                <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-indigo-400">ASSIGNED D/O DISPATCH</span>
                    <span className="px-1.5 py-0.5 bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 rounded text-[9px] font-bold font-mono">
                      {driverTask.status.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] text-indigo-300 font-mono bg-indigo-950 px-2 py-0.5 rounded border border-indigo-900">
                      DO Ref: {driverTask.doNumber}
                    </span>
                    <h5 className="font-bold text-sm text-slate-100 font-mono mt-1.5">D/O: {driverTask.doNumber}</h5>
                    {linkedDo && (
                      <div className="text-[11px] text-slate-350 font-sans mt-1.5 space-y-1">
                        <div>Consignee: <span className="text-indigo-400 font-bold">{linkedDo.consignee}</span></div>
                        <div className="text-[9.5px] text-slate-400 bg-slate-950 p-1.5 rounded font-mono border border-slate-800">
                          Package count: <span className="text-slate-200 font-bold">{linkedDo.shipmentIds.length} master cargoes</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-800 my-1 pt-1.5 space-y-1 text-[11px]">
                    <div className="flex items-center gap-1 text-slate-450">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">Origin: {driverTask.origin}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-450">
                      <Navigation className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate font-semibold text-slate-200">Dest: {driverTask.destination}</span>
                    </div>
                  </div>

                  {driverTask.notes && (
                    <div className="text-[10px] bg-slate-950 p-2 rounded text-indigo-300 italic border-l-2 border-indigo-500">
                      "{driverTask.notes}"
                    </div>
                  )}
                </div>

                {/* TRIP SIMULATION STAGE FLOW */}
                {driverTask.status === 'Assigned' && (
                  <button
                    type="button"
                    onClick={handleDriverPickUp}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer transition-colors"
                  >
                    🚀 Accept & Loading Consignment
                  </button>
                )}

                {driverTask.status === 'In Transit' && (
                  <div className="space-y-3">
                    {!isDrivingSim && drivingProgress === 0 ? (
                      <button
                        type="button"
                        onClick={handleStartDriving}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <Play className="w-4 h-4 fill-current text-white" />
                        Initiate Route Navigation
                      </button>
                    ) : (
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
                        <div className="flex justify-between text-[11px] text-slate-450 font-mono">
                          <span>{isDrivingSim ? '⚡ Driving...' : '📍 Destination Node Reached'}</span>
                          <span>{drivingProgress}%</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                          <div 
                            className="bg-indigo-500 h-full transition-all duration-500"
                            style={{ width: `${drivingProgress}%` }}
                          ></div>
                        </div>

                        {drivingProgress === 100 && (
                          <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono pt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Receiver Proximity Verified. Handover Ready.
                          </div>
                        )}
                      </div>
                    )}

                    {drivingProgress === 100 && (
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3 font-sans animate-in fade-in duration-200">
                        <div className="border-b border-slate-800 pb-2">
                          <h6 className="text-[11px] font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                            <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                            Delivery Signoff & Proof
                          </h6>
                          <p className="text-[9px] text-slate-450 mt-0.5">Please take a photo of cargo handover status and input recipient signature sign-off.</p>
                        </div>

                        {/* Recipient Input */}
                        <div className="space-y-1">
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-tight">Recipient Signed Name *</label>
                          <div className="relative">
                            <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                            <input
                              type="text"
                              required
                              placeholder="e.g. Rachel Adams, Hub Lead"
                              value={recipientName}
                              onChange={(e) => setRecipientName(e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-medium"
                            />
                          </div>
                        </div>

                        {/* Photographic Proof */}
                        <div className="space-y-1.5">
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-tight">Cargo Proof Photo *</label>
                          
                          {/* Photo not captured yet */}
                          {!cargoPhoto && !isCapturing && (
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={startCamera}
                                className="p-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg text-center flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer text-indigo-300"
                              >
                                <Camera className="w-4 h-4 text-indigo-400" />
                                <span className="text-[9.5px] font-bold">Use Device Cam</span>
                              </button>
                              
                              <button
                                type="button"
                                onClick={simulateCargoPhoto}
                                className="p-3 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-lg text-center flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer text-slate-300"
                              >
                                <ImageIcon className="w-4 h-4 text-indigo-350" />
                                <span className="text-[9.5px] font-bold">Simulate Photo</span>
                              </button>

                              <div className="col-span-2">
                                <label className="flex items-center justify-center gap-1.5 p-2 bg-slate-950 hover:bg-slate-900 border border-dashed border-slate-850 rounded-lg text-[9.5px] text-slate-450 hover:text-slate-200 transition-colors cursor-pointer">
                                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Manual Photo Upload</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                            </div>
                          )}

                          {/* Capturing active livestream */}
                          {isCapturing && (
                            <div className="bg-black rounded-lg overflow-hidden border border-slate-850 relative">
                              {cameraError ? (
                                <div className="p-3.5 text-[9.5px] text-rose-450 bg-rose-950/20 text-center font-semibold space-y-2">
                                  <div className="flex items-center justify-center gap-1 text-rose-450">
                                    <AlertCircle className="w-4 h-4 text-rose-500" />
                                    <span>{cameraError}</span>
                                  </div>
                                  <div className="flex justify-center gap-2">
                                    <button
                                      type="button"
                                      onClick={simulateCargoPhoto}
                                      className="px-2.5 py-1 bg-indigo-650 hover:bg-indigo-700 font-bold text-[9px] rounded text-white cursor-pointer transition-colors"
                                    >
                                      Use Simulated Proof
                                    </button>
                                    <button
                                      type="button"
                                      onClick={stopCamera}
                                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-705 font-bold text-[9px] rounded text-slate-350 cursor-pointer transition-colors"
                                    >
                                      Back
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="relative">
                                  <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-32 bg-black object-cover"
                                  />
                                  <div className="absolute inset-x-0 bottom-1.5 flex justify-center gap-1.5 z-10">
                                    <button
                                      type="button"
                                      onClick={capturePhoto}
                                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 font-bold text-[9.5px] rounded-lg shadow-md text-white cursor-pointer transition-colors"
                                    >
                                      📸 Tap to Snap
                                    </button>
                                    <button
                                      type="button"
                                      onClick={stopCamera}
                                      className="px-3 py-1 bg-slate-900/80 hover:bg-slate-900 font-bold text-[9.5px] rounded-lg text-slate-300 cursor-pointer transition-colors"
                                    >
                                      Close
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Cargo photo captured/uploaded preview */}
                          {cargoPhoto && (
                            <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                              <img
                                src={cargoPhoto}
                                alt="Captured Cargo Proof"
                                className="w-full h-28 object-cover opacity-90"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                              <div className="absolute top-1.5 right-1.5">
                                <button
                                  type="button"
                                  onClick={() => setCargoPhoto(null)}
                                  className="p-1 rounded-full bg-red-650/90 text-white hover:bg-red-750 transition-colors cursor-pointer"
                                  title="Retake proof"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="absolute bottom-1.5 left-2 right-2 text-[9px] text-emerald-400 font-mono flex items-center justify-between">
                                <span className="flex items-center gap-0.5">
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  Cargo Proof Attached
                                </span>
                                <span className="text-slate-405 text-[8px]">
                                  {cargoPhoto.startsWith("data:") ? "Image captured" : "Simulated"}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Signoff Complete Button */}
                        <button
                          type="button"
                          onClick={handleDriverComplete}
                          disabled={!recipientName || !cargoPhoto}
                          className="w-full mt-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed font-extrabold text-[11px] text-white rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer shadow-md shadow-emerald-950/20 select-none uppercase tracking-wider"
                        >
                          <CheckCircle2 className="w-4 h-4 text-white" />
                          Complete & Upload Sign-off
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="p-4 bg-slate-900 rounded-full text-slate-700">
                  <Truck className="w-8 h-8" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-200 text-xs">Waiting for dispatch orders...</h5>
                  <p className="text-[10px] text-slate-500 max-w-[200px] mx-auto mt-1 leading-relaxed">
                    No active Delivery Orders allocated to driver {currentDriver.name} at this moment. Dispatch a valid D/O to this driver.
                  </p>
                </div>
              </div>
            )}

            {/* Shift Logs header */}
            {completedTasks.length > 0 && (
              <div className="pt-2 border-t border-slate-900">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">COMPLETED TOURS TODAY ({completedTasks.length})</span>
                <div className="space-y-1.5 mt-1.5">
                  {completedTasks.map((t) => (
                    <div 
                      key={t.id} 
                      onClick={() => setViewingPhotoTask(t)}
                      className="bg-slate-900/60 p-2 rounded border border-slate-900 text-[10px] flex items-center justify-between cursor-pointer hover:bg-slate-900 hover:border-slate-800 group transition-all"
                    >
                      <span className="font-mono text-slate-350 group-hover:text-indigo-300 transition-colors">{t.doNumber}</span>
                      <span className="text-emerald-500 font-semibold font-mono flex items-center gap-1 bg-emerald-900/20 px-1.5 py-0.5 rounded border border-emerald-800/30">
                        <Eye className="w-3 h-3 text-emerald-400 group-hover:scale-110 transition-transform" />
                        Proof Rec.
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* App Footer Navigation Bar */}
          <div className="bg-slate-900 border-t border-slate-905 px-4 py-2.5 text-center text-[10px] text-slate-500 flex justify-around select-none">
            <span className="text-indigo-400 font-bold">Active Cargo</span>
            <span>History</span>
            <span>Account</span>
          </div>

        </div>
        {/* PHONE SCREEN END */}

        {/* Physical Home button */}
        <div className="w-10 h-10 rounded-full border border-slate-800 bg-slate-950 mt-3 flex items-center justify-center shadow-lg cursor-pointer">
          <div className="w-3.5 h-3.5 rounded border border-slate-700"></div>
        </div>
      </div>
    </div>
  );
}
