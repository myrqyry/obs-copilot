
import React from 'react';
import { gsap } from 'gsap';

// --- Effect Components ---
// Each effect gets a React component. These can be expanded for more advanced GSAP logic.

export const RainbowText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="bg-gradient-to-r from-ctp-pink via-ctp-yellow to-ctp-blue bg-clip-text text-transparent animate-rainbow-shift" >
        {children}
    </span>
);

export const GlowText: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color }) => (
    <span className={["animate-enhanced-pulse", color ? `text-${color}` : '', "drop-shadow-[0_0_8px_var(--tw-shadow-color)]"].filter(Boolean).join(' ')} >
        {children}
    </span>
);

export const SparkleText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="relative sparkle-text" >
        {children}
        {/* Sparkle emoji overlay can be added here */}
    </span>
);

export const BounceText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="inline-block" style={{ willChange: 'transform' }}>
        {children}
    </span>
);

export const SlideInText: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const ref = React.useRef<HTMLSpanElement>(null);
    React.useEffect(() => {
        if (ref.current) {
            gsap.fromTo(ref.current, { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.7)' });
        }
    }, []);
    return <span ref={ref} className="inline-block" > {children} </span>;
};

export const TypewriterText: React.FC<{ children: string }> = ({ children }) => {
    const [displayed, setDisplayed] = React.useState('');
    React.useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            setDisplayed(children.slice(0, i + 1));
            i++;
            if (i >= children.length) clearInterval(interval);
        }, 30);
        return () => clearInterval(interval);
    }, [children]);
    return <span className="font-mono border-r-2 border-primary animate-pulse" > {displayed} </span>;
};

// --- Main Markdown Parser ---
// This is a simple parser for the {{effect:text}} syntax. It can be expanded for full markdown.

const EFFECTS: Record<string, React.FC<any>> = {
    rainbow: RainbowText,
    glow: GlowText,
    'glow-green': (p: any) => (<GlowText color="ctp-green" {...p} />),
    'glow-red': (p: any) => (<GlowText color="ctp-red" {...p} />),
    'glow-blue': (p: any) => (<GlowText color="ctp-blue" {...p} />),
    'glow-yellow': (p: any) => (<GlowText color="ctp-yellow" {...p} />),
    'glow-purple': (p: any) => (<GlowText color="ctp-mauve" {...p} />),
    'fade-glow': GlowText,
    sparkle: SparkleText,
    bounce: BounceText,
    'slide-in': SlideInText,
    typewriter: TypewriterText,
    // ...add more as needed
};

/**
 * Parses text with {{effect:text}} syntax and returns React elements with GSAP-powered effects.
 * Only supports a subset of effects for now.
 */
export function parseGeminiMarkdown(text: string): React.ReactNode {
    // Regex to match {{effect:text}} (non-greedy for nested)
    const regex = /\{\{([a-zA-Z0-9\-]+):((?:[^{}]|\{(?!\{)|\}(?!\}))*?)\}\}/g;
    let lastIndex = 0;
    let match;
    const elements: React.ReactNode[] = [];
    let key = 0;
    while ((match = regex.exec(text))) {
        if (match.index > lastIndex) {
            elements.push(text.slice(lastIndex, match.index));
        }
        const effect = match[1];
        const content = match[2];
        const Comp = EFFECTS[effect];
        if (Comp) {
            elements.push(<Comp key={key++}> {parseGeminiMarkdown(content)} </Comp>);
        } else {
            // Fallback: render as plain text
            elements.push(match[0]);
        }
        lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
        elements.push(text.slice(lastIndex));
    }
    return elements.length === 1 ? elements[0] : elements;
}

