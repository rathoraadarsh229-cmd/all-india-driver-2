import { 
  DriverProfile, 
  VehicleFamilyGroup, 
  WheelCountOption, 
  MechanicProfile, 
  MechanicServiceMode, 
  AxleCountOption 
} from './types';

export const LANGUAGES = [
  { code: 'hi', label: 'हिन्दी (Hindi)', nativeLabel: 'हिन्दी', region: 'MP, UP, Bihar, Rajasthan, HP, Haryana, etc.' },
  { code: 'en', label: 'English', nativeLabel: 'English', region: 'All India, NE States & Official' },
  { code: 'mr', label: 'मराठी (Marathi)', nativeLabel: 'मराठी', region: 'Maharashtra, Goa' },
  { code: 'te', label: 'తెలుగు (Telugu)', nativeLabel: 'తెలుగు', region: 'Andhra Pradesh, Telangana' },
  { code: 'ta', label: 'தமிழ் (Tamil)', nativeLabel: 'தமிழ்', region: 'Tamil Nadu' },
  { code: 'bn', label: 'বাংলা (Bengali)', nativeLabel: 'বাংলা', region: 'West Bengal, Tripura, Assam, Jharkhand' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)', nativeLabel: 'ગુજરાતી', region: 'Gujarat' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)', nativeLabel: 'ಕನ್ನಡ', region: 'Karnataka' },
  { code: 'ml', label: 'മലയാളം (Malayalam)', nativeLabel: 'മലയാളം', region: 'Kerala' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)', nativeLabel: 'ਪੰਜਾਬੀ', region: 'Punjab, Haryana' },
  { code: 'or', label: 'ଓଡ଼ିଆ (Odia)', nativeLabel: 'ଓଡ଼ିଆ', region: 'Odisha' },
  { code: 'as', label: 'অসমীয়া (Assamese)', nativeLabel: 'অসমীয়া', region: 'Assam' },
  { code: 'ur', label: 'اردو (Urdu)', nativeLabel: 'اردو', region: 'Andhra, Telangana, UP, Bihar, J&K' }
];

export const VEHICLE_PRESETS = [
  { category: 'Car', label: 'Car/Mini SUV', icon: '🚗' },
  { category: 'Commercial', label: 'Commercial Tempo (6-10 Wheeler)', icon: '🚚' },
  { category: 'Heavy Trailer', label: 'Heavy Trailer (12+ Wheeler)', icon: '🚛' }
];

// 6 LOGICAL VEHICLE FAMILY GROUPS & ALL 22 WHEEL COUNTS (2W to 40+W)
export interface VehicleFamilyConfig {
  familyGroup: VehicleFamilyGroup;
  titleHindi: string;
  titleEnglish: string;
  icon: string;
  supportedWheelCounts: WheelCountOption[];
  subtypes: string[];
  defaultAxle: AxleCountOption;
}

