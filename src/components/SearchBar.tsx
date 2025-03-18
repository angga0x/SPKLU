
import React, { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search, LocateFixed, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  className?: string;
  onGetUserLocation: () => void;
  isLocating: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  isLoading, 
  className,
  onGetUserLocation,
  isLocating
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() || query === '') {
      onSearch(query);
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
        "relative flex items-center transition-all duration-300",
        isFocused ? "scale-[1.02]" : "scale-100",
        className
      )}
      onSubmit={handleSubmit}
    >
      <div className="relative flex-1">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Cari stasiun pengisian kendaraan listrik..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className={cn(
            "pl-10 pr-10 h-12 text-base bg-white dark:bg-gray-900 border-blue-100 dark:border-gray-700 shadow-sm transition-all duration-200",
            isFocused ? "shadow-md border-blue-300 dark:border-blue-700" : ""
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={isLoading}
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="ml-2 h-12 w-12 border-blue-100 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm"
        onClick={onGetUserLocation}
        disabled={isLocating}
      >
        {isLocating ? (
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        ) : (
          <LocateFixed className="h-5 w-5 text-blue-500" />
        )}
        <span className="sr-only">Use current location</span>
      </Button>
      <Button 
        type="submit" 
        className="ml-2 h-12 px-4 bg-blue-500 hover:bg-blue-600"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <Search className="h-5 w-5 mr-2" />
            Cari
          </>
        )}
      </Button>
    </form>
  );
};

export default SearchBar;
