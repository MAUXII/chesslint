import type { Mode, Assistance } from "@/lib/session"

export const ARROW_GREEN = "#7fa650"
export const ARROW_BLUE = "#2f6fad"
export const ARROW_AMBER = "#e6912c"
export const ARROW_RED = "#d14343"

export type ArrowKind = "hint" | "review" | "threat" | "user"

export type BoardArrow = {
  from: string
  to: string
  color: string
  kind: ArrowKind
  label: string
}

export type ArrowSettings = {
  analysis: boolean
  review: boolean
  lastMove: boolean
  threats: boolean
  annotations: boolean
}

export function defaultArrowSettings(): ArrowSettings {
  return {
    analysis: true,
    review: true,
    lastMove: true,
    threats: false,
    annotations: true,
  }
}

export function readArrowSettings(value: unknown): ArrowSettings {
  const base = defaultArrowSettings()
  if (!value || typeof value !== "object") return base
  const raw = value as Partial<ArrowSettings>
  return {
    analysis: raw.analysis !== false,
    review: raw.review !== false,
    lastMove: raw.lastMove !== false,
    threats: raw.threats === true,
    annotations: raw.annotations !== false,
  }
}

export type VisibleInput = {
  mode: Mode
  assistance: Assistance
  drilling: boolean
  reviewing: boolean
  atLive: boolean
  gameOver: boolean
  hintAsked: boolean
  settings: ArrowSettings
  bestUci: string | null
  threatUci: string | null
  reviewArrows: BoardArrow[]
  userArrows: BoardArrow[]
}

export function visibleArrows(input: VisibleInput): BoardArrow[] {
  const out: BoardArrow[] = []
  const quietDrill = input.drilling && !input.hintAsked
  if (
    input.settings.threats &&
    input.mode === "estudo" &&
    !input.reviewing &&
    !quietDrill &&
    input.threatUci
  ) {
    const threat = uciArrow(input.threatUci, ARROW_RED, "threat", "Ameaça")
    if (threat) out.push(threat)
  }
  if (input.reviewing && input.settings.review && !quietDrill) {
    out.push(...input.reviewArrows)
  }
  const study =
    input.mode === "estudo" &&
    input.settings.analysis &&
    input.atLive &&
    !input.gameOver &&
    !input.reviewing &&
    !input.drilling
  const asked = input.hintAsked && input.atLive && !input.gameOver && !input.reviewing && !quietDrill
  if ((study || asked) && input.bestUci) {
    const color = input.assistance === "humano" && asked && !study ? ARROW_BLUE : ARROW_GREEN
    const label = input.assistance === "humano" && asked && !study ? "Lance natural" : "Melhor lance"
    const hint = uciArrow(input.bestUci, color, "hint", label)
    if (hint) out.push(hint)
  }
  if (input.settings.annotations) out.push(...input.userArrows)
  return out
}

export function uciArrow(uci: string, color: string, kind: ArrowKind, label: string): BoardArrow | null {
  if (uci.length < 4) return null
  return { from: uci.slice(0, 2), to: uci.slice(2, 4), color, kind, label }
}
