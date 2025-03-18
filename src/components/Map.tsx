
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ChargingStation } from '../utils/api';
import { Plug } from 'lucide-react';

interface MapProps {
  stations: ChargingStation[];
  userLocation: { latitude: number; longitude: number } | null;
  onStationClick: (station: ChargingStation) => void;
  selectedStation: ChargingStation | null;
  apiKey?: string;
}

const Map: React.FC<MapProps> = ({ 
  stations, 
  userLocation, 
  onStationClick,
  selectedStation,
  apiKey = 'pk.eyJ1IjoiYW5nZzB4IiwiYSI6ImNtOGU0b3ZleDAzMW4ycW9mbHY1YXhtdTQifQ.cZL2sxCvBSXQDSqZ1aL-hQ' // Default to the provided API key
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // Initialize the map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Use the provided API key
    mapboxgl.accessToken = apiKey;

    // Default to Indonesia if no user location
    const defaultLocation = userLocation || { 
      latitude: -6.200000, 
      longitude: 106.816666 
    };

    // Create the map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [defaultLocation.longitude, defaultLocation.latitude],
      zoom: 12,
      pitch: 0,
      attributionControl: false
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add attribution control
    map.current.addControl(
      new mapboxgl.AttributionControl({
        compact: true
      }),
      'bottom-right'
    );

    // Add geolocate control
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      }),
      'top-right'
    );

    // Set up event handlers
    map.current.on('load', () => {
      setMapLoaded(true);
    });

    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [apiKey, userLocation]);

  // Update user location marker
  useEffect(() => {
    if (!map.current || !mapLoaded || !userLocation) return;

    // Remove existing user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    // Create user marker element
    const userMarkerElement = document.createElement('div');
    userMarkerElement.className = 'user-marker';
    
    // Add a dot in the center
    const userDot = document.createElement('div');
    userDot.className = 'w-3 h-3 bg-white rounded-full';
    userMarkerElement.appendChild(userDot);

    // Add pulsating animation
    const pulseRing = document.createElement('div');
    pulseRing.className = 'absolute w-8 h-8 rounded-full border-4 border-blue-300 animate-pulse';
    userMarkerElement.appendChild(pulseRing);

    // Create and add the marker
    userMarkerRef.current = new mapboxgl.Marker(userMarkerElement)
      .setLngLat([userLocation.longitude, userLocation.latitude])
      .addTo(map.current);

    // Fly to user location
    map.current.flyTo({
      center: [userLocation.longitude, userLocation.latitude],
      zoom: 13,
      speed: 1.5,
      curve: 1,
      easing(t) { return t; }
    });
  }, [userLocation, mapLoaded]);

  // Update station markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Create and add station markers
    stations.forEach(station => {
      const { latitude, longitude } = station.addressInfo;
      
      // Create marker element
      const markerElement = document.createElement('div');
      markerElement.className = `station-marker ${station.status || 'available'}`;
      
      // Add icon to marker
      const icon = document.createElement('div');
      icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 2h10"></path><path d="M9 11V7"></path><path d="M15 11V7"></path><path d="M11 15v-3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"></path><path d="M5 22v-3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3"></path><path d="M11 1v3"></path><circle cx="11" cy="11" r="2"></circle></svg>';
      markerElement.appendChild(icon);

      // Create marker
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([longitude, latitude])
        .addTo(map.current!);

      // Add click handler
      marker.getElement().addEventListener('click', () => {
        onStationClick(station);
      });

      // Store marker reference
      markersRef.current.push(marker);
    });

    // If a station is selected, highlight its marker and pan to it
    if (selectedStation) {
      const index = stations.findIndex(s => s.id === selectedStation.id);
      if (index !== -1 && markersRef.current[index]) {
        const marker = markersRef.current[index];
        marker.getElement().classList.add('scale-125', 'z-10', 'ring-2', 'ring-primary');
        
        map.current.flyTo({
          center: [selectedStation.addressInfo.longitude, selectedStation.addressInfo.latitude],
          zoom: 15,
          speed: 0.8,
          curve: 1
        });
      }
    }
  }, [stations, mapLoaded, selectedStation, onStationClick]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden bg-gray-100">
      <div ref={mapContainer} className="map-container" />
    </div>
  );
};

export default Map;
