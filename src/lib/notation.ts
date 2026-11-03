const PIECE_PT: Record<string, string> = {
  K: "R",
  Q: "D",
  R: "T",
  N: "C",
}

export function sanPt(san: string): string {
  if (san === "O-O" || san === "O-O-O") return san
  const letter = PIECE_PT[san[0]]
  if (!letter) return san
  return letter + san.slice(1)
}

export function formatCp(cp: number): string {
  const pawns = cp / 100
  const abs = Math.abs(pawns).toFixed(1).replace(".", ",")
  if (pawns > 0) return `+${abs}`
  if (pawns < 0) return `-${abs}`
  return "0,0"
}

export function formatMate(mate: number): string {
  const n = Math.abs(mate)
  if (n === 0) return "xeque-mate"
  return mate > 0 ? `mate em ${n}` : `-mate em ${n}`
}

export function formatMoverScore(cp: number | null, mate: number | null): string | null {
  if (mate != null) return formatMate(mate)
  if (cp == null) return null
  return formatCp(cp)
}

export function bookKey(fen: string): string {
  return fen.split(" ").slice(0, 4).join(" ")
}

export function uciParts(uci: string): {
  from: string
  to: string
  promotion?: "q" | "r" | "b" | "n"
} {
  const move: { from: string; to: string; promotion?: "q" | "r" | "b" | "n" } = {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
  }
  const promotion = uci[4] as "q" | "r" | "b" | "n" | undefined
  if (promotion) move.promotion = promotion
  return move
}
