"use client"

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react"

import { PieceArt } from "@/components/pieces"
import { SpringSwitch } from "@/components/spring-switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { ArrowSettings } from "@/lib/arrows"
import { openingTitle } from "@/lib/book"
import { DRILLS, drillById, drillProgress } from "@/lib/drills"
import { START_FEN } from "@/lib/game"
import { BOARD_THEMES, DEFAULT_HIGHLIGHTS, isHex, PIECE_STYLES, type BoardTheme, type CustomColors, type Highlights, type PieceStyle } from "@/lib/look"
import { formatDrop, sanPt } from "@/lib/notation"
import {
  GRADE_COLOR,
  badgeGrade,
  evalSeries,
  formatReviewCp,
  gradeGlyph,
  accuracyOf,
  coachFor,
  criticalPlies,
  gradeLine,
  gradeOf,
  GRADE_NAME,
  isLastBook,
  moverColor,
  type Grade,
} from "@/lib/review"
import {
  TAGS,
  dropLine,
  largestDrop,
  type Assistance,
  type Color,
  type Mode,
  type Note,
  type NoteTag,
  type Session,
  type SoundPreset,
  type Strength,
  type Tab,
} from "@/lib/session"

const choiceClass =
  "flex-1 rounded-[6px] data-[state=on]:bg-foreground data-[state=on]:text-background"

const ASSIST: Record<Assistance, string> = {
  livre: "Nenhuma seta sozinha. Se você pedir, o melhor lance aparece.",
  melhor: "O melhor lance só aparece quando você pede. A avaliação e três lances da linha vêm junto.",
  humano: "O lance natural só aparece quando você pede. Na abertura ele vem de um livro.",
}

const MODES: Record<Mode, string> = {
  partida: "Você joga a sua cor. O motor responde.",
  estudo: "Você mexe os dois lados, para olhar uma linha com calma.",
}

const COLORS: Record<Color, string> = {
  w: "Você começa, se for uma partida. As brancas ficam embaixo.",
  b: "As pretas ficam embaixo. Numa partida, o motor começa.",
}

const STRENGTHS: Record<Strength, string> = {
  iniciante: "Erra mais. Bom para jogar sem pressão.",
  clube: "Responde como um jogador de clube.",
  forte: "Calcula mais e erra menos.",
}

export function SidePanel({
  session,
  atLive,
  viewPly,
  result,
  attempts,
  matches,
  reviewText,
  pv,
  evalText,
  human,
  showEngine,
  onToggleEngine,
  onPlayer,
  onMode,
  onAssistance,
  onStrength,
  onReview,
  onBoard,
  onPieces,
  onSound,
  onTab,
  onUndo,
  onNew,
  onCopy,
  copied,
  onView,
  onBack,
  onSaveNote,
  onDeleteNote,
  onOpenArchive,
  onLoadFen,
  onStartDrill,
  reviewing,
  reviewProgress,
  hintAsked,
  onAskHint,
  onStartReview,
  onStopReview,
  onPractice,
  practice,
  onArrows,
  onColors,
  onHighlights,
  onSoundPreset,
  onVolume,
  onAnalysisMs,
}: {
  session: Session
  atLive: boolean
  viewPly: number | null
  result: string | null
  attempts: number
  matches: number
  reviewText: string | null
  pv: string | null
  evalText: string
  human: { coincides: boolean | null; engineSan: string | null } | null
  showEngine: boolean
  onToggleEngine: () => void
  onPlayer: (player: Color) => void
  onMode: (mode: Mode) => void
  onAssistance: (assistance: Assistance) => void
  onStrength: (strength: Strength) => void
  onReview: (review: boolean) => void
  onBoard: (board: BoardTheme) => void
  onPieces: (pieces: PieceStyle) => void
  onSound: (sound: boolean) => void
  onTab: (tab: Tab) => void
  onUndo: () => void
  onNew: () => void
  onCopy: () => void
  copied: boolean
  onView: (ply: number) => void
  onBack: () => void
  onSaveNote: (note: Note) => void
  onDeleteNote: (ply: number) => void
  onOpenArchive: (id: string) => void
  onLoadFen: (fen: string) => string | null
  onStartDrill: (id: string) => void
  reviewing: boolean
  reviewProgress: { done: number; total: number } | null
  hintAsked: boolean
  onAskHint: () => void
  onStartReview: () => void
  onStopReview: () => void
  onPractice: (ply: number) => void
  practice: { best: string; san: string; solved: boolean | null } | null
  onArrows: (settings: ArrowSettings) => void
  onColors: (colors: CustomColors) => void
  onHighlights: (highlights: Highlights) => void
  onSoundPreset: (preset: SoundPreset) => void
  onVolume: (board: number, ui: number) => void
  onAnalysisMs: (ms: number) => void
}) {
  return (
    <aside data-sea-block="" className="flex w-full flex-col gap-3 rounded-[6px] border border-border bg-card p-3 lg:max-h-[calc(100dvh-7.5rem)] lg:w-[360px] lg:shrink-0 lg:overflow-y-auto">
      {session.tab === "configurar" ? (
        <Config
          session={session}
          onPlayer={onPlayer}
          onMode={onMode}
          onAssistance={onAssistance}
          onStrength={onStrength}
          onReview={onReview}
          onBoard={onBoard}
          onPieces={onPieces}
          onSound={onSound}
          onTab={onTab}
          onOpenArchive={onOpenArchive}
          onLoadFen={onLoadFen}
          onStartDrill={onStartDrill}
          onArrows={onArrows}
          onColors={onColors}
          onHighlights={onHighlights}
          onSoundPreset={onSoundPreset}
          onVolume={onVolume}
          onAnalysisMs={onAnalysisMs}
        />
      ) : (
        <Game
          session={session}
          atLive={atLive}
          viewPly={viewPly}
          result={result}
          attempts={attempts}
          matches={matches}
          reviewText={reviewText}
          pv={pv}
          evalText={evalText}
          human={human}
          showEngine={showEngine}
          onToggleEngine={onToggleEngine}
          onReview={onReview}
          onUndo={onUndo}
          onNew={onNew}
          onCopy={onCopy}
          copied={copied}
          onView={onView}
          onBack={onBack}
          onSaveNote={onSaveNote}
          onDeleteNote={onDeleteNote}
          onOpenArchive={onOpenArchive}
          reviewing={reviewing}
          reviewProgress={reviewProgress}
          hintAsked={hintAsked}
          onAskHint={onAskHint}
          onStartReview={onStartReview}
          onStopReview={onStopReview}
          onPractice={onPractice}
          practice={practice}
        />
      )}
    </aside>
  )
}

