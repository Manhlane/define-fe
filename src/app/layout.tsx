// app/layout.tsx
import type { ReactNode } from "react"
import { Space_Grotesk } from "next/font/google"
import ThemeRootSync from "@/src/components/ThemeRootSync"
import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/src/lib/theme"
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
})

const themeBootstrapScript = `
  (() => {
    try {
      const savedTheme = window.localStorage.getItem('${THEME_STORAGE_KEY}');
      document.documentElement.dataset.theme =
        savedTheme === 'daytime' || savedTheme === 'midnight'
          ? savedTheme
          : '${DEFAULT_THEME}';
    } catch {
      document.documentElement.dataset.theme = '${DEFAULT_THEME}';
    }
  })();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-theme={DEFAULT_THEME}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className={`${spaceGrotesk.variable} ${spaceGrotesk.className} bg-[var(--app-bg)] text-[var(--app-foreground)] antialiased`}>
        <ThemeRootSync />
        {children}
      </body>
    </html>
  )
}
