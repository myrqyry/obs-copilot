import React, { useState, useEffect, useRef } from 'react';
import ErrorBoundary from './components/common/ErrorBoundary';
import { Header } from './components/layout/Header';
import { TabNavigation } from './components/layout/TabNavigation';
import { AppTab } from './types';
import { ConnectionProvider } from './components/ConnectionProvider';

const AppMinimal: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AppTab>(AppTab.GEMINI);
    const headerRef = useRef<HTMLDivElement>(null);

    return (
        <ErrorBoundary>
            <ConnectionProvider>
                <div className="h-screen max-h-screen bg-gradient-to-br from-background to-card text-foreground flex flex-col overflow-hidden">
                    <Header headerRef={headerRef} />
                    <div className="sticky z-10 px-2 pt-2" style={{ top: '64px' }}>
                        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} tabOrder={[AppTab.GEMINI]} />
                    </div>
                    <main className="flex-grow overflow-y-auto px-1 sm:px-2 pb-1">
                        <div>Minimal App - No Infinite Loops</div>
                    </main>
                </div>
            </ConnectionProvider>
        </ErrorBoundary>
    );
};

export default AppMinimal;
