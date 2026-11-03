import type { PieceStyle } from "@/lib/look"

type Paint = {
  fill: string
  stroke: string
  mark: string
  width: number
}

const join = {
  strokeLinejoin: "round" as const,
  strokeLinecap: "round" as const,
}

export function PieceArt({
  type,
  color,
  pieceStyle = "classico",
}: {
  type: string
  color: "w" | "b"
  pieceStyle?: PieceStyle
}) {
  const body = color === "w" ? "#f7f4ee" : "#1a1a1a"
  const edge = color === "w" ? "#1c1c1c" : "#f3efe6"
  const paints = paintsFor(pieceStyle, body, edge)

  return (
    <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden>
      {paints.map((paint) => (
        <g key={paint.width} fill={paint.fill} stroke={paint.stroke} strokeWidth={paint.width} {...join}>
          {type === "p" && <Pawn />}
          {type === "r" && <Rook />}
          {type === "n" && <Knight paint={paint} />}
          {type === "b" && <Bishop paint={paint} />}
          {type === "q" && <Queen paint={paint} />}
          {type === "k" && <King />}
        </g>
      ))}
    </svg>
  )
}

function paintsFor(style: PieceStyle, body: string, edge: string): Paint[] {
  if (style === "cheio") return [{ fill: body, stroke: body, mark: edge, width: 0.8 }]
  if (style === "traco") {
    return [
      { fill: "none", stroke: edge, mark: edge, width: 2.7 },
      { fill: "none", stroke: body, mark: body, width: 1.15 },
    ]
  }
  return [{ fill: body, stroke: edge, mark: edge, width: 1.35 }]
}

function Pawn() {
  return (
    <>
      <circle cx="20" cy="12.5" r="5" />
      <path d="M16.2 19.2h7.6l2.4 11.2H13.8z" />
      <path d="M12 32.2h16v3.2H12z" />
    </>
  )
}

function Rook() {
  return (
    <>
      <path d="M11 13h4.4v3.4h2.2V13H22v3.4h2.4V13H29v6.4H11z" />
      <path d="M13 19.4h14V30H13z" />
      <path d="M11 31.4h18v3.2H11z" />
    </>
  )
}

function Knight({ paint }: { paint: Paint }) {
  return (
    <>
      <path d="M28.6 33.2H13.2l1.3-4.2c-4.2-1.4-7.2-5.6-6.2-10.1.8-3.6 4-6.2 7.6-6.8L13.4 8.2l6.2-2.4 1.6 4.8c4.6-.2 8.8 2.6 9.8 7.2 1 4.4-.8 8-3.6 10.2l1.2 5.2z" />
      <path d="M18.4 9.2 15.2 6.4" fill="none" stroke={paint.mark} />
      <circle cx="16.6" cy="13.6" r="1.05" fill={paint.mark} stroke="none" />
      <path d="M12 33.4h18.2v2.8H12z" />
    </>
  )
}

function Bishop({ paint }: { paint: Paint }) {
  return (
    <>
      <circle cx="20" cy="8.2" r="2.5" />
      <path d="M20 11.2c4.4 1.8 7 5.2 7 9 0 2.2-1.2 3.6-2.8 4.4V28H15.8v-3.4c-1.6-.8-2.8-2.2-2.8-4.4 0-3.8 2.6-7.2 7-9z" />
      <path d="M20 15.2v5.6" fill="none" stroke={paint.mark} />
      <path d="M14.2 29.2h11.6v2.2H14.2z" />
      <path d="M12 32.6h16v3.1H12z" />
    </>
  )
}

function Queen({ paint }: { paint: Paint }) {
  return (
    <>
      <path d="M7.6 16.4 11 7.6l3.6 7.2L18 6.2 20 4.2 22 6.2l3.4 8.6L29 7.6l3.4 8.8-2.2 13.2H9.8z" />
      {paint.fill === "none" ? null : (
        <>
          <circle cx="11" cy="7.2" r="1.15" />
          <circle cx="18" cy="5.6" r="1.15" />
          <circle cx="20" cy="3.8" r="1.2" />
          <circle cx="22" cy="5.6" r="1.15" />
          <circle cx="29" cy="7.2" r="1.15" />
        </>
      )}
      <path d="M12 30.6h16v2H12z" />
      <path d="M10.2 33.2h19.6v3H10.2z" />
    </>
  )
}

function King() {
  return (
    <>
      <path d="M18.3 3.4h3.4V7h3.6v3.2h-3.6v3.6h-3.4v-3.6h-3.6V7h3.6z" />
      <path d="M14.6 16.2h10.8c.8 3.6 2 7.4 2.8 11.6H11.8c.8-4.2 2-8 2.8-11.6z" />
      <path d="M12.2 29.2h15.6v2.2H12.2z" />
      <path d="M10.4 32.4h19.2v3.2H10.4z" />
    </>
  )
}
