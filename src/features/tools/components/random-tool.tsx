"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const DICE_PRESETS = [4, 6, 8, 10, 12, 20]

export function RandomTool() {
  const t = useTranslations("tools.random")

  const [coin, setCoin] = useState<"heads" | "tails" | null>(null)
  const [flipping, setFlipping] = useState(false)

  const [min, setMin] = useState("1")
  const [max, setMax] = useState("6")
  const [rollResult, setRollResult] = useState<number | null>(null)
  const [rolling, setRolling] = useState(false)

  function flipCoin() {
    setFlipping(true)
    setCoin(Math.random() < 0.5 ? "heads" : "tails")
    window.setTimeout(() => setFlipping(false), 400)
  }

  function applyDiceRoll(sides: number, value: number) {
    setMin("1")
    setMax(String(sides))
    setRolling(true)
    setRollResult(value)
    window.setTimeout(() => setRolling(false), 300)
  }

  function rollCustom() {
    const lo = Number(min)
    const hi = Number(max)
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi < lo) return
    setRolling(true)
    setRollResult(Math.floor(Math.random() * (hi - lo + 1)) + lo)
    window.setTimeout(() => setRolling(false), 300)
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-3 font-display text-base font-bold text-foreground">
          {t("coin.title")}
        </h3>
        <div className="flex flex-col items-center gap-3">
          <span
            className={`flex size-20 items-center justify-center rounded-full border-2 border-primary bg-card font-display text-lg font-bold text-foreground transition-transform ${
              flipping ? "animate-spin" : ""
            }`}
          >
            {coin ? (coin === "heads" ? t("coin.heads") : t("coin.tails")) : "?"}
          </span>
          <Button type="button" onClick={flipCoin} size="lg">
            {t("coin.flip")}
          </Button>
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-display text-base font-bold text-foreground">
          {t("dice.title")}
        </h3>
        <div className="flex flex-wrap gap-2">
          {DICE_PRESETS.map((sides) => (
            <Button
              key={sides}
              type="button"
              variant="outline"
              onClick={() => applyDiceRoll(sides, Math.floor(Math.random() * sides) + 1)}
            >
              d{sides}
            </Button>
          ))}
        </div>

        <div className="mt-4 flex items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="range-min">{t("dice.min")}</Label>
            <Input
              id="range-min"
              type="number"
              value={min}
              onChange={(e) => setMin(e.target.value)}
              className="w-20"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="range-max">{t("dice.max")}</Label>
            <Input
              id="range-max"
              type="number"
              value={max}
              onChange={(e) => setMax(e.target.value)}
              className="w-20"
            />
          </div>
          <Button type="button" onClick={rollCustom}>
            {t("dice.roll")}
          </Button>
        </div>

        {rollResult !== null && (
          <p
            className={`mt-4 text-center font-display text-5xl font-bold tabular-nums text-foreground transition-transform duration-300 ${
              rolling ? "scale-110" : "scale-100"
            }`}
          >
            {rollResult}
          </p>
        )}
      </div>
    </div>
  )
}
