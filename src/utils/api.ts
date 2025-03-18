
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
    
    console.log(`Searching stations with keyword: "${query}"`);
    
    // Using the exact format from the provided API endpoint
    const queryParams = new URLSearchParams({
      output: 'json',
      countrycode: 'ID',
      stateorprovince: query, // Use the query as the stateorprovince parameter
      maxresults: params.maxResults?.toString() || '10',
      key: API_KEY
    });
    
    const url = `${BASE_URL}/poi/?${queryParams.toString()}`;
    console.log("Search URL:", url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to search stations: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Search returned:", data.length, "results");
    
    // Process the raw API response to match our ChargingStation format
    const processedStations = data.map((item: any) => {
      try {
        // Build properly structured ChargingStation object from API response
        const station: ChargingStation = {
          id: item.ID,
          uuid: item.UUID,
          addressInfo: {
            id: item.AddressInfo.ID,
            title: item.AddressInfo.Title || '',
            addressLine1: item.AddressInfo.AddressLine1 || '',
            town: item.AddressInfo.Town || '',
            stateOrProvince: item.AddressInfo.StateOrProvince || '',
            postcode: item.AddressInfo.Postcode || '',
            country: {
              id: item.AddressInfo.CountryID,
              isoCode: item.AddressInfo.Country?.ISOCode || '',
              title: item.AddressInfo.Country?.Title || ''
            },
            latitude: item.AddressInfo.Latitude,
            longitude: item.AddressInfo.Longitude,
            distance: item.AddressInfo.Distance
          },
          operatorInfo: item.OperatorInfo ? {
            id: item.OperatorInfo.ID,
            name: item.OperatorInfo.Title,
            websiteURL: item.OperatorInfo.WebsiteURL,
            phoneNumber: item.OperatorInfo.PhonePrimaryContact
          } : undefined,
          statusType: item.StatusType ? {
            id: item.StatusType.ID,
            title: item.StatusType.Title,
            isOperational: item.StatusType.IsOperational
          } : undefined,
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
            powerKW: conn.PowerKW || 0,
            currentType: conn.CurrentType ? {
              id: conn.CurrentTypeID,
              title: conn.CurrentType.Title
            } : undefined,
            quantity: conn.Quantity || 1
          })),
          usageType: item.UsageType ? {
            id: item.UsageType.ID,
            title: item.UsageType.Title
          } : undefined,
          usageCost: item.UsageCost || "Tidak ada informasi",
          status: determineStationStatus({
            statusType: item.StatusType
          } as ChargingStation)
        };
        
        return station;
      } catch (error) {
        console.error("Error processing station data:", error, item);
        return null;
      }
    }).filter(Boolean);
    
    console.log("Processed stations:", processedStations.length);
    
    if (processedStations.length === 0) {
      toast({
        title: "Tidak ada hasil",
        description: `Tidak ada stasiun pengisian ditemukan untuk pencarian "${query}".`,
      });
    }
    
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

// Removed mapApiResponse function as it's now integrated into searchStations
