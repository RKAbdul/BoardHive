import { Link } from "@/i18n/navigation"
import { LocaleSwitcher } from "@/components/layout/locale-switcher"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link href="/" className="font-display text-xl font-bold tracking-tight text-foreground">
          Boardhive
        </Link>
        <LocaleSwitcher />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  )
}