export function highlightJsonSyntax(rawJsonString: string): string {
    let htmlEscapedJsonString = rawJsonString
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Enhanced JSON syntax highlighting using theme colors
    htmlEscapedJsonString = htmlEscapedJsonString
        .replace(/"([^"\\]*(\\.[^"\\]*)*)"(\s*:)?/g, (match, _fullString, _stringContent, _escape, colon) => {
            const colorStyle = colon ? 'color: hsl(var(--blue));' : 'color: hsl(var(--green));'; // Blue for keys, green for strings
            return `<span style="${colorStyle}">${match.substring(0, match.length - (colon ? 1 : 0))}</span>${colon ? ':' : ''}`;
        })
        .replace(/\b(true|false|null)\b/g, '<span style="color: hsl(var(--mauve)); font-weight: 500;">$1</span>') // Mauve for booleans/null
        .replace(/(?<!\w)([-+]?\d*\.?\d+([eE][-+]?\d+)?)(?!\w)/g, '<span style="color: hsl(var(--peach)); font-weight: 500;">$1</span>'); // Peach for numbers

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
    // Enhanced glow effects using theme colors and CSS classes
    html = html.replace(/\{\{glow:([^}]+)\}\}/g, '<span class="markdown-glow-primary font-semibold drop-shadow-lg whitespace-nowrap" data-effect="glow">$1</span>');
    html = html.replace(/\{\{glow-green:([^}]+)\}\}/g, '<span class="markdown-glow-green font-semibold drop-shadow-lg whitespace-nowrap" data-effect="glow-green">$1</span>');
    html = html.replace(/\{\{glow-red:([^}]+)\}\}/g, '<span class="markdown-glow-red font-semibold drop-shadow-lg whitespace-nowrap" data-effect="glow-red">$1</span>');
    html = html.replace(/\{\{glow-blue:([^}]+)\}\}/g, '<span class="markdown-glow-blue font-semibold drop-shadow-lg whitespace-nowrap" data-effect="glow-blue">$1</span>');
    html = html.replace(/\{\{glow-yellow:([^}]+)\}\}/g, '<span class="markdown-glow-yellow font-semibold drop-shadow-lg whitespace-nowrap" data-effect="glow-yellow">$1</span>');
    html = html.replace(/\{\{glow-purple:([^}]+)\}\}/g, '<span class="markdown-glow-purple font-semibold drop-shadow-lg whitespace-nowrap" data-effect="glow-purple">$1</span>');

    // Enhanced contextual styling using CSS classes
    html = html.replace(/\{\{success:([^}]+)\}\}/g, '<span class="markdown-badge markdown-badge-success"><span class="text-xs">✅</span>$1</span>');
    html = html.replace(/\{\{error:([^}]+)\}\}/g, '<span class="markdown-badge markdown-badge-error"><span class="text-xs">❌</span>$1</span>');
    html = html.replace(/\{\{warning:([^}]+)\}\}/g, '<span class="markdown-badge markdown-badge-warning"><span class="text-xs">⚠️</span>$1</span>');
    html = html.replace(/\{\{info:([^}]+)\}\}/g, '<span class="markdown-badge markdown-badge-info"><span class="text-xs">ℹ️</span>$1</span>');
    html = html.replace(/\{\{tip:([^}]+)\}\}/g, '<span class="markdown-badge markdown-badge-tip"><span class="text-xs">💡</span>$1</span>');

    // Enhanced OBS-specific styling using CSS classes
    html = html.replace(/\{\{obs-action:([^}]+)\}\}/g, '<span class="markdown-badge markdown-obs-action"><span class="text-xs">🎬</span>$1</span>');
    html = html.replace(/\{\{stream-live:([^}]+)\}\}/g, '<span class="markdown-badge markdown-stream-live"><span class="text-xs" style="display: inline-block; animation: gentle-pulse 2s ease-in-out infinite; transform-origin: center;">🔴</span>LIVE: $1</span>');
    html = html.replace(/\{\{stream-offline:([^}]+)\}\}/g, '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg font-medium text-sm border whitespace-nowrap" style="color: hsl(var(--muted-foreground)); background: hsl(var(--muted) / 0.3); border-color: hsl(var(--border));"><span class="text-xs">⚫</span>$1</span>');

    // Enhanced rainbow text effect using CSS class to reduce inline styles
    html = html.replace(/\{\{rainbow:([^}]+)\}\}/g, '<span class="markdown-rainbow font-bold whitespace-nowrap" data-effect="rainbow">$1</span>');

    // Enhanced sparkle effect with GSAP support and layout containment
    html = html.replace(/\{\{sparkle:([^}]+)\}\}/g, '<span class="font-semibold text-primary relative inline-flex items-center gap-1 whitespace-nowrap" data-effect="sparkle" style="contain: layout; overflow: visible;"><span class="sparkle-1 inline-block" style="will-change: transform; transform-origin: center;">✨</span>$1<span class="sparkle-2 inline-block" style="will-change: transform; transform-origin: center;">✨</span></span>');

    // Enhanced highlight effects using CSS classes
    html = html.replace(/\{\{highlight:([^}]+)\}\}/g, '<span class="markdown-highlight" data-effect="highlight">$1</span>');
    html = html.replace(/\{\{highlight-green:([^}]+)\}\}/g, '<span class="markdown-highlight-green" data-effect="highlight-green">$1</span>');
    html = html.replace(/\{\{highlight-blue:([^}]+)\}\}/g, '<span class="markdown-highlight-blue" data-effect="highlight-blue">$1</span>');

    // Convert headings with enhanced styling for chat bubbles
    html = html.replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-primary mt-3 mb-2 pb-1 border-b border-primary/30 relative flex items-center gap-2"><span class="w-1 h-4 bg-primary rounded-full"></span>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-primary mt-4 mb-2 pb-1.5 border-b-2 border-primary/50 relative flex items-center gap-2"><span class="w-2 h-5 bg-gradient-to-b from-primary to-accent rounded-full"></span>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-primary mt-5 mb-3 pb-2 border-b-2 border-primary relative flex items-center gap-2" style="background: linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent))); background-clip: text; -webkit-background-clip: text; color: transparent;"><span class="w-3 h-6" style="background: linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent))); border-radius: 0.25rem;"></span>$1</h1>');

    // Convert horizontal rules with theme styling
    html = html.replace(/^---+$/gm, '<hr class="my-4 border-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />');

    // Convert lists with improved chat bubble styling
    html = html.replace(/^[-*+] (.+)$/gm, '<li class="ml-4 mb-1 text-foreground text-sm flex items-start gap-2 leading-relaxed"><span class="w-1.5 h-1.5 bg-accent rounded-full mt-2 flex-shrink-0"></span><span>$1</span></li>');
    html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 mb-1 text-foreground text-sm flex items-start gap-2 leading-relaxed"><span class="w-5 h-5 bg-primary/20 text-primary rounded-full text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">•</span><span>$1</span></li>');

    // Wrap consecutive list items with improved spacing
    html = html.replace(/(<li class="ml-4 mb-1 text-foreground text-sm flex items-start gap-2 leading-relaxed"><span class="w-1\.5 h-1\.5 bg-accent rounded-full mt-2 flex-shrink-0"><\/span><span>[^<]*<\/span><\/li>(\s*<li class="ml-4 mb-1 text-foreground text-sm flex items-start gap-2 leading-relaxed"><span class="w-1\.5 h-1\.5 bg-accent rounded-full mt-2 flex-shrink-0"><\/span><span>[^<]*<\/span><\/li>)*)/g, '<ul class="mb-3 ml-0 space-y-0.5">$1</ul>');
    html = html.replace(/(<li class="ml-4 mb-1 text-foreground text-sm flex items-start gap-2 leading-relaxed"><span class="w-5 h-5 bg-primary\/20 text-primary rounded-full text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0\.5">•<\/span><span>[^<]*<\/span><\/li>(\s*<li class="ml-4 mb-1 text-foreground text-sm flex items-start gap-2 leading-relaxed"><span class="w-5 h-5 bg-primary\/20 text-primary rounded-full text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0\.5">•<\/span><span>[^<]*<\/span><\/li>)*)/g, '<ol class="mb-3 ml-0 space-y-0.5">$1</ol>');

    // Enhanced inline code styling
    html = html.replace(/`([^`]+)`/g, '<code class="px-2 py-1 rounded-lg text-sm font-mono border shadow-sm" style="background: hsl(var(--input)) !important; color: hsl(var(--foreground)) !important; border-color: hsl(var(--surface0)); box-shadow: inset 0 1px 2px rgba(0,0,0,0.3);">$1</code>');

    // Enhanced text formatting
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-primary">$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em class="italic text-accent">$1</em>');

    // Convert line breaks with proper spacing for chat bubbles
    html = html.replace(/\n\n+/g, '<div class="my-2"></div>');
    html = html.replace(/\n/g, ' ');

    // Enhanced block element spacing for chat environment
    html = html.replace(/(<h[1-6][^>]*>.*?<\/h[1-6]>)/g, '<div class="mb-2">$1</div>');
    html = html.replace(/(<hr[^>]*>)/g, '<div class="my-3">$1</div>');

    // Enhanced collapse effect
    html = html.replace(/\{\{collapse:([^}]+)\}\}/g, '<details class="mt-2 mb-2 p-2 rounded-lg border border-border bg-card/50"><summary class="cursor-pointer text-primary font-medium hover:text-accent transition-colors">$1</summary>');

    // Enhanced custom action syntax using CSS classes
    html = html.replace(/\{\{custom-action:([^}]+)\}\}/g, '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg font-medium text-sm border shadow-sm whitespace-nowrap" style="color: #b4befe; background: hsl(var(--card) / 0.8); border-color: #b4befe; box-shadow: 0 0 8px rgba(180, 190, 254, 0.2);"><span class="text-xs">🎯</span>$1</span>');

    // New GSAP-enhanced effects using CSS classes
    html = html.replace(/\{\{bounce:([^}]+)\}\}/g, '<span class="markdown-bounce font-semibold whitespace-nowrap" data-effect="bounce">$1</span>');
    html = html.replace(/\{\{slide-in:([^}]+)\}\}/g, '<span class="markdown-slide-in font-medium whitespace-nowrap" data-effect="slide-in">$1</span>');
    html = html.replace(/\{\{fade-glow:([^}]+)\}\}/g, '<span class="markdown-fade-glow font-semibold whitespace-nowrap" data-effect="fade-glow">$1</span>');
    html = html.replace(/\{\{typewriter:([^}]+)\}\}/g, '<span class="markdown-typewriter whitespace-nowrap" data-effect="typewriter">$1</span>');

    // Enhanced debug and connection status effects
    html = html.replace(/\{\{debug:([^}]+)\}\}/g, '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg font-mono text-xs border shadow-sm whitespace-nowrap" style="color: #fab387; background: hsl(var(--card) / 0.8); border-color: #fab387; box-shadow: 0 0 8px rgba(250, 179, 135, 0.2);"><span class="text-xs">🐛</span>$1</span>');
    html = html.replace(/\{\{connection-failed:([^}]+)\}\}/g, '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg font-medium text-sm border shadow-sm whitespace-nowrap" style="color: #f38ba8; background: hsl(var(--card) / 0.8); border-color: #f38ba8; box-shadow: 0 0 8px rgba(243, 139, 168, 0.2);"><span class="text-xs">🔌</span>$1</span>');
    html = html.replace(/\{\{websocket-error:([^}]+)\}\}/g, '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg font-medium text-sm border shadow-sm whitespace-nowrap" style="color: #f38ba8; background: hsl(var(--card) / 0.8); border-color: #f38ba8; box-shadow: 0 0 8px rgba(243, 139, 168, 0.2);"><span class="text-xs">🌐</span>$1</span>');
    html = html.replace(/\{\{obs-error:([^}]+)\}\}/g, '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg font-medium text-sm border shadow-sm whitespace-nowrap" style="color: #f38ba8; background: hsl(var(--card) / 0.8); border-color: #f38ba8; box-shadow: 0 0 8px rgba(243, 139, 168, 0.2);"><span class="text-xs">🎬</span>OBS: $1</span>');
    html = html.replace(/\{\{streamerbot-error:([^}]+)\}\}/g, '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg font-medium text-sm border shadow-sm whitespace-nowrap" style="color: #f38ba8; background: hsl(var(--card) / 0.8); border-color: #f38ba8; box-shadow: 0 0 8px rgba(243, 139, 168, 0.2);"><span class="text-xs">🤖</span>StreamerBot: $1</span>');
    html = html.replace(/\{\{connection-status:([^}]+)\}\}/g, '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg font-medium text-sm border shadow-sm whitespace-nowrap" style="color: #89b4fa; background: hsl(var(--card) / 0.8); border-color: #89b4fa; box-shadow: 0 0 8px rgba(137, 180, 250, 0.2);"><span class="text-xs">📡</span>$1</span>');
    html = html.replace(/\{\{port:([^}]+)\}\}/g, '<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-xs border shadow-sm whitespace-nowrap" style="color: #cba6f7; background: hsl(var(--card) / 0.8); border-color: #cba6f7; box-shadow: 0 0 8px rgba(203, 166, 247, 0.2);"><span class="text-xs">🔗</span>:$1</span>');

    // Enhanced text split effect for GSAP letter-by-letter animation
    html = html.replace(/\{\{textsplit:([^}]+)\}\}/g, '<span class="markdown-textsplit font-medium whitespace-nowrap" data-effect="textsplit" data-original-text="$1"><span class="textsplit-container">$1</span></span>');

    return html;
}

/**
 * Helper function for Gemini to get information about available styling effects
 * This provides a programmatic way to access effect documentation
 */
export function getAvailableEffects() {
    return {
        textEffects: {
            'rainbow': 'Animated rainbow gradient text with smooth color transitions',
            'glow': 'Pulsing glow effect with bloom lighting',
            'glow-green': 'Green glow with breathing animation',
            'glow-red': 'Red glow with breathing animation',
            'glow-blue': 'Blue glow with breathing animation',
            'glow-yellow': 'Yellow glow with breathing animation',
            'glow-purple': 'Purple glow with breathing animation',
            'fade-glow': 'Gentle breathing glow with enhanced bloom',
            'sparkle': 'Sparkling text with randomized emoji animations',
            'bounce': 'Playful bouncing text with physics',
            'slide-in': 'Slides in from left with back easing',
            'typewriter': 'Types out character by character'
        },
        highlights: {
            'highlight': 'Yellow highlight with entrance animation and hover effects',
            'highlight-green': 'Green highlight with entrance animation',
            'highlight-blue': 'Blue highlight with entrance animation'
        },
        contextualBadges: {
            'success': 'Green success badge with checkmark ✅',
            'error': 'Red error badge with X mark ❌',
            'warning': 'Yellow warning badge with warning icon ⚠️',
            'info': 'Blue info badge with info icon ℹ️',
            'tip': 'Purple tip badge with lightbulb 💡'
        },
        streamingObs: {
            'obs-action': 'Orange OBS action badge with camera icon 🎬',
            'stream-live': 'Red pulsing LIVE badge with animated dot 🔴',
            'stream-offline': 'Muted offline badge with dot ⚫',
            'custom-action': 'Blue custom action badge with target icon 🎯'
        },
        debugging: {
            'debug': 'Orange debug badge with bug icon 🐛',
            'connection-failed': 'Red connection failed badge with plug icon 🔌',
            'websocket-error': 'Red WebSocket error badge with globe icon 🌐',
            'obs-error': 'Red OBS error badge with camera icon 🎬',
            'streamerbot-error': 'Red StreamerBot error badge with robot icon 🤖',
            'connection-status': 'Blue connection status badge with signal icon 📡',
            'port': 'Purple port indicator with link icon 🔗'
        },
        interactive: {
            'collapse': 'Collapsible section with hover effects'
        },
        syntax: 'Use {{effect:text}} format. Example: {{rainbow:Hello World}}',
        examples: [
            '"Your stream is {{stream-live:LIVE}} with {{highlight-green:1,234 viewers}}!"',
            '"{{glow-blue:Welcome}} to the {{rainbow:magical world}} of streaming!"',
            '"{{bounce:New follower}} - {{sparkle:Thank you}}!"',
            '"{{typewriter:Setting up your OBS scene...}}"',
            '"{{success:Scene activated}} - {{obs-action:Camera enabled}}"',
            '"{{warning:Check your audio levels}} before going live"',
            '"Use {{slide-in:smooth transitions}} for {{fade-glow:professional}} results"',
            '"{{connection-failed:StreamerBot connection}} - check {{port:8080}}"',
            '"{{obs-error:Unsupported action}} - {{debug:setCurrentSceneTransitionSettings}}"',
            '"{{websocket-error:Connection closed}} before establishment"'
        ]
    };
}

/**
 * Quick reference for Gemini - most commonly used effects
 */
export function getQuickEffectsReference() {
    return `
