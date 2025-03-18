import React from 'react';
import { ChargingStation } from '../utils/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Navigation, Phone, Globe, Info, MapPin, Zap, Clock, ExternalLink, CreditCard, Plug, Cable, Loader2 } from 'lucide-react';
import { formatDistance } from '../utils/distance';
import { cn } from '@/lib/utils';
interface StationCardProps {
  station: ChargingStation;
  onDirectionsClick: (station: ChargingStation) => void;
  className?: string;
  isLoadingDirections?: boolean;
  isActive?: boolean;
}
const StationCard: React.FC<StationCardProps> = ({
  station,
  onDirectionsClick,
  className,
  isLoadingDirections = false,
  isActive = false
}) => {
  const {
    addressInfo,
    operatorInfo,
    connections,
    distance,
    status,
    usageCost
  } = station;
  const statusColors = {
    'available': 'bg-station-available',
    'busy': 'bg-station-busy',
    'offline': 'bg-station-offline'
  };
  const statusLabels = {
    'available': 'Tersedia',
    'busy': 'Sibuk',
    'offline': 'Tidak Beroperasi'
  };
  const totalPower = connections.reduce((sum, conn) => sum + (conn.powerKW || 0), 0);
  const highestPower = connections.reduce((max, conn) => Math.max(max, conn.powerKW || 0), 0);
  return <Card className={cn("w-full transition-all duration-300 hover:shadow-md", isActive && "border-blue-400 shadow-md bg-blue-50/30", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <div>
            <CardTitle className="text-lg font-semibold line-clamp-1">{addressInfo.title}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <span className="line-clamp-1">
                {addressInfo.addressLine1}, {addressInfo.town}
              </span>
            </CardDescription>
          </div>
          <Badge variant="outline" className={cn("ml-auto", status === 'available' ? "border-green-200 bg-green-50 text-green-700" : status === 'busy' ? "border-amber-200 bg-amber-50 text-amber-700" : "border-gray-200 bg-gray-50 text-gray-700")}>
            <span className={cn("mr-1.5 h-2 w-2 rounded-full", statusColors[status || 'available'])}></span>
            {statusLabels[status || 'available']}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-1 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Zap className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
            <span>{connections.length} Konektor</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Clock className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
            <span>24 Jam</span>
          </div>
          {/* Add price information */}
          <div className="flex items-center text-muted-foreground col-span-2">
            <CreditCard className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
            <span>Biaya: {usageCost || "Tidak ada informasi"}</span>
          </div>
          {distance !== undefined && <div className="flex items-center text-muted-foreground col-span-2">
              <Navigation className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
              <span>{formatDistance(distance)}</span>
            </div>}
        </div>

        <div className="mt-4">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">INFORMASI KONEKTOR</h4>
          <div className="space-y-2">
            {connections.slice(0, 3).map((connection, index) => <div key={index} className="flex items-center justify-between text-sm p-2 bg-secondary rounded-md">
                <div className="flex flex-col">
                  <div className="flex items-center mb-1">
                    <Plug className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="font-medium">{connection.connectionType.title}</span>
                  </div>
                  {connection.currentType && <div className="text-xs text-muted-foreground ml-6">
                      {connection.currentType.title}
                      {connection.quantity > 1 && ` (${connection.quantity}x)`}
                    </div>}
                </div>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                  {connection.powerKW} kW
                </Badge>
              </div>)}
            {connections.length > 3 && <div className="text-xs text-center text-muted-foreground">
                +{connections.length - 3} konektor lainnya
              </div>}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button className="w-full bg-blue-500 hover:bg-blue-600 transition-all duration-200" onClick={() => onDirectionsClick(station)} disabled={isLoadingDirections}>
          {isLoadingDirections ? <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Menghitung Rute...
            </> : <>
              <Navigation className="h-4 w-4 mr-2" />
              Petunjuk Arah
            </>}
        </Button>
        
        {operatorInfo?.websiteURL && <Button variant="outline" size="sm" className="w-full text-xs" asChild>
            
          </Button>}
      </CardFooter>
    </Card>;
};
export default StationCard;