import { openingTitle } from "@/lib/book"
import { drillById } from "@/lib/drills"
import type { Analysis } from "@/lib/engine-parse"
import { START_FEN, replay, safeMove } from "@/lib/game"
import { isBoardTheme, isPieceStyle, type BoardTheme, type PieceStyle, type Tab } from "@/lib/look"
import { bookKey, formatDrop, sanPt, uciParts } from "@/lib/notation"

export type Color = "w" | "b"
export type Mode = "partida" | "estudo"
export type Assistance = "livre" | "melhor" | "humano"
export type Strength = "iniciante" | "clube" | "forte"
export type NoteTag = "ideia" | "erro" | "abertura" | "tatica" | "final"

export type { BoardTheme, PieceStyle, Tab }

export type Note = {
  ply: number
  san: string
  fen: string
  tag: NoteTag
  text: string
}

export type Mark = {
  ply: number
  matched: boolean
  drop: number | null
  book: boolean
  best: string | null
  bestSan: string | null
  sacrifice: boolean
}

export type ArchivedGame = {
  id: string
  label: string
  savedAt: number
  startFen: string
  sans: string[]
  notes: Note[]
  marks: Mark[]
  evals: (number | null)[]
  player: Color
}

export type Session = {
  startFen: string
  sans: string[]
  notes: Note[]
  marks: Mark[]
  player: Color
  mode: Mode
  assistance: Assistance
  strength: Strength
  review: boolean
  boardTheme: BoardTheme
  pieceStyle: PieceStyle
  tab: Tab
  sound: boolean
  welcomed: boolean
  drillId: string | null
  evals: (number | null)[]
  archive: ArchivedGame[]
}

export const STORAGE_KEY = "lance.session.v1"
export const ARCHIVE_LIMIT = 12

export const STRENGTH_PRESET: Record<Strength, { skill: number; movetime: number }> = {
  iniciante: { skill: 2, movetime: 520 },
  clube: { skill: 8, movetime: 700 },
  forte: { skill: 16, movetime: 900 },
}

export const TAGS: { value: NoteTag; label: string }[] = [
  { value: "ideia", label: "ideia" },
  { value: "erro", label: "erro" },
  { value: "abertura", label: "abertura" },
  { value: "tatica", label: "tática" },
  { value: "final", label: "final" },
]

export function defaultSession(): Session {
  return {
    startFen: START_FEN,
    sans: [],
    notes: [],
    marks: [],
    player: "w",
    mode: "partida",
    assistance: "livre",
    strength: "clube",
    review: true,
    boardTheme: "pedra",
    pieceStyle: "classico",
    tab: "configurar",
    sound: true,
    welcomed: false,
    drillId: null,
    evals: [],
    archive: [],
  }
}

export function tally(marks: Mark[]): { attempts: number; matches: number } {
  return {
    attempts: marks.length,
    matches: marks.filter((mark) => mark.matched).length,
  }
}

export function fenBefore(startFen: string, sans: string[], ply: number): string {
  return replay(startFen, sans.slice(0, Math.max(0, ply - 1))).fen()
}

export function loadSession(raw: string | null): Session | null {
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as Partial<Session>
    if (!data || typeof data.startFen !== "string" || !Array.isArray(data.sans)) return null
    const base = defaultSession()
    return {
      ...base,
      ...data,
      sans: data.sans.filter((san) => typeof san === "string"),
      notes: Array.isArray(data.notes) ? data.notes : [],
      marks: readMarks(data.marks),
      archive: Array.isArray(data.archive)
        ? data.archive.slice(0, ARCHIVE_LIMIT).map((item) => {
            const game = item as ArchivedGame
            return { ...game, marks: readMarks(game?.marks), evals: readEvals(game?.evals) }
          })
        : [],
      boardTheme: isBoardTheme(data.boardTheme) ? data.boardTheme : base.boardTheme,
      pieceStyle: isPieceStyle(data.pieceStyle) ? data.pieceStyle : base.pieceStyle,
      tab: data.tab === "jogo" ? "jogo" : "configurar",
      sound: data.sound !== false,
      welcomed: data.welcomed === true,
      drillId: drillById(data.drillId) ? data.drillId! : null,
      evals: readEvals(data.evals),
    }
  } catch {
    return null
  }
}

