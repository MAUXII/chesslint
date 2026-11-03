"use client"

import { useEffect, useRef } from "react"

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]

const TONES: Array<[number, number, number, number]> = [
  [21, 22, 24, 255],
  [40, 42, 46, 255],
  [62, 65, 72, 255],
  [92, 96, 104, 255],
]

type Hammer = {
  x: number
  y: number
  speed: number
  scale: number
  angle: number
  sway: number
}

const HAMMERS: Hammer[] = [
  { x: -0.08, y: 0.12, speed: 0.016, scale: 16, angle: 0.2, sway: 0.2 },
  { x: 0.78, y: 0.08, speed: 0.011, scale: 12, angle: 2.7, sway: 0.16 },
  { x: 0.08, y: 0.82, speed: 0.014, scale: 18, angle: -0.4, sway: 0.14 },
  { x: 0.92, y: 0.7, speed: 0.01, scale: 11, angle: 3.3, sway: 0.24 },
  { x: 0.42, y: 0.5, speed: 0.008, scale: 8, angle: 1.15, sway: 0.18 },
  { x: -0.16, y: 0.46, speed: 0.013, scale: 14, angle: 0.6, sway: 0.12 },
  { x: 0.64, y: 0.92, speed: 0.012, scale: 13, angle: -1.5, sway: 0.22 },
  { x: 0.22, y: 0.22, speed: 0.009, scale: 7, angle: 2.2, sway: 0.28 },
  { x: 1.05, y: 0.38, speed: 0.015, scale: 15, angle: 3.7, sway: 0.1 },
  { x: 0.5, y: -0.08, speed: 0.012, scale: 12, angle: 1.6, sway: 0.18 },
  { x: 0.3, y: 1.02, speed: 0.01, scale: 10, angle: -0.9, sway: 0.2 },
  { x: 1.08, y: 0.18, speed: 0.014, scale: 9, angle: 2.9, sway: 0.15 },
]

export function DitherField() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const out = canvas.getContext("2d")
    const src = document.createElement("canvas")
    const ctx = src.getContext("2d", { willReadFrequently: true })
    if (!out || !ctx) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let raf = 0
    let running = true
    const start = performance.now()

    const layout = () => {
      const step = window.innerWidth < 640 ? 4 : 3
      const w = Math.max(8, Math.ceil(window.innerWidth / step))
      const h = Math.max(8, Math.ceil(window.innerHeight / step))
      canvas.width = w
      canvas.height = h
      src.width = w
      src.height = h
    }

    const render = (now: number) => {
      const w = src.width
      const h = src.height
      const t = reduced ? 0 : (now - start) / 1000
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.globalCompositeOperation = "source-over"
      ctx.fillStyle = "#000"
      ctx.fillRect(0, 0, w, h)
      for (const shark of HAMMERS) {
        const travel = t * shark.speed
        const angle = shark.angle + Math.sin(t * shark.sway) * 0.18
        const x = wrap(shark.x + Math.cos(shark.angle) * travel, 1.35) 
        const y = wrap(shark.y + Math.sin(shark.angle) * travel * 0.72, 1.25)
        drawHammer(ctx, x * w, y * h, shark.scale, angle)
      }

      const pixels = ctx.getImageData(0, 0, w, h)
      const data = pixels.data
      for (let y = 0; y < h; y += 1) {
        for (let x = 0; x < w; x += 1) {
          const i = (y * w + x) * 4
          const v = data[i] / 255
          let tone = 0
          if (v > 0.08) {
            const jitter = BAYER[y & 3][x & 3] / 16 - 0.5
            const level = Math.floor((v + jitter * 0.65) * (TONES.length - 1) + 0.5)
            tone = Math.max(1, Math.min(TONES.length - 1, level))
          }
          const [r, g, b, a] = TONES[tone]
          data[i] = r
          data[i + 1] = g
          data[i + 2] = b
          data[i + 3] = a
        }
      }
      out.putImageData(pixels, 0, 0)
    }

    const loop = (now: number) => {
      if (!running) return
      render(now)
      if (!reduced) raf = window.requestAnimationFrame(loop)
    }

    layout()
    raf = window.requestAnimationFrame(loop)
    const onResize = () => {
      layout()
      if (reduced) render(performance.now())
    }
    window.addEventListener("resize", onResize)
    return () => {
      running = false
      window.cancelAnimationFrame(raf)
      window.removeEventListener("resize", onResize)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[-1] h-full w-full [image-rendering:pixelated]"
    />
  )
}

function wrap(value: number, span: number) {
  const mod = ((value % span) + span) % span
  return mod - span * 0.15
}

function drawHammer(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, angle: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.fillStyle = "#fff"
  ctx.beginPath()
  ctx.ellipse(s * 0.92, 0, s * 0.2, s * 1.28, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(-s * 0.12, 0, s * 0.95, s * 0.26, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(s * 0.12, s * 0.38, s * 0.32, s * 0.12, -0.45, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(s * 0.12, -s * 0.38, s * 0.32, s * 0.12, 0.45, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(-s * 0.95, 0)
  ctx.lineTo(-s * 1.55, -s * 0.06)
  ctx.lineTo(-s * 1.95, -s * 0.38)
  ctx.lineTo(-s * 1.45, 0)
  ctx.lineTo(-s * 1.95, s * 0.38)
  ctx.lineTo(-s * 1.55, s * 0.06)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}
