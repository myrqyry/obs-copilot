import React from 'react';
import packageJson from '../../../package.json';

export const Footer: React.FC = () => {
    return (
        <footer className="text-xs text-muted-foreground p-2 border-t border-border flex justify-between items-center bg-card">
            <span>OBS Copilot v{packageJson.version}</span>
            <div className="flex gap-4">
                <a
                    href="https://github.com/myrqyry/obs-copilot/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                >
                    Report Bug
                </a>
                <a
                    href="https://github.com/myrqyry/obs-copilot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                >
                    GitHub
                </a>
            </div>
        </footer>
    );
};
