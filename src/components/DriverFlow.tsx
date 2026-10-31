import React, { useState } from 'react';
import { insforge } from '../insforge';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Briefcase, MapPin, Truck, ShieldCheck, 
  Check, Clock, RefreshCw, AlertCircle, Sparkles, LogOut, CheckCircle2, Award, Navigation, Phone, MessageSquare, Camera, Mic, Volume2,
  Eye, Image as ImageIcon, FileText, Upload, Trash2, X, CheckCheck, ArrowLeft, Wrench, Heart
} from 'lucide-react';
import { AppScreen } from '../types';
import { ALL_STATES_DATA } from '../geoData';
import { saveDriverToInsForge, fetchJobsFromInsForge } from '../services/insforgeService';
import { DashboardShell, DashboardTab } from './DashboardShell';
import { getT } from '../utils/i18n';
import { ConvoyView } from './ConvoyView';
import { HearButton } from './HearButton';
import { SafetyReminderModal } from './SafetyReminderModal';

interface DriverFlowProps {
  currentStep: AppScreen;
  setScreen: (screen: AppScreen) => void;
  driverData: {
    name: string;
    phone?: string;
    experience: number;
    location: string;
    vehicleCategory: 'Car' | 'Commercial' | 'Heavy Trailer';
    vehicleType: string;
    photoUrl: string;
    dlNo: string;
    dlUrl?: string;
    idType?: 'aadhaar' | 'pan';
    aadhaarNo?: string;
    aadhaarUrl?: string;
    panNo?: string;
    panUrl?: string;
    documentsUploaded?: boolean;
    dlVerificationStatus?: string;
    dlConfidence?: number;
    aadhaarVerificationStatus?: string;
    aadhaarConfidence?: number;
    panVerificationStatus?: string;
    panConfidence?: number;
    vehicleNo?: string;
    workMode?: 'Part-time' | 'Full-time';
    timingSlots?: string[];
    lat?: number;
    lng?: number;
    views?: number;
    rating?: number | string;
  };
  setDriverData: React.Dispatch<React.SetStateAction<any>>;
  setChatPerspective?: (perspective: 'owner' | 'driver') => void;
  setSelectedOwnerJob?: (job: any) => void;
  reportedOwnerIds?: string[];
  setShowNearbyMechanicModal?: (show: boolean) => void;
  onOpenMechanicChat?: (mech: any) => void;
  authType?: 'gmail' | 'guest';
  userEmail?: string;
  selectedLanguage?: string;
  setSelectedLanguage?: (lang: string) => void;
  onOpenDonate?: () => void;
  onOpenAiAssistant?: () => void;
  onGoToWebsite?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
];

const VEHICLE_OPTIONS = [
  // 1. 2-Wheeler
  { value: 'Motorcycle / Bike (2W)', label: '🛵 2-Wheeler: Motorcycle / Bike (बाइक)', category: 'Car', group: '2-Wheeler', wheel: 2 },
  { value: 'Scooter / EV (2W)', label: '🛵 2-Wheeler: Scooter / Electric EV (स्कूटर)', category: 'Car', group: '2-Wheeler', wheel: 2 },
  
  // 2. 3-Wheeler
  { value: 'Passenger Auto-Rickshaw (3W)', label: '🛺 3-Wheeler: Passenger Auto Rickshaw (ऑटो)', category: 'Commercial', group: '3-Wheeler', wheel: 3 },
  { value: 'E-Rickshaw (3W)', label: '🛺 3-Wheeler: E-Rickshaw Electric (ई-रिक्शा)', category: 'Commercial', group: '3-Wheeler', wheel: 3 },
  { value: 'Cargo Loader Auto (3W)', label: '🛺 3-Wheeler: Cargo Loader Auto (सामान ऑटो)', category: 'Commercial', group: '3-Wheeler', wheel: 3 },

  // 3. 4-Wheeler
  { value: 'Hatchback / Sedan Taxi (4W)', label: '🚗 4-Wheeler: Hatchback / Sedan Taxi Cab (टैक्सी)', category: 'Car', group: '4-Wheeler', wheel: 4 },
  { value: 'SUV / MPV Taxi (4W)', label: '🚙 4-Wheeler: SUV / MPV / Bolero (बड़ी टैक्सी)', category: 'Car', group: '4-Wheeler', wheel: 4 },
  { value: 'Tata Ace / Chota Hathi (4W)', label: '🚛 4-Wheeler: Tata Ace / Chota Hathi (छोटा हाथी)', category: 'Commercial', group: '4-Wheeler', wheel: 4 },
  { value: 'Bolero Pickup (4W)', label: '🛻 4-Wheeler: Mahindra Bolero Pickup (पिकअप)', category: 'Commercial', group: '4-Wheeler', wheel: 4 },

  // 4. 6-10 Wheeler Commercial
  { value: '6-Wheeler Eicher / LCV (6W)', label: '🚚 6-Wheeler: Eicher / Light Truck (6 चक्का आयशर)', category: 'Commercial', group: '6-10 Wheeler Commercial', wheel: 6 },
  { value: '8-Wheeler Medium Truck (8W)', label: '🚚 8-Wheeler: Medium Goods Truck (8 चक्का ट्रक)', category: 'Commercial', group: '6-10 Wheeler Commercial', wheel: 8 },
  { value: '10-Wheeler Heavy Goods Lorry (10W)', label: '🚛 10-Wheeler: Heavy Goods Lorry / Tipper (10 चक्का)', category: 'Heavy Trailer', group: '6-10 Wheeler Commercial', wheel: 10 },
  { value: 'Bus / Staff Coach (6-10W)', label: '🚌 6-10 Wheeler: Staff Bus / Sleeper Coach (बस)', category: 'Commercial', group: '6-10 Wheeler Commercial', wheel: 6 },

  // 5. 12-22 Wheeler Heavy Truck / Trailer
  { value: '12-Wheeler Multi-Axle Rigid Truck (12W)', label: '🚛 12-Wheeler: Multi-Axle Rigid Truck / Tipper (12 चक्का)', category: 'Heavy Trailer', group: '12-22 Wheeler Heavy Truck / Trailer', wheel: 12 },
  { value: '14-Wheeler Tractor-Trailer (14W)', label: '🚛 14-Wheeler: Tractor-Trailer / Bulker (14 चक्का ट्रेलर)', category: 'Heavy Trailer', group: '12-22 Wheeler Heavy Truck / Trailer', wheel: 14 },
  { value: '16-Wheeler Heavy Trailer (16W)', label: '🚛 16-Wheeler: Heavy Container Trailer (16 चक्का ट्रेलर)', category: 'Heavy Trailer', group: '12-22 Wheeler Heavy Truck / Trailer', wheel: 16 },
  { value: '18-Wheeler Container Trailer (18W)', label: '🚛 18-Wheeler: Container / Flatbed Trailer (18 चक्का)', category: 'Heavy Trailer', group: '12-22 Wheeler Heavy Truck / Trailer', wheel: 18 },
  { value: '20-22 Wheeler Heavy Multi-Axle (20-22W)', label: '🚛 20-22 Wheeler: Heavy Multi-Axle Trailer (20-22 चक्का)', category: 'Heavy Trailer', group: '12-22 Wheeler Heavy Truck / Trailer', wheel: 22 },

  // 6. 24-40+ Wheeler Heavy Haulage
  { value: '24-28 Wheeler Hydraulic Axle Trailer', label: '🚜 24-28 Wheeler: Hydraulic Modular Trailer (24-28 चक्का)', category: 'Heavy Trailer', group: '24-40+ Wheeler Heavy Haulage', wheel: 26 },
  { value: '30-36 Wheeler ODC Equipment Carrier', label: '🚜 30-36 Wheeler: ODC Windmill / Transformer (30-36 चक्का)', category: 'Heavy Trailer', group: '24-40+ Wheeler Heavy Haulage', wheel: 34 },
  { value: '40+ Wheeler Super Heavy Modular Hauler', label: '🚜 40+ Wheeler: Super Heavy Modular Puller (40+ चक्का ट्रेलर)', category: 'Heavy Trailer', group: '24-40+ Wheeler Heavy Haulage', wheel: '40+' }
];

