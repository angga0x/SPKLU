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
    
    const data = await response.json();
    console.log("Received raw data:", data);
    
    if (!data || !Array.isArray(data)) {
      console.error("Invalid response format:", data);
      return [];
    }

    // Process the stations with proper validation
    const processedData = data.filter(station => {
      // Basic validation checks
      const isValid = station &&
        typeof station === 'object' &&
        'ID' in station &&
        'AddressInfo' in station &&
        station.AddressInfo &&
        typeof station.AddressInfo === 'object' &&
        'Latitude' in station.AddressInfo &&
        'Longitude' in station.AddressInfo;

      if (!isValid) {
        console.warn('Skipping invalid station:', station);
        return false;
      }
      return true;
    }).map(station => ({
      id: station.ID,
      uuid: station.UUID,
      addressInfo: {
        id: station.AddressInfo.ID,
        title: station.AddressInfo.Title,
        addressLine1: station.AddressInfo.AddressLine1,
        town: station.AddressInfo.Town,
        stateOrProvince: station.AddressInfo.StateOrProvince,
        postcode: station.AddressInfo.Postcode,
        country: {
          id: station.AddressInfo.Country.ID,
          isoCode: station.AddressInfo.Country.ISOCode,
          title: station.AddressInfo.Country.Title
        },
        latitude: station.AddressInfo.Latitude,
        longitude: station.AddressInfo.Longitude,
        distance: station.AddressInfo.Distance,
        contactTelephone1: station.AddressInfo.ContactTelephone1,
        contactEmail: station.AddressInfo.ContactEmail,
        accessComments: station.AddressInfo.AccessComments,
        relatedURL: station.AddressInfo.RelatedURL
      },
      operatorInfo: station.OperatorInfo ? {
        id: station.OperatorInfo.ID,
        name: station.OperatorInfo.Title,
        websiteURL: station.OperatorInfo.WebsiteURL,
        phoneNumber: station.OperatorInfo.PhonePrimaryContact
      } : undefined,
      statusType: station.StatusType ? {
        id: station.StatusType.ID,
        title: station.StatusType.Title,
        isOperational: station.StatusType.IsOperational
      } : undefined,
      connections: Array.isArray(station.Connections) ? station.Connections.map(conn => ({
        id: conn.ID,
        connectionType: {
          id: conn.ConnectionType.ID,
          title: conn.ConnectionType.Title
        },
        statusType: conn.StatusType ? {
          id: conn.StatusType.ID,
          title: conn.StatusType.Title,
          isOperational: conn.StatusType.IsOperational
        } : undefined,
        level: {
          id: conn.Level.ID,
          title: conn.Level.Title,
          comments: conn.Level.Comments
        },
        powerKW: conn.PowerKW,
        currentType: conn.CurrentType ? {
          id: conn.CurrentType.ID,
          title: conn.CurrentType.Title
        } : undefined,
        quantity: conn.Quantity
      })) : [],
      usageType: station.UsageType ? {
        id: station.UsageType.ID,
        title: station.UsageType.Title
      } : undefined,
      distance: station.AddressInfo.Distance,
      status: station.StatusType?.IsOperational ? 'available' : 'offline',
      usageCost: station.UsageCost || 'Tidak ada informasi'
    }));

    console.log("Processed stations:", processedData.length);
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
    
    const data = await response.json();
    console.log("Search returned:", data?.length || 0, "results");
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      toast({
        title: "Tidak ada hasil",
        description: `Tidak ada stasiun pengisian ditemukan untuk pencarian "${query}".`,
      });
      return [];
    }

    // Process the stations with proper validation and distance calculation
    const processedStations = data
      .filter(station => {
        // Validate station object and required properties
        const isValid = station && 
                        typeof station === 'object' &&
                        station.addressInfo && 
                        typeof station.addressInfo === 'object' &&
                        'latitude' in station.addressInfo && 
                        'longitude' in station.addressInfo &&
                        typeof station.addressInfo.latitude === 'number' &&
                        typeof station.addressInfo.longitude === 'number';
        
        if (!isValid) {
          console.warn('Invalid station data in search results:', station);
        }
        return isValid;
      })
      .map(station => ({
        ...station,
        status: determineStationStatus(station),
        distance: station.addressInfo?.distance || 0
      }));
    
    console.log("Processed search stations:", processedStations.length);
    
    if (processedStations.length === 0) {
      toast({
        title: "Data tidak valid",
        description: "Hasil pencarian memiliki format data yang tidak valid.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Hasil pencarian",
        description: `${processedStations.length} stasiun pengisian ditemukan.`,
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
