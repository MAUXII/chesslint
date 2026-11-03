import { replay, safeMove } from "@/lib/game"
import { sanPt } from "@/lib/notation"
import type { Mark } from "@/lib/session"

export type Grade =
  | "livro"
  | "brilhante"
  | "grande"
  | "melhor"
  | "excelente"
  | "bom"
  | "imprecisao"
  | "erro"
  | "omissao"
  | "vacilo"

export const GRADE_COLOR: Record<Grade, string> = {
  livro: "#e6912c",
  brilhante: "#3aa0e0",
  grande: "#5c9e3a",
  melhor: "#7fa650",
  excelente: "#7fa650",
  bom: "#8aaa62",
  imprecisao: "#e6a23c",
  erro: "#e07a2f",
  omissao: "#c47b2b",
  vacilo: "#d14343",
}

export const GRADE_NAME: Record<Grade, string> = {
  livro: "livro",
  brilhante: "brilhante",
  grande: "grande lance",
  melhor: "melhor",
  excelente: "excelente",
  bom: "bom",
  imprecisao: "imprecisão",
  erro: "erro",
  omissao: "omissão",
  vacilo: "vacilo",
}

export function winChance(cp: number): number {
  return 1 / (1 + 10 ** (-cp / 400))
}

const WORTH: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 }

export function isSacrifice(piece: string, captured: string | undefined): boolean {
  if (!captured) return false
  if (piece !== "b" && piece !== "r" && piece !== "q") return false
  return (WORTH[piece] ?? 0) > (WORTH[captured] ?? 0)
}

type Graded = Pick<Mark, "drop" | "matched" | "book" | "sacrifice"> &
  Partial<Pick<Mark, "swing" | "winBefore" | "gap">>

export function gradeOf(mark: Graded): Grade | null {
  if (mark.book) return "livro"
  if (mark.drop == null && !mark.matched && mark.swing == null) return null
  if (mark.sacrifice && (mark.matched || mark.drop === 0 || mark.swing === 0)) return "brilhante"
  if (mark.matched || mark.drop === 0 || mark.swing === 0) {
    if ((mark.gap ?? 0) >= 0.08) return "grande"
    return "melhor"
  }
  if (mark.swing == null) {
    if (mark.drop == null) return null
    if (mark.drop < 30) return "excelente"
    if (mark.drop < 80) return "imprecisao"
    if (mark.drop < 200) return "erro"
    return "vacilo"
  }
  if (mark.swing < 0.02) return "excelente"
  if (mark.swing < 0.05) return "bom"
  if (mark.swing < 0.1) return "imprecisao"
  if (mark.swing < 0.2) return "erro"
  if ((mark.winBefore ?? 0) >= 0.8) return "omissao"
  return "vacilo"
}

export function badgeGrade(grade: Grade | null): Grade | null {
  if (!grade || grade === "excelente" || grade === "bom") return null
  return grade
}

export function isLastBook(marks: Mark[], ply: number): boolean {
  const mark = marks.find((item) => item.ply === ply)
  if (!mark?.book) return false
  if (marks.some((item) => item.ply > ply && item.book)) return false
  return marks.some((item) => item.ply > ply && !item.book)
}

export function formatReviewCp(cp: number): string {
  const pawns = cp / 100
  const abs = Math.abs(pawns).toFixed(2).replace(".", ",")
  if (pawns > 0.005) return `+${abs}`
  if (pawns < -0.005) return `−${abs}`
  return "0,00"
}

export function whiteMoved(startTurn: "w" | "b", ply: number): boolean {
  return (startTurn === "w") === (ply % 2 === 1)
}

export function moverColor(startTurn: "w" | "b", ply: number): "w" | "b" {
  return whiteMoved(startTurn, ply) ? "w" : "b"
}

export function evalSeries(
  evals: (number | null)[],
  marks: Mark[],
  length: number,
  startTurn: "w" | "b",
): (number | null)[] {
  const out: (number | null)[] = []
  for (let ply = 0; ply <= length; ply += 1) {
    const stored = evals[ply]
    if (typeof stored === "number") {
      out.push(stored)
      continue
    }
    const mark = marks.find((item) => item.ply === ply)
    const prev = out[ply - 1]
    if (mark && mark.drop != null && typeof prev === "number") {
      const next = whiteMoved(startTurn, ply) ? prev - mark.drop : prev + mark.drop
      out.push(Math.max(-900, Math.min(900, next)))
    } else {
      out.push(null)
    }
  }
  return out
}

