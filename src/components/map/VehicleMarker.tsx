
import mapboxgl from 'mapbox-gl';
import React from 'react';

interface VehicleMarkerProps {
  map: mapboxgl.Map;
  location: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
  };
  markerRef: React.MutableRefObject<mapboxgl.Marker | null>;
}

export const createVehicleMarker = ({ map, location, markerRef }: VehicleMarkerProps) => {
  // Remove existing marker if it exists
  if (markerRef.current) {
    // Instead of removing it, update its position for smoother animation
    markerRef.current.setLngLat([location.longitude, location.latitude]);
    
    // Update rotation if heading is available
    if (location.heading !== undefined) {
      const markerElement = markerRef.current.getElement();
      const headingIndicator = markerElement.querySelector('.heading-indicator');
      if (headingIndicator) {
        (headingIndicator as HTMLElement).style.transform = `rotate(${location.heading}deg)`;
      }
    }
    
    return markerRef.current;
  }

  // Create marker element if it doesn't exist
  const markerElement = document.createElement('div');
  markerElement.className = 'vehicle-marker flex items-center justify-center relative';
  markerElement.style.width = '32px';
  markerElement.style.height = '32px';

  // Base circle
  const bgCircle = document.createElement('div');
  bgCircle.className = 'absolute inset-0 m-auto bg-blue-500 rounded-full border-2 border-white shadow-lg';
  markerElement.appendChild(bgCircle);

  // Pulsing animation
  const pulseRing = document.createElement('div');
  pulseRing.className = 'absolute w-12 h-12 rounded-full border-4 border-blue-300 animate-ping opacity-75';
  markerElement.appendChild(pulseRing);

  // Add heading indicator if available
  if (location.heading !== undefined) {
    const heading = document.createElement('div');
    heading.className = 'heading-indicator absolute w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[12px] border-b-white';
    heading.style.transform = `rotate(${location.heading}deg)`;
    heading.style.top = '-6px';
    markerElement.appendChild(heading);
  }

  // Create the marker and store it in the ref
  markerRef.current = new mapboxgl.Marker({
    element: markerElement,
    anchor: 'center',
  })
    .setLngLat([location.longitude, location.latitude])
    .addTo(map);

  return markerRef.current;
};
