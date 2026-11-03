import type { Square } from "chess.js"

import { ARROW_AMBER, ARROW_BLUE, ARROW_GREEN, ARROW_RED } from "@/lib/arrows"
import { replay, safeMove } from "@/lib/game"
import {
  explainLine,
  gradeOf,
  isLastBook,
  type Grade,
} from "@/lib/review"
import type { Mark } from "@/lib/session"

export type ReviewSquare = { square: string; color: string }
export type ReviewArrow = { from: string; to: string; color: string; label: string }

export type ReviewPicture = {
  squares: ReviewSquare[]
  badge: { square: string; grade: Grade } | null
  arrows: ReviewArrow[]
  sentence: string | null
}

const WASH: Record<Grade, string> = {
  livro: "#d6b07a",
  brilhante: "#3aa0e0",
  grande: "#5c9e3a",
  melhor: "#7fa650",
  excelente: "#8fbf63",
  bom: "#a3c46a",
  imprecisao: "#e6c34a",
  erro: "#e08a3c",
  omissao: "#e07a7a",
  vacilo: "#d4534a",
}

const PIECE: Record<string, string> = {
  p: "o peão",
  n: "o cavalo",
  b: "o bispo",
  r: "a torre",
  q: "a dama",
  k: "o rei",
}

const CENTER = new Set(["d4", "d5", "e4", "e5"])

export function reviewPicture(
  startFen: string,
  sans: string[],
  marks: Mark[],
  ply: number,
): ReviewPicture | null {
  if (ply < 1) return null
  const san = sans[ply - 1]
  if (!san) return null
  const before = replay(startFen, sans.slice(0, ply - 1))
  const move = safeMove(before, san)
  if (!move) return null
  const mark = marks.find((item) => item.ply === ply) ?? null
  const grade = mark ? gradeOf(mark) : null
  const wash = grade ? WASH[grade] : "#c4a574"
  const squares = [move.from, ...between(move.from, move.to), move.to].map((square) => ({
    square,
    color: wash,
  }))
  const badge = grade ? { square: move.to, grade } : null
  const same = Boolean(mark?.matched)
  const lastBook = grade === "livro" && isLastBook(marks, ply)
  const best = mark?.best && mark.best.length >= 4 ? mark.best : null
  const bestSan = mark?.bestSan ?? null
  const after = replay(startFen, sans.slice(0, ply))

  if (grade === "vacilo") {
    const loose = pieceOn(after, move.to)
    return {
      squares,
      badge,
      arrows: [{ from: move.from, to: move.to, color: ARROW_RED, label: "Lance jogado" }],
      sentence: loose
        ? `Esse lance deixa ${PIECE[loose] ?? "a peça"} sem defesa.`
        : explainLine(grade, bestSan, same, lastBook),
    }
  }

  const hanging = looseCapture(after)
  if (hanging && (grade === "erro" || grade === "omissao")) {
    return {
      squares,
      badge,
      arrows: [{ from: hanging.from, to: hanging.to, color: ARROW_BLUE, label: "Peça sem defesa" }],
      sentence: `Esse lance deixa ${PIECE[hanging.captured] ?? "uma peça"} sem defesa.`,
    }
  }

  const missed = grade === "imprecisao" || grade === "erro" || grade === "omissao"
  if (missed && best && best !== move.lan) {
    return {
      squares,
      badge,
      arrows: [{ from: best.slice(0, 2), to: best.slice(2, 4), color: ARROW_GREEN, label: "Melhor lance" }],
      sentence: explainLine(grade, bestSan, same, lastBook),
    }
  }

  const idea = grade ? ideaOf(after, move) : null
  if (idea && grade && isQuiet(grade)) {
    return {
      squares,
      badge,
      arrows: [{ from: idea.from, to: idea.to, color: ARROW_AMBER, label: idea.label }],
      sentence: idea.sentence,
    }
  }

  const home = move.color === "w" ? "1" : "8"
  const developed = (move.piece === "n" || move.piece === "b") && move.from[1] === home
  let sentence: string | null = null
  if (move.san.includes("#")) sentence = "Esse lance dá mate."
  else if (move.san.includes("+")) sentence = "Esse lance dá xeque."
  else if (developed && grade && isQuiet(grade)) sentence = "Você desenvolveu uma peça e aumentou o controle do centro."
  else if (grade === "livro" || grade === "brilhante" || grade === "grande") {
    sentence = explainLine(grade, bestSan, same, lastBook)
  } else if (missed && bestSan) sentence = explainLine(grade ?? "imprecisao", bestSan, same, lastBook)
  return { squares, badge, arrows: [], sentence }
}

function isQuiet(grade: Grade): boolean {
  return grade === "livro" || grade === "brilhante" || grade === "grande" || grade === "melhor" || grade === "excelente" || grade === "bom"
}