export const VEHICLE_FAMILY_GROUPS: VehicleFamilyConfig[] = [
  {
    familyGroup: '2-Wheeler',
    titleHindi: '2-पहिया (Two Wheeler)',
    titleEnglish: '2-Wheeler (Motorcycle / Scooter / EV)',
    icon: '🛵',
    supportedWheelCounts: [2],
    subtypes: [
      'Motorcycle / Bike',
      'Scooter',
      'Electric Two-Wheeler (EV)',
      'Moped',
      'Delivery Two-Wheeler'
    ],
    defaultAxle: '1 Axle'
  },
  {
    familyGroup: '3-Wheeler',
    titleHindi: '3-पहिया (Three Wheeler)',
    titleEnglish: '3-Wheeler (Auto / E-Rickshaw / Cargo)',
    icon: '🛺',
    supportedWheelCounts: [3],
    subtypes: [
      'Passenger Auto-Rickshaw',
      'E-Rickshaw (Electric)',
      'Cargo Three-Wheeler / Loader Auto',
      'CNG Three-Wheeler',
      'Diesel Loader Three-Wheeler'
    ],
    defaultAxle: '2 Axles'
  },
  {
    familyGroup: '4-Wheeler',
    titleHindi: '4-पहिया (Four Wheeler / Car / Taxi)',
    titleEnglish: '4-Wheeler (Car / Taxi / Pickup / Van)',
    icon: '🚗',
    supportedWheelCounts: [4],
    subtypes: [
      'Hatchback / Sedan / SUV / MPV',
      'Taxi / Commercial Cab',
      'Jeep / Utility Vehicle (Bolero / Scorpio)',
      'Pickup / Small Commercial 4-Wheeler',
      'Electric Car / EV',
      'Mini Van / Light Passenger Van'
    ],
    defaultAxle: '2 Axles'
  },
  {
    familyGroup: '6-10 Wheeler Commercial',
    titleHindi: '6-10 चक्का कमर्शियल (Truck / Bus / Tipper)',
    titleEnglish: '6–10 Wheeler Commercial (Light / Medium / Heavy)',
    icon: '🚚',
    supportedWheelCounts: [6, 8, 10],
    subtypes: [
      'Light Commercial Vehicle (LCV / 6-Wheeler)',
      'Medium Commercial Truck (8-Wheeler)',
      'Heavy Goods Lorry (10-Wheeler)',
      'Bus / Staff Bus / Sleeper Coach',
      'Tipper / Dumper',
      'Tanker (Fuel / Milk / Chemical)'
    ],
    defaultAxle: '3 Axles'
  },
  {
    familyGroup: '12-22 Wheeler Heavy Truck / Trailer',
    titleHindi: '12-22 चक्का भारी ट्रेलर / ट्रक (Multi-Axle)',
    titleEnglish: '12–22 Wheeler Heavy Truck / Trailer',
    icon: '🚛',
    supportedWheelCounts: [12, 14, 16, 18, 20, 22],
    subtypes: [
      'Multi-Axle Rigid Truck (12 / 14-Wheeler)',
      'Tractor-Trailer (14 / 16-Wheeler)',
      'Container Trailer (18 / 20 / 22-Wheeler)',
      'Flatbed Trailer',
      'Bulker / Cement Carrier',
      'Car Carrier Trailer',
      'Heavy Tipper / Mining Tipper'
    ],
    defaultAxle: '5 Axles'
  },
  {
    familyGroup: '24-40+ Wheeler Heavy Haulage',
    titleHindi: '24-40+ चक्का ओवरसाइज्ड भारी वाहन (ODC / Modular)',
    titleEnglish: '24–40+ Wheeler Heavy Haulage (ODC / Hydraulic)',
    icon: '🚜',
    supportedWheelCounts: [24, 26, 28, 30, 32, 34, 36, 38, 40, '40+'],
    subtypes: [
      'Hydraulic Axle Modular Trailer',
      'Puller + Modular Trailer Combination',
      'Oversized Cargo (ODC) Transporter',
      'Windmill Blade / Transformer Carrier',
      'Heavy Equipment & Industrial Carrier',
      'Mining & Construction Super Heavy Hauler'
    ],
    defaultAxle: '10+ Modular Axles'
  }
];

// ALL 22 WHEEL COUNTS
export const ALL_WHEEL_COUNTS: WheelCountOption[] = [
  2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, '40+'
];

// 20 REQUIRED MECHANIC REPAIR SKILL CATEGORIES
export interface MechanicSkillCategory {
  id: string;
  nameHindi: string;
  nameEnglish: string;
  icon: string;
  applicableFamilies: VehicleFamilyGroup[];
}

