
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { ChargingStation } from '../utils/api';

interface UseMapboxProps {
  apiKey: string;
  defaultLocation?: { latitude: number; longitude: number };
  onStationClick: (station: ChargingStation) => void;
}

export const useMapbox = ({ apiKey, defaultLocation, onStationClick }: UseMapboxProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const initializeMap = () => {
    if (!mapContainer.current || map.current) return;

    console.log("Initializing map with API key:", apiKey);
    mapboxgl.accessToken = apiKey;

    const center = defaultLocation || { 
      latitude: -6.200000, 
      longitude: 106.816666 
    };

    console.log("Map center:", center);

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [center.longitude, center.latitude],
      zoom: 12,
      pitch: 0,
      attributionControl: false
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    map.current.addControl(
      new mapboxgl.AttributionControl({
        compact: true
      }),
      'bottom-right'
    );

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

    map.current.on('load', () => {
      console.log("Map loaded successfully");
      setMapLoaded(true);
      
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
  };

  const clearMap = () => {
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
  };

  return {
    mapContainer,
    map,
    mapLoaded,
    markersRef,
    userMarkerRef,
    initializeMap,
    clearMap
  };
};
