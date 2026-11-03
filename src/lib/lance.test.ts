import { describe, expect, it } from "vitest"

import { arrowStroke, isKnightLeap, knightCorner } from "@/lib/arrow"
import { OPENING_LINES, buildBook, lookupBook, openingTitle } from "@/lib/book"
import { DRILLS, drillProgress } from "@/lib/drills"
import { centipawnLoss, parseBestmove, parseInfo } from "@/lib/engine-parse"
import { placements, parseFen, replay } from "@/lib/game"
import { resolveHuman, plyOf } from "@/lib/human"
import { pickNatural, scoreNatural } from "@/lib/natural"
import { formatCp, sanPt } from "@/lib/notation"
import { reducer, initialState } from "@/lib/reducer"
import { evalSeries, explainLine, formatReviewCp, gradeLine, gradeOf, isLastBook, isSacrifice } from "@/lib/review"
import { isOpenWater } from "@/lib/sea"
import { dropLine, fenBefore, loadSession } from "@/lib/session"

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

describe("seta", () => {
  it("faz o L no cavalo, com a perna longa primeiro", () => {
    expect(isKnightLeap("g1", "f3")).toBe(true)
    expect(knightCorner("g1", "f3")).toBe("g3")
    expect(knightCorner("b1", "c3")).toBe("b3")
    expect(knightCorner("b1", "d2")).toBe("d1")
    expect(knightCorner("e2", "e4")).toBeNull()
    const bend = arrowStroke({ x: 6.5, y: 7.5 }, { x: 6.5, y: 5.5 }, { x: 5.5, y: 5.5 })
    expect(bend.d.includes("Q")).toBe(true)
    const straight = arrowStroke({ x: 4.5, y: 6.5 }, null, { x: 4.5, y: 4.5 })
    expect(straight.d.includes("Q")).toBe(false)
    expect(straight.head.split(" ").length).toBe(3)
  })
})

