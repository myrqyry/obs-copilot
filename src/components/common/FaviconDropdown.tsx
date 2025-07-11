import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaviconIcon } from './FaviconIcon';

interface DropdownOption {
    label: string;
    value: string;
    domain?: string;
}


interface FaviconDropdownProps {
    options: DropdownOption[];
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
    accentColor?: string;
}

export function FaviconDropdown({ options, value, onChange, className = '', placeholder, accentColor }: FaviconDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    // Revert: no need for buttonRef or dropdownStyle

    const selectedOption = options.find(option => option.value === value);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownStyle({
                position: 'fixed',
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
                zIndex: 99999
            });
        }
    }, [isOpen]);

    // Revert: no need for dynamic dropdownStyle

    const handleOptionClick = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    const dropdownId = `favicondropdown-${Math.random().toString(36).substr(2, 9)}`;
    const listboxId = `favicondropdown-listbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className={`relative ${className}`}>
            <button
                ref={buttonRef}
                type="button"
                id={dropdownId}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={isOpen ? listboxId : undefined}
                className="w-full border rounded px-2 py-1 bg-background text-left flex items-center justify-between transition-colors text-sm h-8 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                style={{
                    borderColor: accentColor || undefined,
                    // boxShadow: isOpen ? `0 0 0 2px ${accentColor}` : undefined // Replaced by Tailwind focus
                }}
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                        e.preventDefault();
                        setIsOpen(true);
                        // Focus first/last item in listbox - requires refs to items
                    } else if (e.key === 'Escape') {
                        setIsOpen(false);
                    }
                }}
            >
                <div className="flex items-center gap-2">
                    {selectedOption?.domain && (
                        <FaviconIcon domain={selectedOption.domain} size={16} aria-hidden="true" />
                    )}
                    <span>{selectedOption?.label || placeholder}</span>
                </div>
                <svg
                    aria-hidden="true"
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke={accentColor || 'currentColor'}
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    role="listbox"
                    id={listboxId}
                    aria-labelledby={dropdownId}
                    tabIndex={-1} // Allows programmatic focus
                    className="obs-copilot-dropdown-menu bg-background border rounded shadow-lg max-h-60 overflow-y-auto focus:outline-none" // Added focus:outline-none
                    style={{ ...dropdownStyle, borderColor: accentColor || undefined }}
                    onKeyDown={(e) => { // Basic keyboard nav for items
                        if (e.key === 'Escape') {
                            setIsOpen(false);
                            buttonRef.current?.focus();
                        }
                        // More complex item navigation (ArrowUp, ArrowDown, Home, End, Enter, Space) would go here
                    }}
                >
                    {options.map((option, index) => (
                        <button
                            key={option.value}
                            type="button"
                            role="option"
                            aria-selected={option.value === value}
                            // id={`option-${dropdownId}-${option.value}`} // For aria-activedescendant
                            className="w-full px-2 py-1.5 text-left transition-colors flex items-center gap-2 text-sm hover:bg-muted focus:bg-muted focus:outline-none"
                            style={{ color: option.value === value ? accentColor : undefined, background: option.value === value ? `${accentColor}22` : undefined }}
                            onClick={() => handleOptionClick(option.value)}
                            // onFocus, onMouseEnter for managing visual focus if not using aria-activedescendant
                        >
                            {option.domain && (
                                <FaviconIcon domain={option.domain} size={16} aria-hidden="true" />
                            )}
                            <span>{option.label}</span>
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </div>
    );
}
