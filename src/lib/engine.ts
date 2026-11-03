import type { Analysis, PvLine } from "@/lib/engine-parse"
import { parseBestmove, parseInfo } from "@/lib/engine-parse"
import { STRENGTH_PRESET, type Strength } from "@/lib/session"

const ENGINE_URL = "/stockfish/stockfish-19-lite-single.js"
const ANALYSIS_MS = 420

type SearchOptions = {
  skill: number
  movetime: number
  multipv: number
}

type Pending = {
  id: number
  resolve: (analysis: Analysis | null) => void
}

export class EngineClient {
  private worker: Worker | null = null
  private job = 0
  private searching = false
  private pending: Pending | null = null
  private lines = new Map<number, PvLine>()
  private fen = ""
  private chain: Promise<void> = Promise.resolve()
  private lineWaiters: { test: (line: string) => boolean; resolve: () => void }[] = []
  private rejectInit: (error: Error) => void = () => {}
  private disposed = false

  async init(): Promise<void> {
    if (typeof Worker === "undefined") throw new Error("sem worker")
    this.worker = new Worker(ENGINE_URL)
    this.worker.onmessage = (event) => {
      const text = typeof event.data === "string" ? event.data : String(event.data ?? "")
      for (const line of text.split("\n")) {
        const trimmed = line.trim()
        if (trimmed) this.onLine(trimmed)
      }
    }
    this.worker.onerror = () => {
      this.failPending()
      this.rejectInit(new Error("O motor não carregou."))
    }
    this.post("uci")
    await this.waitFor((line) => line === "uciok")
    this.post("setoption name Hash value 16")
    this.post("isready")
    await this.waitFor((line) => line === "readyok")
  }

  analyze(fen: string): Promise<Analysis | null> {
    return this.request(fen, { skill: 20, movetime: ANALYSIS_MS, multipv: 3 })
  }

  reply(fen: string, strength: Strength): Promise<string | null> {
    const preset = STRENGTH_PRESET[strength]
    return this.request(fen, { skill: preset.skill, movetime: preset.movetime, multipv: 1 }).then(
      (analysis) => analysis?.best ?? null,
    )
  }

  dispose(): void {
    this.disposed = true
    this.job += 1
    this.failPending()
    this.worker?.terminate()
    this.worker = null
  }

  private request(fen: string, options: SearchOptions): Promise<Analysis | null> {
    if (this.disposed) return Promise.resolve(null)
    const id = ++this.job
    if (this.searching) this.post("stop")
    return new Promise((resolve) => {
      this.chain = this.chain
        .then(async () => {
          if (id !== this.job || this.disposed) {
            resolve(null)
            return
          }
          const analysis = await this.run(id, fen, options)
          resolve(id === this.job ? analysis : null)
        })
        .catch(() => {
          resolve(null)
        })
    })
  }

  private run(id: number, fen: string, options: SearchOptions): Promise<Analysis | null> {
    this.lines = new Map()
    this.fen = fen
    this.post(`setoption name Skill Level value ${options.skill}`)
    this.post(`setoption name MultiPV value ${options.multipv}`)
    this.post(`position fen ${fen}`)
    this.post(`go movetime ${options.movetime}`)
    this.searching = true
    return new Promise((resolve) => {
      this.pending = { id, resolve }
    })
  }

  private onLine(line: string): void {
    for (const waiter of [...this.lineWaiters]) {
      if (waiter.test(line)) waiter.resolve()
    }
    const info = parseInfo(line)
    if (info) this.lines.set(info.multipv, info)
    const best = parseBestmove(line)
    if (best === undefined) return
    this.searching = false
    const pending = this.pending
    this.pending = null
    if (!pending) return
    if (pending.id !== this.job) {
      pending.resolve(null)
      return
    }
    const lines = [...this.lines.values()].sort((a, b) => a.multipv - b.multipv)
    pending.resolve({
      fen: this.fen,
      best,
      lines,
    })
  }

  private waitFor(test: (line: string) => boolean, ms = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      const waiter = {
        test,
        resolve: () => {
          clearTimeout(timer)
          this.lineWaiters = this.lineWaiters.filter((item) => item !== waiter)
          resolve()
        },
      }
      const timer = setTimeout(() => {
        this.lineWaiters = this.lineWaiters.filter((item) => item !== waiter)
        reject(new Error("O motor não carregou."))
      }, ms)
      this.rejectInit = (error) => {
        clearTimeout(timer)
        this.lineWaiters = this.lineWaiters.filter((item) => item !== waiter)
        reject(error)
      }
      this.lineWaiters.push(waiter)
    })
  }

  private failPending(): void {
    this.searching = false
    this.pending?.resolve(null)
    this.pending = null
  }

  private post(command: string): void {
    this.worker?.postMessage(command)
  }
}