function ideaOf(
  chess: ReturnType<typeof replay>,
  move: { from: string; to: string; piece: string; color: "w" | "b"; san: string },
): { from: string; to: string; label: string; sentence: string } | null {
  if (move.san.includes("+") || move.san.includes("#")) {
    const enemy = move.color === "w" ? "b" : "w"
    const king = kingSquare(chess, enemy)
    if (king && king !== move.to) {
      return { from: move.to, to: king, label: "Xeque", sentence: "Esse lance dá xeque." }
    }
  }
  const hits = chess
    .moves({ square: move.to as Square, verbose: true })
    .filter((item) => item.captured)
    .sort((a, b) => worth(b.captured) - worth(a.captured))
  const hit = hits[0]
  if (hit?.captured) {
    return {
      from: move.to,
      to: hit.to,
      label: "Ameaça",
      sentence: `Esse lance ataca ${PIECE[hit.captured] ?? "uma peça"} em ${hit.to}.`,
    }
  }
  const opened = openedRay(chess, move.from, move.color)
  if (opened) {
    const name = opened.piece === "q" ? "a dama" : opened.piece === "r" ? "a torre" : "o bispo"
    return {
      from: opened.from,
      to: opened.to,
      label: "Caminho aberto",
      sentence: `Esse lance abre caminho para ${name}.`,
    }
  }
  if (move.piece === "n" || move.piece === "b") {
    const eyes = chess
      .moves({ square: move.to as Square, verbose: true })
      .map((item) => item.to)
      .filter((square) => CENTER.has(square))
    const eye = eyes[0]
    if (eye) {
      return {
        from: move.to,
        to: eye,
        label: "Controle",
        sentence: `Esse lance aumenta o controle de ${eye}.`,
      }
    }
  }
  return null
}

function looseCapture(chess: ReturnType<typeof replay>): { from: string; to: string; captured: string } | null {
  const moves = chess.moves({ verbose: true }).filter((item) => item.captured)
  const loose = moves.filter((item) => {
    const owner = item.color === "w" ? "b" : "w"
    return !chess.isAttacked(item.to, owner)
  })
  loose.sort((a, b) => worth(b.captured) - worth(a.captured))
  const pick = loose[0]
  if (!pick?.captured) return null
  return { from: pick.from, to: pick.to, captured: pick.captured }
}

function pieceOn(chess: ReturnType<typeof replay>, square: string): string | null {
  const piece = chess.get(square as Square)
  if (!piece) return null
  const enemy = piece.color === "w" ? "b" : "w"
  if (chess.isAttacked(square as Square, enemy) && !chess.isAttacked(square as Square, piece.color)) return piece.type
  return null
}

function openedRay(
  chess: ReturnType<typeof replay>,
  vacated: string,
  color: "w" | "b",
): { from: string; to: string; piece: string } | null {
  for (const square of SQUARES) {
    const piece = chess.get(square as Square)
    if (!piece || piece.color !== color) continue
    if (piece.type !== "b" && piece.type !== "r" && piece.type !== "q") continue
    for (const [df, dr] of deltas(piece.type)) {
      const ray = walk(square, df, dr)
      const index = ray.indexOf(vacated)
      if (index < 0) continue
      const after = ray.slice(index + 1)
      let target: string | null = null
      for (const step of after) {
        const occ = chess.get(step as Square)
        if (!occ) {
          target = step
          continue
        }
        target = occ.color === color ? null : step
        break
      }
      if (target && target !== vacated) return { from: square, to: target, piece: piece.type }
    }
  }
  return null
}

function kingSquare(chess: ReturnType<typeof replay>, color: "w" | "b"): string | null {
  for (const square of SQUARES) {
    const piece = chess.get(square as Square)
    if (piece?.type === "k" && piece.color === color) return square
  }
  return null
}

function between(from: string, to: string): string[] {
  const a = coords(from)
  const b = coords(to)
  const df = Math.sign(b.f - a.f)
  const dr = Math.sign(b.r - a.r)
  const file = Math.abs(b.f - a.f)
  const rank = Math.abs(b.r - a.r)
  if ((file !== 0 && rank !== 0 && file !== rank) || (df === 0 && dr === 0)) return []
  const out: string[] = []
  let f = a.f + df
  let r = a.r + dr
  while (f !== b.f || r !== b.r) {
    out.push(squareName(f, r))
    f += df
    r += dr
  }
  return out
}

function walk(from: string, df: number, dr: number): string[] {
  const start = coords(from)
  const out: string[] = []
  let f = start.f + df
  let r = start.r + dr
  while (f >= 0 && f < 8 && r >= 0 && r < 8) {
    out.push(squareName(f, r))
    f += df
    r += dr
  }
  return out
}

function deltas(piece: string): [number, number][] {
  if (piece === "b") return [[1, 1], [1, -1], [-1, 1], [-1, -1]]
  if (piece === "r") return [[1, 0], [-1, 0], [0, 1], [0, -1]]
  return [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]]
}

function worth(piece: string | undefined): number {
  if (piece === "q") return 9
  if (piece === "r") return 5
  if (piece === "b" || piece === "n") return 3
  if (piece === "p") return 1
  return 0
}

function coords(square: string): { f: number; r: number } {
  return { f: square.charCodeAt(0) - 97, r: Number(square[1]) - 1 }
}

function squareName(file: number, rank: number): string {
  return "abcdefgh"[file] + String(rank + 1)
}

const SQUARES = Array.from({ length: 64 }, (_, index) => squareName(index % 8, Math.floor(index / 8)))
