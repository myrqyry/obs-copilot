export function highlightJsonSyntax(rawJsonString: string): string {
  let htmlEscapedJsonString = rawJsonString
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  htmlEscapedJsonString = htmlEscapedJsonString
    .replace(
      /"([^"\\]*(\\.[^"\\]*)*)"(\s*:)?/g,
      (match, _fullString, _stringContent, _escape, colon) => {
        const className = colon ? 'text-info' : 'text-accent';
        return `<span class="${className}">${match.substring(0, match.length - (colon ? 1 : 0))}</span>${colon ? ':' : ''}`;
      },
    )
    .replace(/\b(true|false|null)\b/g, '<span class="text-primary">$1</span>')
    .replace(
      /(?<!\w)([-+]?\d*\.?\d+([eE][-+]?\d+)?)(?!\w)/g,
      '<span class="text-warning">$1</span>',
    );

  return htmlEscapedJsonString;
}

export function applyInlineMarkdown(text: string): string {
  let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Special effect syntax: {{effect:text}} - Process these first before other markdown
  // Glow effects - Use theme-aware colors with CSS variables
  html = html.replace(
    /\{\{glow:([^}]+)\}\}/g,
    '<span class="text-primary font-semibold animate-pulse drop-shadow-md" style="text-shadow: 0 0 8px hsl(var(--primary)), 0 0 16px hsl(var(--primary));">$1</span>',
  );
  html = html.replace(
    /\{\{glow-green:([^}]+)\}\}/g,
    '<span class="text-accent font-semibold animate-pulse drop-shadow-md" style="text-shadow: 0 0 8px hsl(var(--accent)), 0 0 16px hsl(var(--accent));">$1</span>',
  );
  html = html.replace(
    /\{\{glow-red:([^}]+)\}\}/g,
    '<span class="text-destructive font-semibold animate-pulse drop-shadow-md" style="text-shadow: 0 0 8px hsl(var(--destructive)), 0 0 16px hsl(var(--destructive));">$1</span>',
  );
  html = html.replace(
    /\{\{glow-blue:([^}]+)\}\}/g,
    '<span class="text-info font-semibold animate-pulse drop-shadow-md" style="text-shadow: 0 0 8px hsl(var(--info)), 0 0 16px hsl(var(--info));">$1</span>',
  );
  html = html.replace(
    /\{\{glow-yellow:([^}]+)\}\}/g,
    '<span class="text-warning font-semibold animate-pulse drop-shadow-md" style="text-shadow: 0 0 8px hsl(var(--warning)), 0 0 16px hsl(var(--warning));">$1</span>',
  );
  html = html.replace(
    /\{\{glow-purple:([^}]+)\}\}/g,
    '<span class="text-primary font-semibold animate-pulse drop-shadow-md" style="text-shadow: 0 0 8px hsl(var(--primary)), 0 0 16px hsl(var(--primary));">$1</span>',
  );

  // Color effects (contextual styling) - Use semantic theme colors
  html = html.replace(
    /\{\{success:([^}]+)\}\}/g,
    '<span class="text-accent font-medium bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">✅ $1</span>',
  );
  html = html.replace(
    /\{\{error:([^}]+)\}\}/g,
    '<span class="text-destructive font-medium bg-destructive/10 px-2 py-0.5 rounded-md border border-destructive/20">❌ $1</span>',
  );
  html = html.replace(
    /\{\{warning:([^}]+)\}\}/g,
    '<span class="text-warning font-medium bg-warning/10 px-2 py-0.5 rounded-md border border-warning/20">⚠️ $1</span>',
  );
  html = html.replace(
    /\{\{info:([^}]+)\}\}/g,
    '<span class="text-info font-medium bg-info/10 px-2 py-0.5 rounded-md border border-info/20">ℹ️ $1</span>',
  );
  html = html.replace(
    /\{\{tip:([^}]+)\}\}/g,
    '<span class="text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">💡 $1</span>',
  );

  // Contextual OBS styling - Use theme-aware colors
  html = html.replace(
    /\{\{obs-action:([^}]+)\}\}/g,
    '<span class="text-warning font-medium bg-warning/10 px-2 py-0.5 rounded-md border border-warning/20 font-mono">🎬 $1</span>',
  );
  html = html.replace(
    /\{\{stream-live:([^}]+)\}\}/g,
    '<span class="text-destructive font-bold bg-destructive/10 px-2 py-1 rounded-md border border-destructive/20 animate-pulse">🔴 LIVE: $1</span>',
  );
  html = html.replace(
    /\{\{stream-offline:([^}]+)\}\}/g,
    '<span class="text-muted-foreground font-medium bg-muted/50 px-2 py-0.5 rounded-md border border-muted">⚫ $1</span>',
  );

  // Rainbow text effect - Use theme accent colors
  html = html.replace(
    /\{\{rainbow:([^}]+)\}\}/g,
    '<span class="font-bold bg-gradient-to-r from-destructive via-warning via-accent via-info to-primary bg-clip-text text-transparent animate-pulse">$1</span>',
  );

  // Sparkle effect
  html = html.replace(
    /\{\{sparkle:([^}]+)\}\}/g,
    '<span class="font-semibold text-primary relative">✨ $1 ✨</span>',
  );

  // Highlight effects - Use theme colors
  html = html.replace(
    /\{\{highlight:([^}]+)\}\}/g,
    '<span class="bg-warning/20 text-warning px-1 py-0.5 rounded font-medium">$1</span>',
  );
  html = html.replace(
    /\{\{highlight-green:([^}]+)\}\}/g,
    '<span class="bg-accent/20 text-accent px-1 py-0.5 rounded font-medium">$1</span>',
  );
  html = html.replace(
    /\{\{highlight-blue:([^}]+)\}\}/g,
    '<span class="bg-info/20 text-info px-1 py-0.5 rounded font-medium">$1</span>',
  );

  // Convert headings with compact spacing for OBS dock usage
  html = html.replace(
    /^### (.+)$/gm,
    '<h3 class="text-base font-semibold text-foreground mt-2 mb-1 border-b border-border pb-0.5">$1</h3>',
  );
  html = html.replace(
    /^## (.+)$/gm,
    '<h2 class="text-lg font-bold text-foreground mt-3 mb-1.5 border-b border-border pb-0.5">$1</h2>',
  );
  html = html.replace(
    /^# (.+)$/gm,
    '<h1 class="text-xl font-bold text-foreground mt-4 mb-2 border-b-2 border-primary pb-1">$1</h1>',
  );

  // Convert horizontal rules with minimal spacing
  html = html.replace(/^---+$/gm, '<hr class="my-3 border-t border-border" />');

  // Convert unordered lists with compact spacing
  html = html.replace(
    /^[-*+] (.+)$/gm,
    '<li class="ml-3 mb-0.5 text-foreground list-disc text-sm">$1</li>',
  );

  // Convert ordered lists with compact spacing
  html = html.replace(
    /^\d+\. (.+)$/gm,
    '<li class="ml-3 mb-0.5 text-foreground list-decimal text-sm">$1</li>',
  );

  // Wrap consecutive list items in proper ul/ol tags with minimal spacing
  html = html.replace(
    /(<li class="ml-3 mb-0\.5 text-foreground list-disc text-sm">[^<]*<\/li>(\s*<li class="ml-3 mb-0\.5 text-foreground list-disc text-sm">[^<]*<\/li>)*)/g,
    '<ul class="mb-2 ml-1">$1</ul>',
  );
  html = html.replace(
    /(<li class="ml-3 mb-0\.5 text-foreground list-decimal text-sm">[^<]*<\/li>(\s*<li class="ml-3 mb-0\.5 text-foreground list-decimal text-sm">[^<]*<\/li>)*)/g,
    '<ol class="mb-2 ml-1">$1</ol>',
  );

  // Convert inline code
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-muted px-1.5 py-0.5 rounded text-sm text-primary font-mono border border-border shadow-inner">$1</code>',
  );

  // Convert bold text
  html = html.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong class="font-semibold text-foreground">$1</strong>',
  );

  // Convert italic text
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic text-muted-foreground">$1</em>');

  // Convert line breaks to proper spacing
  html = html.replace(/\n\n/g, '<br /><br />');
  html = html.replace(/\n/g, '<br />');

  // Add proper paragraph spacing around block elements
  html = html.replace(/(<h[1-6][^>]*>.*?<\/h[1-6]>)/g, '<div class="mb-3">$1</div>');
  html = html.replace(/(<hr[^>]*>)/g, '<div class="my-4">$1</div>');

  return html;
}
