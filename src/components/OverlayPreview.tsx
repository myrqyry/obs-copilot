import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { OverlayConfig } from '@/types/overlay';
import { useOverlaysStore } from '@/store/overlaysStore';

interface OverlayPreviewProps {
  config?: OverlayConfig;
  width?: number;
  height?: number;
}

const OverlayPreview: React.FC<OverlayPreviewProps> = ({ 
  config, 
  width = 400, 
  height = 300 
}) => {
  // Unconditional hook call - fallback to store if no prop config
  // The store exposes an `overlays` array; use the most recent overlay as a fallback.
  const overlays = useOverlaysStore((state) => state.overlays);
  const storeConfig = overlays && overlays.length > 0 ? overlays[overlays.length - 1] : undefined;
  const finalConfig = config || storeConfig;

  if (!finalConfig?.generatedCode) {
    return (
      <Card className="bg-muted border border-border rounded-lg overflow-hidden">
        <CardContent className="p-4 flex items-center justify-center h-48">
          <p className="text-muted-foreground text-sm text-center">
            No overlay generated yet. Generate one to see the preview here.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Escape HTML content to prevent injection issues in srcDoc
  const escapeHtml = (unsafe: string) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const sanitizedHtml = escapeHtml(finalConfig.generatedCode.html);
  const sanitizedCss = finalConfig.generatedCode.css;
  const sanitizedJs = finalConfig.generatedCode.js;

  const overlayHtml = `<!DOCTYPE html>
<html>
<head>
  <style>${sanitizedCss}</style>
</head>
<body>
  ${sanitizedHtml}
  <script>${sanitizedJs}</script>
</body>
</html>`;

  return (
    <Card className="bg-card border border-border rounded-lg overflow-hidden shadow-md">
      <CardContent className="p-2">
        <div 
          className="border border-border rounded-md overflow-hidden bg-muted"
          style={{ width: `${width}px`, height: `${height}px` }}
        >
          <iframe
            srcDoc={overlayHtml}
            width={width}
            height={height}
            className="border-0 w-full h-full"
            sandbox="allow-scripts allow-same-origin"
            title="Overlay Preview"
            frameBorder="0"
          />
        </div>
        {finalConfig.templateName && (
          <div className="p-2 text-xs text-muted-foreground text-center border-t border-border">
            {finalConfig.templateName}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OverlayPreview;