function Config({
  session,
  onPlayer,
  onMode,
  onAssistance,
  onStrength,
  onReview,
  onBoard,
  onPieces,
  onSound,
  onTab,
  onOpenArchive,
  onLoadFen,
  onStartDrill,
  onArrows,
  onColors,
  onHighlights,
  onSoundPreset,
  onVolume,
  onAnalysisMs,
}: {
  session: Session
  onPlayer: (player: Color) => void
  onMode: (mode: Mode) => void
  onAssistance: (assistance: Assistance) => void
  onStrength: (strength: Strength) => void
  onReview: (review: boolean) => void
  onBoard: (board: BoardTheme) => void
  onPieces: (pieces: PieceStyle) => void
  onSound: (sound: boolean) => void
  onTab: (tab: Tab) => void
  onOpenArchive: (id: string) => void
  onLoadFen: (fen: string) => string | null
  onStartDrill: (id: string) => void
  onArrows: (settings: ArrowSettings) => void
  onColors: (colors: CustomColors) => void
  onHighlights: (highlights: Highlights) => void
  onSoundPreset: (preset: SoundPreset) => void
  onVolume: (board: number, ui: number) => void
  onAnalysisMs: (ms: number) => void
}) {
  const [fen, setFen] = useState("")
  const [fenError, setFenError] = useState<string | null>(null)
  const [group, setGroup] = useState<"aparencia" | "audio" | "jogo" | "motor">("aparencia")
  const palette = session.boardTheme === "personalizado" ? session.customColors : BOARD_THEMES[session.boardTheme]

  return (
    <>
      <div className="space-y-1.5">
        <h2 className="text-[15px] font-medium tracking-tight">Configurar</h2>
        <p className="text-[13px] leading-5 text-muted-foreground">
          O tabuleiro é a partida. A barra fina ao lado dele é a avaliação, das brancas para cima. Aqui você escolhe
          como jogar e como o tabuleiro aparece. Na partida, a seta do motor só entra quando você pede. O adversário só
          responde em Jogo.
        </p>
      </div>
      <Button className="h-10 w-full" onClick={() => onTab("jogo")}>
        Ir para o jogo
      </Button>
      <div role="tablist" aria-label="Configuração" className="flex flex-wrap gap-3">
        {(
          [
            ["aparencia", "Aparência"],
            ["audio", "Áudio"],
            ["jogo", "Jogo"],
            ["motor", "Motor"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={group === id}
            onClick={() => setGroup(id)}
            className={group === id ? "text-[13px] text-white" : "text-[13px] text-white/35"}
          >
            {label}
          </button>
        ))}
      </div>

      {group === "aparencia" && (
        <>
      <Field title="Tabuleiro" hint="A cor das casas. As peças continuam nas duas tintas.">
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.keys(BOARD_THEMES) as BoardTheme[]).map((id) => {
            const theme = BOARD_THEMES[id]
            const selected = session.boardTheme === id
            return (
              <button
                key={id}
                type="button"
                data-look=""
                aria-pressed={selected}
                onClick={() => onBoard(id)}
                className="rounded-[6px] border border-border p-1.5 text-left"
              >
                <BoardSwatch light={theme.light} dark={theme.dark} />
                <span className="mt-1 block text-[13px]">{theme.label}</span>
              </button>
            )
          })}
        </div>
        <p className="text-[13px] leading-5">{BOARD_THEMES[session.boardTheme].hint}</p>
      </Field>

      {session.boardTheme === "personalizado" && (
        <Field title="Suas cores" hint="Claras, escuras e os realces. Fica gravado neste navegador.">
          <BoardSwatch light={session.customColors.light} dark={session.customColors.dark} />
          <HexRow label="Casas claras" value={session.customColors.light} onChange={(light) => onColors({ ...session.customColors, light })} />
          <HexRow label="Casas escuras" value={session.customColors.dark} onChange={(dark) => onColors({ ...session.customColors, dark })} />
          <HexRow label="Seleção" value={session.highlights.selected} onChange={(selected) => onHighlights({ ...session.highlights, selected })} />
          <HexRow label="Último lance" value={session.highlights.last} onChange={(last) => onHighlights({ ...session.highlights, last })} />
          <HexRow label="Destino legal" value={session.highlights.legal} onChange={(legal) => onHighlights({ ...session.highlights, legal })} />
          <HexRow label="Xeque" value={session.highlights.check} onChange={(check) => onHighlights({ ...session.highlights, check })} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onColors({ light: "#f0d9b5", dark: "#6b8f71" })
              onHighlights({ ...DEFAULT_HIGHLIGHTS })
            }}
          >
            Restaurar
          </Button>
        </Field>
      )}

      <Field title="Peças" hint="Diagrama, entalhe e contorno. A troca não reinicia a partida.">
        <div className="space-y-1.5">
          {(Object.keys(PIECE_STYLES) as PieceStyle[]).map((id) => {
            const style = PIECE_STYLES[id]
            const selected = session.pieceStyle === id
            return (
              <button
                key={id}
                type="button"
                data-look=""
                aria-pressed={selected}
                onClick={() => onPieces(id)}
                className="flex w-full items-center gap-2 rounded-[6px] border border-border p-1.5 text-left"
              >
                <PieceSwatch style={id} light={palette.light} dark={palette.dark} />
                <span className="min-w-0">
                  <span className="block text-[13px]">{style.label}</span>
                  <span className="block text-[12px] leading-4 text-muted-foreground">{style.hint}</span>
                </span>
              </button>
            )
          })}
        </div>
        <PieceStrip style={session.pieceStyle} light={palette.light} dark={palette.dark} />
      </Field>

      <Field title="Setas" hint="Na partida, a seta do motor só aparece em Ver melhor lance.">
        <ArrowRow label="Setas na análise" checked={session.arrowSettings.analysis} onChange={(analysis) => onArrows({ ...session.arrowSettings, analysis })} />
        <ArrowRow label="Setas na revisão" checked={session.arrowSettings.review} onChange={(review) => onArrows({ ...session.arrowSettings, review })} />
        <ArrowRow label="Último lance" checked={session.arrowSettings.lastMove} onChange={(lastMove) => onArrows({ ...session.arrowSettings, lastMove })} />
        <ArrowRow label="Ameaças" checked={session.arrowSettings.threats} onChange={(threats) => onArrows({ ...session.arrowSettings, threats })} />
        <ArrowRow label="Anotações" checked={session.arrowSettings.annotations} onChange={(annotations) => onArrows({ ...session.arrowSettings, annotations })} />
      </Field>
        </>
      )}

      {group === "audio" && (
      <Field title="Som" hint="O mesmo kit de seno, em três volumes. O tabuleiro e a interface têm volumes separados.">
        <div className="flex items-center justify-between">
          <span className="text-[13px]">{session.sound ? "Ligado" : "Mudo"}</span>
          <SpringSwitch checked={session.sound} label="Som" onChange={onSound} />
        </div>
        <Choice
          label="Volume"
          value={session.soundPreset}
          onChange={onSoundPreset}
          options={[
            { value: "suave", label: "Suave" },
            { value: "classico", label: "Clássico" },
            { value: "tatil", label: "Tátil" },
          ]}
        />
        <VolumeRow label="Tabuleiro" value={session.boardVolume} onChange={(board) => onVolume(board, session.uiVolume)} />
        <VolumeRow label="Interface" value={session.uiVolume} onChange={(ui) => onVolume(session.boardVolume, ui)} />
        <Button type="button" variant="outline" size="sm" onClick={() => onSoundPreset(session.soundPreset)}>
          Ouvir
        </Button>
      </Field>
      )}

      {group === "jogo" && (
        <>
      <Field title="Treino" hint="Uma posição para achar o lance. O motor não responde enquanto o treino está aberto.">
        <DrillList kind="exercicio" label="Exercício" onStart={onStartDrill} />
        <DrillList kind="final" label="Final" onStart={onStartDrill} />
      </Field>

      <Field title="Sua cor" hint="O tabuleiro gira com a cor. Se a partida já andou, trocar começa outra.">
        <Choice
          label="Cor"
          value={session.player}
          onChange={onPlayer}
          options={[
            { value: "w", label: "Brancas" },
            { value: "b", label: "Pretas" },
          ]}
        />
        <p className="text-[13px] leading-5">{COLORS[session.player]}</p>
      </Field>

      <Field title="O que você está fazendo" hint="Partida é contra o motor. Estudo é para os dois lados.">
        <Choice
          label="Modo"
          value={session.mode}
          onChange={onMode}
          options={[
            { value: "partida", label: "Partida" },
            { value: "estudo", label: "Estudo" },
          ]}
        />
        <p className="text-[13px] leading-5">{MODES[session.mode]}</p>
      </Field>

      <Field title="Ajuda no lance" hint="O que o tabuleiro mostra na sua vez.">
        <Choice
          label="Assistência"
          value={session.assistance}
          onChange={onAssistance}
          options={[
            { value: "livre", label: "Livre" },
            { value: "melhor", label: "Melhor" },
            { value: "humano", label: "Humano" },
          ]}
        />
        <p className="text-[13px] leading-5">{ASSIST[session.assistance]}</p>
      </Field>

      {session.assistance === "livre" && (
        <Field title="Linha depois do lance" hint="Dá para calar. A contagem de coincidência continua.">
          <div className="flex items-center justify-between">
            <span className="text-[13px]">{session.review ? "Mostrar" : "Calar"}</span>
            <SpringSwitch checked={session.review} label="Revisão" onChange={onReview} />
          </div>
        </Field>
      )}

      {session.mode === "partida" ? (
        <Field title="Força do adversário" hint="Muda a resposta dele. A sugestão, quando você pede, continua no máximo.">
          <Choice
            label="Força"
            value={session.strength}
            onChange={onStrength}
            options={[
              { value: "iniciante", label: "Iniciante" },
              { value: "clube", label: "Clube" },
              { value: "forte", label: "Forte" },
            ]}
          />
          <p className="text-[13px] leading-5">{STRENGTHS[session.strength]}</p>
        </Field>
      ) : (
        <p className="text-[13px] leading-5 text-muted-foreground">
          No estudo não há adversário. A força volta quando o modo for partida.
        </p>
      )}

      <Separator />

      <Field title="Abrir uma posição" hint="Cole uma FEN. Se ela não abrir, a partida atual fica onde está.">
        <form
          className="space-y-1.5"
          onSubmit={(event) => {
            event.preventDefault()
            const error = onLoadFen(fen)
            setFenError(error)
            if (!error) {
              setFen("")
              onTab("jogo")
            }
          }}
        >
          <Input
            value={fen}
            onChange={(event) => {
              setFen(event.target.value)
              setFenError(null)
            }}
            placeholder="Cole uma FEN"
            aria-label="Cole uma FEN"
          />
          <div className="flex items-center justify-between gap-2">
            <Button type="submit" variant="outline" size="sm" disabled={fen.trim().length === 0}>
              Abrir
            </Button>
            {fenError && <p className="text-[13px] text-muted-foreground">{fenError}</p>}
          </div>
        </form>
      </Field>

      {session.archive.length > 0 && (
        <Field title="Partidas anteriores" hint="Abrir uma guarda a partida que está na tela.">
          <ul className="space-y-1">
            {session.archive.map((game) => (
              <li key={game.id}>
                <button
                  type="button"
                  className="text-left text-[13px] text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    onOpenArchive(game.id)
                    onTab("jogo")
                  }}
                >
                  {game.label}
                </button>
              </li>
            ))}
          </ul>
        </Field>
      )}
        </>
      )}

      {group === "motor" && (
        <Field
          title="Busca"
          hint="O tempo da sugestão. A resposta do adversário continua na força escolhida. A linha da sugestão continua com três lances."
        >
          <Choice
            label="Tempo"
            value={String(session.analysisMs)}
            onChange={(value) => onAnalysisMs(Number(value))}
            options={[
              { value: "280", label: "Curta" },
              { value: "420", label: "Normal" },
              { value: "700", label: "Longa" },
            ]}
          />
        </Field>
      )}
    </>
  )
}

