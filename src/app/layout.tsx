import { Inter } from 'next/font/google'
import SessionProvider from '@/components/providers/SessionProvider'
import AppLayout from '@/components/AppLayout'
import Script from 'next/script'
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
          <AppLayout>
            {children}
          </AppLayout>
        </SessionProvider>
        <Script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" />
      </body>
    </html>
  )
}