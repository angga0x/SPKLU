import { toast } from "../components/ui/use-toast";

export interface ChargingStation {
  id: number;
  uuid: string;
  addressInfo: {
    id: number;
    title: string;
    addressLine1: string;
    town: string;
    stateOrProvince: string;
    postcode: string;
    country: {
      id: number;
      isoCode: string;
      title: string;
    };
    latitude: number;
    longitude: number;
    contactTelephone1?: string;
    contactEmail?: string;
    accessComments?: string;
    relatedURL?: string;
    distance?: number;
  };
  operatorInfo?: {
    id?: number;
    name?: string;
    websiteURL?: string;
    phoneNumber?: string;
  };
  statusType?: {
    id: number;
    title: string;
    isOperational: boolean;
  };
  connections: Array<{
    id: number;
    connectionType: {
      id: number;
      title: string;
    };
    statusType?: {
      id: number;
      title: string;
      isOperational: boolean;
    };
    level: {
      id: number;
      title: string;
      comments: string;
    };
    powerKW: number;
    currentType?: {
      id: number;
      title: string;
    };
    quantity: number;
  }>;
  usageType?: {
    id: number;
    title: string;
  };
  mediaItems?: Array<{
    id: number;
    url: string;
    title?: string;
    isExternalUrl: boolean;
  }>;
  distance?: number; // Added for client-side distance calculation
  status?: 'available' | 'busy' | 'offline'; // Added for UI presentation
  usageCost?: string; // Added for price information
}

export interface SearchParams {
  latitude: number;
  longitude: number;
  distance?: number; // in kilometers
  maxResults?: number;
  countryCode?: string;
}

const BASE_URL = 'https://api.openchargemap.io/v3';
const API_KEY = 'd7609f7a-6dca-4bd4-a531-ce798439da2c';

export async function fetchNearbyStations(params: SearchParams): Promise<ChargingStation[]> {
  try {
    const { latitude, longitude, distance = 15, maxResults = 100, countryCode } = params;
    
    console.log("Fetching stations with params:", { latitude, longitude, distance, maxResults });
    
    const queryParams = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      distance: distance.toString(),
      distanceunit: 'km',
      maxresults: maxResults.toString(),
      verbose: 'false',
      output: 'json',
      key: API_KEY || ''
    });
    
    if (countryCode) {
      queryParams.append('countrycode', countryCode);
    }

    const url = `${BASE_URL}/poi/?${queryParams.toString()}`;
    console.log("Fetching from URL:", url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stations: ${response.status}`);
    }
    
    const data = await response.json() as ChargingStation[];
    console.log("Received data:", data.length, "stations");
    
    if (data.length === 0) {
      toast({
        title: "Tidak ada hasil",
        description: "Tidak ada stasiun pengisian di sekitar lokasi ini.",
      });
      return [];
    }

    // Process the stations with proper distance calculation and status
    const processedData = data.map(station => ({
      ...station,
      status: determineStationStatus(station),
      distance: station.addressInfo?.distance || 0
    }));

    return processedData;
  } catch (error) {
    console.error('Error fetching charging stations:', error);
    toast({
      title: "Error",
      description: "Gagal memuat stasiun pengisian. Silakan coba lagi nanti.",
      variant: "destructive"
    });
    return [];
  }
}

// Helper function to determine station status for UI presentation
function determineStationStatus(station: ChargingStation): 'available' | 'busy' | 'offline' {
  if (!station.statusType) return 'available';
  
  if (!station.statusType.isOperational) {
    return 'offline';
  }
  
  // This is a simplification - in reality we would need real-time data
  // For demo purposes, we'll randomly assign some stations as busy
  const randomValue = Math.random();
  if (randomValue < 0.2) {
    return 'busy';
  }
  
  return 'available';
}

export async function searchStations(
  query: string, 
  params: SearchParams
): Promise<ChargingStation[]> {
  try {
    if (!query.trim()) {
      return fetchNearbyStations(params);
    }
    
    console.log(`Searching stations with keyword: "${query}"`);
    
    const queryParams = new URLSearchParams({
      output: 'json',
      countrycode: 'ID',
      maxresults: params.maxResults?.toString() || '10',
      key: API_KEY,
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
      distance: '50', // Increased search radius for better results
      distanceunit: 'km'
    });

    // Add search query if provided
    if (query) {
      queryParams.append('search', query);
    }
    
    const url = `${BASE_URL}/poi/?${queryParams.toString()}`;
    console.log("Search URL:", url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to search stations: ${response.status}`);
    }
    
    const data = await response.json() as ChargingStation[];
    console.log("Search returned:", data.length, "results");
    
    if (data.length === 0) {
      toast({
        title: "Tidak ada hasil",
        description: `Tidak ada stasiun pengisian ditemukan untuk pencarian "${query}".`,
      });
      return [];
    }

    // Process the stations with proper distance calculation and status
    const processedStations = data.map(station => ({
      ...station,
      status: determineStationStatus(station),
      distance: station.addressInfo?.distance || 0
    }));
    
    return processedStations;
  } catch (error) {
    console.error('Error searching charging stations:', error);
    toast({
      title: "Error",
      description: "Gagal mencari stasiun pengisian. Silakan coba lagi nanti.",
      variant: "destructive"
    });
    return [];
  }
}
