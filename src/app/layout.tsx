import type { Metadata } from "next"
import { Geist } from "next/font/google"

import { AsciiSea } from "@/components/ascii-sea"
import { cn } from "@/lib/utils"
import "./globals.css"

const geist = Geist({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-geist",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Lance",
  description: "Um tabuleiro que mostra o lance, e um caderno para o que você aprendeu.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={cn("dark h-full bg-background antialiased", geist.variable)}>
      <body className="min-h-full bg-transparent font-sans text-foreground antialiased">
        <AsciiSea />
        {children}
      </body>
    </html>
  )
}
