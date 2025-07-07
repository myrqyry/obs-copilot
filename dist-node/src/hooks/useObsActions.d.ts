import type { OBSWebSocketService } from '../services/obsService';
import type { ObsAction } from '../types/obsActions';
import type { OBSData } from '../types';
interface UseObsActionsProps {
    obsService: OBSWebSocketService;
    obsData: OBSData;
    onRefreshData: () => Promise<void>;
    onAddMessage: (message: {
        role: 'system';
        text: string;
    }) => void;
    setErrorMessage: (message: string | null) => void;
}
export declare const useObsActions: ({ obsService, obsData, onRefreshData, onAddMessage, setErrorMessage }: UseObsActionsProps) => {
    handleObsAction: (action: ObsAction) => Promise<{
        success: boolean;
        message: string;
    }>;
};
export {};
