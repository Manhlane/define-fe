// app/layout.tsx
import type { ReactNode } from "react"
import { Space_Grotesk } from "next/font/google"
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
})

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${spaceGrotesk.className} bg-[var(--app-bg)] text-[var(--app-foreground)] antialiased`}>
        {children}
      </body>
    </html>
  )
}
