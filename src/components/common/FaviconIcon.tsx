import React, { useState, useEffect } from 'react';
import { getProxiedFaviconUrl } from '@/utils/imageProxy';
import Tooltip from '@/components/ui/Tooltip';

interface FaviconIconProps {
    domain: string;
    alt?: string;
    className?: string;
    size?: number;
}

// Domain-specific favicon mappings for common services
const DOMAIN_FAVICONS: Record<string, string> = {
    'streamer.bot': '🤖',
    'obsproject.com': '🎬',
    'gemini.google.com': '🧠',
    'google.com': '🔍',
    'github.com': '🐙',
    'twitch.tv': '📺',
    'youtube.com': '📹',
    'discord.com': '💬',
    'twitter.com': '🐦',
    'facebook.com': '📘',
    'instagram.com': '📷',
    'tiktok.com': '🎵',
    'reddit.com': '🤖',
    'linkedin.com': '💼',
    'stackoverflow.com': '💻',
};

const ERROR_SENTINEL = 'error';

export const FaviconIcon: React.FC<FaviconIconProps> = ({ domain, alt, className = '', size = 16 }) => {
    const [src, setSrc] = useState<string | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        // Reset states on domain or size change
        setSrc(null);
        setLoaded(false);
        setError(false);
        setRetryCount(0);
    }, [domain, size]);

    useEffect(() => {
        console.log(`[FaviconIcon] useEffect for ${domain}, retry: ${retryCount}`);
        if (!domain) return;

        // Try to get from cache first
        const cached = localStorage.getItem(`favicon_${domain}_${size}`);
        if (cached && cached !== ERROR_SENTINEL) {
            console.log(`[FaviconIcon] Cache hit for ${domain}`);
            setSrc(cached);
            return;
        }

        // If we've cached an error, don't retry
        if (cached === ERROR_SENTINEL) {
            console.log(`[FaviconIcon] Cached error for ${domain}, using fallback`);
            setError(true);
            return;
        }

        // Check if we've already failed too many times
        if (retryCount >= 1) { // Reduced from 2 to 1 to avoid excessive retries
            console.log(`[FaviconIcon] Max retries reached for ${domain}`);
            setError(true);
            return;
        }

        // For localhost development, skip favicon loading entirely to avoid CORS issues
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log(`[FaviconIcon] Localhost detected, skipping favicon for ${domain}`);
            setError(true);
            localStorage.setItem(`favicon_${domain}_${size}`, ERROR_SENTINEL);
            return;
        }

        // Use our favicon proxy to avoid CORS issues
        const proxyUrl = getProxiedFaviconUrl(domain, size);
        console.log(`[FaviconIcon] Setting src for ${domain} to ${proxyUrl}`);
        setSrc(proxyUrl);
    }, [domain, size, retryCount]);

    const handleLoad = () => {
        console.log(`[FaviconIcon] handleLoad for ${domain}`);
        setLoaded(true);
        setError(false);
        // Cache successful loads
        if (src) {
            localStorage.setItem(`favicon_${domain}_${size}`, src);
        }
    };

    const handleError = () => {
        console.log(`[FaviconIcon] handleError for ${domain}`);
        setError(true);
        setLoaded(false);

        // Cache error to prevent repeated requests
        localStorage.setItem(`favicon_${domain}_${size}`, ERROR_SENTINEL);

        // Only retry once for non-localhost environments
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && retryCount < 1) {
            setRetryCount(prev => prev + 1);
        }
    };

    if (!domain) return null;

    // Show domain-specific emoji or fallback
    const getDomainEmoji = () => {
        const cleanDomain = domain.toLowerCase().replace(/^www\./, '');
        return DOMAIN_FAVICONS[cleanDomain] || domain.charAt(0).toUpperCase();
    };

    if (error || !src) {
        return (
            <Tooltip content={alt || `${domain} favicon`}>
                <div
                    className={`inline-flex items-center justify-center bg-gray-200 text-gray-600 text-xs font-bold rounded-sm ${className}`}
                    style={{ width: size, height: size }}
                >
                    {getDomainEmoji()}
                </div>
            </Tooltip>
        );
    }

    return (
        <img
            src={src}
            alt={alt || `${domain} favicon`}
            className={`inline-block ${className}`}
            style={{
                width: size,
                height: size,
                opacity: loaded ? 1 : 0,
                transition: 'opacity 0.2s ease-in-out',
                minWidth: size,
                minHeight: size,
                objectFit: 'contain',
            }}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
        />
    );
}
