
import mapboxgl from 'mapbox-gl';
import { useEffect, useRef } from 'react';

interface VehicleMarkerProps {
  map: mapboxgl.Map;
  location: {
    latitude: number;
    longitude: number;
    heading?: number;
  };
}

export const createVehicleMarker = ({ map, location }: VehicleMarkerProps) => {
  const markerElement = document.createElement('div');
  markerElement.className = 'vehicle-marker flex items-center justify-center relative';
  markerElement.style.width = '32px';
  markerElement.style.height = '32px';

  const bgCircle = document.createElement('div');
  bgCircle.className = 'absolute inset-0 m-auto bg-blue-500 rounded-full border-2 border-white shadow-lg';
  markerElement.appendChild(bgCircle);

  const pulseRing = document.createElement('div');
  pulseRing.className = 'absolute w-12 h-12 rounded-full border-4 border-blue-300 animate-ping opacity-75';
  markerElement.appendChild(pulseRing);

  if (location.heading !== undefined) {
    const heading = document.createElement('div');
    heading.className = 'absolute w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[12px] border-b-white';
    heading.style.transform = `rotate(${location.heading}deg)`;
    heading.style.top = '-6px';
    markerElement.appendChild(heading);
  }

  const marker = new mapboxgl.Marker({
    element: markerElement,
    anchor: 'center',
  })
    .setLngLat([location.longitude, location.latitude])
    .addTo(map);

  return marker;
};
