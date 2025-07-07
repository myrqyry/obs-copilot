import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaviconIcon } from './FaviconIcon';
export function FaviconDropdown({ options, value, onChange, className = '', placeholder, accentColor }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);
    const [dropdownStyle, setDropdownStyle] = useState({});
    // Revert: no need for buttonRef or dropdownStyle
    const selectedOption = options.find(option => option.value === value);
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)) {
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
    const handleOptionClick = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
    };
    return (<div className={`relative ${className}`}>
            <button ref={buttonRef} type="button" className="w-full border rounded px-2 py-1 bg-background text-left flex items-center justify-between transition-colors text-sm h-8" style={{
            borderColor: accentColor || undefined,
            boxShadow: isOpen ? `0 0 0 2px ${accentColor}` : undefined
        }} onClick={() => setIsOpen(!isOpen)}>
                <div className="flex items-center gap-2">
                    {selectedOption?.domain && (<FaviconIcon domain={selectedOption.domain} size={16}/>)}
                    <span>{selectedOption?.label || placeholder}</span>
                </div>
                <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke={accentColor || 'currentColor'} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
            </button>

            {isOpen && createPortal(<div ref={dropdownRef} className="obs-copilot-dropdown-menu bg-background border rounded shadow-lg max-h-60 overflow-y-auto" style={{ ...dropdownStyle, borderColor: accentColor || undefined }}>
                    {options.map((option) => (<button key={option.value} type="button" className="w-full px-2 py-1.5 text-left transition-colors flex items-center gap-2 text-sm" style={{ color: option.value === value ? accentColor : undefined, background: option.value === value ? `${accentColor}22` : undefined }} onClick={() => handleOptionClick(option.value)}>
                            {option.domain && (<FaviconIcon domain={option.domain} size={16}/>)}
                            <span>{option.label}</span>
                        </button>))}
                </div>, document.body)}
        </div>);
}
