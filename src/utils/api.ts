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
// Using the provided API key for OpenChargeMap
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
      compact: 'true',
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
    console.log("First station sample:", data[0] ? JSON.stringify(data[0].addressInfo) : "No stations found");
    
    // Add status for UI rendering based on station information
    const processedData = data.map(station => ({
      ...station,
      status: determineStationStatus(station),
      // Ensure distance is properly set if it's in the addressInfo
      distance: station.distance || station.addressInfo.distance
    }));
    
    return processedData;
  } catch (error) {
    console.error('Error fetching charging stations:', error);
    console.log('Error details:', error instanceof Error ? error.message : String(error));
    
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
      status: determineStationStatus(station),
      // Ensure distance is properly set if it's in the addressInfo
      distance: station.distance || station.addressInfo.distance
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

// New helper function to handle the specific OpenChargeMap response format
export function mapApiResponse(apiResponse: any[]): ChargingStation[] {
  console.log("Mapping API response:", apiResponse.length, "items");
  
  if (!Array.isArray(apiResponse) || apiResponse.length === 0) {
    console.log("Empty or invalid API response");
    return [];
  }
  
  try {
    return apiResponse.map(item => {
      // Log the structure of the first item to help debug
      if (apiResponse.indexOf(item) === 0) {
        console.log("First item structure:", JSON.stringify(item));
      }
      
      // Map the OpenChargeMap response to our ChargingStation interface
      return {
        id: item.ID,
        uuid: item.UUID,
        addressInfo: {
          id: item.AddressInfo.ID,
          title: item.AddressInfo.Title,
          addressLine1: item.AddressInfo.AddressLine1,
          town: item.AddressInfo.Town,
          stateOrProvince: item.AddressInfo.StateOrProvince,
          postcode: item.AddressInfo.Postcode,
          latitude: item.AddressInfo.Latitude,
          longitude: item.AddressInfo.Longitude,
          country: {
            id: item.AddressInfo.CountryID,
            isoCode: "",  // This might not be in the response
            title: ""     // This might not be in the response
          },
          distance: item.AddressInfo.Distance
        },
        connections: (item.Connections || []).map((conn: any) => ({
          id: conn.ID,
          connectionType: {
            id: conn.ConnectionTypeID,
            title: conn.ConnectionType?.Title || "Unknown Type"
          },
          level: {
            id: conn.LevelID,
            title: conn.Level?.Title || "Unknown Level",
            comments: conn.Level?.Comments || ""
          },
          powerKW: conn.PowerKW,
          quantity: conn.Quantity
        })),
        usageCost: item.UsageCost || "Tidak ada informasi", // Add usage cost information
        status: determineStationStatus(item),
        distance: item.AddressInfo.Distance
      };
    });
  } catch (error) {
    console.error("Error mapping API response:", error);
    return [];
  }
}
