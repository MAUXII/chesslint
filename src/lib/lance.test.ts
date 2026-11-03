import { describe, expect, it } from "vitest"

import { OPENING_LINES, buildBook, lookupBook } from "@/lib/book"
import { parseBestmove, parseInfo } from "@/lib/engine-parse"
import { placements, parseFen, replay } from "@/lib/game"
import { resolveHuman, plyOf } from "@/lib/human"
import { pickNatural, scoreNatural } from "@/lib/natural"
import { formatCp, sanPt } from "@/lib/notation"
import { reducer, initialState } from "@/lib/reducer"
import { fenBefore, loadSession } from "@/lib/session"

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

describe("livro", () => {
  it("aceita todas as linhas", () => {
    expect(() => buildBook(OPENING_LINES)).not.toThrow()
  })

  it("abre com e4 e responde e5", () => {
    expect(lookupBook(START)).toBe("e2e4")
    expect(lookupBook(replay(START, ["e4"]).fen())).toBe("e7e5")
  })

  it("não sugere a3", () => {
    expect(lookupBook(replay(START, ["a3"]).fen())).toBeNull()
  })
})

describe("lance natural", () => {
  it("prefere desenvolver quando a avaliação é parecida", () => {
    const picked = pickNatural([
      { uci: "d1h5", cp: 30, natural: scoreNatural(2, { piece: "q", color: "w", from: "d1", flags: "n" }) },
      { uci: "g1f3", cp: 20, natural: scoreNatural(2, { piece: "n", color: "w", from: "g1", flags: "n" }) },
    ])
    expect(picked.uci).toBe("g1f3")
    expect(picked.coincides).toBe(false)
  })

  it("fica com o melhor quando o outro sai da janela", () => {
    const picked = pickNatural([
      { uci: "d1h5", cp: 80, natural: -4 },
      { uci: "g1f3", cp: 20, natural: 4 },
    ])
    expect(picked.uci).toBe("d1h5")
    expect(picked.coincides).toBe(true)
  })

  it("usa o livro antes da busca", () => {
    const fen = START
    const human = resolveHuman(fen, null)
    expect(human).toEqual({ uci: "e2e4", coincides: null, fromBook: true })
  })

  it("conta os lances pela FEN", () => {
    expect(plyOf("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")).toBe(0)
    expect(plyOf("4k3/8/8/8/8/8/8/4K2R w - - 0 40")).toBe(78)
  })
})

describe("notação", () => {
  it("traduz as peças", () => {
    expect(sanPt("Nf3")).toBe("Cf3")
    expect(sanPt("Qh5+")).toBe("Dh5+")
    expect(sanPt("Rfe1")).toBe("Tfe1")
    expect(sanPt("Bb5")).toBe("Bb5")
    expect(sanPt("O-O")).toBe("O-O")
    expect(sanPt("exd5")).toBe("exd5")
    expect(formatCp(40)).toBe("+0,4")
    expect(formatCp(-10)).toBe("-0,1")
  })

  it("lê a linha do motor", () => {
    const info = parseInfo(
      "info depth 12 seldepth 14 multipv 2 score cp -15 nodes 20 pv e7e5 g1f3",
    )
    expect(info?.multipv).toBe(2)
    expect(info?.cp).toBe(-15)
    expect(info?.pv).toEqual(["e7e5", "g1f3"])
    expect(parseBestmove("bestmove e2e4 ponder e7e5")).toBe("e2e4")
    expect(parseBestmove("bestmove (none)")).toBeNull()
  })
})

describe("tabuleiro", () => {
  it("move a torre no roque", () => {
    const sans = ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O"]
    const pieces = placements(START, sans)
    expect(pieces.find((piece) => piece.id.startsWith("wk"))?.square).toBe("g1")
    expect(pieces.find((piece) => piece.type === "r" && piece.color === "w" && piece.square === "f1")).toBeTruthy()
  })

  it("recusa uma FEN inválida", () => {
    expect(parseFen("não")).toBeNull()
    expect(parseFen("4k3/8/8/8/8/8/8/4K2R w - - 0 40")).toBeTruthy()
  })
})

describe("partida", () => {
  it("desfaz o lance e a resposta", () => {
    let state = reducer(initialState, { type: "hydrate", session: initialState.session })
    state = reducer(state, { type: "user-move", san: "e4" })
    state = reducer(state, { type: "engine-move", uci: "e7e5" })
    state = reducer(state, { type: "undo" })
    expect(state.session.sans).toEqual([])
  })

  it("no estudo desfaz um lance", () => {
    let state = reducer(initialState, { type: "set-mode", mode: "estudo" })
    state = reducer(state, { type: "user-move", san: "e4" })
    state = reducer(state, { type: "user-move", san: "e5" })
    state = reducer(state, { type: "undo" })
    expect(state.session.sans).toEqual(["e4"])
  })

  it("abre a configuração e guarda o visual sem apagar lances", () => {
    const loaded = loadSession(JSON.stringify({ startFen: START, sans: ["e4"], boardTheme: "neon" }))
    expect(loaded?.tab).toBe("configurar")
    expect(loaded?.boardTheme).toBe("pedra")
    expect(loaded?.pieceStyle).toBe("nitido")
    expect(loaded?.sans).toEqual(["e4"])

    let state = reducer(initialState, { type: "user-move", san: "e4" })
    state = reducer(state, { type: "set-board", board: "verde" })
    state = reducer(state, { type: "set-pieces", pieces: "celta" })
    state = reducer(state, { type: "set-tab", tab: "jogo" })
    expect(state.session.sans).toEqual(["e4"])
    expect(state.session.boardTheme).toBe("verde")
    expect(state.session.pieceStyle).toBe("celta")
    expect(state.session.tab).toBe("jogo")
  })

  it("guarda a nota na FEN do lance", () => {
    let state = reducer(initialState, { type: "user-move", san: "e4" })
    const fen = fenBefore(state.session.startFen, state.session.sans, 1)
    state = reducer(state, {
      type: "save-note",
      note: { ply: 1, san: "e4", fen, tag: "abertura", text: "aprendi a sair do centro" },
    })
    expect(state.session.notes[0]?.fen).toBe(fen)
    expect(state.session.notes[0]?.text).toBe("aprendi a sair do centro")
  })
})
