"use client"

import { useEffect, useMemo, useReducer, useRef, useState } from "react"

import { Board } from "@/components/board"
import { EvalBar } from "@/components/eval-bar"
import { PieceArt } from "@/components/pieces"
import { SectionTabs } from "@/components/section-tabs"
import { SidePanel } from "@/components/side-panel"
import { Welcome } from "@/components/welcome"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { drillById, drillProgress } from "@/lib/drills"
import { toWhite } from "@/lib/engine-parse"
import { EngineClient } from "@/lib/engine"
import { parseFen, placements, replay, resultText, safeMove, squareOfKing, toPgn } from "@/lib/game"
import { resolveHuman } from "@/lib/human"
import { formatMoverScore, sanPt, uciParts } from "@/lib/notation"
import { GRADE_COLOR, badgeGrade, gradeOf, type Grade } from "@/lib/review"
import { initialState, reducer, type Review } from "@/lib/reducer"
import { bootSnd, playSnd } from "@/lib/snd"
import {
  analysisMatches,
  defaultSession,
  fenBefore,
  loadSession,
  pvSans,
  STORAGE_KEY,
  tally,
} from "@/lib/session"

const PROMOTION = [
  { id: "q", name: "Dama" },
  { id: "r", name: "Torre" },
  { id: "b", name: "Bispo" },
  { id: "n", name: "Cavalo" },
] as const

