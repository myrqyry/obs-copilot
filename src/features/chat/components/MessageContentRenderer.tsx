import React from 'react';
import { SecureHtmlRenderer } from '@/components/ui/SecureHtmlRenderer';
import { CodeBlock } from '@/components/ai-elements/code-block';

interface MessageContentRendererProps {
    text: string;
}

export const MessageContentRenderer: React.FC<MessageContentRendererProps> = ({ text }) => {
    const parts = [];
    let lastIndex = 0;
    const codeBlockRegex = /```(\w*)\s*\n?([\s\S]*?)\n?\s*```/g;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            const htmlFragment = text.substring(lastIndex, match.index);
            if (htmlFragment.trim()) {
                parts.push(
                    <SecureHtmlRenderer
                        key={lastIndex}
                        htmlContent={htmlFragment}
                        allowedTags={['p','br','strong','em','code','pre','ul','ol','li','a','span','div']}
                        allowedAttrs={{
                            '*': ['class'],
                            'a': ['href', 'target', 'rel'],
                            'img': ['src', 'alt']
                        }}
                    />
                );
            }
        }

        const language = match[1] || 'text';
        const code = match[2];

        parts.push(
            <CodeBlock
                key={`code-${match.index}`}
                language={language}
                code={code}
                className="my-2"
            />
        );

        lastIndex = codeBlockRegex.lastIndex;
    }

    if (lastIndex < text.length) {
        const htmlFragment = text.substring(lastIndex);
        if (htmlFragment.trim()) {
            parts.push(
                <SecureHtmlRenderer
                    key={lastIndex}
                    htmlContent={htmlFragment}
                    allowedTags={['p','br','strong','em','code','pre','ul','ol','li','a','span','div']}
                    allowedAttrs={{
                        '*': ['class'],
                        'a': ['href', 'target', 'rel'],
                        'img': ['src', 'alt']
                    }}
                />
            );
        }
    }

    return parts.length > 0 ? <>{parts}</> : <span className="break-words whitespace-normal">{text}</span>;
};
