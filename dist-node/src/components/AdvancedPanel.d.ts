import React from 'react';
export declare const LOCAL_STORAGE_KEY = "customApiKeys";
/**
 * Get all custom API keys from localStorage.
 * @returns {Record<string, string>} Object of { service: key }
 */
export declare function getCustomApiKeys(): Record<string, string>;
/**
 * Get a custom API key for a given service, or undefined if not set.
 * @param {string} service
 * @returns {string|undefined}
 */
export declare function getCustomApiKey(service: string): string | undefined;
/**
 * Set a custom API key for a given service.
 * @param {string} service
 * @param {string} key
 */
export declare function setCustomApiKey(service: string, key: string): void;
/**
 * Remove a custom API key for a given service.
 * @param {string} service
 */
export declare function removeCustomApiKey(service: string): void;
declare const AdvancedPanel: React.FC;
export default AdvancedPanel;
