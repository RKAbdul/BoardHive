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

  return (
    <div className="flex flex-col gap-1.5">
      <Select
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
          <SelectValue placeholder={t("factionPlaceholder")} />
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
