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
    const [focusedIndex, setFocusedIndex] = useState(-1);

    const selectedOption = options.find(option => option.value === value);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setFocusedIndex(-1);
            }
        }

        function handleEscapeKey(event: KeyboardEvent) {
            if (event.key === 'Escape' && isOpen) {
                setIsOpen(false);
                setFocusedIndex(-1);
                buttonRef.current?.focus();
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscapeKey);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [isOpen]);

    // Calculate dropdown position
    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            
            // Check if dropdown would go below viewport
            const dropdownHeight = 240; // max-h-60 = 240px
            const wouldOverflowBottom = rect.bottom + dropdownHeight > viewportHeight;
            
            // Position above or below based on available space
            let top, bottom;
            if (wouldOverflowBottom && rect.top > dropdownHeight) {
                // Position above
                top = 'auto';
                bottom = viewportHeight - rect.top;
            } else {
                // Position below
                top = rect.bottom + 4;
                bottom = 'auto';
            }
            
            // Ensure dropdown doesn't go outside viewport horizontally
            let left = rect.left;
            const width = rect.width;
            if (left + width > viewportWidth) {
                left = viewportWidth - width - 8; // 8px padding from right edge
            }
            
            setDropdownStyle({
                position: 'fixed',
                top,
                bottom,
                left,
                width,
                zIndex: 99999,
                maxHeight: '240px',
            });
        }
    }, [isOpen]);

    const handleOptionClick = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        setFocusedIndex(-1);
        buttonRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsOpen(true);
                setFocusedIndex(0);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setFocusedIndex(prev => (prev < options.length - 1 ? prev + 1 : 0));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocusedIndex(prev => (prev > 0 ? prev - 1 : options.length - 1));
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (focusedIndex >= 0 && focusedIndex < options.length) {
                    handleOptionClick(options[focusedIndex].value);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                setFocusedIndex(-1);
                buttonRef.current?.focus();
                break;
            case 'Tab':
                setIsOpen(false);
                setFocusedIndex(-1);
                break;
        }
    };

    // Focus the currently selected option when dropdown opens
    useEffect(() => {
        if (isOpen && focusedIndex >= 0 && dropdownRef.current) {
            const optionElements = dropdownRef.current.querySelectorAll('[role="option"]');
            const element = optionElements[focusedIndex] as HTMLElement;
            element?.focus();
        }
    }, [focusedIndex, isOpen]);

    const dropdownId = `favicondropdown-${React.useId()}`;
    const listboxId = `favicondropdown-listbox-${React.useId()}`;

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
                }}
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
            >
                <div className="flex items-center gap-2">
                    {selectedOption?.domain && (
                        <FaviconIcon domain={selectedOption.domain} size={16} aria-hidden="true" />
                    )}
                    <span className="truncate">{selectedOption?.label || placeholder}</span>
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
                    tabIndex={-1}
                    className="obs-copilot-dropdown-menu bg-background border rounded shadow-lg overflow-y-auto focus:outline-none"
                    style={dropdownStyle}
                    onKeyDown={handleKeyDown}
                >
                    {options.map((option, index) => (
                        <button
                            key={`${option.value}::${option.domain || index}`}
                            type="button"
                            role="option"
                            aria-selected={option.value === value}
                            tabIndex={-1}
                            className={`w-full px-2 py-1.5 text-left transition-colors flex items-center gap-2 text-sm hover:bg-muted focus:bg-muted focus:outline-none ${
                                index === focusedIndex ? 'bg-muted' : ''
                            }`}
                            style={{ 
                                color: option.value === value ? accentColor : undefined, 
                                background: option.value === value ? `${accentColor}22` : undefined 
                            }}
                            onClick={() => handleOptionClick(option.value)}
                            onMouseEnter={() => setFocusedIndex(index)}
                        >
                            {option.domain && (
                                <FaviconIcon domain={option.domain} size={16} aria-hidden="true" />
                            )}
                            <span className="truncate">{option.label}</span>
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </div>
    );
}
