import type { ArrowSettings } from "@/lib/arrows"
import { lookupBook } from "@/lib/book"
import { drillById } from "@/lib/drills"
import { centipawnLoss, moverCp, toWhite, type Analysis } from "@/lib/engine-parse"
import { isSacrifice, winChance } from "@/lib/review"
import { safeMove, replay } from "@/lib/game"
import { formatMoverScore, uciParts } from "@/lib/notation"
import {
  analysisMatches,
  defaultSession,
  fenBefore,
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
  type CustomColors,
  type Highlights,
  type SoundPreset,
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
  reviewing: boolean
  reviewProgress: { done: number; total: number } | null
  practice: { best: string; san: string; solved: boolean | null } | null
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
  | { type: "set-arrows"; settings: ArrowSettings }
  | { type: "set-colors"; colors: CustomColors }
  | { type: "set-highlights"; highlights: Highlights }
  | { type: "set-sound-preset"; preset: SoundPreset }
  | { type: "set-volume"; board: number; ui: number }
  | { type: "set-analysis-ms"; ms: number }
  | { type: "start-review" }
  | { type: "stop-review" }
  | { type: "review-step"; positionPly: number; analysis: Analysis | null }
  | { type: "practice"; ply: number }

export const initialState: State = {
  hydrated: false,
  session: defaultSession(),
  analysis: null,
  engineStatus: "booting",
  thinking: false,
  replyFailed: false,
  reviewLine: null,
  viewPly: null,
  reviewing: false,
  reviewProgress: null,
  practice: null,
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
    case "set-arrows":
      return { ...state, session: { ...state.session, arrowSettings: action.settings } }
    case "set-colors":
      return { ...state, session: { ...state.session, customColors: action.colors, boardTheme: "personalizado" } }
    case "set-highlights":
      return { ...state, session: { ...state.session, highlights: action.highlights } }
    case "set-sound-preset":
      return { ...state, session: { ...state.session, soundPreset: action.preset } }
    case "set-volume":
      return { ...state, session: { ...state.session, boardVolume: action.board, uiVolume: action.ui } }
    case "set-analysis-ms":
      return { ...state, session: { ...state.session, analysisMs: action.ms } }
    case "start-review":
      if (state.session.sans.length === 0) return state
      return {
        ...state,
        reviewing: true,
        reviewProgress: { done: 0, total: state.session.sans.length + 1 },
        viewPly: 0,
      }
    case "stop-review":
      return { ...state, reviewing: false, reviewProgress: null, viewPly: null }
    case "review-step":
      if (!action.analysis) {
        const total = state.session.sans.length + 1
        return {
          ...state,
          reviewing: true,
          reviewProgress: { done: Math.min(total, action.positionPly + 1), total },
        }
      }
      return applyReviewStep(state, action.positionPly, action.analysis)
    case "practice":
      return startPractice(state, action.ply)
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
    const drop = centipawnLoss(state.analysis, move.lan)
    const judged = judgeMove(state.analysis, drop)
    marks = [
      ...marks,
      {
        ply: state.session.sans.length + 1,
        matched: same,
        drop,
        book: lookupBook(before) === move.lan,
        best: state.analysis.best,
        bestSan,
        sacrifice: isSacrifice(move.piece, move.captured),
        swing: judged.swing,
        winBefore: judged.winBefore,
        gap: judged.gap,
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
    practice: state.practice
      ? { ...state.practice, solved: move.lan === state.practice.best }
      : null,
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
    reviewing: false,
    reviewProgress: null,
    practice: null,
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

function judgeMove(analysis: Analysis, drop: number | null): {
  swing: number | null
  winBefore: number | null
  gap: number | null
} {
  const best = analysis.lines.find((line) => line.pv[0] === analysis.best) ?? analysis.lines[0]
  const second = analysis.lines.find((line) => line.multipv === 2)
  if (!best) return { swing: null, winBefore: null, gap: null }
  const before = moverCp(best)
  const winBefore = winChance(before)
  const gap = second ? Math.max(0, winBefore - winChance(moverCp(second))) : null
  const swing = drop == null ? null : Math.max(0, winBefore - winChance(before - drop))
  return { swing, winBefore, gap }
}

function applyReviewStep(state: State, positionPly: number, analysis: Analysis): State {
  const chess = replay(state.session.startFen, state.session.sans.slice(0, positionPly))
  const fen = chess.fen()
  if (!analysisMatches(analysis, fen)) return state
  const line = analysis.lines.find((item) => item.pv[0] === analysis.best) ?? analysis.lines[0]
  const evals = state.session.evals.slice()
  if (line) {
    const white = toWhite(chess.turn(), line.cp, line.mate)
    const score = white.mate != null ? (white.mate > 0 ? 900 : -900) : white.cp
    if (score != null) evals[positionPly] = score
  }
  let marks = state.session.marks
  const san = state.session.sans[positionPly]
  if (san && analysis.best) {
    const move = safeMove(chess, san)
    if (move) {
      const drop = centipawnLoss(analysis, move.lan)
      const judged = judgeMove(analysis, drop)
      const mark = {
        ply: positionPly + 1,
        matched: move.lan === analysis.best,
        drop,
        book: lookupBook(fen) === move.lan,
        best: analysis.best,
        bestSan: sanAt(fen, analysis.best) ?? analysis.best,
        sacrifice: isSacrifice(move.piece, move.captured),
        swing: judged.swing,
        winBefore: judged.winBefore,
        gap: judged.gap,
      }
      marks = [...marks.filter((item) => item.ply !== mark.ply), mark].sort((a, b) => a.ply - b.ply)
    }
  }
  const total = state.session.sans.length + 1
  return {
    ...state,
    session: { ...state.session, evals, marks },
    reviewProgress: { done: Math.min(total, positionPly + 1), total },
    reviewing: true,
  }
}

function startPractice(state: State, ply: number): State {
  const mark = state.session.marks.find((item) => item.ply === ply)
  if (!mark?.best || !mark.bestSan) return state
  const fen = fenBefore(state.session.startFen, state.session.sans, ply)
  return {
    ...reset(state, freshPosition(state.session, { startFen: fen, mode: "estudo", tab: "jogo" })),
    practice: { best: mark.best, san: mark.bestSan, solved: null },
  }
}

function sanAt(fen: string, uci: string): string | null {
  const move = safeMove(replay(fen, []), uciParts(uci))
  return move?.san ?? null
}
