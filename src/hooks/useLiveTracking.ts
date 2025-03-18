
import { useState, useEffect, useCallback } from 'react';

interface Location {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp?: number;
}

interface UseLiveTrackingProps {
  enabled?: boolean;
  updateInterval?: number; // in milliseconds
  onLocationUpdate?: (location: Location) => void;
}

export const useLiveTracking = ({ 
  enabled = true, 
  updateInterval = 5000,
  onLocationUpdate
}: UseLiveTrackingProps = {}) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const updateLocation = useCallback((position: GeolocationPosition) => {
    const newLocation: Location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      heading: position.coords.heading || undefined,
      speed: position.coords.speed || undefined,
      timestamp: position.timestamp
    };
    
    setLocation(newLocation);
    onLocationUpdate?.(newLocation);
    setError(null);
  }, [onLocationUpdate]);

  const handleError = useCallback((error: GeolocationPositionError) => {
    let message = 'Error getting location';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Location permission denied';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Location information unavailable';
        break;
      case error.TIMEOUT:
        message = 'Location request timed out';
        break;
    }
    setError(message);
    setIsTracking(false);
  }, []);

  useEffect(() => {
    if (!enabled || !navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    let watchId: number;

    const startTracking = () => {
      setIsTracking(true);
      watchId = navigator.geolocation.watchPosition(
        updateLocation,
        handleError,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: updateInterval
        }
      );
    };

    startTracking();

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        setIsTracking(false);
      }
    };
  }, [enabled, updateInterval, updateLocation, handleError]);

  return {
    location,
    error,
    isTracking
  };
};