export function gradeLine(san: string, grade: Grade, lastBook: boolean): string {
  const name = sanPt(san)
  if (grade === "livro" && lastBook) return `${name} é o último lance de livro`
  if (grade === "livro") return `${name} está no livro`
  if (grade === "brilhante") return `${name} é brilhante`
  if (grade === "grande") return `${name} é um grande lance`
  if (grade === "melhor") return `${name} é o melhor`
  if (grade === "excelente") return `${name} é excelente`
  if (grade === "bom") return `${name} é bom`
  if (grade === "imprecisao") return `${name} é uma imprecisão`
  if (grade === "erro") return `${name} é um erro`
  if (grade === "omissao") return `${name} é uma omissão`
  return `${name} é um vacilo`
}

export function explainLine(grade: Grade, bestSan: string | null, same: boolean, lastBook = false): string | null {
  if (grade === "livro" && lastBook) return "Daqui em diante o livro não garante o lance."
  if (grade === "livro") return "O livro ainda indica um lance daqui."
  if (grade === "brilhante") return "A entrega continua sendo o lance do motor."
  if (grade === "grande") return "Era o lance, e os outros perdiam mais."
  if (same || grade === "melhor") return "O motor joga o mesmo."
  if (grade === "omissao" && bestSan) return `Havia um lance ganhador. O motor preferia ${sanPt(bestSan)}.`
  if (bestSan) return `O motor preferia ${sanPt(bestSan)}.`
  return null
}

export function gradeGlyph(grade: Grade): string {
  if (grade === "brilhante") return "!!"
  if (grade === "grande") return "!"
  if (grade === "melhor" || grade === "excelente" || grade === "bom") return "★"
  if (grade === "imprecisao" || grade === "omissao") return "?!"
  if (grade === "erro") return "?"
  if (grade === "vacilo") return "??"
  return ""
}

export function coachFor(
  startFen: string,
  sans: string[],
  ply: number,
  grade: Grade,
  bestSan: string | null,
  same: boolean,
  lastBook: boolean,
): string | null {
  const before = replay(startFen, sans.slice(0, Math.max(0, ply - 1)))
  const played = safeMove(before, sans[ply - 1] ?? "")
  const home = played?.color === "w" ? "1" : "8"
  const developed = Boolean(played && (played.piece === "n" || played.piece === "b") && played.from[1] === home)
  if (played?.san.includes("#")) return "Esse lance dá mate."
  if (grade === "omissao") return explainLine(grade, bestSan, same, lastBook)
  if (developed && (grade === "livro" || grade === "melhor" || grade === "grande" || grade === "excelente" || grade === "bom")) {
    return "Você desenvolveu uma peça e aumentou o controle do centro."
  }
  if (played?.san.includes("+")) return "Esse lance dá xeque."
  if (!same && bestSan && (grade === "imprecisao" || grade === "erro" || grade === "vacilo")) {
    return explainLine(grade, bestSan, same, lastBook)
  }
  if (lastBook) return explainLine(grade, bestSan, same, lastBook)
  if (grade === "brilhante" || grade === "grande") return explainLine(grade, bestSan, same, lastBook)
  return null
}

export function markScore(mark: Mark): number {
  const grade = gradeOf(mark)
  if (!grade || grade === "livro" || grade === "melhor" || grade === "brilhante" || grade === "grande") return 1
  if (mark.swing != null) return Math.max(0, 1 - mark.swing)
  if (mark.drop != null) return Math.max(0, 1 - Math.min(1, mark.drop / 300))
  return 1
}

export function accuracyOf(marks: Mark[], startTurn: "w" | "b"): { w: number | null; b: number | null } {
  const sums = { w: 0, b: 0 }
  const counts = { w: 0, b: 0 }
  for (const mark of marks) {
    const color = moverColor(startTurn, mark.ply)
    sums[color] += markScore(mark)
    counts[color] += 1
  }
  return {
    w: counts.w ? Math.round((sums.w / counts.w) * 100) : null,
    b: counts.b ? Math.round((sums.b / counts.b) * 100) : null,
  }
}

export function criticalPlies(marks: Mark[]): number[] {
  return marks
    .filter((mark) => (mark.swing ?? 0) >= 0.1 || (mark.drop ?? 0) >= 80)
    .map((mark) => mark.ply)
    .sort((a, b) => a - b)
}
