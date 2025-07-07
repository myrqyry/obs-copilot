export const HtmlTemplateService = {
    getPresetTemplates() {
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
                        pulse: true
                    }
                },
                colors: {
                    primary: '#a6e3a1',
                    secondary: '#94e2d5',
                    accent: '#89dceb',
                    background: 'rgba(30, 30, 46, 0.9)',
                    text: '#cdd6f4',
                    border: '#45475a'
                },
                assets: [
                    { type: 'image', name: 'Logo', url: '/assets/logo.png' },
                    { type: 'gif', name: 'Celebration', url: '/assets/celebration.gif' }
                ]
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
                },
                assets: [
                    { type: 'svg', name: 'Countdown', url: '/assets/countdown.svg' }
                ]
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
                },
                assets: [
                    { type: 'emoji', name: 'Break Emoji', content: '⏰' }
                ]
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
                refreshInterval: 10000,
                colors: {
                    primary: '#ffcc00',
                    secondary: '#ff9900',
                    accent: '#ff6600',
                    background: 'rgba(255, 255, 255, 0.9)',
                    text: '#333333',
                    border: '#ffcc00'
                }
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
                },
                animations: {
                    enabled: true,
                    speed: 0.2,
                    effects: {
                        glow: 1,
                        rainbow: false,
                        pulse: true
                    }
                }
            }
        };
    },
    generateTemplateUrl(config) {
        const baseUrl = '/public/html-templates/base-template.html';
        const params = encodeURIComponent(JSON.stringify(config));
        return `${baseUrl}?config=${params}`;
    },
    async createBrowserSourceWithTemplate(obsService, sourceName, sceneName, config, width = 800, height = 600) {
        const templateUrl = this.generateTemplateUrl(config);
        await obsService.createInput(sourceName, 'browser_source', {
            url: templateUrl,
            width,
            height,
        }, sceneName, true);
    },
    async updateBrowserSourceTemplate(obsService, sourceName, config) {
        const templateUrl = this.generateTemplateUrl(config);
        await obsService.setInputSettings(sourceName, { url: templateUrl });
    }
};
