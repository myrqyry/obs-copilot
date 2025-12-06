import React, { useState, useEffect } from 'react';
import { getProxiedFaviconUrl } from '@/shared/utils/imageProxy';
import { Tooltip } from "@/shared/components/ui";

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
    'giphy.com': ' GIF',
    'tenor.com': ' GIF',
    'unsplash.com': '📷',
    'wallhaven.cc': '🖼️',
    'iconfinder.com': '🎨',
    'iconify.design': '🎨',
    'emoji-api.com': '😀',
    'openmoji.org': '😀',
    'artstation.com': '🎨',
    'deviantart.com': '🎨',
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
        if (!domain) return;

        // Try to get from cache first
        const cached = localStorage.getItem(`favicon_${domain}_${size}`);
        if (cached && cached !== ERROR_SENTINEL) {
            setSrc(cached);
            setLoaded(true);
            return;
        }

        // If we've cached an error, don't retry
        if (cached === ERROR_SENTINEL) {
            setError(true);
            return;
        }

        // Check if we've already failed too many times
        if (retryCount >= 2) {
            setError(true);
            return;
        }

        // Use our favicon proxy to avoid CORS issues
        const proxyUrl = getProxiedFaviconUrl(domain);
        setSrc(proxyUrl);
    }, [domain, size, retryCount]);

    const handleLoad = () => {
        setLoaded(true);
        setError(false);
        // Cache successful loads
        if (src) {
            localStorage.setItem(`favicon_${domain}_${size}`, src);
        }
    };

    const handleError = () => {
        setError(true);
        setLoaded(false);

        // Cache error to prevent repeated requests
        localStorage.setItem(`favicon_${domain}_${size}`, ERROR_SENTINEL);

        // Retry up to 2 times
        if (retryCount < 2) {
            setTimeout(() => {
                setRetryCount(prev => prev + 1);
            }, 100 * (retryCount + 1)); // Exponential backoff
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
                    style={{ width: size, height: size, minWidth: size, minHeight: size }}
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
