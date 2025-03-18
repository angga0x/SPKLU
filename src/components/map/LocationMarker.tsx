
import mapboxgl from 'mapbox-gl';
import React from 'react';

interface LocationMarkerProps {
  map: mapboxgl.Map;
  location: { latitude: number; longitude: number };
  markerRef: React.MutableRefObject<mapboxgl.Marker | null>;
}

export const createLocationMarker = ({ map, location, markerRef }: LocationMarkerProps) => {
  // Remove existing marker if it exists
  if (markerRef.current) {
    markerRef.current.remove();
    markerRef.current = null;
  }

  // Create marker element
  const locationMarkerElement = document.createElement('div');
  locationMarkerElement.className = 'location-marker flex items-center justify-center relative';
  locationMarkerElement.style.width = '40px';
  locationMarkerElement.style.height = '40px';
  
  const markerPin = document.createElement('div');
  markerPin.className = 'absolute w-6 h-6 bg-yellow-500 rounded-full border-2 border-white shadow-lg z-10';
  locationMarkerElement.appendChild(markerPin);

  const pulseRing = document.createElement('div');
  pulseRing.className = 'absolute w-12 h-12 rounded-full border-4 border-yellow-300 animate-ping';
  locationMarkerElement.appendChild(pulseRing);

  // Create and store the marker
  markerRef.current = new mapboxgl.Marker({
    element: locationMarkerElement,
    anchor: 'center'
  })
    .setLngLat([location.longitude, location.latitude])
    .addTo(map);

  return markerRef.current;
};
