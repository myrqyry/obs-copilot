export interface TemplateConfig {
    layout: 'overlay' | 'fullscreen' | 'sidebar' | 'corner';
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    colors?: {
        primary?: string;
        secondary?: string;
        accent?: string;
        background?: string;
        text?: string;
        border?: string;
    };
    content?: {
        title?: string;
        subtitle?: string;
        body?: string;
        customHtml?: string;
    };
    animations?: {
        enabled?: boolean;
        speed?: number;
        effects?: {
            glow?: number;
            rainbow?: boolean;
            pulse?: boolean;
        };
    };
    assets?: Array<{
        type: 'image' | 'gif' | 'svg' | 'emoji';
        name: string;
        url?: string;
        content?: string;
    }>;
    autoRefresh?: boolean;
    refreshInterval?: number;
    customCss?: string;
}

export const HtmlTemplateService = {
    getPresetTemplates(): Record<string, Partial<TemplateConfig>> {
        return {
            'assets-showcase': {
                layout: 'overlay',
                content: {
                    title: '🌈 Stream Assets',
                    subtitle: 'Fresh content for your stream',
                    body: 'Check out these cool assets!'
                },
                animations: {
                    enabled: true,
                    speed: 0.3,
                    effects: {
                        glow: 1,
                        rainbow: false,
                        pulse: false
                    }
                },
                colors: {
                    primary: '#a6e3a1',
                    secondary: '#94e2d5',
                    accent: '#89dceb',
                    background: 'rgba(30, 30, 46, 0.9)',
                    text: '#cdd6f4',
                    border: '#45475a'
                }
            },
            'stream-starting': {
                layout: 'overlay',
                content: {
                    title: '🔴 STREAM STARTING',
                    subtitle: 'Get ready for an amazing stream!',
                    body: 'We\'ll be live in just a moment...'
                },
                animations: {
                    enabled: true,
                    speed: 0.3,
                    effects: {
                        glow: 2,
                        rainbow: true,
                        pulse: true
                    }
                },
                colors: {
                    primary: '#f38ba8',
                    secondary: '#fab387',
                    accent: '#a6e3a1',
                    background: 'rgba(30, 30, 46, 0.95)',
                    text: '#cdd6f4',
                    border: '#f38ba8'
                }
            },
            'be-right-back': {
                layout: 'fullscreen',
                content: {
                    title: 'Be Right Back!',
                    subtitle: '⏰ Taking a quick break',
                    body: 'Chat amongst yourselves - I\'ll be back soon!'
                },
                animations: {
                    enabled: true,
                    speed: 0.5,
                    effects: {
                        glow: 1,
                        rainbow: false,
                        pulse: true
                    }
                },
                colors: {
                    primary: '#cba6f7',
                    secondary: '#f2cdcd',
                    accent: '#94e2d5',
                    background: 'rgba(17, 17, 27, 0.98)',
                    text: '#cdd6f4',
                    border: '#45475a'
                }
            },
            'new-follower': {
                layout: 'corner',
                position: 'top-right',
                content: {
                    title: '🎉 New Follower!',
                    subtitle: 'Welcome to the community',
                    body: 'Thank you for following!'
                },
                animations: {
                    enabled: true,
                    speed: 0.3,
                    effects: {
                        glow: 3,
                        rainbow: true,
                        pulse: false
                    }
                },
                autoRefresh: true,
                refreshInterval: 10000
            },
            'chat-display': {
                layout: 'sidebar',
                content: {
                    title: '💬 Live Chat',
                    subtitle: 'Join the conversation',
                    body: ''
                },
                colors: {
                    primary: '#89b4fa',
                    secondary: '#b4befe',
                    accent: '#74c7ec',
                    background: 'rgba(30, 30, 46, 0.85)',
                    text: '#cdd6f4',
                    border: '#585b70'
                }
            }
        };
    },
    generateTemplateUrl(config: Partial<TemplateConfig>): string {
        const baseUrl = '/public/html-templates/base-template.html';
        const params = encodeURIComponent(JSON.stringify(config));
        return `${baseUrl}?config=${params}`;
    },
    async createBrowserSourceWithTemplate(
        _obsService: any,
        _sourceName: string,
        _sceneName: string,
        _config: Partial<TemplateConfig>,
        _width: number = 800,
        _height: number = 600
    ): Promise<void> {
        // This is a stub for demo purposes
        // In a real app, you would use the obsService to create a browser source
        return Promise.resolve();
    },
    async updateBrowserSourceTemplate(
        _obsService: any,
        _sourceName: string,
        _config: Partial<TemplateConfig>
    ): Promise<void> {
        // This is a stub for demo purposes
        // In a real app, you would use the obsService to update a browser source
        return Promise.resolve();
    }
};
