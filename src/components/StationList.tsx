
import React from 'react';
import { ChargingStation } from '../utils/api';
import StationCard from './StationCard';
import { ChevronUp, ChevronDown, Loader2, MapPin, Route } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

interface StationListProps {
  stations: ChargingStation[];
  isLoading: boolean;
  onStationSelect: (station: ChargingStation) => void;
  onDirectionsClick: (station: ChargingStation) => void;
  expanded: boolean;
  onToggleExpand: () => void;
  isLoadingDirections?: boolean;
  selectedStops?: ChargingStation[];
  isRoutePlanActive?: boolean;
}

const StationList: React.FC<StationListProps> = ({
  stations,
  isLoading,
  onStationSelect,
  onDirectionsClick,
  expanded,
  onToggleExpand,
  isLoadingDirections = false,
  selectedStops = [],
  isRoutePlanActive = false
}) => {
  // Get the active station (the one we're getting directions for)
  const getActiveStationId = () => {
    // For simplicity, we'll assume the active station is the one that directions are being loaded for
    // In a real app, you'd track this state more explicitly
    return isLoadingDirections && stations && stations.length > 0 ? stations[0]?.id : null;
  };
  
  // Check if a station is in the route
  const isStationInRoute = (stationId: string | number) => {
    return selectedStops.some(stop => stop.id === stationId);
  };
  
  // Get the index of a station in the route
  const getStationRouteIndex = (stationId: string | number) => {
    return selectedStops.findIndex(stop => stop.id === stationId);
  };
  
  // Add debug logging to help troubleshoot
  console.log("StationList render:", {
    stationsLength: stations?.length || 0,
    isLoading,
    stationsData: stations || "No stations data",
    selectedStopsLength: selectedStops?.length || 0
  });
  
  // Make sure stations is always an array to prevent issues
  const safeStations = Array.isArray(stations) ? stations : [];
  
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center">
          Stasiun Pengisian Terdekat
          {isRoutePlanActive && (
            <span className="ml-2 text-sm font-normal text-blue-500 flex items-center">
              <Route className="h-4 w-4 mr-1" />
              Mode Rute Aktif
            </span>
          )}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center text-muted-foreground hover:text-foreground"
          onClick={onToggleExpand}
        >
          {expanded ? (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              <span className="text-sm">Ciutkan</span>
            </>
          ) : (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              <span className="text-sm">Perluas</span>
            </>
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Memuat stasiun pengisian...</p>
        </div>
      ) : safeStations.length === 0 ? (
        <div className="text-center py-8">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mt-4">Tidak ada stasiun pengisian ditemukan.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Coba ubah lokasi Anda atau perluas area pencarian.
          </p>
        </div>
      ) : (
        <ScrollArea className={expanded ? "h-[60vh]" : "h-[230px]"}>
          <div className="grid grid-cols-1 gap-4 pr-2">
            {safeStations.map((station) => {
              // Extra validation to ensure station has all required properties
              if (!station || !station.id || !station.addressInfo) {
                console.warn("Invalid station data:", station);
                return null;
              }
              
              const isInRoute = isStationInRoute(station.id);
              const routeIndex = isInRoute ? getStationRouteIndex(station.id) : undefined;
              
              return (
                <div key={String(station.id)} onClick={() => onStationSelect(station)}>
                  <StationCard 
                    station={station} 
                    onDirectionsClick={onDirectionsClick} 
                    isLoadingDirections={isLoadingDirections && String(station.id) === String(getActiveStationId())}
                    isActive={String(station.id) === String(getActiveStationId())}
                    isInRoute={isInRoute}
                    routeIndex={routeIndex}
                  />
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default StationList;
