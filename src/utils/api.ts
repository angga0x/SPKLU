
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
}

export interface SearchParams {
  latitude: number;
  longitude: number;
  distance?: number; // in kilometers
  maxResults?: number;
  countryCode?: string;
}

const BASE_URL = 'https://api.openchargemap.io/v3';
// We're using a client-side API key here as it's publicly available and rate-limited
const API_KEY = '123'; // Optional: users will be asked to provide their own key

export async function fetchNearbyStations(params: SearchParams): Promise<ChargingStation[]> {
  try {
    const { latitude, longitude, distance = 15, maxResults = 100, countryCode } = params;
    
    const queryParams = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      distance: distance.toString(),
      distanceunit: 'km',
      maxresults: maxResults.toString(),
      compact: 'true',
      verbose: 'false',
      output: 'json',
      key: API_KEY || ''
    });
    
    if (countryCode) {
      queryParams.append('countrycode', countryCode);
    }

    const response = await fetch(`${BASE_URL}/poi/?${queryParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stations: ${response.status}`);
    }
    
    const data = await response.json() as ChargingStation[];
    
    // Add status for UI rendering based on station information
    const processedData = data.map(station => ({
      ...station,
      status: determineStationStatus(station)
    }));
    
    return processedData;
  } catch (error) {
    console.error('Error fetching charging stations:', error);
    toast({
      title: "Error",
      description: "Failed to load charging stations. Please try again later.",
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
    
    const { latitude, longitude, distance = 50, maxResults = 100 } = params;
    
    const queryParams = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      distance: distance.toString(),
      distanceunit: 'km',
      maxresults: maxResults.toString(),
      compact: 'true',
      verbose: 'false',
      output: 'json',
      key: API_KEY || '',
      keywords: query
    });
    
    const response = await fetch(`${BASE_URL}/poi/?${queryParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to search stations: ${response.status}`);
    }
    
    const data = await response.json() as ChargingStation[];
    
    const processedData = data.map(station => ({
      ...station,
      status: determineStationStatus(station)
    }));
    
    return processedData;
  } catch (error) {
    console.error('Error searching charging stations:', error);
    toast({
      title: "Error",
      description: "Failed to search charging stations. Please try again later.",
      variant: "destructive"
    });
    return [];
  }
}