export const MECHANIC_SKILLS_CONFIG: MechanicSkillCategory[] = [
  {
    id: 'engine_repair',
    nameHindi: 'इंजन रिपेयर (पेट्रोल / डीजल / CNG / LPG)',
    nameEnglish: 'Engine Repair (Petrol / Diesel / CNG / LPG)',
    icon: '⚙️',
    applicableFamilies: ['2-Wheeler', '3-Wheeler', '4-Wheeler', '6-10 Wheeler Commercial', '12-22 Wheeler Heavy Truck / Trailer', '24-40+ Wheeler Heavy Haulage']
  },
  {
    id: 'ev_powertrain',
    nameHindi: 'EV मोटर, बैटरी और कंट्रोलर रिपेयर',
    nameEnglish: 'EV Motor, Battery & Controller Repair',
    icon: '🔋',
    applicableFamilies: ['2-Wheeler', '3-Wheeler', '4-Wheeler', '6-10 Wheeler Commercial']
  },
  {
    id: 'gearbox_clutch',
    nameHindi: 'गियरबॉक्स, क्लच और ट्रांसमिशन सर्विस',
    nameEnglish: 'Gearbox, Clutch & Transmission',
    icon: '🕹️',
    applicableFamilies: ['2-Wheeler', '3-Wheeler', '4-Wheeler', '6-10 Wheeler Commercial', '12-22 Wheeler Heavy Truck / Trailer', '24-40+ Wheeler Heavy Haulage']
  },
  {
    id: 'brake_system',
    nameHindi: 'ब्रेक सिस्टम (ड्रम / डिस्क / हाइड्रोलिक / एयर ब्रेक)',
    nameEnglish: 'Brake System (Drum / Disc / Hydraulic / Air Brake)',
    icon: '🛑',
    applicableFamilies: ['2-Wheeler', '3-Wheeler', '4-Wheeler', '6-10 Wheeler Commercial', '12-22 Wheeler Heavy Truck / Trailer', '24-40+ Wheeler Heavy Haulage']
  },
  {
    id: 'air_compressor_pneumatic',
    nameHindi: 'एयर कंप्रेसर, न्यूमेटिक पाइप व वाल्व रिपेयर',
    nameEnglish: 'Air Compressor, Pneumatic Lines & Valves',
    icon: '💨',
    applicableFamilies: ['6-10 Wheeler Commercial', '12-22 Wheeler Heavy Truck / Trailer', '24-40+ Wheeler Heavy Haulage']
  },
  {
    id: 'suspension_leaf_spring',
    nameHindi: 'सस्पेंशन, कमानी (Leaf Spring) व एयर सस्पेंशन',
    nameEnglish: 'Suspension, Leaf Spring, Shock Absorber & Air Suspension',
    icon: '🧲',
    applicableFamilies: ['3-Wheeler', '4-Wheeler', '6-10 Wheeler Commercial', '12-22 Wheeler Heavy Truck / Trailer', '24-40+ Wheeler Heavy Haulage']
  },
  {
    id: 'steering_differential',
    nameHindi: 'स्टीयरिंग, एक्सल, डिफ्रेंशियल व व्हील हब',
    nameEnglish: 'Steering, Axle, Differential & Wheel Hub',
    icon: '☸️',
    applicableFamilies: ['4-Wheeler', '6-10 Wheeler Commercial', '12-22 Wheeler Heavy Truck / Trailer', '24-40+ Wheeler Heavy Haulage']
  },
  {
    id: 'tyre_service',
    nameHindi: 'टायर, ट्यूब, पंचर व हैवी टायर अलाइनमेंट',
    nameEnglish: 'Tyre, Tube, Puncture, Wheel Alignment & Heavy Tyre Service',
    icon: '🔘',
    applicableFamilies: ['2-Wheeler', '3-Wheeler', '4-Wheeler', '6-10 Wheeler Commercial', '12-22 Wheeler Heavy Truck / Trailer', '24-40+ Wheeler Heavy Haulage']
  },
  {
    id: 'electrical_battery',
    nameHindi: 'इलेक्ट्रिकल वायरिंग, अल्टरनेटर, सेल्फ-स्टार्ट व बैटरी',
    nameEnglish: 'Electrical Wiring, Alternator, Self-Start, Battery & Lighting',
    icon: '⚡',
    applicableFamilies: ['2-Wheeler', '3-Wheeler', '4-Wheeler', '6-10 Wheeler Commercial', '12-22 Wheeler Heavy Truck / Trailer', '24-40+ Wheeler Heavy Haulage']
  },
  {
    id: 'ecu_sensor_diagnostics',
    nameHindi: 'ECU / ECM / OBD स्कैनर व सेंसर डायग्नोस्टिक्स',
    nameEnglish: 'ECU / ECM / OBD / Sensor Diagnostics',
    icon: '💻',
    applicableFamilies: ['4-Wheeler', '6-10 Wheeler Commercial', '12-22 Wheeler Heavy Truck / Trailer']
  },
  {
    id: 'ac_cabin_cooling',
    nameHindi: 'AC, हीटिंग व केबिन कूलिंग रिपेयर',
    nameEnglish: 'AC, Heating & Cabin Cooling',
    icon: '❄️',
    applicableFamilies: ['4-Wheeler', '6-10 Wheeler Commercial', '12-22 Wheeler Heavy Truck / Trailer']
  },
  {
    id: 'hydraulic_tipper',
    nameHindi: 'हाइड्रोलिक सिस्टम, जैक, टिपर व ट्रेलर हाइड्रोलिक्स',
    nameEnglish: 'Hydraulic System, Jack, Tipper & Trailer Hydraulics',
    icon: '🏗️',
    applicableFamilies: ['6-10 Wheeler Commercial', '12-22 Wheeler Heavy Truck / Trailer', '24-40+ Wheeler Heavy Haulage']
  },
  {
    id: 'fifth_wheel_coupling',
    nameHindi: 'फिफ्थ-व्हील कपलिंग, किंगपिन व ट्रेलर कपलिंग',
    nameEnglish: 'Fifth-Wheel Coupling, Kingpin, Drawbar & Trailer Coupling',
    icon: '🔗',
    applicableFamilies: ['12-22 Wheeler Heavy Truck / Trailer', '24-40+ Wheeler Heavy Haulage']
  },
  {
    id: 'welding_chassis',
    nameHindi: 'वेल्डिंग, चेसिस, बॉडी व स्ट्रक्चरल फैब्रिकेशन',
    nameEnglish: 'Welding, Chassis, Body & Structural Fabrication',
    icon: '🔥',
    applicableFamilies: ['3-Wheeler', '4-Wheeler', '6-10 Wheeler Commercial', '12-22 Wheeler Heavy Truck / Trailer', '24-40+ Wheeler Heavy Haulage']
  },
  {
    id: 'fuel_injection_turbo',
    nameHindi: 'फ्यूल इंजेक्शन पंप, नोजल, टर्बो व DPF / SCR रिपेयर',
    nameEnglish: 'Fuel Injection, Pump, Injector, Turbo & Exhaust / DPF / SCR',
    icon: '⛽',
    applicableFamilies: ['4-Wheeler', '6-10 Wheeler Commercial', '12-22 Wheeler Heavy Truck / Trailer', '24-40+ Wheeler Heavy Haulage']
  },
  {
    id: 'cooling_radiator',
    nameHindi: 'कूलिंग सिस्टम, रेडिएटर, होज़ व वाटर पंप',
    nameEnglish: 'Cooling System, Radiator, Hose & Water Pump',
    icon: '💧',
    applicableFamilies: ['4-Wheeler', '6-10 Wheeler Commercial', '12-22 Wheeler Heavy Truck / Trailer', '24-40+ Wheeler Heavy Haulage']
  },
  {
    id: 'periodic_service',
    nameHindi: 'नियमित सर्विसिंग, इंजन ऑयल, फ़िल्टर व ग्रीसिंग',
    nameEnglish: 'Periodic Servicing, Oil, Filters & Greasing',
    icon: '🛢️',
    applicableFamilies: ['2-Wheeler', '3-Wheeler', '4-Wheeler', '6-10 Wheeler Commercial', '12-22 Wheeler Heavy Truck / Trailer', '24-40+ Wheeler Heavy Haulage']
  },
  {
    id: 'roadside_breakdown',
    nameHindi: 'इमरजेंसी ऑन-रोड ब्रेकडाउन सहायता (24x7 SOS)',
    nameEnglish: 'Emergency Roadside Breakdown Support',
    icon: '🚨',
    applicableFamilies: ['2-Wheeler', '3-Wheeler', '4-Wheeler', '6-10 Wheeler Commercial', '12-22 Wheeler Heavy Truck / Trailer', '24-40+ Wheeler Heavy Haulage']
  },
  {
    id: 'towing_recovery',
    nameHindi: 'टोइंग, रिकवरी व क्रेन समन्वय सेवा',
    nameEnglish: 'Recovery, Towing & Crane Coordination',
    icon: '🚜',
    applicableFamilies: ['4-Wheeler', '6-10 Wheeler Commercial', '12-22 Wheeler Heavy Truck / Trailer', '24-40+ Wheeler Heavy Haulage']
  },
  {
    id: 'heavy_multi_axle_odc',
    nameHindi: 'मल्टी-एक्सल व ODC ट्रेलर भारी मरम्मत विशेषज्ञ',
    nameEnglish: 'Heavy Multi-Axle & ODC Trailer Specialist',
    icon: '🎖️',
    applicableFamilies: ['12-22 Wheeler Heavy Truck / Trailer', '24-40+ Wheeler Heavy Haulage']
  }
];

