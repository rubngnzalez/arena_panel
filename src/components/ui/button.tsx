import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-normal transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "rounded-pill bg-arena-gradient bg-[length:150%_100%] bg-left text-white shadow-glow-purple hover:bg-right hover:scale-[1.03] hover:shadow-[0_0_32px_rgba(120,125,255,0.55)]",
        secondary:
          "rounded-pill glass text-foreground hover:border-primary/50 hover:shadow-glow-purple",
        outline:
          "rounded-pill border border-border bg-transparent text-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5",
        ghost: "rounded-pill hover:bg-primary/10 hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline",
        destructive:
          "rounded-pill bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-9 px-5 py-2",
        sm: "h-8 rounded-pill px-4 text-xs",
        lg: "h-11 rounded-pill px-8 text-base",
        icon: "h-9 w-9 rounded-pill",
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
