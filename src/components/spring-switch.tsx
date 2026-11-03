"use client"

import { motion, useReducedMotion } from "motion/react"

export function SpringSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
}) {
  const reduced = useReducedMotion()
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative h-8 w-14 shrink-0 rounded-full bg-white/10"
    >
      <motion.span
        className="absolute top-1 left-1 size-6 rounded-full bg-white"
        animate={{ x: checked ? 24 : 0 }}
        transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 32 }}
      />
    </button>
  )
}
