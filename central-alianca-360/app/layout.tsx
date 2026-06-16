import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Central Aliança 360',
  description: 'Dashboard operacional e comercial da Aliança Móveis',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
