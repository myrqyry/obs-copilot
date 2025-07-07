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
export declare function FaviconDropdown({ options, value, onChange, className, placeholder, accentColor }: FaviconDropdownProps): import("react").JSX.Element;
export {};
