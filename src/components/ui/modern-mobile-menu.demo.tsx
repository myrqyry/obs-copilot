import { InteractiveMenu, InteractiveMenuItem } from './modern-mobile-menu';
import { Home, Briefcase, Calendar, Shield, Settings } from 'lucide-react';

const lucideDemoMenuItems: InteractiveMenuItem[] = [
    { label: 'home', icon: Home }, // Use the Lucide Home component
    { label: 'strategy', icon: Briefcase }, // Use a different Lucide icon for strategy
    { label: 'period', icon: Calendar }, // Use Calendar icon
    { label: 'security', icon: Shield }, // Use Shield icon
    { label: 'settings', icon: Settings }, // Use Lucide Settings icon
];

const customAccentColor = 'var(--chart-2)';

const Default = () => {
  return <InteractiveMenu />;
};

const Customized = () => {
  return <InteractiveMenu items={lucideDemoMenuItems} accentColor={customAccentColor} />;
};

export { Default, Customized };
