export function highlightJsonSyntax(rawJsonString: string): string {
    let htmlEscapedJsonString = rawJsonString
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    htmlEscapedJsonString = htmlEscapedJsonString
        .replace(/"([^"\\]*(\\.[^"\\]*)*)"(\s*:)?/g, (match, _fullString, _stringContent, _escape, colon) => {
            const className = colon ? 'text-[var(--ctp-blue)]' : 'text-[var(--ctp-green)]';
            return `<span class="${className}">${match.substring(0, match.length - (colon ? 1 : 0))}</span>${colon ? ':' : ''}`;
        })
        .replace(/\b(true|false|null)\b/g, '<span class="text-[var(--ctp-mauve)]">$1</span>')
        .replace(/(?<!\w)([-+]?\d*\.?\d+([eE][-+]?\d+)?)(?!\w)/g, '<span class="text-[var(--ctp-peach)]">$1</span>');

    return htmlEscapedJsonString;
}

export function applyInlineMarkdown(text: string): string {
    let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html = html.replace(/`([^`]+)`/g, '<code class="bg-[var(--ctp-surface0)] px-1 py-0.5 rounded text-xs text-[var(--ctp-peach)] shadow-inner">$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-[var(--ctp-crust)]">$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em class="italic text-[var(--ctp-mantle)]">$1</em>');
    return html;
}
