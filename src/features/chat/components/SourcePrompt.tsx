import React from 'react';
import { OBSSource } from '@/shared/types';
import { Tooltip } from "@/shared/components/ui";

interface SourcePromptProps {
    prompt: string;
    sources: OBSSource[];
    onSourceSelect: (sourceName: string) => void;
}

const getEmojiForSource = (source: OBSSource) => {
    switch (source.inputKind) {
        case 'text_gdiplus_v2':
        case 'text_ft2_source_v2':
            return '📝';
        case 'image_source':
            return '🖼️';
        case 'browser_source':
            return '🌐';
        case 'window_capture':
            return '🪟';
        case 'monitor_capture':
            return '🖥️';
        case 'game_capture':
            return '🎮';
        case 'dshow_input':
            return '📹';
        case 'wasapi_input_capture':
        case 'wasapi_output_capture':
            return '🎵';
        default:
            return '🎯';
    }
};

export const SourcePrompt: React.FC<SourcePromptProps> = ({ prompt, sources, onSourceSelect }) => {
    return (
        <div className="source-selection-container">
            <div className="source-selection-header mb-2">
                <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm emoji">🎯</span>
                    <div className="text-sm font-medium font-sans leading-tight">
                        Choose a source
                    </div>
                </div>
                <div className="text-sm opacity-80 font-normal font-sans">
                    {prompt}
                </div>
            </div>
            <div className="source-selection-grid grid grid-cols-2 gap-2">
                {sources.map((source) => (
                    <Tooltip key={source.sourceName} content={source.typeName || source.inputKind || 'Source'}>
                        <button
                            onClick={() => onSourceSelect(source.sourceName)}
                            className="source-select-btn group flex items-center px-3 py-1.5 bg-background/80 text-foreground border border-border rounded transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                            tabIndex={0}
                            aria-label={`Select source ${source.sourceName}`}
                        >
                            <span className="text-sm mr-2 group-hover:scale-105 transition-transform duration-200 flex-shrink-0 emoji">
                                {getEmojiForSource(source)}
                            </span>
                            <div className="flex-1 text-left min-w-0">
                                <div className="font-medium text-sm group-hover:text-background transition-colors duration-200 overflow-hidden text-ellipsis whitespace-nowrap">
                                    {source.sourceName}
                                </div>
                            </div>
                        </button>
                    </Tooltip>
                ))}
            </div>
        </div>
    );
};
