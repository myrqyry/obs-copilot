import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastProvider = ToastPrimitive.Provider;
const ToastViewport = ToastPrimitive.Viewport;

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-top-full',
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground',
        destructive:
          'destructive group border-destructive bg-destructive text-destructive-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// Define the variant type separately
type ToastVariants = VariantProps<typeof toastVariants>;

// Extend the base props and the variant props
interface ToastProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root>, ToastVariants {}

const Toast = React.forwardRef<React.ElementRef<typeof ToastPrimitive.Root>, ToastProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <ToastPrimitive.Root
        ref={ref}
        className={cn(toastVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
Toast.displayName = ToastPrimitive.Root.displayName;

interface ToastActionProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action> {}

const ToastAction = React.forwardRef<React.ElementRef<typeof ToastPrimitive.Action>, ToastActionProps>(
  ({ className, ...props }, ref) => (
    <ToastPrimitive.Action
      ref={ref}
      className={cn(
        'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive',
        className
      )}
      {...props}
    />
  )
);
ToastAction.displayName = ToastPrimitive.Action.displayName;

interface ToastCloseProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close> {}

const ToastClose = React.forwardRef<React.ElementRef<typeof ToastPrimitive.Close>, ToastCloseProps>(
  ({ className, ...props }, ref) => (
    <ToastPrimitive.Close
      ref={ref}
      className={cn(
        'absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600',
        className
      )}
      {...props}
    >
      <X className="h-4 w-4" />
    </ToastPrimitive.Close>
  )
);
ToastClose.displayName = ToastPrimitive.Close.displayName;

interface ToastTitleProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title> {}

const ToastTitle = React.forwardRef<React.ElementRef<typeof ToastPrimitive.Title>, ToastTitleProps>(
  ({ className, ...props }, ref) => (
    <ToastPrimitive.Title
      ref={ref}
      className={cn('text-sm font-semibold', className)}
      {...props}
    />
  )
);
ToastTitle.displayName = ToastPrimitive.Title.displayName;

interface ToastDescriptionProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description> {}

const ToastDescription = React.forwardRef<React.ElementRef<typeof ToastPrimitive.Description>, ToastDescriptionProps>(
  ({ className, ...props }, ref) => (
    <ToastPrimitive.Description
      ref={ref}
      className={cn('text-sm opacity-90', className)}
      {...props}
    />
  )
);
ToastDescription.displayName = ToastPrimitive.Description.displayName;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

// Global toast state to ensure all components share the same toast list
let globalToasts: Array<{
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}> = [];

let globalListeners: Array<() => void> = [];

const notifyListeners = () => {
  globalListeners.forEach(listener => listener());
};

export function useToast() {
  const [toasts, setToasts] = React.useState<Array<{
    id: string
    title: string
    description?: string
    variant?: 'default' | 'destructive'
  }>>(globalToasts);

  // Subscribe to global toast changes
  React.useEffect(() => {
    const listener = () => {
      setToasts([...globalToasts]);
    };
    globalListeners.push(listener);
    
    return () => {
      globalListeners = globalListeners.filter(l => l !== listener);
    };
  }, []);

  function toast({ title, description, variant = 'default' }: {
    title: string
    description?: string
    variant?: 'default' | 'destructive'
  }) {
    // Check for duplicate toasts to prevent spam using global state
    // For error toasts, only check title and variant to be more flexible with descriptions
    const isDuplicate = globalToasts.some(
      (toast) => {
        if (variant === 'destructive') {
          // For error toasts, only check title and variant
          return toast.title === title && toast.variant === variant;
        } else {
          // For other toasts, check all properties
          return toast.title === title && toast.description === description && toast.variant === variant;
        }
      }
    );
    
            if (isDuplicate) {
          if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            console.log(`[useToast] Skipping duplicate toast: ${title}`);
          }
          return;
        }
        
        const id = Math.random().toString(36).substring(2, 9);
        if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
          console.log(`[useToast] Adding toast with id: ${id}, title: ${title}`);
        }
    
    const newToast = {
      id: id,
      title,
      description,
      variant,
    };
    
    globalToasts = [...globalToasts, newToast];
    notifyListeners();
    
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      console.log(`[useToast] Toast added: id=${id}, title=${title}. Current toasts in global state:`, globalToasts);
    }
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      globalToasts = globalToasts.filter((t) => t.id !== id);
      notifyListeners();
    }, 5000);
  }

  const clearToasts = () => {
    globalToasts = [];
    notifyListeners();
  };

  return {
    toast,
    toasts,
    clearToasts,
    error: (title: string, description?: string) => toast({ title, description, variant: 'destructive' }),
  }
}

export type { ToastActionElement };

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
