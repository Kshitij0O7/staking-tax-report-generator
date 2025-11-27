import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Staking Tax Calculator',
  description: 'Calculate staking tax reports from validator addresses',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

