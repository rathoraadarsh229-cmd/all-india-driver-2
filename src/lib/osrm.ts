// ==============================================================================
// FREE OPENSTREETMAP OSRM ROUTING & DISTANCE SERVICE
// Calculates REAL road highway distance without paid API keys
// ==============================================================================

export interface RouteEstimate {
  distanceKm: number;
  durationHours: number;
  originName: string;
  destinationName: string;
}

// Coordinate database for major Indian freight & transport hubs
export const INDIAN_CITIES_COORDS: Record<string, [number, number]> = {
  'Delhi NCR': [28.6139, 77.2090],
  'Mumbai': [19.0760, 72.8777],
  'Balaghat': [21.8129, 80.1837],
  'Indore': [22.7196, 75.8577],
  'Bhopal': [23.2599, 77.4126],
  'Nagpur': [21.1458, 79.0882],
  'Jabalpur': [23.1815, 79.9864],
  'Raipur': [21.2514, 81.6296],
  'Pune': [18.5204, 73.8567],
  'Ahmedabad': [23.0225, 72.5714],
  'Surat': [21.1702, 72.8311],
  'Jaipur': [26.9124, 75.7873],
  'Bengaluru': [12.9716, 77.5946],
  'Hyderabad': [17.3850, 78.4867],
  'Chennai': [13.0827, 80.2707],
  'Kolkata': [22.5726, 88.3639],
  'Lucknow': [26.8467, 80.9462],
  'Kanpur': [26.4499, 80.3319],
  'Patna': [25.5941, 85.1376],
  'Ludhiana': [30.9010, 75.8573],
  'Chandigarh': [30.7333, 76.7794],
  'Gwalior': [26.2183, 78.1828],
  'Varanasi': [25.3176, 82.9739],
  'Guwahati': [26.1445, 91.7362]
};

// Calculate Haversine distance in KM as instant fallback
export function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // Indian highway tortuosity factor (~1.25x straight line)
  return Math.round(R * c * 1.25);
}

// Fetch real road distance from OpenStreetMap OSRM Free Public Server
export async function fetchOsrmDistance(
  origin: string, 
  destination: string
): Promise<RouteEstimate> {
  const origCoords = INDIAN_CITIES_COORDS[origin] || INDIAN_CITIES_COORDS['Balaghat'];
  const destCoords = INDIAN_CITIES_COORDS[destination] || INDIAN_CITIES_COORDS['Mumbai'];

  // [lon, lat] format for OSRM
  const url = `https://router.project-osrm.org/route/v1/driving/${origCoords[1]},${origCoords[0]};${destCoords[1]},${destCoords[0]}?overview=false`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = Math.round(route.distance / 1000);
        const durationHours = Math.round((route.duration / 3600) * 10) / 10;
        return {
          distanceKm,
          durationHours,
          originName: origin,
          destinationName: destination
        };
      }
    }
  } catch (err) {
    console.warn('OSRM network request timed out or blocked, using highway calibrated fallback.', err);
  }

  // Robust calibrated fallback
  const fallbackKm = calculateHaversineKm(
    origCoords[0], origCoords[1],
    destCoords[0], destCoords[1]
  );
  const fallbackHours = Math.round((fallbackKm / 45) * 10) / 10; // average 45 km/h commercial truck pace

  return {
    distanceKm: fallbackKm,
    durationHours: fallbackHours,
    originName: origin,
    destinationName: destination
  };
}

// Pure Driver Allowance & Daily Bata Calculation (No fuel/toll confusion)
export interface FareCalculationResult {
  distanceKm: number;
  durationDays: number;
  perKmRate: number;
  dailyBataRate: number;
  driverWageAmount: number; // दूरी भत्ता (Distance Allowance = distance × perKmRate)
  dailyBataAmount: number;  // दैनिक भोजन/बाटा (Daily Bata = days × dailyBataRate)
  platformFee: number;      // Always 0 (0% Commission)
  totalTripEstimate: number; // Driver Direct Payout = Wage + Bata
  estimatedFuelAmount?: number;
  estimatedTollAmount?: number;
}

export function computeTripFare(
  vehicleCategory: string,
  distanceKm: number,
  days: number,
  tripType: 'outstation' | 'local'
): FareCalculationResult {
  let perKmRate = 4.0;
  let dailyBata = 800;

  if (vehicleCategory.includes('2-Wheeler') || vehicleCategory.includes('2W')) {
    perKmRate = 1.5;
    dailyBata = 350;
  } else if (vehicleCategory.includes('3-Wheeler') || vehicleCategory.includes('3W') || vehicleCategory.includes('Auto')) {
    perKmRate = 2.0;
    dailyBata = 450;
  } else if (vehicleCategory.includes('4-Wheeler') || vehicleCategory.includes('Taxi') || vehicleCategory.includes('Pickup')) {
    perKmRate = 2.6;
    dailyBata = 550;
  } else if (vehicleCategory.includes('6-10 Wheeler') || vehicleCategory.includes('Medium') || vehicleCategory.includes('Eicher')) {
    perKmRate = 3.2;
    dailyBata = 650;
  } else if (vehicleCategory.includes('14-22') || vehicleCategory.includes('Heavy Trailer') || vehicleCategory.includes('18-Wheeler')) {
    perKmRate = 4.2;
    dailyBata = 850;
  } else if (vehicleCategory.includes('24-40') || vehicleCategory.includes('ODC') || vehicleCategory.includes('Heavy Haulage')) {
    perKmRate = 5.5;
    dailyBata = 1200;
  }

  const effectiveDistance = tripType === 'local' ? Math.max(distanceKm, 60) : distanceKm;
  const driverWage = Math.round(effectiveDistance * perKmRate);
  const totalBata = Math.round(days * dailyBata);
  const total = driverWage + totalBata;

  return {
    distanceKm: effectiveDistance,
    durationDays: days,
    perKmRate,
    dailyBataRate: dailyBata,
    driverWageAmount: driverWage,
    dailyBataAmount: totalBata,
    platformFee: 0, // Strictly ₹0 Commission
    totalTripEstimate: total
  };
}
