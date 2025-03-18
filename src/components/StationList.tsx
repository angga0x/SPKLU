
import React from 'react';
import { ChargingStation } from '../utils/api';
import StationCard from './StationCard';
import { ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
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
}

const StationList: React.FC<StationListProps> = ({
  stations,
  isLoading,
  onStationSelect,
  onDirectionsClick,
  expanded,
  onToggleExpand,
  isLoadingDirections = false
}) => {
  // Get the active station (the one we're getting directions for)
  const getActiveStationId = () => {
    // For simplicity, we'll assume the active station is the one that directions are being loaded for
    // In a real app, you'd track this state more explicitly
    return isLoadingDirections ? stations[0]?.id : null;
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          Stasiun Pengisian Terdekat
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
      ) : stations.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Tidak ada stasiun pengisian ditemukan.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Coba ubah lokasi Anda atau perluas area pencarian.
          </p>
        </div>
      ) : (
        <ScrollArea className={expanded ? "h-[60vh]" : "h-[230px]"}>
          <div className="grid grid-cols-1 gap-4 pr-2">
            {stations.map((station) => (
              <div key={station.id} onClick={() => onStationSelect(station)}>
                <StationCard 
                  station={station} 
                  onDirectionsClick={onDirectionsClick} 
                  isLoadingDirections={isLoadingDirections && station.id === getActiveStationId()}
                  isActive={station.id === getActiveStationId()}
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default StationList;
