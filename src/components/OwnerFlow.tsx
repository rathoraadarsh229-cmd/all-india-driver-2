import React, { useState, useEffect } from 'react';
import { insforge } from '../insforge';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, ShieldCheck, Award, Star, MapPin, Truck, Phone, MessageSquare, 
  Lock, ArrowLeft, Check, AlertCircle, RefreshCw, Smartphone, Sparkles, CreditCard, Filter, Compass, PhoneOff, Mic, Volume2, Map, List,
  Camera, Upload, Trash2, Plus, Eye, Image as ImageIcon, Wrench, User, Heart
} from 'lucide-react';
import { DriverProfile, OwnerData } from '../types';
import { VEHICLE_PRESETS } from '../data';
import { ALL_STATES_DATA, DISTRICT_COORDINATES } from '../geoData';
import OpenStreetTracker from './OpenStreetTracker';
import { DashboardShell, DashboardTab } from './DashboardShell';
import { getT } from '../utils/i18n';
import { ConvoyView } from './ConvoyView';
import { HearButton } from './HearButton';
import { SafetyReminderModal } from './SafetyReminderModal';

interface OwnerFlowProps {
  currentStep: 'owner-dashboard' | 'driver-detail';
  setScreen: (screen: 'owner-dashboard' | 'driver-detail' | 'chat-room') => void;
  selectedDriver: DriverProfile | null;
  setSelectedDriver: (driver: DriverProfile | null) => void;
  unlockedDriverIds: string[];
  setUnlockedDriverIds: React.Dispatch<React.SetStateAction<string[]>>;
  replacementCredits: number;
  setReplacementCredits: React.Dispatch<React.SetStateAction<number>>;
  reportedDriverIds: string[];
  setReportedDriverIds: React.Dispatch<React.SetStateAction<string[]>>;
  driversList: DriverProfile[];
  ownerData: OwnerData;
  setOwnerData: React.Dispatch<React.SetStateAction<OwnerData>>;
  addLog?: (message: string, type: 'auth' | 'kyc' | 'unlock' | 'request' | 'system') => void;
  isRadarScanning?: boolean;
  setIsRadarScanning?: React.Dispatch<React.SetStateAction<boolean>>;
  radialFilterActive?: boolean;
  setRadialFilterActive?: React.Dispatch<React.SetStateAction<boolean>>;
  setShowNearbyMechanicModal?: (show: boolean) => void;
  onOpenMechanicChat?: (mech: any) => void;
  authType?: 'gmail' | 'guest';
  selectedLanguage?: string;
  setSelectedLanguage?: (lang: string) => void;
  onOpenDonate?: () => void;
  onOpenAiAssistant?: () => void;
  onGoToWebsite?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

// Helper to compute Haversine miles/km distance between coordinates
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 1.5; // fallback
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Number((R * c).toFixed(1));
}

