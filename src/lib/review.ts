import { sanPt } from "@/lib/notation"
import type { Mark } from "@/lib/session"

export type Grade = "livro" | "brilhante" | "melhor" | "excelente" | "imprecisao" | "erro" | "vacilo"

export const GRADE_COLOR: Record<Grade, string> = {
  livro: "#e6912c",
  brilhante: "#3aa0e0",
  melhor: "#7fa650",
  excelente: "#7fa650",
  imprecisao: "#e6a23c",
  erro: "#e07a2f",
  vacilo: "#d14343",
}

const WORTH: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 }

export function isSacrifice(piece: string, captured: string | undefined): boolean {
  if (!captured) return false
  if (piece !== "b" && piece !== "r" && piece !== "q") return false
  return (WORTH[piece] ?? 0) > (WORTH[captured] ?? 0)
}

export function gradeOf(mark: Pick<Mark, "drop" | "matched" | "book" | "sacrifice">): Grade | null {
  if (mark.book) return "livro"
  if (mark.drop == null && !mark.matched) return null
  if (mark.sacrifice && (mark.matched || mark.drop === 0)) return "brilhante"
  if (mark.matched || mark.drop === 0) return "melhor"
  if (mark.drop == null) return null
  if (mark.drop < 30) return "excelente"
  if (mark.drop < 80) return "imprecisao"
  if (mark.drop < 200) return "erro"
  return "vacilo"
}

export function badgeGrade(grade: Grade | null): Grade | null {
  if (!grade || grade === "excelente") return null
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
  if (grade === "melhor") return `${name} é o melhor`
  if (grade === "excelente") return `${name} é excelente`
  if (grade === "imprecisao") return `${name} é uma imprecisão`
  if (grade === "erro") return `${name} é um erro`
  return `${name} é um vacilo`
}

export function explainLine(grade: Grade, bestSan: string | null, same: boolean, lastBook = false): string | null {
  if (grade === "livro" && lastBook) return "Daqui em diante o livro não garante o lance."
  if (grade === "livro") return "O livro ainda indica um lance daqui."
  if (grade === "brilhante") return "A entrega continua sendo o lance do motor."
  if (same || grade === "melhor") return "O motor joga o mesmo."
  if (bestSan) return `O motor preferia ${sanPt(bestSan)}.`
  return null
}

export function gradeGlyph(grade: Grade): string {
  if (grade === "brilhante") return "!!"
  if (grade === "melhor" || grade === "excelente") return "★"
  if (grade === "imprecisao") return "?!"
  if (grade === "erro") return "?"
  if (grade === "vacilo") return "??"
  return ""
}
