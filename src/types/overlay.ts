export interface OverlayCustomization {
  fontSize?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
  };
  position?: {
    x?: number;
    y?: number;
  };
  animation?: string;
  placeholders?: Record<string, string>;
  other?: Record<string, any>;
}

export interface GeneratedCode {
  html: string;
  css: string;
  js: string;
}

export interface OverlayConfig {
  templateName: string;
  customizations: OverlayCustomization;
  generatedCode: GeneratedCode;
}