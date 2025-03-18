import React, { useState, useEffect, useCallback } from 'react';
import Map from '../components/Map';
import SearchBar from '../components/SearchBar';
import StationList from '../components/StationList';
import LocationButton from '../components/LocationButton';
import { ChargingStation, fetchNearbyStations, searchStations, mapApiResponse } from '../utils/api';
import { calculateDistance } from '../utils/distance';
import { toast } from '../components/ui/use-toast';
import { Toaster } from '../components/ui/toaster';

const Index = () => {
  // State for map and stations
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [filteredStations, setFilteredStations] = useState<ChargingStation[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  
  // UI state
  const [expanded, setExpanded] = useState(false);
  
  // Load stations when user location is available
  const loadStations = useCallback(async () => {
    if (!userLocation) return;
    
    setIsLoading(true);
    console.log("Loading stations near", userLocation);
    
    try {
      let data = await fetchNearbyStations({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        distance: 15,
        maxResults: 100
      });
      
      console.log("Loaded stations:", data.length);
      
      if (data.length === 0) {
        console.log("No stations found, checking if response needs mapping");
        
        // This is a fallback in case the data doesn't match our expected format
        const response = await fetch(`https://api.openchargemap.io/v3/poi/?latitude=${userLocation.latitude}&longitude=${userLocation.longitude}&distance=15&distanceunit=km&maxresults=100&verbose=false&output=json&key=d7609f7a-6dca-4bd4-a531-ce798439da2c`);
        
        if (response.ok) {
          const rawData = await response.json();
          console.log("Raw API response:", rawData.length, "items");
          
          if (Array.isArray(rawData) && rawData.length > 0) {
            // Map the raw data to our ChargingStation structure
            data = mapApiResponse(rawData);
            console.log("Mapped stations:", data.length);
          }
        }
      }
      
      // Calculate distance for each station if not already present
      data = data.map(station => ({
        ...station,
        distance: station.distance || calculateDistance(
          { latitude: userLocation.latitude, longitude: userLocation.longitude },
          { latitude: station.addressInfo.latitude, longitude: station.addressInfo.longitude }
        )
      }));
      
      // Sort by distance
      data.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
      setStations(data);
      setFilteredStations(data);
      
      if (data.length > 0) {
        toast({
          title: "Stasiun ditemukan",
          description: `${data.length} stasiun pengisian kendaraan listrik terdekat ditemukan.`,
        });
      } else {
        toast({
          title: "Tidak ada stasiun",
          description: "Tidak ada stasiun pengisian kendaraan listrik yang ditemukan di sekitar Anda.",
        });
      }
    } catch (error) {
      console.error("Failed to load stations:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal memuat stasiun pengisian. Silakan coba lagi nanti.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userLocation]);

  // Get user's current location
  const getUserLocation = useCallback(() => {
    setIsLocating(true);
    console.log("Getting user location...");
    
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Geolocation tidak didukung oleh browser Anda.",
      });
      setIsLocating(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("User location obtained:", latitude, longitude);
        setUserLocation({ latitude, longitude });
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast({
          variant: "destructive",
          title: "Error lokasi",
          description: `Tidak dapat mengakses lokasi Anda: ${error.message}`,
        });
        setIsLocating(false);
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, []);

  // Search stations by query
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    
    if (!userLocation) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Lokasi pengguna diperlukan untuk pencarian.",
      });
      return;
    }
    
    if (!query.trim()) {
      setFilteredStations(stations);
      return;
    }
    
    setIsLoading(true);
    try {
      let results;
      
      // If we already have stations loaded, filter them locally
      if (stations.length > 0 && query.trim()) {
        results = stations.filter(station => {
          const name = station.addressInfo.title.toLowerCase();
          const address = `${station.addressInfo.addressLine1} ${station.addressInfo.town}`.toLowerCase();
          const searchTerms = query.toLowerCase();
          
          return name.includes(searchTerms) || address.includes(searchTerms);
        });
      } else {
        // Otherwise, fetch from API
        results = await searchStations(query, {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          distance: 50
        });
        
        // Calculate distance
        results = results.map(station => ({
          ...station,
          distance: calculateDistance(
            { latitude: userLocation.latitude, longitude: userLocation.longitude },
            { latitude: station.addressInfo.latitude, longitude: station.addressInfo.longitude }
          )
        }));
        
        // Sort by distance
        results.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }
      
      setFilteredStations(results);
      
      if (results.length === 0) {
        toast({
          title: "Tidak ada hasil",
          description: "Tidak ada stasiun pengisian yang cocok dengan pencarian Anda.",
        });
      } else {
        toast({
          title: "Hasil pencarian",
          description: `${results.length} stasiun pengisian ditemukan.`,
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        variant: "destructive",
        title: "Error pencarian",
        description: "Gagal mencari stasiun pengisian. Silakan coba lagi nanti.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [stations, userLocation]);

  // Handle station selection
  const handleStationSelect = useCallback((station: ChargingStation) => {
    setSelectedStation(station);
    setExpanded(false);
  }, []);

  // Open directions in Google Maps
  const handleDirectionsClick = useCallback((station: ChargingStation) => {
    if (!userLocation) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Lokasi pengguna diperlukan untuk petunjuk arah.",
      });
      return;
    }
    
    const { latitude, longitude } = station.addressInfo;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${latitude},${longitude}&travelmode=driving`;
    
    window.open(url, '_blank');
  }, [userLocation]);

  // Load stations when user location changes
  useEffect(() => {
    if (userLocation) {
      loadStations();
    }
  }, [userLocation, loadStations]);

  // Try to get user location automatically on component mount
  useEffect(() => {
    // Small delay to allow the UI to render first
    const timer = setTimeout(() => {
      if (!userLocation && !isLocating) {
        getUserLocation();
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative h-screen w-full bg-background overflow-hidden">
      <Toaster />
      
      {/* Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 animate-fade-in">
        <SearchBar 
          onSearch={handleSearch}
          isLoading={isLoading}
          onGetUserLocation={getUserLocation}
          isLocating={isLocating}
        />
      </div>
      
      {/* Map */}
      <div className="h-full w-full">
        <Map 
          stations={filteredStations}
          userLocation={userLocation}
          onStationClick={handleStationSelect}
          selectedStation={selectedStation}
        />
      </div>
      
      {/* Location Button - Only show if no user location yet */}
      {!userLocation && !isLocating && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-10 w-64 animate-slide-up">
          <LocationButton 
            onGetLocation={getUserLocation}
            isLocating={isLocating}
          />
        </div>
      )}
      
      {/* Debug Info - Only shown in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-20 left-4 z-10 bg-white bg-opacity-80 p-2 rounded-lg shadow-md max-w-xs text-xs overflow-auto">
          <p className="font-bold">Debug Info:</p>
          <p>User Location: {userLocation ? `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}` : 'None'}</p>
          <p>All Stations: {stations.length}</p>
          <p>Filtered Stations: {filteredStations.length}</p>
          <p>API Key: {API_KEY_SUBSTRING}</p>
          <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
        </div>
      )}
      
      {/* Station List */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-background rounded-t-xl shadow-lg animate-slide-up">
        <StationList 
          stations={filteredStations}
          isLoading={isLoading}
          onStationSelect={handleStationSelect}
          onDirectionsClick={handleDirectionsClick}
          expanded={expanded}
          onToggleExpand={() => setExpanded(!expanded)}
        />
      </div>
    </div>
  );
};

// For security, only show a substring of the API key in debug info
const API_KEY_SUBSTRING = 'd7609f7a-****-****-****-********da2c';

export default Index;