export function sessionLabel(session: Pick<Session, "sans" | "startFen">, savedAt = Date.now()): string {
  const when = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(savedAt)
  const opening = session.startFen === START_FEN ? openingTitle(session.sans) : null
  if (opening) return `${opening} · ${when}`
  return `${session.sans.length} lances · ${when}`
}

export function largestDrop(marks: Mark[], sans: string[]): { ply: number; san: string; drop: number } | null {
  let worst: { ply: number; san: string; drop: number } | null = null
  for (const mark of marks) {
    if (mark.drop == null || mark.drop < 20) continue
    const san = sans[mark.ply - 1]
    if (!san) continue
    if (!worst || mark.drop > worst.drop) worst = { ply: mark.ply, san, drop: mark.drop }
  }
  return worst
}

export function dropLine(marks: Mark[], sans: string[]): string | null {
  const worst = largestDrop(marks, sans)
  if (!worst) return null
  const n = Math.ceil(worst.ply / 2)
  return `A avaliação caiu mais no lance ${n}, ${sanPt(worst.san)}, ${formatDrop(worst.drop)} peões.`
}

function readMarks(value: unknown): Mark[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return []
    const mark = item as Partial<Mark>
    if (typeof mark.ply !== "number" || typeof mark.matched !== "boolean") return []
    const drop = typeof mark.drop === "number" && Number.isFinite(mark.drop) ? mark.drop : null
    return [
      {
        ply: mark.ply,
        matched: mark.matched,
        drop,
        book: mark.book === true,
        best: typeof mark.best === "string" ? mark.best : null,
        bestSan: typeof mark.bestSan === "string" ? mark.bestSan : null,
        sacrifice: mark.sacrifice === true,
      },
    ]
  })
}

function readEvals(value: unknown): (number | null)[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => (typeof item === "number" && Number.isFinite(item) ? item : null))
}

export function pushArchive(session: Session, savedAt = Date.now()): ArchivedGame[] {
  if (session.sans.length === 0 && session.notes.length === 0) return session.archive
  const item: ArchivedGame = {
    id: globalThis.crypto.randomUUID(),
    label: sessionLabel(session, savedAt),
    savedAt,
    startFen: session.startFen,
    sans: session.sans,
    notes: session.notes,
    marks: session.marks,
    evals: session.evals,
    player: session.player,
  }
  return [item, ...session.archive].slice(0, ARCHIVE_LIMIT)
}

export function freshPosition(session: Session, patch: Partial<Session> = {}): Session {
  return {
    ...session,
    startFen: START_FEN,
    sans: [],
    notes: [],
    marks: [],
    evals: [],
    drillId: null,
    archive: pushArchive(session),
    ...patch,
  }
}

export function undoCount(session: Session): number {
  if (session.sans.length === 0) return 0
  if (session.mode === "estudo") return 1
  const chess = replay(session.startFen, session.sans)
  const history = chess.history({ verbose: true })
  const last = history[history.length - 1]
  const opponent = session.player === "w" ? "b" : "w"
  if (last?.color === opponent && session.sans.length >= 2) return 2
  return 1
}

export function analysisMatches(analysis: Analysis | null, fen: string): boolean {
  return Boolean(analysis && bookKey(analysis.fen) === bookKey(fen))
}

export function pvSans(fen: string, ucis: string[], limit = 3): string[] {
  const chess = replay(fen, [])
  const out: string[] = []
  for (const uci of ucis.slice(0, limit)) {
    const move = safeMove(chess, uciParts(uci))
    if (!move) break
    out.push(sanPt(move.san))
  }
  return out
}