describe("água", () => {
  function node(blocked: boolean) {
    return {
      closest(selector: string) {
        if (blocked && selector.includes("data-sea-block")) return this
        return null
      },
    }
  }

  it("abre onda no fundo e ignora tabuleiro e coluna", () => {
    expect(isOpenWater(node(false) as unknown as EventTarget)).toBe(true)
    expect(isOpenWater(node(true) as unknown as EventTarget)).toBe(false)
    expect(isOpenWater(null)).toBe(false)
  })
})

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

  it("nomeia a linha mais longa que cabe", () => {
    expect(openingTitle(["e4", "e5", "Nf3", "Nc6", "Bb5", "a6"])).toBe("Ruy López")
    expect(openingTitle(["e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6"])).toBe("Defesa Berlim")
    expect(openingTitle(["e4", "c5"])).toBe("Siciliana")
    expect(openingTitle(["d4", "Nf6", "c4", "g6", "Nc3", "d5"])).toBe("Defesa Grünfeld")
    expect(openingTitle(["a3"])).toBeNull()
    expect(openingTitle([])).toBeNull()
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

describe("revisão", () => {
  const analysis = {
    fen: START,
    best: "e2e4",
    lines: [
      { multipv: 1, cp: 40, mate: null, pv: ["e2e4", "e7e5"] },
      { multipv: 2, cp: 10, mate: null, pv: ["d2d4", "d7d5"] },
    ],
  }

  it("guarda zero quando o lance é o do motor", () => {
    let state = reducer(initialState, { type: "analysis", analysis })
    state = reducer(state, { type: "user-move", san: "e4" })
    expect(state.session.marks[0]).toEqual({
      ply: 1,
      matched: true,
      drop: 0,
      book: true,
      best: "e2e4",
      bestSan: "e4",
      sacrifice: false,
    })
    expect(gradeOf(state.session.marks[0])).toBe("livro")
    expect(state.session.evals[0]).toBe(40)
    expect(centipawnLoss(analysis, "e2e4")).toBe(0)
  })

  it("guarda a queda quando o lance está na linha", () => {
    let state = reducer(initialState, { type: "analysis", analysis })
    state = reducer(state, { type: "user-move", san: "d4" })
    expect(state.session.marks[0]).toEqual({
      ply: 1,
      matched: false,
      drop: 30,
      book: false,
      best: "e2e4",
      bestSan: "e4",
      sacrifice: false,
    })
    expect(gradeOf(state.session.marks[0])).toBe("imprecisao")
    expect(dropLine(state.session.marks, state.session.sans)).toBe(
      "A avaliação caiu mais no lance 1, d4, 0,3 peões.",
    )
  })

  it("deixa a queda em branco quando o lance não entrou na busca", () => {
    let state = reducer(initialState, { type: "analysis", analysis })
    state = reducer(state, { type: "user-move", san: "a3" })
    expect(state.session.marks[0]).toEqual({
      ply: 1,
      matched: false,
      drop: null,
      book: false,
      best: "e2e4",
      bestSan: "e4",
      sacrifice: false,
    })
    expect(gradeOf(state.session.marks[0])).toBeNull()
    expect(dropLine(state.session.marks, state.session.sans)).toBeNull()
  })

  it("lê uma marca antiga sem a queda", () => {
    const loaded = loadSession(JSON.stringify({ startFen: START, sans: ["e4"], marks: [{ ply: 1, matched: true }] }))
    expect(loaded?.marks[0]).toEqual({
      ply: 1,
      matched: true,
      drop: null,
      book: false,
      best: null,
      bestSan: null,
      sacrifice: false,
    })
    expect(loaded?.drillId).toBeNull()
  })
})

describe("classe do lance", () => {
  const base = { ply: 1, matched: false, drop: null, book: false, best: null, bestSan: null, sacrifice: false }

  it("separa livro, brilhante e vacilo", () => {
    expect(gradeOf({ ...base, book: true, matched: true, drop: 0 })).toBe("livro")
    expect(gradeOf({ ...base, sacrifice: true, matched: true, drop: 0 })).toBe("brilhante")
    expect(isSacrifice("b", "p")).toBe(true)
    expect(isSacrifice("n", "p")).toBe(false)
    expect(isSacrifice("q", "r")).toBe(true)
    expect(gradeOf({ ...base, drop: 10 })).toBe("excelente")
    expect(gradeOf({ ...base, drop: 50 })).toBe("imprecisao")
    expect(gradeOf({ ...base, drop: 120 })).toBe("erro")
    expect(gradeOf({ ...base, drop: 250 })).toBe("vacilo")
  })

  it("marca só o último lance que ainda está no livro", () => {
    const marks = [
      { ...base, ply: 1, book: true },
      { ...base, ply: 3, book: true },
      { ...base, ply: 5, book: false, drop: 40 },
    ]
    expect(isLastBook(marks, 1)).toBe(false)
    expect(isLastBook(marks, 3)).toBe(true)
    expect(isLastBook(marks, 5)).toBe(false)
    expect(gradeLine("c3", "livro", true)).toBe("c3 é o último lance de livro")
    expect(gradeLine("Nxc3", "melhor", false)).toBe("Cxc3 é o melhor")
    expect(gradeLine("Bxg6+", "brilhante", false)).toBe("Bxg6+ é brilhante")
    expect(explainLine("vacilo", "Nf3", false)).toBe("O motor preferia Cf3.")
    expect(formatReviewCp(83)).toBe("+0,83")
    expect(formatReviewCp(-33)).toBe("−0,33")
  })

  it("completa a avaliação do lance com a queda", () => {
    const marks = [{ ...base, ply: 1, drop: 80 }]
    expect(evalSeries([40], marks, 1, "w")).toEqual([40, -40])
    expect(evalSeries([40, null, -10], [{ ...base, ply: 1, drop: 0 }], 2, "w")).toEqual([40, 40, -10])
  })
})

describe("treino", () => {
  it("abre cada posição e aceita o lance", () => {
    for (const drill of DRILLS) {
      expect(parseFen(drill.fen)).toBe(drill.fen)
      for (const san of drill.solutions) {
        expect(replay(drill.fen, [san]).history()).toEqual([san])
      }
    }
    expect(drillProgress(DRILLS[0], [])).toBe("waiting")
    expect(drillProgress(DRILLS[0], ["Ra8#"])).toBe("solved")
    expect(drillProgress(DRILLS[0], ["h3"])).toBe("missed")
  })

  it("troca a tela para a posição e guarda a partida de antes", () => {
    let state = reducer(initialState, { type: "user-move", san: "e4" })
    state = reducer(state, { type: "start-drill", id: "mate-torre" })
    expect(state.session.sans).toEqual([])
    expect(state.session.drillId).toBe("mate-torre")
    expect(state.session.tab).toBe("jogo")
    expect(state.session.startFen).toBe(DRILLS[0].fen)
    expect(state.session.archive).toHaveLength(1)
    expect(state.session.archive[0]?.sans).toEqual(["e4"])
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
    expect(loaded?.pieceStyle).toBe("classico")
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

  it("a primeira visita guarda as respostas e não apaga os lances", () => {
    const loaded = loadSession(JSON.stringify({ startFen: START, sans: ["e4"] }))
    expect(loaded?.welcomed).toBe(false)
    expect(loaded?.sound).toBe(true)
    let state = reducer(initialState, { type: "user-move", san: "e4" })
    state = reducer(state, {
      type: "welcome-done",
      patch: {
        player: "b",
        mode: "estudo",
        assistance: "melhor",
        strength: "forte",
        boardTheme: "tinta",
        pieceStyle: "celta",
        sound: false,
      },
    })
    expect(state.session.sans).toEqual(["e4"])
    expect(state.session.welcomed).toBe(true)
    expect(state.session.tab).toBe("jogo")
    expect(state.session.player).toBe("b")
    expect(state.session.sound).toBe(false)
    expect(state.session.pieceStyle).toBe("celta")
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
