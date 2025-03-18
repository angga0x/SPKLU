import React, { useEffect } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ChargingStation } from '../utils/api';
import { useMapbox } from '../hooks/useMapbox';
import { createUserLocationMarker } from './map/UserLocationMarker';
import { createStationMarker } from './map/StationMarker';
import { createVehicleMarker } from './map/VehicleMarker';
import { useLiveTracking } from '../hooks/useLiveTracking';

interface MapProps {
  stations: ChargingStation[];
  userLocation: { latitude: number; longitude: number } | null;
  onStationClick: (station: ChargingStation) => void;
  selectedStation: ChargingStation | null;
  apiKey?: string;
  directionsRoute?: GeoJSON.Feature | null;
}

const Map: React.FC<MapProps> = ({ 
  stations, 
  userLocation, 
  onStationClick,
  selectedStation,
  apiKey = 'pk.eyJ1IjoiYW5nZzB4IiwiYSI6ImNtOGU0b3ZleDAzMW4ycW9mbHY1YXhtdTQifQ.cZL2sxCvBSXQDSqZ1aL-hQ',
  directionsRoute
}) => {
  const {
    mapContainer,
    map,
    mapLoaded,
    markersRef,
    userMarkerRef,
    initializeMap,
    clearMap
  } = useMapbox({ apiKey, defaultLocation: userLocation, onStationClick });

  const { location: liveLocation } = useLiveTracking({
    enabled: true,
    updateInterval: 5000
  });

  // Initialize map
  useEffect(() => {
    initializeMap();
    return () => clearMap();
  }, [apiKey]);

  // Handle live location updates
  useEffect(() => {
    if (!map.current || !mapLoaded || !liveLocation) return;

    createVehicleMarker({
      map: map.current,
      location: liveLocation
    });

  }, [liveLocation, mapLoaded]);

  // Handle user location updates
  useEffect(() => {
    if (!map.current || !mapLoaded || !userLocation) return;
    createUserLocationMarker({
      map: map.current,
      location: userLocation,
      markerRef: userMarkerRef
    });
  }, [userLocation, mapLoaded]);

  // Handle stations updates
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    console.log("Updating station markers, count:", stations.length);
    
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
    if (!map.current || !mapLoaded || !directionsRoute) return;
    
    if (map.current.getSource('route')) {
      (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData(directionsRoute);
    }
    
    if (directionsRoute.properties?.bbox) {
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
  }, [directionsRoute, mapLoaded]);

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
        </div>
      )}
    </div>
  );
};

export default Map;
