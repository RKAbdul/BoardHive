"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ParticipantPicker } from "@/features/tools/components/participant-picker"
import { TurnOrderTool } from "@/features/tools/components/turn-order-tool"
import { TeamsTool } from "@/features/tools/components/teams-tool"
import { RandomTool } from "@/features/tools/components/random-tool"
import type { ToolParticipant } from "@/features/tools/types"

type Member = { user_id: string; display_name: string }
type Game = { bgg_id: number; name: string; image_url: string | null }

export function ToolsPanel({
  groupId,
  members,
  libraryGames,
}: {
  groupId: string
  members: Member[]
  libraryGames: Game[]
}) {
  const t = useTranslations("tools")
  const [tab, setTab] = useState<"order" | "teams" | "random">("order")
  // Defaults to everyone in the hive — for most nights that's who's there,
  // so the common case is zero taps; absentees get tapped off instead.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(members.map((m) => m.user_id))
  )
  const [guests, setGuests] = useState<ToolParticipant[]>([])

  function toggleMember(userId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  function addGuest(name: string) {
    setGuests((prev) => [...prev, { key: `guest:${Date.now()}`, name }])
  }

  function removeGuest(key: string) {
    setGuests((prev) => prev.filter((g) => g.key !== key))
  }

  const participants: ToolParticipant[] = useMemo(
    () => [
      ...members
        .filter((m) => selectedIds.has(m.user_id))
        .map((m) => ({ key: `user:${m.user_id}`, name: m.display_name })),
      ...guests,
    ],
    [members, selectedIds, guests]
  )

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
      <TabsList className="w-full">
        <TabsTrigger value="order">{t("tabs.order")}</TabsTrigger>
        <TabsTrigger value="teams">{t("tabs.teams")}</TabsTrigger>
        <TabsTrigger value="random">{t("tabs.random")}</TabsTrigger>
      </TabsList>

      <TabsContent value="order" className="mt-5 flex flex-col gap-5">
        <ParticipantPicker
          members={members}
          selectedIds={selectedIds}
          onToggleMember={toggleMember}
          guests={guests}
          onAddGuest={addGuest}
          onRemoveGuest={removeGuest}
        />
        <TurnOrderTool groupId={groupId} libraryGames={libraryGames} participants={participants} />
      </TabsContent>

      <TabsContent value="teams" className="mt-5 flex flex-col gap-5">
        <ParticipantPicker
          members={members}
          selectedIds={selectedIds}
          onToggleMember={toggleMember}
          guests={guests}
          onAddGuest={addGuest}
          onRemoveGuest={removeGuest}
        />
        <TeamsTool participants={participants} />
      </TabsContent>

      <TabsContent value="random" className="mt-5">
        <RandomTool />
      </TabsContent>
    </Tabs>
  )
}
