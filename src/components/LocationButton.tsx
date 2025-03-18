
import React from 'react';
import { Button } from './ui/button';
import { Loader2, MapPin, Locate, LocateFixed } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationButtonProps {
  onGetLocation: () => void;
  isLocating: boolean;
  className?: string;
}

const LocationButton: React.FC<LocationButtonProps> = ({ 
  onGetLocation, 
  isLocating,
  className 
}) => {
  return (
    <Button
      variant="secondary"
      size="lg"
      className={cn(
        "glassmorphism border shadow-md hover:shadow-lg transition-all duration-300",
        className
      )}
      onClick={onGetLocation}
      disabled={isLocating}
    >
      {isLocating ? (
        <>
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Mencari lokasi...
        </>
      ) : (
        <>
          <LocateFixed className="h-5 w-5 mr-2 text-blue-500" />
          Gunakan Lokasi Saat Ini
        </>
      )}
    </Button>
  );
};

export default LocationButton;
