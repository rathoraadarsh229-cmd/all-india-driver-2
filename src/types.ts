export type AppScreen = 
  | 'splash' 
  | 'intro'
  | 'language' 
  | 'select-state'
  | 'login' 
  | 'role-selection'
  | 'owner-profile-setup'
  | 'driver-profile-setup'
  | 'mechanic-profile-setup'
  | 'driver-kyc'
  | 'driver-pending'
  | 'driver-dashboard'
  | 'owner-dashboard'
  | 'mechanic-dashboard'
  | 'driver-detail'
  | 'chat-room'
  | 'donate-money';

export interface DonationRecord {
  id: string;
  donorName: string;
  donorPhone?: string;
  donorRole?: 'driver' | 'owner' | 'mechanic' | 'supporter' | 'other';
  city?: string;
  state?: string;
  amount: number;
  paymentMode?: string;
  transactionRef?: string;
  message?: string;
  showPublicly: boolean;
  createdAt: string;
  verified?: boolean;
}

export type WheelCountOption = 2 | 3 | 4 | 6 | 8 | 10 | 12 | 14 | 16 | 18 | 20 | 22 | 24 | 26 | 28 | 30 | 32 | 34 | 36 | 38 | 40 | '40+';

export type UserAuthType = 'gmail' | 'guest' | 'phone';

export type VehicleFamilyGroup = 
  | '2-Wheeler'
  | '3-Wheeler'
  | '4-Wheeler'
  | '6-10 Wheeler Commercial'
  | '12-22 Wheeler Heavy Truck/Trailer'
  | '12-22 Wheeler Heavy Truck / Trailer'
  | '24-40+ Wheeler Heavy Haulage';

export type AxleCountOption = 
  | '1 Axle' 
  | '2 Axles' 
  | '3 Axles' 
  | '4 Axles' 
  | '5 Axles' 
  | '6 Axles' 
  | '7-8 Axles' 
  | '9-10 Axles' 
  | '10+ Modular Axles';

export type FuelPowerType = 'Petrol' | 'Diesel' | 'CNG' | 'LPG' | 'Electric / EV' | 'Hybrid';

export type TrailerConfig = 
  | 'Rigid / No Trailer' 
  | 'Semi-Trailer Attached' 
  | 'Full Trailer / Drawbar' 
  | 'Modular Hydraulic Trailer';

export type MechanicServiceMode = 'Workshop Only' | 'On-Site Roadside Only' | 'Both Workshop & Roadside';

export interface VehicleConfiguration {
  familyGroup: VehicleFamilyGroup;
  wheelCount: WheelCountOption;
  subtype: string;
  axleCount?: AxleCountOption;
  fuelType?: FuelPowerType;
  trailerConfig?: TrailerConfig;
}

export interface OwnerData {
  name: string;
  companyName: string;
  email?: string;
  phone?: string;
  fleetSize: string;
  city: string;
  state: string;
  tehsil?: string;
  village?: string;
  role: 'owner' | 'contractor';
  photoUrl?: string;
  verified?: boolean;
  fullName?: string;
  vehiclePhotos?: string[];
  vehicleType?: string;
  vehicleNumber?: string;
  vehicleFamilyGroup?: VehicleFamilyGroup;
  wheelCount?: WheelCountOption;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
}

export interface DriverProfile {
  id: string;
  name: string;
  maskedName: string;
  phone: string;
  maskedPhone: string;
  email?: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  hiringStatus?: 'Available' | 'Contacted' | 'Hired';
  experience: number;
  location: string;
  state?: string;
  district?: string;
  tehsil?: string;
  vehicleCategory: 'Car' | 'Commercial' | 'Heavy Trailer';
  vehicleType: string;
  vehicleFamilyGroup?: VehicleFamilyGroup;
  wheelCount?: WheelCountOption;
  rating: number;
  tripsCompleted: number;
  salaryExpectation: string;
  photoUrl: string;
  idType?: 'aadhaar' | 'pan';
  aadhaarNo?: string;
  aadhaarUrl?: string;
  panNo?: string;
  panUrl?: string;
  dlNumber: string;
  dlUrl?: string;
  documentsUploaded?: boolean;
  vehicleNo?: string;
  isVerified: boolean;
  status: 'Online' | 'On Route' | 'Available in 2 Days';
  verifiedBadge?: boolean;
  isExample?: boolean;
  authMethod?: 'gmail' | 'guest' | 'example';
  distance?: number;
  workMode?: string;
  timingSlots?: string[];
  lat?: number;
  lng?: number;
  activeJobDetails?: {
    from: string;
    to: string;
    startDate: string;
    cargo: string;
  };
}

export interface MechanicProfile {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  garageName: string;
  state?: string;
  district?: string;
  tehsil?: string;
  cityLandmark?: string;
  workshopAddress?: string;
  location: string;
  lat: number;
  lng: number;
  supportedFamilyGroups: VehicleFamilyGroup[];
  supportedWheelCounts: (number | string)[];
  supportedSubtypes?: string[];
  supportedFuelTypes?: FuelPowerType[];
  skills: string[];
  serviceMode: MechanicServiceMode;
  serviceRadiusKm: number;
  rating: number | null;
  verified: boolean;
  isOnline: boolean;
  emergency24x7: boolean;
  experienceYears?: number;
  languagesSpoken?: string[];
  equipmentTools?: string[];
  inspectionFee?: number | string;
  certifications?: string;
  workingHours?: string;
  distance?: number;
  photoUrl?: string;
  compatibility?: any;
}

export interface MechanicHelpRequest {
  id: string;
  requesterId: string;
  requesterRole: 'driver' | 'owner';
  requesterName: string;
  requesterPhone: string;
  vehicleFamily: VehicleFamilyGroup;
  wheelCount: number | string;
  issueDescription: string;
  location: string;
  lat: number;
  lng: number;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  timestamp: string;
  selectedSkills?: string[];
  fuelType?: FuelPowerType;
  axleCount?: AxleCountOption;
  trailerConfig?: TrailerConfig;
  serviceMode?: MechanicServiceMode;
}

export interface Message {
  id: string;
  text: string;
  time: string;
  isSender: boolean;
  type?: 'text' | 'audio' | 'system';
  audioDuration?: string;
  sender?: 'user' | 'driver' | 'system';
  isAudio?: boolean;
  isNegotiationCard?: boolean;
  offerAmount?: number;
  offerStatus?: 'pending' | 'accepted' | 'rejected';
}

export interface LanguageOption {
  code: string;
  label: string;
  nativeLabel: string;
}

export interface OwnerJob {
  id: string;
  ownerName: string;
  companyName: string;
  vehicle: string;
  budget: string;
  phone: string;
  location: string;
  duty: string;
  vehiclePhotos?: string[];
}

export interface ConvoyTrip {
  id: string;
  creatorName: string;
  creatorPhone?: string;
  creatorCity: string;
  fromLocation: string;
  toLocation: string;
  startDate: string;
  startTime: string;
  startAddress?: string;
  vehicleCategory?: string;
  vehicleNumber?: string;
  joinedDriversCount: number;
  maxDrivers?: number;
  status: 'upcoming' | 'started' | 'completed';
  createdAt: string;
  joinedDriverNames?: string[];
  notes?: string;
}
