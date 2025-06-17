import { useState, useRef, useEffect } from 'react';
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
}

export function FaviconDropdown({ options, value, onChange, className = '', placeholder }: FaviconDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(option => option.value === value);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOptionClick = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                className="w-full border rounded px-2 py-1 bg-background text-left flex items-center justify-between hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    {selectedOption?.domain && (
                        <FaviconIcon domain={selectedOption.domain} size={16} />
                    )}
                    <span>{selectedOption?.label || placeholder}</span>
                </div>
                <svg
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            className="w-full px-2 py-2 text-left hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2"
                            onClick={() => handleOptionClick(option.value)}
                        >
                            {option.domain && (
                                <FaviconIcon domain={option.domain} size={16} />
                            )}
                            <span>{option.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
