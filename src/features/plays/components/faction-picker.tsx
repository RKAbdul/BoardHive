"use client"

import { useTranslations } from "next-intl"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

const NEW_FACTION_VALUE = "__new__"

export type FactionValue = {
  factionId: string | null
  newFactionName: string | null
}

export function FactionPicker({
  factions,
  value,
  onChange,
}: {
  factions: { id: string; name: string }[]
  value: FactionValue
  onChange: (value: FactionValue) => void
}) {
  const t = useTranslations("plays.new")
  const isCreatingNew = value.newFactionName !== null

  // Base UI's Select.Value renders the raw value — here a faction UUID —
  // unless it's given a value→label map. The explicit lookup in SelectValue
  // below also covers the moment on the edit page where a saved faction is
  // already selected but this game's faction list hasn't loaded yet: show
  // nothing rather than flash the id.
  const labels: Record<string, string> = { [NEW_FACTION_VALUE]: t("newFaction") }
  for (const f of factions) labels[f.id] = f.name

  return (
    <div className="flex flex-col gap-1.5">
      <Select
        items={labels}
        value={isCreatingNew ? NEW_FACTION_VALUE : value.factionId}
        onValueChange={(v) => {
          if (v === NEW_FACTION_VALUE) {
            onChange({ factionId: null, newFactionName: "" })
          } else {
            onChange({ factionId: v, newFactionName: null })
          }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            {(selected: string | null) =>
              selected === null ? (
                <span className="text-muted-foreground">{t("factionPlaceholder")}</span>
              ) : (
                (labels[selected] ?? "…")
              )
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {factions.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              {f.name}
            </SelectItem>
          ))}
          <SelectItem value={NEW_FACTION_VALUE}>{t("newFaction")}</SelectItem>
        </SelectContent>
      </Select>

      {isCreatingNew && (
        <Input
          autoFocus
          type="text"
          placeholder={t("newFactionPlaceholder")}
          value={value.newFactionName ?? ""}
          onChange={(e) => onChange({ factionId: null, newFactionName: e.target.value })}
        />
      )}
    </div>
  )
}
