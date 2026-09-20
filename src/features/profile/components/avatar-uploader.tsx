"use client"

import { useEffect, useState, useTransition, type ChangeEvent } from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { confirmAvatarUpload, type AvatarErrorCode } from "@/features/profile/actions"
import { createClient } from "@/lib/supabase/client"
import { Camera } from "lucide-react"

const MAX_AVATAR_BYTES = 5 * 1024 * 1024

function errorMessage(t: ReturnType<typeof useTranslations<"profile.avatar">>, code: AvatarErrorCode) {
  switch (code) {
    case "invalidType":
      return t("errors.invalidType")
    case "tooLarge":
      return t("errors.tooLarge")
    default:
      return t("errors.generic")
  }
}

export function AvatarUploader({
  userId,
  initialUrl,
  displayName,
}: {
  userId: string
  initialUrl: string | null
  displayName: string
}) {
  const t = useTranslations("profile.avatar")
  const [preview, setPreview] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<AvatarErrorCode | null>(null)

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    setError(null)

    if (!file.type.startsWith("image/")) {
      setError("invalidType")
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError("tooLarge")
      return
    }

    setPreview(URL.createObjectURL(file))

    startTransition(async () => {
      // Uploaded straight to Supabase Storage from here, not through a
      // server action — Vercel's serverless functions cap request bodies
      // at 4.5MB, under this file's own 5MB limit on its own.
      const supabase = createClient()
      const path = `${userId}/avatar`
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) {
        setError("generic")
        return
      }

      const result = await confirmAvatarUpload(path)
      if (result.error) setError(result.error)
    })
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <label className="group relative flex size-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- ephemeral blob: preview, not a remote asset next/image can optimize
          <img src={preview} alt="" className="size-full object-cover" />
        ) : initialUrl ? (
          <Image src={initialUrl} alt="" fill sizes="96px" className="object-cover" />
        ) : (
          <span className="font-display text-2xl font-bold text-muted-foreground">
            {displayName.slice(0, 1).toUpperCase() || "?"}
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-foreground/0 text-transparent transition-colors group-hover:bg-foreground/40 group-hover:text-background">
          <Camera className="size-5" aria-hidden="true" />
        </span>
        {pending && (
          <span className="absolute inset-0 flex items-center justify-center bg-background/60">
            <span
              className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent"
              aria-hidden="true"
            />
          </span>
        )}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFileChange}
        />
      </label>
      <span className="text-xs font-medium text-muted-foreground">{t("changePhoto")}</span>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {errorMessage(t, error)}
        </p>
      )}
    </div>
  )
}