export function LanceScreen() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const engineRef = useRef<EngineClient | null>(null)
  const [copied, setCopied] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [pending, setPending] = useState<{ from: string; to: string } | null>(null)
  const [showEngine, setShowEngine] = useState(false)
  const resultSeen = useRef<{ primed: boolean; last: string | null }>({ primed: false, last: null })

  const session = state.session
  const live = useMemo(() => replay(session.startFen, session.sans), [session.startFen, session.sans])
  const atLive = state.viewPly == null || state.viewPly >= session.sans.length
  const shown = useMemo(
    () => replay(session.startFen, atLive ? session.sans : session.sans.slice(0, state.viewPly ?? 0)),
    [session.startFen, session.sans, atLive, state.viewPly],
  )
  const pieces = useMemo(
    () => placements(session.startFen, atLive ? session.sans : session.sans.slice(0, state.viewPly ?? 0)),
    [session.startFen, session.sans, atLive, state.viewPly],
  )
  const liveFen = live.fen()

  const [showFor, setShowFor] = useState(liveFen)
  if (showFor !== liveFen) {
    setShowFor(liveFen)
    setShowEngine(false)
  }
  const selectToken = `${liveFen}:${atLive}`
  const [selectFor, setSelectFor] = useState(selectToken)
  if (selectFor !== selectToken) {
    setSelectFor(selectToken)
    setSelected(null)
    setPending(null)
  }

  useEffect(() => {
    const saved = loadSession(window.localStorage.getItem(STORAGE_KEY))
    dispatch({ type: "hydrate", session: saved ?? defaultSession() })
  }, [])

  useEffect(() => {
    bootSnd()
  }, [])

  useEffect(() => {
    if (!state.hydrated) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  }, [state.hydrated, session])

  useEffect(() => {
    const engine = new EngineClient()
    engineRef.current = engine
    let alive = true
    engine
      .init()
      .then(() => {
        if (alive) dispatch({ type: "engine-status", status: "ready" })
      })
      .catch(() => {
        if (alive) dispatch({ type: "engine-status", status: "error" })
      })
    return () => {
      alive = false
      engine.dispose()
    }
  }, [])

  const gameOver = live.isGameOver()
  const drilling = session.drillId != null
  const playerTurn = session.mode === "estudo" || drilling || live.turn() === session.player

  useEffect(() => {
    if (!state.hydrated || state.engineStatus !== "ready") return
    const engine = engineRef.current
    if (!engine) return
    if (!atLive || gameOver) {
      dispatch({ type: "thinking", thinking: false })
      return
    }
    let cancelled = false
    if (session.tab === "configurar" || !session.welcomed) {
      dispatch({ type: "thinking", thinking: false })
      if (playerTurn) {
        engine.analyze(liveFen).then((analysis) => {
          if (!cancelled && analysis) dispatch({ type: "analysis", analysis })
        })
      }
    } else if (playerTurn) {
      dispatch({ type: "thinking", thinking: false })
      engine.analyze(liveFen).then((analysis) => {
        if (!cancelled && analysis) dispatch({ type: "analysis", analysis })
      })
    } else if (!state.replyFailed) {
      dispatch({ type: "thinking", thinking: true })
      engine.reply(liveFen, session.strength).then((uci) => {
        if (!cancelled && uci) dispatch({ type: "engine-move", uci })
      })
    }
    return () => {
      cancelled = true
    }
  }, [
    state.hydrated,
    state.engineStatus,
    state.replyFailed,
    atLive,
    gameOver,
    playerTurn,
    liveFen,
    session.strength,
    session.tab,
    session.welcomed,
  ])

  const history = shown.history({ verbose: true })
  const last = history[history.length - 1]
  const counts = tally(session.marks)
  const result = resultText(live)
  const onConfig = session.tab === "configurar"
  const welcoming = state.hydrated && !session.welcomed
  const canPlay =
    session.welcomed &&
    !onConfig &&
    atLive &&
    !gameOver &&
    !state.thinking &&
    playerTurn
  const turn = canPlay ? shown.turn() : null
  const legals =
    selected && canPlay
      ? shown.moves({ square: selected as never, verbose: true }).map((move) => ({
          to: move.to,
          capture: Boolean(move.captured),
        }))
      : []

  const matched = analysisMatches(state.analysis, liveFen) ? state.analysis : null
  const bestLine = matched?.lines.find((line) => line.pv[0] === matched.best) ?? matched?.lines[0]
  const white = bestLine ? toWhite(live.turn(), bestLine.cp, bestLine.mate) : { cp: null, mate: null }
  const [heldEval, setHeldEval] = useState({ fen: "", cp: null as number | null, mate: null as number | null })
  const freshEval = white.cp != null || white.mate != null
  const shownEval = freshEval
    ? white
    : heldEval.fen === liveFen
      ? heldEval
      : { cp: null, mate: null }
  if (
    freshEval &&
    (heldEval.fen !== liveFen || heldEval.cp !== white.cp || heldEval.mate !== white.mate)
  ) {
    setHeldEval({ fen: liveFen, cp: white.cp, mate: white.mate })
  }
  const human = session.assistance === "humano" && atLive ? resolveHuman(liveFen, matched) : null
  const suggestion = drilling
    ? null
    : arrowFor(session.assistance, atLive, gameOver, playerTurn, matched?.best ?? null, human?.uci ?? null)
  const focusPly = atLive ? session.sans.length : (state.viewPly ?? 0)
  const reviewed = drilling ? null : reviewOf(session.startFen, session.sans, session.marks, focusPly > 0 ? focusPly : null)
  const arrows = suggestion ? [suggestion] : (reviewed?.arrows ?? [])
  const drill = drillById(session.drillId)
  const drillStatus = drill ? drillProgress(drill, session.sans) : null

  const review =
    session.assistance === "livre" && session.review && state.reviewLine
      ? reviewCopy(state.reviewLine)
      : null
  const pv =
    session.assistance === "melhor" && matched?.best && bestLine
      ? pvSans(liveFen, bestLine.pv).join(" ")
      : null
  const engineSan = matched?.best ? sanOf(liveFen, matched.best) : null

  useEffect(() => {
    if (!state.hydrated) return
    const current = atLive && result ? result : null
    if (!resultSeen.current.primed) {
      resultSeen.current = { primed: true, last: current }
      return
    }
    if (current && current !== resultSeen.current.last && session.sound && session.welcomed) {
      playSnd("celebration", true)
    }
    resultSeen.current = { primed: true, last: current }
  }, [state.hydrated, atLive, result, session.sound, session.welcomed])

  function tryMove(from: string, to: string) {
    const hits = shown.moves({ square: from as never, verbose: true }).filter((move) => move.to === to)
    if (hits.length === 0) return
    if (hits.some((move) => move.promotion)) {
      setPending({ from, to })
      setSelected(null)
      return
    }
    dispatch({ type: "user-move", san: hits[0].san })
    playSnd("button", session.sound)
    setSelected(null)
  }

  function onSquare(square: string) {
    if (!canPlay) return
    if (selected) {
      const hits = shown.moves({ square: selected as never, verbose: true }).filter((move) => move.to === square)
      if (hits.length > 0) {
        tryMove(selected, square)
        return
      }
    }
    const piece = shown.get(square as never)
    if (piece && piece.color === shown.turn()) {
      setSelected(selected === square ? null : square)
      return
    }
    setSelected(null)
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-[900px] flex-col px-4 py-5 sm:py-8">
      <header data-sea-block="" className="relative z-10 mb-4 flex flex-col gap-3 rounded-[6px] bg-background/90 px-2 py-1">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-[15px] font-medium tracking-tight">Lance</h1>
          <SectionTabs
            value={session.tab}
            onChange={(tab) => {
              if (tab === session.tab) return
              playSnd("select", session.sound)
              dispatch({ type: "set-tab", tab })
            }}
          />
        </div>
        <p className="text-[13px] text-muted-foreground">
          {headerStatus({
            engineStatus: state.engineStatus,
            thinking: state.thinking,
            atLive,
            result,
            playerTurn,
            mode: session.mode,
            replyFailed: state.replyFailed,
            turn: live.turn(),
            tab: session.tab,
            welcomed: session.welcomed,
            drill: drill ? { prompt: drill.prompt, status: drillStatus ?? "waiting" } : null,
          })}
        </p>
      </header>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div data-sea-block="" className="mx-auto w-full max-w-[520px] lg:sticky lg:top-6 lg:mx-0 lg:max-w-[560px] lg:flex-1">
          <div className="grid grid-cols-[8px_minmax(0,1fr)] items-stretch gap-2">
            <EvalBar ratio={ratioOf(shownEval.cp, shownEval.mate)} label={evalLabel(shownEval.cp, shownEval.mate)} />
            <Board
              pieces={pieces}
              orientation={session.player}
              lastMove={last ? { from: last.from, to: last.to } : null}
              selected={selected}
              destinations={legals}
              checkSquare={shown.isCheck() ? squareOfKing(shown, shown.turn()) : null}
              arrows={arrows}
              tintSquare={suggestion ? null : (reviewed?.from ?? null)}
              badge={suggestion ? null : (reviewed?.badge ?? null)}
              turn={turn}
              theme={session.boardTheme}
              pieceStyle={session.pieceStyle}
              onSquare={onSquare}
              onDragStart={(square) => {
                if (canPlay) setSelected(square)
              }}
              onDrop={tryMove}
            />
          </div>
        </div>
        {!welcoming && (
        <SidePanel
          session={session}
          atLive={atLive}
          viewPly={state.viewPly}
          result={result}
          attempts={counts.attempts}
          matches={counts.matches}
          reviewText={review}
          pv={pv}
          evalText={evalLabel(shownEval.cp, shownEval.mate)}
          human={
            human
              ? { coincides: human.coincides, engineSan: engineSan ? sanPt(engineSan) : null }
              : null
          }
          showEngine={showEngine}
          onToggleEngine={() => setShowEngine((value) => !value)}
          onPlayer={(player) => {
            playSnd("select", session.sound)
            dispatch({ type: "set-player", player })
          }}
          onMode={(mode) => {
            playSnd("select", session.sound)
            dispatch({ type: "set-mode", mode })
          }}
          onAssistance={(assistance) => {
            playSnd("select", session.sound)
            dispatch({ type: "set-assistance", assistance })
          }}
          onStrength={(strength) => {
            playSnd("select", session.sound)
            dispatch({ type: "set-strength", strength })
          }}
          onReview={(reviewOn) => {
            playSnd(reviewOn ? "toggleOn" : "toggleOff", session.sound)
            dispatch({ type: "set-review", review: reviewOn })
          }}
          onBoard={(board) => {
            playSnd("select", session.sound)
            dispatch({ type: "set-board", board })
          }}
          onPieces={(pieces) => {
            playSnd("select", session.sound)
            dispatch({ type: "set-pieces", pieces })
          }}
          onSound={(sound) => {
            playSnd(sound ? "toggleOn" : "toggleOff", session.sound || sound)
            dispatch({ type: "set-sound", sound })
          }}
          onTab={(tab) => {
            if (tab !== session.tab) playSnd("select", session.sound)
            dispatch({ type: "set-tab", tab })
          }}
          onUndo={() => dispatch({ type: "undo" })}
          onNew={() => dispatch({ type: "new-game" })}
          onCopy={() => {
            const pgn = toPgn(session.startFen, session.sans)
            navigator.clipboard.writeText(pgn).then(() => {
              setCopied(true)
              window.setTimeout(() => setCopied(false), 1200)
            })
          }}
          copied={copied}
          onView={(ply) => dispatch({ type: "view-ply", ply })}
          onBack={() => dispatch({ type: "view-ply", ply: session.sans.length })}
          onSaveNote={(note) => {
            const fen = fenBefore(session.startFen, session.sans, note.ply)
            dispatch({ type: "save-note", note: { ...note, fen } })
          }}
          onDeleteNote={(ply) => dispatch({ type: "delete-note", ply })}
          onOpenArchive={(id) => dispatch({ type: "open-archive", id })}
          onLoadFen={(fen) => {
            const parsed = parseFen(fen)
            if (!parsed) {
              playSnd("caution", session.sound)
              return "Essa FEN não abre."
            }
            playSnd("button", session.sound)
            dispatch({ type: "load-fen", fen: parsed })
            return null
          }}
          onStartDrill={(id) => {
            playSnd("button", session.sound)
            dispatch({ type: "start-drill", id })
          }}
        />
        )}
        {welcoming && (
          <Welcome
            session={session}
            onDone={(patch) => dispatch({ type: "welcome-done", patch })}
          />
        )}
      </div>
      <Dialog open={pending != null} onOpenChange={(open) => { if (!open) setPending(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promoção</DialogTitle>
            <DialogDescription>Escolha a peça.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2">
            {PROMOTION.map((piece) => (
              <Button
                key={piece.id}
                type="button"
                variant="outline"
                className="h-14"
                aria-label={piece.name}
                onClick={() => {
                  if (!pending) return
                  const move = shown
                    .moves({ square: pending.from as never, verbose: true })
                    .find((item) => item.to === pending.to && item.promotion === piece.id)
                  if (move) {
                    dispatch({ type: "user-move", san: move.san })
                    playSnd("button", session.sound)
                  }
                  setPending(null)
                }}
              >
                <span className="size-8">
                  <PieceArt type={piece.id} color={shown.turn()} pieceStyle={session.pieceStyle} />
                </span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}

function arrowFor(
  assistance: string,
  atLive: boolean,
  gameOver: boolean,
  playerTurn: boolean,
  best: string | null,
  humanUci: string | null,
): { from: string; to: string; color: string } | null {
  if (!atLive || gameOver || !playerTurn) return null
  const uci = assistance === "melhor" ? best : assistance === "humano" ? humanUci : null
  if (!uci || uci.length < 4) return null
  return { from: uci.slice(0, 2), to: uci.slice(2, 4), color: assistance === "humano" ? "#2f6fad" : "#7fa650" }
}

function reviewOf(
  startFen: string,
  sans: string[],
  marks: { ply: number; matched: boolean; drop: number | null; book: boolean; best: string | null; bestSan: string | null; sacrifice: boolean }[],
  ply: number | null,
): { arrows: { from: string; to: string; color: string }[]; from: string; badge: { square: string; grade: Grade } | null } | null {
  if (ply == null || ply < 1) return null
  const san = sans[ply - 1]
  if (!san) return null
  const move = safeMove(replay(startFen, sans.slice(0, ply - 1)), san)
  if (!move) return null
  const mark = marks.find((item) => item.ply === ply)
  const grade = mark ? gradeOf(mark) : null
  const color = grade ? GRADE_COLOR[grade] : "#d9d3c7"
  const arrows: { from: string; to: string; color: string }[] = [{ from: move.from, to: move.to, color }]
  const bad = grade === "imprecisao" || grade === "erro" || grade === "vacilo"
  if (bad && mark?.best && mark.best !== move.lan && mark.best.length >= 4) {
    arrows.unshift({ from: mark.best.slice(0, 2), to: mark.best.slice(2, 4), color: "#7fa650" })
  }
  const shown = badgeGrade(grade)
  return {
    arrows,
    from: move.from,
    badge: shown ? { square: move.to, grade: shown } : null,
  }
}

function reviewCopy(review: Review): string {
  const played = sanPt(review.playedSan)
  const best = sanPt(review.bestSan)
  if (review.same) return `Você jogou ${played}, o mesmo que o motor.`
  if (review.played && review.best) {
    return `Você jogou ${played} (${review.played}). O motor preferia ${best} (${review.best}).`
  }
  if (review.best) return `Você jogou ${played}. O motor preferia ${best} (${review.best}).`
  return `Você jogou ${played}. O motor preferia ${best}.`
}

function sanOf(fen: string, uci: string): string | null {
  return safeMove(replay(fen, []), uciParts(uci))?.san ?? null
}

function ratioOf(cp: number | null, mate: number | null): number {
  if (mate != null) return mate > 0 ? 1 : 0
  if (cp == null) return 0.5
  const clamped = Math.max(-800, Math.min(800, cp))
  return (clamped + 800) / 1600
}

function evalLabel(cp: number | null, mate: number | null): string {
  return formatMoverScore(cp, mate) ?? "—"
}

function headerStatus({
  engineStatus,
  thinking,
  atLive,
  result,
  playerTurn,
  mode,
  replyFailed,
  turn,
  tab,
  welcomed,
  drill,
}: {
  engineStatus: string
  thinking: boolean
  atLive: boolean
  result: string | null
  playerTurn: boolean
  mode: string
  replyFailed: boolean
  turn: "w" | "b"
  tab: "jogo" | "configurar"
  welcomed: boolean
  drill: { prompt: string; status: "waiting" | "solved" | "missed" } | null
}): string {
  if (!welcomed) return "Uma pergunta de cada vez. O adversário espera."
  if (drill?.status === "solved") return "Esse é o lance."
  if (drill?.status === "missed") return "Ainda não."
  if (drill && tab !== "configurar") return drill.prompt
  if (tab === "configurar") return "Escolha como jogar. O adversário espera."
  if (engineStatus === "booting") return "O motor está acordando."
  if (engineStatus === "error") return "O motor não carregou."
  if (replyFailed) return "O motor não respondeu."
  if (thinking) return "Pensando."
  if (!atLive) return "Olhando um lance anterior."
  if (result) return result
  if (playerTurn && mode === "partida") return "A sua vez."
  return turn === "w" ? "Brancas jogam." : "Pretas jogam."
}
