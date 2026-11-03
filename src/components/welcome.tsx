"use client"

import { useMemo, useState, type ReactNode } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { PieceArt } from "@/components/pieces"
import { BOARD_THEMES, PIECE_STYLES, type BoardTheme, type PieceStyle } from "@/lib/look"
import { playSnd } from "@/lib/snd"
import type { Assistance, Color, Mode, Session, Strength } from "@/lib/session"

export type WelcomePatch = Pick<
  Session,
  "player" | "mode" | "assistance" | "strength" | "boardTheme" | "pieceStyle" | "sound"
>

type StepId = "cor" | "modo" | "ajuda" | "forca" | "casas" | "pecas" | "som"

const ASSIST: Record<Assistance, string> = {
  livre: "Nenhuma seta sozinha. Se você pedir, o melhor lance aparece.",
  melhor: "A seta verde só aparece quando você pede. No cavalo, ela faz o L.",
  humano: "A seta azul só aparece quando você pede. No cavalo, ela faz o L.",
}

export function Welcome({ session, onDone }: { session: Session; onDone: (patch: WelcomePatch) => void }) {
  const reduced = useReducedMotion()
  const [draft, setDraft] = useState<WelcomePatch>({
    player: session.player,
    mode: session.mode,
    assistance: session.assistance,
    strength: session.strength,
    boardTheme: session.boardTheme,
    pieceStyle: session.pieceStyle,
    sound: session.sound,
  })
  const [stepId, setStepId] = useState<StepId>("cor")
  const order = useMemo(() => stepsFor(draft.mode), [draft.mode])
  const step = order.includes(stepId) ? stepId : "modo"
  const index = order.indexOf(step)

  function pick<K extends keyof WelcomePatch>(key: K, value: WelcomePatch[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
    playSnd("select", key === "sound" ? Boolean(value) || draft.sound : draft.sound)
  }

  function go(next: StepId | "done") {
    if (next === "done") {
      playSnd("button", draft.sound)
      onDone(draft)
      return
    }
    playSnd(order.indexOf(next) > index ? "transitionUp" : "transitionDown", draft.sound)
    setStepId(next)
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center px-4 py-6 sm:items-center">
      <div className="absolute inset-0 bg-black/45" />
      <motion.div
        layout
        transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }}
        className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-[380px] overflow-y-auto rounded-[16px] border border-white/10 bg-[#1c1c1e] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
        role="dialog"
        aria-labelledby="welcome-title"
      >
        <p className="text-[12px] tracking-wide text-white/45">
          Lance · {index + 1} de {order.length}
        </p>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={reduced ? false : { opacity: 0, filter: "blur(8px)", y: 6 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            exit={reduced ? undefined : { opacity: 0, filter: "blur(8px)", y: -6 }}
            transition={{ duration: reduced ? 0 : 0.22 }}
            className="mt-3"
          >
            <StepBody step={step} draft={draft} onPick={pick} />
          </motion.div>
        </AnimatePresence>
        <div className="mt-5 flex gap-2">
          {index > 0 && (
            <button
              type="button"
              onClick={() => go(order[index - 1])}
              className="h-11 flex-1 rounded-[12px] bg-white/8 text-[13px] text-white active:translate-y-px"
            >
              Voltar
            </button>
          )}
          <button
            type="button"
            onClick={() => go(index === order.length - 1 ? "done" : order[index + 1])}
            className="h-11 flex-[1.4] rounded-[12px] bg-white text-[13px] font-medium text-[#161616] active:translate-y-px"
          >
            {index === order.length - 1 ? "Ir para o jogo" : "Continuar"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function stepsFor(mode: Mode): StepId[] {
  return ["cor", "modo", "ajuda", ...(mode === "partida" ? (["forca"] as const) : []), "casas", "pecas", "som"]
}

function StepBody({
  step,
  draft,
  onPick,
}: {
  step: StepId
  draft: WelcomePatch
  onPick: <K extends keyof WelcomePatch>(key: K, value: WelcomePatch[K]) => void
}) {
  if (step === "cor") {
    return (
      <Question title="Com qual cor você joga?" hint="O tabuleiro gira. Numa partida, as brancas começam.">
        <Pair
          value={draft.player}
          options={[
            { value: "w", label: "Brancas" },
            { value: "b", label: "Pretas" },
          ]}
          onChange={(value) => onPick("player", value as Color)}
        />
      </Question>
    )
  }
  if (step === "modo") {
    return (
      <Question title="O que você vai fazer?" hint="Partida é contra o motor. Estudo é para mexer os dois lados.">
        <Pair
          value={draft.mode}
          options={[
            { value: "partida", label: "Partida" },
            { value: "estudo", label: "Estudo" },
          ]}
          onChange={(value) => onPick("mode", value as Mode)}
        />
      </Question>
    )
  }
  if (step === "ajuda") {
    return (
      <Question title="Que ajuda você quer no lance?" hint={ASSIST[draft.assistance]}>
        <Pair
          value={draft.assistance}
          options={[
            { value: "livre", label: "Livre" },
            { value: "melhor", label: "Melhor" },
            { value: "humano", label: "Humano" },
          ]}
          onChange={(value) => onPick("assistance", value as Assistance)}
        />
      </Question>
    )
  }
  if (step === "forca") {
    return (
      <Question title="Quão forte é o adversário?" hint="A sugestão, quando você pede, continua no máximo.">
        <Pair
          value={draft.strength}
          options={[
            { value: "iniciante", label: "Iniciante" },
            { value: "clube", label: "Clube" },
            { value: "forte", label: "Forte" },
          ]}
          onChange={(value) => onPick("strength", value as Strength)}
        />
      </Question>
    )
  }
  if (step === "casas") {
    return (
      <Question title="Como ficam as casas?" hint={BOARD_THEMES[draft.boardTheme].hint}>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(BOARD_THEMES) as BoardTheme[]).map((id) => {
            const theme = BOARD_THEMES[id]
            const selected = draft.boardTheme === id
            return (
              <button
                key={id}
                type="button"
                aria-pressed={selected}
                onClick={() => onPick("boardTheme", id)}
                className="rounded-[12px] border p-1.5 text-left"
                style={{ borderColor: selected ? "#fff" : "rgba(255,255,255,0.1)" }}
              >
                <span className="grid grid-cols-4 overflow-hidden rounded-[8px]" aria-hidden>
                  {Array.from({ length: 16 }, (_, cell) => {
                    const light = (cell % 4 + Math.floor(cell / 4)) % 2 === 0
                    return (
                      <span
                        key={cell}
                        className="aspect-square"
                        style={{ background: light ? theme.dark : theme.light }}
                      />
                    )
                  })}
                </span>
                <span className="mt-1 block text-[13px]">{theme.label}</span>
              </button>
            )
          })}
        </div>
      </Question>
    )
  }
  if (step === "pecas") {
    return (
      <Question title="Qual desenho de peças?" hint={PIECE_STYLES[draft.pieceStyle].hint}>
        <div className="space-y-2">
          {(Object.keys(PIECE_STYLES) as PieceStyle[]).map((id) => {
            const style = PIECE_STYLES[id]
            const selected = draft.pieceStyle === id
            const colors = BOARD_THEMES[draft.boardTheme]
            return (
              <button
                key={id}
                type="button"
                aria-pressed={selected}
                onClick={() => onPick("pieceStyle", id)}
                className="flex w-full items-center gap-3 rounded-[12px] border p-2 text-left"
                style={{ borderColor: selected ? "#fff" : "rgba(255,255,255,0.1)" }}
              >
                <span className="flex h-12 w-20 overflow-hidden rounded-[8px]" aria-hidden>
                  <span className="flex flex-1 items-center justify-center" style={{ background: colors.light }}>
                    <span className="size-9">
                      <PieceArt type="n" color="w" pieceStyle={id} />
                    </span>
                  </span>
                  <span className="flex flex-1 items-center justify-center" style={{ background: colors.dark }}>
                    <span className="size-9">
                      <PieceArt type="n" color="b" pieceStyle={id} />
                    </span>
                  </span>
                </span>
                <span>
                  <span className="block text-[14px]">{style.label}</span>
                  <span className="block text-[12px] leading-4 text-white/50">{style.hint}</span>
                </span>
              </button>
            )
          })}
        </div>
      </Question>
    )
  }
  return (
    <Question
      title="Quer som nos toques?"
      hint="É o kit de seno do snd.dev. Baixo, só quando você age. Dá para calar depois."
    >
      <Pair
        value={draft.sound ? "sim" : "nao"}
        options={[
          { value: "sim", label: "Ligado" },
          { value: "nao", label: "Mudo" },
        ]}
        onChange={(value) => onPick("sound", value === "sim")}
      />
    </Question>
  )
}

function Question({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <div>
      <h2 id="welcome-title" className="text-[22px] leading-7 font-medium tracking-tight">
        {title}
      </h2>
      <p className="mt-2 text-[13px] leading-5 text-white/55">{hint}</p>
      <div className="mt-4">{children}</div>
    </div>
  )
}

function Pair({
  value,
  options,
  onChange,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className="h-12 rounded-[12px] text-[13px] font-medium"
            style={{
              background: selected ? "#fff" : "rgba(255,255,255,0.06)",
              color: selected ? "#161616" : "#fff",
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
