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
} as const

export const PIECE_STYLES = {
  classico: {
    label: "Clássico",
    hint: "Silhueta com um fio, para a peça ler nas duas casas.",
  },
  cheio: {
    label: "Cheio",
    hint: "A mesma forma, só a massa da peça.",
  },
  traco: {
    label: "Traço",
    hint: "Só o contorno, mais leve.",
  },
} as const

export type BoardTheme = keyof typeof BOARD_THEMES
export type PieceStyle = keyof typeof PIECE_STYLES
export type Tab = "jogo" | "configurar"

export function isBoardTheme(value: unknown): value is BoardTheme {
  return typeof value === "string" && value in BOARD_THEMES
}

export function isPieceStyle(value: unknown): value is PieceStyle {
  return typeof value === "string" && value in PIECE_STYLES
}
