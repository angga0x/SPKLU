
import React, { useRef } from 'react';
import { ChargingStation } from '../utils/api';
import StationCard from './StationCard';
import { ChevronUp, ChevronDown, Loader2, MapPin, Route } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { useVirtualizer } from '@tanstack/react-virtual';
import { compareIds } from '../lib/utils';

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
  // Reference for the scrollable parent element
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Get the active station (the one we're getting directions for)
  const getActiveStationId = () => {
    // For simplicity, we'll assume the active station is the one that directions are being loaded for
    // In a real app, you'd track this state more explicitly
    return isLoadingDirections && stations && stations.length > 0 ? stations[0]?.id : null;
  };
  
  // Check if a station is in the route
  const isStationInRoute = (stationId: string | number) => {
    return selectedStops.some(stop => compareIds(stop.id, stationId));
  };
  
  // Get the index of a station in the route
  const getStationRouteIndex = (stationId: string | number) => {
    return selectedStops.findIndex(stop => compareIds(stop.id, stationId));
  };
  
  // Add debug logging to help troubleshoot
  console.log("StationList render:", {
    stationsLength: stations?.length || 0,
    isLoading,
    selectedStopsLength: selectedStops?.length || 0
  });
  
  // Make sure stations is always an array to prevent issues
  const safeStations = Array.isArray(stations) ? stations : [];
  
  // Create the virtualizer
  const rowVirtualizer = useVirtualizer({
    count: safeStations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 320, // Approximate height of each station card in pixels
    overscan: 5, // Number of items to render before/after the visible area
  });

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
        <div 
          ref={parentRef} 
          className={expanded ? "h-[60vh] overflow-auto" : "h-[230px] overflow-auto"}
          style={{ position: 'relative' }}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map(virtualRow => {
              const station = safeStations[virtualRow.index];
              
              // Extra validation to ensure station has all required properties
              if (!station || !station.id || !station.addressInfo) {
                console.warn("Invalid station data:", station);
                return null;
              }
              
              const isInRoute = isStationInRoute(station.id);
              const routeIndex = isInRoute ? getStationRouteIndex(station.id) : undefined;
              
              return (
                <div
                  key={String(station.id)}
                  onClick={() => onStationSelect(station)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    padding: '8px 8px 8px 0',
                  }}
                >
                  <StationCard 
                    station={station} 
                    onDirectionsClick={onDirectionsClick} 
                    isLoadingDirections={isLoadingDirections && compareIds(station.id, getActiveStationId())}
                    isActive={compareIds(station.id, getActiveStationId())}
                    isInRoute={isInRoute}
                    routeIndex={routeIndex}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StationList;
