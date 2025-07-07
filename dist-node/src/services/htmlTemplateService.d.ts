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
export declare const HtmlTemplateService: {
    getPresetTemplates(): Record<string, Partial<TemplateConfig>>;
    generateTemplateUrl(config: Partial<TemplateConfig>): string;
    createBrowserSourceWithTemplate(obsService: any, sourceName: string, sceneName: string, config: Partial<TemplateConfig>, width?: number, height?: number): Promise<void>;
    updateBrowserSourceTemplate(obsService: any, sourceName: string, config: Partial<TemplateConfig>): Promise<void>;
};
