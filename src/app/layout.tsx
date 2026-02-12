import { Inter } from 'next/font/google'
import SessionProvider from '@/components/providers/SessionProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'ERP Jurídico - Procesos de Insolvencia',
  description: 'Sistema de gestión para procesos de insolvencia en Colombia',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <SessionProvider>
          <div id="root">{children}</div>
        </SessionProvider>
      </body>
    </html>
  )
}