import { Chess } from "chess.js"

import type { Analysis } from "@/lib/engine-parse"
import { moverCp } from "@/lib/engine-parse"
import { lookupBook } from "@/lib/book"
import { safeMove } from "@/lib/game"
import { scoreNatural, pickNatural } from "@/lib/natural"
import { uciParts } from "@/lib/notation"

export function plyOf(fen: string): number {
  const parts = fen.split(" ")
  const fullmove = Number(parts[5] ?? "1")
  const base = Math.max(0, (Number.isFinite(fullmove) ? fullmove : 1) - 1) * 2
  return parts[1] === "b" ? base + 1 : base
}

export function resolveHuman(
  fen: string,
  analysis: Analysis | null,
): { uci: string; coincides: boolean | null; fromBook: boolean } | null {
  const booked = lookupBook(fen)
  if (booked && safeMove(new Chess(fen), uciParts(booked))) {
    return {
      uci: booked,
      coincides: analysis ? booked === analysis.best : null,
      fromBook: true,
    }
  }
  if (!analysis || analysis.lines.length === 0) return null

  const ply = plyOf(fen)
  const candidates = []
  for (const line of analysis.lines) {
    const uci = line.pv[0]
    if (!uci) continue
    const move = safeMove(new Chess(fen), uciParts(uci))
    if (!move) continue
    candidates.push({
      uci: move.lan,
      cp: moverCp(line),
      natural: scoreNatural(ply, move),
    })
  }
  if (candidates.length === 0) return null
  const picked = pickNatural(candidates)
  return { uci: picked.uci, coincides: picked.coincides, fromBook: false }
}
