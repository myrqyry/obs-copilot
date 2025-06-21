export function highlightJsonSyntax(rawJsonString: string): string {
    let htmlEscapedJsonString = rawJsonString
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    htmlEscapedJsonString = htmlEscapedJsonString
        .replace(/"([^"\\]*(\\.[^"\\]*)*)"(\s*:)?/g, (match, _fullString, _stringContent, _escape, colon) => {
            const className = colon ? 'text-blue-800' : 'text-green-800';
            return `<span class="${className}">${match.substring(0, match.length - (colon ? 1 : 0))}</span>${colon ? ':' : ''}`;
        })
        .replace(/\b(true|false|null)\b/g, '<span class="text-purple-800">$1</span>')
        .replace(/(?<!\w)([-+]?\d*\.?\d+([eE][-+]?\d+)?)(?!\w)/g, '<span class="text-orange-800">$1</span>');

    return htmlEscapedJsonString;
}

export function applyInlineMarkdown(text: string): string {
    // If the text looks like raw HTML (contains HTML tags), return as-is
    const trimmed = text.trim();

    // Check for complete HTML blocks
    if ((/^<div[\s>]/i.test(trimmed) && /<\/div>\s*$/i.test(trimmed)) ||
        (/^<img[\s>]/i.test(trimmed) && />\s*$/i.test(trimmed)) ||
        (/^<.*?style\s*=.*?>.*$/i.test(trimmed))) {
        return text;
    }

    // Check if this looks like base64 image HTML
    if (/<img[^>]*src\s*=\s*["']data:image\/[^"']+["'][^>]*>/i.test(trimmed)) {
        return text;
    }

    let html = text;

    // Process base64 images first (before other markdown processing)
    // Match data:image/[type];base64,[data] patterns
    html = html.replace(/data:image\/([^;]+);base64,([A-Za-z0-9+/=]+)/g, (_, imageType, base64Data) => {
        const fullDataUri = `data:image/${imageType};base64,${base64Data}`;
        return `<div class="my-3 flex justify-center"><img src="${fullDataUri}" alt="Base64 Image" class="max-w-full h-auto rounded-lg shadow-md border border-border" style="max-height: 400px; object-fit: contain;" /></div>`;
    });

    // Special effect syntax: {{effect:text}} - Process these first before other markdown
    // Glow effects
    html = html.replace(/\{\{glow:([^}]+)\}\}/g, '<span class="text-primary font-semibold animate-pulse drop-shadow-md" style="text-shadow: 0 0 8px currentColor, 0 0 16px currentColor;">$1</span>');
    html = html.replace(/\{\{glow-green:([^}]+)\}\}/g, '<span class="text-green-400 font-semibold animate-pulse drop-shadow-md" style="text-shadow: 0 0 8px #4ade80, 0 0 16px #4ade80;">$1</span>');
    html = html.replace(/\{\{glow-red:([^}]+)\}\}/g, '<span class="text-red-400 font-semibold animate-pulse drop-shadow-md" style="text-shadow: 0 0 8px #f87171, 0 0 16px #f87171;">$1</span>');
    html = html.replace(/\{\{glow-blue:([^}]+)\}\}/g, '<span class="text-blue-400 font-semibold animate-pulse drop-shadow-md" style="text-shadow: 0 0 8px #60a5fa, 0 0 16px #60a5fa;">$1</span>');
    html = html.replace(/\{\{glow-yellow:([^}]+)\}\}/g, '<span class="text-yellow-400 font-semibold animate-pulse drop-shadow-md" style="text-shadow: 0 0 8px #facc15, 0 0 16px #facc15;">$1</span>');
    html = html.replace(/\{\{glow-purple:([^}]+)\}\}/g, '<span class="text-purple-400 font-semibold animate-pulse drop-shadow-md" style="text-shadow: 0 0 8px #c084fc, 0 0 16px #c084fc;">$1</span>');

    // Color effects (contextual styling)
    html = html.replace(/\{\{success:([^}]+)\}\}/g, '<span class="text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-md border border-green-200">✅ $1</span>');
    html = html.replace(/\{\{error:([^}]+)\}\}/g, '<span class="text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-md border border-red-200">❌ $1</span>');
    html = html.replace(/\{\{warning:([^}]+)\}\}/g, '<span class="text-yellow-600 font-medium bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-200">⚠️ $1</span>');
    html = html.replace(/\{\{info:([^}]+)\}\}/g, '<span class="text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">ℹ️ $1</span>');
    html = html.replace(/\{\{tip:([^}]+)\}\}/g, '<span class="text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">💡 $1</span>');

    // Contextual OBS styling
    html = html.replace(/\{\{obs-action:([^}]+)\}\}/g, '<span class="text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200 font-mono">🎬 $1</span>');
    html = html.replace(/\{\{stream-live:([^}]+)\}\}/g, '<span class="text-red-500 font-bold bg-red-100 px-2 py-1 rounded-md border border-red-300 animate-pulse">🔴 LIVE: $1</span>');
    html = html.replace(/\{\{stream-offline:([^}]+)\}\}/g, '<span class="text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-md border border-gray-300">⚫ $1</span>');

    // Rainbow text effect
    html = html.replace(/\{\{rainbow:([^}]+)\}\}/g, '<span class="font-bold bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent animate-pulse">$1</span>');

    // Sparkle effect
    html = html.replace(/\{\{sparkle:([^}]+)\}\}/g, '<span class="font-semibold text-primary relative">✨ $1 ✨</span>');

    // Highlight effects
    html = html.replace(/\{\{highlight:([^}]+)\}\}/g, '<span class="bg-yellow-200 text-yellow-900 px-1 py-0.5 rounded font-medium">$1</span>');
    html = html.replace(/\{\{highlight-green:([^}]+)\}\}/g, '<span class="bg-green-200 text-green-900 px-1 py-0.5 rounded font-medium">$1</span>');
    html = html.replace(/\{\{highlight-blue:([^}]+)\}\}/g, '<span class="bg-blue-200 text-blue-900 px-1 py-0.5 rounded font-medium">$1</span>');

    // Convert headings with compact spacing for OBS dock usage
    html = html.replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-foreground mt-2 mb-1 border-b border-border pb-0.5">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-foreground mt-3 mb-1.5 border-b border-border pb-0.5">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-foreground mt-4 mb-2 border-b-2 border-primary pb-1">$1</h1>');

    // Convert horizontal rules with minimal spacing
    html = html.replace(/^---+$/gm, '<hr class="my-3 border-t border-border" />');

    // Convert unordered lists with compact spacing
    html = html.replace(/^[-*+] (.+)$/gm, '<li class="ml-3 mb-0.5 text-foreground list-disc text-sm">$1</li>');

    // Convert ordered lists with compact spacing
    html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-3 mb-0.5 text-foreground list-decimal text-sm">$1</li>');

    // Wrap consecutive list items in proper ul/ol tags with minimal spacing
    html = html.replace(/(<li class="ml-3 mb-0\.5 text-foreground list-disc text-sm">[^<]*<\/li>(\s*<li class="ml-3 mb-0\.5 text-foreground list-disc text-sm">[^<]*<\/li>)*)/g, '<ul class="mb-2 ml-1">$1</ul>');
    html = html.replace(/(<li class="ml-3 mb-0\.5 text-foreground list-decimal text-sm">[^<]*<\/li>(\s*<li class="ml-3 mb-0\.5 text-foreground list-decimal text-sm">[^<]*<\/li>)*)/g, '<ol class="mb-2 ml-1">$1</ol>');

    // Convert inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm text-primary font-mono border border-border shadow-inner">$1</code>');

    // Convert bold text
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>');

    // Convert italic text
    html = html.replace(/\*([^*]+)\*/g, '<em class="italic text-muted-foreground">$1</em>');

    // Convert line breaks to proper spacing
    html = html.replace(/\n\n/g, '<br /><br />');
    html = html.replace(/\n/g, '<br />');

    // Add proper paragraph spacing around block elements
    html = html.replace(/(<h[1-6][^>]*>.*?<\/h[1-6]>)/g, '<div class="mb-3">$1</div>');
    html = html.replace(/(<hr[^>]*>)/g, '<div class="my-4">$1</div>');

    // Collapse effect
    html = html.replace(/\{\{collapse:([^}]+)\}\}/g, '<details><summary>$1</summary>');

    // Custom action syntax
    html = html.replace(/\{\{custom-action:([^}]+)\}\}/g, '<span class="text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">🎯 $1</span>');

    return html;
}
