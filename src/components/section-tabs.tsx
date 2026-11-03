"use client"

import { motion, useReducedMotion } from "motion/react"

import type { Tab } from "@/lib/session"

export function SectionTabs({ value, onChange }: { value: Tab; onChange: (tab: Tab) => void }) {
  const reduced = useReducedMotion()
  const items: { id: Tab; label: string }[] = [
    { id: "jogo", label: "Jogo" },
    { id: "configurar", label: "Configurar" },
  ]

  return (
    <div role="tablist" aria-label="Seção" className="relative grid w-[220px] grid-cols-2 rounded-[10px] bg-white/6 p-0.5">
      {items.map((item) => {
        const selected = value === item.id
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(item.id)}
            className="relative z-10 h-8 text-[13px]"
          >
            {selected && (
              <motion.span
                layoutId="lance-section"
                className="absolute inset-0 rounded-[8px] bg-white"
                transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 460, damping: 34 }}
              />
            )}
            <span className={selected ? "relative text-[#161616]" : "relative text-white/70"}>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
