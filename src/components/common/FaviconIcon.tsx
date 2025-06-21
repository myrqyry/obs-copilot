import Tooltip from '../ui/Tooltip'; // correct path for common/
import { useState } from 'react';

interface FaviconIconProps {
    domain: string;
    alt?: string;
    className?: string;
    size?: number;
}

export function FaviconIcon({ domain, alt, className = '', size = 16 }: FaviconIconProps) {
    const [currentSource, setCurrentSource] = useState(0);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    // Multiple fallback sources for favicons, prioritizing Google's service
    const faviconSources = [
        `https://www.google.com/s2/favicons?sz=${size}&domain=${domain}`,
        `https://${domain}/favicon.ico`,
        `https://icon.horse/icon/${domain}`,
        `https://favicon.im/${domain}?larger=true`
    ];

    const handleLoad = () => {
        setLoaded(true);
        setError(false);
    };

    const handleError = () => {
        // Try next source if available
        if (currentSource < faviconSources.length - 1) {
            setCurrentSource(currentSource + 1);
            setLoaded(false);
        } else {
            setError(true);
            setLoaded(false);
        }
    };

    // If all sources failed, show a fallback icon
    if (error && currentSource >= faviconSources.length - 1) {
        return (
            <Tooltip content={alt || `${domain} favicon`}>
                <div
                    className={`inline-flex items-center justify-center bg-gray-200 text-gray-600 text-xs font-bold rounded-sm ${className}`}
                    style={{ width: size, height: size }}
                >
                    {domain.charAt(0).toUpperCase()}
                </div>
            </Tooltip>
        );
    }

    return (
        <img
            src={faviconSources[currentSource]}
            alt={alt || `${domain} favicon`}
            className={`inline-block ${className}`}
            style={{
                width: size,
                height: size,
                opacity: loaded ? 1 : 0,
                transition: 'opacity 0.2s ease-in-out'
            }}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
        />
    );
}
