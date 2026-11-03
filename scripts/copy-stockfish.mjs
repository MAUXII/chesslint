import { copyFileSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const source = join(root, "node_modules/stockfish/bin")
const dest = join(root, "public/stockfish")
const files = ["stockfish-19-lite-single.js", "stockfish-19-lite-single.wasm"]

mkdirSync(dest, { recursive: true })

for (const name of files) {
  copyFileSync(join(source, name), join(dest, name))
}
