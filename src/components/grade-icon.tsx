import { gradeGlyph, type Grade } from "@/lib/review"

export function GradeIcon({ grade }: { grade: Grade }) {
  if (grade === "livro") return <BookIcon />
  if (grade === "melhor") return <StarIcon />
  if (grade === "grande" || grade === "excelente" || grade === "bom") return <ThumbIcon />
  if (grade === "omissao") return <CrossIcon />
  return <span className="leading-none">{gradeGlyph(grade)}</span>
}

function BookIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-[62%]" aria-hidden>
      <path
        d="M2 2.4h4.2c.7 0 1.3.3 1.8.9.5-.6 1.1-.9 1.8-.9H14V13h-4.2c-.6 0-1.1.2-1.8.7-.7-.5-1.2-.7-1.8-.7H2V2.4z"
        fill="currentColor"
      />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-[68%]" aria-hidden>
      <path d="M8 1.4l1.7 3.6 3.9.5-2.9 2.7.7 3.9L8 10.2 4.6 12.1l.7-3.9L2.4 5.5l3.9-.5L8 1.4z" fill="currentColor" />
    </svg>
  )
}

function ThumbIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-[68%]" aria-hidden>
      <path
        d="M6.2 7.1 8.4 2.4c.3-.6 1.2-.4 1.3.3l-.2 3.1h3.2c.8 0 1.3.8 1.1 1.5l-1.2 4.2c-.2.6-.7 1-1.3 1H6.2V7.1zM2.4 7.2h2.4V13H2.4c-.4 0-.7-.3-.7-.7V7.9c0-.4.3-.7.7-.7z"
        fill="currentColor"
      />
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-[58%]" aria-hidden>
      <path d="M3.2 4.4 6.8 8l-3.6 3.6 1.2 1.2L8 9.2l3.6 3.6 1.2-1.2L9.2 8l3.6-3.6-1.2-1.2L8 6.8 4.4 3.2 3.2 4.4z" fill="currentColor" />
    </svg>
  )
}
