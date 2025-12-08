import { cva } from 'class-variance-authority';

export const cardVariants = cva(
  'rounded-xl transition-all duration-300 ease-out relative overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-card border border-border shadow-sm hover:border-primary/20',
        glass: 'glass-card backdrop-blur-md border border-white/10 shadow-glass hover:shadow-glass-lg hover:border-accent/20',
        elevated: 'bg-card border border-border shadow-lg hover:shadow-xl hover:-translate-y-1 hover:border-primary/30',
        outlined: 'bg-transparent border-2 border-border hover:border-primary/50 hover:shadow-sm',
        gradient: 'bg-gradient-to-br from-card via-card/80 to-card/60 border border-border shadow-lg hover:shadow-xl hover:border-accent/40',
        neon: 'bg-card/80 border border-primary/30 shadow-glow hover:shadow-glow-lg backdrop-blur-sm hover:border-accent/50',
        frosted: 'bg-card/5 backdrop-blur-xl border border-white/10 shadow-lg hover:shadow-xl hover:border-primary/20',
        minimal: 'bg-transparent border border-border/50 hover:border-accent/60',
        'accent-gradient': 'bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border border-primary/20 shadow-sm hover:shadow-md hover:border-accent/40',
        'accent-outline': 'bg-transparent border-2 border-accent/30 hover:border-accent hover:bg-accent/5 shadow-sm hover:shadow-md',
        'primary-glow': 'bg-card border border-primary/40 shadow-glow hover:shadow-glow-lg hover:border-primary/60 backdrop-blur-sm',
      },
      size: {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
      },
      hover: {
        true: 'hover:scale-[1.02] hover:shadow-xl cursor-pointer',
        false: '',
      },
      glow: {
        true: 'shadow-glow hover:shadow-glow-lg',
        false: '',
      },
      interactive: {
        true: 'cursor-pointer',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      hover: false,
      glow: false,
      interactive: false,
    },
  }
);

export const badgeVariants = cva(
  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary border border-primary/20',
        success: 'bg-accent/10 text-accent border border-accent/20',
        warning: 'bg-warning/10 text-warning border border-warning/20',
        error: 'bg-destructive/10 text-destructive border border-destructive/20',
        info: 'bg-info/10 text-info border border-info/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);
