import React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';

interface ChatSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSummarize: () => void;
  onClearSearch: () => void;
  isSummarizeDisabled: boolean;
}

const ChatSearch: React.FC<ChatSearchProps> = ({
  searchTerm,
  setSearchTerm,
  onSummarize,
  onClearSearch,
  isSummarizeDisabled,
}) => {
  return (
    <>
      <div className="mb-3">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by user or keyword..."
          className="w-full p-2 rounded border-border transition-all duration-200 ease-in-out"
        />
      </div>
      <div className="flex gap-2 mb-2">
        <Button
          onClick={onSummarize}
          variant="outline"
          size="sm"
          disabled={isSummarizeDisabled}
        >
          Summarize Recent Messages
        </Button>
        <Button
          onClick={onClearSearch}
          variant="ghost"
          size="sm"
        >
          Clear Search
        </Button>
      </div>
    </>
  );
};

export default ChatSearch;