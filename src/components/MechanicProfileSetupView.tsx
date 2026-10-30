import React, { useState, useMemo } from 'react';
import { 
  Wrench, 
  ArrowLeft, 
  ArrowRight, 
  MapPin, 
  ShieldCheck, 
  AlertCircle, 
  Check, 
  Sparkles, 
  Clock, 
  Navigation,
  CheckCircle2,
  Phone,
  User,
  Settings,
  Briefcase
} from 'lucide-react';
import { AppScreen, VehicleFamilyGroup, WheelCountOption, FuelPowerType, MechanicServiceMode } from '../types';
import { 
  VEHICLE_FAMILY_GROUPS, 
  ALL_WHEEL_COUNTS, 
  MECHANIC_SKILLS_CONFIG, 
  MECHANIC_EQUIPMENT_TOOLS 
} from '../data';
import { ALL_STATES_DATA } from '../geoData';
import { saveMechanicProfileToInsForge } from '../services/insforgeService';

interface Props {
  setScreen: (screen: AppScreen) => void;
  userEmail?: string;
}

export const MechanicProfileSetupView: React.FC<Props> = ({
  setScreen,
  userEmail = 'mechanic@allindiadriver.local'
}) => {
  // 3-Step Wizard Navigation State: 1 = Personal & Garage, 2 = Vehicles & Skills, 3 = Tools & Charges
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Personal & Garage Details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | 'Prefer not to say' | ''>('');
  const [garageName, setGarageName] = useState('');
  const [state, setState] = useState('Madhya Pradesh');
  const [district, setDistrict] = useState('Balaghat');
  const [cityLandmark, setCityLandmark] = useState('');
  const [workshopAddress, setWorkshopAddress] = useState('');
  const [lat, setLat] = useState<number>(21.8124);
  const [lng, setLng] = useState<number>(80.1838);
  const [gpsCaptured, setGpsCaptured] = useState(false);

  // Step 2: Vehicle Categories, Wheels, Fuels & Skills
  const [supportedCategories, setSupportedCategories] = useState<VehicleFamilyGroup[]>([
    '6-10 Wheeler Commercial',
    '12-22 Wheeler Heavy Truck / Trailer'
  ]);
  const [supportedWheelCounts, setSupportedWheelCounts] = useState<(number | string)[]>([
    6, 8, 10, 12, 14, 16, 18, 20, 22
  ]);
  const [supportedFuelTypes, setSupportedFuelTypes] = useState<FuelPowerType[]>([
    'Diesel', 'CNG'
  ]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    'engine_repair', 'brake_system', 'air_compressor_pneumatic', 'roadside_breakdown'
  ]);

  // Step 3: Equipment, Service Mode, Radius & Charges
  const [serviceMode, setServiceMode] = useState<MechanicServiceMode>('Both Workshop & Roadside');
  const [serviceRadiusKm, setServiceRadiusKm] = useState<number>(30);
  const [workingHours, setWorkingHours] = useState('8:00 AM - 10:00 PM');
  const [emergency24x7, setEmergency24x7] = useState(true);
  const [experienceYears, setExperienceYears] = useState<number>(5);
  const [languagesSpoken, setLanguagesSpoken] = useState<string[]>(['हिन्दी (Hindi)', 'English']);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([
    'Pneumatic Air Compressor', 'Heavy Hydraulic Jack (20T–100T)'
  ]);
  const [inspectionFee, setInspectionFee] = useState('200');
  const [certifications, setCertifications] = useState('ITI Motor Mechanic / Highway Certified');

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Memoized available districts for selected state
  const availableDistricts = useMemo(() => {
    return Object.keys(ALL_STATES_DATA[state] || {});
  }, [state]);

  const handleStateChange = (newState: string) => {
    setState(newState);
    const districts = Object.keys(ALL_STATES_DATA[newState] || {});
    if (districts.length > 0) {
      setDistrict(districts[0]);
    }
  };

  const handleCaptureGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(parseFloat(pos.coords.latitude.toFixed(4)));
          setLng(parseFloat(pos.coords.longitude.toFixed(4)));
          setGpsCaptured(true);
        },
        () => {
          setLat(21.8124);
          setLng(80.1838);
          setGpsCaptured(true);
        }
      );
    } else {
      setGpsCaptured(true);
    }
  };

  const toggleCategory = (cat: VehicleFamilyGroup) => {
    setSupportedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleWheel = (wheel: WheelCountOption) => {
    setSupportedWheelCounts(prev => 
      prev.includes(wheel) ? prev.filter(w => w !== wheel) : [...prev, wheel]
    );
  };

  const toggleFuel = (fuel: FuelPowerType) => {
    setSupportedFuelTypes(prev => 
      prev.includes(fuel) ? prev.filter(f => f !== fuel) : [...prev, fuel]
    );
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev => 
      prev.includes(skillId) ? prev.filter(s => s !== skillId) : [...prev, skillId]
    );
  };

  const toggleEquipment = (tool: string) => {
    setSelectedEquipment(prev => 
      prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
    );
  };

  // Step 1 Validation -> Proceed to Step 2
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('कृपया अपना पूरा नाम दर्ज करें / Please enter your name');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError('कृपया सही 10-अंकीय भारतीय मोबाइल नंबर दर्ज करें');
      return;
    }
    if (!/^[6-9]/.test(cleanPhone)) {
      setError('मोबाइल नंबर 6, 7, 8 या 9 से शुरू होना चाहिए');
      return;
    }

    if (!garageName.trim()) {
      setError('कृपया वर्कशॉप या गैरेज का नाम दर्ज करें / Enter garage name');
      return;
    }

    setCurrentStep(2);
  };

  // Step 2 Validation -> Proceed to Step 3
  const handleProceedToStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (supportedCategories.length === 0) {
      setError('कृपया कम से कम एक वाहन श्रेणी चुनें / Select at least 1 vehicle category');
      return;
    }

    if (selectedSkills.length === 0) {
      setError('कृपया कम से कम एक रिपेयर स्किल चुनें / Select at least 1 repair skill');
      return;
    }

    setCurrentStep(3);
  };

  // Final Step 3 Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError('कृपया सही 10-अंकीय मोबाइल नंबर दर्ज करें');
      return;
    }

    setIsSubmitting(true);

    const profileData = {
      id: `mech-${Date.now()}`,
      name: name.trim(),
      phone: cleanPhone,
      gender: gender || undefined,
      garageName: garageName.trim(),
      state,
      district,
      cityLandmark: cityLandmark.trim(),
      workshopAddress: workshopAddress.trim() || `${cityLandmark}, ${district}, ${state}`,
      location: `${district}, ${state}`,
      lat,
      lng,
      serviceRadiusKm,
      workingHours,
      emergency24x7,
      serviceMode,
      experienceYears: Number(experienceYears) || 0,
      languagesSpoken,
      supportedFamilyGroups: supportedCategories,
      supportedWheelCounts,
      supportedFuelTypes,
      skills: selectedSkills,
      equipmentTools: selectedEquipment,
      inspectionFee: inspectionFee.trim(),
      certifications: certifications.trim(),
      rating: null,
      verified: false,
      isOnline: true
    };

    try {
      await saveMechanicProfileToInsForge(profileData);
      localStorage.setItem('all_india_driver_is_authenticated', 'true');
      localStorage.setItem('all_india_driver_selected_role', 'mechanic');
      localStorage.setItem('all_india_driver_active_mechanic_id', profileData.id);
      setIsSubmitting(false);
      setScreen('mechanic-dashboard');
    } catch (err) {
      console.warn('Mechanic save error:', err);
      setIsSubmitting(false);
      setScreen('mechanic-dashboard');
    }
  };

  return (
    <div className="flex-1 bg-[#0A040F] text-white flex flex-col justify-between p-4 sm:p-6 min-h-screen overflow-y-auto" id="mechanic-profile-setup-root">
      
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4 shrink-0 max-w-6xl mx-auto w-full">
        <button
          type="button"
          onClick={() => {
            if (currentStep === 1) {
              setScreen('role-selection');
            } else if (currentStep === 2) {
              setCurrentStep(1);
            } else if (currentStep === 3) {
              setCurrentStep(2);
            }
          }}
          className="px-3 py-2 rounded-xl bg-[#170C22] hover:bg-[#251536] transition-all cursor-pointer border border-purple-500/30 flex items-center gap-2 text-xs font-bold text-white"
        >
          <ArrowLeft className="h-4 w-4 text-purple-400" />
          <span>{currentStep === 1 ? 'भूमिका (Back)' : 'पीछे (Back)'}</span>
        </button>
        <span className="text-[11px] font-black text-purple-300 bg-purple-500/20 border border-purple-400/40 px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
          स्टेप {currentStep} / 3 • {currentStep === 1 ? 'व्यक्तिगत व गैरेज' : currentStep === 2 ? 'वाहन व स्किल्स' : 'टूल्स व मोड'} (Mechanic Purple Theme)
        </span>
      </div>

      <div className="space-y-5 max-w-6xl mx-auto w-full pb-10">
        
        {/* Banner Title & Step Progress Bar */}
        <div className="text-center space-y-1.5">
          <div className="h-12 w-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(168,85,247,0.35)] border border-purple-400/40">
            <Wrench className="h-6 w-6 text-purple-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight">
            मैकेनिक / गैरेज रजिस्ट्रेशन
          </h2>
          <p className="text-xs text-purple-300 font-semibold">
            {currentStep === 1 && 'चरण 1: व्यक्तिगत और गैरेज का विवरण भरें'}
            {currentStep === 2 && 'चरण 2: वाहन श्रेणियां एवं मरम्मत स्किल्स चुनें'}
            {currentStep === 3 && 'चरण 3: टूल्स, सर्विस मोड एवं दरें तय करें'}
          </p>
        </div>

        {/* 3-STEP PROGRESS STEPPER BAR */}
        <div className="bg-[#13091B] border border-purple-500/30 rounded-2xl p-3 shadow-lg">
          <div className="grid grid-cols-3 gap-2 text-center">
            {/* Step 1 Tab Indicator */}
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`p-2 rounded-xl border transition-all text-left flex items-center gap-2.5 cursor-pointer ${
                currentStep === 1 
                  ? 'border-purple-400 bg-purple-600/30 text-white font-black shadow-[0_0_12px_rgba(168,85,247,0.3)]' 
                  : currentStep > 1 
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' 
                  : 'border-white/10 bg-[#170C22] text-gray-400'
              }`}
            >
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                currentStep > 1 ? 'bg-emerald-600 text-white' : currentStep === 1 ? 'bg-[#A855F7] text-white shadow-xs' : 'bg-[#251536] text-gray-400'
              }`}>
                {currentStep > 1 ? '✓' : '1'}
              </div>
              <div className="min-w-0">
                <span className="block text-[11px] font-extrabold uppercase leading-none truncate">1. गैरेज प्रोफाइल</span>
                <span className="text-[9px] text-gray-400 hidden sm:block mt-0.5">नाम व पता</span>
              </div>
            </button>

            {/* Step 2 Tab Indicator */}
            <button
              type="button"
              onClick={() => {
                if (name && phone && garageName) setCurrentStep(2);
              }}
              className={`p-2 rounded-xl border transition-all text-left flex items-center gap-2.5 cursor-pointer ${
                currentStep === 2 
                  ? 'border-purple-400 bg-purple-600/30 text-white font-black shadow-[0_0_12px_rgba(168,85,247,0.3)]' 
                  : currentStep > 2 
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' 
                  : 'border-white/10 bg-[#170C22] text-gray-400'
              }`}
            >
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                currentStep > 2 ? 'bg-emerald-600 text-white' : currentStep === 2 ? 'bg-[#A855F7] text-white shadow-xs' : 'bg-[#251536] text-gray-400'
              }`}>
                {currentStep > 2 ? '✓' : '2'}
              </div>
              <div className="min-w-0">
                <span className="block text-[11px] font-extrabold uppercase leading-none truncate">2. वाहन व कार्य</span>
                <span className="text-[9px] text-gray-400 hidden sm:block mt-0.5">स्किल्स व वाहन</span>
              </div>
            </button>

            {/* Step 3 Tab Indicator */}
            <button
              type="button"
              onClick={() => {
                if (name && phone && garageName && supportedCategories.length > 0) setCurrentStep(3);
              }}
              className={`p-2 rounded-xl border transition-all text-left flex items-center gap-2.5 cursor-pointer ${
                currentStep === 3 
                  ? 'border-purple-400 bg-purple-600/30 text-white font-black shadow-[0_0_12px_rgba(168,85,247,0.3)]' 
                  : 'border-white/10 bg-[#170C22] text-gray-400'
              }`}
            >
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                currentStep === 3 ? 'bg-[#A855F7] text-white shadow-xs' : 'bg-[#251536] text-gray-400'
              }`}>
                3
              </div>
              <div className="min-w-0">
                <span className="block text-[11px] font-extrabold uppercase leading-none truncate">3. टूल्स व दरें</span>
                <span className="text-[9px] text-gray-400 hidden sm:block mt-0.5">चार्ज व सुविधाएं</span>
              </div>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-950/60 text-red-200 text-xs font-bold p-3.5 rounded-2xl border border-red-800 flex items-start gap-2.5">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* PAGE / STEP 1: PERSONAL & WORKSHOP DETAILS */}
        {/* ============================================================== */}
        {currentStep === 1 && (
          <form onSubmit={handleProceedToStep2} className="space-y-5">
            
            {/* 1. Basic Personal Info Card */}
            <div className="card-mechanic-theme rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="text-sm font-black text-white flex items-center gap-2 border-b border-purple-500/20 pb-3">
                <User className="h-4 w-4 text-purple-400" />
                <span>व्यक्तिगत जानकारी (Personal Info)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-black text-white uppercase tracking-wider block">
                    पूरा नाम (Full Name) <span className="text-purple-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="उदा. रमेश विश्वकर्मा"
                    className="w-full px-3.5 py-3 bg-[#170C22] border border-purple-500/30 focus:border-[#A855F7] rounded-xl text-sm font-bold outline-none text-white placeholder:text-gray-500 transition-all"
                  />
                </div>

                {/* 10-Digit Mobile Number */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-black text-white uppercase tracking-wider block">
                    सक्रिय मोबाइल नंबर (10-Digit Mobile) <span className="text-purple-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-purple-400 font-mono">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      required
                      value={phone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhone(digits);
                      }}
                      placeholder="10 अंकों का मोबाइल नंबर"
                      className="w-full pl-12 pr-3.5 py-3 bg-[#170C22] border border-purple-500/30 focus:border-[#A855F7] rounded-xl text-sm font-bold font-mono outline-none text-white placeholder:text-gray-500 transition-all"
                    />
                  </div>
                  <span className="text-[11px] text-gray-400 font-semibold block">केवल 10 अंकों का मान्य भारतीय नंबर</span>
                </div>
              </div>

              {/* Optional Gender */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-white uppercase tracking-wider block">
                    Gender / लिंग
                  </label>
                  <span className="text-[10px] text-gray-400 font-semibold">(वैकल्पिक / Optional)</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(['Male', 'Female', 'Other', 'Prefer not to say'] as const).map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`py-2 text-xs font-bold rounded-xl transition-all border text-center cursor-pointer ${
                        gender === g
                          ? 'border-[#A855F7] bg-[#A855F7] text-white font-black shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                          : 'border-white/10 bg-[#170C22] text-gray-300 hover:bg-[#251536]'
                      }`}
                    >
                      {g === 'Male' ? 'पुरुष (M)' : g === 'Female' ? 'महिला (F)' : g === 'Other' ? 'अन्य' : 'छुपाएं'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Garage & Workshop Location Card */}
            <div className="card-mechanic-theme rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="text-sm font-black text-white flex items-center gap-2 border-b border-purple-500/20 pb-3">
                <MapPin className="h-4 w-4 text-purple-400" />
                <span>गैरेज व कार्यस्थल (Workshop Details)</span>
              </div>

              {/* Garage Name */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-black text-white uppercase tracking-wider block">
                  गैरेज / वर्कशॉप का नाम (Garage Name) <span className="text-purple-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={garageName}
                  onChange={(e) => setGarageName(e.target.value)}
                  placeholder="उदा. विश्वकर्मा 24x7 हैवी ट्रक व ट्रेलर रिपेयर"
                  className="w-full px-3.5 py-3 bg-[#170C22] border border-purple-500/30 focus:border-[#A855F7] rounded-xl text-sm font-bold outline-none text-white placeholder:text-gray-500 transition-all"
                />
              </div>

              {/* State & District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-black text-white uppercase tracking-wider block">
                    राज्य (State)
                  </label>
                  <select
                    value={state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full px-3.5 py-3 bg-[#170C22] border border-purple-500/30 focus:border-[#A855F7] rounded-xl text-sm font-bold text-white outline-none cursor-pointer"
                  >
                    {Object.keys(ALL_STATES_DATA).map(st => (
                      <option key={st} value={st} className="bg-[#13091B] text-white">{st}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-black text-white uppercase tracking-wider block">
                    ज़िला (District)
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-3 bg-[#170C22] border border-purple-500/30 focus:border-[#A855F7] rounded-xl text-sm font-bold text-white outline-none cursor-pointer"
                  >
                    {availableDistricts.map(d => (
                      <option key={d} value={d} className="bg-[#13091B] text-white">{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Highway Landmark & Workshop Address */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-black text-white uppercase tracking-wider block">
                  हाईवे व लैंडमार्क (Highway / Landmark)
                </label>
                <input
                  type="text"
                  value={cityLandmark}
                  onChange={(e) => setCityLandmark(e.target.value)}
                  placeholder="उदा. NH-44 बाईपास, टोल प्लाजा के पास"
                  className="w-full px-3.5 py-3 bg-[#170C22] border border-purple-500/30 focus:border-[#A855F7] rounded-xl text-sm font-bold outline-none text-white placeholder:text-gray-500 transition-all"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-black text-white uppercase tracking-wider block">
                  पूरा वर्कशॉप पता (Workshop Full Address)
                </label>
                <input
                  type="text"
                  value={workshopAddress}
                  onChange={(e) => setWorkshopAddress(e.target.value)}
                  placeholder="दुकान नं., रोड का नाम, लैंडमार्क"
                  className="w-full px-3.5 py-3 bg-[#170C22] border border-purple-500/30 focus:border-[#A855F7] rounded-xl text-sm font-bold outline-none text-white placeholder:text-gray-500 transition-all"
                />
              </div>

              {/* Live GPS Capture */}
              <div className="flex items-center justify-between p-3.5 bg-[#170C22] rounded-xl border border-purple-500/30">
                <div className="text-left">
                  <span className="text-xs font-black text-white block">लाइव GPS लोकेशन</span>
                  <span className="text-[11px] text-purple-300 font-mono">
                    {gpsCaptured ? `Lat: ${lat} • Lng: ${lng} ✓` : 'हाईवे चालकों को दिखने हेतु GPS सेट करें'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCaptureGps}
                  className="btn-mechanic px-3.5 py-2 text-xs font-bold shadow-[0_0_15px_rgba(168,85,247,0.35)] cursor-pointer"
                >
                  <Navigation className="h-3.5 w-3.5 text-white" />
                  <span>{gpsCaptured ? 'पुनः कैप्चर' : 'GPS कैप्चर'}</span>
                </button>
              </div>
            </div>

            {/* Next Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="btn-mechanic w-full py-4 text-sm font-bold shadow-[0_0_25px_rgba(168,85,247,0.6)] cursor-pointer active:scale-95 transition-all uppercase tracking-wider"
              >
                <span>आगे बढ़ें: वाहन व स्किल्स (Step 2 ➔)</span>
                <ArrowRight className="h-4 w-4 text-white" />
              </button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* PAGE / STEP 2: VEHICLE CATEGORIES, WHEELS & REPAIR SKILLS */}
        {/* ============================================================== */}
        {currentStep === 2 && (
          <form onSubmit={handleProceedToStep3} className="space-y-5">
            
            {/* Supported Vehicle Categories */}
            <div className="card-mechanic-theme rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="text-sm font-black text-white flex items-center gap-2 border-b border-purple-500/20 pb-3">
                <Wrench className="h-4 w-4 text-purple-400" />
                <span>समर्थित वाहन श्रेणियां (Supported Vehicle Categories) *</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {VEHICLE_FAMILY_GROUPS.map(fam => {
                  const isSelected = supportedCategories.includes(fam.familyGroup);
                  return (
                    <button
                      key={fam.familyGroup}
                      type="button"
                      onClick={() => toggleCategory(fam.familyGroup)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#A855F7] bg-[#A855F7]/25 text-white font-black shadow-md'
                          : 'border-white/10 bg-[#170C22] text-gray-300 hover:border-purple-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xl">{fam.icon}</span>
                        {isSelected && <Check className="h-4 w-4 text-purple-400 stroke-[3]" />}
                      </div>
                      <span className="text-xs font-bold block leading-tight">{fam.titleHindi}</span>
                    </button>
                  );
                })}
              </div>

              {/* Wheel Counts (2 to 40+) */}
              <div className="space-y-1.5 pt-3 border-t border-purple-500/20 text-left">
                <label className="text-xs font-black text-white uppercase tracking-wider block">
                  चक्का संख्या (Supported Wheel Counts)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_WHEEL_COUNTS.map(w => {
                    const isSel = supportedWheelCounts.includes(w);
                    return (
                      <button
                        key={String(w)}
                        type="button"
                        onClick={() => toggleWheel(w)}
                        className={`px-3 py-1.5 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                          isSel
                            ? 'bg-[#A855F7] text-white border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                            : 'bg-[#170C22] text-gray-400 border-white/10 hover:border-purple-500/30'
                        }`}
                      >
                        {w}W
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fuel Types */}
              <div className="space-y-1.5 pt-3 border-t border-purple-500/20 text-left">
                <label className="text-xs font-black text-white uppercase tracking-wider block">
                  ईंधन प्रकार (Supported Fuels)
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['Petrol', 'Diesel', 'CNG', 'LPG', 'Electric / EV', 'Hybrid'] as FuelPowerType[]).map(fuel => {
                    const isSel = supportedFuelTypes.includes(fuel);
                    return (
                      <button
                        key={fuel}
                        type="button"
                        onClick={() => toggleFuel(fuel)}
                        className={`px-3 py-1.5 text-xs font-extrabold rounded-xl border transition-all cursor-pointer ${
                          isSel
                            ? 'bg-purple-600 text-white border-purple-400 shadow-xs'
                            : 'bg-[#170C22] text-gray-400 border-white/10 hover:border-purple-500/30'
                        }`}
                      >
                        {fuel}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 20 Standardized Repair Skills */}
            <div className="card-mechanic-theme rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="text-sm font-black text-white flex items-center justify-between border-b border-purple-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-purple-400" />
                  <span>20 रिपेयर स्किल्स व विशेषज्ञता (Repair Skills) *</span>
                </div>
                <span className="text-xs font-bold text-purple-300">
                  {selectedSkills.length} चयनित
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {MECHANIC_SKILLS_CONFIG.map(skill => {
                  const isSel = selectedSkills.includes(skill.id);
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => toggleSkill(skill.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                        isSel
                          ? 'border-[#A855F7] bg-[#A855F7]/25 text-white font-black shadow-xs'
                          : 'border-white/10 bg-[#170C22] text-gray-300 hover:border-purple-500/30'
                      }`}
                    >
                      <span className="text-base shrink-0">{skill.icon}</span>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-extrabold block leading-snug">{skill.nameHindi}</span>
                        <span className="text-[10px] text-gray-400 font-medium block truncate">{skill.nameEnglish}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stepper Navigation Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="w-1/3 py-4 bg-[#170C22] hover:bg-[#251536] text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all border border-purple-500/30 uppercase"
              >
                <ArrowLeft className="h-4 w-4 text-purple-400" />
                <span>पीछे</span>
              </button>

              <button
                type="submit"
                className="btn-mechanic w-2/3 py-4 text-xs font-black shadow-[0_0_25px_rgba(168,85,247,0.6)] cursor-pointer active:scale-95 transition-all uppercase tracking-wider"
              >
                <span>आगे बढ़ें: टूल्स व दरें (Step 3 ➔)</span>
                <ArrowRight className="h-4 w-4 text-white" />
              </button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* PAGE / STEP 3: TOOLS, SERVICE MODE, RADIUS & CHARGES */}
        {/* ============================================================== */}
        {currentStep === 3 && (
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Service Delivery Mode & Radius */}
            <div className="card-mechanic-theme rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="text-sm font-black text-white flex items-center gap-2 border-b border-purple-500/20 pb-3">
                <Settings className="h-4 w-4 text-purple-400" />
                <span>सर्विस मोड व दायरा (Service Mode & Radius)</span>
              </div>

              {/* Service Mode Chips */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-black text-white uppercase tracking-wider block">
                  सर्विस मोड (Service Delivery Mode)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(['Workshop Only', 'On-Site Roadside Only', 'Both Workshop & Roadside'] as MechanicServiceMode[]).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setServiceMode(mode)}
                      className={`py-2.5 px-3 text-xs font-extrabold rounded-xl transition-all border text-center cursor-pointer ${
                        serviceMode === mode
                          ? 'border-[#A855F7] bg-[#A855F7] text-white font-black shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                          : 'border-white/10 bg-[#170C22] text-gray-400 hover:border-purple-500/30'
                      }`}
                    >
                      {mode === 'Workshop Only' ? 'केवल गैरेज पर' : mode === 'On-Site Roadside Only' ? 'केवल रोडसाइड SOS' : 'दोनों (गैरेज + ऑन-साइट)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Radius Slider */}
              <div className="space-y-1.5 pt-2 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-white uppercase tracking-wider">
                    सर्विस दायरा (Service Radius)
                  </label>
                  <span className="text-sm font-black text-purple-400">{serviceRadiusKm} KM</span>
                </div>
                <div className="flex gap-2">
                  {[5, 10, 25, 50, 100].map(km => (
                    <button
                      key={km}
                      type="button"
                      onClick={() => setServiceRadiusKm(km)}
                      className={`flex-1 py-2 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                        serviceRadiusKm === km
                          ? 'bg-[#A855F7] text-white border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                          : 'border-white/10 bg-[#170C22] text-gray-400 hover:border-purple-500/30'
                      }`}
                    >
                      {km} KM
                    </button>
                  ))}
                </div>
              </div>

              {/* 24x7 Emergency SOS Toggle */}
              <label className="flex items-center justify-between p-3.5 bg-purple-950/40 border border-purple-500/30 rounded-xl cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-[#A855F7] animate-pulse" />
                  <span className="text-xs font-black text-white">24x7 इमरजेंसी रोडसाइड सहायता उपलब्ध</span>
                </div>
                <input
                  type="checkbox"
                  checked={emergency24x7}
                  onChange={(e) => setEmergency24x7(e.target.checked)}
                  className="h-4 w-4 accent-[#A855F7] cursor-pointer"
                />
              </label>

              {/* Experience Years & Working Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-black text-white uppercase tracking-wider block">
                    अनुभव (Years of Experience)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value) || 0)}
                    className="w-full px-3.5 py-3 bg-[#170C22] border border-purple-500/30 focus:border-[#A855F7] rounded-xl text-sm font-bold outline-none text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-black text-white uppercase tracking-wider block">
                    कार्य समय (Working Hours)
                  </label>
                  <input
                    type="text"
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                    placeholder="उदा. 24x7 या 8 AM - 9 PM"
                    className="w-full px-3.5 py-3 bg-[#170C22] border border-purple-500/30 focus:border-[#A855F7] rounded-xl text-sm font-bold outline-none text-white placeholder:text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Equipment & Diagnostic Tools */}
            <div className="card-mechanic-theme rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="text-sm font-black text-white flex items-center justify-between border-b border-purple-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-purple-400" />
                  <span>उपकरण व डायग्नोस्टिक टूल्स (Tools & Equipment)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {MECHANIC_EQUIPMENT_TOOLS.map(tool => {
                  const isSel = selectedEquipment.includes(tool);
                  return (
                    <button
                      key={tool}
                      type="button"
                      onClick={() => toggleEquipment(tool)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-extrabold transition-all cursor-pointer flex items-center justify-between ${
                        isSel
                          ? 'border-purple-400 bg-purple-600/30 text-white shadow-xs'
                          : 'border-white/10 bg-[#170C22] text-gray-400 hover:border-purple-500/30'
                      }`}
                    >
                      <span>{tool}</span>
                      {isSel && <Check className="h-4 w-4 text-purple-400 stroke-[3] shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Inspection Fee & Certifications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-purple-500/20">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-black text-white uppercase tracking-wider block">
                    बेस विज़िट शुल्क (Base Inspection Fee)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-purple-400">₹</span>
                    <input
                      type="text"
                      value={inspectionFee}
                      onChange={(e) => setInspectionFee(e.target.value)}
                      placeholder="200"
                      className="w-full pl-8 pr-3.5 py-3 bg-[#170C22] border border-purple-500/30 focus:border-[#A855F7] rounded-xl text-sm font-bold outline-none text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-black text-white uppercase tracking-wider block">
                    सर्टिफिकेशन (Certifications)
                  </label>
                  <input
                    type="text"
                    value={certifications}
                    onChange={(e) => setCertifications(e.target.value)}
                    placeholder="उदा. ITI / Bosch Certified"
                    className="w-full px-3.5 py-3 bg-[#170C22] border border-purple-500/30 focus:border-[#A855F7] rounded-xl text-sm font-bold outline-none text-white placeholder:text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Stepper Navigation Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-1/3 py-4 bg-[#170C22] hover:bg-[#251536] text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all border border-purple-500/30 uppercase"
              >
                <ArrowLeft className="h-4 w-4 text-purple-400" />
                <span>पीछे</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-mechanic w-2/3 py-4 text-xs font-black shadow-[0_0_25px_rgba(168,85,247,0.6)] cursor-pointer active:scale-95 transition-all uppercase tracking-wider"
              >
                <span>{isSubmitting ? 'प्रोफाइल सहेजी जा रही है...' : '🔧 Become a Mechanic • सहेजें और लाइव जाएँ'}</span>
                <CheckCircle2 className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

      </div>

    </div>
  );
};
