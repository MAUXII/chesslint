import { Chess, type Move } from "chess.js"

export const START_FEN = new Chess().fen()

export function safeMove(
  chess: Chess,
  move: string | { from: string; to: string; promotion?: string },
): Move | null {
  try {
    return chess.move(move)
  } catch {
    return null
  }
}

export function replay(startFen: string, sans: string[]): Chess {
  const chess = new Chess(startFen)
  for (const san of sans) {
    if (!safeMove(chess, san)) break
  }
  return chess
}

export function parseFen(fen: string): string | null {
  const trimmed = fen.trim()
  if (!trimmed) return null
  try {
    return new Chess(trimmed).fen()
  } catch {
    return null
  }
}

export type Placement = {
  id: string
  square: string
  color: "w" | "b"
  type: string
}

export function placements(startFen: string, sans: string[]): Placement[] {
  const chess = new Chess(startFen)
  let pieces = seed(chess)
  for (const san of sans) {
    const move = safeMove(chess, san)
    if (!move) break
    pieces = applyPlacement(pieces, move)
  }
  return pieces
}

function seed(chess: Chess): Placement[] {
  const board = chess.board()
  const pieces: Placement[] = []
  let n = 0
  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const piece = board[rank][file]
      if (!piece) continue
      pieces.push({
        id: `${piece.color}${piece.type}-${n}`,
        square: "abcdefgh"[file] + String(8 - rank),
        color: piece.color,
        type: piece.type,
      })
      n += 1
    }
  }
  return pieces
}

function applyPlacement(pieces: Placement[], move: Move): Placement[] {
  let next = pieces.map((piece) => ({ ...piece }))
  if (move.flags.includes("e")) {
    const rank = Number(move.to[1]) + (move.color === "w" ? -1 : 1)
    const captured = move.to[0] + String(rank)
    next = next.filter((piece) => piece.square !== captured)
  } else if (move.captured) {
    next = next.filter((piece) => piece.square !== move.to)
  }
  const mover = next.find((piece) => piece.square === move.from)
  if (mover) {
    mover.square = move.to
    if (move.promotion) mover.type = move.promotion
  }
  if (move.flags.includes("k") || move.flags.includes("q")) {
    const rank = move.color === "w" ? "1" : "8"
    const fromFile = move.flags.includes("k") ? "h" : "a"
    const toFile = move.flags.includes("k") ? "f" : "d"
    const rook = next.find((piece) => piece.square === fromFile + rank && piece.type === "r")
    if (rook) rook.square = toFile + rank
  }
  return next
}

export function resultText(chess: Chess): string | null {
  if (!chess.isGameOver()) return null
  if (chess.isCheckmate()) {
    const winner = chess.turn() === "w" ? "pretas" : "brancas"
    return `Xeque-mate. As ${winner} vencem.`
  }
  if (chess.isStalemate()) return "Afogamento."
  if (chess.isThreefoldRepetition()) return "Empate por repetição."
  if (chess.isInsufficientMaterial()) return "Empate por material insuficiente."
  return "Empate."
}

export function toPgn(startFen: string, sans: string[]): string {
  return replay(startFen, sans).pgn()
}

export function squareOfKing(chess: Chess, color: "w" | "b"): string | null {
  const board = chess.board()
  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const piece = board[rank][file]
      if (piece?.type === "k" && piece.color === color) {
        return "abcdefgh"[file] + String(8 - rank)
      }
    }
  }
  return null
}
