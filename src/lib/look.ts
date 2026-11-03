export const BOARD_THEMES = {
  pedra: {
    label: "Pedra",
    hint: "Pedra clara e pedra escura, como um tabuleiro em cima da mesa.",
    light: "#e4e0d8",
    dark: "#6f6a62",
  },
  madeira: {
    label: "Madeira",
    hint: "Claro de bordo e escuro de nogueira.",
    light: "#e7d3b0",
    dark: "#8a5a3c",
  },
  verde: {
    label: "Verde",
    hint: "O verde baixo de um tabuleiro de clube.",
    light: "#e4ead6",
    dark: "#5c6a50",
  },
  tinta: {
    label: "Tinta",
    hint: "Papel e tinta, o contraste mais alto.",
    light: "#f3f0e8",
    dark: "#2a2a2c",
  },
  creme: {
    label: "Creme",
    hint: "Verde e marfim, o contraste clássico de clube.",
    light: "#f0d9b5",
    dark: "#6b8f71",
  },
  azul: {
    label: "Azul",
    hint: "Azul e marfim, sem textura.",
    light: "#e8e4d8",
    dark: "#4a6fa5",
  },
  personalizado: {
    label: "Personalizado",
    hint: "As cores que você escolheu para as casas.",
    light: "#f0d9b5",
    dark: "#6b8f71",
  },
} as const

export const PIECE_STYLES = {
  classico: {
    label: "Diagrama",
    hint: "O conjunto clássico de código aberto, de perfil limpo.",
  },
  celta: {
    label: "Entalhe",
    hint: "O desenho celta, mais tradicional.",
  },
  nitido: {
    label: "Contorno",
    hint: "O contorno grosso do Chessnut.",
  },
} as const

export type CustomColors = { light: string; dark: string }

export type Highlights = {
  selected: string
  last: string
  legal: string
  check: string
}

export const DEFAULT_HIGHLIGHTS: Highlights = {
  selected: "#d6d3cb",
  last: "#c4a574",
  legal: "#1c1c1c",
  check: "#a33c32",
}

export function isHex(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)
}

export type BoardTheme = keyof typeof BOARD_THEMES
export type PieceStyle = keyof typeof PIECE_STYLES
export type Tab = "jogo" | "configurar"

export function isBoardTheme(value: unknown): value is BoardTheme {
  return typeof value === "string" && value in BOARD_THEMES
}

export function isPieceStyle(value: unknown): value is PieceStyle {
  return typeof value === "string" && value in PIECE_STYLES
}
