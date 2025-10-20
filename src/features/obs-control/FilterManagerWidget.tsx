import React, { useState, useEffect, useCallback } from 'react';
import { useUniversalWidgetStore } from '@/store/widgetsStore';
import { obsClient } from '@/services/obsClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/Button';
import type { UniversalWidgetConfig } from '@/types/universalWidget';

interface Filter {
  filterName: string;
  filterType: string;
  settings: Record<string, any>;
}

interface FilterManagerWidgetProps extends UniversalWidgetConfig {
  config: { sceneName?: string; sourceName?: string };
  id: string;
  className?: string;
}

const FilterManagerWidget: React.FC<FilterManagerWidgetProps> = ({ config, id }) => {
  const { updateWidgetState } = useUniversalWidgetStore();
  const [filters, setFilters] = useState<Filter[]>([]);
  const [selectedFilterType, setSelectedFilterType] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const sceneName = config.sceneName || '';
  const sourceName = config.sourceName || '';

  useEffect(() => {
    if (sceneName && sourceName) {
      fetchFilters();
    }
  }, [sceneName, sourceName]);

  const fetchFilters = async () => {
    try {
      const response = await obsClient.call('GetSourceFilterList', { sceneName, sourceName });
      setFilters(response.filters || []);
    } catch (error) {
      console.error('Failed to fetch filters:', error);
      setFilters([]);
    }
  };

  const addFilter = async (filterType: string) => {
    setLoading(true);
    try {
      await obsClient.call('CreateSourceFilter', { sceneName, sourceName, filterName: '', filterKind: filterType });
      fetchFilters(); // Refresh list
      updateWidgetState(id, { value: filters.length + 1 });
    } catch (error) {
      console.error('Failed to add filter:', error);
      updateWidgetState(id, { error: 'Failed to add filter' });
    } finally {
      setLoading(false);
    }
  };

  const removeFilter = async (filterName: string) => {
    setLoading(true);
    try {
      await obsClient.call('RemoveSourceFilter', { sceneName, sourceName, filterName });
      setFilters(filters.filter(f => f.filterName !== filterName));
      updateWidgetState(id, { value: filters.length - 1 });
    } catch (error) {
      console.error('Failed to remove filter:', error);
      updateWidgetState(id, { error: 'Failed to remove filter' });
    } finally {
      setLoading(false);
    }
  };

  const updateFilterSettings = async (filterName: string, settings: Record<string, any>) => {
    setLoading(true);
    try {
      await obsClient.call('SetSourceFilterSettings', { sceneName, sourceName, filterName, filterSettings: settings });
      setFilters(filters.map(f => f.filterName === filterName ? { ...f, settings } : f));
    } catch (error) {
      console.error('Failed to update filter settings:', error);
      updateWidgetState(id, { error: 'Failed to update filter settings' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-card rounded-lg shadow-lg max-w-sm mx-auto">
      <h3 className="text-foreground text-lg font-bold mb-2">Filter Manager</h3>
      <div className="mb-4">
        <Select
          value={selectedFilterType}
          onValueChange={(v) => setSelectedFilterType(v === '__none__' ? '' : v)}
        >
          <SelectTrigger className="w-full mb-2">
            <SelectValue placeholder="Select Filter Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Select Filter Type</SelectItem>
            <SelectItem value="noise_suppression">Noise Suppression</SelectItem>
            <SelectItem value="gain">Gain</SelectItem>
            <SelectItem value="compressor">Compressor</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={handleAddFilter}
          disabled={!selectedFilterType}
          className="w-full mb-2"
          variant="success"
        >
          Add Filter
        </Button>
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {filters.length === 0 ? (
          <div className="text-muted-foreground text-sm text-center">No filters added.</div>
        ) : (
          filters.map((filter, index) => (
            <div key={filter.filterName} className="p-2 bg-input rounded space-y-1">
              <div className="text-foreground text-sm mb-1">{filter.filterName} ({filter.filterType})</div>
              <Button
                onClick={() => handleRemoveFilter(filter.filterName)}
                className="w-full text-xs"
                variant="destructive"
              >
                Remove
              </Button>
              <div className="text-xs text-muted-foreground">Settings: {JSON.stringify(filter.settings)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FilterManagerWidget;