import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "@/styles/globals.css"
import { ANTI_FLASH_SCRIPT } from "@/lib/themes"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  metadataBase: new URL("https://panel.arenatrece.com"),
  title: "Arena13 - Panel de Gestión",
  description: "Panel de gestión de clientes para Arena13 - Diseño de Producto Digital & IA",
  keywords: ["Arena13", "diseño digital", "gestión de clientes", "panel"],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/logo.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ANTI_FLASH_SCRIPT }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var c=JSON.parse(localStorage.getItem('arena13-panel-config')||'{}');if(c.titulo){document.title=c.titulo}if(c.faviconUrl){var l=document.querySelector("link[rel~='icon']");if(!l){l=document.createElement('link');l.rel='icon';document.head.appendChild(l)}l.href=c.faviconUrl}if(c.logoUrl){var a=document.querySelector("link[rel~='apple-touch-icon']");if(a)a.href=c.logoUrl}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
