import React, { useState, useEffect } from 'react';
import Tooltip from '../ui/Tooltip';
// Domain-specific favicon mappings for common services
const DOMAIN_FAVICONS = {
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
export const FaviconIcon = ({ domain, alt, className = '', size = 16 }) => {
    const [src, setSrc] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    useEffect(() => {
        if (!domain)
            return;
        // Try to get from cache first
        const cached = localStorage.getItem(`favicon_${domain}`);
        if (cached && !cached.includes('error')) {
            setSrc(cached);
            return;
        }
        // Check if we've already failed too many times
        if (retryCount >= 2) {
            setError(true);
            return;
        }
        // Use our favicon proxy to avoid CORS issues
        const proxyUrl = `/api/proxy?api=favicon&domain=${encodeURIComponent(domain)}&sz=${size}`;
        setSrc(proxyUrl);
    }, [domain, size, retryCount]);
    const handleLoad = () => {
        setLoaded(true);
        setError(false);
        // Cache successful loads
        if (src) {
            localStorage.setItem(`favicon_${domain}`, src);
        }
    };
    const handleError = () => {
        console.warn(`Failed to load favicon for ${domain}, using fallback emoji`);
        setError(true);
        setLoaded(false);
        // Cache error to prevent repeated requests
        localStorage.setItem(`favicon_${domain}`, 'error');
        // Retry with different URL if we haven't tried enough times
        if (retryCount < 2) {
            setTimeout(() => {
                setRetryCount(prev => prev + 1);
            }, 1000); // Wait 1 second before retry
        }
    };
    if (!domain)
        return null;
    // Show domain-specific emoji or fallback
    const getDomainEmoji = () => {
        const cleanDomain = domain.toLowerCase().replace(/^www\./, '');
        return DOMAIN_FAVICONS[cleanDomain] || domain.charAt(0).toUpperCase();
    };
    if (error || !src) {
        return (<Tooltip content={alt || `${domain} favicon`}>
                <div className={`inline-flex items-center justify-center bg-gray-200 text-gray-600 text-xs font-bold rounded-sm ${className}`} style={{ width: size, height: size }}>
                    {getDomainEmoji()}
                </div>
            </Tooltip>);
    }
    return (<img src={src} alt={alt || `${domain} favicon`} className={`inline-block ${className}`} style={{
            width: size,
            height: size,
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
            minWidth: size,
            minHeight: size,
            objectFit: 'contain',
        }} onLoad={handleLoad} onError={handleError} loading="lazy" referrerPolicy="no-referrer" crossOrigin="anonymous"/>);
};
