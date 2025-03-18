
import { ChargingStation } from './api';

interface DirectionsParams {
  origin: [number, number];
  destination: [number, number];
  apiKey: string;
}

interface DirectionsResponse {
  routes: Array<{
    distance: number;
    duration: number;
    geometry: {
      coordinates: Array<[number, number]>;
      type: string;
    };
    legs: Array<{
      steps: Array<any>;
      summary: string;
      distance: number;
      duration: number;
    }>;
    weight: number;
    weight_name: string;
  }>;
  waypoints: Array<{
    distance: number;
    name: string;
    location: [number, number];
  }>;
  code: string;
  uuid: string;
}

export async function getDirections({
  origin,
  destination,
  apiKey
}: DirectionsParams): Promise<GeoJSON.Feature | null> {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[1]},${origin[0]};${destination[1]},${destination[0]}?alternatives=false&geometries=geojson&overview=full&steps=false&access_token=${apiKey}`;

    console.log("Fetching directions from:", url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch directions: ${response.status}`);
    }
    
    const data: DirectionsResponse = await response.json();
    console.log("Received directions data", data);
    
    if (!data.routes || data.routes.length === 0) {
      console.error("No routes found in directions response");
      return null;
    }
    
    const route = data.routes[0];
    
    // Create a GeoJSON feature from the response
    const geojson: GeoJSON.Feature = {
      type: 'Feature',
      properties: {
        distance: route.distance,
        duration: route.duration,
        bbox: getBoundingBox(route.geometry.coordinates)
      },
      geometry: route.geometry
    };
    
    return geojson;
  } catch (error) {
    console.error("Error fetching directions:", error);
    return null;
  }
}

// Calculate a bounding box from an array of coordinates
function getBoundingBox(coordinates: Array<[number, number]>): number[] {
  if (!coordinates || coordinates.length === 0) return [0, 0, 0, 0];
  
  let minLng = coordinates[0][0];
  let minLat = coordinates[0][1];
  let maxLng = coordinates[0][0];
  let maxLat = coordinates[0][1];
  
  coordinates.forEach(coord => {
    minLng = Math.min(minLng, coord[0]);
    minLat = Math.min(minLat, coord[1]);
    maxLng = Math.max(maxLng, coord[0]);
    maxLat = Math.max(maxLat, coord[1]);
  });
  
  return [minLng, minLat, maxLng, maxLat];
}

// Format directions duration into a human-readable string
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours} jam ${minutes} menit`;
  }
  
  return `${minutes} menit`;
}

// Format directions distance into a human-readable string
export function formatDirectionsDistance(meters: number): string {
  const km = meters / 1000;
  
  if (km < 1) {
    return `${Math.round(meters)} m`;
  }
  
  return `${km.toFixed(1)} km`;
}
