// app/layout.tsx
import type { ReactNode } from "react"
import { Inter } from "next/font/google"
import './globals.css';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  )
}
