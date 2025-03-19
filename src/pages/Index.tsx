import React, { useState, useEffect, useCallback } from 'react';
import Map from '../components/Map';
import SearchBar from '../components/SearchBar';
import StationList from '../components/StationList';
import RouteManager from '../components/RouteManager';
import LocationButton from '../components/LocationButton';
import { ChargingStation, fetchNearbyStations, searchStations } from '../utils/api';
import { calculateDistance } from '../utils/distance';
import { getDirections, getMultiStopDirections } from '../utils/directions';
import { toast } from '../components/ui/use-toast';
import { Toaster } from '../components/ui/toaster';
import { Button } from '../components/ui/button';
import { Route } from 'lucide-react';

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
  const [searchedLocation, setSearchedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  // Route planning state
  const [selectedStops, setSelectedStops] = useState<ChargingStation[]>([]);
  const [routeTotalDistance, setRouteTotalDistance] = useState<number | undefined>(undefined);
  const [routeTotalDuration, setRouteTotalDuration] = useState<number | undefined>(undefined);
  const [isRoutePlanActive, setIsRoutePlanActive] = useState(false);
  
  // UI state
  const [expanded, setExpanded] = useState(false);
  
  // Load stations when user location is available
  const loadStations = useCallback(async (location?: { latitude: number; longitude: number }) => {
    const targetLocation = location || userLocation;
    
    if (!targetLocation) {
      console.log("Location not available yet, can't load stations");
      return;
    }
    
    setIsLoading(true);
    console.log("Loading stations near", targetLocation);
    
    try {
      const data = await fetchNearbyStations({
        latitude: targetLocation.latitude,
        longitude: targetLocation.longitude,
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
                     { latitude: targetLocation.latitude, longitude: targetLocation.longitude },
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
          description: "Tidak ada stasiun pengisian kendaraan listrik yang ditemukan di sekitar lokasi ini.",
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
        
        // Clear any existing directions when location changes
        setDirectionsRoute(null);
        
        // Clear the searched location
        setSearchedLocation(null);
        
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

  // Handle location search
  const handleLocationSearch = useCallback((location: { latitude: number; longitude: number }) => {
    console.log("Location search result:", location);
    
    // Clear any existing directions
    setDirectionsRoute(null);
    
    // Set the searched location
    setSearchedLocation(location);
    
    // Load stations around this location
    loadStations(location);
    
    // Toast notification
    toast({
      title: "Lokasi ditemukan",
      description: "Menampilkan stasiun pengisian di sekitar lokasi yang dicari.",
    });
  }, [loadStations]);

  // Search stations by query
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    
    // Clear directions
    setDirectionsRoute(null);
    
    if (!query.trim()) {
      // If query is empty and we have user location, just show all stations around user
      if (userLocation) {
        setSearchedLocation(null);
        loadStations();
      }
      return;
    }
    
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
      
      const results = await searchStations(query, {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        maxResults: 100
      });
      
      console.log(`Search returned ${results.length} stations`);
      
      if (results && results.length > 0) {
        const resultsWithDistance = results.map(station => ({
          ...station,
          distance: station.distance || 
                   (station.addressInfo ? calculateDistance(
                     { latitude: userLocation.latitude, longitude: userLocation.longitude },
                     { latitude: station.addressInfo.latitude, longitude: station.addressInfo.longitude }
                   ) : 0)
        }));
        
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
      
      setFilteredStations([]);
    } finally {
      setIsLoading(false);
    }
  }, [userLocation, getUserLocation, loadStations]);

  // Handle station selection
  const handleStationSelect = useCallback((station: ChargingStation) => {
    setSelectedStation(station);
    setExpanded(false);
    
    // In route planning mode, add to selected stops
    if (isRoutePlanActive) {
      // Check if station is already in selected stops
      const isAlreadySelected = selectedStops.some(stop => String(stop.id) === String(station.id));
      
      if (!isAlreadySelected) {
        setSelectedStops(prev => [...prev, station]);
        
        toast({
          title: "Ditambahkan ke rute",
          description: `${station.addressInfo.title} ditambahkan ke rute perjalanan.`,
        });
      } else {
        toast({
          title: "Sudah ditambahkan",
          description: "Stasiun ini sudah ada dalam rute perjalanan Anda.",
          variant: "destructive"
        });
      }
    } else {
      // Clear directions when selecting a new station in normal mode
      setDirectionsRoute(null);
    }
  }, [selectedStops, isRoutePlanActive]);

  // Remove a stop from the route
  const handleRemoveStop = useCallback((stopId: string | number) => {
    setSelectedStops(prevStops => prevStops.filter(stop => String(stop.id) !== String(stopId)));
    
    toast({
      title: "Dihapus dari rute",
      description: "Stasiun dihapus dari rute perjalanan Anda.",
    });
    
    // Clear directions when stops change
    setDirectionsRoute(null);
    setRouteTotalDistance(undefined);
    setRouteTotalDuration(undefined);
  }, []);

  // Clear all stops from the route
  const handleClearRoute = useCallback(() => {
    setSelectedStops([]);
    setDirectionsRoute(null);
    setRouteTotalDistance(undefined);
    setRouteTotalDuration(undefined);
    
    toast({
      title: "Rute dihapus",
      description: "Semua stasiun dihapus dari rute perjalanan Anda.",
    });
  }, []);

  // Toggle route planning mode
  const toggleRoutePlanMode = useCallback(() => {
    const newMode = !isRoutePlanActive;
    setIsRoutePlanActive(newMode);
    
    if (newMode) {
      toast({
        title: "Mode rute diaktifkan",
        description: "Pilih stasiun pengisian untuk menambahkannya ke rute perjalanan Anda.",
      });
      
      // If we have a selected station, add it as the first stop
      if (selectedStation) {
        setSelectedStops([selectedStation]);
      } else if (userLocation) {
        // Create a pseudo-station for user location
        const userStation: ChargingStation = {
          id: -1,
          uuid: "user-location",
          addressInfo: {
            id: -1,
            title: "Lokasi Anda",
            addressLine1: "Lokasi saat ini",
            town: "",
            stateOrProvince: "",
            postcode: "",
            country: {
              id: 0,
              isoCode: "ID",
              title: "Indonesia"
            },
            latitude: userLocation.latitude,
            longitude: userLocation.longitude
          },
          connections: [],
          status: "available",
          usageCost: ""
        };
        
        setSelectedStops([userStation]);
      }
    } else {
      // Clear route planning data when disabling
      setSelectedStops([]);
      setDirectionsRoute(null);
      setRouteTotalDistance(undefined);
      setRouteTotalDuration(undefined);
      
      toast({
        title: "Mode rute dinonaktifkan",
        description: "Mode perencanaan rute telah dinonaktifkan.",
      });
    }
  }, [isRoutePlanActive, selectedStation, userLocation]);

  // Get directions for the planned route
  const handleStartRoute = useCallback(async () => {
    if (selectedStops.length < 2) {
      toast({
        title: "Rute tidak lengkap",
        description: "Anda memerlukan minimal 2 stasiun untuk merencanakan rute.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoadingDirections(true);
    toast({
      title: "Memuat rute",
      description: "Sedang menghitung rute optimal melalui semua stasiun...",
    });
    
    try {
      const route = await getMultiStopDirections(
        selectedStops,
        'pk.eyJ1IjoiYW5nZzB4IiwiYSI6ImNtOGU0b3ZleDAzMW4ycW9mbHY1YXhtdTQifQ.cZL2sxCvBSXQDSqZ1aL-hQ'
      );
      
      if (route) {
        setDirectionsRoute(route);
        
        // Set total distance and duration
        setRouteTotalDistance(route.properties?.distance);
        setRouteTotalDuration(route.properties?.duration);
        
        toast({
          title: "Rute berhasil dihitung",
          description: `${selectedStops.length} stasiun, Jarak: ${(route.properties?.distance / 1000).toFixed(1)} km, Waktu: ${Math.round(route.properties?.duration / 60)} menit`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error rute",
          description: "Gagal menghitung rute melalui stasiun yang dipilih.",
        });
      }
    } catch (error) {
      console.error("Multi-stop directions error:", error);
      toast({
        variant: "destructive",
        title: "Error rute",
        description: "Gagal mendapatkan petunjuk arah. Silakan coba lagi nanti.",
      });
    } finally {
      setIsLoadingDirections(false);
    }
  }, [selectedStops]);

  // Get directions using Mapbox Directions API
  const handleDirectionsClick = useCallback(async (station: ChargingStation) => {
    // If route planning is active, add to stops
    if (isRoutePlanActive) {
      handleStationSelect(station);
      return;
    }
    
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
        apiKey: 'pk.eyJ1IjoiYW5nZzB4IiwiYSI6ImNtOGU0b3ZleDAzMW4ycW9mbHY1YXhtdTQifQ.cZL2sxCvBSXQDSqZ1aL-hQ'
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
  }, [userLocation, isRoutePlanActive, handleStationSelect]);

  // Load stations when user location changes
  useEffect(() => {
    if (userLocation) {
      loadStations();
    }
  }, [userLocation, loadStations]);

  // Try to get user location automatically on component mount
  useEffect(() => {
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
      <div className="absolute top-4 left-0 right-0 z-10 px-4 md:px-6 mx-auto max-w-2xl animate-fade-in flex justify-center">
        <div className="w-full md:w-full lg:w-[32rem] mr-8 sm:mr-12 md:mr-16">
          <SearchBar 
            onSearch={handleSearch}
            onLocationSearch={handleLocationSearch}
            isLoading={isLoading}
            onGetUserLocation={getUserLocation}
            isLocating={isLocating}
          />
        </div>
      </div>
      
      {/* Map */}
      <div className="h-full w-full">
        <Map 
          stations={filteredStations}
          userLocation={userLocation}
          onStationClick={handleStationSelect}
          selectedStation={selectedStation}
          directionsRoute={directionsRoute}
          searchedLocation={searchedLocation}
        />
      </div>
      
      {/* Route Manager - Shows when route planning is active */}
      <RouteManager
        selectedStops={selectedStops}
        onRemoveStop={handleRemoveStop}
        onClearRoute={handleClearRoute}
        onStartRoute={handleStartRoute}
        isRouteActive={isRoutePlanActive}
        totalDistance={routeTotalDistance}
        totalDuration={routeTotalDuration}
        isLoading={isLoadingDirections}
      />
      
      {/* Route Planning Toggle Button */}
      {userLocation && !locationRequired && (
        <div className="absolute top-20 left-4 z-10">
          <Button
            variant={isRoutePlanActive ? "default" : "outline"}
            size="sm"
            className={`text-xs ${isRoutePlanActive ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
            onClick={toggleRoutePlanMode}
          >
            <Route className="h-4 w-4 mr-1.5" />
            {isRoutePlanActive ? 'Mode Rute Aktif' : 'Rencanakan Rute'}
          </Button>
        </div>
      )}
      
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
        <div className="absolute top-32 left-4 z-10 bg-white bg-opacity-80 p-2 rounded-lg shadow-md max-w-xs text-xs overflow-auto">
          <p className="font-bold">Debug Info:</p>
          <p>User Location: {userLocation ? `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}` : 'None'}</p>
          <p>Searched Location: {searchedLocation ? `${searchedLocation.latitude.toFixed(4)}, ${searchedLocation.longitude.toFixed(4)}` : 'None'}</p>
          <p>All Stations: {stations.length}</p>
          <p>Filtered Stations: {filteredStations.length}</p>
          <p>Route Stops: {selectedStops.length}</p>
          <p>Route Mode: {isRoutePlanActive ? 'Active' : 'Inactive'}</p>
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
            selectedStops={selectedStops}
            isRoutePlanActive={isRoutePlanActive}
          />
        </div>
      )}
    </div>
  );
};

export default Index;
