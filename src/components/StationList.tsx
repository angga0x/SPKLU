
import React from 'react';
import { ChargingStation } from '../utils/api';
import StationCard from './StationCard';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { ChevronUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StationListProps {
  stations: ChargingStation[];
  isLoading: boolean;
  onStationSelect: (station: ChargingStation) => void;
  onDirectionsClick: (station: ChargingStation) => void;
  className?: string;
  expanded: boolean;
  onToggleExpand: () => void;
}

const StationList: React.FC<StationListProps> = ({
  stations,
  isLoading,
  onStationSelect,
  onDirectionsClick,
  className,
  expanded,
  onToggleExpand
}) => {
  return (
    <div className={cn(
      "bg-background w-full transition-all duration-300 ease-in-out overflow-hidden", 
      expanded ? "h-[75vh]" : "h-64",
      className
    )}>
      {/* Header and Toggle */}
      <div className="sticky top-0 z-10 bg-background px-4 py-3 flex items-center justify-between border-b">
        <div>
          <h2 className="font-medium">
            {isLoading ? "Mencari..." : `${stations.length} Stasiun Ditemukan`}
          </h2>
          <p className="text-xs text-muted-foreground">
            {expanded ? "Tampilkan stasiun terdekat" : "Tampilkan stasiun terdekat"}
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggleExpand}
          className="h-8 w-8"
        >
          <ChevronUp className={cn(
            "h-5 w-5 transition-transform duration-300",
            expanded ? "rotate-0" : "rotate-180"
          )} />
          <span className="sr-only">
            {expanded ? "Collapse" : "Expand"}
          </span>
        </Button>
      </div>

      {/* Station List */}
      <div className="overflow-y-auto h-[calc(100%-48px)]">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : stations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 px-4 text-center">
            <p className="text-muted-foreground">Tidak ada stasiun pengisian yang ditemukan</p>
            <p className="text-sm text-muted-foreground mt-1">
              Coba ubah lokasi atau kata kunci pencarian Anda
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {stations.map((station, index) => (
              <div
                key={station.id}
                className="cursor-pointer transition-all duration-200 hover:scale-[1.01]"
                onClick={() => onStationSelect(station)}
              >
                <StationCard
                  station={station}
                  onDirectionsClick={onDirectionsClick}
                />
                {index < stations.length - 1 && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StationList;
