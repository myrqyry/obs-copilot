export declare const useAnimatedTabs: (activeTab: string) => {
    tabBarRef: import("react").MutableRefObject<HTMLDivElement>;
    registerTab: (tabKey: string, element: HTMLButtonElement | null) => void;
    handleTabClick: (tabKey: string, onClick: (tab: any) => void) => (event: React.MouseEvent<HTMLButtonElement>) => void;
    handleTabHover: (isEntering: boolean) => (event: React.MouseEvent<HTMLButtonElement>) => void;
    updateIndicator: () => void;
};
