import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"

import { cn } from "@/lib/utils"
import "./globals.css"

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Lance",
  description: "Um tabuleiro que mostra o lance, e um caderno para o que você aprendeu.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={cn("dark h-full antialiased", dmSans.variable)}>
      <body className="min-h-full bg-background font-sans text-foreground antialiased">{children}</body>
    </html>
  )
}
