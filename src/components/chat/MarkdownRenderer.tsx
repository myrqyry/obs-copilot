import React, { useEffect, useRef } from 'react';
import { highlightJsonSyntax, applyInlineMarkdown, markdownGsapEffects } from '../../utils/markdown';

interface MarkdownRendererProps {
    content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = React.memo(({ content }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Initialize GSAP effects after content is rendered
    useEffect(() => {
        if (containerRef.current) {
            // Small delay to ensure DOM is fully rendered
            const timer = setTimeout(() => {
                markdownGsapEffects.initAllEffects(containerRef.current!);
            }, 50);

            return () => clearTimeout(timer);
        }
    }, [content]);

    // If the content is already HTML (contains img tags with src), render as-is
    if (/<img[^>]*src\s*=\s*["'][^"']+["'][^>]*>/i.test(content.trim()) ||
        /^<div[\s>].*<\/div>\s*$/is.test(content.trim())) {
        return <div ref={containerRef} style={{ color: 'inherit', whiteSpace: 'normal' }} className="[&_*]:!text-inherit" dangerouslySetInnerHTML={{ __html: content }} />;
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
        const codeBlockId = `code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        parts.push(
            `<div class="relative group my-1.5">
                <div class="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    <button 
                        onclick="navigator.clipboard.writeText(document.getElementById('${codeBlockId}').textContent).then(() => {
                            const btn = event.target;
                            const originalText = btn.textContent;
                            btn.textContent = '✓';
                            btn.style.color = '#a6e3a1';
                            setTimeout(() => {
                                btn.textContent = originalText;
                                btn.style.color = '';
                            }, 1500);
                        })"
                        class="px-2 py-1 text-xs bg-background/80 hover:bg-primary hover:text-primary-foreground rounded border border-border hover:border-primary transition-all duration-200 backdrop-blur-sm shadow-sm"
                        title="Copy to clipboard"
                    >📋</button>
                    <button 
                        onclick="(() => {
                            const code = document.getElementById('${codeBlockId}').textContent;
                            const lang = '${lang || 'txt'}';
                            const blob = new Blob([code], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = \`code_snippet.\${lang}\`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            const btn = event.target;
                            const originalText = btn.textContent;
                            btn.textContent = '✓';
                            btn.style.color = '#89b4fa';
                            setTimeout(() => {
                                btn.textContent = originalText;
                                btn.style.color = '';
                            }, 1500);
                        })()"
                        class="px-2 py-1 text-xs bg-background/80 hover:bg-primary hover:text-primary-foreground rounded border border-border hover:border-primary transition-all duration-200 backdrop-blur-sm shadow-sm"
                        title="Save as file"
                    >💾</button>
                </div>
                <pre class="p-2.5 text-xs overflow-x-auto border border-border shadow-inner rounded-md leading-relaxed whitespace-pre-wrap" style="background: #181825; color: #cdd6f4; border-color: hsl(var(--border));">
                    <code id="${codeBlockId}" class="language-${lang || ''} block">${highlightedCode}</code>
                </pre>
            </div>`
        );
        lastIndex = codeBlockRegex.lastIndex;
    }

    if (lastIndex < content.length) {
        parts.push(applyInlineMarkdown(content.substring(lastIndex)));
    }

    return <div ref={containerRef} style={{ color: 'inherit', whiteSpace: 'normal' }} className="[&_*]:!text-inherit [&_pre]:!whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: parts.join('') }} />;
});

MarkdownRenderer.displayName = 'MarkdownRenderer';
