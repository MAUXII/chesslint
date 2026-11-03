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

const OPENING_TITLES: { name: string; moves: string[] }[] = [
  { name: "Abertura do rei", moves: ["e4"] },
  { name: "Partida aberta", moves: ["e4", "e5"] },
  { name: "Ruy López", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"] },
  { name: "Defesa Berlim", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6"] },
  { name: "Italiana", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4"] },
  { name: "Giuoco Piano", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5"] },
  { name: "Defesa Petrov", moves: ["e4", "e5", "Nf3", "Nf6"] },
  { name: "Siciliana", moves: ["e4", "c5"] },
  { name: "Siciliana Najdorf", moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"] },
  { name: "Defesa Francesa", moves: ["e4", "e6"] },
  { name: "Caro-Kann", moves: ["e4", "c6"] },
  { name: "Escandinava", moves: ["e4", "d5"] },
  { name: "Abertura da dama", moves: ["d4"] },
  { name: "Gambito da Dama", moves: ["d4", "d5", "c4"] },
  { name: "Gambito da Dama recusado", moves: ["d4", "d5", "c4", "e6"] },
  { name: "Índia do Rei", moves: ["d4", "Nf6", "c4", "g6"] },
  { name: "Defesa Grünfeld", moves: ["d4", "Nf6", "c4", "g6", "Nc3", "d5"] },
  { name: "Abertura Réti", moves: ["Nf3"] },
  { name: "Abertura Inglesa", moves: ["c4"] },
]

export function openingTitle(sans: string[]): string | null {
  let name: string | null = null
  let length = 0
  for (const line of OPENING_TITLES) {
    if (line.moves.length <= length) continue
    const matches = line.moves.every((san, index) => sans[index] === san)
    if (!matches) continue
    name = line.name
    length = line.moves.length
  }
  return name
}

export function lookupBook(fen: string): string | null {
  return book.get(bookKey(fen)) ?? null
}

export function bookMoveLegal(fen: string, uci: string): boolean {
  const chess = new Chess(fen)
  return safeMove(chess, uciParts(uci)) != null
}
