
import React, { useState } from 'react';
import { ChargingStation } from '../utils/api';
import { X, MapPin, Route, Trash2, Clock, Navigation } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { formatDistance } from '../utils/distance';
import { formatDuration } from '../utils/directions';
import { cn } from '@/lib/utils';

interface RouteManagerProps {
  selectedStops: ChargingStation[];
  onRemoveStop: (stopId: string | number) => void;
  onClearRoute: () => void;
  onStartRoute: () => void;
  isRouteActive: boolean;
  totalDistance?: number;
  totalDuration?: number;
  isLoading?: boolean;
}

const RouteManager: React.FC<RouteManagerProps> = ({
  selectedStops,
  onRemoveStop,
  onClearRoute,
  onStartRoute,
  isRouteActive,
  totalDistance,
  totalDuration,
  isLoading = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (selectedStops.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      "absolute bg-white shadow-lg rounded-lg p-3 transition-all duration-300 w-80",
      expanded ? "top-20 right-4 left-auto h-auto" : "top-20 right-4 left-auto h-auto",
      "z-10 sm:w-96"
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Route className="h-5 w-5 mr-2 text-blue-500" />
          <h3 className="font-semibold text-sm">Rute Perjalanan</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0" 
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 
              <X className="h-4 w-4 text-gray-500" /> :
              <span className="text-xs font-medium text-blue-500">{selectedStops.length}</span>
            }
          </Button>
        </div>
      </div>

      {expanded && (
        <>
          <ScrollArea className="max-h-60 pr-2">
            <div className="space-y-3 mt-2">
              {selectedStops.map((stop, index) => (
                <div 
                  key={String(stop.id)}
                  className="flex items-start bg-gray-50 rounded-md p-2 relative"
                >
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-700 text-xs font-medium mr-2 mt-1">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1">{stop.addressInfo.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {stop.addressInfo.addressLine1}, {stop.addressInfo.town}
                    </p>
                    {stop.distance !== undefined && (
                      <div className="flex items-center mt-1">
                        <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                        <span className="text-xs text-gray-500">{formatDistance(stop.distance)}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-1 absolute top-1 right-1"
                    onClick={() => onRemoveStop(stop.id)}
                  >
                    <X className="h-3 w-3 text-gray-400" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex flex-col mt-3 pt-2 border-t border-gray-100">
            {(totalDistance || totalDuration) && (
              <div className="flex items-center justify-between mb-2 text-xs text-gray-600">
                <div className="flex items-center">
                  <Navigation className="h-3.5 w-3.5 mr-1 text-blue-500" />
                  <span>{totalDistance ? `${(totalDistance/1000).toFixed(1)} km` : 'Jarak tidak diketahui'}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-3.5 w-3.5 mr-1 text-blue-500" />
                  <span>{totalDuration ? formatDuration(totalDuration) : 'Waktu tidak diketahui'}</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mt-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-8"
                onClick={onClearRoute}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Hapus Rute
              </Button>
              <Button
                variant="default"
                size="sm"
                className="flex-1 text-xs h-8 bg-blue-500 hover:bg-blue-600"
                onClick={onStartRoute}
                disabled={selectedStops.length < 2 || isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="h-3.5 w-3.5 mr-1.5 animate-spin">◌</span>
                    Memproses...
                  </>
                ) : (
                  <>
                    <Navigation className="h-3.5 w-3.5 mr-1.5" />
                    Mulai Rute
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RouteManager;
