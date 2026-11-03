export type DrillKind = "exercicio" | "final"

export type Drill = {
  id: string
  kind: DrillKind
  title: string
  prompt: string
  fen: string
  player: "w" | "b"
  solutions: string[]
}

export const DRILLS: Drill[] = [
  {
    id: "mate-torre",
    kind: "exercicio",
    title: "Mate em um",
    prompt: "As brancas dão mate em um lance.",
    fen: "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
    player: "w",
    solutions: ["Ra8#"],
  },
  {
    id: "garfo",
    kind: "exercicio",
    title: "Garfo",
    prompt: "O cavalo ataca o rei e a torre ao mesmo tempo.",
    fen: "r3k3/8/8/3N4/8/8/8/4K3 w - - 0 1",
    player: "w",
    solutions: ["Nc7+"],
  },
  {
    id: "rei-peao",
    kind: "final",
    title: "Rei e peão",
    prompt: "O rei sai da frente do peão e abre caminho.",
    fen: "8/8/8/4k3/8/4P3/4K3/8 w - - 0 1",
    player: "w",
    solutions: ["Kd3", "Kf3"],
  },
  {
    id: "torre",
    kind: "final",
    title: "Torre",
    prompt: "A torre corta o rei na quarta fila.",
    fen: "8/8/8/8/4k3/8/8/R3K3 w - - 0 1",
    player: "w",
    solutions: ["Ra4+"],
  },
]

export function drillById(id: string | null | undefined): Drill | null {
  if (!id) return null
  return DRILLS.find((drill) => drill.id === id) ?? null
}

export function drillProgress(drill: Drill, sans: string[]): "waiting" | "solved" | "missed" {
  if (sans.length === 0) return "waiting"
  return drill.solutions.includes(sans[0]) ? "solved" : "missed"
}
