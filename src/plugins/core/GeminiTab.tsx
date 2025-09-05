import React, { useState } from 'react';
import { GeminiChat } from '@/features/chat/GeminiChat';

const GeminiTab: React.FC = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [chatInputValue, setChatInputValue] = useState('');

  return (
    <GeminiChat
      setErrorMessage={setErrorMessage}
      chatInputValue={chatInputValue}
      onChatInputChange={setChatInputValue}
    />
  );
};

export default GeminiTab;
