"use client"

import { useEffect, useRef } from "react"

import { OceanEngine } from "@/vendor/ascii-sharks/engine"
import type { SharkSpec } from "@/vendor/ascii-sharks/world"

const SHARKS: SharkSpec[] = [
  { kind: "classic", size: 1 },
  { kind: "hammerhead", size: 0.84 },
  { kind: "greathammer", size: 0.7 },
  { kind: "classic", size: 0.58 },
]

export function AsciiSea() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const engine = new OceanEngine(canvas, SHARKS)
    return () => engine.destroy()
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[-1] h-dvh w-full"
      style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" }}
    />
  )
}
