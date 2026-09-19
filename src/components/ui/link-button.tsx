import * as React from "react"
import { Link } from "@/i18n/navigation"
import { Button, buttonVariants } from "@/components/ui/button"
import type { VariantProps } from "class-variance-authority"

type LinkProps = React.ComponentProps<typeof Link>

/**
 * A Button styled anchor to a locale-aware route. Base UI's Button expects
 * to render a native <button> (nativeButton defaults true) — rendering it as
 * a Link needs nativeButton={false}, easy to forget at every call site, so
 * it's centralized here instead.
 */
export function LinkButton({
  href,
  variant,
  size,
  className,
  children,
  ...props
}: LinkProps &
  VariantProps<typeof buttonVariants> & { className?: string; children?: React.ReactNode }) {
  return (
    <Button
      render={<Link href={href} {...props} />}
      nativeButton={false}
      variant={variant}
      size={size}
      className={className}
    >
      {children}
    </Button>
  )
}