export default function OwnerFlow({
  currentStep,
  setScreen,
  selectedDriver,
  setSelectedDriver,
  unlockedDriverIds,
  setUnlockedDriverIds,
  replacementCredits,
  setReplacementCredits,
  reportedDriverIds,
  setReportedDriverIds,
  driversList,
  ownerData,
  setOwnerData,
  addLog,
  isRadarScanning: propIsRadarScanning,
  setIsRadarScanning: propSetIsRadarScanning,
  radialFilterActive: propRadialFilterActive,
  setRadialFilterActive: propSetRadialFilterActive,
  setShowNearbyMechanicModal,
  onOpenMechanicChat,
  authType = 'gmail',
  selectedLanguage = 'hi',
  setSelectedLanguage,
  onOpenDonate,
  onOpenAiAssistant,
  onGoToWebsite,
  theme,
  onToggleTheme
}: OwnerFlowProps) {
  const t = getT(selectedLanguage);
  const [activeTab, setActiveTab] = useState<DashboardTab>('home');
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [newVehType, setNewVehType] = useState('18-चक्का ट्रेलर');
  const [newVehNumber, setNewVehNumber] = useState('');
  const [newJobRoute, setNewJobRoute] = useState('बालाघाट ➔ रायपुर');
  const [newJobVehicle, setNewJobVehicle] = useState('18-चक्का ट्रेलर');
  const [newJobSalary, setNewJobSalary] = useState('₹25,000 / महीना');

  const [ownerVehicles, setOwnerVehicles] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('aid_owner_vehicles');
      if (raw) return JSON.parse(raw);
    } catch {}
    if (ownerData.vehicleNumber || ownerData.vehicleType) {
      return [{
        id: 'veh-1',
        type: ownerData.vehicleType || '18-Wheeler Trailer',
        number: ownerData.vehicleNumber || 'MP-50-TR-8812',
        photos: ownerData.vehiclePhotos || []
      }];
    }
    return [];
  });

  const profileCompletionPercentage = React.useMemo(() => {
    let score = 25;
    if (ownerData.name && ownerData.name.trim().length > 0) score += 25;
    if (ownerData.companyName) score += 25;
    if (ownerData.vehicleNumber || ownerVehicles.length > 0) score += 25;
    return Math.min(100, score);
  }, [ownerData, ownerVehicles]);

  const [connectedMechanics, setConnectedMechanics] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('aid_connected_mechanics');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem('aid_connected_mechanics');
      if (raw) setConnectedMechanics(JSON.parse(raw));
    } catch {}
  }, [currentStep]);

  // States list representing standard driver states in mock data
  const [selectedState, setSelectedState] = useState<string>(ownerData?.state || 'Madhya Pradesh');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(ownerData?.city || 'Balaghat');
  const [selectedVillage, setSelectedVillage] = useState<string>('Ward-1 Civil Area');
  const [isOwnerFilterListening, setIsOwnerFilterListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [ownerSubView, setOwnerSubView] = useState<'main' | 'scanned-drivers'>('main');
  const [viewDisplayMode, setViewDisplayMode] = useState<'list' | 'map'>('map');
  const [isRefreshingGps, setIsRefreshingGps] = useState(false);

  // Keep search categories state synchronized if owner edits profile
  useEffect(() => {
    if (ownerData) {
      if (ownerData.state) setSelectedState(ownerData.state);
      if (ownerData.city) setSelectedDistrict(ownerData.city);
    }
  }, [ownerData]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Car' | 'Commercial' | 'Heavy Trailer'>('All');
  
  // Geospatial filtering
  const [localIsRadarScanning, setLocalIsRadarScanning] = useState(false);
  const [localRadialFilterActive, setLocalRadialFilterActive] = useState(false);

  const isRadarScanning = propIsRadarScanning !== undefined ? propIsRadarScanning : localIsRadarScanning;
  const setIsRadarScanning = propSetIsRadarScanning !== undefined ? propSetIsRadarScanning : setLocalIsRadarScanning;

  const radialFilterActive = propRadialFilterActive !== undefined ? propRadialFilterActive : localRadialFilterActive;
  const setRadialFilterActive = propSetRadialFilterActive !== undefined ? propSetRadialFilterActive : setLocalRadialFilterActive;


  // 🚛 Vehicle Photos Management in Dashboard & Modal
  const [showVehiclePhotoManageModal, setShowVehiclePhotoManageModal] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [ownerVehicleCameraActive, setOwnerVehicleCameraActive] = useState(false);
  const [ownerVehicleCameraStream, setOwnerVehicleCameraStream] = useState<MediaStream | null>(null);
  const [ownerVehicleFlashAlert, setOwnerVehicleFlashAlert] = useState(false);

  const startOwnerVehicleCam = async () => {
    setOwnerVehicleCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 300 } });
      setOwnerVehicleCameraStream(stream);
      setTimeout(() => {
        const vid = document.getElementById('owner-flow-webcam-preview') as HTMLVideoElement;
        if (vid) {
          vid.srcObject = stream;
          vid.play().catch(e => console.log('Video play error', e));
        }
      }, 100);
    } catch (err) {
      console.warn('Camera error', err);
    }
  };

  const stopOwnerVehicleCam = () => {
    if (ownerVehicleCameraStream) {
      ownerVehicleCameraStream.getTracks().forEach(t => t.stop());
      setOwnerVehicleCameraStream(null);
    }
    setOwnerVehicleCameraActive(false);
  };

  const captureOwnerVehicleCam = () => {
    setOwnerVehicleFlashAlert(true);
    setTimeout(() => setOwnerVehicleFlashAlert(false), 250);
    const vid = document.getElementById('owner-flow-webcam-preview') as HTMLVideoElement;
    if (vid && ownerVehicleCameraStream) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(vid, 0, 0, 400, 300);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setOwnerData(prev => ({
            ...prev,
            vehiclePhotos: [...(prev.vehiclePhotos || []), dataUrl]
          }));
        }
      } catch (e) {
        setOwnerData(prev => ({
          ...prev,
          vehiclePhotos: [...(prev.vehiclePhotos || []), 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&auto=format&fit=crop&q=80']
        }));
      }
    } else {
      setOwnerData(prev => ({
        ...prev,
        vehiclePhotos: [...(prev.vehiclePhotos || []), 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&auto=format&fit=crop&q=80']
      }));
    }
    stopOwnerVehicleCam();
  };

  const handleOwnerAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          setOwnerData(prev => ({
            ...prev,
            vehiclePhotos: [...(prev.vehiclePhotos || []), res]
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleOwnerRemovePhoto = (idxToRemove: number) => {
    setOwnerData(prev => ({
      ...prev,
      vehiclePhotos: (prev.vehiclePhotos || []).filter((_, i) => i !== idxToRemove)
    }));
  };
  
  // Auto-refund warning and auto-refund mockup
  const [showReportModal, setShowReportModal] = useState(false);
  const [isProcessingReport, setIsProcessingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Safety Reminder Modal state for hiring driver
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [pendingDriverToHire, setPendingDriverToHire] = useState<DriverProfile | null>(null);
  const [safetyTargetAction, setSafetyTargetAction] = useState<'detail' | 'chat'>('detail');

  // Load cascading changes
  useEffect(() => {
    const districts = Object.keys(ALL_STATES_DATA[selectedState] || {});
    if (districts.length > 0) {
      setSelectedDistrict(districts[0]);
    }
  }, [selectedState]);

  useEffect(() => {
    const villages = ALL_STATES_DATA[selectedState]?.[selectedDistrict] || [];
    if (villages.length > 0) {
      setSelectedVillage(villages[0]);
    }
  }, [selectedDistrict, selectedState]);

  // Determine current search center coordinates
  const currentCenterCoords = DISTRICT_COORDINATES[selectedDistrict] || DISTRICT_COORDINATES[selectedState] || { lat: 21.8124, lng: 80.1838 };

  // Calculate distances for all driver profiles relative to current search center
  const driversWithCalculatedDistances = driversList.map(drv => {
    let dLat = drv.lat;
    let dLng = drv.lng;
    
    // Fallback coordinates for preloaded mock data to preserve locality
    if (!dLat || !dLng) {
      if (drv.location.includes('Balaghat')) {
        dLat = 21.8150; dLng = 80.1850;
      } else if (drv.location.includes('Nagpur')) {
        dLat = 21.1458; dLng = 79.0882;
      } else if (drv.location.includes('Raipur')) {
        dLat = 21.2514; dLng = 81.6296;
      } else if (drv.location.includes('Jabalpur')) {
        dLat = 23.1815; dLng = 79.9864;
      } else if (drv.location.includes('Pune')) {
        dLat = 18.5204; dLng = 73.8567;
      } else {
        dLat = 21.8150; dLng = 80.1850;
      }
    }
    
    const computedDistance = getHaversineDistance(currentCenterCoords.lat, currentCenterCoords.lng, dLat, dLng);
    return {
      ...drv,
      distance: computedDistance,
      computedLat: dLat,
      computedLng: dLng
    };
  });

  // Filter Drivers dynamically
  let filteredDrivers = driversWithCalculatedDistances.filter(drv => {
    // Category match
    const matchesCategory = selectedCategory === 'All' ? true : drv.vehicleCategory === selectedCategory;

    // Direct text query search
    const matchesQuery = searchQuery.trim() === '' || 
                         drv.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         drv.vehicleType.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         drv.location.toLowerCase().includes(searchQuery.toLowerCase());

    // Geospatial geofence match (5km max)
    const matchesGeospatial = !radialFilterActive ? true : (drv.distance !== undefined && drv.distance <= 5.0);

    return matchesCategory && matchesQuery && matchesGeospatial;
  });

  // Sort drivers showing closest ones first
  filteredDrivers = filteredDrivers.sort((a, b) => (a.distance || 0) - (b.distance || 0));

  const handleOpenDriver = (driver: DriverProfile) => {
    setSelectedDriver(driver);
    setScreen('driver-detail');
  };

  // Perform free unlock via replacements credits
  const handleUnlockWithCredit = (driver: DriverProfile) => {
    if (replacementCredits > 0) {
      setReplacementCredits(prev => prev - 1);
      setUnlockedDriverIds(prev => [...prev, driver.id]);
      alert(`🎯 Lead for ${driver.name} successfully unlocked for FREE using 1 Replacement Credit!`);
    }
  };

  // Trigger scanning radar animation
  const handleScanRadar = () => {
    setIsRadarScanning(true);
    setRadialFilterActive(false);
    if (addLog) {
      addLog(`🛰️ Geospatial Scan: Searching for professional driver leads within 5.0km of ${selectedDistrict}...`, 'request');
    }
    setTimeout(() => {
      setIsRadarScanning(false);
      setRadialFilterActive(true);
      setOwnerSubView('scanned-drivers');
      if (addLog) {
        addLog(`✅ Geofence Filter Applied: Found active driver leads within 5.0km of ${selectedDistrict}.`, 'request');
      }
    }, 3000);
  };

  // Direct connection with mandatory Safety Reminder Popup before hiring
  const handleDirectConnectDriver = (driver: DriverProfile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPendingDriverToHire(driver);
    setSafetyTargetAction('detail');
    setIsSafetyModalOpen(true);
  };

  const handleOpenChatWithSafety = (driver: DriverProfile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPendingDriverToHire(driver);
    setSafetyTargetAction('chat');
    setIsSafetyModalOpen(true);
  };

  const handleConfirmHireDriver = () => {
    if (!pendingDriverToHire) return;
    const driver = pendingDriverToHire;
    setSelectedDriver(driver);
    setUnlockedDriverIds(prev => {
      if (!prev.includes(driver.id)) {
        return [...prev, driver.id];
      }
      return prev;
    });
    if (safetyTargetAction === 'chat') {
      setScreen('chat-room');
    } else {
      setScreen('driver-detail');
    }
    setPendingDriverToHire(null);
  };

  // Claims & Refunding Mockup dialog
  const handleInitiateReport = () => {
    setShowReportModal(true);
  };

  const handleCompleteReportAndRefund = () => {
    if (!selectedDriver) return;
    setIsProcessingReport(true);
    setTimeout(() => {
      setIsProcessingReport(false);
      setReportSuccess(true);
      
      // Mark reported
      setReportedDriverIds(prev => [...prev, selectedDriver.id]);
      
      // Credit wallet immediately with 1 "Free Replacement Credit"
      setReplacementCredits(prev => prev + 1);
    }, 1500);
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setReportSuccess(false);
  };

  const availableDistricts = Object.keys(ALL_STATES_DATA[selectedState] || {});
  const availableVillages = ALL_STATES_DATA[selectedState]?.[selectedDistrict] || [];

  return (
    <div className="flex-1 bg-slate-50 flex flex-col justify-between h-full relative overflow-hidden select-none">
      
      {/* 1. OWNER MARKETPLACE DASHBOARD */}
      {currentStep === 'owner-dashboard' && (
        <DashboardShell
          appName={t('appName', 'ALL INDIA DRIVER APP')}
          roleKey="owner"
          onOpenSOS={setShowNearbyMechanicModal ? () => setShowNearbyMechanicModal(true) : undefined}
          onOpenAiAssistant={onOpenAiAssistant}
          onGoToWebsite={onGoToWebsite}
          theme={theme}
          onToggleTheme={onToggleTheme}
          userName={ownerData.name || (authType === 'guest' ? 'गेस्ट गाड़ी मालिक' : 'गाड़ी मालिक')}
          userPhone={ownerData.phone || 'फ़ोन नंबर दर्ज नहीं'}
          userRoleTitle="गाड़ी मालिक"
          authType={authType}
          walletCredits={replacementCredits}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          profileCompletionPercentage={profileCompletionPercentage}
          onCompleteProfileClick={() => setScreen('owner-profile-setup' as any)}
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          onSwitchRoleClick={() => setScreen('role-selection' as any)}
          onLogoutClick={async () => {
            try {
              await insforge.auth.signOut();
            } catch {}
            try {
              localStorage.removeItem('all_india_driver_is_authenticated');
              localStorage.removeItem('all_india_driver_google_verified');
              localStorage.removeItem('all_india_driver_auth_type');
              localStorage.removeItem('all_india_driver_user_email');
              localStorage.removeItem('all_india_driver_verified_email');
            } catch {}
            setScreen('login' as any);
          }}
          onDonateClick={onOpenDonate}
        >
          {ownerSubView === 'scanned-drivers' ? (
            <div className="flex-1 flex flex-col h-full bg-slate-900 text-white overflow-hidden rounded-2xl">
              
              {/* Header Bar */}
              <div className="bg-navy p-4 border-b border-white/10 shrink-0 space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setOwnerSubView('main')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-bold text-white transition-all cursor-pointer border border-white/5"
                  >
                    <ArrowLeft className="h-4 w-4 text-brand-orange" />
                    <span>Back to Dashboard / वापस जाएँ</span>
                  </button>

                  <div className="bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-black text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Geofence Active: Within 5.0km</span>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="text-left">
                    <h2 className="text-sm font-black text-white flex items-center gap-1.5 font-display">
                      <Compass className="h-4 w-4 text-brand-orange animate-spin" style={{ animationDuration: '6s' }} />
                      <span>Nearby Sarthi Results / ५ किमी के चालक</span>
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 leading-normal">
                      List of drivers found within <span className="text-brand-orange">5.0 km</span> of {selectedVillage}, {selectedDistrict} ({selectedState})
                    </p>
                  </div>

                  <div className="text-right whitespace-nowrap shrink-0">
                    <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">MATCHED LEADS</span>
                    <span className="text-base font-black text-brand-orange">
                      {filteredDrivers.filter(d => (d.distance || 0) <= 5.0).length} / {driversList.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Category selector on this page */}
              <div className="bg-slate-950/80 border-b border-white/5 py-2 px-4 shrink-0 flex gap-1.5 overflow-x-auto scrollbar-hide">
                <button 
                  onClick={() => setSelectedCategory('All')}
                  className={`px-3 py-1 text-[10px] font-black rounded-full transition-all shrink-0 cursor-pointer ${
                    selectedCategory === 'All' 
                      ? 'bg-brand-orange text-navy' 
                      : 'bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  All Category
                </button>
                {VEHICLE_PRESETS.map((p) => (
                  <button
                    key={`scanned-preset-${p.label}`}
                    onClick={() => setSelectedCategory(p.category as any)}
                    className={`px-3.5 py-1.5 rounded-full text-[10px] font-black transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                      selectedCategory === p.category
                        ? 'bg-brand-orange text-navy'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    <span>{p.icon}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>

              {/* Interactive Radar Visual Header Block */}
              <div className="bg-gradient-to-b from-slate-950 to-slate-900 border-b border-white/5 px-4 py-3 shrink-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 bg-slate-950 rounded-full border border-brand-orange/30 flex items-center justify-center overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-conic-sweep origin-center animate-sweep-radar pointer-events-none opacity-50" />
                    <div className="h-1.5 w-1.5 bg-brand-orange rounded-full z-10 animate-ping" />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] font-black text-white block">Geospatial Ping Center</span>
                    <span className="text-[9px] text-slate-400 font-bold block leading-tight">
                      Lat: {currentCenterCoords.lat.toFixed(4)} • Lng: {currentCenterCoords.lng.toFixed(4)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleScanRadar}
                  className="px-3 py-1.5 bg-brand-orange/10 hover:bg-brand-orange/20 border border-brand-orange/30 rounded-xl text-[9px] font-black text-brand-orange uppercase flex items-center gap-1 transition-all cursor-pointer h-fit"
                >
                  <RefreshCw className="h-3 w-3 animate-spin duration-3000" />
                  <span>Re-Scan / पुनः स्कैन</span>
                </button>
              </div>

              {/* Scanned Drivers List Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950 select-none">
                
                {filteredDrivers.filter(d => (d.distance || 0) <= 5.0).length === 0 ? (
                  <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 text-center space-y-3">
                    <AlertCircle className="h-8 w-8 text-brand-orange mx-auto animate-bounce" />
                    <span className="block text-xs font-extrabold text-white">No drivers found in 5km radius</span>
                    <p className="text-[10px] text-slate-400 px-3 max-w-xs mx-auto leading-relaxed">
                      We couldn't find any drivers active in the immediate 5.0km radius. Try setting an alternative district search center or broadening constraints.
                    </p>
                    <button
                      onClick={() => setOwnerSubView('main')}
                      className="px-4 py-1.5 bg-white/10 hover:bg-white/15 text-white font-black text-[10px] rounded-xl border border-white/10 inline-block"
                    >
                      ← Back to edit filters
                    </button>
                  </div>
                ) : (
                  filteredDrivers.filter(d => (d.distance || 0) <= 5.0).map(drv => {
                    const isUnlocked = unlockedDriverIds.includes(drv.id);
                    const isReported = reportedDriverIds.includes(drv.id);

                    return (
                      <div
                        key={`scanned-card-${drv.id}`}
                        onClick={() => handleOpenDriver(drv)}
                        className={`bg-slate-900 border rounded-3xl p-4 shadow-sm transition-all relative flex flex-col justify-between cursor-pointer group ${
                          isReported 
                            ? 'opacity-60 border-red-500/20 bg-red-950/10' 
                            : 'border-white/5 hover:border-brand-orange/40 hover:bg-slate-850'
                        }`}
                      >
                        {/* Top corner distance metric badge */}
                        <div className="absolute top-4 right-4 flex gap-1 items-center">
                          <span className="text-[8px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-extrabold px-1.5 py-0.5 rounded uppercase">
                            📍 {drv.distance} km
                          </span>
                        </div>

                        {/* Profile Info */}
                        <div className="flex gap-3 text-left">
                          <div className="h-12 w-12 rounded-2xl overflow-hidden border-2 border-brand-orange shrink-0 relative bg-slate-950 shadow-md">
                            <img referrerPolicy="no-referrer" src={drv.photoUrl} alt="Avatar" className="h-full w-full object-cover" />
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-extrabold text-xs text-white leading-none">
                                {isUnlocked ? drv.name : drv.maskedName}
                              </h4>
                              {drv.authMethod === 'guest' ? (
                                <span className="text-[7.5px] bg-amber-500/20 text-amber-400 border border-amber-500/40 font-black px-1.5 py-0.5 rounded leading-none uppercase flex items-center gap-0.5">
                                  🟠 Guest User
                                </span>
                              ) : (
                                <span className="text-[7.5px] bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-black px-1.5 py-0.5 rounded leading-none uppercase flex items-center gap-0.5">
                                  🟢 Email verified
                                </span>
                              )}
                              <span className={`text-[7.5px] font-black px-1.5 py-0.5 rounded leading-none uppercase border ${
                                drv.hiringStatus === 'Hired'
                                  ? 'bg-purple-600/25 text-purple-300 border-purple-500/40'
                                  : drv.hiringStatus === 'Contacted'
                                    ? 'bg-blue-600/25 text-blue-300 border-blue-500/40'
                                    : 'bg-emerald-600/25 text-emerald-300 border-emerald-500/40'
                              }`}>
                                {drv.hiringStatus === 'Hired' ? '✓ Hired (नियुक्त)' : drv.hiringStatus === 'Contacted' ? '📞 Contacted' : '🟢 Available (उपलब्ध)'}
                              </span>
                            </div>

                            {/* Truck type, experience, distances */}
                            <div className="flex items-center gap-1.5 text-[9.5px] font-black text-slate-300 mt-1">
                              <span>{drv.vehicleType}</span>
                              <span className="text-brand-orange font-black">•</span>
                              <span className="text-slate-400">{drv.experience} Yr Experience</span>
                            </div>

                            {/* Location */}
                            <div className="flex items-center gap-1 text-[9.5px] font-black text-slate-300 mt-0.5">
                              <MapPin className="h-3 w-3 text-red-400 inline-block shrink-0 animate-pulse" />
                              <span className="truncate max-w-[150px] text-slate-400">{drv.location}</span>
                            </div>
                          </div>
                        </div>

                        {/* Duty Time Slots preference */}
                        <div className="mt-2.5 flex items-center gap-1 flex-wrap text-left">
                          <span className="text-[8.5px] text-slate-400 font-black uppercase tracking-wider mr-1">Duty Time Slots:</span>
                          {(drv.timingSlots || ['Morning', 'Afternoon', 'Flexible']).slice(0, 3).map(slot => (
                            <span key={`scanned-slot-${slot}`} className="text-[8px] bg-slate-950 border border-white/10 text-slate-300 font-extrabold px-2 py-0.5 rounded-full block">
                              ⏳ {slot}
                            </span>
                          ))}
                        </div>

                        {/* Masked details status widget */}
                        <div className="mt-2.5 bg-slate-950 border border-white/5 rounded-xl px-3 py-1.5 flex items-center justify-between text-left">
                          <div className="flex flex-col text-left">
                            <span className="text-[7.5px] uppercase tracking-wider text-slate-500 font-extrabold block">MOBILE (PRIVACY LOCKED)</span>
                            <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-300 mt-0.5">
                              <Lock className="h-3 w-3 text-brand-orange shrink-0" />
                              <span className="font-mono text-slate-400 tracking-wider font-semibold">{drv.maskedPhone}</span>
                            </div>
                            {isUnlocked && (
                              <span className="text-[7.5px] text-brand-orange font-bold mt-0.5">✓ Ask for contact in chat! / चैट में मांगें</span>
                            )}
                          </div>

                          <span className={`text-[10px] font-black uppercase tracking-wide ${
                            isUnlocked 
                              ? 'text-emerald-400' 
                              : isReported 
                                ? 'text-red-400' 
                                : 'text-brand-orange'
                          }`}>
                            {isUnlocked ? '✓ Unlocked' : isReported ? 'CLAIMED' : '🔒 Locked'}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="mt-3.5 pt-3 border-t border-white/5">
                          {isReported ? (
                            <span className="text-[9px] text-red-400 font-black text-center block">
                              ⚠️ This lead has been reported for replacement refund.
                            </span>
                          ) : !isUnlocked ? (
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDriver(drv);
                                }}
                                className="py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-[10px] rounded-xl flex items-center justify-center gap-1 uppercase cursor-pointer transition-all animate-none"
                              >
                                <span>View Info / देखें 📄</span>
                              </button>
                              
                              <button
                                onClick={(e) => handleDirectConnectDriver(drv, e)}
                                className="py-2 bg-brand-orange hover:bg-brand-orange/95 text-navy font-black text-[10px] rounded-xl flex items-center justify-center gap-1 shadow-md shadow-brand-orange/10 uppercase cursor-pointer transition-all"
                              >
                                <Smartphone className="h-3 w-3" />
                                <span>Connect / संपर्क करें (Free)</span>
                              </button>
                            </div>
                          ) : (
                            <div className="w-full">
                              <button
                                onClick={(e) => handleOpenChatWithSafety(drv, e)}
                                className="w-full py-2 bg-brand-orange hover:bg-brand-orange/90 text-navy font-black text-[10.5px] rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                              >
                                <MessageSquare className="h-3.5 w-3.5 text-navy group-hover:scale-110 transition-all shrink-0" />
                                <span>Start Direct Chat Room / चैट रूम</span>
                              </button>
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })
                )}

                <div className="h-10 shrink-0" />
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
              
              {/* MAIN SCROLLABLE DASHBOARD BODY */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
                
                {/* 1. HOME TAB */}
                {activeTab === 'home' && (
                  <>
                    {/* STATS: 3 CHHOTE CARDS */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center shadow-xs">
                        <span className="text-[11px] font-bold text-slate-500 block">मेरी गाड़ियाँ</span>
                        <span className="text-xl font-black text-navy mt-1 block">
                          {ownerVehicles.length || (ownerData.vehicleNumber ? 1 : 0)}
                        </span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center shadow-xs">
                        <span className="text-[11px] font-bold text-slate-500 block">शॉर्टलिस्टेड</span>
                        <span className="text-xl font-black text-brand-orange mt-1 block">
                          {unlockedDriverIds.length}
                        </span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center shadow-xs">
                        <span className="text-[11px] font-bold text-slate-500 block">वॉलेट क्रेडिट</span>
                        <span className="text-xl font-black text-emerald-600 mt-1 block">
                          {replacementCredits}
                        </span>
                      </div>
                    </div>

                    {/* QUICK ACTIONS: 4 BADE ROUNDED BUTTONS (MIN 48PX HEIGHT) */}
                    <div className="space-y-1.5 text-left">
                      <span className="text-xs font-black text-navy px-1 uppercase tracking-wide">त्वरित कार्य (Quick Actions)</span>
                      <div className="grid grid-cols-2 gap-2">
                        {/* DEDICATED MECHANIC CONNECTION BUTTON */}
                        {setShowNearbyMechanicModal && (
                          <button
                            type="button"
                            onClick={() => setShowNearbyMechanicModal(true)}
                            className="min-h-[58px] bg-[#1C1C21] hover:bg-[#25252c] text-white rounded-2xl p-3.5 flex items-center justify-between border-2 border-[#E10600] shadow-md cursor-pointer transition-all active:scale-[0.98] col-span-2 text-left"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-11 w-11 rounded-xl bg-[#E10600] text-[#1C1C21] flex items-center justify-center shrink-0 font-black shadow-xs">
                                <Wrench className="h-6 w-6 stroke-[2.5]" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-base font-black text-[#E10600] leading-tight">
                                    मैकेनिक चाहिए?
                                  </span>
                                  <span className="text-[10px] bg-[#E10600]/20 text-[#E10600] font-black px-2 py-0.5 rounded-full border border-[#E10600]/40 uppercase shrink-0">
                                    24x7 SOS
                                  </span>
                                </div>
                                <span className="text-sm font-bold text-slate-200 block truncate mt-0.5">
                                  गाड़ी खराब हो तभी दबाएँ, पास का मैकेनिक जुड़ेगा
                                </span>
                              </div>
                            </div>
                            <span className="text-xs font-black text-[#1C1C21] bg-[#E10600] px-3 py-2 rounded-xl shrink-0 ml-2 font-sans shadow-xs">
                              खोलें ➔
                            </span>
                          </button>
                        )}

                        {/* DEDICATED SUPPORT US BUTTON */}
                        {onOpenDonate && (
                          <button
                            type="button"
                            onClick={onOpenDonate}
                            className="min-h-[54px] bg-[#1C1C21] hover:bg-[#25252c] text-white rounded-2xl p-3 flex items-center justify-between border-2 border-[#E10600] shadow-sm cursor-pointer transition-all active:scale-[0.98] col-span-2 text-left"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-10 w-10 rounded-xl bg-[#E10600] text-[#1C1C21] flex items-center justify-center shrink-0 font-black">
                                <Heart className="h-5 w-5 fill-[#1C1C21]" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-black text-[#E10600] leading-tight">
                                    सपोर्ट करें (Support Us)
                                  </span>
                                  <span className="text-[9px] bg-[#E10600]/20 text-[#E10600] font-black px-1.5 py-0.5 rounded-full border border-[#E10600]/40 uppercase shrink-0">
                                    फ्री सेवा
                                  </span>
                                </div>
                                <span className="text-xs font-bold text-slate-300 block truncate mt-0.5">
                                  ऑनलाइन ड्राइवर को फ्री रखने में सहयोग दें एवं सभी सहयोगियों की सूची देखें
                                </span>
                              </div>
                            </div>
                            <span className="text-xs font-black text-[#1C1C21] bg-[#E10600] px-3 py-1.5 rounded-xl shrink-0 ml-2">
                              देखें ➔
                            </span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setActiveTab('search')}
                          className="min-h-[48px] py-2.5 px-3 bg-brand-orange hover:bg-orange-600 text-navy font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                        >
                          <Search className="h-5 w-5 text-navy shrink-0" />
                          <span>ड्राइवर खोजें</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowAddVehicleModal(true)}
                          className="min-h-[48px] py-2.5 px-3 bg-navy hover:bg-slate-900 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                        >
                          <Plus className="h-5 w-5 text-brand-orange shrink-0 stroke-[3]" />
                          <span>गाड़ी जोड़ें</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowVehiclePhotoManageModal(true)}
                          className="min-h-[48px] py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-navy font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
                        >
                          <Truck className="h-5 w-5 text-brand-orange shrink-0" />
                          <span>मेरी गाड़ियाँ</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowPostJobModal(true)}
                          className="min-h-[48px] py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-navy font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
                        >
                          <Sparkles className="h-5 w-5 text-brand-orange shrink-0" />
                          <span>ड्राइवर की ज़रूरत</span>
                        </button>
                      </div>
                    </div>

                    {/* SECTION: "MERI GAADIYAN" */}
                    <div className="space-y-2 text-left">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-1.5">
                          <Truck className="h-4 w-4 text-brand-orange" />
                          <h3 className="text-sm font-black text-navy uppercase tracking-wide">
                            मेरी गाड़ियां (My Vehicles)
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddVehicleModal(true)}
                          className="text-xs font-extrabold text-brand-orange hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>नई जोड़ें</span>
                        </button>
                      </div>

                      {ownerVehicles.length > 0 || ownerData.vehicleNumber ? (
                        <div className="space-y-2">
                          {(ownerVehicles.length > 0 ? ownerVehicles : [{
                            id: 'veh-main',
                            type: ownerData.vehicleType || '18-Wheeler Leyland Trailer',
                            number: ownerData.vehicleNumber || 'MP-50-TR-8812',
                            photos: ownerData.vehiclePhotos || []
                          }]).map((veh, idx) => (
                            <div key={veh.id || idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="h-11 w-11 bg-amber-50 border border-amber-200 text-brand-orange rounded-2xl flex items-center justify-center shrink-0">
                                    <Truck className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-[14px] font-black text-navy truncate">
                                      {veh.type}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-xs font-mono font-black text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-md border border-brand-orange/20">
                                        {veh.number}
                                      </span>
                                      <span className="text-[11px] font-bold text-slate-500">
                                        {veh.photos?.length || 0} फोटो
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setShowVehiclePhotoManageModal(true)}
                                  className="px-3 py-2 bg-brand-orange hover:bg-orange-600 active:scale-95 text-navy font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                                >
                                  <Plus className="h-3.5 w-3.5 stroke-[3]" />
                                  <span>फोटो जोड़ें</span>
                                </button>
                              </div>

                              {/* Photos preview or clean hint */}
                              {veh.photos && veh.photos.length > 0 ? (
                                <div className="flex gap-2 overflow-x-auto pb-1 pt-1 scrollbar-hide">
                                  {veh.photos.map((photo: string, pIdx: number) => (
                                    <div
                                      key={`veh-${idx}-photo-${pIdx}`}
                                      onClick={() => setViewingPhoto(photo)}
                                      className="relative h-14 w-20 rounded-xl overflow-hidden border border-slate-200 shrink-0 cursor-pointer group bg-slate-900 shadow-2xs"
                                    >
                                      <img src={photo} alt="Vehicle" className="h-full w-full object-cover group-hover:scale-105 transition-all duration-200" />
                                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all flex items-center justify-center">
                                        <Eye className="h-3.5 w-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div 
                                  onClick={() => setShowVehiclePhotoManageModal(true)}
                                  className="text-[13px] text-slate-500 hover:text-brand-orange cursor-pointer py-1 flex items-center gap-1.5 font-bold transition-colors"
                                >
                                  <Camera className="h-3.5 w-3.5 text-brand-orange shrink-0" />
                                  <span>📸 अभी गाड़ी की फोटो नहीं जुड़ी है। "फोटो जोड़ें" पर टैप करें।</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-xs space-y-3">
                          <Truck className="h-10 w-10 text-slate-300 mx-auto" />
                          <div>
                            <p className="text-sm font-black text-navy">अभी कोई गाड़ी नहीं जोड़ी गई है</p>
                            <p className="text-xs text-slate-500 font-bold mt-0.5">अपनी पहली गाड़ी जोड़कर ड्राइवर खोजना शुरू करें</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowAddVehicleModal(true)}
                            className="px-4 py-2 bg-brand-orange text-navy font-black text-xs rounded-xl hover:bg-orange-600 transition-all cursor-pointer"
                          >
                            + गाड़ी जोड़ें
                          </button>
                        </div>
                      )}
                    </div>

                    {/* SECTION: "HAAL MEIN DEKHE GAYE DRIVER" */}
                    <div className="space-y-2 text-left">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-1.5">
                          <Eye className="h-4 w-4 text-brand-orange" />
                          <h3 className="text-sm font-black text-navy uppercase tracking-wide">
                            हाल में देखे गए ड्राइवर
                          </h3>
                        </div>
                        {unlockedDriverIds.length > 0 && (
                          <span className="text-xs text-slate-500 font-bold">{unlockedDriverIds.length} ड्राइवर</span>
                        )}
                      </div>

                      {unlockedDriverIds.length > 0 ? (
                        <div className="space-y-2">
                          {driversList
                            .filter(drv => unlockedDriverIds.includes(drv.id))
                            .map(drv => (
                              <div
                                key={`unlocked-${drv.id}`}
                                onClick={() => handleOpenDriver(drv)}
                                className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs hover:border-brand-orange/40 transition-all cursor-pointer flex items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="h-12 w-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                                    <img src={drv.photoUrl} alt={drv.name} className="h-full w-full object-cover" />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-sm font-black text-navy truncate">{drv.name}</h4>
                                    <p className="text-xs text-slate-500 font-bold truncate">{drv.vehicleType} • {drv.location}</p>
                                    <span className="text-[11px] font-mono font-black text-emerald-700">📞 {drv.phone}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-black px-2 py-0.5 rounded-full border border-emerald-200">
                                    ✓ संपर्क उपलब्ध
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedDriver(drv);
                                      setScreen('chat-room');
                                    }}
                                    className="px-2.5 py-1 bg-brand-orange hover:bg-orange-600 text-navy font-black text-xs rounded-lg transition-all"
                                  >
                                    चैट करें
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-xs space-y-3">
                          <User className="h-10 w-10 text-slate-300 mx-auto" />
                          <div>
                            <p className="text-sm font-black text-navy">अभी कुछ नहीं है</p>
                            <p className="text-xs text-slate-500 font-bold mt-0.5">अपनी गाड़ी के लिए अनुभवी ड्राइवर खोजें</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab('search')}
                            className="px-4 py-2 bg-brand-orange text-navy font-black text-xs rounded-xl hover:bg-orange-600 transition-all cursor-pointer"
                          >
                            ड्राइवर खोजें ➔
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* 2. CONVOY TAB: "KAFILA" SECTION */}
                {activeTab === 'convoy' && (
                  <ConvoyView
                    currentUserName={ownerData.name || 'गाड़ी मालिक'}
                    currentUserPhone={ownerData.phone || ''}
                    currentUserCity={ownerData.city || ''}
                  />
                )}

                {/* 3. SEARCH TAB: "DRIVER DHOONDHEIN" SECTION */}
                {activeTab === 'search' && (
                  <>
                <div className="space-y-2 text-left">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5">
                      <Search className="h-4 w-4 text-brand-orange" />
                      <h3 className="text-sm font-black text-navy uppercase tracking-wide">
                        ड्राइवर ढूंढें (Driver Dhoondhein)
                      </h3>
                    </div>
                    {radialFilterActive && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                        ✓ 5 KM दायरा
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5">
                      <Search className="h-4 w-4 text-brand-orange" />
                      <h3 className="text-sm font-black text-navy uppercase tracking-wide">
                        ड्राइवर ढूंढें (Driver Dhoondhein)
                      </h3>
                    </div>
                    {radialFilterActive && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                        ✓ 5 KM दायरा
                      </span>
                    )}
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                    {/* Cascading State, District, Village Clean Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* State Filter */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                          राज्य (State)
                        </label>
                        <select
                          value={selectedState}
                          onChange={(e) => setSelectedState(e.target.value)}
                          className="w-full bg-slate-50 text-navy font-bold text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange cursor-pointer"
                        >
                          {Object.keys(ALL_STATES_DATA).map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      </div>

                      {/* District Filter */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                          ज़िला (District)
                        </label>
                        <select
                          value={selectedDistrict}
                          onChange={(e) => setSelectedDistrict(e.target.value)}
                          className="w-full bg-slate-50 text-navy font-bold text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange cursor-pointer"
                        >
                          {availableDistricts.map(dist => (
                            <option key={dist} value={dist}>{dist}</option>
                          ))}
                        </select>
                      </div>

                      {/* Village Filter with Mic */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                          गाँव / क्षेत्र (Village / Ward)
                        </label>
                        <div className="relative flex items-center gap-1.5">
                          <input
                            type="text"
                            value={selectedVillage}
                            onChange={(e) => setSelectedVillage(e.target.value)}
                            placeholder="उदा. गढ़ा, लालबर्रा..."
                            className="w-full bg-slate-50 text-navy font-bold text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange text-left"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const SpeechObj = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                              if (!SpeechObj) {
                                setVoiceSupported(false);
                                setIsOwnerFilterListening(true);
                                return;
                              }
                              try {
                                const rec = new SpeechObj();
                                rec.continuous = false;
                                rec.lang = 'hi-IN';
                                rec.interimResults = false;
                                rec.maxAlternatives = 1;
                                rec.onstart = () => setIsOwnerFilterListening(true);
                                rec.onresult = (event: any) => {
                                  const word = event.results[0][0].transcript;
                                  setSelectedVillage(word);
                                  setIsOwnerFilterListening(false);
                                };
                                rec.onerror = () => setIsOwnerFilterListening(false);
                                rec.onend = () => setIsOwnerFilterListening(false);
                                rec.start();
                              } catch {
                                setIsOwnerFilterListening(true);
                              }
                            }}
                            className={`p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                              isOwnerFilterListening
                                ? 'border-brand-orange bg-brand-orange text-navy animate-pulse'
                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-navy hover:border-slate-300'
                            }`}
                            title="बोलकर खोजें"
                          >
                            <Mic className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Suggestions */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[11px] text-slate-400 font-bold">सुझाव:</span>
                      {availableVillages.slice(0, 4).map(vil => (
                        <button
                          key={vil}
                          type="button"
                          onClick={() => setSelectedVillage(vil)}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-bold transition-all cursor-pointer ${
                            selectedVillage === vil
                              ? 'bg-brand-orange/15 border-brand-orange text-brand-orange font-black'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {vil}
                        </button>
                      ))}
                    </div>

                    {/* Search bar below filters */}
                    <div className="relative bg-slate-50 border border-slate-200 rounded-xl flex items-center px-3 py-2 text-slate-600 focus-within:border-brand-orange focus-within:bg-white transition-all">
                      <Search className="h-4 w-4 text-slate-400 shrink-0 mr-2" />
                      <input
                        type="text"
                        placeholder="खोजें: चालक नाम, अनुभव, वाहन प्रकार आदि..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-xs text-navy font-bold outline-none placeholder:text-slate-400 bg-transparent"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="text-xs text-slate-400 hover:text-navy font-black cursor-pointer px-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* 5 KM Smart Search Button */}
                    <div className="pt-1">
                      <button
                        type="button"
                        id="calculate-5km-btn"
                        onClick={handleScanRadar}
                        disabled={isRadarScanning}
                        className="w-full py-3 px-4 bg-navy hover:bg-slate-900 active:scale-[0.98] text-white font-black text-[13px] sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-navy/20 cursor-pointer transition-all border border-navy disabled:opacity-70"
                      >
                        <Compass className={`h-4 w-4 text-brand-orange ${isRadarScanning ? 'animate-spin' : ''}`} />
                        <span>{radialFilterActive ? '⚡ 5 KM स्मार्ट सर्च: पुनः स्कैन करें' : '⚡ 5 KM Smart Search (५ किमी दायरे में ड्राइवर खोजें)'}</span>
                      </button>

                      {radialFilterActive && (
                        <div className="mt-2.5 flex items-center justify-between text-xs bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                          <span className="font-bold text-emerald-800">
                            ✓ {selectedDistrict} के 5.0 किमी दायरे के चालक दिखाए जा रहे हैं
                          </span>
                          <button
                            type="button"
                            onClick={() => setRadialFilterActive(false)}
                            className="text-brand-orange hover:underline font-black cursor-pointer ml-2"
                          >
                            सभी दिखाएं
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 5. DRIVER HIRING NOTICE (CHHOTA INFO BANNER) */}
                <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-3 text-left flex items-center gap-2.5 shadow-2xs">
                  <div className="h-7 w-7 rounded-xl bg-brand-orange/20 text-brand-orange flex items-center justify-center shrink-0 font-bold text-xs">
                    ★
                  </div>
                  <p className="text-[13px] sm:text-[14px] text-amber-950 font-medium leading-snug">
                    <strong className="text-navy font-bold">चालक भर्ती सूचना:</strong> यहाँ केवल प्रमाणित व वैध लाइसेंस धारक व्यावसायिक चालक उपलब्ध हैं (लोडिंग/हमाली कार्य के लिए नहीं)।
                  </p>
                </div>

                {/* 7. DRIVERS RESULTS SECTION */}
                <div className="space-y-3 text-left">
                  {/* Results Header Bar & Toggle */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-navy">
                        उपलब्ध ड्राइवर ({filteredDrivers.length} एक्टिव)
                      </span>
                    </div>

                    {/* View Toggle Bar (Live Map Tracker vs List View) */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setViewDisplayMode('map')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          viewDisplayMode === 'map'
                            ? 'bg-navy text-white shadow-xs'
                            : 'text-slate-600 hover:text-navy hover:bg-slate-50'
                        }`}
                      >
                        <Map className="h-3.5 w-3.5 text-brand-orange" />
                        <span>लाइव नक्शा (Map)</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setViewDisplayMode('list')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          viewDisplayMode === 'list'
                            ? 'bg-navy text-white shadow-xs'
                            : 'text-slate-600 hover:text-navy hover:bg-slate-50'
                        }`}
                      >
                        <List className="h-3.5 w-3.5 text-brand-orange" />
                        <span>ड्राइवर सूची (List)</span>
                      </button>
                    </div>
                  </div>

                  {/* Category Filter Chips */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                    <button 
                      onClick={() => setSelectedCategory('All')}
                      className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all shrink-0 cursor-pointer ${
                        selectedCategory === 'All' 
                          ? 'bg-navy text-white shadow-xs' 
                          : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      सभी (All)
                    </button>
                    {VEHICLE_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        onClick={() => setSelectedCategory(p.category as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                          selectedCategory === p.category
                            ? 'bg-navy text-white shadow-xs'
                            : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span>{p.icon}</span>
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* OpenStreetMap Tracker (Map view) */}
                  {viewDisplayMode === 'map' && (
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs h-[320px]">
                      <OpenStreetTracker
                        userLocation={currentCenterCoords}
                        drivers={filteredDrivers}
                        selectedDriver={selectedDriver}
                        onSelectDriver={handleOpenDriver}
                        radiusKm={5}
                        isLocating={isRefreshingGps}
                        onRefreshGps={() => {
                          setIsRefreshingGps(true);
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              () => setIsRefreshingGps(false),
                              () => setIsRefreshingGps(false),
                              { timeout: 5000 }
                            );
                          } else {
                            setTimeout(() => setIsRefreshingGps(false), 1000);
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Drivers Cards List (Responsive Multi-Column Grid on Desktop) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {driversList.length === 0 ? (
                      <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-2">
                        <User className="h-10 w-10 text-slate-300 mx-auto" />
                        <span className="block text-sm font-black text-navy">
                          अभी कुछ नहीं है
                        </span>
                        <p className="text-xs text-slate-500 font-bold max-w-xs mx-auto">
                          कोई फर्जी यूज़र नहीं है। जैसे ही असली ड्राइवर ऐप पर रजिस्टर करेंगे, वे यहाँ सीधे दिखाई देंगे।
                        </p>
                      </div>
                    ) : filteredDrivers.length === 0 ? (
                      <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-2">
                        <AlertCircle className="h-8 w-8 text-slate-400 mx-auto" />
                        <span className="block text-sm font-extrabold text-slate-800">
                          इस फ़िल्टर में कोई ड्राइवर नहीं मिला
                        </span>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto">
                          कृपया ज़िला या गाँव का चयन बदलें या श्रेणी फ़िल्टर रीसेट करें।
                        </p>
                        <button
                          onClick={() => { setSelectedCategory('All'); setRadialFilterActive(false); setSearchQuery(''); }}
                          className="px-4 py-2 bg-brand-orange text-navy font-black text-xs rounded-xl shadow-xs inline-block mt-2 cursor-pointer hover:bg-orange-600 transition-all"
                        >
                          फ़िल्टर रीसेट करें
                        </button>
                      </div>
                    ) : (
                      filteredDrivers.map(drv => {
                        const isUnlocked = unlockedDriverIds.includes(drv.id);
                        const isReported = reportedDriverIds.includes(drv.id);

                        return (
                          <div
                            key={drv.id}
                            onClick={() => handleOpenDriver(drv)}
                            className={`bg-white border rounded-2xl p-4 shadow-xs hover:shadow-md transition-all relative flex flex-col justify-between cursor-pointer group ${
                              isReported ? 'opacity-60 border-red-200 bg-red-50/10' : 'border-slate-200 hover:border-brand-orange/40'
                            }`}
                          >
                            {/* Top Row Context */}
                            <div className="flex gap-3">
                              <div className="h-12 w-12 rounded-2xl overflow-hidden border-2 border-brand-orange shrink-0 relative bg-slate-100 shadow-xs">
                                <img src={drv.photoUrl} alt="Avatar" className="h-full w-full object-cover" />
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-extrabold text-sm text-navy leading-none">
                                    {isUnlocked ? drv.name : drv.maskedName}
                                  </h4>
                                  {drv.authMethod === 'guest' ? (
                                    <span className="text-[8px] bg-amber-50 text-amber-800 border border-amber-300 font-black px-1.5 py-0.5 rounded leading-none uppercase flex items-center gap-0.5">
                                      🟠 Guest User
                                    </span>
                                  ) : (
                                    <span className="text-[8px] bg-emerald-50 text-emerald-800 border border-emerald-300 font-black px-1.5 py-0.5 rounded leading-none uppercase flex items-center gap-0.5">
                                      🟢 Email verified
                                    </span>
                                  )}
                                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded leading-none uppercase border ${
                                    drv.hiringStatus === 'Hired'
                                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                                      : drv.hiringStatus === 'Contacted'
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}>
                                    {drv.hiringStatus === 'Hired' ? '✓ Hired' : drv.hiringStatus === 'Contacted' ? '📞 Contacted' : '🟢 Available'}
                                  </span>
                                </div>

                                {/* Truck type, experience */}
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mt-1">
                                  <span className="text-navy">{drv.vehicleType}</span>
                                  <span>•</span>
                                  <span>{drv.experience} साल अनुभव</span>
                                </div>

                                {/* Computed distance & location */}
                                <div className="flex items-center gap-1 text-xs font-bold text-slate-500 mt-0.5">
                                  <MapPin className="h-3.5 w-3.5 text-red-500 inline-block shrink-0" />
                                  <span className="text-emerald-700 font-extrabold">{drv.distance} km</span>
                                  <span className="text-slate-300">•</span>
                                  <span className="truncate max-w-[160px]">{drv.location}</span>
                                </div>
                              </div>

                              {/* Rating & Salary */}
                              <div className="text-right shrink-0">
                                <div className="flex items-center gap-0.5 text-amber-500 text-xs font-black justify-end">
                                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                  <span>{drv.rating || '4.8'}</span>
                                </div>
                                <span className="text-[9px] text-slate-400 block mt-1">वेतन अपेक्षा</span>
                                <span className="text-xs font-black text-navy">{drv.salaryExpectation}</span>
                              </div>
                            </div>

                            {/* TIMING SLOTS PREFERENCE */}
                            <div className="mt-2.5 flex items-center gap-1 flex-wrap">
                              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider mr-1">शिफ्ट:</span>
                              {(drv.timingSlots || ['Morning', 'Afternoon', 'Flexible']).slice(0, 3).map(slot => (
                                <span key={slot} className="text-[9px] bg-slate-100 border border-slate-200 text-navy font-bold px-2 py-0.5 rounded-full block">
                                  {slot}
                                </span>
                              ))}
                            </div>

                            {/* Masked details status widget */}
                            <div className="mt-2.5 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 flex items-center justify-between">
                              <div className="flex flex-col text-left">
                                <span className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold block">मोबाइल नंबर</span>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mt-0.5">
                                  <Lock className="h-3 w-3 text-brand-orange shrink-0" />
                                  <span className="font-mono text-slate-500 font-semibold">{drv.maskedPhone}</span>
                                </div>
                              </div>

                              <span className={`text-[10px] font-black uppercase tracking-wide ${
                                isUnlocked 
                                  ? 'text-emerald-600' 
                                  : isReported 
                                    ? 'text-red-500' 
                                    : 'text-brand-orange'
                              }`}>
                                {isUnlocked ? '✓ Unlocked' : isReported ? 'CLAIMED' : '🔒 Locked'}
                              </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDriver(drv);
                                  setScreen('chat-room');
                                }}
                                className="flex-1 py-2.5 bg-brand-orange hover:bg-orange-600 active:scale-[0.98] text-navy font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                              >
                                <MessageSquare className="h-3.5 w-3.5 text-navy" />
                                <span>चैट रूम खोलें (Chat Room)</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDriver(drv);
                                }}
                                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-navy font-black text-xs rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer border border-slate-200"
                              >
                                <span>विवरण ➔</span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="h-6" />
                  </>
                )}
              </div>
            </div>
          )}
        </DashboardShell>
      )}

      {/* 2. DETAILED DRIVER RECORD OVERVIEW */}
      {currentStep === 'driver-detail' && selectedDriver && (
        <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto">
          
          <div className="bg-white border-b border-slate-100 p-4 flex items-center gap-3 shrink-0">
            <button 
              onClick={() => setScreen('owner-dashboard')}
              className="p-1.5 rounded-xl hover:bg-slate-150 transition-all cursor-pointer border border-slate-150"
            >
              <ArrowLeft className="h-4 w-4 text-navy" />
            </button>
            <div className="flex-1">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">DRIVER ACTIVE RECORD</span>
              <h1 className="text-sm font-extrabold text-navy leading-none">
                {unlockedDriverIds.includes(selectedDriver.id) ? selectedDriver.name : selectedDriver.maskedName}
              </h1>
            </div>
            
            <div className="bg-emerald-50 border border-emerald-250 text-emerald-600 text-[9px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
              <span>ONLINE NOW</span>
            </div>
          </div>

          <div className="p-4 space-y-4">
            
            {/* Primary presentation card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs relative overflow-hidden">
              <div className="flex gap-4">
                <div className="flex flex-col items-center space-y-2 shrink-0">
                  <div className="h-16 w-16 rounded-2xl overflow-hidden border-2 border-brand-orange bg-slate-100">
                    <img src={selectedDriver.photoUrl} alt="Avatar" className="h-full w-full object-cover" />
                  </div>
                  {selectedDriver.authMethod === 'guest' ? (
                    <span className="bg-amber-500 text-white font-black text-[7.5px] px-1.5 py-0.5 rounded block uppercase tracking-wider text-center">
                      🟠 GUEST USER
                    </span>
                  ) : (
                    <span className="bg-emerald-600 text-white font-black text-[7.5px] px-1.5 py-0.5 rounded block uppercase tracking-wider text-center">
                      🟢 EMAIL VERIFIED
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="text-sm font-extrabold text-navy leading-relaxed leading-none block truncate">
                    {unlockedDriverIds.includes(selectedDriver.id) ? selectedDriver.name : selectedDriver.maskedName}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-500 flex-wrap">
                    <div className="flex items-center gap-0.5 text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                      <span>{selectedDriver.rating} Rating</span>
                    </div>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500 font-extrabold">{selectedDriver.tripsCompleted || '300'}+ Trips Completed</span>
                  </div>

                  <div className="text-[11px] font-bold text-slate-600 space-y-0.5 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">चलाने का अनुभव: <strong className="text-navy">{selectedDriver.vehicleType}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate text-emerald-600">{selectedDriver.distance || '1.8'} km from your search center ({selectedDriver.location})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile status info segment */}
              <div className="mt-4 border-t border-dashed border-slate-150 pt-3.5 grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150/40">
                  <span className="text-[9px] text-slate-450 font-bold block">PROFILE STATUS</span>
                  <span className="text-[10px] font-extrabold text-emerald-600 truncate block mt-0.5">PHONE VERIFIED</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150/40">
                  <span className="text-[9px] text-slate-450 font-bold block">EXPECTED NET SALARY</span>
                  <span className="text-[10px] font-extrabold text-emerald-600 truncate block mt-0.5">{selectedDriver.salaryExpectation}</span>
                </div>
              </div>
            </div>

            {/* Owner Clarification Banner */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex items-start gap-2.5">
              <span className="text-brand-orange text-sm mt-0.5">🚛</span>
              <div className="text-left">
                <span className="text-[10px] font-black text-navy uppercase block">हायरिंग नियम (Hiring Rule):</span>
                <p className="text-[9.5px] text-slate-600 font-bold leading-tight mt-0.5">
                  गाड़ी (वाहन) मालिक उपलब्ध कराएंगे। यह चालक आपकी गाड़ी पर सुरक्षित ड्राइविंग सेवा प्रदान करेंगे। वेतन या ट्रिप भत्ता बातचीत करके तय करें।
                </p>
              </div>
            </div>

            {/* PREFERENCES LIST */}
            <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-2">
              <span className="block text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest">WORK PREFERENCES & STATS</span>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-bold">
                <div className="bg-slate-50 p-2 rounded-xl">💼 Mode: <strong className="text-navy">{selectedDriver.workMode || 'Full-time'}</strong></div>
                <div className="bg-slate-50 p-2 rounded-xl">🚗 Class: <strong className="text-navy">{selectedDriver.vehicleCategory}</strong></div>
              </div>

              <div className="space-y-1 mt-1.5">
                <span className="block text-[8px] text-slate-400 font-extrabold uppercase">Preferred Time slots</span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedDriver.timingSlots || ['Morning', 'Afternoon', 'Flexible']).map(slot => (
                    <span key={slot} className="bg-brand-orange/10 text-navy font-black text-[9px] px-2.5 py-0.5 rounded-full">
                      ⏳ {slot}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* THE METICULOUS ESCROW LOCK BOX */}
            {!unlockedDriverIds.includes(selectedDriver.id) ? (
              <div className="bg-navy rounded-3xl p-5 text-white shadow-md text-center space-y-4">
                
                <div className="h-10 w-10 bg-brand-orange text-navy rounded-full flex items-center justify-center mx-auto">
                  <Lock className="h-5 w-5" />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[9px] text-brand-orange font-extrabold uppercase tracking-widest block">SECURE DIRECT CONTACT BLOCK</span>
                  <h3 className="text-sm font-extrabold leading-tight">ड्राइवर से सीधा संपर्क अनलॉक करें (बिना दस्तावेज़ झंझट)</h3>
                  <p className="text-[10px] text-slate-350 leading-relaxed font-semibold px-2">
                    ड्राइवर से सीधा संपर्क करें। 100% बिचौलिया रहित डायरेक्ट हायरिंग (पूर्णतः निःशुल्क)।
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handleDirectConnectDriver(selectedDriver)}
                    className="w-full py-3.5 bg-brand-orange hover:opacity-95 text-navy font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-brand-orange/20 cursor-pointer uppercase tracking-wider transition-all"
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>सीधे संपर्क करें व चैट रूम खोलें (निःशुल्क / Free)</span>
                  </button>
                </div>

                <div className="border-t border-white/10 pt-3">
                  <p className="text-[9.5px] text-emerald-400 font-bold leading-normal text-left">
                    ✓ <strong className="text-white">100% डायरेक्ट संपर्क:</strong> कोई शुल्क या पेमेंट गेटवे नहीं। सीधे चालक से बात करें।
                  </p>
                </div>

              </div>
            ) : (
              /* POST-PAYMENT UNLOCKED VIEW */
              <div className="space-y-4">
                
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-4 text-emerald-800 space-y-3.5 animate-fade-in text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-7 w-7 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                      <Check className="h-4.5 w-4.5 stroke-[3]" />
                    </div>
                    <div>
                      <span className="text-[8.5px] text-emerald-600 font-extrabold uppercase block tracking-wide">LEAD UNLOCKED</span>
                      <h4 className="text-xs font-black text-navy">{selectedDriver.name} is Unlocked</h4>
                    </div>
                  </div>

                  {/* Verified phone and DL */}
                  <div className="bg-white border border-emerald-200 p-3 rounded-2xl space-y-2 text-left">
                    <div className="flex items-center justify-between text-xs font-bold border-b border-slate-50 pb-2">
                      <span className="text-slate-500">DIRECT MOBILE NO.</span>
                      <span className="text-slate-400 font-mono text-xs font-extrabold tracking-wider">🔒 {selectedDriver.maskedPhone}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold border-b border-slate-50 pb-2">
                      <span className="text-slate-500 font-bold">PRIVACY LOCK</span>
                      <span className="text-brand-orange text-[9.5px] font-black uppercase text-right leading-tight">ACTIVE (NO LEAK)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold pt-1">
                      <span className="text-slate-500">EXPERIENCE</span>
                      <span className="text-navy font-bold tracking-wider">{selectedDriver.experience || '5+ Years Experience'}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-600 font-bold px-3 text-center bg-amber-500/10 border border-amber-500/20 rounded-xl py-2 leading-relaxed">
                    🔒 <span className="text-brand-orange">सुरक्षा कारणों से ड्राइवर का नंबर प्राइवेट रखा गया है।</span> आप चैट रूम में ड्राइवर से सीधा नंबर मांग सकते हैं!
                  </p>

                  {/* Actions chat */}
                  <div className="w-full px-1">
                    <button
                      onClick={() => handleOpenChatWithSafety(selectedDriver)}
                      className="w-full py-3 bg-brand-orange hover:opacity-95 text-navy font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-brand-orange/15 uppercase tracking-widest cursor-pointer transition-all"
                    >
                      <MessageSquare className="h-4 w-4 text-navy shrink-0 animate-pulse" />
                      <span>Start Direct Chat Room / चैट रूम</span>
                    </button>
                  </div>
                </div>

                {/* Match cancellation & Report */}
                {!reportedDriverIds.includes(selectedDriver.id) ? (
                  <div className="bg-red-50 border border-red-150 rounded-2xl p-4 space-y-2.5 text-center">
                    <span className="block text-red-700 text-[11px] font-black uppercase text-left">
                      ❌ बातचीत नहीं बनी? / Cancel Match & Report
                    </span>
                    <p className="text-[10px] text-slate-500 font-semibold leading-normal text-left">
                      यदि ड्राइवर से आपकी बात नहीं बनती है या आवश्यकता पूरी नहीं होती है, तो यहाँ मैच रद्द करें। आपकी रिपोर्ट सुरक्षित रूप से दर्ज कर ली जाएगी।
                    </p>
                    <button
                      onClick={handleInitiateReport}
                      className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] rounded-lg tracking-wide uppercase cursor-pointer shadow-sm active:scale-95 transition-all"
                    >
                      Cancel Match / मैच रद्द करें ❌
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-100 border border-slate-200 rounded-2xl p-3.5 text-center text-slate-550 font-bold text-[10px]">
                    ✓ इस ड्राइवर का मैच रद्द किया जा चुका है। आपकी रिपोर्ट दर्ज है।
                  </div>
                )}

              </div>
            )}

            {/* Safety Guidelines block for Owners */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 flex gap-3 shadow-xs">
              <ShieldCheck className="h-5 w-5 text-brand-orange shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-0.5">
                <span className="block text-[11px] font-extrabold text-navy">गाड़ी मालिकों के लिए जरुरी हिदायतें (Safety Alert):</span>
                <p className="text-[10px] text-slate-500 leading-normal font-semibold">
                  कृपया गाड़ी पर रवाना करने से पहले ड्राइवर के मूल दस्तावेजों की स्वयं भौतिक रूप से जांच अवश्य कर लें। ऑल इंडिया ड्राइवर ऐप सीधे संपर्क सूत्र प्रदान करता है।
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ============================================================== */}
      {/* 4. SIMULATED REFUND & REPLACEMENT SYSTEM POPUP */}
      {/* ============================================================== */}
      <AnimatePresence>
        {showReportModal && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full p-5 space-y-4 border border-slate-150 shadow-2xl max-w-[340px]"
            >
              
              {!reportSuccess ? (
                <>
                  <div className="text-center space-y-2">
                    <div className="h-12 w-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-black text-navy uppercase leading-tight">क्या आपको ड्राइवर पसंद नहीं आया?</h3>
                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                      यदि ड्राइवर <strong className="text-slate-800">{selectedDriver?.name}</strong> आपको बातचीत या व्यवहार में पसंद नहीं आया है, तो यहाँ मैच रद्द करें। आपकी रिपोर्ट सुरक्षित रूप से दर्ज कर ली जाएगी।
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl space-y-2 text-left">
                    <span className="text-[9px] text-slate-400 font-bold block bg-white border px-1.5 py-0.5 rounded italic w-max mb-1">Reason for Cancellation / रद्द करने का कारण:</span>
                    {[
                      'Incompatibility / Driver not liked (ड्राइवर पसंद नहीं आया)',
                      'High salary demand (ज्यादा तनख्वाह मांग रहा है)',
                      'Route or location mismatch (लोकेशन पर सहमति नहीं बनी)',
                      'Driver behaved unprofessionally (व्यवहार ठीक नहीं लगा)'
                    ].map((reason, index) => (
                      <label key={index} className="flex items-start gap-2 text-[10px] text-slate-650 font-bold cursor-pointer hover:text-navy">
                        <input type="radio" name="report_reason" defaultChecked={index === 0} className="mt-0.5 accent-brand-orange" />
                        <span>{reason}</span>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowReportModal(false)}
                      className="w-1/2 py-2.5 bg-slate-105 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-xl cursor-pointer uppercase"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCompleteReportAndRefund}
                      disabled={isProcessingReport}
                      className="w-1/2 py-2.5 bg-red-650 hover:bg-red-700 text-white font-black text-[10px] rounded-xl flex items-center justify-center gap-1 cursor-pointer shadow-sm uppercase disabled:opacity-75 disabled:cursor-wait"
                    >
                      {isProcessingReport ? 'Processing...' : 'Submit Claim 🛡️'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-4 py-2">
                  <div className="h-14 w-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                    <Check className="h-8 w-8" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-navy uppercase leading-normal">Report Submitted 🛡️</h3>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed px-2">
                      आपकी शिकायत स्वीकृत कर ली गई है। ड्राइवर प्रोफाइल की जांच की जा रही है।
                    </p>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-center">
                    <span className="block text-[9px] font-bold text-emerald-600 uppercase">100% FREE CONNECT</span>
                    <span className="block text-xs font-black">Direct Driver Connect Active</span>
                    <span className="block text-[9px] text-slate-500 font-bold leading-normal mt-0.5">
                      आप किसी भी अन्य ड्राइवर से सीधे व निःशुल्क संपर्क कर सकते हैं!
                    </span>
                  </div>

                  <button
                    onClick={closeReportModal}
                    className="w-full py-3 bg-navy text-white hover:opacity-90 font-black text-xs rounded-xl cursor-pointer uppercase tracking-wider"
                  >
                    अनलॉक करने हेतु वापस जाएँ
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* 5. VEHICLE PHOTOS MANAGE & UPLOAD MODAL */}
      {/* ============================================================== */}
      <AnimatePresence>
        {showVehiclePhotoManageModal && (
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-xl p-5 space-y-4 border border-slate-200 shadow-2xl text-left max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-slate-150 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <div className="h-7 w-7 rounded-lg bg-brand-orange/15 flex items-center justify-center text-brand-orange">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-navy uppercase leading-none">मेरी गाड़ी की फोटो और विवरण</h3>
                    <span className="text-[8.5px] text-slate-400 font-bold">Vehicle Photos & Details</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { stopOwnerVehicleCam(); setShowVehiclePhotoManageModal(false); }}
                  className="p-1 px-2 text-slate-400 hover:text-navy font-black text-xs rounded-lg hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              {/* Vehicle Type & Number Inputs */}
              <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                <div>
                  <label className="block text-[8.5px] font-extrabold text-slate-500 uppercase tracking-wide">
                    गाड़ी का नाम / प्रकार (Vehicle Type):
                  </label>
                  <input
                    type="text"
                    value={ownerData.vehicleType || ''}
                    onChange={(e) => setOwnerData(prev => ({ ...prev, vehicleType: e.target.value }))}
                    placeholder="उदा. 18-चक्का ट्रेलर, 12-चक्का टिपर"
                    className="w-full mt-0.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-navy outline-none focus:border-brand-orange"
                  />
                </div>
                <div>
                  <label className="block text-[8.5px] font-extrabold text-slate-500 uppercase tracking-wide">
                    गाड़ी नंबर (Number Plate):
                  </label>
                  <input
                    type="text"
                    value={ownerData.vehicleNumber || ''}
                    onChange={(e) => setOwnerData(prev => ({ ...prev, vehicleNumber: e.target.value.toUpperCase() }))}
                    placeholder="उदा. MP 50 TR 8812"
                    className="w-full mt-0.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-navy outline-none uppercase focus:border-brand-orange"
                  />
                </div>
              </div>

              {/* Current Photos Grid */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-extrabold text-navy uppercase tracking-wider">
                    गाड़ी की मौजूदा तस्वीरें ({ownerData.vehiclePhotos?.length || 0})
                  </span>
                  <span className="text-[8px] text-slate-400 font-bold">टैप करके बड़ी फोटो देखें</span>
                </div>

                {ownerData.vehiclePhotos && ownerData.vehiclePhotos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {ownerData.vehiclePhotos.map((photo, pIdx) => (
                      <div
                        key={`modal-photo-${pIdx}`}
                        className="relative rounded-xl overflow-hidden border-2 border-brand-orange bg-slate-900 aspect-video shadow-xs group"
                      >
                        <img
                          src={photo}
                          alt="Vehicle"
                          onClick={() => setViewingPhoto(photo)}
                          className="h-full w-full object-cover cursor-pointer hover:scale-105 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => handleOwnerRemovePhoto(pIdx)}
                          className="absolute top-1 right-1 h-5 w-5 bg-red-600 text-white rounded-full flex items-center justify-center opacity-90 hover:opacity-100 cursor-pointer shadow-sm"
                          title="हटाएँ"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[7px] font-black text-center py-0.5">
                          #{pIdx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center text-[9.5px] font-bold text-amber-800">
                    कोई फोटो नहीं है। कृपया नीचे से नई फोटो जोड़ें।
                  </div>
                )}
              </div>

              {/* Add New Photos Options */}
              <div className="space-y-2 border-t border-slate-150 pt-2.5">
                <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  नई गाड़ी फोटो जोड़ें / Add Vehicle Photos:
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <label className="py-2.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-center cursor-pointer transition-all flex items-center justify-center gap-1.5 text-[9.5px] font-extrabold text-navy shadow-2xs">
                    <Upload className="h-3.5 w-3.5 text-brand-orange" />
                    <span>गैलरी से अपलोड</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleOwnerAddFiles}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      if (ownerVehicleCameraActive) {
                        stopOwnerVehicleCam();
                      } else {
                        startOwnerVehicleCam();
                      }
                    }}
                    className={`py-2.5 px-2 rounded-xl text-center cursor-pointer transition-all flex items-center justify-center gap-1.5 text-[9.5px] font-extrabold border shadow-2xs ${
                      ownerVehicleCameraActive
                        ? 'bg-red-50 border-red-300 text-red-700'
                        : 'bg-brand-orange/15 hover:bg-brand-orange/25 border-brand-orange/30 text-navy'
                    }`}
                  >
                    <Camera className="h-3.5 w-3.5 text-brand-orange" />
                    <span>{ownerVehicleCameraActive ? 'कैमरा बंद करें' : 'लाइव कैमरा फोटो'}</span>
                  </button>
                </div>

                {/* Webcam viewport if active */}
                {ownerVehicleCameraActive && (
                  <div className="bg-black p-2.5 rounded-xl border border-brand-orange space-y-2 text-center">
                    <div className="relative h-36 w-full rounded-lg overflow-hidden bg-black flex items-center justify-center">
                      {ownerVehicleFlashAlert && (
                        <div className="absolute inset-0 bg-white z-20 animate-fade-out" />
                      )}
                      <video
                        id="owner-flow-webcam-preview"
                        playsInline
                        muted
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={captureOwnerVehicleCam}
                      className="w-full py-2 bg-brand-orange text-navy rounded-lg font-black text-[10px] flex items-center justify-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>गाड़ी की फोटो खींचें (Capture Snapshot)</span>
                    </button>
                  </div>
                )}

                {/* Ready Test Presets */}
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[8px] font-bold text-slate-400 block uppercase">⚡ 1-क्लिक रेडी फोटो टेम्पलेट्स:</span>
                  <div className="flex flex-wrap gap-1">
                    {[
                      {
                        label: '+ Trailer (6 Photos)',
                        photos: [
                          'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&auto=format&fit=crop&q=80',
                          'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&auto=format&fit=crop&q=80',
                          'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
                          'https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?w=800&auto=format&fit=crop&q=80',
                          'https://images.unsplash.com/photo-1508974239320-0a029497e820?w=800&auto=format&fit=crop&q=80',
                          'https://images.unsplash.com/photo-1586191582152-32b0a3311db9?w=800&auto=format&fit=crop&q=80'
                        ]
                      },
                      {
                        label: '+ Tipper (टिपर)',
                        photos: [
                          'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80'
                        ]
                      },
                      {
                        label: '+ Pickup (पिकअप)',
                        photos: [
                          'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&auto=format&fit=crop&q=80'
                        ]
                      }
                    ].map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setOwnerData(prev => ({
                            ...prev,
                            vehiclePhotos: [...(prev.vehiclePhotos || []), ...preset.photos]
                          }));
                        }}
                        className="px-2 py-0.5 bg-white hover:bg-brand-orange/20 border border-slate-200 text-navy text-[8px] font-bold rounded cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Action Button */}
              <button
                type="button"
                onClick={() => { stopOwnerVehicleCam(); setShowVehiclePhotoManageModal(false); }}
                className="w-full py-3 bg-navy text-white hover:bg-navy/95 font-black text-xs rounded-xl flex items-center justify-center gap-1 shadow-md cursor-pointer transition-all"
              >
                <span>सुरक्षित करें (Save & Done) ✓</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* 6. FULL-SCREEN VEHICLE PHOTO LIGHTBOX MODAL */}
      {/* ============================================================== */}
      <AnimatePresence>
        {viewingPhoto && (
          <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 select-none"
            onClick={() => setViewingPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-sm w-full bg-slate-900 rounded-3xl overflow-hidden p-2.5 border border-white/20 shadow-2xl text-center space-y-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center px-1 pt-1">
                <span className="text-[10px] font-black text-brand-orange uppercase tracking-wider flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5" />
                  <span>मालिक की गाड़ी की फोटो (Vehicle Photo)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setViewingPhoto(null)}
                  className="h-6 w-6 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center font-bold text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[65vh]">
                <img
                  src={viewingPhoto}
                  alt="Vehicle Zoom"
                  className="w-full h-auto object-contain max-h-[65vh]"
                />
              </div>

              <div className="flex justify-between items-center text-[9px] text-slate-300 font-bold px-1 pb-1">
                <span>{ownerData.vehicleType || '18-Wheeler Leyland Trailer'}</span>
                <span className="font-mono text-brand-orange">{ownerData.vehicleNumber || 'MP-50-TR-8812'}</span>
              </div>

              <button
                type="button"
                onClick={() => setViewingPhoto(null)}
                className="w-full py-2 bg-brand-orange text-navy font-black text-xs rounded-xl cursor-pointer"
              >
                बंद करें (Close)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. ADD VEHICLE MODAL */}
      <AnimatePresence>
        {showAddVehicleModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 text-left"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-150">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 bg-brand-orange/15 text-brand-orange rounded-xl flex items-center justify-center font-black">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-navy leading-none">नई गाड़ी जोड़ें</h3>
                    <span className="text-[11px] text-slate-500 font-bold">Add New Fleet Vehicle</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(false)}
                  className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-black"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">गाड़ी का प्रकार (Vehicle Type):</label>
                  <select
                    value={newVehType}
                    onChange={(e) => setNewVehType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-navy outline-none focus:border-brand-orange"
                  >
                    <option value="18-चक्का ट्रेलर">18-चक्का ट्रेलर (Trailer)</option>
                    <option value="12-चक्का टिपर">12-चक्का टिपर (Tipper)</option>
                    <option value="10-चक्का ट्रक">10-चक्का ट्रक (Truck)</option>
                    <option value="6-चक्का कैंटर">6-चक्का कैंटर (Canter)</option>
                    <option value="पिकअप / बोलेरो">पिकअप / बोलेरो (Pickup)</option>
                    <option value="कंटेनर / भारी वाहन">कंटेनर / भारी वाहन (Heavy Commercial)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">गाड़ी नंबर (Number Plate):</label>
                  <input
                    type="text"
                    value={newVehNumber}
                    onChange={(e) => setNewVehNumber(e.target.value.toUpperCase())}
                    placeholder="उदा. MP 50 TR 8812"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-navy uppercase outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl"
                >
                  रद्द करें
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newVeh = {
                      id: `veh-${Date.now()}`,
                      type: newVehType,
                      number: newVehNumber || `MP-${Math.floor(10 + Math.random() * 89)}-TR-${Math.floor(1000 + Math.random() * 8999)}`,
                      photos: []
                    };
                    const updated = [newVeh, ...ownerVehicles];
                    setOwnerVehicles(updated);
                    try {
                      localStorage.setItem('aid_owner_vehicles', JSON.stringify(updated));
                    } catch {}
                    setOwnerData(prev => ({
                      ...prev,
                      vehicleType: newVeh.type,
                      vehicleNumber: newVeh.number
                    }));
                    setNewVehNumber('');
                    setShowAddVehicleModal(false);
                  }}
                  className="flex-1 py-2.5 bg-brand-orange hover:bg-orange-600 text-navy font-black text-xs rounded-xl shadow-xs"
                >
                  सुरक्षित करें ✓
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. POST DRIVER REQUIREMENT MODAL */}
      <AnimatePresence>
        {showPostJobModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 text-left"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-150">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 bg-brand-orange/15 text-brand-orange rounded-xl flex items-center justify-center font-black">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-navy leading-none">ड्राइवर की ज़रूरत डालें</h3>
                    <span className="text-[11px] text-slate-500 font-bold">Post Driver Requirement</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPostJobModal(false)}
                  className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-black"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">रूट / मार्ग (Route):</label>
                  <input
                    type="text"
                    value={newJobRoute}
                    onChange={(e) => setNewJobRoute(e.target.value)}
                    placeholder="उदा. बालाघाट ➔ रायपुर"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-navy outline-none focus:border-brand-orange"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">गाड़ी का प्रकार (Vehicle):</label>
                  <select
                    value={newJobVehicle}
                    onChange={(e) => setNewJobVehicle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-navy outline-none focus:border-brand-orange"
                  >
                    <option value="18-चक्का ट्रेलर">18-चक्का ट्रेलर</option>
                    <option value="12-चक्का टिपर">12-चक्का टिपर</option>
                    <option value="10-चक्का ट्रक">10-चक्का ट्रक</option>
                    <option value="6-चक्का कैंटर">6-चक्का कैंटर</option>
                    <option value="पिकअप">पिकअप</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">मासिक वेतन (Salary):</label>
                  <input
                    type="text"
                    value={newJobSalary}
                    onChange={(e) => setNewJobSalary(e.target.value)}
                    placeholder="उदा. ₹25,000 / महीना"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-navy outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPostJobModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl"
                >
                  रद्द करें
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newJob = {
                      id: `job-${Date.now()}`,
                      title: newJobRoute,
                      vehicleType: newJobVehicle,
                      budget: newJobSalary,
                      location: ownerData.companyName || 'बालाघाट (म.प्र.)',
                      postedTime: 'अभी पोस्ट किया गया',
                      type: 'फुल-टाइम ड्राइवर',
                      ownerName: ownerData.name || 'गाड़ी मालिक',
                      ownerPhone: ownerData.phone || 'संपर्क उपलब्ध'
                    };
                    try {
                      const existingJobs = JSON.parse(localStorage.getItem('all_india_jobs') || '[]');
                      localStorage.setItem('all_india_jobs', JSON.stringify([newJob, ...existingJobs]));
                    } catch {}
                    setShowPostJobModal(false);
                  }}
                  className="flex-1 py-2.5 bg-brand-orange hover:bg-orange-600 text-navy font-black text-xs rounded-xl shadow-xs"
                >
                  ज़रूरत पोस्ट करें ✓
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Safety Reminder Popup: Owner Hires / Connects with Driver */}
      <SafetyReminderModal
        isOpen={isSafetyModalOpen}
        onClose={() => {
          setIsSafetyModalOpen(false);
          setPendingDriverToHire(null);
        }}
        onConfirm={handleConfirmHireDriver}
        scenario="owner_hires_driver"
        targetName={pendingDriverToHire?.name || selectedDriver?.name || 'ड्राइवर'}
      />
    </div>
  );
}
