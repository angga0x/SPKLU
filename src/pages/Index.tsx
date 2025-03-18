
import React, { useState, useEffect, useCallback } from 'react';
import Map from '../components/Map';
import SearchBar from '../components/SearchBar';
import StationList from '../components/StationList';
import LocationButton from '../components/LocationButton';
import { ChargingStation, fetchNearbyStations, searchStations } from '../utils/api';
import { calculateDistance } from '../utils/distance';
import { getDirections } from '../utils/directions';
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
  const [directionsRoute, setDirectionsRoute] = useState<GeoJSON.Feature | null>(null);
  const [isLoadingDirections, setIsLoadingDirections] = useState(false);
  const [locationRequired, setLocationRequired] = useState(true);
  
  // UI state
  const [expanded, setExpanded] = useState(false);
  
  // Load stations when user location is available
  const loadStations = useCallback(async () => {
    if (!userLocation) {
      console.log("User location not available yet, can't load stations");
      return;
    }
    
    setIsLoading(true);
    console.log("Loading stations near", userLocation);
    
    try {
      const data = await fetchNearbyStations({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        distance: 15,
        maxResults: 100
      });
      
      console.log("Loaded stations:", data.length);
      
      if (data && data.length > 0) {
        // Calculate distance for each station if not already present
        const stationsWithDistance = data.map(station => ({
          ...station,
          distance: station.distance || 
                   (station.addressInfo ? calculateDistance(
                     { latitude: userLocation.latitude, longitude: userLocation.longitude },
                     { latitude: station.addressInfo.latitude, longitude: station.addressInfo.longitude }
                   ) : 0)
        }));
        
        // Sort by distance
        stationsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        
        setStations(stationsWithDistance);
        setFilteredStations(stationsWithDistance);
        setLocationRequired(false);
        
        console.log("Stations data processed and set:", stationsWithDistance.length);
        
        if (stationsWithDistance.length > 0) {
          toast({
            title: "Stasiun ditemukan",
            description: `${stationsWithDistance.length} stasiun pengisian kendaraan listrik terdekat ditemukan.`,
          });
        }
      } else {
        setStations([]);
        setFilteredStations([]);
        setLocationRequired(false);
        
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
      // Set empty arrays to prevent undefined errors
      setStations([]);
      setFilteredStations([]);
      setLocationRequired(false);
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
        setLocationRequired(false);
        setIsLocating(false);
        // Show toast notification
        toast({
          title: "Lokasi ditemukan",
          description: "Lokasi Anda berhasil ditemukan. Memuat stasiun terdekat...",
        });
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
        description: "Lokasi pengguna diperlukan untuk pencarian. Silakan aktifkan lokasi terlebih dahulu.",
      });
      getUserLocation();
      return;
    }
    
    setIsLoading(true);
    try {
      console.log(`Searching for stations with query: "${query}"`);
      
      // Use the updated searchStations function
      const results = await searchStations(query, {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        maxResults: 10
      });
      
      console.log(`Search returned ${results.length} stations`);
      
      if (results && results.length > 0) {
        // Calculate distance for each result
        const resultsWithDistance = results.map(station => ({
          ...station,
          distance: station.distance || 
                   (station.addressInfo ? calculateDistance(
                     { latitude: userLocation.latitude, longitude: userLocation.longitude },
                     { latitude: station.addressInfo.latitude, longitude: station.addressInfo.longitude }
                   ) : 0)
        }));
        
        // Sort by distance
        resultsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        
        setFilteredStations(resultsWithDistance);
        console.log("Filtered stations set:", resultsWithDistance.length);
        
        toast({
          title: "Hasil pencarian",
          description: `${resultsWithDistance.length} stasiun pengisian ditemukan.`,
        });
      } else {
        setFilteredStations([]);
        
        toast({
          title: "Tidak ada hasil",
          description: "Tidak ada stasiun pengisian yang cocok dengan pencarian Anda.",
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        variant: "destructive",
        title: "Error pencarian",
        description: "Gagal mencari stasiun pengisian. Silakan coba lagi nanti.",
      });
      
      // Set empty array to prevent undefined errors
      setFilteredStations([]);
    } finally {
      setIsLoading(false);
    }
  }, [userLocation, getUserLocation]);

  // Handle station selection
  const handleStationSelect = useCallback((station: ChargingStation) => {
    setSelectedStation(station);
    setExpanded(false);
    // Clear any existing directions when selecting a new station
    setDirectionsRoute(null);
  }, []);

  // Get directions using Mapbox Directions API
  const handleDirectionsClick = useCallback(async (station: ChargingStation) => {
    if (!userLocation) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Lokasi pengguna diperlukan untuk petunjuk arah.",
      });
      return;
    }
    
    setIsLoadingDirections(true);
    toast({
      title: "Memuat rute",
      description: "Sedang menghitung rute terbaik ke stasiun pengisian...",
    });
    
    try {
      const route = await getDirections({
        origin: [userLocation.latitude, userLocation.longitude],
        destination: [station.addressInfo.latitude, station.addressInfo.longitude],
        apiKey: 'pk.eyJ1IjoiYW5nZzB4IiwiYSI6ImNtOGU0b3ZleDAzMW4ycW9mbHY1YXhtdTQifQ.cZL2sxCvBSXQDSqZ1aL-hQ' // Mapbox API key
      });
      
      if (route) {
        setDirectionsRoute(route);
        setSelectedStation(station);
        
        toast({
          title: "Rute berhasil dihitung",
          description: `Jarak: ${(route.properties?.distance / 1000).toFixed(1)} km, Waktu: ${Math.round(route.properties?.duration / 60)} menit`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error rute",
          description: "Gagal menghitung rute ke stasiun pengisian.",
        });
      }
    } catch (error) {
      console.error("Directions error:", error);
      toast({
        variant: "destructive",
        title: "Error rute",
        description: "Gagal mendapatkan petunjuk arah. Silakan coba lagi nanti.",
      });
    } finally {
      setIsLoadingDirections(false);
    }
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
  }, [userLocation, isLocating, getUserLocation]);

  // Debug effect to log filtered stations
  useEffect(() => {
    console.log("Current filtered stations:", filteredStations.length);
  }, [filteredStations]);
  
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
          directionsRoute={directionsRoute}
        />
      </div>
      
      {/* Location Button - Only show if no user location yet */}
      {!userLocation && !isLocating && (
        <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 z-10 w-64 animate-slide-up">
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
          <p>Directions: {directionsRoute ? 'Active' : 'None'}</p>
        </div>
      )}
      
      {/* Station List - Only show if user location is found */}
      {!locationRequired && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-background rounded-t-xl shadow-lg animate-slide-up">
          <StationList 
            stations={filteredStations}
            isLoading={isLoading}
            onStationSelect={handleStationSelect}
            onDirectionsClick={handleDirectionsClick}
            expanded={expanded}
            onToggleExpand={() => setExpanded(!expanded)}
            isLoadingDirections={isLoadingDirections}
          />
        </div>
      )}
    </div>
  );
};

// For security, only show a substring of the API key in debug info
const API_KEY_SUBSTRING = 'd7609f7a-****-****-****-********da2c';

export default Index;