// Alias matching specification
export const ALL_MECHANIC_WORK_SKILLS = MECHANIC_SKILLS_CONFIG;

export const MECHANIC_EQUIPMENT_TOOLS = [
  'OBD / ECM Scanner',
  'Pneumatic Air Compressor',
  'Heavy Hydraulic Jack (20T–100T)',
  'Mobile Service Van',
  'Crane / Heavy Towing Tie-Up',
  'Welding & Cutting Unit',
  'High-Pressure Greasing & Alignment',
  'EV Battery Diagnostic Kit'
];

// STRICT COMPATIBILITY MATCHING FUNCTION
export interface CompatibilityResult {
  isCompatible: boolean;
  matchType: 'EXACT_WHEEL_MATCH' | 'CATEGORY_MATCH' | 'FALLBACK_COMPATIBLE' | 'NOT_COMPATIBLE';
  reasons: string[];
}

export function matchMechanicCompatibility(
  mechanic: MechanicProfile,
  requestedFamily: VehicleFamilyGroup,
  requestedWheelCount: number | string,
  requestedSkill?: string,
  serviceModeRequired?: MechanicServiceMode
): CompatibilityResult {
  const reasons: string[] = [];

  // Check 1: Family Group compatibility (Never match 2W/4W mechanic to 12W/40+W)
  const supportsFamily = mechanic.supportedFamilyGroups.includes(requestedFamily);
  if (!supportsFamily) {
    return {
      isCompatible: false,
      matchType: 'NOT_COMPATIBLE',
      reasons: [`मैकेनिक ${requestedFamily} का काम नहीं करता`]
    };
  }

  // Check 2: Wheel Count compatibility
  const normalizedReqWheel = String(requestedWheelCount);
  const supportsExactWheel = mechanic.supportedWheelCounts.map(String).includes(normalizedReqWheel);

  // Check 3: Skill compatibility
  let skillMatch = true;
  if (requestedSkill && requestedSkill !== 'all') {
    skillMatch = mechanic.skills.includes(requestedSkill);
    if (!skillMatch) {
      reasons.push('मांगी गई विशेष रिपेयर स्किल उपलब्ध नहीं');
    }
  }

  // Check 4: Service Mode
  if (serviceModeRequired === 'On-Site Roadside Only') {
    if (mechanic.serviceMode === 'Workshop Only') {
      return {
        isCompatible: false,
        matchType: 'NOT_COMPATIBLE',
        reasons: ['मैकेनिक केवल वर्कशॉप में काम करता है, रोडसाइड ऑन-साइट नहीं आता']
      };
    }
  }

  if (supportsExactWheel && skillMatch) {
    return {
      isCompatible: true,
      matchType: 'EXACT_WHEEL_MATCH',
      reasons: ['सटीक चक्का संख्या और व्हीकल प्रकार से मेल खाता है']
    };
  }

  if (supportsFamily && skillMatch) {
    return {
      isCompatible: true,
      matchType: 'CATEGORY_MATCH',
      reasons: [`${requestedFamily} श्रेणी का विशेषज्ञ मैकेनिक`]
    };
  }

  return {
    isCompatible: supportsFamily,
    matchType: supportsFamily ? 'FALLBACK_COMPATIBLE' : 'NOT_COMPATIBLE',
    reasons
  };
}

// ZERO FAKE DATA: No fake mechanics, fake 5.0 ratings or fabricated badges
export const MOCK_MECHANICS: MechanicProfile[] = [];

// Real discoverable mechanics are queried dynamically from InsForge / local registration
export const INITIAL_MECHANICS: MechanicProfile[] = [];

export const MOCK_DRIVERS: DriverProfile[] = [];
