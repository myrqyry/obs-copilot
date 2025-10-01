import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"

const buttonVariants = cva(
  // Material Design 3 inspired base styles with minimal padding
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-sm active:scale-[0.98] transition-all duration-200",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-sm active:scale-[0.98] transition-all duration-200",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent/50 active:scale-[0.98] transition-all duration-200",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-sm active:scale-[0.98] transition-all duration-200",
        ghost: "hover:bg-accent hover:text-accent-foreground active:scale-[0.98] transition-all duration-200",
        link: "text-primary underline-offset-4 hover:underline hover:text-accent active:scale-[0.98] transition-all duration-200",
        // Enhanced variants from consolidated button.tsx
        accent: "bg-gradient-to-r from-accent to-accent/80 text-accent-foreground hover:from-accent/90 hover:to-accent/70 hover:shadow-md active:scale-[0.98] transition-all duration-200",
        "accent-outline": "border-2 border-accent bg-transparent text-accent hover:bg-accent hover:text-accent-foreground active:scale-[0.98] transition-all duration-200",
        "primary-gradient": "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:from-primary/90 hover:to-accent/90 hover:shadow-md active:scale-[0.98] transition-all duration-200",
        "secondary-gradient": "bg-gradient-to-r from-accent/20 to-secondary text-foreground hover:from-accent/30 hover:to-secondary/90 hover:shadow-sm border border-accent/20 hover:border-accent/40 active:scale-[0.98] transition-all duration-200",
      },
      size: {
        default: "h-9 px-3 py-1.5", // Reduced padding for Material 3 minimal style
        sm: "h-8 rounded-md px-2.5 text-xs",
        lg: "h-10 rounded-md px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size = "default", asChild = false, isLoading = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    // Emoji mapping from CustomButton
    const emojiMap: Record<string, string> = {
      "Connect": "🔗",
      "Disconnect": "🔌",
      "Start Streaming": "▶️",
      "Stop Streaming": "⏹️",
      "Start Recording": "🔴",
      "Stop Recording": "⏹️",
      "Refresh Data": "🔄",
      "Save Video Settings": "💾",
      "Send": "➡️",
      "Show": "👁️",
      "Hide": "🙈",
      "Show 🔽": "🔽",
      "Hide 🔼": "🔼",
      "Close": "🚪",
      "Reconnect": "🔄",
      "Copy URL": "📋",
      "Copy SVG Code": "📋",
      "Copy Emoji": "📋",
      "Paste": "📋",
      "Reset All Settings": "♻️",
      "Update Existing": "🛠",
      "Create Browser Source": "✨",
      "Preview": "🖥",
      "Switch": "↔️",
    }

    let buttonContent = children

    // Only process emoji mapping for string children
    if (typeof children === 'string') {
      const cleanedChildren = children.replace(/ [🔽🔼️]$/, '')
      if (emojiMap[cleanedChildren]) {
        buttonContent = (
          <>
            <span role="img" aria-hidden="true" className="mr-1.5">
              {emojiMap[cleanedChildren]}
            </span>
            {children}
          </>
        )
      }
    } else {
      buttonContent = children
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <LoadingSpinner size={5} className="text-current" />
        ) : (
          buttonContent
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
