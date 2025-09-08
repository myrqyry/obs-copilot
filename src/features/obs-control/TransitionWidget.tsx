import React, { useState, useEffect } from 'react';
import { useUniversalWidgetStore } from '@/store/widgetsStore';
import { obsClient } from '@/services/obsClient';
import type { UniversalWidgetConfig } from '@/types/universalWidget';

interface TransitionWidgetProps extends UniversalWidgetConfig {
  config: { transitionName?: string; duration?: number };
  id: string;
  className?: string;
}

const TransitionWidget: React.FC<TransitionWidgetProps> = ({ config, id }) => {
  const { updateWidgetState } = useUniversalWidgetStore();
  const [transitions, setTransitions] = useState<string[]>([]);
  const [selectedTransition, setSelectedTransition] = useState<string>(config.transitionName || '');
  const [duration, setDuration] = useState<number>(config.duration || 300);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchTransitions();
  }, []);

  const fetchTransitions = async () => {
    try {
      const response = await obsClient.call('GetTransitionList');
      setTransitions(response.transitions || []);
      if (config.transitionName) {
        setSelectedTransition(config.transitionName);
      }
    } catch (error) {
      console.error('Failed to fetch transitions:', error);
      setTransitions([]);
    }
  };

  const setTransition = async (transitionName: string, transDuration: number) => {
    setLoading(true);
    try {
      await obsClient.call('SetCurrentProgramTransition', { transitionName, transitionDuration: transDuration });
      setSelectedTransition(transitionName);
      setDuration(transDuration);
      updateWidgetState(id, { value: { transitionName, duration: transDuration } });
    } catch (error) {
      console.error('Failed to set transition:', error);
      updateWidgetState(id, { error: 'Failed to set transition' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-lg max-w-sm mx-auto">
      <h3 className="text-white text-lg font-bold mb-2">Transition Widget</h3>
      <div className="space-y-2 mb-4">
        <select
          value={selectedTransition}
          onChange={(e) => setSelectedTransition(e.target.value)}
          className="w-full p-2 bg-gray-700 text-white rounded"
        >
          <option value="">Select Transition</option>
          {transitions.map((trans) => (
            <option key={trans} value={trans}>
              {trans}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Duration (ms)"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full p-2 bg-gray-700 text-white rounded"
          min="0"
        />
        <button
          onClick={() => setTransition(selectedTransition, duration)}
          disabled={loading || !selectedTransition}
          className="w-full p-2 bg-primary hover:bg-primary/90 text-white rounded disabled:bg-muted disabled:text-muted-foreground transition-colors"
        >
          {loading ? 'Applying...' : 'Apply Transition'}
        </button>
      </div>
      <div className="text-gray-300 text-sm">
        Current: {selectedTransition || 'None'} - {duration}ms
      </div>
    </div>
  );
};

export default TransitionWidget;