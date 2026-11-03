"use client"

import Snd from "snd-lib"

import type { SoundPreset } from "@/lib/session"

export type SndName =
  | "tap"
  | "button"
  | "select"
  | "toggleOn"
  | "toggleOff"
  | "celebration"
  | "caution"
  | "transitionUp"
  | "transitionDown"

const PRESET_GAIN: Record<SoundPreset, number> = {
  suave: 0.45,
  classico: 1,
  tatil: 1.35,
}

let snd: Snd | null = null
let ready = false
let mix = { preset: "suave" as SoundPreset, board: 0.7, ui: 0.7 }

export function setSndMix(next: { preset: SoundPreset; board: number; ui: number }) {
  mix = next
}

export function bootSnd() {
  if (typeof window === "undefined" || snd) return
  snd = new Snd({ easySetup: true, muteOnWindowBlur: true })
  void snd.load(Snd.KITS.SND01).then(() => {
    ready = true
  })
}

export function playSnd(name: SndName, enabled = true, channel: "board" | "ui" = "ui") {
  if (!enabled || !ready || !snd) return
  const channelGain = channel === "board" ? mix.board : mix.ui
  const volume = Math.min(1, 0.42 * PRESET_GAIN[mix.preset] * channelGain)
  const options = { volume }
  if (name === "tap") snd.playTap(options)
  else if (name === "button") snd.playButton(options)
  else if (name === "select") snd.playSelect(options)
  else if (name === "toggleOn") snd.playToggleOn(options)
  else if (name === "toggleOff") snd.playToggleOff(options)
  else if (name === "celebration") snd.playCelebration(options)
  else if (name === "caution") snd.playCaution(options)
  else if (name === "transitionUp") snd.playTransitionUp(options)
  else snd.playTransitionDown(options)
}
