
import React, { useEffect, useRef } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ChargingStation } from '../utils/api';
import { useMapbox } from '../hooks/useMapbox';
import { createUserLocationMarker } from './map/UserLocationMarker';
import { createStationMarker } from './map/StationMarker';
import { createVehicleMarker } from './map/VehicleMarker';
import { useLiveTracking } from '../hooks/useLiveTracking';
import { createLocationMarker } from './map/LocationMarker';

interface MapProps {
  stations: ChargingStation[];
  userLocation: { latitude: number; longitude: number } | null;
  onStationClick: (station: ChargingStation) => void;
  selectedStation: ChargingStation | null;
  apiKey?: string;
  directionsRoute?: GeoJSON.Feature | null;
  searchedLocation?: { latitude: number; longitude: number } | null;
}

const Map: React.FC<MapProps> = ({ 
  stations, 
  userLocation, 
  onStationClick,
  selectedStation,
  apiKey = 'pk.eyJ1IjoiYW5nZzB4IiwiYSI6ImNtOGU0b3ZleDAzMW4ycW9mbHY1YXhtdTQifQ.cZL2sxCvBSXQDSqZ1aL-hQ',
  directionsRoute,
  searchedLocation
}) => {
  const {
    mapContainer,
    map,
    mapLoaded,
    markersRef,
    userMarkerRef,
    vehicleMarkerRef,
    locationMarkerRef,
    initializeMap,
    clearMap,
    updateRouteSource
  } = useMapbox({ apiKey, defaultLocation: userLocation, onStationClick });

  // Store previous user location to avoid updating marker unnecessarily
  const prevUserLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  
  // Track the previous directions route to avoid unnecessary updates
  const prevDirectionsRouteRef = useRef<GeoJSON.Feature | null>(null);

  const { location: liveLocation } = useLiveTracking({
    enabled: true,
    updateInterval: 5000
  });

  // Initialize map
  useEffect(() => {
    initializeMap();
    return () => clearMap();
  }, [apiKey]);

  // Handle live location updates - create vehicle marker only if different from user position
  useEffect(() => {
    if (!map.current || !mapLoaded || !liveLocation) return;
    
    // Only show vehicle marker if we're actively tracking and moving
    // and it's different from the static user location marker
    if (userLocation && 
        Math.abs(liveLocation.latitude - userLocation.latitude) > 0.0001 && 
        Math.abs(liveLocation.longitude - userLocation.longitude) > 0.0001) {
      
      createVehicleMarker({
        map: map.current,
        location: liveLocation,
        markerRef: vehicleMarkerRef
      });
    }
  }, [liveLocation, mapLoaded, userLocation]);

  // Handle user location updates - ensure we only create marker when location actually changes
  useEffect(() => {
    if (!map.current || !mapLoaded || !userLocation) return;
    
    // Check if location has changed
    const locationChanged = 
      !prevUserLocationRef.current || 
      prevUserLocationRef.current.latitude !== userLocation.latitude ||
      prevUserLocationRef.current.longitude !== userLocation.longitude;
    
    if (locationChanged) {
      // Update marker with new location
      createUserLocationMarker({
        map: map.current,
        location: userLocation,
        markerRef: userMarkerRef
      });
      
      // Update previous location
      prevUserLocationRef.current = userLocation;
    }
  }, [userLocation, mapLoaded]);

  // Handle searched location updates
  useEffect(() => {
    if (!map.current || !mapLoaded || !searchedLocation) return;
    
    createLocationMarker({
      map: map.current,
      location: searchedLocation,
      markerRef: locationMarkerRef
    });
    
    // Fly to the searched location
    map.current.flyTo({
      center: [searchedLocation.longitude, searchedLocation.latitude],
      zoom: 14,
      speed: 1.5,
      curve: 1
    });
  }, [searchedLocation, mapLoaded]);

  // Handle stations updates
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    console.log("Updating station markers, count:", stations.length);
    
    // Clear existing markers before adding new ones
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    stations.forEach(station => {
      const marker = createStationMarker({
        station,
        map: map.current!,
        onStationClick
      });
      markersRef.current.push(marker);
    });

    if (selectedStation) {
      const index = stations.findIndex(s => s.id === selectedStation.id);
      if (index !== -1 && markersRef.current[index]) {
        const marker = markersRef.current[index];
        marker.getElement().classList.add('scale-125', 'z-20', 'shadow-lg');
        marker.getElement().style.filter = 'drop-shadow(0 0 5px rgba(59, 130, 246, 0.5))';
        
        map.current.flyTo({
          center: [selectedStation.addressInfo.longitude, selectedStation.addressInfo.latitude],
          zoom: 15,
          speed: 0.8,
          curve: 1
        });
      }
    }
  }, [stations, mapLoaded, selectedStation, onStationClick]);

  // Handle directions route updates
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    // Check if the route has changed by comparing with previous route
    const routeChanged = directionsRoute !== prevDirectionsRouteRef.current;
    
    if (routeChanged) {
      // Update the route source with the new route or empty route if null
      updateRouteSource(directionsRoute);
      prevDirectionsRouteRef.current = directionsRoute;
      
      // Only adjust map view if we have a valid route
      if (directionsRoute && directionsRoute.properties?.bbox) {
        const [minLng, minLat, maxLng, maxLat] = directionsRoute.properties.bbox as number[];
        map.current.fitBounds(
          [
            [minLng, minLat],
            [maxLng, maxLat]
          ],
          {
            padding: 50,
            duration: 1000
          }
        );
      }
    }
  }, [directionsRoute, mapLoaded, updateRouteSource]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden bg-gray-100">
      <div ref={mapContainer} className="map-container h-full w-full" />
      
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-80 p-2 rounded-lg shadow-md">
        <p className="text-sm font-medium">
          {stations.length > 0 
            ? `${stations.length} Stasiun Ditemukan` 
            : userLocation 
              ? "Tidak ada stasiun dalam radius pencarian" 
              : "Waiting for location..."}
        </p>
      </div>
      
      {directionsRoute && directionsRoute.properties?.distance && directionsRoute.properties?.duration && (
        <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-md">
          <div className="text-sm">
            <p className="font-medium">Info Rute</p>
            <p>Jarak: {(directionsRoute.properties.distance / 1000).toFixed(1)} km</p>
            <p>Waktu: {Math.round(directionsRoute.properties.duration / 60)} menit</p>
          </div>
        </div>
      )}
      
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-20 right-4 bg-white bg-opacity-80 p-2 rounded-lg shadow-md max-w-xs text-xs overflow-auto max-h-40">
          <p className="font-medium">Debug Info:</p>
          <p>Map Loaded: {mapLoaded ? 'Yes' : 'No'}</p>
          <p>Live Location: {liveLocation ? `${liveLocation.latitude.toFixed(4)}, ${liveLocation.longitude.toFixed(4)}` : 'None'}</p>
          <p>User Location: {userLocation ? `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}` : 'None'}</p>
          <p>Stations Count: {stations.length}</p>
          <p>Markers Count: {markersRef.current.length}</p>
          <p>Directions: {directionsRoute ? 'Active' : 'None'}</p>
          <p>Searched Location: {searchedLocation ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  );
};

export default Map;
