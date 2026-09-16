// Automated Farm-to-Doorstep road distance calculation utility

export interface LatLng {
  lat: number;
  lng: number;
}

// Known coordinates for agricultural hubs and urban consumer centers
export const LOCATION_COORDINATES: Record<string, LatLng> = {
  // Agricultural Origin Hubs
  'lasalgaon': { lat: 20.1479, lng: 74.2257 },
  'nashik': { lat: 19.9975, lng: 73.7898 },
  'khed': { lat: 18.8519, lng: 73.9167 },
  'rajgurunagar': { lat: 18.8519, lng: 73.9167 },
  'baramati': { lat: 18.1517, lng: 74.5772 },
  'shirur': { lat: 18.8267, lng: 74.3789 },
  'junnar': { lat: 19.2081, lng: 73.8767 },
  'narayangaon': { lat: 19.1245, lng: 73.9782 },
  'manchar': { lat: 19.0069, lng: 73.9439 },
  'satara': { lat: 17.6805, lng: 74.0183 },
  'solapur': { lat: 17.6599, lng: 75.9064 },
  'nagpur': { lat: 21.1458, lng: 79.0882 },
  'ahmednagar': { lat: 19.0948, lng: 74.7480 },
  'sangli': { lat: 16.8524, lng: 74.5815 },
  'kolhapur': { lat: 16.7050, lng: 74.2433 },
  'aurangabad': { lat: 19.8762, lng: 75.3433 },
  'chhatrapati sambhajinagar': { lat: 19.8762, lng: 75.3433 },
  'mahabaleshwar': { lat: 17.9237, lng: 73.6586 },

  // Pune Metropolitan City & Suburbs
  'pune': { lat: 18.5204, lng: 73.8567 },
  'kalyani nagar': { lat: 18.5482, lng: 73.9032 },
  'viman nagar': { lat: 18.5679, lng: 73.9143 },
  'baner': { lat: 18.5590, lng: 73.7868 },
  'kothrud': { lat: 18.5074, lng: 73.8077 },
  'hadapsar': { lat: 18.5089, lng: 73.9259 },
  'aundh': { lat: 18.5602, lng: 73.8077 },
  'hinjawadi': { lat: 18.5913, lng: 73.7389 },
  'wakad': { lat: 18.5987, lng: 73.7660 },
  'pimpri': { lat: 18.6279, lng: 73.8009 },
  'chinchwad': { lat: 18.6387, lng: 73.7915 },
  'shivajinagar': { lat: 18.5314, lng: 73.8446 },
  'koregaon park': { lat: 18.5362, lng: 73.8940 },
  'kharadi': { lat: 18.5514, lng: 73.9348 },
  'magarpatta': { lat: 18.5146, lng: 73.9298 },
  'katraj': { lat: 18.4575, lng: 73.8677 },
  'bhosari': { lat: 18.6258, lng: 73.8488 },
  'chakan': { lat: 18.7606, lng: 73.8553 },
  'wagholi': { lat: 18.5793, lng: 73.9806 },
  'dhanori': { lat: 18.5833, lng: 73.8833 },
  'kondhwa': { lat: 18.4687, lng: 73.8942 },
  'karve nagar': { lat: 18.4900, lng: 73.8180 },

  // Mumbai Metropolitan Region (MMR)
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'navi mumbai': { lat: 19.0330, lng: 73.0297 },
  'vashi': { lat: 19.0771, lng: 72.9986 },
  'thane': { lat: 19.2183, lng: 72.9781 },
  'andheri': { lat: 19.1136, lng: 72.8697 },
  'bandra': { lat: 19.0596, lng: 72.8295 },
  'dadar': { lat: 19.0178, lng: 72.8478 },
  'borivali': { lat: 19.2307, lng: 72.8567 },
  'ghatkopar': { lat: 19.0860, lng: 72.9090 },
  'powai': { lat: 19.1176, lng: 72.9060 },
  'kurla': { lat: 19.0726, lng: 72.8845 },
  'chembur': { lat: 19.0522, lng: 72.8994 },
  'malad': { lat: 19.1874, lng: 72.8484 },
  'kandivali': { lat: 19.2045, lng: 72.8522 },
  'kalyan': { lat: 19.2403, lng: 73.1305 },
  'dombivli': { lat: 19.2184, lng: 73.0867 },
  'panvel': { lat: 18.9894, lng: 73.1175 },

  // Andhra Pradesh & Telangana Hubs
  'singarayakonda': { lat: 15.2476, lng: 80.0270 },
  'ongole': { lat: 15.5057, lng: 80.0499 },
  'prakasam': { lat: 15.5057, lng: 80.0499 },
  'chimakurthy': { lat: 15.5861, lng: 79.8694 },
  'kandukur': { lat: 15.2165, lng: 79.9042 },
  'guntur': { lat: 16.3067, lng: 80.4365 },
  'vijayawada': { lat: 16.5062, lng: 80.6480 },
  'visakhapatnam': { lat: 17.6868, lng: 83.2185 },
  'vizag': { lat: 17.6868, lng: 83.2185 },
  'tirupati': { lat: 13.6288, lng: 79.4192 },
  'kurnool': { lat: 15.8281, lng: 78.0373 },
  'nellore': { lat: 14.4426, lng: 79.9865 },
  'rajahmundry': { lat: 17.0005, lng: 81.8040 },
  'kakinada': { lat: 16.9891, lng: 82.2475 },
  'anantapur': { lat: 14.6819, lng: 77.6006 },
  'kadapa': { lat: 14.4673, lng: 78.8242 },
  'eluru': { lat: 16.7107, lng: 81.0952 },
  'hyderabad': { lat: 17.3850, lng: 78.4867 },
  'secunderabad': { lat: 17.4399, lng: 78.4983 },
  'warangal': { lat: 17.9689, lng: 79.5941 },
  'khammam': { lat: 17.2473, lng: 80.1514 },
  'karimnagar': { lat: 18.4386, lng: 79.1288 },
  'nizamabad': { lat: 18.6725, lng: 78.0941 },

  // Major Indian Metros & Agricultural Hubs
  'bengaluru': { lat: 12.9716, lng: 77.5946 },
  'bangalore': { lat: 12.9716, lng: 77.5946 },
  'chennai': { lat: 13.0827, lng: 80.2707 },
  'delhi': { lat: 28.6139, lng: 77.2090 },
  'new delhi': { lat: 28.6139, lng: 77.2090 },
  'ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'surat': { lat: 21.1702, lng: 72.8311 },
  'jaipur': { lat: 26.9124, lng: 75.7873 },
  'indore': { lat: 22.7196, lng: 75.8577 },
  'bhopal': { lat: 23.2599, lng: 77.4126 },
  'lucknow': { lat: 26.8467, lng: 80.9462 },
  'kolkata': { lat: 22.5726, lng: 88.3639 },
  'coimbatore': { lat: 11.0168, lng: 76.9558 },
  'mysore': { lat: 12.2958, lng: 76.6394 },
  'hubli': { lat: 15.3647, lng: 75.1240 },

  // Nashik Metropolitan
  'panchavati': { lat: 20.0102, lng: 73.7997 },
  'cidco': { lat: 19.9678, lng: 73.7656 },
  'gangapur': { lat: 20.0210, lng: 73.7431 },
  'indira nagar': { lat: 19.9621, lng: 73.7812 },
  'college road': { lat: 20.0054, lng: 73.7619 },
  'nashik road': { lat: 19.9547, lng: 73.8398 }
};

