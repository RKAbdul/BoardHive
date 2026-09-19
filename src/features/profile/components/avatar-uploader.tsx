"use client"

import { useActionState, useEffect, useRef, useState, type ChangeEvent } from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { uploadAvatar, type AvatarErrorCode } from "@/features/profile/actions"
import { Camera } from "lucide-react"

function errorMessage(t: ReturnType<typeof useTranslations<"profile.avatar">>, code: AvatarErrorCode) {
  switch (code) {
    case "noFile":
      return t("errors.noFile")
    case "invalidType":
      return t("errors.invalidType")
    case "tooLarge":
      return t("errors.tooLarge")
    default:
      return t("errors.generic")
  }
}

export function AvatarUploader({
  initialUrl,
  displayName,
}: {
  initialUrl: string | null
  displayName: string
}) {
  const t = useTranslations("profile.avatar")
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, pending] = useActionState(uploadAvatar, null)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    formRef.current?.requestSubmit()
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col items-center gap-2">
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
          name="avatar"
          accept="image/*"
          className="sr-only"
          onChange={handleFileChange}
        />
      </label>
      <span className="text-xs font-medium text-muted-foreground">{t("changePhoto")}</span>
      {state?.error && (
        <p role="alert" className="text-xs text-destructive">
          {errorMessage(t, state.error)}
        </p>
      )}
    </form>
  )
}
