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
  [34, 36, 40, 255],
  [48, 51, 56, 255],
  [64, 67, 74, 255],
]

type Shark = {
  y: number
  speed: number
  scale: number
  phase: number
  dir: 1 | -1
}

const SHARKS: Shark[] = [
  { y: 0.16, speed: 0.018, scale: 5.2, phase: 0.15, dir: 1 },
  { y: 0.78, speed: 0.014, scale: 4.2, phase: 0.62, dir: -1 },
  { y: 0.42, speed: 0.011, scale: 3.4, phase: 1.05, dir: 1 },
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
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = "#000"
      ctx.fillRect(0, 0, w, h)
      for (const shark of SHARKS) {
        const span = w + shark.scale * 8
        const travel = ((t * shark.speed * w + shark.phase * span) % span + span) % span
        const x = shark.dir === 1 ? travel - shark.scale * 4 : w - (travel - shark.scale * 4)
        const bob = reduced ? 0 : Math.sin(t * 0.7 + shark.phase * 6) * shark.scale * 0.35
        drawShark(ctx, x, shark.y * h + bob, shark.scale, shark.dir, reduced ? 0 : t + shark.phase)
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
            const level = Math.floor((v + jitter * 0.55) * (TONES.length - 1) + 0.5)
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

function drawShark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  dir: 1 | -1,
  t: number,
) {
  const wag = Math.sin(t * 2.2) * 0.35
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(dir, 1)
  ctx.fillStyle = "#fff"
  ctx.beginPath()
  ctx.ellipse(0, 0, s * 1.7, s * 0.46, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(s * 1.35, -s * 0.16)
  ctx.quadraticCurveTo(s * 2.35, -s * 0.05, s * 2.15, s * 0.02)
  ctx.quadraticCurveTo(s * 2.2, s * 0.18, s * 1.3, s * 0.2)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(-s * 0.15, -s * 0.38)
  ctx.lineTo(s * 0.45, -s * 0.28)
  ctx.lineTo(s * 0.05, -s * 1.15)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(s * 0.15, s * 0.28)
  ctx.lineTo(s * 0.7, s * 0.32)
  ctx.lineTo(s * 0.2, s * 0.85)
  ctx.closePath()
  ctx.fill()
  ctx.save()
  ctx.translate(-s * 1.45, 0)
  ctx.rotate(wag)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(-s * 0.95, -s * 0.72)
  ctx.lineTo(-s * 0.45, 0)
  ctx.lineTo(-s * 0.95, s * 0.72)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
  ctx.globalCompositeOperation = "destination-out"
  ctx.beginPath()
  ctx.arc(s * 1.15, -s * 0.08, Math.max(0.6, s * 0.12), 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}