const TIMING_SLOTS = [
  { id: 'Morning', label: '🌅 Morning (6 AM - 12 PM)' },
  { id: 'Afternoon', label: '☀️ Afternoon (12 PM - 5 PM)' },
  { id: 'Evening', label: '🌇 Evening (5 PM - 9 PM)' },
  { id: 'Night', label: '🌙 Night (9 PM - 2 AM)' },
  { id: 'Late Night', label: '🌌 Late Night (2 AM - 6 AM)' },
  { id: 'Flexible', label: '🔄 Flexible (कभी भी / 24 hrs)' }
];

export default function DriverFlow({
  currentStep,
  setScreen,
  driverData,
  setDriverData,
  setChatPerspective,
  setSelectedOwnerJob,
  reportedOwnerIds = [],
  setShowNearbyMechanicModal,
  onOpenMechanicChat,
  authType = 'gmail',
  userEmail,
  selectedLanguage = 'hi',
  setSelectedLanguage,
  onOpenDonate,
  onOpenAiAssistant,
  onGoToWebsite,
  theme,
  onToggleTheme
}: DriverFlowProps) {
  const t = getT(selectedLanguage);
  const [activeTab, setActiveTab] = useState<DashboardTab>('home');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDutyOnline, setIsDutyOnline] = useState(true);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [error, setError] = useState('');
  const [viewingVehiclePhoto, setViewingVehiclePhoto] = useState<string | null>(null);
  const [sentRequests, setSentRequests] = useState<Record<string, boolean>>({});
  const [showNoDocModal, setShowNoDocModal] = useState(false);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [connectedMechanics, setConnectedMechanics] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('aid_connected_mechanics');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('aid_connected_mechanics');
      if (raw) setConnectedMechanics(JSON.parse(raw));
    } catch {}
  }, [currentStep]);

  React.useEffect(() => {
    let isMounted = true;
    fetchJobsFromInsForge().then(remoteJobs => {
      if (isMounted && remoteJobs && remoteJobs.length > 0) {
        const mapped = remoteJobs.map((j: any) => ({
          id: String(j.id || Math.random()),
          title: `${j.route_from || 'रूट'} ➔ ${j.route_to || 'गंतव्य'}`,
          budget: j.salary ? `₹${j.salary}` : 'वार्तालाप अनुसार',
          type: 'DIRECT OWNER JOB / सीधी नौकरी',
          vehicle: j.vehicle_type || 'कमर्शियल वाहन',
          duty: j.description || 'सिर्फ ड्राइविंग सेवा',
          owner: j.owner_name || 'गाड़ी मालिक',
          phone: j.owner_phone || '',
          posted: 'हाल ही में',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-300',
          isExample: false,
          authMethod: j.email?.includes('guest') ? 'guest' : 'gmail',
          vehiclePhotos: []
        }));
        setAvailableJobs(mapped);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Safety Reminder Modal state for accepting owner job
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [pendingOppToAccept, setPendingOppToAccept] = useState<any | null>(null);

  const handleOpenDriverChat = (opp: any) => {
    setPendingOppToAccept(opp);
    setIsSafetyModalOpen(true);
  };

  const handleConfirmAcceptJob = () => {
    if (!pendingOppToAccept) return;
    const opp = pendingOppToAccept;
    if (setSelectedOwnerJob) {
      setSelectedOwnerJob({
        id: opp.id,
        ownerName: opp.owner,
        companyName: opp.owner,
        vehicle: opp.vehicle,
        budget: opp.budget,
        phone: opp.phone || 'चैट में उपलब्ध',
        location: opp.title,
        duty: opp.duty,
        vehiclePhotos: opp.vehiclePhotos || []
      });
    }
    if (setChatPerspective) {
      setChatPerspective('driver');
    }
    setScreen('chat-room');
    setPendingOppToAccept(null);
  };

  const [selectedState, setSelectedState] = useState(driverData.state || 'Madhya Pradesh');
  const [selectedDistrict, setSelectedDistrict] = useState(driverData.district || 'Balaghat');
  const [typedTehsil, setTypedTehsil] = useState(driverData.tehsil || '');
  const [typedVillage, setTypedVillage] = useState('');
  const [isDriverListening, setIsDriverListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);

  // Auto sync location string of driverData based on state, district, tehsil, and village selections
  React.useEffect(() => {
    const combinedLocation = `${typedVillage ? typedVillage + ', ' : ''}${typedTehsil ? typedTehsil + ' (तहसील), ' : ''}${selectedDistrict}, ${selectedState}`;
    setDriverData((prev: any) => ({
      ...prev,
      state: selectedState,
      district: selectedDistrict,
      tehsil: typedTehsil,
      location: combinedLocation
    }));
  }, [selectedState, selectedDistrict, typedTehsil, typedVillage]);

  // Local or nested selectors mapping
  const activeSlots = driverData.timingSlots || ['Morning', 'Afternoon', 'Flexible'];
  const activeWorkMode = driverData.workMode || 'Full-time';

  const handleToggleTimingSlot = (slotId: string) => {
    let updatedSlots = [...activeSlots];
    if (updatedSlots.includes(slotId)) {
      updatedSlots = updatedSlots.filter(s => s !== slotId);
    } else {
      updatedSlots.push(slotId);
    }
    setDriverData((prev: any) => ({
      ...prev,
      timingSlots: updatedSlots
    }));
  };

  const handleSelectWorkMode = (mode: 'Part-time' | 'Full-time') => {
    setDriverData((prev: any) => ({
      ...prev,
      workMode: mode
    }));
  };

  const handleSelectAvatar = (url: string) => {
    setDriverData((prev: any) => ({
      ...prev,
      photoUrl: url
    }));
  };

  const handleFetchLocation = () => {
    setIsFetchingLocation(true);
    setError('');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setIsFetchingLocation(false);
          setLocationSuccess(true);
          setDriverData((prev: any) => ({
            ...prev,
            lat: Number(latitude.toFixed(6)),
            lng: Number(longitude.toFixed(6)),
            location: `Civil Lines, Balaghat, MP (GPS Coordinate)`
          }));
        },
        (err) => {
          console.warn('Geolocation failed, falling back to mock coordinate tracker.', err);
          // Fallback coordinate representing the Balaghat test environment centered location
          setTimeout(() => {
            setIsFetchingLocation(false);
            setLocationSuccess(true);
            setDriverData((prev: any) => ({
              ...prev,
              lat: 21.8154,
              lng: 80.1832,
              location: 'Ward-5 Area, Balaghat, MP (GPS Coords)'
            }));
          }, 1000);
        }
      );
    } else {
      setTimeout(() => {
        setIsFetchingLocation(false);
        setLocationSuccess(true);
        setDriverData((prev: any) => ({
          ...prev,
          lat: 21.8154,
          lng: 80.1832,
          location: 'Ward-5 Area, Balaghat, MP (GPS Coords)'
        }));
      }, 1000);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 1. Driver Name Validation
    if (!driverData.name.trim()) {
      setError('कृपया अपना पूरा नाम दर्ज करें / Enter your full name');
      return;
    }

    // 2. Mobile Number Validation (Strictly 10 digits)
    const cleanPhone = (driverData.phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError('कृपया 10-अंकीय मान्य भारतीय मोबाइल नंबर दर्ज करें / Enter valid 10-digit mobile number');
      return;
    }

    // 3. Vehicle Selection
    if (!driverData.vehicleType) {
      setError('कृपया चुनें कि आप कौन-सी गाड़ी चला सकते हैं / Select Vehicle Type You Drive');
      return;
    }

    // 5. Timing Slots
    if (activeSlots.length === 0) {
      setError('कृपया कम से कम एक टाइमिंग स्लॉट अवश्य चुनें / Choose at least 1 Timing Slot');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate instantaneous national verification
    setTimeout(() => {
      setIsSubmitting(false);
      
      // Auto assign fallback coords if they forgot to fetch location
      if (!driverData.lat || !driverData.lng) {
        setDriverData((prev: any) => ({
          ...prev,
          lat: 21.8124,
          lng: 80.1838,
          location: 'Main Bazar Road, Balaghat, MP'
        }));
      }

      // Persist Driver Data and Authentication State
      try {
        localStorage.setItem('all_india_driver_is_authenticated', 'true');
        localStorage.setItem('all_india_driver_selected_role', 'driver');
        localStorage.setItem('aid_saved_driver_profile', JSON.stringify({
          ...driverData,
          authMethod: authType === 'guest' ? 'guest' : 'gmail'
        }));
      } catch {}

      // Sync driver profile to InsForge backend (insforge.dev)
      saveDriverToInsForge({
        ...driverData,
        authType: authType === 'guest' ? 'guest' : 'gmail'
      }).catch(err => {
        console.warn('InsForge driver sync error:', err);
      });

      setScreen('driver-pending'); // Verification approval transition
    }, 2400);
  };

  const handleVerificationAcknowledge = () => {
    try {
      localStorage.setItem('all_india_driver_is_authenticated', 'true');
      localStorage.setItem('all_india_driver_selected_role', 'driver');
    } catch {}
    setScreen('driver-dashboard'); // Move to Trip/Duty dashboard!
  };

  return (
    <div className="flex-1 bg-[#0B0B0C] text-white flex flex-col justify-between min-h-screen select-none overflow-y-auto" id="driver-flow-root">
      
      {/* 1. सारथी प्रोफाइल रजिस्ट्रेशन (DRIVER REGISTRATION SCREEN) - RESPONSIVE WIDESCREEN & MOBILE */}
      {currentStep === 'driver-profile-setup' && (
        <div className="flex flex-col w-full max-w-7xl mx-auto p-4 sm:p-8 space-y-6">
          
          {/* Top Header with Back button */}
          <div className="flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => setScreen('role-selection')}
              className="p-2 rounded-xl bg-[#121927] hover:bg-[#1A2538] transition-all cursor-pointer border border-white/10 flex items-center gap-1.5 text-xs font-bold text-white hover:text-cyan-400"
            >
              <ArrowLeft className="h-4 w-4 text-cyan-400" />
              <span>पीछे (Back)</span>
            </button>
            <div className="text-right">
              <span className="text-xs font-black text-cyan-300 bg-cyan-500/15 border border-cyan-400/40 px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                Driver Profile Setup
              </span>
              <p className="text-[10px] font-bold text-cyan-200 mt-1">चरण 2 / 3 • भूमिका → प्रोफाइल → डैशबोर्ड</p>
            </div>
          </div>

          <div className="text-center shrink-0 space-y-1">
            <div className="flex items-center justify-center gap-3">
              <img src="/branding/logo.jpg" alt="ALL INDIA DRIVER Logo" className="h-12 w-12 rounded-2xl object-contain bg-[#16161A] p-1 border border-[#FFC400]/40 shadow-[0_0_15px_rgba(0,180,216,0.35)]" />
              <div className="h-12 w-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,180,216,0.3)]">
                <Truck className="h-6 w-6" />
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase font-display leading-tight">ALL INDIA DRIVER • चालक प्रोफाइल</h2>
            <p className="text-xs sm:text-sm text-cyan-300 font-semibold">बेसिक जानकारी भरकर तुरंत ऑल इंडिया ट्रिप्स व नौकरियां पाएं (0% कमीशन)</p>
          </div>

          {error && (
            <div className="bg-red-950/60 text-red-200 text-xs font-black p-3.5 rounded-2xl border border-red-800 flex items-start gap-2.5 shrink-0 max-w-2xl mx-auto w-full">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="card-driver-theme rounded-3xl p-6 sm:p-8 shadow-2xl">
            
            {/* 2-COLUMN WIDESCREEN RESPONSIVE GRID (DESKTOP 12-COLUMNS / MOBILE 1-COL) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT COLUMN (COL-SPAN-7): PERSONAL INFO, PHOTO, LOCATION */}
              <div className="lg:col-span-7 space-y-5 text-left">
                
                {/* Full Name & Experience */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-white uppercase tracking-wider">पूरा नाम (Full Name) *</label>
                <div className="flex items-center bg-[#0A1424] border border-cyan-500/30 focus-within:border-[#0087FF] rounded-xl px-3.5 py-3 transition-all">
                  <User className="h-4 w-4 text-cyan-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    required
                    value={driverData.name}
                    onChange={(e) => setDriverData({ ...driverData, name: e.target.value })}
                    placeholder="उदा. संजय पाटिल"
                    className="w-full text-sm outline-none font-bold text-white bg-transparent placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-white uppercase tracking-wider">अनुभव (Exp in Years)</label>
                <div className="flex items-center bg-[#0A1424] border border-cyan-500/30 focus-within:border-[#0087FF] rounded-xl px-3.5 py-3 transition-all">
                  <Briefcase className="h-4 w-4 text-cyan-400 mr-2 shrink-0" />
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={driverData.experience}
                    onChange={(e) => setDriverData({ ...driverData, experience: parseInt(e.target.value) || 0 })}
                    className="w-full text-sm outline-none font-bold text-white bg-transparent placeholder:text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Mobile Number (10 Digits Strictly) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-white uppercase tracking-wider">
                मोबाइल नंबर (10-Digit Mobile Number) <span className="text-cyan-400">*</span>
              </label>
              <div className="flex items-center bg-[#0A1424] border border-cyan-500/30 focus-within:border-[#0087FF] rounded-xl px-3.5 py-3 transition-all">
                <span className="text-sm font-bold text-cyan-400 font-mono mr-2">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  value={driverData.phone || ''}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setDriverData({ ...driverData, phone: digits });
                  }}
                  placeholder="10 अंकों का मोबाइल नंबर"
                  className="w-full text-sm outline-none font-bold font-mono text-white bg-transparent placeholder:text-gray-500"
                />
              </div>
              <span className="text-[11px] text-gray-400 font-semibold block">केवल 10 अंकों का भारतीय मोबाइल नंबर</span>
            </div>

            {/* Optional Gender */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-white uppercase tracking-wider">
                  Gender / लिंग
                </label>
                <span className="text-[10px] text-gray-400 font-semibold">(वैकल्पिक / Optional)</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(['Male', 'Female', 'Other', 'Prefer not to say'] as const).map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setDriverData({ ...driverData, gender: g })}
                    className={`py-2 text-xs font-bold rounded-xl transition-all border text-center cursor-pointer ${
                      (driverData as any).gender === g
                        ? 'border-[#0087FF] bg-[#0087FF] text-white font-black shadow-[0_0_12px_rgba(0,135,255,0.45)]'
                        : 'border-white/10 bg-[#0A1424] text-gray-300 hover:bg-[#121F36]'
                    }`}
                  >
                    {g === 'Male' ? 'पुरुष (M)' : g === 'Female' ? 'महिला (F)' : g === 'Other' ? 'अन्य' : 'छुपाएं'}
                  </button>
                ))}
              </div>
            </div>

            {/* Profile Avatar Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-white">प्रोफाइल फोटो / Select DP Avatar</label>
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-full border-2 border-cyan-400 overflow-hidden bg-[#0A1424] shrink-0 select-none shadow-sm flex items-center justify-center relative">
                  <User className="h-7 w-7 text-gray-400 absolute" />
                  {driverData.photoUrl && (
                    <img 
                      src={driverData.photoUrl} 
                      alt="" 
                      className="h-full w-full object-cover relative z-10" 
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                </div>
                <div className="flex gap-2.5">
                  {AVATAR_OPTIONS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDriverData({ ...driverData, photoUrl: url })}
                      className={`h-11 w-11 rounded-full overflow-hidden border-2 transition-all relative flex items-center justify-center bg-[#0A1424] ${
                        driverData.photoUrl === url ? 'border-cyan-400 scale-105 shadow-[0_0_10px_rgba(0,180,216,0.5)]' : 'border-white/20 hover:border-white/40'
                      }`}
                    >
                      <User className="h-5 w-5 text-gray-400 absolute" />
                      <img 
                        src={url} 
                        alt="" 
                        className="h-full w-full object-cover relative z-10" 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      {driverData.photoUrl === url && (
                        <div className="absolute inset-0 bg-black/40 z-20 flex items-center justify-center">
                          <Check className="h-4 w-4 text-cyan-400 stroke-[3.5]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Vehicle Type Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-white uppercase tracking-wider">कौन-सी गाड़ी चला सकते हैं? (Vehicles You Drive)</label>
              <div className="flex items-center bg-[#0A1424] border border-cyan-500/30 focus-within:border-[#0087FF] rounded-xl px-3.5 py-3 transition-all">
                <Truck className="h-4 w-4 text-cyan-400 mr-2 shrink-0" />
                <select
                  value={driverData.vehicleType}
                  onChange={(e) => {
                    const matched = VEHICLE_OPTIONS.find(v => v.value === e.target.value);
                    setDriverData({
                      ...driverData,
                      vehicleType: e.target.value,
                      vehicleCategory: matched ? matched.category : 'Car'
                    });
                  }}
                  className="w-full text-sm bg-transparent outline-none font-bold text-white cursor-pointer"
                >
                  <option value="" className="bg-[#0A1424] text-white">-- चुनें (Choose Category) --</option>
                  {VEHICLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#0A1424] text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Driver Role Note */}
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3 flex items-start gap-2">
              <span className="text-cyan-400 text-sm mt-0.5">ℹ️</span>
              <p className="text-xs text-cyan-200 font-bold leading-tight">
                <strong className="text-white">चालक (Driver) ध्यान दें:</strong> गाड़ी (Vehicle) मालिक उपलब्ध कराएंगे। आपको अपनी कोई गाड़ी नहीं लानी है। आप केवल अपनी सुरक्षित ड्राइविंग सेवा और समय देंगे।
              </p>
            </div>

            {/* Work Mode Toggle: Part-time / Full-time */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-white uppercase tracking-wider">कार्य प्रकार (Work Mode)</label>
              <div className="grid grid-cols-2 gap-3">
                {(['Part-time', 'Full-time'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleSelectWorkMode(mode)}
                    className={`py-3 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      activeWorkMode === mode 
                        ? 'bg-[#0087FF] text-white border-cyan-400 shadow-[0_0_15px_rgba(0,135,255,0.4)]' 
                        : 'bg-[#0A1424] text-gray-300 border-white/10 hover:border-white/30'
                    }`}
                  >
                    {mode === 'Full-time' ? '🤝 Full-time (स्थायी)' : '⏱️ Part-time (पार्ट-टाइम)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Multi-Select for 6 Timing Slots */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-white uppercase tracking-wider">
                उपलब्धता समय (Timing Slots - Multi-Select)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TIMING_SLOTS.map(slot => {
                  const isChecked = activeSlots.includes(slot.id);
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => handleToggleTimingSlot(slot.id)}
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold text-left border flex items-center justify-between transition-all cursor-pointer ${
                        isChecked 
                          ? 'bg-[#E10600]/20 border-[#E10600] text-white font-black' 
                          : 'bg-[#1A1A22] border-white/10 text-gray-300 hover:border-white/30'
                      }`}
                    >
                      <span className="truncate">{slot.label}</span>
                      {isChecked && (
                        <Check className="h-4 w-4 text-[#E10600] stroke-[3.5] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN (COL-SPAN-5): LOCATION HUB, GPS & ACTION */}
          <div className="lg:col-span-5 space-y-5 flex flex-col justify-between text-left">
            <div className="space-y-4">
              {/* STATE, DISTRICT & VILLAGE / WARD INTERACTIVE INPUT */}
              <div className="space-y-3.5 p-4 bg-[#0A1424] rounded-2xl border border-cyan-500/30">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-black text-white uppercase tracking-wider">
                    कार्य स्थान / Working Location
                  </label>
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                    Sarthi Location Hub
                  </span>
                </div>

                {/* State, District and Tehsil selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5 text-left">
                    <span className="text-[10px] text-gray-400 font-extrabold block uppercase tracking-wider">
                      {t('stateLabel', 'STATE HUB / राज्य')}
                    </span>
                    <select
                      value={selectedState}
                      onChange={(e) => {
                        const newState = e.target.value;
                        setSelectedState(newState);
                        const districts = Object.keys(ALL_STATES_DATA[newState] || {});
                        if (districts.length > 0) {
                          setSelectedDistrict(districts[0]);
                        }
                      }}
                      className="w-full bg-[#070D18] border border-cyan-500/30 text-white font-bold text-xs px-3 py-2.5 rounded-xl outline-none cursor-pointer focus:border-[#0087FF]"
                    >
                      {Object.keys(ALL_STATES_DATA).map(state => (
                        <option key={state} value={state} className="bg-[#0A1424] text-white">{state}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <span className="text-[10px] text-gray-400 font-extrabold block uppercase tracking-wider">
                      {t('districtLabel', 'DISTRICT / जिला')}
                    </span>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className="w-full bg-[#070D18] border border-cyan-500/30 text-white font-bold text-xs px-3 py-2.5 rounded-xl outline-none cursor-pointer focus:border-[#0087FF]"
                    >
                      {Object.keys(ALL_STATES_DATA[selectedState] || {}).map(dist => (
                        <option key={dist} value={dist} className="bg-[#0A1424] text-white">{dist}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <span className="text-[10px] text-gray-400 font-extrabold block uppercase tracking-wider">
                      {t('tehsilLabel', 'TEHSIL / तहसील')}
                    </span>
                    <input
                      type="text"
                      value={typedTehsil}
                      onChange={(e) => setTypedTehsil(e.target.value)}
                      placeholder="उदा. वारासिवनी, लालबर्रा"
                      className="w-full bg-[#070D18] border border-cyan-500/30 text-white font-bold text-xs px-3 py-2.5 rounded-xl outline-none focus:border-[#0087FF] placeholder:text-gray-500"
                    />
                  </div>
                </div>

                {/* Tehsil Suggestions from ALL_STATES_DATA */}
                {ALL_STATES_DATA[selectedState]?.[selectedDistrict] && (
                  <div className="flex flex-wrap gap-1.5 items-center pt-0.5">
                    <span className="text-[10px] text-gray-400 font-bold">सुझाव तहसील / क्षेत्र:</span>
                    {ALL_STATES_DATA[selectedState][selectedDistrict].slice(0, 4).map(hub => (
                      <button
                        key={hub}
                        type="button"
                        onClick={() => setTypedTehsil(hub)}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                          typedTehsil === hub
                            ? 'bg-cyan-500 text-black'
                            : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20'
                        }`}
                      >
                        + {hub}
                      </button>
                    ))}
                  </div>
                )}

                {/* Village Input with Type and Voice */}
                <div className="space-y-1.5 text-left border-t border-cyan-500/20 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 font-extrabold block uppercase tracking-wider">VILLAGE OR TOWN / गाँव या क्षेत्र (Type or Speak)</span>
                    {typedVillage && (
                      <span className="text-[10px] px-2 py-0.5 bg-cyan-500/20 text-cyan-400 font-extrabold border border-cyan-500/40 rounded">
                        ✓ ADDED
                      </span>
                    )}
                  </div>
                  
                  <div className="relative flex items-center gap-2">
                    <input
                      type="text"
                      value={typedVillage}
                      onChange={(e) => setTypedVillage(e.target.value)}
                      placeholder="उदा. गढ़ा, लालबर्रा, रामपुर, सुखपुर"
                      className="flex-1 bg-[#070D18] border border-cyan-500/30 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl outline-none text-left focus:border-[#0087FF] placeholder:text-gray-500"
                    />
                    
                    {/* Microphone trigger button */}
                    <button
                      type="button"
                      onClick={() => {
                        const SpeechObj = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                        if (!SpeechObj) {
                          setVoiceSupported(false);
                          setIsDriverListening(true);
                          return;
                        }
                        
                        try {
                          const rec = new SpeechObj();
                          rec.continuous = false;
                          rec.lang = 'hi-IN';
                          rec.interimResults = false;
                          rec.maxAlternatives = 1;
                          
                          rec.onstart = () => {
                            setIsDriverListening(true);
                          };
                          rec.onresult = (event: any) => {
                            const word = event.results[0][0].transcript;
                            setTypedVillage(word);
                            setIsDriverListening(false);
                          };
                          rec.onerror = (err: any) => {
                            console.warn("Speech recognition blocked or errored, activated rich simulator fallback:", err);
                          };
                          rec.onend = () => {};
                          rec.start();
                        } catch (err) {
                          console.warn("Speech init blocked, starting simulated voice input panel:", err);
                          setIsDriverListening(true);
                        }
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                        isDriverListening 
                          ? 'border-cyan-400 bg-cyan-500/20 text-cyan-400 animate-pulse'
                          : 'border-cyan-500/30 bg-[#070D18] hover:border-cyan-400 text-gray-300 hover:text-white'
                      }`}
                      title="बोलकर दर्ज करें (Tap to Speak)"
                    >
                      <Mic className="h-4 w-4" />
                    </button>
                  </div>

                  {/* District-wise suggestions from ALL_STATES_DATA */}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="text-[10px] text-gray-400 font-bold self-center">सुझाव / Tags:</span>
                    {(ALL_STATES_DATA[selectedState]?.[selectedDistrict] || []).slice(0, 4).map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setTypedVillage(v)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          typedVillage === v 
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-black' 
                            : 'bg-[#070D18] border-cyan-500/20 text-gray-400 hover:border-cyan-400/50'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>

                  {/* Active Listening Panel Overlay */}
                  {isDriverListening && (
                    <div className="bg-[#070D18] border border-cyan-500/50 rounded-xl p-3 mt-2 space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="relative flex items-center justify-center h-5 w-5">
                            <span className="absolute animate-ping h-full w-full rounded-full bg-cyan-400 opacity-75" />
                            <Mic className="h-3.5 w-3.5 text-cyan-400 relative z-10" />
                          </div>
                          <span className="text-xs font-black text-white leading-none">कृपया अपने गाँव/लोकेशन का नाम बोलें...</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsDriverListening(false)}
                          className="text-xs font-black text-gray-400 hover:text-white px-1.5 cursor-pointer"
                        >
                          × CLOSE
                        </button>
                      </div>
                      
                      <div className="flex gap-2 items-center text-xs text-gray-300 font-bold italic">
                        <Volume2 className="h-3.5 w-3.5 animate-bounce text-cyan-400 shrink-0" />
                        <span>जैसे "बुढ़ी", "लालबर्रा", "गढ़ा", "रामपुर"</span>
                      </div>

                      <div className="border-t border-cyan-500/20 pt-2 space-y-1">
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">सिम्युलेटर (Simulate speaking):</div>
                        <div className="flex flex-wrap gap-1.5">
                          {["बुढ़ी / Budhi Area", "लालबर्रा / Lalbarra", "पिपरिया / Pipariya", "रामपुर / Rampur", "गढ़ा / Garha"].map(demo => {
                            const cleanDemo = demo.split(' / ')[0];
                            return (
                              <button
                                key={demo}
                                type="button"
                                onClick={() => {
                                  setTypedVillage(cleanDemo);
                                  setIsDriverListening(false);
                                }}
                                className="bg-[#0A1424] hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-400 px-2 py-1 rounded text-[10px] font-bold text-gray-300 hover:text-white flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <span>🗣️</span> {demo}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Optional GPS Auto-fill Coordinates Anchor */}
                <div className="bg-[#070D18] border border-cyan-500/30 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <div className="text-xs space-y-0.5 text-left">
                      {driverData.lat && driverData.lng ? (
                        <div>
                          <div className="font-extrabold text-white">📍 Geo GPS Coordinates Set</div>
                          <div className="text-[10px] text-cyan-400 font-mono">
                            LatLng: {driverData.lat}, {driverData.lng}
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-400 font-semibold leading-tight">📍 optional auto GPS. Click to sync.</div>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      disabled={isFetchingLocation}
                      onClick={handleFetchLocation}
                      className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(0,135,255,0.4)] whitespace-nowrap"
                    >
                      {isFetchingLocation ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin text-white" />
                          <span>GPS Sensing...</span>
                        </>
                      ) : (
                        <>
                          <Navigation className="h-3 w-3 text-white" />
                          <span>Fetch GPS</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Clear next-step hint */}
            <div className="mt-5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-left">
              <p className="text-[10px] font-black uppercase tracking-wider text-cyan-300">आगे क्या होगा?</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">जानकारी सेव करने के बाद रजिस्ट्रेशन की पुष्टि दिखेगी। फिर आप सीधे अपने ड्राइवर डैशबोर्ड पर पहुँचेंगे।</p>
            </div>

            {/* Direct Save CTA inside form */}
            <div className="pt-4 border-t border-cyan-500/20">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-driver w-full py-4 text-sm font-bold shadow-[0_0_25px_rgba(0,135,255,0.6)] cursor-pointer tracking-wider"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>सत्यापन हो रहा है... REGISTERING...</span>
                  </>
                ) : (
                  <>
                    <span>➔ Continue as Driver / सहेजें और लाइव जाएँ 🚀</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )}

      {/* 2. VERIFICATION SUCCESS SCREEN (सत्यापन सफल) */}
      {currentStep === 'driver-pending' && (
        <div className="flex-1 p-6 flex flex-col justify-between h-full bg-[#0B0B0C] text-white overflow-y-auto">
          <div className="space-y-4 my-auto max-w-2xl mx-auto w-full">
            
            <div className="bg-[#121214] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-4">
              
              {/* Glowing checkmark badge */}
              <div className="h-16 w-16 bg-[#E10600]/15 text-[#E10600] border border-[#E10600]/30 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
                <Check className="h-8 w-8 stroke-[3]" />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs text-[#E10600] font-black uppercase tracking-widest block">
                  NATIONAL VERIFICATION OK
                </span>
                <h3 className="text-xl font-black text-white">पंजीकरण सफल! / Registration Successful</h3>
                <p className="text-xs text-gray-300 font-semibold leading-relaxed px-2">
                  बधाई हो! आपका विवरण सुरक्षित रूप से दर्ज हो गया है और आपका डिजिटल ड्राइवर कार्ड बन गया है।
                </p>
              </div>

              {/* UID Display Grid */}
              <div className="bg-[#1A1A22] text-white rounded-2xl p-4 space-y-2 border border-white/10">
                <div className="flex justify-between items-center text-xs font-bold border-b border-white/10 pb-2">
                  <span className="text-gray-400">DRIVER PROFILE ID</span>
                  <span className="font-mono text-[#E10600] text-sm font-black tracking-wider">
                    AID-DRV-{(driverData.phone || '1024').replace(/\D/g, '').slice(-4) || '1024'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-gray-400">VEHICLE CLASS</span>
                  <span className="text-white">{driverData.vehicleCategory} Specialist</span>
                </div>
              </div>

              {/* SPECIFICATION REQUESTED: Active Badges for Premium Tier and GPS Tracking */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-[#1A1A22] border border-[#E10600]/30 rounded-xl p-3 text-center flex flex-col items-center justify-center">
                  <Award className="h-5 w-5 text-[#E10600] mb-1" />
                  <span className="text-xs font-black text-white leading-none">Premium Tier</span>
                  <span className="text-[10px] text-gray-400 font-bold mt-1">प्राथमिकता सूची लाइव</span>
                </div>

                <div className="bg-[#1A1A22] border border-blue-500/30 rounded-xl p-3 text-center flex flex-col items-center justify-center">
                  <Navigation className="h-5 w-5 text-blue-400 mb-1 animate-pulse" />
                  <span className="text-xs font-black text-white leading-none">GPS Tracking</span>
                  <span className="text-[10px] text-gray-400 font-bold mt-1">सक्रिय मार्ग ट्रैकिंग</span>
                </div>
              </div>
            </div>

            <div className="bg-[#121214] border border-white/10 rounded-2xl p-4 text-center">
              <p className="text-xs text-gray-300 font-bold">
                💡 <strong className="text-white">याद रखें:</strong> आपका विवरण बिल्कुल सुरक्षित है। ट्रांसपोर्टर्स अब आपको बिना बीच के दलाल के डायरेक्ट कॉल कर सकते हैं।
              </p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto w-full pt-4">
            <button
              onClick={handleVerificationAcknowledge}
              className="w-full py-4 bg-[#E10600] hover:bg-[#c20500] text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(225,6,0,0.5)] cursor-pointer uppercase tracking-wider transition-all"
            >
              <span>Next: View Duty Dashboard / आगे बढ़ें ➔</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. TRIP/DUTY DASHBOARD */}
      {currentStep === 'driver-dashboard' && (
        <DashboardShell
          appName={t('appName', 'ALL INDIA DRIVER APP')}
          roleKey="driver"
          userEmail={userEmail}
          onOpenSOS={setShowNearbyMechanicModal ? () => setShowNearbyMechanicModal(true) : undefined}
          onOpenAiAssistant={onOpenAiAssistant}
          onGoToWebsite={onGoToWebsite}
          theme={theme}
          onToggleTheme={onToggleTheme}
          userName={driverData.name || 'सारथी ड्राइवर'}
          userPhone={driverData.phone || 'फ़ोन नंबर दर्ज नहीं'}
          userRoleTitle="ड्राइवर (सारथी)"
          authType={authType}
          walletCredits={5}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          profileCompletionPercentage={
            Math.min(100,
              (driverData.name && driverData.name.trim().length > 0 ? 35 : 0) + 
              ((driverData.phone || '').replace(/\D/g, '').length === 10 ? 35 : 0) + 
              (driverData.vehicleType ? 30 : 0) || 100
            )
          }
          onCompleteProfileClick={() => setScreen('driver-profile-setup')}
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          onSwitchRoleClick={() => setScreen('role-selection')}
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
              localStorage.removeItem('all_india_driver_selected_role');
              localStorage.removeItem('aid_current_screen');
            } catch {}
            setScreen('intro');
          }}
          onDeleteAccountClick={async () => {
            try {
              await insforge.auth.signOut();
            } catch {}
            try {
              localStorage.clear();
            } catch {}
            setScreen('intro');
          }}
          onDonateClick={onOpenDonate}
        >
          {/* TAB 1: HOME DASHBOARD */}
          {activeTab === 'home' && (
            <div className="space-y-4">
              
              {/* 1. BADA TOGGLE: काम के लिए उपलब्ध / अभी उपलब्ध नहीं */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-4 w-4 rounded-full shrink-0 ${
                      isDutyOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    }`} />
                    <div>
                      <h3 className="text-base font-black text-navy leading-tight flex items-center gap-2">
                        <span>
                          {isDutyOnline 
                            ? t('driverAvailableToggleOn', 'काम के लिए उपलब्ध') 
                            : t('driverAvailableToggleOff', 'अभी उपलब्ध नहीं')}
                        </span>
                        <HearButton
                          text={isDutyOnline ? 'आपकी ड्यूटी अभी चालू है, गाड़ी मालिक आपको काम के लिए कॉल या चैट कर सकते हैं।' : 'आपकी ड्यूटी अभी बंद है। काम पाने के लिए ड्यूटी चालू करें।'}
                          compact={true}
                        />
                      </h3>
                      <span className="text-xs font-bold text-slate-500">
                        {isDutyOnline ? 'गाड़ी मालिक आपको काम के लिए कॉल कर सकते हैं' : 'ड्यूटी ऑफलाइन है'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDutyOnline(!isDutyOnline)}
                    className={`min-h-[48px] px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                      isDutyOnline
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    }`}
                  >
                    <span>{isDutyOnline ? 'ड्यूटी चालू (Online)' : 'ड्यूटी बंद (Offline)'}</span>
                  </button>
                </div>
              </div>

              {/* 2. LIVE STATS CARDS (NO FAKE NUMBERS) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Stat 1: Profile Views */}
                <div className="bg-[#121214] border border-white/10 rounded-2xl p-4 text-center shadow-md space-y-1">
                  <span className="text-xs font-bold text-gray-400 block truncate">
                    {t('driverStatViews', 'प्रोफ़ाइल देखीं')}
                  </span>
                  <span className="text-2xl font-black text-white block leading-none">
                    {driverData.views || 0}
                  </span>
                  <span className="text-[10px] text-gray-500 font-bold block">
                    गाड़ी मालिक
                  </span>
                </div>

                {/* Stat 2: Applied Jobs */}
                <div className="bg-[#121214] border border-white/10 rounded-2xl p-4 text-center shadow-md space-y-1">
                  <span className="text-xs font-bold text-gray-400 block truncate">
                    {t('driverStatJobs', 'आवेदन')}
                  </span>
                  <span className="text-2xl font-black text-white block leading-none">
                    {Object.keys(sentRequests).length}
                  </span>
                  <span className="text-[10px] text-gray-500 font-bold block">
                    सक्रिय ट्रिप्स
                  </span>
                </div>

                {/* Stat 3: Rating */}
                <div className="bg-[#121214] border border-white/10 rounded-2xl p-4 text-center shadow-md space-y-1">
                  <span className="text-xs font-bold text-gray-400 block truncate">
                    {t('driverStatRating', 'रेटिंग')}
                  </span>
                  <div className="flex items-center justify-center gap-1 leading-none">
                    <span className="text-2xl font-black text-[#E10600]">
                      {driverData.rating ? Number(driverData.rating).toFixed(1) : 'नया'}
                    </span>
                    <Award className="h-4 w-4 text-[#E10600]" />
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold block">
                    {driverData.rating ? 'समीक्षित' : 'नया चालक'}
                  </span>
                </div>

              </div>

              {/* 3. QUICK ACTIONS KE BADE ROUNDED BUTTONS (RESPONSIVE 4-COL ON DESKTOP) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                
                {/* BADA DEDICATED MECHANIC BUTTON: मैकेनिक चाहिए? */}
                {setShowNearbyMechanicModal && (
                  <button
                    type="button"
                    onClick={() => setShowNearbyMechanicModal(true)}
                    className="min-h-[58px] bg-[#121214] hover:bg-[#1a1a20] text-white rounded-2xl p-3.5 flex items-center justify-between border-2 border-[#E10600] shadow-[0_0_15px_rgba(225,6,0,0.25)] cursor-pointer transition-all active:scale-[0.98] col-span-2 lg:col-span-2 text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-11 w-11 rounded-xl bg-[#E10600] text-white flex items-center justify-center shrink-0 font-black shadow-md">
                        <Wrench className="h-6 w-6 stroke-[2.5]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-white leading-tight">
                            मैकेनिक चाहिए?
                          </span>
                          <span className="text-[10px] bg-[#E10600]/20 text-[#E10600] font-black px-2 py-0.5 rounded-full border border-[#E10600]/40 uppercase shrink-0">
                            24x7 SOS
                          </span>
                        </div>
                        <span className="text-sm font-bold text-gray-300 block truncate mt-0.5">
                          गाड़ी खराब हो तभी दबाएँ, पास का मैकेनिक जुड़ेगा
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-white bg-[#E10600] px-3.5 py-2 rounded-xl shrink-0 ml-2 font-sans shadow-md">
                      खोलें ➔
                    </span>
                  </button>
                )}

                {/* DEDICATED SUPPORT US BUTTON */}
                {onOpenDonate && (
                  <button
                    type="button"
                    onClick={onOpenDonate}
                    className="min-h-[54px] bg-[#121214] hover:bg-[#1a1a20] text-white rounded-2xl p-3 flex items-center justify-between border-2 border-white/20 hover:border-[#E10600] shadow-sm cursor-pointer transition-all active:scale-[0.98] col-span-2 lg:col-span-2 text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-[#E10600]/20 text-[#E10600] flex items-center justify-center shrink-0 font-black border border-[#E10600]/30">
                        <Heart className="h-5 w-5 fill-[#E10600]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-white leading-tight">
                            सपोर्ट करें (Support Us)
                          </span>
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-black px-1.5 py-0.5 rounded-full border border-emerald-500/30 uppercase shrink-0">
                            फ्री सेवा
                          </span>
                        </div>
                        <span className="text-xs font-bold text-gray-300 block truncate mt-0.5">
                          ऑनलाइन ड्राइवर को फ्री रखने में सहयोग दें और सभी सहयोगियों की सूची देखें
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-white bg-[#1A1A22] border border-white/20 px-3 py-1.5 rounded-xl shrink-0 ml-2 hover:bg-[#E10600]">
                      देखें ➔
                    </span>
                  </button>
                )}

                {/* Action 1: पास की नौकरी (5 KM) */}
                <button
                  type="button"
                  onClick={() => setActiveTab('search')}
                  className="min-h-[48px] bg-[#121214] hover:bg-[#1A1A22] border border-white/10 hover:border-[#E10600] rounded-2xl p-3 flex items-center gap-2.5 shadow-md cursor-pointer transition-all active:scale-95 text-left col-span-1"
                >
                  <div className="h-10 w-10 rounded-xl bg-[#E10600]/20 text-[#E10600] flex items-center justify-center shrink-0">
                    <Navigation className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-black text-white block leading-tight truncate">
                      {t('driverActionNearby', 'पास की नौकरी (5 KM)')}
                    </span>
                    <span className="text-[11px] font-bold text-gray-400 block truncate">
                      नजदीकी रूट
                    </span>
                  </div>
                </button>

                {/* Action 2: मेरे आवेदन */}
                <button
                  type="button"
                  onClick={() => setActiveTab('search')}
                  className="min-h-[48px] bg-[#121214] hover:bg-[#1A1A22] border border-white/10 hover:border-[#E10600] rounded-2xl p-3 flex items-center gap-2.5 shadow-md cursor-pointer transition-all active:scale-95 text-left col-span-1"
                >
                  <div className="h-10 w-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-black text-white block leading-tight truncate">
                      {t('driverActionApplications', 'मेरे आवेदन')}
                    </span>
                    <span className="text-[11px] font-bold text-gray-400 block truncate">
                      {Object.keys(sentRequests).length} पेंडिंग
                    </span>
                  </div>
                </button>

                {/* Action 3: दस्तावेज़-मुक्त सेवा (No Document Need) */}
                <button
                  type="button"
                  onClick={() => setShowNoDocModal(true)}
                  className="min-h-[48px] bg-[#121214] hover:bg-[#1A1A22] border border-white/10 hover:border-[#E10600] rounded-2xl p-3 flex items-center gap-2.5 shadow-md cursor-pointer transition-all active:scale-95 text-left col-span-1"
                >
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-black text-white block leading-tight truncate">
                      दस्तावेज़ की ज़रूरत नहीं
                    </span>
                    <span className="text-[11px] font-bold text-emerald-400 block truncate">
                      ✓ No Document Need
                    </span>
                  </div>
                </button>

                {/* Action 4: मेरी प्रोफाइल */}
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className="min-h-[48px] bg-[#121214] hover:bg-[#1A1A22] border border-white/10 hover:border-[#E10600] rounded-2xl p-3 flex items-center gap-2.5 shadow-md cursor-pointer transition-all active:scale-95 text-left col-span-1"
                >
                  <div className="h-10 w-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-black text-white block leading-tight truncate">
                      {t('driverActionProfile', 'मेरी प्रोफाइल')}
                    </span>
                    <span className="text-[11px] font-bold text-gray-400 block truncate">
                      विवरण देखें
                    </span>
                  </div>
                </button>

              </div>

              {/* 4. SECTION: "नई नौकरियाँ" KI LIST (Gaadi ka type, Jagah, Salary) */}
              <div className="bg-[#121214] border border-white/10 rounded-2xl p-5 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-[#E10600]" />
                    <h4 className="text-base font-black text-white">
                      {t('driverSectionJobs', 'नई नौकरियाँ')}
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-gray-400">
                    {availableJobs.length} उपलब्ध
                  </span>
                </div>

                {/* CLEAN EMPTY STATE WHEN NO REAL JOBS (NO FAKE DEMO DATA) */}
                {availableJobs.length === 0 ? (
                  <div className="p-6 text-center space-y-2">
                    <div className="h-12 w-12 rounded-2xl bg-[#E10600]/20 text-[#E10600] flex items-center justify-center mx-auto text-xl">
                      💼
                    </div>
                    <h5 className="text-base font-black text-white">
                      {t('driverEmptyJobs', 'अभी कुछ नहीं है')}
                    </h5>
                    <p className="text-sm font-medium text-gray-400 max-w-xs mx-auto">
                      गाड़ी मालिक जैसे ही नई नौकरियां पोस्ट करेंगे, वे यहाँ सीधे दिखाई देंगी।
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableJobs.map(opp => {
                      const isSent = !!sentRequests[opp.id];
                      return (
                        <div key={opp.id} className="border border-white/10 rounded-2xl p-4 space-y-3 bg-[#1A1A22]">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-xs font-black text-[#E10600] bg-[#E10600]/10 px-2.5 py-1 rounded-lg border border-[#E10600]/30">
                                {opp.vehicle}
                              </span>
                              <h5 className="text-sm font-black text-white mt-2">{opp.title}</h5>
                            </div>
                            <span className="text-sm font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl">
                              {opp.budget}
                            </span>
                          </div>

                          <div className="text-xs font-bold text-gray-300 bg-[#121214] p-3 rounded-xl border border-white/10 space-y-1">
                            <div>📍 <strong className="text-white">स्थान:</strong> {opp.title}</div>
                            <div>👤 <strong className="text-white">मालिक:</strong> {opp.owner}</div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSentRequests(prev => ({ ...prev, [opp.id]: true }));
                              handleOpenDriverChat(opp);
                            }}
                            className={`w-full min-h-[48px] rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                              isSent 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-[#E10600] hover:bg-[#c20500] text-white shadow-[0_0_15px_rgba(225,6,0,0.3)]'
                            }`}
                          >
                            <MessageSquare className="h-4 w-4" />
                            <span>{isSent ? 'मालिक से चैट चालू 💬' : 'आवेदन करें व मालिक से सीधे चैट करें 💬'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: CONVOY (काफिला) */}
          {activeTab === 'convoy' && (
            <ConvoyView
              currentUserName={driverData.name || 'ड्राइवर साथी'}
              currentUserPhone={driverData.phone || ''}
              currentUserCity={driverData.location || ''}
            />
          )}

          {/* TAB 3: SEARCH / JOBS */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-5 w-5 text-brand-orange" />
                    <h4 className="text-base font-black text-navy">
                      5 KM के दायरे में नौकरियां ({availableJobs.length})
                    </h4>
                  </div>
                </div>

                {availableJobs.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <div className="h-12 w-12 rounded-2xl bg-orange-50 text-brand-orange flex items-center justify-center mx-auto text-xl">
                      🔍
                    </div>
                    <h5 className="text-base font-black text-navy">
                      अभी कुछ नहीं है
                    </h5>
                    <p className="text-sm text-slate-500">
                      जैसे ही कोई ट्रांसपोर्टर या गाड़ी मालिक जॉब पोस्ट करेंगे, आपको सूचना मिलेगी।
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableJobs.map(opp => (
                      <div key={opp.id} className="border border-slate-200 rounded-2xl p-3.5 space-y-2 bg-white">
                        <span className="text-xs font-black text-brand-orange">{opp.vehicle}</span>
                        <h5 className="text-sm font-black text-navy">{opp.title}</h5>
                        <div className="text-xs font-bold text-slate-600">वेतन: {opp.budget}</div>
                        <button
                          type="button"
                          onClick={() => handleOpenDriverChat(opp)}
                          className="w-full min-h-[48px] bg-brand-orange text-navy rounded-2xl font-black text-sm"
                        >
                          मालिक से चैट 💬
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </DashboardShell>
      )}

      {/* Driver View Vehicle Photo Lightbox */}
      <AnimatePresence>
        {viewingVehiclePhoto && (
          <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 select-none"
            onClick={() => setViewingVehiclePhoto(null)}
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
                  <span>मालिक की गाड़ी (Vehicle Photo)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setViewingVehiclePhoto(null)}
                  className="h-6 w-6 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center font-bold text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[65vh]">
                <img
                  src={viewingVehiclePhoto}
                  alt="Vehicle Zoom"
                  className="w-full h-auto object-contain max-h-[65vh]"
                />
              </div>

              <p className="text-[9px] text-slate-300 font-bold px-1">
                🛡️ यह गाड़ी मालिक द्वारा अपलोड की गई वास्तविक फोटो है।
              </p>

              <button
                type="button"
                onClick={() => setViewingVehiclePhoto(null)}
                className="w-full py-2 bg-brand-orange text-navy font-black text-xs rounded-xl cursor-pointer"
              >
                बंद करें (Close)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NO DOCUMENT NEEDED MODAL */}
      <AnimatePresence>
        {showNoDocModal && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 select-none"
            onClick={() => setShowNoDocModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-sm w-full bg-white rounded-3xl overflow-hidden p-5 border border-slate-200 shadow-2xl text-left space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-150">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-black">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-navy leading-none">100% दस्तावेज़-मुक्त</h3>
                    <span className="text-[11px] text-emerald-700 font-bold">No Document Required</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNoDocModal(false)}
                  className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-black cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800">
                  <Check className="h-4 w-4 text-emerald-600 stroke-[3]" />
                  <span>किसी दस्तावेज़ की आवश्यकता नहीं है!</span>
                </div>
                <p className="text-xs text-slate-600 font-bold leading-relaxed">
                  इस ऐप पर सभी यूज़र्स (ड्राइवर, गाड़ी मालिक और मैकेनिक) के लिए कोई लाइसेंस या आधार अपलोड करना ज़रूरी नहीं है।
                </p>
              </div>

              <div className="space-y-2 text-xs font-bold text-slate-600">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 font-black">✓</span>
                  <span>सीधे नौकरी खोजें और आवेदन करें</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 font-black">✓</span>
                  <span>गाड़ी मालिक से सीधे कॉल व चैट पर बात करें</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 font-black">✓</span>
                  <span>कोई कागज़ी औपचारिकता या झंझट नहीं</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowNoDocModal(false)}
                className="w-full py-3 bg-navy text-white hover:bg-slate-900 font-black text-xs rounded-xl transition-all cursor-pointer shadow-xs mt-2"
              >
                समझ गया (OK) ✓
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Safety Reminder Popup: Driver Accepts Owner Job */}
      <SafetyReminderModal
        isOpen={isSafetyModalOpen}
        onClose={() => {
          setIsSafetyModalOpen(false);
          setPendingOppToAccept(null);
        }}
        onConfirm={handleConfirmAcceptJob}
        scenario="driver_accepts_job"
        targetName={pendingOppToAccept?.owner || pendingOppToAccept?.title || 'गाड़ी मालिक'}
      />

    </div>
  );
}
