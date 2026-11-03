export type NaturalMove = {
  piece: string
  color: "w" | "b"
  from: string
  flags: string
}

export type Candidate = {
  uci: string
  cp: number
  natural: number
}

const WINDOW_CP = 35

export function scoreNatural(ply: number, move: NaturalMove): number {
  let score = 0
  if (move.flags.includes("k") || move.flags.includes("q")) score += 6
  const backRank = move.color === "w" ? "1" : "8"
  if (ply < 16 && (move.piece === "n" || move.piece === "b") && move.from[1] === backRank) {
    score += 4
  }
  if (ply < 8 && move.piece === "q" && !move.flags.includes("c")) score -= 4
  if (
    ply < 12 &&
    move.piece === "k" &&
    !move.flags.includes("k") &&
    !move.flags.includes("q")
  ) {
    score -= 3
  }
  return score
}

export function pickNatural(candidates: Candidate[]): { uci: string; coincides: boolean } {
  const ranked = [...candidates].sort((a, b) => b.cp - a.cp)
  const best = ranked[0]
  if (!best) throw new Error("sem candidatas")
  const window = ranked.filter((candidate) => best.cp - candidate.cp <= WINDOW_CP)
  const picked = [...window].sort((a, b) => b.natural - a.natural || b.cp - a.cp)[0]
  return { uci: picked.uci, coincides: picked.uci === best.uci }
}
