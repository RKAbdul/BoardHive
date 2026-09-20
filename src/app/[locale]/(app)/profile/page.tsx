import { getFormatter, getTranslations } from "next-intl/server"
import { getCurrentProfile, requireSession } from "@/lib/dal"
import { getAvatarSignedUrl, getProfileStats } from "@/features/profile/data"
import { AvatarUploader } from "@/features/profile/components/avatar-uploader"
import { ProfileForm } from "@/features/profile/components/profile-form"
import { LocaleSwitcher } from "@/components/layout/locale-switcher"
import { LinkButton } from "@/components/ui/link-button"
import { Button } from "@/components/ui/button"
import { logout } from "@/features/auth/actions"

export default async function ProfilePage() {
  const t = await getTranslations("profile")
  const format = await getFormatter()
  const session = await requireSession()
  const profile = await getCurrentProfile()
  const [avatarUrl, stats] = await Promise.all([
    getAvatarSignedUrl(profile?.avatar_url ?? null),
    getProfileStats(session.userId),
  ])

  return (
    <div className="flex flex-col gap-8 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
        {t("title")}
      </h1>

      <AvatarUploader
        userId={session.userId}
        initialUrl={avatarUrl}
        displayName={profile?.display_name ?? ""}
      />

      <div className="grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-card">
        <div className="flex flex-col items-center gap-0.5 px-2 py-3">
          <span className="font-display text-xl font-bold tabular-nums text-foreground">
            {stats.hivesCount}
          </span>
          <span className="text-center text-xs text-muted-foreground">
            {t("stats.hives", { count: stats.hivesCount })}
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5 px-2 py-3">
          <span className="font-display text-xl font-bold tabular-nums text-foreground">
            {stats.totalPlays}
          </span>
          <span className="text-center text-xs text-muted-foreground">
            {t("stats.plays", { count: stats.totalPlays })}
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5 px-2 py-3">
          <span className="font-display text-xl font-bold tabular-nums text-foreground">
            {format.number(stats.winRate, { style: "percent", maximumFractionDigits: 0 })}
          </span>
          <span className="text-center text-xs text-muted-foreground">{t("stats.winRate")}</span>
        </div>
      </div>

      <ProfileForm initialName={profile?.display_name ?? ""} />

      <LinkButton href="/library" variant="secondary" className="self-start">
        {t("myLibrary")}
      </LinkButton>

      <div className="flex items-center justify-between border-t border-border pt-6">
        <span className="text-sm font-medium text-foreground">{t("language")}</span>
        <LocaleSwitcher />
      </div>

      <form action={logout}>
        <Button type="submit" variant="outline" className="w-full">
          {t("logout")}
        </Button>
      </form>
    </div>
  )
}
