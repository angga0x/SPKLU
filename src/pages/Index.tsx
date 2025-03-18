import React, { useState, useEffect, useCallback } from 'react';
import Map from '../components/Map';
import SearchBar from '../components/SearchBar';
import StationList from '../components/StationList';
import LocationButton from '../components/LocationButton';
import { ChargingStation, fetchNearbyStations, searchStations } from '../utils/api';
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
    try {
      let data = await fetchNearbyStations({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        distance: 15,
        maxResults: 100
      });
      
      // Calculate distance for each station
      data = data.map(station => ({
        ...station,
        distance: calculateDistance(
          { latitude: userLocation.latitude, longitude: userLocation.longitude },
          { latitude: station.addressInfo.latitude, longitude: station.addressInfo.longitude }
        )
      }));
      
      // Sort by distance
      data.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
      setStations(data);
      setFilteredStations(data);
      
      toast({
        title: "Stasiun ditemukan",
        description: `${data.length} stasiun pengisian kendaraan listrik terdekat ditemukan.`,
      });
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

export default Index;