/**
 * Calculates straight line great-circle distance between two coords in km
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Checks whether two locations refer to the same city, town, or locality
 */
export function isSameLocalityOrCity(origin: string, dest: string): boolean {
  if (!origin || !dest) return false;
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  const o = clean(origin);
  const d = clean(dest);
  if (!o || !d) return false;
  if (o === d) return true;

  // Words that shouldn't trigger a match by themselves
  const stopWords = new Set([
    'farm', 'farms', 'orchard', 'orchards', 'road', 'near', 'nagar', 'colony', 
    'street', 'flat', 'house', 'plot', 'dist', 'district', 'state', 'india', 
    'customer', 'cluster', 'doorstep', 'direct', 'apmc', 'market', 'lane', 
    'opp', 'behind', 'beside', 'circle', 'chowk', 'area', 'town', 'village',
    'b2b', 'wholesale', 'terminal', 'gate', 'depot', 'hub'
  ]);

  const oWords = o.split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
  const dWords = d.split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));

  // If both share a distinctive town/city name (e.g., "ongole", "kothrud", "guntur")
  for (const w of oWords) {
    if (dWords.includes(w)) return true;
  }

  // Check if any registered location key exists in both strings
  for (const locKey of Object.keys(LOCATION_COORDINATES)) {
    if (locKey.length >= 4 && o.includes(locKey) && d.includes(locKey)) {
      return true;
    }
  }

  return false;
}

