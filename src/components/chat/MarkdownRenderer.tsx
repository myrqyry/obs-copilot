import React from 'react';
import { highlightJsonSyntax, applyInlineMarkdown } from '../../utils/markdown';

interface MarkdownRendererProps {
    content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = React.memo(({ content }) => {
    // If the content is already HTML (contains img tags with src), render as-is
    if (/<img[^>]*src\s*=\s*["'][^"']+["'][^>]*>/i.test(content.trim()) ||
        /^<div[\s>].*<\/div>\s*$/is.test(content.trim())) {
        return <div style={{ color: 'inherit' }} className="[&_*]:!text-inherit" dangerouslySetInnerHTML={{ __html: content }} />;
    }

    const parts = [];
    let lastIndex = 0;
    const codeBlockRegex = /```(\w*)\s*\n?([\s\S]*?)\n?\s*```/g;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
            parts.push(applyInlineMarkdown(content.substring(lastIndex, match.index)));
        }
        const lang = match[1]?.toLowerCase();
        const rawCode = match[2];
        let highlightedCode;
        if (lang === 'json') {
            highlightedCode = highlightJsonSyntax(rawCode);
        } else {
            highlightedCode = rawCode.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
        parts.push(
            `<pre class="bg-muted p-2.5 text-xs my-1.5 overflow-x-auto text-muted-foreground border border-border shadow-inner rounded-md leading-relaxed"><code class="language-${lang || ''}">${highlightedCode}</code></pre>`
        );
        lastIndex = codeBlockRegex.lastIndex;
    }

    if (lastIndex < content.length) {
        parts.push(applyInlineMarkdown(content.substring(lastIndex)));
    }

    return <div style={{ color: 'inherit' }} className="[&_*]:!text-inherit" dangerouslySetInnerHTML={{ __html: parts.join('') }} />;
});

MarkdownRenderer.displayName = 'MarkdownRenderer';
