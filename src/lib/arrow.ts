export type Pt = { x: number; y: number }

export function isKnightLeap(from: string, to: string): boolean {
  const file = Math.abs(from.charCodeAt(0) - to.charCodeAt(0))
  const rank = Math.abs(Number(from[1]) - Number(to[1]))
  return (file === 1 && rank === 2) || (file === 2 && rank === 1)
}

export function knightCorner(from: string, to: string): string | null {
  if (!isKnightLeap(from, to)) return null
  const fileFrom = from.charCodeAt(0)
  const fileTo = to.charCodeAt(0)
  const rankFrom = Number(from[1])
  const rankTo = Number(to[1])
  const file = fileTo - fileFrom
  if (Math.abs(file) === 2) return String.fromCharCode(fileTo) + String(rankFrom)
  return String.fromCharCode(fileFrom) + String(rankTo)
}

export function arrowStroke(from: Pt, corner: Pt | null, to: Pt): { d: string; head: string } {
  const lastFrom = corner ?? from
  const dx = to.x - lastFrom.x
  const dy = to.y - lastFrom.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const headLen = Math.min(0.46, len * 0.45)
  const headHalf = headLen * 0.42
  const tip = { x: to.x - ux * 0.06, y: to.y - uy * 0.06 }
  const base = { x: tip.x - ux * headLen, y: tip.y - uy * headLen }
  const px = -uy
  const py = ux
  const left = { x: base.x + px * headHalf, y: base.y + py * headHalf }
  const right = { x: base.x - px * headHalf, y: base.y - py * headHalf }
  const lineEnd = { x: base.x + ux * 0.08, y: base.y + uy * 0.08 }

  let d: string
  if (!corner) {
    const span = Math.hypot(to.x - from.x, to.y - from.y) || 1
    const sx = (to.x - from.x) / span
    const sy = (to.y - from.y) / span
    const start = { x: from.x + sx * 0.22, y: from.y + sy * 0.22 }
    d = `M ${n(start.x)} ${n(start.y)} L ${n(lineEnd.x)} ${n(lineEnd.y)}`
  } else {
    const leg = Math.hypot(corner.x - from.x, corner.y - from.y) || 1
    const sx = (corner.x - from.x) / leg
    const sy = (corner.y - from.y) / leg
    const start = { x: from.x + sx * 0.18, y: from.y + sy * 0.18 }
    const radius = Math.min(0.36, leg * 0.4, len * 0.4)
    const before = {
      x: corner.x - sx * radius,
      y: corner.y - sy * radius,
    }
    const after = {
      x: corner.x + ux * radius,
      y: corner.y + uy * radius,
    }
    d = `M ${n(start.x)} ${n(start.y)} L ${n(before.x)} ${n(before.y)} Q ${n(corner.x)} ${n(corner.y)} ${n(after.x)} ${n(after.y)} L ${n(lineEnd.x)} ${n(lineEnd.y)}`
  }

  return {
    d,
    head: `${n(tip.x)},${n(tip.y)} ${n(left.x)},${n(left.y)} ${n(right.x)},${n(right.y)}`,
  }
}

function n(value: number): string {
  return value.toFixed(3)
}
