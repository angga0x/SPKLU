
import React, { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search, LocateFixed, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { searchLocation } from '@/utils/api';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onLocationSearch?: (location: { latitude: number; longitude: number }) => void;
  isLoading: boolean;
  className?: string;
  onGetUserLocation: () => void;
  isLocating: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  onLocationSearch,
  isLoading, 
  className,
  onGetUserLocation,
  isLocating
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      onSearch('');
      return;
    }
    
    // Try to search for a location first
    setIsSearchingLocation(true);
    try {
      const locationResult = await searchLocation(query);
      if (locationResult) {
        console.log("Location found:", locationResult);
        onLocationSearch?.(locationResult);
      } else {
        // If no location found, fall back to station search
        onSearch(query);
      }
    } catch (error) {
      console.error("Error searching location:", error);
      // Fall back to station search on error
      onSearch(query);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
    inputRef.current?.focus();
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <form 
      className={cn(
        "relative flex items-center w-full transition-all duration-300",
        isMobile ? "max-w-[calc(100vw-32px)]" : "max-w-md",
        isFocused ? "scale-[1.02]" : "scale-100",
        className
      )}
      onSubmit={handleSubmit}
    >
      <div className="relative flex-1">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Cari lokasi atau SPKLU..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className={cn(
            "pl-8 pr-8 h-9 text-xs bg-white dark:bg-gray-900 border-blue-100 dark:border-gray-700 shadow-sm transition-all duration-200",
            isFocused ? "shadow-md border-blue-300 dark:border-blue-700" : ""
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={isLoading || isSearchingLocation}
        />
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={handleClear}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="ml-1 h-9 w-9 border-blue-100 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm"
        onClick={onGetUserLocation}
        disabled={isLocating}
      >
        {isLocating ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
        ) : (
          <LocateFixed className="h-3.5 w-3.5 text-blue-500" />
        )}
        <span className="sr-only">Use current location</span>
      </Button>
      <Button 
        type="submit" 
        className={cn(
          "h-9 bg-blue-500 hover:bg-blue-600 text-xs",
          isMobile ? "px-2 ml-1" : "px-3 ml-1"
        )}
        disabled={isLoading || isSearchingLocation}
      >
        {isLoading || isSearchingLocation ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <>
            <Search className="h-3.5 w-3.5 mr-1" />
            {!isMobile && "Cari"}
          </>
        )}
      </Button>
    </form>
  );
};

export default SearchBar;
