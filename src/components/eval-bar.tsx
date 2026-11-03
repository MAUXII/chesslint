export function EvalBar({
  ratio,
  label,
}: {
  ratio: number
  label: string
}) {
  const clamped = Math.min(1, Math.max(0, ratio))
  return (
    <div
      className="relative h-full w-2 shrink-0 overflow-hidden"
      style={{ borderRadius: 2, background: "#6f6a62" }}
      role="img"
      aria-label={label}
    >
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ height: `${clamped * 100}%`, background: "#e4e0d8" }}
      />
    </div>
  )
}