🌈 QUICK EFFECTS REFERENCE FOR GEMINI:

✨ HIGHLIGHTS: {{highlight:text}} {{highlight-green:text}} {{highlight-blue:text}}
🌟 GLOWS: {{glow:text}} {{glow-blue:text}} {{glow-green:text}} {{fade-glow:text}}
🎨 ANIMATIONS: {{rainbow:text}} {{sparkle:text}} {{bounce:text}} {{slide-in:text}} {{typewriter:text}}
📊 STATUS: {{success:text}} {{error:text}} {{warning:text}} {{info:text}} {{tip:text}}
🎬 STREAMING: {{stream-live:text}} {{obs-action:text}} {{custom-action:text}}
� DEBUGGING: {{debug:text}} {{connection-failed:text}} {{websocket-error:text}} {{obs-error:text}} {{streamerbot-error:text}} {{connection-status:text}} {{port:number}}
�📝 INTERACTIVE: {{collapse:title}}

All effects are GSAP-powered with smooth 60fps animations and bloom lighting!
Perfect for error reporting and connection status updates!
`;
}

// GSAP-enhanced effects that can be applied after DOM insertion
export const markdownGsapEffects = {
    /**
     * Enhanced rainbow effect using GSAP for smoother animation
     */
    initRainbowEffect: (element: HTMLElement) => {
        const rainbowId = `rainbow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        element.setAttribute('data-rainbow-id', rainbowId);

        // Create a more sophisticated rainbow animation
        gsap.to(element, {
            backgroundPosition: '200% 50%',
            duration: 4,
            ease: 'none',
            repeat: -1,
            yoyo: true
        });

        // Add subtle scale pulse for extra effect
        gsap.to(element, {
            scale: 1.02,
            duration: 2,
            ease: 'power2.inOut',
            repeat: -1,
            yoyo: true,
            transformOrigin: 'center center'
        });
    },

    /**
     * Enhanced sparkle effect with randomized timing - layout-stable
     */
    initSparkleEffect: (element: HTMLElement) => {
        const sparkles = element.querySelectorAll('span');

        sparkles.forEach((sparkle, index) => {
            // Set transform-origin and will-change to stabilize layout
            gsap.set(sparkle, {
                transformOrigin: 'center center',
                willChange: 'transform, opacity'
            });

            gsap.to(sparkle, {
                scale: 1.1, // Reduced scale to prevent overflow
                opacity: 0.8,
                duration: 0.8 + Math.random() * 0.4,
                ease: 'power2.inOut',
                repeat: -1,
                yoyo: true,
                delay: index * 0.3 + Math.random() * 0.5
            });

            // Add rotation for more dynamic effect with stabilized transform
            gsap.to(sparkle, {
                rotation: 360,
                duration: 3 + Math.random() * 2,
                ease: 'none',
                repeat: -1,
                transformOrigin: 'center center'
            });
        });
    },

    /**
     * Enhanced glow effect with subtle bloom and smooth pulsing
     */
    initGlowEffect: (element: HTMLElement) => {
        // Create a gentle, continuous glow animation with bloom effect
        gsap.to(element, {
            filter: 'brightness(1.25) drop-shadow(0 0 20px currentColor) drop-shadow(0 0 40px currentColor)',
            duration: 3,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true
        });

        // Add layered text-shadow for bloom depth
        gsap.to(element, {
            textShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 40px currentColor, 0 0 60px currentColor',
            duration: 4,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            delay: 0.5 // Slightly offset for more organic feel
        });

        // Subtle scale for breathing bloom effect
        gsap.to(element, {
            scale: 1.01,
            duration: 3.5,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            delay: 1,
            transformOrigin: 'center center'
        });
    },

    /**
     * Enhanced highlight entrance animation
     */
    initHighlightEffect: (element: HTMLElement) => {
        // Set initial state
        gsap.set(element, {
            scale: 0.95,
            opacity: 0
        });

        // Animate in
        gsap.to(element, {
            scale: 1,
            opacity: 1,
            duration: 0.5,
            ease: 'back.out(1.7)',
            delay: Math.random() * 0.3 // Stagger if multiple highlights
        });

        // Add subtle hover effect
        element.addEventListener('mouseenter', () => {
            gsap.to(element, {
                scale: 1.05,
                boxShadow: '0 0 20px rgba(249, 226, 175, 0.6)',
                duration: 0.2,
                ease: 'power2.out'
            });
        });

        element.addEventListener('mouseleave', () => {
            gsap.to(element, {
                scale: 1,
                boxShadow: '0 0 8px rgba(249, 226, 175, 0.3)',
                duration: 0.2,
                ease: 'power2.out'
            });
        });
    },

    /**
     * Code block entrance animation
     */
    initCodeBlockEffect: (element: HTMLElement) => {
        gsap.set(element, {
            y: 20,
            opacity: 0
        });

        gsap.to(element, {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: 'power2.out',
            delay: 0.1
        });
    },

    /**
     * Text reveal animation for long content
     */
    initTextReveal: (element: HTMLElement) => {
        const text = element.textContent || '';
        if (text.length > 50) { // Only animate longer text
            gsap.set(element, { opacity: 0 });

            gsap.to(element, {
                opacity: 1,
                duration: 0.8,
                ease: 'power2.out',
                delay: 0.2
            });
        }
    },

    /**
     * Bounce effect - layout-stable
     */
    initBounceEffect: (element: HTMLElement) => {
        // Set will-change and transform-origin for better performance
        gsap.set(element, {
            y: -3, // Reduced bounce distance to prevent layout shifts
            willChange: 'transform',
            transformOrigin: 'center center'
        });

        gsap.to(element, {
            y: 0,
            duration: 0.6,
            ease: 'bounce.out',
            repeat: -1,
            yoyo: true,
            repeatDelay: 1
        });
    },

    /**
     * Slide in effect - layout-stable
     */
    initSlideInEffect: (element: HTMLElement) => {
        gsap.set(element, {
            x: -15, // Reduced slide distance 
            opacity: 0,
            willChange: 'transform, opacity',
            transformOrigin: 'center center'
        });

        gsap.to(element, {
            x: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'back.out(1.7)',
            delay: Math.random() * 0.5
        });
    },

    /**
     * Fade glow effect with enhanced bloom breathing animation
     */
    initFadeGlowEffect: (element: HTMLElement) => {
        // Enhanced breathing glow effect with bloom
        gsap.to(element, {
            textShadow: '0 0 15px currentColor, 0 0 30px currentColor, 0 0 45px currentColor',
            duration: 2.5,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true
        });

        // Subtle opacity variation for breathing effect
        gsap.to(element, {
            opacity: 0.8,
            duration: 3.5,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            delay: 0.7
        });

        // Add filter bloom effect
        gsap.to(element, {
            filter: 'brightness(1.2) blur(0.5px)',
            duration: 3,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            delay: 1.2
        });
    },

    /**
     * Typewriter effect
     */
    initTypewriterEffect: (element: HTMLElement) => {
        const text = element.textContent || '';
        element.textContent = '';

        gsap.to(element, {
            duration: text.length * 0.05,
            ease: 'none',
            onUpdate: function () {
                const progress = this.progress();
                const currentLength = Math.floor(progress * text.length);
                element.textContent = text.substring(0, currentLength);
            }
        });
    },

    /**
     * Initialize all GSAP effects for markdown elements
     */
    initAllEffects: (container: HTMLElement) => {
        // Rainbow effects
        container.querySelectorAll('[data-effect="rainbow"]').forEach((el) => {
            markdownGsapEffects.initRainbowEffect(el as HTMLElement);
        });

        // Sparkle effects
        container.querySelectorAll('[data-effect="sparkle"]').forEach((el) => {
            markdownGsapEffects.initSparkleEffect(el as HTMLElement);
        });

        // Glow effects
        container.querySelectorAll('[data-effect*="glow"]').forEach((el) => {
            markdownGsapEffects.initGlowEffect(el as HTMLElement);
        });

        // Highlight effects
        container.querySelectorAll('[data-effect*="highlight"]').forEach((el) => {
            markdownGsapEffects.initHighlightEffect(el as HTMLElement);
        });

        // New GSAP effects
        container.querySelectorAll('[data-effect="bounce"]').forEach((el) => {
            markdownGsapEffects.initBounceEffect(el as HTMLElement);
        });

        container.querySelectorAll('[data-effect="slide-in"]').forEach((el) => {
            markdownGsapEffects.initSlideInEffect(el as HTMLElement);
        });

        container.querySelectorAll('[data-effect="fade-glow"]').forEach((el) => {
            markdownGsapEffects.initFadeGlowEffect(el as HTMLElement);
        });

        container.querySelectorAll('[data-effect="typewriter"]').forEach((el) => {
            markdownGsapEffects.initTypewriterEffect(el as HTMLElement);
        });

        // Code blocks
        container.querySelectorAll('pre, code').forEach((el) => {
            markdownGsapEffects.initCodeBlockEffect(el as HTMLElement);
        });

        // Text reveal for paragraphs and longer content
        container.querySelectorAll('p, div').forEach((el) => {
            markdownGsapEffects.initTextReveal(el as HTMLElement);
        });

        // Add general hover effects for interactive elements
        container.querySelectorAll('[style*="background:"], [data-effect]').forEach((el) => {
            const element = el as HTMLElement;
            element.style.cursor = 'default';

            // Add subtle interaction feedback
            element.addEventListener('mouseenter', () => {
                gsap.to(element, {
                    y: -1,
                    duration: 0.15,
                    ease: 'power2.out'
                });
            });

            element.addEventListener('mouseleave', () => {
                gsap.to(element, {
                    y: 0,
                    duration: 0.15,
                    ease: 'power2.out'
                });
            });
        });
    }
};
