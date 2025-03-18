
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
  directionsRoute?: GeoJSON.Feature | null;
}

const Map: React.FC<MapProps> = ({ 
  stations, 
  userLocation, 
  onStationClick,
  selectedStation,
  apiKey = 'pk.eyJ1IjoiYW5nZzB4IiwiYSI6ImNtOGU0b3ZleDAzMW4ycW9mbHY1YXhtdTQifQ.cZL2sxCvBSXQDSqZ1aL-hQ', // Default to the provided API key
  directionsRoute
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const routeRef = useRef<string | null>(null);

  // Initialize the map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    console.log("Initializing map with API key:", apiKey);
    
    // Use the provided API key
    mapboxgl.accessToken = apiKey;

    // Default to Indonesia if no user location
    const defaultLocation = userLocation || { 
      latitude: -6.200000, 
      longitude: 106.816666 
    };

    console.log("Map center:", defaultLocation);

    // Create the map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12', // Changed to streets style for better visibility
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
      console.log("Map loaded successfully");
      setMapLoaded(true);
      
      // Add source and layers for the directions route
      map.current!.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        }
      });
      
      map.current!.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 6,
          'line-opacity': 0.8
        }
      });
      
      // Add outline for the route
      map.current!.addLayer({
        id: 'route-outline',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#ffffff',
          'line-width': 10,
          'line-opacity': 0.4
        }
      }, 'route');
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

    console.log("Updating user location on map:", userLocation);

    // Remove existing user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    // Create user marker element
    const userMarkerElement = document.createElement('div');
    userMarkerElement.className = 'user-marker flex items-center justify-center relative';
    userMarkerElement.style.width = '24px';
    userMarkerElement.style.height = '24px';
    
    // Add a dot in the center
    const userDot = document.createElement('div');
    userDot.className = 'w-4 h-4 bg-blue-500 rounded-full border-2 border-white z-10';
    userMarkerElement.appendChild(userDot);

    // Add pulsating animation
    const pulseRing = document.createElement('div');
    pulseRing.className = 'absolute w-12 h-12 rounded-full border-4 border-blue-300 animate-ping';
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

    console.log("Updating station markers, count:", stations.length);
    console.log("Stations data:", JSON.stringify(stations.slice(0, 2)));
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Create and add station markers
    stations.forEach(station => {
      const { latitude, longitude } = station.addressInfo;
      
      // Create marker element
      const markerElement = document.createElement('div');
      markerElement.className = `station-marker flex items-center justify-center relative p-1`;
      markerElement.style.width = '40px';
      markerElement.style.height = '40px';
      
      // Add background based on status
      const bgColor = station.status === 'available' ? 'bg-green-100' : 
                      station.status === 'busy' ? 'bg-yellow-100' : 'bg-red-100';
      
      const iconColor = station.status === 'available' ? 'text-green-500' : 
                        station.status === 'busy' ? 'text-yellow-500' : 'text-red-500';
      
      // Create background circle
      const bgCircle = document.createElement('div');
      bgCircle.className = `absolute w-8 h-8 ${bgColor} rounded-full border border-gray-300`;
      markerElement.appendChild(bgCircle);
      
      // Add icon to marker
      const icon = document.createElement('div');
      icon.innerHTML = `<svg class="${iconColor} z-10" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 2h10"></path><path d="M9 11V7"></path><path d="M15 11V7"></path><path d="M11 15v-3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"></path><path d="M5 22v-3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3"></path><path d="M11 1v3"></path><circle cx="11" cy="11" r="2"></circle></svg>`;
      markerElement.appendChild(icon);

      console.log(`Adding marker at: [${longitude}, ${latitude}] for station: ${station.addressInfo.title}`);

      // Create enhanced popup for the marker
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
        maxWidth: '300px',
        className: 'custom-popup'
      }).setHTML(`
        <div class="p-3 text-sm">
          <div class="mb-2">
            <h3 class="font-bold text-base text-gray-900 dark:text-gray-100">${station.addressInfo.title}</h3>
            <div class="flex items-center mt-1">
              <div class="w-2 h-2 rounded-full ${
                station.status === 'available' ? 'bg-green-500' : 
                station.status === 'busy' ? 'bg-yellow-500' : 'bg-red-500'
              } mr-1.5"></div>
              <span class="text-xs font-medium ${
                station.status === 'available' ? 'text-green-700 dark:text-green-400' : 
                station.status === 'busy' ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-700 dark:text-red-400'
              } capitalize">${station.status || 'Unknown'}</span>
            </div>
          </div>
          
          <div class="border-t border-gray-200 dark:border-gray-700 my-2 pt-2">
            <p class="text-xs text-gray-600 dark:text-gray-300">${station.addressInfo.addressLine1 || ''}</p>
            <p class="text-xs text-gray-600 dark:text-gray-300">
              ${station.addressInfo.town || ''}${station.addressInfo.town && station.addressInfo.stateOrProvince ? ', ' : ''}${station.addressInfo.stateOrProvince || ''}
            </p>
          </div>
          
          ${station.connections && station.connections.length > 0 ? `
            <div class="border-t border-gray-200 dark:border-gray-700 my-2 pt-2">
              <p class="text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Charging Details:</p>
              <div class="flex flex-col gap-1">
                ${station.connections.map(conn => `
                  <div class="flex items-center text-xs text-gray-600 dark:text-gray-300">
                    <svg class="w-3 h-3 mr-1 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M7 2h10"></path><path d="M9 11V7"></path><path d="M15 11V7"></path>
                      <path d="M11 15v-3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"></path>
                    </svg>
                    ${conn.connectionType?.title || 'Unknown'} • ${conn.powerKW ? conn.powerKW + ' kW' : 'Unknown power'}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <div class="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <p class="text-xs font-medium text-blue-600 dark:text-blue-400">
              ${station.distance ? station.distance.toFixed(1) + ' km away' : 'Distance unknown'}
            </p>
            <p class="text-xs font-medium ${
              station.usageCost === 'Rp0/kWh' || station.usageCost === 'Free' ? 
              'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-300'
            }">${station.usageCost || 'Price unknown'}</p>
          </div>
          
          <button class="mt-2 w-full px-3 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors" 
            onclick="document.dispatchEvent(new CustomEvent('station-select', {detail: '${station.id}'}))">
            View Details
          </button>
        </div>
      `);

      // Set up event listener for the custom button
      document.addEventListener('station-select', (e: Event) => {
        const customEvent = e as CustomEvent;
        const selectedId = customEvent.detail;
        const selectedStation = stations.find(s => s.id.toString() === selectedId);
        if (selectedStation) {
          onStationClick(selectedStation);
        }
      });

      // Create marker
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([longitude, latitude])
        .setPopup(popup)
        .addTo(map.current!);

      // Add click handler
      marker.getElement().addEventListener('click', () => {
        console.log("Station clicked:", station.addressInfo.title);
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

  // Update directions route on the map
  useEffect(() => {
    if (!map.current || !mapLoaded || !directionsRoute) return;
    
    console.log("Updating route on map");
    
    // Update the route source with new data
    if (map.current.getSource('route')) {
      (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData(directionsRoute);
    }
    
    // Fit the map to the route bounds if available
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
      
      {/* Station count overlay */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-80 p-2 rounded-lg shadow-md">
        <p className="text-sm font-medium">
          {stations.length > 0 
            ? `${stations.length} Stasiun Ditemukan` 
            : userLocation 
              ? "Tidak ada stasiun dalam radius pencarian" 
              : "Waiting for location..."}
        </p>
      </div>
      
      {/* Route info overlay - only shown when directions are active */}
      {directionsRoute && directionsRoute.properties?.distance && directionsRoute.properties?.duration && (
        <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-md">
          <div className="text-sm">
            <p className="font-medium">Info Rute</p>
            <p>Jarak: {(directionsRoute.properties.distance / 1000).toFixed(1)} km</p>
            <p>Waktu: {Math.round(directionsRoute.properties.duration / 60)} menit</p>
          </div>
        </div>
      )}
      
      {/* Debug info - only shown in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-20 right-4 bg-white bg-opacity-80 p-2 rounded-lg shadow-md max-w-xs text-xs overflow-auto max-h-40">
          <p className="font-medium">Debug Info:</p>
          <p>Map Loaded: {mapLoaded ? 'Yes' : 'No'}</p>
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
