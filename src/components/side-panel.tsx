"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

import { PieceArt } from "@/components/pieces"
import { SpringSwitch } from "@/components/spring-switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { openingTitle } from "@/lib/book"
import { DRILLS, drillById, drillProgress } from "@/lib/drills"
import { START_FEN } from "@/lib/game"
import { BOARD_THEMES, PIECE_STYLES, type BoardTheme, type PieceStyle } from "@/lib/look"
import { formatDrop, sanPt } from "@/lib/notation"
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
  type Strength,
  type Tab,
} from "@/lib/session"

const choiceClass =
  "flex-1 rounded-[6px] data-[state=on]:bg-foreground data-[state=on]:text-background"

const ASSIST: Record<Assistance, string> = {
  livre: "Nenhuma seta. Depois do seu lance, uma linha diz o que você jogou e o que o motor preferia, em peões.",
  melhor: "Seta verde no lance do motor. No cavalo, a seta faz o L. A avaliação e três lances da linha vêm junto.",
  humano: "Seta azul no lance natural. No cavalo, a seta faz o L. Na abertura vem de um livro. Fora dele, é o lance mais ordinário perto do melhor.",
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
}) {
  return (
    <aside data-sea-block="" className="flex w-full flex-col gap-3 rounded-[6px] border border-border bg-card p-3 lg:max-h-[calc(100dvh-7.5rem)] lg:w-[320px] lg:shrink-0 lg:overflow-y-auto">
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
}) {
  const [fen, setFen] = useState("")
  const [fenError, setFenError] = useState<string | null>(null)

  return (
    <>
      <div className="space-y-1.5">
        <h2 className="text-[15px] font-medium tracking-tight">Configurar</h2>
        <p className="text-[13px] leading-5 text-muted-foreground">
          O tabuleiro é a partida. A barra fina ao lado dele é a avaliação, das brancas para cima. Aqui você escolhe
          como jogar e como o tabuleiro aparece. A seta, se você pedir uma ajuda, já aparece. O adversário só responde
          em Jogo.
        </p>
      </div>
      <Button className="w-full" onClick={() => onTab("jogo")}>
        Ir para o jogo
      </Button>

      <Field title="Treino" hint="Uma posição para achar o lance. O motor não responde enquanto o treino está aberto.">
        <DrillList kind="exercicio" label="Exercício" onStart={onStartDrill} />
        <DrillList kind="final" label="Final" onStart={onStartDrill} />
      </Field>

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

      <Field title="Peças" hint="O clássico é o diagrama limpo. O celta é o entalhe. O nítido é o contorno mais grosso.">
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
                <PieceSwatch style={id} theme={session.boardTheme} />
                <span className="min-w-0">
                  <span className="block text-[13px]">{style.label}</span>
                  <span className="block text-[12px] leading-4 text-muted-foreground">{style.hint}</span>
                </span>
              </button>
            )
          })}
        </div>
      </Field>

      <Field title="Som" hint="Toque no lance, na escolha e no fim da partida. O kit é o de seno do snd.dev.">
        <div className="flex items-center justify-between">
          <span className="text-[13px]">{session.sound ? "Ligado" : "Mudo"}</span>
          <SpringSwitch checked={session.sound} label="Som" onChange={onSound} />
        </div>
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
}) {
  const notePly = !atLive && viewPly ? viewPly : session.sans.length
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

  useEffect(() => {
    if (moment !== "lista" || !atLive) return
    const list = listRef.current
    list?.parentElement?.scrollTo({ top: list.scrollHeight })
  }, [atLive, moment, session.sans.length])

  function openPly(ply: number) {
    onView(ply)
    setMoment("pagina")
  }

  return (
    <>
      <div className="space-y-1">
        <h2 className="text-[15px] font-medium tracking-tight">{playing.title}</h2>
        {opening && <p className="text-[13px] text-muted-foreground">Abertura · {opening}</p>}
        <p className="text-[13px] leading-5 text-muted-foreground">{playing.body}</p>
      </div>

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
                  const blackNote = row.blackPly ? session.notes.find((note) => note.ply === row.blackPly) : undefined
                  return (
                    <li key={row.n} className="grid grid-cols-[1.5rem_1fr_1fr] gap-x-1">
                      <span className="text-muted-foreground">{row.n}</span>
                      <MoveButton
                        san={row.white}
                        noted={Boolean(whiteNote)}
                        loss={fallen?.ply === row.whitePly ? fallen.drop : null}
                        active={activePly(row.whitePly, viewPly, atLive, session.sans.length)}
                        onClick={() => openPly(row.whitePly)}
                      />
                      {row.black && row.blackPly ? (
                        <MoveButton
                          san={row.black}
                          noted={Boolean(blackNote)}
                          loss={fallen?.ply === row.blackPly ? fallen.drop : null}
                          active={activePly(row.blackPly, viewPly, atLive, session.sans.length)}
                          onClick={() => openPly(row.blackPly!)}
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

function PieceSwatch({ style, theme }: { style: PieceStyle; theme: BoardTheme }) {
  const colors = BOARD_THEMES[theme]
  return (
    <span className="flex h-11 w-16 shrink-0 overflow-hidden rounded-[4px]" aria-hidden>
      <span className="flex flex-1 items-center justify-center" style={{ background: colors.light }}>
        <span className="size-8">
          <PieceArt type="n" color="w" pieceStyle={style} />
        </span>
      </span>
      <span className="flex flex-1 items-center justify-center" style={{ background: colors.dark }}>
        <span className="size-8">
          <PieceArt type="n" color="b" pieceStyle={style} />
        </span>
      </span>
    </span>
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
  noted,
  loss,
  active,
  onClick,
}: {
  san: string
  noted: boolean
  loss: number | null
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? "rounded-[6px] bg-white/10 px-1 text-left text-white" : "px-1 text-left text-white/80"}
    >
      {san}
      {noted && <span className="ml-1 inline-block size-1 translate-y-[-1px] rounded-full bg-white/70" />}
      {loss != null && <span className="ml-1 text-[11px] text-white/35 tabular-nums">−{formatDrop(loss)}</span>}
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
      white: sanPt(sans[index]),
      whitePly: index + 1,
      black: sans[index + 1] ? sanPt(sans[index + 1]) : undefined,
      blackPly: sans[index + 1] ? index + 2 : undefined,
    })
  }
  return out
}

function activePly(ply: number, viewPly: number | null, atLive: boolean, length: number): boolean {
  if (!atLive && viewPly != null) return viewPly === ply
  return atLive && ply === length
}
