import React, { useRef, useEffect, useState } from 'react';
import DOMPurify from 'dompurify';

interface SecureHtmlRendererProps {
    htmlContent: string;
    customCss?: string;
    allowedTags?: string[];
    allowedAttributes?: string[];
    className?: string;
}

/**
 * Secure HTML renderer that uses iframe sandboxing for maximum security
 * This component addresses the security vulnerability in ExternalHtmlRenderer
 * by implementing proper sandboxing and stricter content security policies
 */
const SecureHtmlRenderer: React.FC<SecureHtmlRendererProps> = ({ 
    htmlContent, 
    customCss = '',
    allowedTags = ['p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
    allowedAttributes = ['class', 'id', 'style'],
    className = ''
}) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [iframeHeight, setIframeHeight] = useState<number>(200);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!iframeRef.current) return;

        try {
            setIsLoading(true);
            setError(null);

            // Configure DOMPurify with strict settings
            const purifyConfig = {
                ALLOWED_TAGS: allowedTags,
                ALLOWED_ATTR: allowedAttributes,
                ALLOW_DATA_ATTR: false,
                ALLOW_UNKNOWN_PROTOCOLS: false,
                SANITIZE_DOM: true,
                KEEP_CONTENT: true,
                // Remove all script-related content
                FORBID_TAGS: ['script', 'object', 'embed', 'applet', 'iframe', 'frame', 'frameset'],
                FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit']
            };

            // Sanitize the HTML content
            const sanitizedHtml = DOMPurify.sanitize(htmlContent, purifyConfig);

            // Create the complete HTML document for the iframe
            const iframeContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data: https:; font-src 'self' data:;">
                    <style>
                        body {
                            margin: 0;
                            padding: 16px;
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            line-height: 1.5;
                            color: #333;
                            background: transparent;
                        }
                        * {
                            max-width: 100%;
                            word-wrap: break-word;
                        }
                        img {
                            max-width: 100%;
                            height: auto;
                        }
                        ${customCss}
                    </style>
                </head>
                <body>
                    ${sanitizedHtml}
                    <script>
                        // Send height updates to parent
                        function updateHeight() {
                            const height = Math.max(
                                document.body.scrollHeight,
                                document.body.offsetHeight,
                                document.documentElement.clientHeight,
                                document.documentElement.scrollHeight,
                                document.documentElement.offsetHeight
                            );
                            window.parent.postMessage({ type: 'resize', height: height }, '*');
                        }
                        
                        // Initial height update
                        updateHeight();
                        
                        // Update height when content changes
                        const observer = new MutationObserver(updateHeight);
                        observer.observe(document.body, { 
                            childList: true, 
                            subtree: true, 
                            attributes: true 
                        });
                        
                        // Update height on window resize
                        window.addEventListener('resize', updateHeight);
                        
                        // Update height when images load
                        document.querySelectorAll('img').forEach(img => {
                            img.addEventListener('load', updateHeight);
                            img.addEventListener('error', updateHeight);
                        });
                    </script>
                </body>
                </html>
            `;

            // Set the iframe content
            const iframe = iframeRef.current;
            iframe.srcdoc = iframeContent;

            // Handle iframe load
            const handleLoad = () => {
                setIsLoading(false);
            };

            // Handle iframe errors
            const handleError = () => {
                setError('Failed to load content');
                setIsLoading(false);
            };

            iframe.addEventListener('load', handleLoad);
            iframe.addEventListener('error', handleError);

            return () => {
                iframe.removeEventListener('load', handleLoad);
                iframe.removeEventListener('error', handleError);
            };

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
            setIsLoading(false);
        }
    }, [htmlContent, customCss, allowedTags, allowedAttributes]);

    // Handle messages from iframe (for height updates)
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'resize' && typeof event.data.height === 'number') {
                setIframeHeight(Math.max(event.data.height, 50)); // Minimum height of 50px
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    if (error) {
        return (
            <div className={`p-4 border border-red-300 rounded-md bg-red-50 ${className}`}>
                <div className="text-red-800 text-sm">
                    <strong>Error:</strong> {error}
                </div>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-md">
                    <div className="text-gray-500 text-sm">Loading content...</div>
                </div>
            )}
            <iframe
                ref={iframeRef}
                className="w-full border border-gray-300 rounded-md"
                style={{ height: `${iframeHeight}px` }}
                sandbox="allow-same-origin"
                title="Secure HTML Content"
                loading="lazy"
            />
        </div>
    );
};

export default SecureHtmlRenderer;
