// src/components/ui/StreamingAssetsTab.tsx
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Input } from './input';
import { Button } from './button.radix';
import { Label } from './label';

const StreamingAssetsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [results, setResults] = useState<string[]>([]);

  const handleSearch = async () => {
    if (!searchTerm) return;

    setIsSearching(true);
    setResults([]);
    
    // 💡 This is where you would make an actual API call to search for assets.
    // For now, this is a placeholder.
    console.log(`Searching for streaming assets with term: "${searchTerm}"`);
    
    // Simulate a network request
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const dummyResults = [`Result 1 for "${searchTerm}"`, `Result 2 for "${searchTerm}"`, `Result 3 for "${searchTerm}"`];
    setResults(dummyResults);
    
    setIsSearching(false);
  };

  return (
    <Card className="shadow-lg p-6">
      <CardHeader>
        <CardTitle>Streaming Assets Search</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="asset-search">Search for Assets</Label>
          <div className="flex space-x-2 mt-2">
            <Input
              id="asset-search"
              placeholder="e.g., sound effects, video clips"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              disabled={isSearching}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>
        
        {results.length > 0 && (
          <div className="space-y-2">
            <p className="font-semibold">Search Results:</p>
            <ul className="list-disc list-inside">
              {results.map((result, index) => (
                <li key={index}>{result}</li>
              ))}
            </ul>
          </div>
        )}
        
      </CardContent>
    </Card>
  );
};

export default StreamingAssetsTab;
