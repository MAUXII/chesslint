import Image from "next/image"

import type { PieceStyle } from "@/lib/look"

const SET_DIR: Record<PieceStyle, string> = {
  classico: "classico",
  celta: "celta",
  nitido: "nitido",
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
  const file = `${color}${type.toUpperCase()}`
  return (
    <span className="relative block h-full w-full">
      <Image
        src={`/pieces/${SET_DIR[pieceStyle]}/${file}.svg`}
        alt=""
        fill
        unoptimized
        draggable={false}
        className="pointer-events-none object-contain select-none"
      />
    </span>
  )
}
