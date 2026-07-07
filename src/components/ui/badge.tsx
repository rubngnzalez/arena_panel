import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-primary/30",
  {
    variants: {
      variant: {
        default: "border border-white/10 bg-white/5 text-foreground backdrop-blur-sm",
        secondary: "border border-white/10 bg-white/5 text-foreground backdrop-blur-sm",
        destructive: "bg-destructive text-destructive-foreground border border-destructive",
        outline: "border border-border text-foreground",
        primary: "border border-primary/40 bg-primary/10 text-primary shadow-glow-purple",
        success: "border border-green-400/30 bg-green-400/10 text-green-400",
        warning: "border border-amber-400/30 bg-amber-400/10 text-amber-400",
        info: "border border-sky-400/30 bg-sky-400/10 text-sky-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
