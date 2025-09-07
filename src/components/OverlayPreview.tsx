import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  const storeConfig = useOverlaysStore((state) => state.currentOverlay);
  const finalConfig = config || storeConfig;

  if (!finalConfig?.generatedCode) {
    return (
      <Card className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
        <CardContent className="p-4 flex items-center justify-center h-48">
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
            No overlay generated yet. Generate one to see the preview here.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Escape HTML content to prevent injection issues in srcDoc
  const escapeHtml = (unsafe: string) => {
    return unsafe
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, """)
      .replace(/'/g, "&#039;");
  };

  const escapedHtml = escapeHtml(finalConfig.generatedCode.html);
  const escapedCss = finalConfig.generatedCode.css;
  const escapedJs = finalConfig.generatedCode.js;

  const overlayHtml = `<!DOCTYPE html>
<html>
<head>
  <style>${escapedCss}</style>
</head>
<body>
  ${escapedHtml}
  <script>${escapedJs}</script>
</body>
</html>`;

  return (
    <Card className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-md">
      <CardContent className="p-2">
        <div 
          className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden bg-gray-50 dark:bg-gray-900"
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
        {finalConfig.name && (
          <div className="p-2 text-xs text-gray-500 dark:text-gray-400 text-center border-t border-gray-200 dark:border-gray-700">
            {finalConfig.name}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OverlayPreview;