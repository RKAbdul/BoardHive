"use client"

import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { useTranslations } from "next-intl"
import { MAX_PHOTOS_PER_PLAY, MAX_PHOTO_BYTES } from "@/features/plays/schemas"
import { Camera, X } from "lucide-react"

type StagedFile = { file: File; preview: string }

/**
 * Stages photo files for the new-play form. The parent uploads them
 * client-side (straight to Supabase Storage) once the play itself has been
 * created, so this only needs to keep the parent's File[] in sync — no
 * native form submission involved.
 */
export function PhotoPicker({ onFilesChange }: { onFilesChange: (files: File[]) => void }) {
  const t = useTranslations("plays.new.photos")
  const inputRef = useRef<HTMLInputElement>(null)
  const [staged, setStaged] = useState<StagedFile[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      staged.forEach((s) => URL.revokeObjectURL(s.preview))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup only, not resynced on every staged change
  }, [])

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? [])
    e.target.value = ""
    if (picked.length === 0) return

    const accepted: File[] = []
    let rejected = false
    for (const file of picked) {
      if (!file.type.startsWith("image/") || file.size > MAX_PHOTO_BYTES) {
        rejected = true
        continue
      }
      accepted.push(file)
    }

    const combined = [...staged.map((s) => s.file), ...accepted]
    const capped = combined.slice(0, MAX_PHOTOS_PER_PLAY)
    if (combined.length > MAX_PHOTOS_PER_PLAY) rejected = true

    staged.forEach((s) => URL.revokeObjectURL(s.preview))
    const next = capped.map((file) => ({ file, preview: URL.createObjectURL(file) }))
    setStaged(next)
    onFilesChange(next.map((s) => s.file))
    setError(rejected ? t("someSkipped") : null)
  }

  function removeAt(index: number) {
    const next = staged.filter((_, i) => i !== index)
    URL.revokeObjectURL(staged[index].preview)
    setStaged(next)
    onFilesChange(next.map((s) => s.file))
    setError(null)
  }

  return (
    <div className="flex flex-col gap-2">
      {staged.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {staged.map((s, i) => (
            <div key={s.preview} className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element -- ephemeral blob: preview, not a remote asset next/image can optimize */}
              <img src={s.preview} alt="" className="size-full object-cover" />
              <button
                type="button"
                aria-label={t("remove")}
                onClick={() => removeAt(i)}
                className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-background/80 text-foreground"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      {staged.length < MAX_PHOTOS_PER_PLAY && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
        >
          <Camera className="size-4" aria-hidden="true" />
          {t("addPhotos")}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={handleChange}
      />

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
