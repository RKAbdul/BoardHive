"use client"

import Image from "next/image"
import { useEffect, useRef, useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { deletePlayPhoto } from "@/features/plays/actions"
import { X } from "lucide-react"

export type Photo = {
  id: string
  url: string
  storagePath: string
  uploadedBy: string
}

export function PhotoCarousel({
  groupId,
  playId,
  photos,
  currentUserId,
}: {
  groupId: string
  playId: string
  photos: Photo[]
  currentUserId: string | null
}) {
  const t = useTranslations("plays.detail.photos")
  const [pending, startTransition] = useTransition()
  const [activeIndex, setActiveIndex] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const track = trackRef.current
    if (!track || photos.length < 2) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting)
        if (!visible) return
        const index = slideRefs.current.indexOf(visible.target as HTMLDivElement)
        if (index !== -1) setActiveIndex(index)
      },
      { root: track, threshold: 0.6 }
    )
    slideRefs.current.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [photos.length])

  if (photos.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={trackRef}
        className="-mx-4 flex touch-pan-x snap-x snap-mandatory gap-2 overflow-x-auto px-4"
      >
        {photos.map((photo, i) => (
          <div
            key={photo.id}
            ref={(el) => {
              slideRefs.current[i] = el
            }}
            className="relative aspect-[4/3] w-[85%] shrink-0 snap-center overflow-hidden rounded-xl bg-muted sm:w-[60%]"
          >
            <a href={photo.url} target="_blank" rel="noopener noreferrer" className="block size-full">
              <Image
                src={photo.url}
                alt=""
                fill
                sizes="(min-width: 640px) 500px, 85vw"
                className="object-cover"
              />
            </a>
            {photo.uploadedBy === currentUserId && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t("delete")}
                disabled={pending}
                onClick={() =>
                  startTransition(() =>
                    deletePlayPhoto(groupId, playId, photo.id, photo.storagePath)
                  )
                }
                className="absolute top-1.5 right-1.5 bg-background/80 hover:bg-background"
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {photos.length > 1 && (
        <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
          {photos.map((photo, i) => (
            <span
              key={photo.id}
              className={`size-1.5 rounded-full transition-colors ${
                i === activeIndex ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
