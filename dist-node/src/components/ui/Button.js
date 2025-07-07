import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
const Button = React.forwardRef(({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={cn(
        // Base styles
        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background', 
        // Variant styles
        {
            'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
            'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
            'border border-input hover:bg-accent hover:text-accent-foreground': variant === 'outline',
            'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
        }, 
        // Size styles
        {
            'h-10 py-2 px-4': size === 'default',
            'h-9 px-3 rounded-md': size === 'sm',
            'h-11 px-8 rounded-md': size === 'lg',
        }, className)} ref={ref} {...props}/>);
});
Button.displayName = 'Button';
export { Button };
