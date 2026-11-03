import { lookupBook } from "@/lib/book"
import { drillById } from "@/lib/drills"
import { centipawnLoss, toWhite, type Analysis } from "@/lib/engine-parse"
import { isSacrifice } from "@/lib/review"
import { safeMove, replay } from "@/lib/game"
import { formatMoverScore, uciParts } from "@/lib/notation"
import {
  analysisMatches,
  defaultSession,
  freshPosition,
  pushArchive,
  undoCount,
  type Note,
  type Session,
  type Color,
  type Mode,
  type Assistance,
  type Strength,
  type BoardTheme,
  type PieceStyle,
  type Tab,
} from "@/lib/session"

export type Review = {
  playedSan: string
  bestSan: string
  same: boolean
  played: string | null
  best: string | null
}

export type EngineStatus = "booting" | "ready" | "error"

export type State = {
  hydrated: boolean
  session: Session
  analysis: Analysis | null
  engineStatus: EngineStatus
  thinking: boolean
  replyFailed: boolean
  reviewLine: Review | null
  viewPly: number | null
}

export type Action =
  | { type: "hydrate"; session: Session }
  | { type: "engine-status"; status: EngineStatus }
  | { type: "thinking"; thinking: boolean }
  | { type: "analysis"; analysis: Analysis }
  | { type: "user-move"; san: string }
  | { type: "engine-move"; uci: string }
  | { type: "undo" }
  | { type: "new-game" }
  | { type: "set-player"; player: Color }
  | { type: "set-mode"; mode: Mode }
  | { type: "set-assistance"; assistance: Assistance }
  | { type: "set-strength"; strength: Strength }
  | { type: "set-review"; review: boolean }
  | { type: "set-board"; board: BoardTheme }
  | { type: "set-pieces"; pieces: PieceStyle }
  | { type: "set-tab"; tab: Tab }
  | { type: "set-sound"; sound: boolean }
  | {
      type: "welcome-done"
      patch: Pick<Session, "player" | "mode" | "assistance" | "strength" | "boardTheme" | "pieceStyle" | "sound">
    }
  | { type: "view-ply"; ply: number }
  | { type: "load-fen"; fen: string }
  | { type: "save-note"; note: Note }
  | { type: "delete-note"; ply: number }
  | { type: "open-archive"; id: string }
  | { type: "start-drill"; id: string }

export const initialState: State = {
  hydrated: false,
  session: defaultSession(),
  analysis: null,
  engineStatus: "booting",
  thinking: false,
  replyFailed: false,
  reviewLine: null,
  viewPly: null,
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { ...state, hydrated: true, session: action.session }
    case "engine-status":
      return { ...state, engineStatus: action.status }
    case "thinking":
      return state.thinking === action.thinking ? state : { ...state, thinking: action.thinking }
    case "analysis": {
      const chess = replay(state.session.startFen, state.session.sans)
      if (!analysisMatches(action.analysis, chess.fen())) return state
      const line = action.analysis.lines.find((item) => item.pv[0] === action.analysis.best) ?? action.analysis.lines[0]
      let evals = state.session.evals
      if (line) {
        const white = toWhite(chess.turn(), line.cp, line.mate)
        const score = white.mate != null ? (white.mate > 0 ? 900 : -900) : white.cp
        if (score != null) {
          evals = state.session.evals.slice()
          evals[state.session.sans.length] = score
        }
      }
      return { ...state, analysis: action.analysis, session: { ...state.session, evals } }
    }
    case "user-move":
      return applyUserMove(state, action.san)
    case "engine-move":
      return applyEngineMove(state, action.uci)
    case "undo":
      return undo(state)
    case "new-game":
      return reset(state, freshPosition(state.session))
    case "set-player":
      if (state.session.player === action.player) return state
      if (state.session.sans.length === 0 && state.session.notes.length === 0) {
        return { ...state, session: { ...state.session, player: action.player } }
      }
      return reset(state, freshPosition(state.session, { player: action.player }))
    case "set-mode":
      return { ...state, session: { ...state.session, mode: action.mode }, replyFailed: false }
    case "set-assistance":
      return { ...state, session: { ...state.session, assistance: action.assistance } }
    case "set-strength":
      return { ...state, session: { ...state.session, strength: action.strength } }
    case "set-review":
      return { ...state, session: { ...state.session, review: action.review } }
    case "set-board":
      return { ...state, session: { ...state.session, boardTheme: action.board } }
    case "set-pieces":
      return { ...state, session: { ...state.session, pieceStyle: action.pieces } }
    case "set-tab":
      return { ...state, session: { ...state.session, tab: action.tab } }
    case "set-sound":
      return { ...state, session: { ...state.session, sound: action.sound } }
    case "welcome-done":
      return {
        ...state,
        session: { ...state.session, ...action.patch, welcomed: true, tab: "jogo" },
      }
    case "view-ply":
      if (action.ply >= state.session.sans.length) return { ...state, viewPly: null }
      return { ...state, viewPly: action.ply }
    case "load-fen":
      return reset(state, freshPosition(state.session, { startFen: action.fen }))
    case "save-note":
      return saveNote(state, action.note)
    case "delete-note":
      return {
        ...state,
        session: {
          ...state.session,
          notes: state.session.notes.filter((note) => note.ply !== action.ply),
        },
      }
    case "open-archive":
      return openArchive(state, action.id)
    case "start-drill":
      return startDrill(state, action.id)
    default:
      return state
  }
}

