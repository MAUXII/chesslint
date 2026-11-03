"use client"

import { useRef, useState } from "react"

import { PieceArt } from "@/components/pieces"
import { arrowShape, knightCorner } from "@/lib/arrow"
import type { BoardArrow } from "@/lib/arrows"
import type { Placement } from "@/lib/game"
import { BOARD_THEMES, type BoardTheme, type CustomColors, type Highlights, type PieceStyle } from "@/lib/look"
import { GRADE_COLOR, gradeGlyph, type Grade } from "@/lib/review"
import type { Color } from "@/lib/session"

const PIECE_NAME: Record<string, string> = {
  p: "peão",
  n: "cavalo",
  b: "bispo",
  r: "torre",
  q: "dama",
  k: "rei",
}

type Drag = {
  id: string
  from: string
  x: number
  y: number
  startX: number
  startY: number
  moved: boolean
}

export function Board({
  pieces,
  orientation,
  lastMove,
  selected,
  destinations,
  checkSquare,
  arrows,
  tintSquare,
  badge,
  showLast,
  highlights,
  customColors,
  annotate,
  turn,
  theme,
  pieceStyle,
  onSquare,
  onDragStart,
  onDrop,
  onAnnotate,
}: {
  pieces: Placement[]
  orientation: Color
  lastMove: { from: string; to: string } | null
  selected: string | null
  destinations: { to: string; capture: boolean }[]
  checkSquare: string | null
  arrows: BoardArrow[]
  tintSquare: string | null
  badge: { square: string; grade: Grade } | null
  showLast: boolean
  highlights: Highlights
  customColors: CustomColors
  annotate: boolean
  turn: Color | null
  theme: BoardTheme
  pieceStyle: PieceStyle
  onSquare: (square: string) => void
  onDragStart: (square: string) => void
  onDrop: (from: string, to: string) => void
  onAnnotate: (from: string, to: string) => void
}) {
  const boardRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<Drag | null>(null)
  const arrowFrom = useRef<string | null>(null)
  const [drag, setDrag] = useState<Drag | null>(null)

  function updateDrag(next: Drag | null) {
    dragRef.current = next
    setDrag(next)
  }

  const squares = []
  for (let rank = 7; rank >= 0; rank -= 1) {
    for (let file = 0; file < 8; file += 1) {
      const square = "abcdefgh"[file] + String(rank + 1)
      squares.push(square)
    }
  }
  const ordered = orientation === "w" ? squares : [...squares].reverse()
  const palette = theme === "personalizado" ? customColors : BOARD_THEMES[theme]

  return (
    <div
      ref={boardRef}
      className="relative aspect-square w-full touch-none select-none"
      style={{ borderRadius: 6, boxShadow: "0 0 0 1px rgba(255,255,255,0.08)" }}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        if (!annotate) return
        if (event.button !== 2 && !(event.button === 0 && event.shiftKey)) return
        const rect = boardRef.current?.getBoundingClientRect()
        if (!rect) return
        arrowFrom.current = pointToSquare(event.clientX, event.clientY, rect, orientation)
      }}
      onPointerUp={(event) => {
        const from = arrowFrom.current
        arrowFrom.current = null
        if (!from || !annotate) return
        const rect = boardRef.current?.getBoundingClientRect()
        if (!rect) return
        const to = pointToSquare(event.clientX, event.clientY, rect, orientation)
        if (to && to !== from) onAnnotate(from, to)
      }}
    >
      <div className="grid h-full w-full grid-cols-8 grid-rows-8 overflow-hidden" style={{ borderRadius: 6 }}>
        {ordered.map((square) => {
          const light = isLight(square)
          const tone = light ? palette.light : palette.dark
          const ink = inkOn(tone)
          const marked = lastMove?.from === square || lastMove?.to === square
          const dest = destinations.find((item) => item.to === square)
          const showFile = orientation === "w" ? square[1] === "1" : square[1] === "8"
          const showRank = orientation === "w" ? square[0] === "a" : square[0] === "h"
          return (
            <button
              key={square}
              type="button"
              tabIndex={-1}
              aria-label={square}
              onClick={() => onSquare(square)}
              className="relative"
              style={{ background: tone }}
            >
              {showLast && marked && (
                <span className="absolute inset-0" style={{ background: highlights.last, opacity: 0.38 }} />
              )}
              {tintSquare === square && (
                <span className="absolute inset-0" style={{ background: "rgba(214, 176, 122, 0.55)" }} />
              )}
              {selected === square && (
                <span className="absolute inset-0" style={{ background: highlights.selected, opacity: 0.34 }} />
              )}
              {checkSquare === square && (
                <span className="absolute inset-0" style={{ boxShadow: `inset 0 0 0 2px ${highlights.check}` }} />
              )}
              {dest && (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  {dest.capture ? (
                    <span
                      className="size-[78%] rounded-full"
                      style={{ boxShadow: `inset 0 0 0 3px ${ink}` }}
                    />
                  ) : (
                    <span className="size-[22%] rounded-full" style={{ background: highlights.legal, opacity: 0.55 }} />
                  )}
                </span>
              )}
              {showRank && (
                <span
                  className="pointer-events-none absolute top-0.5 left-1 text-[10px] leading-none"
                  style={{ color: ink }}
                >
                  {square[1]}
                </span>
              )}
              {showFile && (
                <span
                  className="pointer-events-none absolute right-1 bottom-0.5 text-[10px] leading-none"
                  style={{ color: ink }}
                >
                  {square[0]}
                </span>
              )}
            </button>
          )
        })}
      </div>
      {pieces.map((piece) => {
        const dragging = drag?.id === piece.id
        const at = point(piece.square, orientation)
        const movable = turn != null && piece.color === turn
        return (
          <div
            key={piece.id}
            className={dragging ? "absolute z-40 cursor-grabbing" : "lance-piece absolute z-10"}
            style={{
              width: "12.5%",
              height: "12.5%",
              left: dragging ? drag.x : `${at.x * 12.5}%`,
              top: dragging ? drag.y : `${at.y * 12.5}%`,
              pointerEvents: movable ? "auto" : "none",
              cursor: movable ? "grab" : undefined,
            }}
            onPointerDown={(event) => {
              if (!movable || event.button !== 0 || event.shiftKey) return
              event.preventDefault()
              event.currentTarget.setPointerCapture(event.pointerId)
              const rect = boardRef.current?.getBoundingClientRect()
              const size = rect ? rect.width / 8 : 0
              updateDrag({
                id: piece.id,
                from: piece.square,
                x: rect ? event.clientX - rect.left - size / 2 : 0,
                y: rect ? event.clientY - rect.top - size / 2 : 0,
                startX: event.clientX,
                startY: event.clientY,
                moved: false,
              })
              onDragStart(piece.square)
            }}
            onPointerMove={(event) => {
              const current = dragRef.current
              if (!current || current.id !== piece.id) return
              const rect = boardRef.current?.getBoundingClientRect()
              if (!rect) return
              const size = rect.width / 8
              updateDrag({
                ...current,
                x: event.clientX - rect.left - size / 2,
                y: event.clientY - rect.top - size / 2,
                moved: current.moved || Math.hypot(event.clientX - current.startX, event.clientY - current.startY) > 4,
              })
            }}
            onPointerUp={(event) => {
              const current = dragRef.current
              if (!current || current.id !== piece.id) return
              const rect = boardRef.current?.getBoundingClientRect()
              updateDrag(null)
              if (!current.moved) return
              if (!rect) return
              const target = pointToSquare(event.clientX, event.clientY, rect, orientation)
              if (target && target !== current.from) onDrop(current.from, target)
            }}
          >
            <div className="h-full w-full p-[3%]">
              <PieceArt type={piece.type} color={piece.color} pieceStyle={pieceStyle} />
            </div>
            <span className="sr-only">
              {piece.color === "w" ? "branco" : "preto"} {PIECE_NAME[piece.type]} em {piece.square}
            </span>
          </div>
        )
      })}
      {arrows.length > 0 && (
        <svg viewBox="0 0 8 8" className="pointer-events-none absolute inset-0 z-30 h-full w-full">
          {arrows.map((arrow) => (
            <ArrowShape key={`${arrow.from}${arrow.to}${arrow.color}`} arrow={arrow} orientation={orientation} />
          ))}
        </svg>
      )}
      {badge && <MoveBadge square={badge.square} grade={badge.grade} orientation={orientation} />}
    </div>
  )
}

