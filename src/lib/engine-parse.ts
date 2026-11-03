export type PvLine = {
  multipv: number
  cp: number | null
  mate: number | null
  pv: string[]
}

export type Analysis = {
  fen: string
  best: string | null
  lines: PvLine[]
}

export function parseInfo(line: string): PvLine | null {
  if (!line.startsWith("info ") || !line.includes(" pv ") || !line.includes(" score ")) {
    return null
  }
  const multipv = Number(line.match(/ multipv (\d+)/)?.[1] ?? "1")
  const mateMatch = line.match(/ score mate (-?\d+)/)
  const cpMatch = line.match(/ score cp (-?\d+)/)
  const pvRaw = line.split(" pv ")[1]
  if (!pvRaw) return null
  const pv = pvRaw.trim().split(/\s+/)
  if (pv.length === 0 || pv[0] === "") return null
  return {
    multipv: Number.isFinite(multipv) ? multipv : 1,
    cp: cpMatch ? Number(cpMatch[1]) : null,
    mate: mateMatch ? Number(mateMatch[1]) : null,
    pv,
  }
}

export function parseBestmove(line: string): string | null | undefined {
  const match = line.match(/^bestmove\s+(\S+)/)
  if (!match) return undefined
  return match[1] === "(none)" ? null : match[1]
}

export function moverCp(line: PvLine): number {
  if (line.mate != null) {
    const sign = line.mate > 0 ? 1 : -1
    return sign * (100000 - Math.min(99, Math.abs(line.mate)))
  }
  return line.cp ?? 0
}

export function centipawnLoss(analysis: Analysis, lan: string): number | null {
  if (!analysis.best) return null
  if (lan === analysis.best) return 0
  const best = analysis.lines.find((line) => line.pv[0] === analysis.best)
  const played = analysis.lines.find((line) => line.pv[0] === lan)
  if (!best || !played) return null
  return Math.max(0, moverCp(best) - moverCp(played))
}

export function toWhite(
  turn: "w" | "b",
  cp: number | null,
  mate: number | null,
): { cp: number | null; mate: number | null } {
  const sign = turn === "w" ? 1 : -1
  return {
    cp: cp == null ? null : cp * sign,
    mate: mate == null ? null : mate * sign,
  }
}
