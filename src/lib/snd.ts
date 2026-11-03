"use client"

import Snd from "snd-lib"

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

let snd: Snd | null = null
let ready = false

export function bootSnd() {
  if (typeof window === "undefined" || snd) return
  snd = new Snd({ easySetup: true, muteOnWindowBlur: true })
  void snd.load(Snd.KITS.SND01).then(() => {
    ready = true
  })
}

export function playSnd(name: SndName, enabled = true) {
  if (!enabled || !ready || !snd) return
  const volume = 0.42
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
