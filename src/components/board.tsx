"use client"

import { useRef, useState } from "react"

import { PieceArt } from "@/components/pieces"
import type { Placement } from "@/lib/game"
import { BOARD_THEMES, type BoardTheme, type PieceStyle } from "@/lib/look"
import type { Color } from "@/lib/session"

const PIECE_NAME: Record<string, string> = {
  p: "peão",
  n: "cavalo",
  b: "bispo",
  r: "torre",
  q: "dama",
  k: "rei",
}

type Arrow = {
  from: string
  to: string
  dashed: boolean
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
  arrow,
  turn,
  theme,
  pieceStyle,
  onSquare,
  onDragStart,
  onDrop,
}: {
  pieces: Placement[]
  orientation: Color
  lastMove: { from: string; to: string } | null
  selected: string | null
  destinations: { to: string; capture: boolean }[]
  checkSquare: string | null
  arrow: Arrow | null
  turn: Color | null
  theme: BoardTheme
  pieceStyle: PieceStyle
  onSquare: (square: string) => void
  onDragStart: (square: string) => void
  onDrop: (from: string, to: string) => void
}) {
  const boardRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<Drag | null>(null)
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
  const colors = BOARD_THEMES[theme]

  return (
    <div
      ref={boardRef}
      className="relative aspect-square w-full touch-none select-none"
      style={{ borderRadius: 6, boxShadow: "0 0 0 1px rgba(255,255,255,0.08)" }}
    >
      <div className="grid h-full w-full grid-cols-8 grid-rows-8 overflow-hidden" style={{ borderRadius: 6 }}>
        {ordered.map((square) => {
          const light = isLight(square)
          const tone = light ? colors.light : colors.dark
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
              {marked && <span className="absolute inset-0" style={{ background: "rgba(72, 54, 24, 0.18)" }} />}
              {selected === square && (
                <span className="absolute inset-0" style={{ background: "rgba(255, 255, 255, 0.22)" }} />
              )}
              {checkSquare === square && (
                <span className="absolute inset-0" style={{ boxShadow: "inset 0 0 0 2px rgba(163, 60, 50, 0.85)" }} />
              )}
              {dest && (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  {dest.capture ? (
                    <span
                      className="size-[78%] rounded-full"
                      style={{ boxShadow: `inset 0 0 0 3px ${ink}` }}
                    />
                  ) : (
                    <span className="size-[22%] rounded-full" style={{ background: ink }} />
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
      {arrow && <ArrowLayer arrow={arrow} orientation={orientation} />}
      {pieces.map((piece) => {
        const dragging = drag?.id === piece.id
        const at = point(piece.square, orientation)
        const movable = turn != null && piece.color === turn
        return (
          <div
            key={piece.id}
            className={dragging ? "absolute z-20 cursor-grabbing" : "lance-piece absolute z-10"}
            style={{
              width: "12.5%",
              height: "12.5%",
              left: dragging ? drag.x : `${at.x * 12.5}%`,
              top: dragging ? drag.y : `${at.y * 12.5}%`,
              pointerEvents: movable ? "auto" : "none",
              cursor: movable ? "grab" : undefined,
            }}
            onPointerDown={(event) => {
              if (!movable || event.button !== 0) return
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
    </div>
  )
}

function ArrowLayer({ arrow, orientation }: { arrow: Arrow; orientation: Color }) {
  const from = center(arrow.from, orientation)
  const to = center(arrow.to, orientation)
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  const end = { x: to.x - (dx / len) * 0.28, y: to.y - (dy / len) * 0.28 }
  const angle = Math.atan2(dy, dx)
  const head = 0.32
  const left = {
    x: end.x - Math.cos(angle) * head + Math.cos(angle + Math.PI / 2) * head * 0.55,
    y: end.y - Math.sin(angle) * head + Math.sin(angle + Math.PI / 2) * head * 0.55,
  }
  const right = {
    x: end.x - Math.cos(angle) * head - Math.cos(angle + Math.PI / 2) * head * 0.55,
    y: end.y - Math.sin(angle) * head - Math.sin(angle + Math.PI / 2) * head * 0.55,
  }
  const line = `M ${from.x} ${from.y} L ${end.x} ${end.y}`
  return (
    <svg viewBox="0 0 8 8" className="pointer-events-none absolute inset-0 h-full w-full">
      <path d={line} fill="none" stroke="#f7f4ee" strokeWidth="0.16" strokeLinecap="round" />
      <path
        d={line}
        fill="none"
        stroke="#2a2622"
        strokeWidth="0.075"
        strokeLinecap="round"
        strokeDasharray={arrow.dashed ? "0.18 0.12" : undefined}
      />
      <polygon points={`${end.x},${end.y} ${left.x},${left.y} ${right.x},${right.y}`} fill="#2a2622" stroke="#f7f4ee" strokeWidth="0.04" />
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
