import type { StreamerBotService } from '../services/streamerBotService';
interface UseStreamerBotActionsProps {
    streamerBotService: StreamerBotService;
    onAddMessage: (message: {
        role: 'system';
        text: string;
    }) => void;
    setErrorMessage: (message: string | null) => void;
}
export declare const useStreamerBotActions: ({ streamerBotService, onAddMessage, setErrorMessage }: UseStreamerBotActionsProps) => {
    handleStreamerBotAction: (action: {
        type: string;
        args?: Record<string, any>;
    }) => Promise<void>;
};
export {};
