import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Croatia Bike Camp Tracker',
  description: 'Wizualizacja tras rowerowych i galeria zdjęć z obozu w Chorwacji',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl" className="dark h-full">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          if (localStorage.getItem('theme') === 'light') {
            document.documentElement.classList.add('light');
          }
        `}} />
      </head>
      <body className={`${geist.className} bg-gray-950 text-white antialiased h-full`}>
        {children}
      </body>
    </html>
  )
}
