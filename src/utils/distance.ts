
export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Haversine formula to calculate distance between two points on the Earth
export function calculateDistance(
  point1: Coordinates, 
  point2: Coordinates
): number {
  const R = 6371; // Earth's radius in kilometers
  
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.latitude)) * Math.cos(toRad(point2.latitude)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  
  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Format the distance in a user-friendly way
export function formatDistance(kilometers: number): string {
  if (kilometers < 1) {
    const meters = Math.round(kilometers * 1000);
    return `${meters} m`;
  }
  
  return `${kilometers.toFixed(1)} km`;
}

// Calculate the bearing between two coordinates
export function calculateBearing(
  start: Coordinates, 
  end: Coordinates
): number {
  const startLat = toRad(start.latitude);
  const startLng = toRad(start.longitude);
  const endLat = toRad(end.latitude);
  const endLng = toRad(end.longitude);

  const y = Math.sin(endLng - startLng) * Math.cos(endLat);
  const x = Math.cos(startLat) * Math.sin(endLat) -
            Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
  let bearing = Math.atan2(y, x);
  
  bearing = (bearing * 180 / Math.PI + 360) % 360; // Convert to degrees
  
  return bearing;
}

// Get a textual direction based on bearing
export function getDirection(bearing: number): string {
  const directions = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}