/**
 * Finds matching coordinates from a free-text location or address string
 */
export function extractCoordsFromText(text: string): LatLng | null {
  if (!text) return null;
  const lower = text.toLowerCase().trim();

  // Check direct matches in our geo dictionary
  for (const [key, coords] of Object.entries(LOCATION_COORDINATES)) {
    if (lower.includes(key)) {
      return coords;
    }
  }

  // Pincode checks
  // Andhra Pradesh & Telangana
  if (/523\d{3}/.test(lower)) {
    // Prakasam / Ongole
    return LOCATION_COORDINATES['ongole'];
  }
  if (/520\d{3}/.test(lower)) {
    // Vijayawada
    return LOCATION_COORDINATES['vijayawada'];
  }
  if (/522\d{3}/.test(lower)) {
    // Guntur
    return LOCATION_COORDINATES['guntur'];
  }
  if (/500\d{3}/.test(lower)) {
    // Hyderabad
    return LOCATION_COORDINATES['hyderabad'];
  }
  if (/530\d{3}/.test(lower)) {
    // Visakhapatnam
    return LOCATION_COORDINATES['visakhapatnam'];
  }
  if (/517\d{3}/.test(lower)) {
    // Tirupati
    return LOCATION_COORDINATES['tirupati'];
  }
  if (/560\d{3}/.test(lower)) {
    // Bengaluru
    return LOCATION_COORDINATES['bengaluru'];
  }
  if (/600\d{3}/.test(lower)) {
    // Chennai
    return LOCATION_COORDINATES['chennai'];
  }
  if (/110\d{3}/.test(lower)) {
    // Delhi
    return LOCATION_COORDINATES['delhi'];
  }
  // Maharashtra clusters
  if (/411\d{3}/.test(lower)) {
    // Pune Urban Pincodes
    return LOCATION_COORDINATES['pune'];
  }
  if (/400\d{3}/.test(lower)) {
    // Mumbai Pincodes
    return LOCATION_COORDINATES['mumbai'];
  }
  if (/422\d{3}/.test(lower)) {
    // Nashik Pincodes
    return LOCATION_COORDINATES['nashik'];
  }

  return null;
}

// In-memory cache for dynamic geocoding queries
const geocodeCache = new Map<string, LatLng | null>();

/**
 * Dynamically geocodes a location query using OpenStreetMap Nominatim with in-memory caching
 */
