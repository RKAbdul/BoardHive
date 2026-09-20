"use client"

import { useRef, useState, useTransition, type ChangeEvent } from "react"
import { useTranslations } from "next-intl"
import { confirmPhotoUpload } from "@/features/plays/actions"
import { createClient } from "@/lib/supabase/client"
import { MAX_PHOTO_BYTES, type PhotoErrorCode } from "@/features/plays/schemas"
import { Camera } from "lucide-react"

function errorMessage(t: ReturnType<typeof useTranslations<"plays.detail.photos">>, code: PhotoErrorCode) {
  switch (code) {
    case "invalidType":
      return t("errors.invalidType")
    case "tooLarge":
      return t("errors.tooLarge")
    default:
      return t("errors.generic")
  }
}

export function PhotoUploader({ groupId, playId }: { groupId: string; playId: string }) {
  const t = useTranslations("plays.detail.photos")
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<PhotoErrorCode | null>(null)

  function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ""
    if (files.length === 0) return

    setError(null)
    startTransition(async () => {
      // Uploaded straight to Supabase Storage from here, not through a
      // server action — Vercel's serverless functions cap request bodies
      // at 4.5MB, well under what a real photo can be. confirmPhotoUpload
      // only records the resulting path once the bytes are already there.
      const supabase = createClient()
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          setError("invalidType")
          continue
        }
        if (file.size > MAX_PHOTO_BYTES) {
          setError("tooLarge")
          continue
        }

        const path = `${groupId}/${playId}/${crypto.randomUUID()}`
        const { error: uploadError } = await supabase.storage
          .from("play-photos")
          .upload(path, file, { contentType: file.type })
        if (uploadError) {
          setError("generic")
          continue
        }

        const result = await confirmPhotoUpload(groupId, playId, path)
        if (result.error) setError(result.error)
      }
    })
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50"
      >
        <Camera className="size-4" aria-hidden="true" />
        {pending ? t("uploading") : t("addPhoto")}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={handleFiles}
      />
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {errorMessage(t, error)}
        </p>
      )}
    </div>
  )
}
