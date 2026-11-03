export type Pt = { x: number; y: number }

const BODY = 0.18
const HEAD_LEN = 0.58
const HEAD = 0.32

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

export function arrowShape(from: Pt, corner: Pt | null, to: Pt): string {
  if (!corner) return straight(from, to)
  return bent(from, corner, to)
}

function straight(from: Pt, to: Pt): string {
  const u = unit(to.x - from.x, to.y - from.y)
  const p = perp(u)
  const start = add(from, u, 0.22)
  const tip = add(to, u, -0.05)
  const span = Math.hypot(tip.x - start.x, tip.y - start.y) || 1
  const headLen = Math.min(HEAD_LEN, span * 0.46)
  const base = add(tip, u, -headLen)
  return closed([
    shift(start, p, BODY),
    shift(base, p, BODY),
    shift(base, p, HEAD),
    tip,
    shift(base, p, -HEAD),
    shift(base, p, -BODY),
    shift(start, p, -BODY),
  ])
}

function bent(from: Pt, corner: Pt, to: Pt): string {
  const u1 = unit(corner.x - from.x, corner.y - from.y)
  const u2 = unit(to.x - corner.x, to.y - corner.y)
  const p1 = perp(u1)
  const p2 = perp(u2)
  const radius = 0.32
  const start = add(from, u1, 0.18)
  const before = add(corner, u1, -radius)
  const after = add(corner, u2, radius)
  const tip = add(to, u2, -0.05)
  const leg = Math.hypot(tip.x - after.x, tip.y - after.y) || 1
  const headLen = Math.min(HEAD_LEN, leg * 0.46)
  const base = add(tip, u2, -headLen)
  const controlWide = intersect(shift(before, p1, BODY), u1, shift(after, p2, BODY), u2)
  const controlNarrow = intersect(shift(before, p1, -BODY), u1, shift(after, p2, -BODY), u2)
  const wide = [
    shift(start, p1, BODY),
    shift(before, p1, BODY),
    controlWide,
    shift(after, p2, BODY),
    shift(base, p2, BODY),
  ]
  const narrow = [
    shift(base, p2, -BODY),
    shift(after, p2, -BODY),
    controlNarrow,
    shift(before, p1, -BODY),
    shift(start, p1, -BODY),
  ]
  const head = [shift(base, p2, HEAD), tip, shift(base, p2, -HEAD)]
  return contour(wide, head, narrow)
}

function contour(wide: Pt[], head: Pt[], narrow: Pt[]): string {
  const parts = [`M ${n(wide[0].x)} ${n(wide[0].y)}`]
  parts.push(`L ${n(wide[1].x)} ${n(wide[1].y)}`)
  parts.push(`Q ${n(wide[2].x)} ${n(wide[2].y)} ${n(wide[3].x)} ${n(wide[3].y)}`)
  parts.push(`L ${n(wide[4].x)} ${n(wide[4].y)}`)
  for (const point of head) parts.push(`L ${n(point.x)} ${n(point.y)}`)
  parts.push(`L ${n(narrow[0].x)} ${n(narrow[0].y)}`)
  parts.push(`L ${n(narrow[1].x)} ${n(narrow[1].y)}`)
  parts.push(`Q ${n(narrow[2].x)} ${n(narrow[2].y)} ${n(narrow[3].x)} ${n(narrow[3].y)}`)
  parts.push(`L ${n(narrow[4].x)} ${n(narrow[4].y)}`)
  parts.push("Z")
  return parts.join(" ")
}

function closed(points: Pt[]): string {
  return `${points.map((point, index) => `${index === 0 ? "M" : "L"} ${n(point.x)} ${n(point.y)}`).join(" ")} Z`
}

function unit(dx: number, dy: number): Pt {
  const len = Math.hypot(dx, dy) || 1
  return { x: dx / len, y: dy / len }
}

function perp(u: Pt): Pt {
  return { x: -u.y, y: u.x }
}

function add(point: Pt, u: Pt, distance: number): Pt {
  return { x: point.x + u.x * distance, y: point.y + u.y * distance }
}

function shift(point: Pt, p: Pt, distance: number): Pt {
  return { x: point.x + p.x * distance, y: point.y + p.y * distance }
}

function intersect(origin: Pt, direction: Pt, other: Pt, otherDirection: Pt): Pt {
  const det = direction.x * otherDirection.y - direction.y * otherDirection.x
  if (Math.abs(det) < 1e-6) return { x: (origin.x + other.x) / 2, y: (origin.y + other.y) / 2 }
  const t = ((other.x - origin.x) * otherDirection.y - (other.y - origin.y) * otherDirection.x) / det
  return { x: origin.x + direction.x * t, y: origin.y + direction.y * t }
}

function n(value: number): string {
  return value.toFixed(3)
}
