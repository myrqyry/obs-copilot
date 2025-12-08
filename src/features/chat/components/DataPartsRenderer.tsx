import React from 'react';
import { ChatMessageDataPart } from '@/shared/types';

interface DataPartsRendererProps {
    dataParts: ChatMessageDataPart[];
}

export const DataPartsRenderer: React.FC<DataPartsRendererProps> = ({ dataParts }) => {
    if (!dataParts || dataParts.length === 0) return null;

    return (
        <div className="mb-2 space-y-2">
            {dataParts.map((part, idx) => {
                const key = part.id || `datapart-${idx}`;
                if (part.type === 'status') {
                    const val = (part.value as any) || {};
                    return (
                        <div key={key} className="bg-muted/10 p-2 rounded-md border border-border">
                            <div className="flex items-center justify-between text-xs mb-1">
                                <div className="font-medium text-sm">{val.message || 'Status'}</div>
                                <div className="text-xs opacity-80">{val.status}</div>
                            </div>
                            {typeof val.progress === 'number' ? (
                                <div className="w-full bg-background h-2 rounded overflow-hidden">
                                    <div className="h-2 bg-primary" style={{ width: `${Math.min(100, Math.max(0, val.progress))}%` }} />
                                </div>
                            ) : val.details ? (
                                <div className="text-xs opacity-80">{val.details}</div>
                            ) : null}
                        </div>
                    );
                }

                if (part.type === 'obs-action' || part.type === 'streamerbot-action') {
                    const val = (part.value as any) || {};
                    return (
                        <div key={key} className="bg-muted/5 p-2 rounded-md border border-border flex flex-col">
                            <div className="flex items-center gap-2">
                                <div className="text-sm font-medium">{val.action || part.type}</div>
                                <div className="text-xs opacity-80">{val.target ? `→ ${val.target}` : null}</div>
                            </div>
                            <div className="text-xs mt-1 opacity-80">Status: {val.status}</div>
                            {val.result && (
                                <div className="text-xs mt-1">
                                    {val.result.success ? (
                                        <span className="text-success">Success: {val.result.message || 'OK'}</span>
                                    ) : (
                                        <span className="text-destructive">Error: {val.result.error || 'Failed'}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                }

                if (part.type === 'media') {
                    const val = (part.value as any) || {};
                    if (val.url) {
                        const isImage = String(val.contentType || '').startsWith('image');
                        return (
                            <div key={key} className="rounded-md overflow-hidden border border-border">
                                {isImage ? (
                                    // eslint-disable-next-line jsx-a11y/img-redundant-alt
                                    <img src={val.url} alt={val.alt || 'media'} className="w-full object-contain" />
                                ) : (
                                    <a href={val.url} target="_blank" rel="noreferrer" className="block p-2 text-sm">
                                        {val.caption || val.url}
                                    </a>
                                )}
                            </div>
                        );
                    }
                }

                // Fallback: render JSON preview
                return (
                    <pre key={key} className="text-xs bg-muted/5 p-2 rounded-md overflow-x-auto">
                        {JSON.stringify(part.value, null, 2)}
                    </pre>
                );
            })}
        </div>
    );
};
