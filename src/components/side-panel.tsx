"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { sanPt } from "@/lib/notation"
import {
  TAGS,
  type Assistance,
  type Color,
  type Mode,
  type Note,
  type NoteTag,
  type Session,
  type Strength,
} from "@/lib/session"

const choiceClass =
  "flex-1 rounded-[6px] data-[state=on]:bg-foreground data-[state=on]:text-background"

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
}) {
  const [fen, setFen] = useState("")
  const [fenError, setFenError] = useState<string | null>(null)
  const notePly = !atLive && viewPly ? viewPly : session.sans.length
  const noteSan = notePly > 0 ? session.sans[notePly - 1] : null

  return (
    <aside className="flex w-full flex-col gap-3 rounded-[6px] border border-border bg-card p-3 lg:w-[280px] lg:shrink-0">
      {result && atLive && (
        <div className="space-y-1 text-[13px] leading-5">
          <p>{result}</p>
          {attempts > 0 && (
            <p className="text-muted-foreground">
              Você coincidiu com o motor em {matches} de {attempts} lances.
            </p>
          )}
        </div>
      )}
      {!result && attempts > 0 && (
        <p className="text-[13px] text-muted-foreground">
          {matches} de {attempts} com o motor.
        </p>
      )}

      <Choice
        label="Cor"
        value={session.player}
        onChange={onPlayer}
        options={[
          { value: "w", label: "Brancas" },
          { value: "b", label: "Pretas" },
        ]}
      />
      <Choice
        label="Modo"
        value={session.mode}
        onChange={onMode}
        options={[
          { value: "partida", label: "Partida" },
          { value: "estudo", label: "Estudo" },
        ]}
      />
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
      {session.mode === "partida" && (
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
      )}

      <div className="space-y-1 text-[13px] leading-5">
        <p className="tabular-nums text-muted-foreground">{evalText}</p>
        {session.assistance === "livre" && reviewText && <p>{reviewText}</p>}
        {session.assistance === "livre" && (
          <button
            type="button"
            className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            onClick={() => onReview(!session.review)}
          >
            {session.review ? "Calar a revisão" : "Rever o lance"}
          </button>
        )}
        {session.assistance === "melhor" && pv && <p>{pv}</p>}
        {session.assistance === "humano" && human?.coincides === true && (
          <p>O lance natural coincide com o do motor.</p>
        )}
        {session.assistance === "humano" && human?.coincides === false && (
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
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Button variant="outline" size="sm" onClick={onUndo} disabled={session.sans.length === 0 || !atLive}>
          Desfazer
        </Button>
        <Button variant="outline" size="sm" onClick={onNew}>
          Nova
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

      <Separator />

      <div>
        <p className="mb-1.5 text-[13px] text-muted-foreground">Lances</p>
        {session.sans.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">A partida ainda não começou.</p>
        ) : (
          <ScrollArea className="max-h-36">
            <ol className="space-y-0.5 pr-2 text-[13px]">
              {rows(session.sans).map((row) => (
                <li key={row.n} className="grid grid-cols-[1.5rem_1fr_1fr] gap-1">
                  <span className="text-muted-foreground">{row.n}</span>
                  <MoveButton
                    san={row.white}
                    active={activePly(row.whitePly, viewPly, atLive, session.sans.length)}
                    onClick={() => onView(row.whitePly)}
                  />
                  {row.black && row.blackPly ? (
                    <MoveButton
                      san={row.black}
                      active={activePly(row.blackPly, viewPly, atLive, session.sans.length)}
                      onClick={() => onView(row.blackPly!)}
                    />
                  ) : (
                    <span />
                  )}
                </li>
              ))}
            </ol>
          </ScrollArea>
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        <p className="text-[13px] text-muted-foreground">Caderno</p>
        {session.notes.length === 0 && (
          <p className="text-[13px] leading-5 text-muted-foreground">
            Nada anotado. Depois de um lance, escreva o que ficou.
          </p>
        )}
        {session.notes.length > 0 && (
          <ul className="space-y-1.5">
            {session.notes.map((note) => (
              <li key={note.ply}>
                <button type="button" className="text-left text-[13px] leading-5" onClick={() => onView(note.ply)}>
                  <span className="text-muted-foreground">
                    {sanPt(note.san)} · {TAGS.find((tag) => tag.value === note.tag)?.label}
                  </span>
                  <span className="block">{note.text}</span>
                </button>
              </li>
            ))}
          </ul>
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
      </div>

      {session.archive.length > 0 && (
        <>
          <Separator />
          <div>
            <p className="mb-1.5 text-[13px] text-muted-foreground">Anteriores</p>
            <ul className="space-y-1">
              {session.archive.map((game) => (
                <li key={game.id}>
                  <button
                    type="button"
                    className="text-left text-[13px] text-muted-foreground hover:text-foreground"
                    onClick={() => onOpenArchive(game.id)}
                  >
                    {game.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <Separator />

      <form
        className="space-y-1.5"
        onSubmit={(event) => {
          event.preventDefault()
          const error = onLoadFen(fen)
          setFenError(error)
          if (!error) setFen("")
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
    </aside>
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
      className="space-y-1.5"
      onSubmit={(event) => {
        event.preventDefault()
        onSave(text, tag)
      }}
    >
      <p className="text-[13px]">Nota em {sanPt(san)}</p>
      <ToggleGroup
        value={[tag]}
        onValueChange={(values) => {
          const picked = values.find((item) => item !== tag) ?? values[0]
          if (picked) setTag(picked as NoteTag)
        }}
        variant="outline"
        size="sm"
        spacing={1}
        className="w-full flex-wrap"
      >
        {TAGS.map((item) => (
          <ToggleGroupItem key={item.value} value={item.value} className={choiceClass}>
            {item.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Textarea
        value={text}
        maxLength={400}
        onChange={(event) => setText(event.target.value)}
        placeholder="O que ficou deste lance"
        aria-label={`Nota em ${sanPt(san)}`}
      />
      <div className="flex gap-1.5">
        <Button type="submit" size="sm" disabled={text.trim().length === 0}>
          Guardar
        </Button>
        {note && (
          <Button type="button" variant="ghost" size="sm" onClick={onDelete}>
            Apagar
          </Button>
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
    <div>
      <p className="mb-1.5 text-[13px] text-muted-foreground">{label}</p>
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
      >
        {options.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value} className={choiceClass}>
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

function MoveButton({
  san,
  active,
  onClick,
}: {
  san: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? "rounded-[6px] bg-foreground/10 px-1 text-left" : "px-1 text-left"}
    >
      {san}
    </button>
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