function applyUserMove(state: State, san: string): State {
  const chess = replay(state.session.startFen, state.session.sans)
  const before = chess.fen()
  const move = safeMove(chess, san)
  if (!move) return state

  let marks = state.session.marks
  let reviewLine: Review | null = null
  if (analysisMatches(state.analysis, before) && state.analysis?.best) {
    const same = move.lan === state.analysis.best
    const bestSan = sanAt(before, state.analysis.best) ?? state.analysis.best
    marks = [
      ...marks,
      {
        ply: state.session.sans.length + 1,
        matched: same,
        drop: centipawnLoss(state.analysis, move.lan),
        book: lookupBook(before) === move.lan,
        best: state.analysis.best,
        bestSan,
        sacrifice: isSacrifice(move.piece, move.captured),
      },
    ]
    const bestLine = state.analysis.lines.find((line) => line.pv[0] === state.analysis?.best)
    const playedLine = state.analysis.lines.find((line) => line.pv[0] === move.lan)
    reviewLine = {
      playedSan: move.san,
      bestSan,
      same,
      played: playedLine ? formatMoverScore(playedLine.cp, playedLine.mate) : null,
      best: bestLine ? formatMoverScore(bestLine.cp, bestLine.mate) : null,
    }
  }

  return {
    ...state,
    session: {
      ...state.session,
      sans: [...state.session.sans, move.san],
      marks,
      evals: state.session.evals.slice(0, state.session.sans.length + 1),
    },
    analysis: null,
    reviewLine,
    thinking: false,
    replyFailed: false,
    viewPly: null,
  }
}

function applyEngineMove(state: State, uci: string): State {
  const chess = replay(state.session.startFen, state.session.sans)
  const move = safeMove(chess, uciParts(uci))
  if (!move) return { ...state, thinking: false, replyFailed: true }
  return {
    ...state,
    session: { ...state.session, sans: [...state.session.sans, move.san] },
    analysis: null,
    thinking: false,
    replyFailed: false,
    viewPly: null,
  }
}

function undo(state: State): State {
  const drop = undoCount(state.session)
  if (drop === 0) return state
  const sans = state.session.sans.slice(0, -drop)
  return {
    ...state,
    session: {
      ...state.session,
      sans,
      notes: state.session.notes.filter((note) => note.ply <= sans.length),
      marks: state.session.marks.filter((mark) => mark.ply <= sans.length),
      evals: state.session.evals.slice(0, sans.length + 1),
    },
    analysis: null,
    reviewLine: null,
    thinking: false,
    replyFailed: false,
    viewPly: null,
  }
}

function reset(state: State, session: Session): State {
  return {
    ...state,
    session,
    analysis: null,
    reviewLine: null,
    thinking: false,
    replyFailed: false,
    viewPly: null,
  }
}

function saveNote(state: State, note: Note): State {
  const text = note.text.trim()
  if (!text) return state
  const notes = [
    ...state.session.notes.filter((item) => item.ply !== note.ply),
    { ...note, text },
  ].sort((a, b) => a.ply - b.ply)
  return { ...state, session: { ...state.session, notes } }
}

function openArchive(state: State, id: string): State {
  const item = state.session.archive.find((game) => game.id === id)
  if (!item) return state
  const rest = state.session.archive.filter((game) => game.id !== id)
  return reset(state, {
    ...state.session,
    startFen: item.startFen,
    sans: item.sans,
    notes: item.notes,
    marks: item.marks,
    evals: item.evals ?? [],
    player: item.player,
    drillId: null,
    archive: pushArchive({ ...state.session, archive: rest }),
  })
}

function startDrill(state: State, id: string): State {
  const drill = drillById(id)
  if (!drill) return state
  return reset(
    state,
    freshPosition(state.session, {
      startFen: drill.fen,
      player: drill.player,
      drillId: drill.id,
      tab: "jogo",
    }),
  )
}

function sanAt(fen: string, uci: string): string | null {
  const move = safeMove(replay(fen, []), uciParts(uci))
  return move?.san ?? null
}
