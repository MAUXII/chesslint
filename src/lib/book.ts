import { Chess } from "chess.js"

import { bookKey, uciParts } from "@/lib/notation"
import { safeMove } from "@/lib/game"

export type OpeningLine = {
  weight: number
  moves: string[]
}

export const OPENING_LINES: OpeningLine[] = [
  {
    weight: 10,
    moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5", "Bb3", "d6", "c3", "O-O"],
  },
  {
    weight: 8,
    moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6", "O-O", "Nxe4"],
  },
  {
    weight: 9,
    moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d3", "d6", "O-O", "O-O"],
  },
  {
    weight: 8,
    moves: ["e4", "e5", "Nf3", "Nf6", "Nxe5", "d6", "Nf3", "Nxe4", "d4"],
  },
  {
    weight: 8,
    moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"],
  },
  {
    weight: 7,
    moves: ["e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4"],
  },
  {
    weight: 7,
    moves: ["e4", "e6", "d4", "d5", "Nc3", "Nf6"],
  },
  {
    weight: 7,
    moves: ["e4", "c6", "d4", "d5", "Nc3"],
  },
  {
    weight: 4,
    moves: ["e4", "d5", "exd5", "Qxd5", "Nc3"],
  },
  {
    weight: 9,
    moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Nf3"],
  },
  {
    weight: 8,
    moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6"],
  },
  {
    weight: 7,
    moves: ["d4", "Nf6", "c4", "e6", "Nf3", "d5"],
  },
  {
    weight: 6,
    moves: ["d4", "Nf6", "c4", "g6", "Nc3", "d5"],
  },
  {
    weight: 5,
    moves: ["Nf3", "d5", "g3", "Nf6", "Bg2", "e6", "O-O"],
  },
  {
    weight: 5,
    moves: ["c4", "e5", "Nc3", "Nf6", "g3"],
  },
]

export function buildBook(lines: OpeningLine[] = OPENING_LINES): Map<string, string> {
  const best = new Map<string, { uci: string; weight: number }>()

  for (const line of lines) {
    const chess = new Chess()
    for (const san of line.moves) {
      const key = bookKey(chess.fen())
      const move = safeMove(chess, san)
      if (!move) {
        throw new Error(`lance ilegal no livro: ${san}`)
      }
      const current = best.get(key)
      if (!current || line.weight > current.weight) {
        best.set(key, { uci: move.lan, weight: line.weight })
      }
    }
  }

  return new Map([...best].map(([key, value]) => [key, value.uci]))
}

const book = buildBook()

export function lookupBook(fen: string): string | null {
  return book.get(bookKey(fen)) ?? null
}

export function bookMoveLegal(fen: string, uci: string): boolean {
  const chess = new Chess(fen)
  return safeMove(chess, uciParts(uci)) != null
}
