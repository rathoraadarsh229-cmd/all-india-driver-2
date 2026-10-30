import { insforge, isInsForgeConfigured } from '../insforge';
import type { DriverProfile, DonationRecord } from '../types';

/**
 * InsForge Backend Database Service (insforge.dev)
 * Handles Cloud Database CRUD operations for Drivers, Jobs, and Chats
 * using official @insforge/sdk PostgREST integration with safe local fallback.
 */

export interface InsForgeDriverRecord {
  id?: string;
  name: string;
  phone?: string;
  email?: string;
  experience?: number;
  location?: string;
  vehicle_category?: string;
  vehicle_type?: string;
  verified?: boolean;
  rating?: number;
  photo_url?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface InsForgeJobRecord {
  id?: string;
  owner_id?: string;
  owner_name?: string;
  owner_phone?: string;
  vehicle_type?: string;
  route_from?: string;
  route_to?: string;
  salary?: string;
  description?: string;
  created_at?: string;
}

export interface InsForgeMessageRecord {
  id?: string;
  chat_id: string;
  sender_id?: string;
  sender_role: 'driver' | 'owner';
  text: string;
  timestamp?: string;
}

// Local cache keys for offline / optimistic resilience
const STORAGE_DRIVERS_KEY = 'insforge_real_drivers_v2';
const STORAGE_JOBS_KEY = 'insforge_real_jobs_v2';
const STORAGE_MESSAGES_KEY = 'insforge_real_messages_v2';
const STORAGE_MECHANICS_KEY = 'insforge_real_mechanics_v2';

// In-Memory Short-Lived Caches to prevent startup/query storming
let cachedDriversMemory: DriverProfile[] | null = null;
let lastDriversFetchTime = 0;
const DRIVERS_CACHE_TTL = 45000; // 45 seconds

let cachedMechanicsMemory: any[] | null = null;
let lastMechanicsFetchTime = 0;
const MECHANICS_CACHE_TTL = 30000; // 30 seconds

/**
 * Check if InsForge backend is active and configured
 */
export function getInsForgeStatus() {
  return {
    isConfigured: isInsForgeConfigured,
    url: import.meta.env.VITE_INSFORGE_URL || 'Not set',
    hasAnonKey: Boolean(import.meta.env.VITE_INSFORGE_ANON_KEY),
  };
}

/**
 * Save Driver Profile to InsForge (insforge.dev database)
 */
export async function saveDriverToInsForge(driver: any): Promise<boolean> {
  const record: InsForgeDriverRecord = {
    name: driver.name || 'Driver',
    phone: driver.phone || driver.mobile || '',
    email: driver.email || '',
    experience: Number(driver.experience) || 0,
    location: driver.location || driver.homeLocation || '',
    vehicle_category: driver.vehicleCategory || '',
    vehicle_type: driver.vehicleType || '',
    verified: false,
    rating: Number(driver.rating) || 0,
    photo_url: driver.photoUrl || '',
    metadata: {
      preferredRoutes: driver.preferredRoutes || [],
      updatedAt: new Date().toISOString(),
    },
    created_at: new Date().toISOString(),
  };

  // Always update local cache immediately (optimistic UI)
  try {
    const existingRaw = localStorage.getItem(STORAGE_DRIVERS_KEY);
    const existing: any[] = existingRaw ? JSON.parse(existingRaw) : [];
    existing.unshift(record);
    localStorage.setItem(STORAGE_DRIVERS_KEY, JSON.stringify(existing.slice(0, 50)));
  } catch (e) {
    // Ignore storage quota errors
  }

  if (!isInsForgeConfigured) {
    console.info('InsForge URL not configured; saved driver to local storage fallback.');
    return true;
  }

  try {
    const { error } = await insforge.database
      .from('drivers')
      .insert([record]);

    if (error) {
      console.warn('InsForge database save error (fallback to local storage):', error.message);
      return false;
    }
    console.info('✅ Driver successfully saved to InsForge backend (insforge.dev)');
    return true;
  } catch (err) {
    console.warn('InsForge database request error:', err);
    return false;
  }
}

/**
 * Fetch Driver Profiles from InsForge backend with 45s in-memory cache
 */
export async function fetchDriversFromInsForge(forceRefresh = false): Promise<any[]> {
  const now = Date.now();
  if (!forceRefresh && cachedDriversMemory && (now - lastDriversFetchTime < DRIVERS_CACHE_TTL)) {
    return cachedDriversMemory;
  }

  if (!isInsForgeConfigured) {
    try {
      const cached = localStorage.getItem(STORAGE_DRIVERS_KEY);
      const res = cached ? JSON.parse(cached) : [];
      cachedDriversMemory = res;
      lastDriversFetchTime = now;
      return res;
    } catch {
      return [];
    }
  }

  try {
    const { data, error } = await insforge.database
      .from('drivers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error || !data) {
      console.warn('Could not fetch from InsForge backend, reading cache:', error?.message);
      const cached = localStorage.getItem(STORAGE_DRIVERS_KEY);
      const res = cached ? JSON.parse(cached) : [];
      cachedDriversMemory = res;
      lastDriversFetchTime = now;
      return res;
    }

    cachedDriversMemory = data;
    lastDriversFetchTime = now;
    return data;
  } catch (err) {
    console.warn('InsForge fetch exception:', err);
    return cachedDriversMemory || [];
  }
}

/**
 * Invalidate in-memory caches
 */
export function invalidateInsForgeCaches() {
  cachedDriversMemory = null;
  lastDriversFetchTime = 0;
  cachedMechanicsMemory = null;
  lastMechanicsFetchTime = 0;
}

/**
 * Fetch Discoverable Mechanics from InsForge backend with 30s in-memory cache
 * Automatically merges locally saved mechanics for guest/offline discovery
 */
export async function fetchDiscoverableMechanics(forceRefresh = false): Promise<any[]> {
  const now = Date.now();
  if (!forceRefresh && cachedMechanicsMemory && (now - lastMechanicsFetchTime < MECHANICS_CACHE_TTL)) {
    return cachedMechanicsMemory;
  }

  // Get local registration records
  let localList: any[] = [];
  try {
    const cached = localStorage.getItem(STORAGE_MECHANICS_KEY);
    localList = cached ? JSON.parse(cached) : [];
  } catch {
    localList = [];
  }

  if (!isInsForgeConfigured) {
    cachedMechanicsMemory = localList;
    lastMechanicsFetchTime = now;
    return localList;
  }

  try {
    // Try view first, fall back to table
    let remoteList: any[] = [];
    const { data: viewData, error: viewError } = await insforge.database
      .from('discoverable_mechanics')
      .select('*')
      .limit(50);

    if (!viewError && viewData) {
      remoteList = viewData;
    } else {
      const { data: tableData, error: tableError } = await insforge.database
        .from('mechanics')
        .select('*')
        .eq('is_online', true)
        .limit(50);
      if (!tableError && tableData) {
        remoteList = tableData;
      }
    }

    // Map remote fields to standard MechanicProfile shape
    const mappedRemote = remoteList.map((m: any) => ({
      id: m.id,
      name: m.name,
      phone: m.phone || m.masked_phone || '',
      garageName: m.garage_name || m.garageName || '',
      workshopAddress: m.workshop_address || m.workshopAddress || '',
      location: m.location || '',
      lat: Number(m.lat) || 21.8124,
      lng: Number(m.lng) || 80.1838,
      supportedFamilyGroups: m.supported_family_groups || m.supported_categories || m.supportedFamilyGroups || [],
      supportedWheelCounts: m.supported_wheel_counts || m.supportedWheelCounts || [],
      supportedSubtypes: m.supported_subtypes || m.supportedSubtypes || [],
      supportedFuelTypes: m.supported_fuel_types || m.supportedFuelTypes || [],
      skills: m.skills || [],
      serviceMode: m.service_mode || m.serviceMode || 'Both Workshop & Roadside',
      serviceRadiusKm: Number(m.service_radius_km || m.serviceRadiusKm) || 30,
      equipmentTools: m.equipment_tools || m.equipmentTools || [],
      languagesSpoken: m.languages_spoken || m.languagesSpoken || [],
      inspectionFee: m.inspection_fee || m.inspectionFee || '',
      certifications: m.certifications || '',
      rating: m.rating !== null && m.rating !== undefined ? Number(m.rating) : null,
      verified: Boolean(m.verified),
      isOnline: Boolean(m.is_online !== undefined ? m.is_online : true),
      emergency24x7: Boolean(m.emergency_24x7 !== undefined ? m.emergency_24x7 : true),
      photoUrl: m.photo_url || m.photoUrl || ''
    }));

    // Merge local entries that might not be in remote yet (avoid duplicates)
    const combined = [...localList];
    for (const r of mappedRemote) {
      if (!combined.some(c => c.id === r.id || (c.phone && c.phone === r.phone))) {
        combined.push(r);
      }
    }

    cachedMechanicsMemory = combined;
    lastMechanicsFetchTime = now;
    return combined;
  } catch (err) {
    console.warn('InsForge fetch mechanics exception:', err);
    cachedMechanicsMemory = localList;
    lastMechanicsFetchTime = now;
    return localList;
  }
}

/**
 * Fetch Mechanics from InsForge backend (alias for fetchDiscoverableMechanics)
 */
export async function fetchMechanicsFromInsForge(forceRefresh = false): Promise<any[]> {
  return fetchDiscoverableMechanics(forceRefresh);
}

/**
 * Fetch current user's mechanic profile
 */
export async function fetchMechanicProfileForUser(userId?: string): Promise<any | null> {
  const mechanics = await fetchDiscoverableMechanics();
  if (userId) {
    return mechanics.find((m: any) => m.userId === userId || m.user_id === userId) || null;
  }
  return mechanics[0] || null;
}

/**
 * Save Mechanic Profile to InsForge (with automatic fallback to base schema if migration pending)
 */
export async function saveMechanicProfileToInsForge(mechanic: any): Promise<boolean> {
  const now = new Date().toISOString();
  const mechId = mechanic.id || `mech-${Date.now()}`;

  const fullRecord = {
    name: mechanic.name || 'Master Mechanic',
    phone: mechanic.phone || '',
    garage_name: mechanic.garageName || 'Highway Garage',
    location: mechanic.location || mechanic.district || 'Balaghat, MP',
    workshop_address: mechanic.workshopAddress || mechanic.address || '',
    lat: Number(mechanic.lat) || 21.8124,
    lng: Number(mechanic.lng) || 80.1838,
    supported_family_groups: mechanic.supportedFamilyGroups || mechanic.supportedCategories || [],
    supported_wheel_counts: mechanic.supportedWheelCounts || [],
    skills: mechanic.skills || [],
    service_mode: mechanic.serviceMode || 'Both Workshop & Roadside',
    service_radius_km: Number(mechanic.serviceRadiusKm) || 30,
    rating: mechanic.rating !== undefined && mechanic.rating !== null ? Number(mechanic.rating) : null,
    verified: Boolean(mechanic.verified),
    is_online: Boolean(mechanic.isOnline !== undefined ? mechanic.isOnline : true),
    emergency_24x7: Boolean(mechanic.emergency24x7 !== undefined ? mechanic.emergency24x7 : true),
  };

  // Always update local cache immediately (optimistic UI)
  try {
    const cachedRaw = localStorage.getItem(STORAGE_MECHANICS_KEY);
    const list: any[] = cachedRaw ? JSON.parse(cachedRaw) : [];
    const normalizedLocal = {
      ...mechanic,
      id: mechId,
      rating: mechanic.rating !== undefined && mechanic.rating !== null ? Number(mechanic.rating) : null,
      verified: Boolean(mechanic.verified)
    };
    list.unshift(normalizedLocal);
    localStorage.setItem(STORAGE_MECHANICS_KEY, JSON.stringify(list.slice(0, 50)));
    // Invalidate in-memory cache
    invalidateInsForgeCaches();
  } catch (e) {
    // Ignore storage quota
  }

  if (!isInsForgeConfigured) {
    return true;
  }

  try {
    // Attempt insert with extended fields
    const { error } = await insforge.database
      .from('mechanics')
      .insert([fullRecord]);

    if (!error) {
      console.info('✅ Mechanic profile saved to InsForge');
      invalidateInsForgeCaches();
      return true;
    }

    console.warn('InsForge mechanic insert error, trying base columns fallback:', error.message);

    // Automatic Fallback: Try with base columns if table has not been upgraded
    const baseRecord = {
      name: fullRecord.name,
      phone: fullRecord.phone,
      garage_name: fullRecord.garage_name,
      location: fullRecord.location,
      lat: fullRecord.lat,
      lng: fullRecord.lng,
      supported_family_groups: fullRecord.supported_family_groups,
      supported_wheel_counts: fullRecord.supported_wheel_counts,
      skills: fullRecord.skills,
      service_mode: fullRecord.service_mode,
      service_radius_km: fullRecord.service_radius_km,
      verified: false,
      is_online: true,
      emergency_24x7: true
    };

    const { error: fallbackError } = await insforge.database
      .from('mechanics')
      .insert([baseRecord]);

    if (!fallbackError) {
      console.info('✅ Mechanic profile saved to InsForge (base fallback)');
      invalidateInsForgeCaches();
      return true;
    }

    return true; // Still true locally
  } catch (err) {
    console.warn('InsForge save mechanic exception (stored locally):', err);
    return true;
  }
}

/**
 * Alias for saveMechanicProfileToInsForge
 */
export async function saveMechanicToInsForge(mechanic: any): Promise<boolean> {
  return saveMechanicProfileToInsForge(mechanic);
}

/**
 * Create a Mechanic SOS Breakdown Help Request
 */
export async function createMechanicSosRequest(req: any): Promise<boolean> {
  const sosRecord = {
    requester_name: req.requesterName || 'Driver',
    requester_phone: req.requesterPhone || '',
    requester_role: req.requesterRole || 'driver',
    vehicle_family: req.vehicleFamily || '12-22 Wheeler Heavy Truck / Trailer',
    wheel_count: String(req.wheelCount || '12'),
    issue_description: req.issueDescription || 'Highway Breakdown SOS',
    location: req.location || 'Highway',
    lat: Number(req.lat) || 21.8124,
    lng: Number(req.lng) || 80.1838,
    status: 'pending'
  };

  if (!isInsForgeConfigured) {
    return true;
  }

  try {
    const { error } = await insforge.database
      .from('mechanic_requests')
      .insert([sosRecord]);

    if (error) {
      console.warn('InsForge mechanic_requests insert note:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('InsForge mechanic SOS request exception:', err);
    return false;
  }
}

/**
 * Fetch Jobs from InsForge backend
 */
export async function fetchJobsFromInsForge(): Promise<any[]> {
  if (!isInsForgeConfigured) {
    try {
      const cached = localStorage.getItem(STORAGE_JOBS_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }

  try {
    const { data, error } = await insforge.database
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error || !data) {
      const cached = localStorage.getItem(STORAGE_JOBS_KEY);
      return cached ? JSON.parse(cached) : [];
    }

    return data;
  } catch (err) {
    console.warn('InsForge fetch jobs exception:', err);
    return [];
  }
}

/**
 * Save Owner Job Listing to InsForge backend
 */
export async function saveJobToInsForge(job: any): Promise<boolean> {
  const record: InsForgeJobRecord = {
    owner_name: job.ownerName || job.company || 'Transporter',
    owner_phone: job.phone || job.contact || '',
    vehicle_type: job.vehicleType || job.requiredVehicle || '',
    route_from: job.from || job.origin || '',
    route_to: job.to || job.destination || '',
    salary: job.salary ? String(job.salary) : '',
    description: job.description || job.notes || '',
    created_at: new Date().toISOString(),
  };

  try {
    const existingRaw = localStorage.getItem(STORAGE_JOBS_KEY);
    const existing: any[] = existingRaw ? JSON.parse(existingRaw) : [];
    existing.unshift(record);
    localStorage.setItem(STORAGE_JOBS_KEY, JSON.stringify(existing.slice(0, 50)));
  } catch (e) {
    // Ignore storage errors
  }

  if (!isInsForgeConfigured) {
    return true;
  }

  try {
    const { error } = await insforge.database
      .from('jobs')
      .insert([record]);

    if (error) {
      console.warn('InsForge job insert error:', error.message);
      return false;
    }
    console.info('✅ Job saved to InsForge backend (insforge.dev)');
    return true;
  } catch (err) {
    console.warn('InsForge job error:', err);
    return false;
  }
}

/**
 * Save Chat Message to InsForge backend
 */
export async function saveChatMessageToInsForge(chatId: string, senderRole: 'driver' | 'owner', text: string): Promise<boolean> {
  const messageRecord: InsForgeMessageRecord = {
    chat_id: chatId,
    sender_role: senderRole,
    text,
    timestamp: new Date().toISOString(),
  };

  try {
    const key = `${STORAGE_MESSAGES_KEY}_${chatId}`;
    const cachedRaw = localStorage.getItem(key);
    const cached: any[] = cachedRaw ? JSON.parse(cachedRaw) : [];
    cached.push(messageRecord);
    localStorage.setItem(key, JSON.stringify(cached));
  } catch (e) {
    // Ignore
  }

  if (!isInsForgeConfigured) {
    return true;
  }

  try {
    const { error } = await insforge.database
      .from('messages')
      .insert([messageRecord]);

    if (error) {
      console.warn('InsForge message insert error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('InsForge message error:', err);
    return false;
  }
}

/**
 * Save Document Verification record to InsForge document_verifications table
 */
export async function saveDocumentVerificationRecord(verification: {
  userId?: string;
  documentType: string;
  extractedDocumentNumber?: string;
  extractedName?: string;
  extractedDob?: string;
  extractedState?: string;
  validationStatus: string;
  verificationStatus: string;
  verificationMethod: string;
  confidenceScore: number;
  rejectionReason?: string;
}): Promise<boolean> {
  const record = {
    user_id: verification.userId || 'anonymous_user',
    document_type: verification.documentType,
    extracted_document_number: verification.extractedDocumentNumber || '',
    extracted_name: verification.extractedName || '',
    extracted_dob: verification.extractedDob || '',
    extracted_state: verification.extractedState || '',
    validation_status: verification.validationStatus,
    verification_status: verification.verificationStatus,
    verification_method: verification.verificationMethod,
    confidence_score: verification.confidenceScore,
    rejection_reason: verification.rejectionReason || null,
    created_at: new Date().toISOString()
  };

  if (!isInsForgeConfigured) {
    return true;
  }

  try {
    const { error } = await insforge.database
      .from('document_verifications')
      .insert([record]);

    if (error) {
      console.warn('InsForge document_verifications insert notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('InsForge document verification save issue:', err);
    return false;
  }
}

/**
 * Save Vehicle Owner Profile to InsForge Backend
 */
export async function saveOwnerProfileToInsForge(owner: any): Promise<boolean> {
  const record = {
    name: owner.name || 'Vehicle Owner',
    phone: owner.phone || '',
    email: owner.email || '',
    company_name: owner.companyName || '',
    fleet_size: owner.fleetSize || '1-2 Vehicles',
    city: owner.city || 'Balaghat',
    state: owner.state || 'Madhya Pradesh',
    vehicle_type: owner.vehicleType || 'Commercial',
    verified: Boolean(owner.verified),
    auth_type: owner.email?.includes('guest') ? 'guest' : 'gmail',
    created_at: new Date().toISOString()
  };

  try {
    const raw = localStorage.getItem('aid_saved_owner_profile');
    localStorage.setItem('aid_saved_owner_profile', JSON.stringify({ ...owner, ...record }));
  } catch {}

  if (!isInsForgeConfigured) return true;

  try {
    // Attempt saving to owners table
    const { error } = await insforge.database
      .from('owners')
      .insert([record]);

    if (!error) {
      console.info('✅ Owner profile saved to InsForge database');
      return true;
    }
  } catch (err) {
    // Graceful fallback
  }
  return true;
}

/**
 * Record User Login / Guest Session in Database
 * Ensures guest users who access or use the app are preserved and visible
 */
export async function recordUserSessionToInsForge(sessionData: {
  email: string;
  authType: 'gmail' | 'guest' | 'phone';
  role?: string;
  name?: string;
  phone?: string;
}): Promise<boolean> {
  const sessionRecord = {
    email: sessionData.email,
    auth_type: sessionData.authType,
    role: sessionData.role || 'pending',
    display_name: sessionData.name || (sessionData.authType === 'phone' ? 'Phone User' : sessionData.authType === 'guest' ? 'गेस्ट यूज़र' : 'Google User'),
    phone: sessionData.phone || '',
    last_active: new Date().toISOString(),
    created_at: new Date().toISOString()
  };

  try {
    const rawSessions = localStorage.getItem('aid_user_sessions');
    const sessions = rawSessions ? JSON.parse(rawSessions) : [];
    sessions.unshift(sessionRecord);
    localStorage.setItem('aid_user_sessions', JSON.stringify(sessions.slice(0, 50)));
  } catch {}

  if (!isInsForgeConfigured) return true;

  try {
    await insforge.database
      .from('user_sessions')
      .insert([sessionRecord]);
  } catch {
    // Graceful fallback
  }

  return true;
}

/**
 * Fetch All Donated Persons / Donors
 */
export async function fetchDonationsFromInsForge(): Promise<DonationRecord[]> {
  try {
    const raw = localStorage.getItem('aid_donations_list');
    const localDonations: DonationRecord[] = raw ? JSON.parse(raw) : [];

    if (!isInsForgeConfigured) {
      return localDonations;
    }

    try {
      const { data, error } = await insforge.database
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped: DonationRecord[] = data.map((d: any) => ({
          id: d.id || `don-${Date.now()}`,
          donorName: d.donor_name || d.name || 'शुभचिंतक',
          donorPhone: d.donor_phone || d.phone || '',
          donorRole: d.donor_role || d.role || 'supporter',
          city: d.city || '',
          state: d.state || '',
          amount: Number(d.amount) || 0,
          paymentMode: d.payment_mode || 'UPI',
          transactionRef: d.transaction_ref || '',
          message: d.message || '',
          showPublicly: d.show_publicly !== false,
          createdAt: d.created_at || new Date().toISOString(),
          verified: Boolean(d.verified !== false)
        }));

        // Merge with local records
        const combined = [...mapped];
        localDonations.forEach(loc => {
          if (!combined.some(c => c.id === loc.id || (c.transactionRef && c.transactionRef === loc.transactionRef))) {
            combined.push(loc);
          }
        });
        return combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    } catch (e) {
      console.warn('InsForge donations fetch note:', e);
    }
    return localDonations;
  } catch (err) {
    console.error('Donations load error:', err);
    return [];
  }
}

/**
 * Save Donation to InsForge & Local Storage
 */
export async function saveDonationToInsForge(donation: DonationRecord): Promise<boolean> {
  // 1. Always save locally first for fast response & offline persistence
  try {
    const raw = localStorage.getItem('aid_donations_list');
    const existing: DonationRecord[] = raw ? JSON.parse(raw) : [];
    const updated = [donation, ...existing.filter(d => d.id !== donation.id)];
    localStorage.setItem('aid_donations_list', JSON.stringify(updated.slice(0, 100)));
  } catch (e) {
    console.warn('Local donation store note:', e);
  }

  if (!isInsForgeConfigured) return true;

  // 2. Insert into InsForge backend
  try {
    const dbRecord = {
      donor_name: donation.donorName,
      donor_phone: donation.donorPhone || '',
      donor_role: donation.donorRole || 'supporter',
      city: donation.city || '',
      state: donation.state || '',
      amount: donation.amount,
      payment_mode: donation.paymentMode || 'UPI',
      transaction_ref: donation.transactionRef || '',
      message: donation.message || '',
      show_publicly: donation.showPublicly,
      verified: true,
      created_at: donation.createdAt || new Date().toISOString()
    };

    const { error } = await insforge.database
      .from('donations')
      .insert([dbRecord]);

    if (error) {
      console.warn('InsForge donation insert notice:', error.message);
    }
  } catch (err) {
    console.warn('InsForge donation insert network exception:', err);
  }

  return true;
}


