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

  // Pincode checks (Maharashtra clusters)
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

export interface AutomatedDistanceResult {
  distanceKm: number;
  originLabel: string;
  destinationLabel: string;
  deliveryTariff: number; // At exact ₹2/km
  calculationMethod: 'GPS_COORDINATES' | 'GEO_ROAD_ROUTING' | 'REGIONAL_CORRIDOR';
}

/**
 * Automatically calculates road distance between farm and customer without manual sliders
 */
export function calculateAutomatedDistance(
  farmLocation: string,
  customerAddress: string,
  userLiveCoords?: LatLng | null
): AutomatedDistanceResult {
  const originName = farmLocation?.trim() || 'Maharashtra Farm Cluster';
  const destName = customerAddress?.trim() || 'Customer Doorstep';

  const farmCoords = extractCoordsFromText(originName) || { lat: 18.8519, lng: 73.9167 }; // Default to Pune Agri Belt

  // Case 1: Live device GPS coordinates available
  if (userLiveCoords && userLiveCoords.lat && userLiveCoords.lng) {
    const directKm = haversineDistanceKm(farmCoords.lat, farmCoords.lng, userLiveCoords.lat, userLiveCoords.lng);
    // Real road multiplier (Indian national/state highway & arterial road curvature ~ 1.28)
    const roadKm = Math.max(4.0, Math.round(directKm * 1.28 * 10) / 10);
    return {
      distanceKm: roadKm,
      originLabel: originName,
      destinationLabel: 'Exact Device GPS Coordinates',
      deliveryTariff: Math.round(roadKm * 2.0),
      calculationMethod: 'GPS_COORDINATES'
    };
  }

  // Case 2: Matching both farm and customer localities
  const customerCoords = extractCoordsFromText(destName);
  if (customerCoords) {
    const directKm = haversineDistanceKm(farmCoords.lat, farmCoords.lng, customerCoords.lat, customerCoords.lng);
    // Road transit factor
    let roadKm = Math.round(directKm * 1.3 * 10) / 10;

    // Minimum realistic local delivery distance (intra-city/suburb farm delivery)
    if (roadKm < 4.5) {
      roadKm = 6.5;
    }

    return {
      distanceKm: roadKm,
      originLabel: originName,
      destinationLabel: destName,
      deliveryTariff: Math.round(roadKm * 2.0),
      calculationMethod: 'GEO_ROAD_ROUTING'
    };
  }

  // Case 3: Keyword/Corridor approximation when user types general address
  const lowerDest = destName.toLowerCase();
  const lowerOrigin = originName.toLowerCase();

  let approxKm = 14.0; // Default local city-periphery farm corridor

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
      approxKm = 18.0;
    }
  } else if (lowerDest.includes('nashik')) {
    if (lowerOrigin.includes('lasalgaon')) {
      approxKm = 52.0;
    } else if (lowerOrigin.includes('pune')) {
      approxKm = 205.0;
    } else {
      approxKm = 15.0;
    }
  }

  return {
    distanceKm: approxKm,
    originLabel: originName,
    destinationLabel: destName,
    deliveryTariff: Math.round(approxKm * 2.0),
    calculationMethod: 'REGIONAL_CORRIDOR'
  };
}