export async function geocodeLocationAsync(query: string): Promise<LatLng | null> {
  const clean = query.trim().toLowerCase();
  if (!clean) return null;
  if (geocodeCache.has(clean)) return geocodeCache.get(clean) || null;

  // Check static dictionary first
  const staticMatch = extractCoordsFromText(clean);
  if (staticMatch) {
    geocodeCache.set(clean, staticMatch);
    return staticMatch;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', India')}&countrycodes=in&limit=1`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept-Language': 'en' }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const result: LatLng = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
        geocodeCache.set(clean, result);
        return result;
      }
    }
  } catch {
    // Network or timeout fallback
  }

  geocodeCache.set(clean, null);
  return null;
}

export interface AutomatedDistanceResult {
  distanceKm: number;
  originLabel: string;
  destinationLabel: string;
  deliveryTariff: number; // At exact ₹2/km
  deliveryFee?: number;   // Alias for deliveryTariff
  calculationMethod: 'GOOGLE_MAPS_ROUTING' | 'OSRM_DRIVING_ROUTE' | 'GPS_COORDINATES' | 'GEO_ROAD_ROUTING' | 'REGIONAL_CORRIDOR';
  method?: string;        // Alias for calculationMethod
  googleMapsDirectionsUrl: string;
  originCoords?: LatLng;
  destinationCoords?: LatLng;
  durationText?: string;
}

/**
 * Builds compliant Google Maps Directions URL for exact driving navigation
 */
export function getGoogleMapsDirectionsUrl(
  origin: LatLng | string,
  dest: LatLng | string
): string {
  const originParam = typeof origin === 'string' 
    ? encodeURIComponent(origin) 
    : `${origin.lat},${origin.lng}`;
  const destParam = typeof dest === 'string' 
    ? encodeURIComponent(dest) 
    : `${dest.lat},${dest.lng}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}&travelmode=driving`;
}

/**
 * Automatically calculates road distance between farm and customer without manual sliders (Synchronous)
 */
export function calculateAutomatedDistance(
  farmLocation: any,
  customerAddress: any,
  userLiveCoords?: LatLng | null,
  farmCoordsInput?: LatLng | null
): AutomatedDistanceResult {
  const originName = typeof farmLocation === 'string'
    ? (farmLocation.trim() || 'Local Farm')
    : (farmLocation?.address || 'Local Farm');
  const destName = typeof customerAddress === 'string'
    ? (customerAddress.trim() || 'Customer Doorstep')
    : (customerAddress?.address || 'Customer Doorstep');

  const resolvedFarmCoordsInput = farmCoordsInput || 
    (typeof farmLocation === 'object' && farmLocation?.latitude ? { lat: farmLocation.latitude, lng: farmLocation.longitude } : null) ||
    (typeof farmLocation === 'object' && farmLocation?.lat ? { lat: farmLocation.lat, lng: farmLocation.lng } : null);

  const resolvedCustomerCoords = userLiveCoords ||
    (typeof customerAddress === 'object' && customerAddress?.latitude ? { lat: customerAddress.latitude, lng: customerAddress.longitude } : null) ||
    (typeof customerAddress === 'object' && customerAddress?.lat ? { lat: customerAddress.lat, lng: customerAddress.lng } : null);

  const customerCoords = resolvedCustomerCoords || extractCoordsFromText(destName);
  const farmCoords = resolvedFarmCoordsInput || extractCoordsFromText(originName) || 
    (customerCoords ? { lat: customerCoords.lat + 0.025, lng: customerCoords.lng + 0.025 } : { lat: 15.5057, lng: 80.0499 });

  // CHECK 1: SAME LOCALITY / INTRA-CITY DELIVERY (e.g., Ongole to Ongole, or same town)
  const isSameTown = isSameLocalityOrCity(originName, destName);
  if (isSameTown) {
    const localKm = 3.5; // Realistic local transit across town from peri-urban farm to doorstep
    const tariff = Math.round(localKm * 2.0); // ₹7
    const anchorCoords = farmCoords || customerCoords || { lat: 15.5057, lng: 80.0499 };
    return {
      distanceKm: localKm,
      originLabel: originName,
      destinationLabel: destName,
      deliveryTariff: tariff,
      deliveryFee: tariff,
      calculationMethod: 'GEO_ROAD_ROUTING',
      method: 'GEO_ROAD_ROUTING',
      googleMapsDirectionsUrl: getGoogleMapsDirectionsUrl(originName, destName),
      originCoords: anchorCoords,
      destinationCoords: anchorCoords,
      durationText: '12 min'
    };
  }

  // CHECK 2: Live device GPS coordinates available
  if (resolvedCustomerCoords && resolvedCustomerCoords.lat && resolvedCustomerCoords.lng && farmCoords) {
    const directKm = haversineDistanceKm(farmCoords.lat, farmCoords.lng, resolvedCustomerCoords.lat, resolvedCustomerCoords.lng);
    let roadKm = Math.round(directKm * 1.28 * 10) / 10;
    if (directKm < 1.0) {
      roadKm = 3.5; // Local delivery within same neighborhood
    } else if (roadKm < 3.5) {
      roadKm = 3.5;
    }
    const tariff = Math.round(roadKm * 2.0);
    return {
      distanceKm: roadKm,
      originLabel: originName,
      destinationLabel: 'Exact Device GPS Coordinates',
      deliveryTariff: tariff,
      deliveryFee: tariff,
      calculationMethod: 'GPS_COORDINATES',
      googleMapsDirectionsUrl: getGoogleMapsDirectionsUrl(farmCoords, resolvedCustomerCoords),
      originCoords: farmCoords,
      destinationCoords: resolvedCustomerCoords,
      durationText: `${Math.round(roadKm * 2.2 + 5)} min`
    };
  }

  // CHECK 3: Matching both farm and customer localities
  if (customerCoords && farmCoords) {
    const directKm = haversineDistanceKm(farmCoords.lat, farmCoords.lng, customerCoords.lat, customerCoords.lng);
    let roadKm = Math.round(directKm * 1.3 * 10) / 10;

    // Minimum realistic local delivery distance (intra-city/suburb farm delivery)
    if (directKm < 1.0) {
      roadKm = 3.5;
    } else if (roadKm < 3.5) {
      roadKm = 3.5;
    }

    const tariff = Math.round(roadKm * 2.0);
    return {
      distanceKm: roadKm,
      originLabel: originName,
      destinationLabel: destName,
      deliveryTariff: tariff,
      deliveryFee: tariff,
      calculationMethod: 'GEO_ROAD_ROUTING',
      method: 'GEO_ROAD_ROUTING',
      googleMapsDirectionsUrl: getGoogleMapsDirectionsUrl(farmCoords, customerCoords),
      originCoords: farmCoords,
      destinationCoords: customerCoords,
      durationText: `${Math.round(roadKm * 2.2 + 5)} min`
    };
  }

  // CHECK 4: Keyword/Corridor approximation when user types general address
  const lowerDest = destName.toLowerCase();
  const lowerOrigin = originName.toLowerCase();

  let approxKm = 8.0; // Default local farm-to-doorstep corridor

  if (lowerDest.includes('mumbai') || lowerDest.includes('thane') || lowerDest.includes('navi mumbai')) {
    if (lowerOrigin.includes('nashik') || lowerOrigin.includes('lasalgaon')) {
      approxKm = 168.0;
    } else if (lowerOrigin.includes('pune') || lowerOrigin.includes('khed') || lowerOrigin.includes('baramati')) {
      approxKm = 148.0;
    } else {
      approxKm = 155.0;
    }
  } else if (lowerDest.includes('pune')) {
    if (lowerOrigin.includes('nashik') || lowerOrigin.includes('lasalgaon')) {
      approxKm = 205.0;
    } else if (lowerOrigin.includes('baramati')) {
      approxKm = 96.0;
    } else if (lowerOrigin.includes('khed') || lowerOrigin.includes('chakan')) {
      approxKm = 36.0;
    } else if (lowerOrigin.includes('shirur')) {
      approxKm = 62.0;
    } else if (lowerOrigin.includes('junnar') || lowerOrigin.includes('narayangaon')) {
      approxKm = 78.0;
    } else {
      approxKm = 12.0;
    }
  } else if (lowerDest.includes('nashik')) {
    if (lowerOrigin.includes('lasalgaon')) {
      approxKm = 52.0;
    } else if (lowerOrigin.includes('pune')) {
      approxKm = 205.0;
    } else {
      approxKm = 12.0;
    }
  } else if (lowerDest.includes('guntur') && lowerOrigin.includes('ongole')) {
    approxKm = 65.0;
  } else if (lowerDest.includes('vijayawada') && lowerOrigin.includes('ongole')) {
    approxKm = 148.0;
  } else if (lowerDest.includes('hyderabad') && lowerOrigin.includes('ongole')) {
    approxKm = 310.0;
  }

  const corridorTariff = Math.round(approxKm * 2.0);
  return {
    distanceKm: approxKm,
    originLabel: originName,
    destinationLabel: destName,
    deliveryTariff: corridorTariff,
    deliveryFee: corridorTariff,
    calculationMethod: 'REGIONAL_CORRIDOR',
    method: 'REGIONAL_CORRIDOR',
    googleMapsDirectionsUrl: getGoogleMapsDirectionsUrl(originName, destName),
    originCoords: farmCoords,
    durationText: `${Math.round(approxKm * 2.2 + 5)} min`
  };
}

/**
 * Asynchronously calculates real driving road distance via turn-by-turn road graphs,
 * matching Google Maps driving distance and generating directions URLs.
 */
export async function calculateAccurateRoadDistanceAsync(
  farmLocation: any,
  customerAddress: any,
  farmCoordsInput?: LatLng | null,
  customerCoordsInput?: LatLng | null
): Promise<AutomatedDistanceResult> {
  const originName = typeof farmLocation === 'string'
    ? (farmLocation.trim() || 'Local Farm')
    : (farmLocation?.address || 'Local Farm');
  const destName = typeof customerAddress === 'string'
    ? (customerAddress.trim() || 'Customer Doorstep')
    : (customerAddress?.address || 'Customer Doorstep');

  // Short-circuit: same locality / intra-city delivery
  if (isSameLocalityOrCity(originName, destName)) {
    return calculateAutomatedDistance(farmLocation, customerAddress, customerCoordsInput, farmCoordsInput);
  }

  const syncFallback = calculateAutomatedDistance(farmLocation, customerAddress, customerCoordsInput, farmCoordsInput);

  let originCoords = farmCoordsInput || syncFallback.originCoords;
  let destCoords = customerCoordsInput || syncFallback.destinationCoords;

  // If coords still missing, try dynamic geocoding
  if (!originCoords && originName) {
    originCoords = await geocodeLocationAsync(originName);
  }
  if (!destCoords && destName) {
    destCoords = await geocodeLocationAsync(destName);
  }

  if (!originCoords || !destCoords) {
    return syncFallback;
  }

  // If coordinates are identical or within 1.0 km of each other (e.g. both centered on Ongole)
  const directBetweenCoords = haversineDistanceKm(originCoords.lat, originCoords.lng, destCoords.lat, destCoords.lng);
  if (directBetweenCoords < 1.0) {
    const localKm = 3.5;
    const tariff = Math.round(localKm * 2.0); // ₹7
    return {
      distanceKm: localKm,
      originLabel: originName,
      destinationLabel: destName,
      deliveryTariff: tariff,
      deliveryFee: tariff,
      calculationMethod: 'GEO_ROAD_ROUTING',
      method: 'GEO_ROAD_ROUTING',
      googleMapsDirectionsUrl: getGoogleMapsDirectionsUrl(originCoords, destCoords),
      originCoords,
      destinationCoords: destCoords,
      durationText: '12 min'
    };
  }

  // Attempt real driving road route query via OSRM turn-by-turn road engine
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const url = `https://router.project-osrm.org/route/v1/driving/${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}?overview=false`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        let roadDistanceKm = Math.max(1.0, Math.round((route.distance / 1000) * 10) / 10);
        if (roadDistanceKm < 3.0) {
          roadDistanceKm = 3.5;
        }
        const durationMins = Math.round(route.duration / 60);
        const durationText = durationMins >= 60 
          ? `${Math.floor(durationMins / 60)} hr ${durationMins % 60} min` 
          : `${Math.max(10, durationMins)} min`;

        const tariff = Math.round(roadDistanceKm * 2.0);
        return {
          distanceKm: roadDistanceKm,
          originLabel: originName,
          destinationLabel: destName,
          deliveryTariff: tariff,
          deliveryFee: tariff,
          calculationMethod: 'OSRM_DRIVING_ROUTE',
          method: 'OSRM_DRIVING_ROUTE',
          googleMapsDirectionsUrl: getGoogleMapsDirectionsUrl(originCoords, destCoords),
          originCoords,
          destinationCoords: destCoords,
          durationText
        };
      }
    }
  } catch {
    // Network timeout or offline fallback
  }

  return syncFallback;
}