function ArrowShape({ arrow, orientation }: { arrow: BoardArrow; orientation: Color }) {
  const from = center(arrow.from, orientation)
  const to = center(arrow.to, orientation)
  const bend = knightCorner(arrow.from, arrow.to)
  const corner = bend ? center(bend, orientation) : null
  return (
    <path d={arrowShape(from, corner, to)} fill={arrow.color} className="lance-arrow">
      <title>{arrow.label}</title>
    </path>
  )
}

function MoveBadge({ square, grade, orientation }: { square: string; grade: Grade; orientation: Color }) {
  const at = point(square, orientation)
  const color = GRADE_COLOR[grade]
  return (
    <span
      className="pointer-events-none absolute z-30 flex size-4 items-center justify-center rounded-full text-[8px] font-medium text-white"
      style={{
        left: `${(at.x + 0.62) * 12.5}%`,
        top: `${at.y * 12.5}%`,
        background: color,
      }}
    >
      {grade === "livro" ? <BookGlyph /> : gradeGlyph(grade)}
    </span>
  )
}

function BookGlyph() {
  return (
    <svg viewBox="0 0 12 12" className="size-2.5" aria-hidden>
      <path
        d="M1.6 2.2h3.4c.5 0 1 .2 1.2.7.2-.5.7-.7 1.2-.7h3V9.6H7.4c-.4 0-.8.2-1.2.5-.4-.3-.8-.5-1.2-.5H1.6V2.2z"
        fill="currentColor"
      />
    </svg>
  )
}

function inkOn(hex: string): string {
  const n = Number.parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return luminance > 0.55 ? "rgba(28, 28, 28, 0.5)" : "rgba(244, 241, 234, 0.62)"
}

function isLight(square: string): boolean {
  const file = square.charCodeAt(0) - 97
  const rank = Number(square[1]) - 1
  return (file + rank) % 2 === 1
}

function point(square: string, orientation: Color): { x: number; y: number } {
  const file = square.charCodeAt(0) - 97
  const rank = Number(square[1]) - 1
  if (orientation === "w") return { x: file, y: 7 - rank }
  return { x: 7 - file, y: rank }
}

function center(square: string, orientation: Color): { x: number; y: number } {
  const at = point(square, orientation)
  return { x: at.x + 0.5, y: at.y + 0.5 }
}

function pointToSquare(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  orientation: Color,
): string | null {
  const size = rect.width / 8
  const x = Math.floor((clientX - rect.left) / size)
  const y = Math.floor((clientY - rect.top) / size)
  if (x < 0 || x > 7 || y < 0 || y > 7) return null
  const file = orientation === "w" ? x : 7 - x
  const rank = orientation === "w" ? 7 - y : y
  return "abcdefgh"[file] + String(rank + 1)
}