type Moment = "agora" | "lista" | "pagina"

function Game({
  session,
  atLive,
  viewPly,
  result,
  attempts,
  matches,
  reviewText,
  pv,
  evalText,
  human,
  showEngine,
  onToggleEngine,
  onReview,
  onUndo,
  onNew,
  onCopy,
  copied,
  onView,
  onBack,
  onSaveNote,
  onDeleteNote,
  onOpenArchive,
  reviewing,
  reviewProgress,
  hintAsked,
  onAskHint,
  onStartReview,
  onStopReview,
  onPractice,
  practice,
}: {
  session: Session
  atLive: boolean
  viewPly: number | null
  result: string | null
  attempts: number
  matches: number
  reviewText: string | null
  pv: string | null
  evalText: string
  human: { coincides: boolean | null; engineSan: string | null } | null
  showEngine: boolean
  onToggleEngine: () => void
  onReview: (review: boolean) => void
  onUndo: () => void
  onNew: () => void
  onCopy: () => void
  copied: boolean
  onView: (ply: number) => void
  onBack: () => void
  onSaveNote: (note: Note) => void
  onDeleteNote: (ply: number) => void
  onOpenArchive: (id: string) => void
  reviewing: boolean
  reviewProgress: { done: number; total: number } | null
  hintAsked: boolean
  onAskHint: () => void
  onStartReview: () => void
  onStopReview: () => void
  onPractice: (ply: number) => void
  practice: { best: string; san: string; solved: boolean | null } | null
}) {
  const focus = !atLive && viewPly != null ? viewPly : session.sans.length
  const notePly = focus
  const noteSan = notePly > 0 ? session.sans[notePly - 1] : null
  const drill = drillById(session.drillId)
  const progress = drill ? drillProgress(drill, session.sans) : null
  const playing = drill ? { title: drill.title, body: drill.prompt } : situation(session)
  const opening = !drill && session.startFen === START_FEN ? openingTitle(session.sans) : null
  const fallen = largestDrop(session.marks, session.sans)
  const fallenText = dropLine(session.marks, session.sans)
  const pageMark = session.marks.find((mark) => mark.ply === notePly) ?? null
  const gameKey = `${session.startFen}|${session.drillId ?? ""}`
  const [seenGame, setSeenGame] = useState(gameKey)
  const [moment, setMoment] = useState<Moment>("agora")
  if (seenGame !== gameKey) {
    setSeenGame(gameKey)
    setMoment("agora")
  }
  const listRef = useRef<HTMLOListElement>(null)
  const quiet = Boolean(drill)
  const [playFrom, setPlayFrom] = useState<number | null>(null)
  const [explainOn, setExplainOn] = useState(false)
  const [explainFocus, setExplainFocus] = useState(focus)
  if (explainFocus !== focus) {
    setExplainFocus(focus)
    setExplainOn(false)
  }
  const playToken = `${session.startFen}|${session.sans.length}`
  const [seenPlay, setSeenPlay] = useState(playToken)
  if (seenPlay !== playToken) {
    setSeenPlay(playToken)
    if (playFrom != null) setPlayFrom(null)
  }
  const onViewRef = useRef(onView)
  const onBackRef = useRef(onBack)
  const startTurn = session.startFen.split(" ")[1] === "b" ? "b" : "w"
  const series = evalSeries(session.evals, session.marks, session.sans.length, startTurn)

  useEffect(() => {
    onViewRef.current = onView
    onBackRef.current = onBack
  })

  useEffect(() => {
    if (playFrom == null) return
    const id = window.setTimeout(() => {
      const next = playFrom + 1
      if (next >= session.sans.length) {
        onBackRef.current()
        setPlayFrom(null)
        return
      }
      onViewRef.current(next)
      setPlayFrom(next)
    }, 700)
    return () => window.clearTimeout(id)
  }, [playFrom, session.sans.length])

  useEffect(() => {
    if (moment !== "lista") return
    const list = listRef.current
    if (!list) return
    if (atLive) {
      list.parentElement?.scrollTo({ top: list.scrollHeight })
      return
    }
    list.querySelector("[data-active='true']")?.scrollIntoView({ block: "nearest" })
  }, [atLive, moment, session.sans.length, viewPly])

  function stopPlay() {
    setPlayFrom(null)
  }

  function openPly(ply: number) {
    stopPlay()
    onView(ply)
  }

  function step(delta: number) {
    stopPlay()
    const next = Math.max(0, Math.min(session.sans.length, focus + delta))
    if (next >= session.sans.length) onBack()
    else onView(next)
  }

  function togglePlay() {
    if (playFrom != null) {
      stopPlay()
      return
    }
    if (session.sans.length === 0) return
    const first = atLive ? 0 : Math.min(session.sans.length, focus + 1)
    if (first >= session.sans.length) {
      onBack()
      return
    }
    onView(first)
    setPlayFrom(first)
  }

  return (
    <>
      <div className="space-y-1">
        <h2 className="text-[15px] font-medium tracking-tight">{playing.title}</h2>
        {opening && <p className="text-[13px] text-muted-foreground">Abertura · {opening}</p>}
        <p className="text-[13px] leading-5 text-muted-foreground">{playing.body}</p>
      </div>

      {reviewing && reviewProgress && (
        <p className="text-[13px] text-muted-foreground">
          Análise {reviewProgress.done} de {reviewProgress.total}
        </p>
      )}

      {reviewing && !quiet && session.sans.length > 0 && (
        <ReviewCard
          session={session}
          focus={focus}
          atLive={atLive}
          playing={playFrom != null}
          explainOn={explainOn}
          series={series}
          startTurn={startTurn}
          onExplain={() => setExplainOn((value) => !value)}
          onNext={() => step(1)}
          onStep={step}
          onStart={() => {
            stopPlay()
            onView(0)
          }}
          onEnd={() => {
            stopPlay()
            onBack()
          }}
          onTogglePlay={togglePlay}
          onSelect={(ply) => {
            stopPlay()
            if (ply >= session.sans.length) onBack()
            else onView(ply)
          }}
          onPractice={() => onPractice(focus)}
        />
      )}

      {reviewing && reviewProgress && reviewProgress.done >= reviewProgress.total && (
        <ReviewSummary session={session} result={result} startTurn={startTurn} />
      )}

      {practice && (
        <p className="text-[13px] leading-5">
          {practice.solved === true
            ? "Esse é o lance guardado."
            : practice.solved === false
              ? `Ainda não. O lance guardado era ${sanPt(practice.san)}.`
              : `Tente de novo. O lance guardado era ${sanPt(practice.san)}.`}
        </p>
      )}

      {moment === "agora" && (
        <div className="space-y-1 text-[13px] leading-5">
          {session.sans.length === 0 && atLive && !result && !drill && (
            <p>
              {session.mode === "estudo"
                ? "Toque uma peça e depois a casa, ou arraste. Vale para os dois lados."
                : session.player === "w"
                  ? "Toque uma peça branca e depois a casa, ou arraste."
                  : "As pretas estão embaixo. Espere o motor, e depois jogue do mesmo jeito."}
            </p>
          )}
          {progress === "solved" && <p>Esse é o lance.</p>}
          {progress === "missed" && <p>Ainda não. Desfaça e tente outro.</p>}
          {result && atLive && !drill && <p>{result}</p>}
          {!quiet && result && atLive && attempts > 0 && (
            <p className="text-muted-foreground">
              Você coincidiu com o motor em {matches} de {attempts} lances.
            </p>
          )}
          {!quiet && !result && attempts > 0 && (
            <p className="text-muted-foreground">
              {matches} de {attempts} com o motor.
            </p>
          )}
          {evalText !== "—" && <p className="tabular-nums text-muted-foreground">Avaliação {evalText}</p>}
          {fallenText && fallen && (
            <button type="button" className="text-left text-muted-foreground" onClick={() => openPly(fallen.ply)}>
              {fallenText}
            </button>
          )}
          {!quiet && session.assistance === "livre" && reviewText && <p>{reviewText}</p>}
          {!quiet && session.assistance === "livre" && (
            <button
              type="button"
              className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              onClick={() => onReview(!session.review)}
            >
              {session.review ? "Calar a revisão" : "Rever o lance"}
            </button>
          )}
          {!quiet && session.assistance === "melhor" && pv && <p>Linha {pv}</p>}
          {!quiet && session.assistance === "humano" && human?.coincides === true && (
            <p>O lance natural coincide com o do motor.</p>
          )}
          {!quiet && session.assistance === "humano" && human?.coincides === false && (
            <div className="space-y-1">
              <button
                type="button"
                className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                onClick={onToggleEngine}
              >
                {showEngine ? "Ocultar o do motor" : "Ver o do motor"}
              </button>
              {showEngine && human.engineSan && <p>O motor jogaria {human.engineSan}.</p>}
            </div>
          )}
          {session.sans.length === 0 && !drill && session.archive.length > 0 && (
            <div className="space-y-1 pt-1">
              <p className="text-muted-foreground">Suas partidas</p>
              {session.archive.slice(0, 4).map((game) => (
                <button
                  key={game.id}
                  type="button"
                  className="block text-left text-muted-foreground hover:text-foreground"
                  onClick={() => onOpenArchive(game.id)}
                >
                  {game.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!quiet && !reviewing && atLive && !result && (
        <Button type="button" className="h-10 w-full" aria-pressed={hintAsked} onClick={onAskHint}>
          {hintAsked ? "Ocultar o melhor lance" : "Ver melhor lance"}
        </Button>
      )}
      {!quiet && !reviewing && session.sans.length > 0 && (
        <Button
          type="button"
          variant={result ? "default" : "outline"}
          className="h-10 w-full"
          onClick={onStartReview}
        >
          Analisar partida
        </Button>
      )}
      {reviewing && (
        <Button type="button" variant="outline" className="h-10 w-full" onClick={onStopReview}>
          Voltar
        </Button>
      )}

      <div className="flex flex-wrap gap-1.5">
        <Button variant="outline" size="sm" onClick={onUndo} disabled={session.sans.length === 0 || !atLive}>
          Desfazer
        </Button>
        <Button variant="outline" size="sm" onClick={onNew}>
          Nova partida
        </Button>
        <Button variant="outline" size="sm" onClick={onCopy} disabled={session.sans.length === 0}>
          {copied ? "Copiado" : "Copiar PGN"}
        </Button>
      </div>

      {!atLive && (
        <Button variant="ghost" size="sm" className="justify-start px-0" onClick={onBack}>
          Voltar ao presente
        </Button>
      )}

      <div role="tablist" aria-label="Momento" className="flex gap-3">
        {(
          [
            ["agora", "Agora"],
            ["lista", "Lista"],
            ["pagina", "Página"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={moment === id}
            onClick={() => setMoment(id)}
            className={moment === id ? "text-[13px] text-white" : "text-[13px] text-white/35"}
          >
            {label}
          </button>
        ))}
      </div>

      {moment === "lista" && (
        <section>
          {session.sans.length === 0 ? (
            <p className="text-[13px] leading-5 text-muted-foreground">A lista abre no primeiro lance.</p>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              <ol ref={listRef} className="space-y-0.5 text-[13px]">
                {rows(session.sans).map((row) => {
                  const whiteNote = session.notes.find((note) => note.ply === row.whitePly)
                  const blackPly = row.blackPly
                  const blackNote = blackPly ? session.notes.find((note) => note.ply === blackPly) : undefined
                  return (
                    <li key={row.n} className="grid grid-cols-[1.5rem_1fr_1fr] gap-x-1">
                      <span className="text-muted-foreground">{row.n}</span>
                      <MoveButton
                        san={row.white}
                        ply={row.whitePly}
                        pieceStyle={session.pieceStyle}
                        startTurn={startTurn}
                        grade={listedGrade(session, row.whitePly)}
                        noted={Boolean(whiteNote)}
                        active={activePly(row.whitePly, viewPly, atLive, session.sans.length)}
                        onClick={() => openPly(row.whitePly)}
                      />
                      {row.black && blackPly != null ? (
                        <MoveButton
                          san={row.black}
                          ply={blackPly}
                          pieceStyle={session.pieceStyle}
                          startTurn={startTurn}
                          grade={listedGrade(session, blackPly)}
                          noted={Boolean(blackNote)}
                          active={activePly(blackPly, viewPly, atLive, session.sans.length)}
                          onClick={() => openPly(blackPly)}
                        />
                      ) : (
                        <span />
                      )}
                    </li>
                  )
                })}
              </ol>
            </div>
          )}
        </section>
      )}

      {moment === "pagina" && (
        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <p className="text-[13px] font-medium">Caderno</p>
            <p className="text-[12px] text-white/40">
              {session.notes.length === 0
                ? "Nenhuma página"
                : `${session.notes.length} ${session.notes.length === 1 ? "página" : "páginas"}`}
            </p>
          </div>
          {session.notes.length > 0 && (
            <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
              {session.notes.map((note) => (
                <button
                  key={note.ply}
                  type="button"
                  onClick={() => openPly(note.ply)}
                  className={
                    note.ply === notePly
                      ? "shrink-0 rounded-full bg-white px-2 py-0.5 text-[12px] text-[#161616]"
                      : "shrink-0 rounded-full bg-white/8 px-2 py-0.5 text-[12px] text-white/70"
                  }
                >
                  {sanPt(note.san)}
                </button>
              ))}
            </div>
          )}
          {!noteSan && (
            <p className="text-[13px] leading-5 text-muted-foreground">A primeira página abre no primeiro lance.</p>
          )}
          {noteSan && pageMark && pageMark.drop != null && pageMark.drop >= 20 && (
            <p className="mb-2 text-[12px] text-white/40">
              A avaliação caiu {formatDrop(pageMark.drop)} peões neste lance.
            </p>
          )}
          {noteSan && (
            <Notebook
              ply={notePly}
              san={noteSan}
              note={session.notes.find((note) => note.ply === notePly) ?? null}
              onSave={(text, tag) =>
                onSaveNote({
                  ply: notePly,
                  san: noteSan,
                  fen: "",
                  tag,
                  text,
                })
              }
              onDelete={() => onDeleteNote(notePly)}
            />
          )}
        </section>
      )}
    </>
  )
}

function situation(session: Session): { title: string; body: string } {
  const color = session.player === "w" ? "brancas" : "pretas"
  if (session.mode === "estudo") {
    return {
      title: "Estudo",
      body: "Os dois lados são seus. Toque a peça e depois a casa.",
    }
  }
  const force = { iniciante: "iniciante", clube: "de clube", forte: "forte" }[session.strength]
  return {
    title: `Partida de ${color}`,
    body:
      session.player === "w"
        ? `Você joga embaixo. O adversário ${force} responde.`
        : `Você joga embaixo, de pretas. O adversário ${force} começa.`,
  }
}

function Field({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section className="space-y-1.5">
      <div>
        <h3 className="text-[13px] font-medium">{title}</h3>
        <p className="text-[13px] leading-5 text-muted-foreground">{hint}</p>
      </div>
      {children}
    </section>
  )
}

function BoardSwatch({ light, dark }: { light: string; dark: string }) {
  const cells = []
  for (let index = 0; index < 16; index += 1) {
    const file = index % 4
    const rank = Math.floor(index / 4)
    cells.push((file + rank) % 2 === 0 ? dark : light)
  }
  return (
    <span className="grid grid-cols-4 overflow-hidden rounded-[4px]" aria-hidden>
      {cells.map((color, index) => (
        <span key={index} className="aspect-square" style={{ background: color }} />
      ))}
    </span>
  )
}

function PieceSwatch({ style, light, dark }: { style: PieceStyle; light: string; dark: string }) {
  return (
    <span className="flex h-11 w-16 shrink-0 overflow-hidden rounded-[4px]" aria-hidden>
      <span className="flex flex-1 items-center justify-center" style={{ background: light }}>
        <span className="size-8">
          <PieceArt type="n" color="w" pieceStyle={style} />
        </span>
      </span>
      <span className="flex flex-1 items-center justify-center" style={{ background: dark }}>
        <span className="size-8">
          <PieceArt type="n" color="b" pieceStyle={style} />
        </span>
      </span>
    </span>
  )
}

function PieceStrip({ style, light, dark }: { style: PieceStyle; light: string; dark: string }) {
  const types = ["k", "q", "r", "b", "n", "p"]
  return (
    <div className="grid grid-cols-6 overflow-hidden rounded-[4px]" aria-label="As doze peças">
      {types.map((type) => (
        <span key={`w${type}`} className="aspect-square p-0.5" style={{ background: light }}>
          <PieceArt type={type} color="w" pieceStyle={style} />
        </span>
      ))}
      {types.map((type) => (
        <span key={`b${type}`} className="aspect-square p-0.5" style={{ background: dark }}>
          <PieceArt type={type} color="b" pieceStyle={style} />
        </span>
      ))}
    </div>
  )
}

function HexRow({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [draft, setDraft] = useState(value)
  const [focused, setFocused] = useState(false)
  if (!focused && draft !== value) setDraft(value)
  return (
    <label className="flex items-center justify-between gap-2 text-[13px]">
      <span>{label}</span>
      <span className="flex items-center gap-1.5">
        <input
          type="color"
          value={isHex(value) ? value : "#000000"}
          aria-label={label}
          onChange={(event) => onChange(event.target.value)}
          className="size-7 cursor-pointer rounded-[4px] border border-border bg-transparent"
        />
        <Input
          value={draft}
          aria-label={`${label} em hexadecimal`}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false)
            if (!isHex(draft)) setDraft(value)
          }}
          onChange={(event) => {
            const next = event.target.value
            setDraft(next)
            if (isHex(next)) onChange(next)
          }}
          className="h-8 w-24 font-mono text-[12px]"
        />
      </span>
    </label>
  )
}

function ArrowRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px]">{label}</span>
      <SpringSwitch checked={checked} label={label} onChange={onChange} />
    </div>
  )
}

function VolumeRow({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block text-[13px]">
      {label}
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        aria-label={`Volume, ${label}`}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
        className="mt-1 w-full accent-white"
      />
    </label>
  )
}

function Notebook({
  ply,
  san,
  note,
  onSave,
  onDelete,
}: {
  ply: number
  san: string
  note: Note | null
  onSave: (text: string, tag: NoteTag) => void
  onDelete: () => void
}) {
  const key = `${ply}:${note?.text ?? ""}:${note?.tag ?? ""}`
  const [seen, setSeen] = useState(key)
  const [text, setText] = useState(note?.text ?? "")
  const [tag, setTag] = useState<NoteTag>(note?.tag ?? "ideia")
  if (seen !== key) {
    setSeen(key)
    setText(note?.text ?? "")
    setTag(note?.tag ?? "ideia")
  }

  return (
    <form
      className="mt-3 border-l border-white/15 pl-3"
      onSubmit={(event) => {
        event.preventDefault()
        onSave(text, tag)
      }}
    >
      <p className="text-[18px] leading-6 font-medium tracking-tight">
        {Math.ceil(ply / 2)} · {sanPt(san)}
      </p>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1" role="radiogroup" aria-label="Marca da página">
        {TAGS.map((item) => {
          const selected = tag === item.value
          return (
            <button
              key={item.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setTag(item.value)}
              className={selected ? "text-[12px] text-white" : "text-[12px] text-white/35"}
            >
              {item.label}
            </button>
          )
        })}
      </div>
      <Textarea
        value={text}
        maxLength={400}
        onChange={(event) => setText(event.target.value)}
        placeholder="Escreva nesta página."
        aria-label={`Página de ${sanPt(san)}`}
        className="mt-2 min-h-16 border-0 bg-transparent px-0 py-1 text-[14px] leading-6 shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
      />
      <div className="mt-1 flex items-center gap-3">
        <button type="submit" disabled={text.trim().length === 0} className="text-[12px] text-white disabled:text-white/25">
          Guardar página
        </button>
        {note && (
          <button type="button" onClick={onDelete} className="text-[12px] text-white/40">
            Apagar
          </button>
        )}
      </div>
    </form>
  )
}

function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(values) => {
        const picked = values.find((item) => item !== value) ?? values[0]
        if (picked) onChange(picked as T)
      }}
      variant="outline"
      size="sm"
      spacing={1}
      className="w-full"
      aria-label={label}
    >
      {options.map((option) => (
        <ToggleGroupItem key={option.value} value={option.value} className={choiceClass}>
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

function MoveButton({
  san,
  ply,
  pieceStyle,
  startTurn,
  grade,
  noted,
  active,
  onClick,
}: {
  san: string
  ply: number
  pieceStyle: PieceStyle
  startTurn: "w" | "b"
  grade: Grade | null
  noted: boolean
  active: boolean
  onClick: () => void
}) {
  const type = figurine(san)
  const color = moverColor(startTurn, ply)
  const name = sanPt(san)
  return (
    <button
      type="button"
      data-active={active ? "true" : "false"}
      onClick={onClick}
      aria-label={grade ? `${name}, ${GRADE_NAME[grade]}` : name}
      className={
        active
          ? "flex min-w-0 items-center gap-1 rounded-[6px] bg-white/10 px-1 text-left text-white"
          : "flex min-w-0 items-center gap-1 px-1 text-left text-white/80"
      }
    >
      {grade && <GradeMark grade={grade} />}
      {type && (
        <span
          className="relative size-3.5 shrink-0 rounded-[2px]"
          style={{ background: color === "w" ? "#6f6a62" : "#e4e0d8" }}
        >
          <PieceArt type={type} color={color} pieceStyle={pieceStyle} />
        </span>
      )}
      <span className="truncate">{name}</span>
      {noted && <span className="size-1 shrink-0 rounded-full bg-white/70" />}
    </button>
  )
}

function DrillList({
  kind,
  label,
  onStart,
}: {
  kind: "exercicio" | "final"
  label: string
  onStart: (id: string) => void
}) {
  const items = DRILLS.filter((drill) => drill.kind === kind)
  return (
    <div className="space-y-1">
      <p className="text-[12px] text-white/40">{label}</p>
      {items.map((drill) => (
        <button
          key={drill.id}
          type="button"
          className="block text-left text-[13px] text-muted-foreground hover:text-foreground"
          onClick={() => onStart(drill.id)}
        >
          {drill.title}
        </button>
      ))}
    </div>
  )
}

function rows(sans: string[]) {
  const out: { n: number; white: string; whitePly: number; black?: string; blackPly?: number }[] = []
  for (let index = 0; index < sans.length; index += 2) {
    out.push({
      n: index / 2 + 1,
      white: sans[index],
      whitePly: index + 1,
      black: sans[index + 1],
      blackPly: sans[index + 1] ? index + 2 : undefined,
    })
  }
  return out
}

function listedGrade(session: Session, ply: number): Grade | null {
  const mark = session.marks.find((item) => item.ply === ply)
  if (!mark) return null
  return badgeGrade(gradeOf(mark))
}

function figurine(san: string): string | null {
  if (san.startsWith("O-O")) return "k"
  const map: Record<string, string> = { K: "k", Q: "q", R: "r", B: "b", N: "n" }
  return map[san[0]] ?? null
}

function ReviewCard({
  session,
  focus,
  atLive,
  playing,
  explainOn,
  series,
  startTurn,
  onExplain,
  onNext,
  onStep,
  onStart,
  onEnd,
  onTogglePlay,
  onSelect,
  onPractice,
}: {
  session: Session
  focus: number
  atLive: boolean
  playing: boolean
  explainOn: boolean
  series: (number | null)[]
  startTurn: "w" | "b"
  onExplain: () => void
  onNext: () => void
  onStep: (delta: number) => void
  onStart: () => void
  onEnd: () => void
  onTogglePlay: () => void
  onSelect: (ply: number) => void
  onPractice: () => void
}) {
  const san = focus > 0 ? session.sans[focus - 1] : null
  const mark = session.marks.find((item) => item.ply === focus) ?? null
  const grade = mark ? gradeOf(mark) : null
  const lastBook = Boolean(grade === "livro" && isLastBook(session.marks, focus))
  const playerMove = san ? moverColor(startTurn, focus) === session.player || session.mode === "estudo" : false
  const line = !san
    ? "Posição inicial"
    : grade
      ? gradeLine(san, grade, lastBook)
      : playerMove
        ? `${sanPt(san)} ainda sem classificação`
        : `${sanPt(san)} é lance do motor`
  const explanation = grade
    ? coachFor(session.startFen, session.sans, focus, grade, mark?.bestSan ?? null, Boolean(mark?.matched), lastBook)
    : null
  const retry =
    Boolean(mark?.best && mark.bestSan) &&
    (grade === "imprecisao" || grade === "erro" || grade === "vacilo" || grade === "omissao")
  const critical = criticalPlies(session.marks)
  const nextCritical = critical.find((ply) => ply > focus) ?? null
  const score = series[focus]
  const chip = typeof score === "number" ? formatReviewCp(score) : null
  const grades = series.map((_, index) => {
    const item = session.marks.find((mark) => mark.ply === index)
    return item ? gradeOf(item) : null
  })

  return (
    <section className="space-y-2" aria-label="Revisão do lance">
      <div className="rounded-[6px] border border-border px-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13px] leading-5">{line}</p>
          {chip && (
            <span className="shrink-0 rounded-[4px] bg-white/10 px-1.5 py-0.5 text-[12px] tabular-nums">{chip}</span>
          )}
        </div>
        {explainOn && explanation && <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{explanation}</p>}
      </div>
      <div className="flex gap-1.5">
        <Button type="button" variant="outline" className="flex-1" onClick={onExplain} disabled={!explanation} aria-pressed={explainOn}>
          Explicar
        </Button>
        <Button
          type="button"
          className="h-10 flex-[1.5] bg-[#7fa650] text-white hover:bg-[#8fb564]"
          onClick={onNext}
          disabled={atLive}
        >
          Próximo
        </Button>
      </div>
      {retry && (
        <Button type="button" variant="outline" className="w-full" onClick={onPractice}>
          Tentar novamente
        </Button>
      )}
      {nextCritical != null && (
        <button type="button" className="text-left text-[13px] text-muted-foreground" onClick={() => onSelect(nextCritical)}>
          Ir ao ponto do lance {nextCritical}
        </button>
      )}
      <EvalGraph series={series} grades={grades} active={focus} onSelect={onSelect} />
      <div className="grid grid-cols-5 gap-1">
        <Transport label="Início" glyph="|◀" disabled={focus === 0} onClick={onStart} />
        <Transport label="Anterior" glyph="◀" disabled={focus === 0} onClick={() => onStep(-1)} />
        <Transport label={playing ? "Pausar" : "Jogar"} glyph={playing ? "❚❚" : "▶"} disabled={session.sans.length === 0} onClick={onTogglePlay} />
        <Transport label="Avançar" glyph="▶" disabled={atLive} onClick={onNext} />
        <Transport label="Fim" glyph="▶|" disabled={atLive} onClick={onEnd} />
      </div>
    </section>
  )
}

function Transport({
  label,
  glyph,
  disabled,
  onClick,
}: {
  label: string
  glyph: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <Button type="button" variant="outline" size="sm" className="w-full px-0" aria-label={label} disabled={disabled} onClick={onClick}>
      <span aria-hidden>{glyph}</span>
    </Button>
  )
}

function EvalGraph({
  series,
  grades,
  active,
  onSelect,
}: {
  series: (number | null)[]
  grades: (Grade | null)[]
  active: number
  onSelect: (ply: number) => void
}) {
  const points = series.flatMap((cp, index) => (typeof cp === "number" ? [{ index, cp }] : []))
  if (points.length < 2) return null
  const last = Math.max(1, series.length - 1)
  const xOf = (index: number) => (index / last) * 100
  const yOf = (cp: number) => {
    const clamped = Math.max(-500, Math.min(500, cp))
    return 18 - (clamped / 500) * 12
  }
  const mid = yOf(0)
  const segments: string[] = []
  let current = ""
  let prev = -1
  for (const point of points) {
    const cmd = `${xOf(point.index).toFixed(2)} ${yOf(point.cp).toFixed(2)}`
    if (current && point.index === prev + 1) current += ` L ${cmd}`
    else {
      if (current) segments.push(current)
      current = `M ${cmd}`
    }
    prev = point.index
  }
  if (current) segments.push(current)

  function pick(event: PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width === 0) return
    const x = ((event.clientX - rect.left) / rect.width) * 100
    let chosen = points[0]
    let distance = Number.POSITIVE_INFINITY
    for (const point of points) {
      const next = Math.abs(xOf(point.index) - x)
      if (next < distance) {
        distance = next
        chosen = point
      }
    }
    if (chosen) onSelect(chosen.index)
  }

  return (
    <svg
      viewBox="0 0 100 36"
      className="h-16 w-full touch-none"
      role="img"
      aria-label="Avaliação da partida"
      onPointerDown={pick}
    >
      <rect x="0" y="4" width="100" height={mid - 4} fill="rgba(255,255,255,0.04)" />
      <rect x="0" y={mid} width="100" height={32 - mid} fill="rgba(0,0,0,0.28)" />
      <line x1="0" y1={mid} x2="100" y2={mid} stroke="rgba(255,255,255,0.28)" strokeWidth="0.35" />
      {segments.map((d) => (
        <path key={d} d={d} fill="none" stroke="rgba(255,255,255,0.78)" strokeWidth="0.7" />
      ))}
      {points.map((point) => {
        const grade = grades[point.index]
        const big = point.index === active
        return (
          <circle
            key={point.index}
            cx={xOf(point.index)}
            cy={yOf(point.cp)}
            r={big ? 1.6 : 0.95}
            fill={grade ? GRADE_COLOR[grade] : "rgba(255,255,255,0.72)"}
          />
        )
      })}
    </svg>
  )
}

function ReviewSummary({
  session,
  result,
  startTurn,
}: {
  session: Session
  result: string | null
  startTurn: "w" | "b"
}) {
  const accuracy = accuracyOf(session.marks, startTurn)
  const counts = new Map<Grade, number>()
  for (const mark of session.marks) {
    const grade = gradeOf(mark)
    if (!grade) continue
    counts.set(grade, (counts.get(grade) ?? 0) + 1)
  }
  const listed = [...counts.entries()]
  return (
    <section className="space-y-1 text-[13px] leading-5" aria-label="Resumo da análise">
      <p>
        {result ?? "Partida em andamento"} · {session.sans.length} {session.sans.length === 1 ? "lance" : "lances"}
      </p>
      <p>
        Precisão estimada do Lance: brancas {accuracy.w == null ? "—" : `${accuracy.w}%`}, pretas{" "}
        {accuracy.b == null ? "—" : `${accuracy.b}%`}.
      </p>
      {listed.length > 0 && (
        <p className="text-muted-foreground">
          {listed.map(([grade, count]) => `${count} ${GRADE_NAME[grade]}`).join(" · ")}
        </p>
      )}
    </section>
  )
}

function GradeMark({ grade }: { grade: Grade }) {
  return (
    <span
      className="inline-flex size-3.5 shrink-0 items-center justify-center rounded-full text-[8px] leading-none font-medium text-white"
      style={{ background: GRADE_COLOR[grade] }}
      aria-hidden
    >
      {grade === "livro" ? <BookMark /> : gradeGlyph(grade)}
    </span>
  )
}

function BookMark() {
  return (
    <svg viewBox="0 0 12 12" className="size-2.5" aria-hidden>
      <path
        d="M1.6 2.2h3.4c.5 0 1 .2 1.2.7.2-.5.7-.7 1.2-.7h3V9.6H7.4c-.4 0-.8.2-1.2.5-.4-.3-.8-.5-1.2-.5H1.6V2.2z"
        fill="currentColor"
      />
    </svg>
  )
}

function activePly(ply: number, viewPly: number | null, atLive: boolean, length: number): boolean {
  if (!atLive && viewPly != null) return viewPly === ply
  return atLive && ply === length
}
