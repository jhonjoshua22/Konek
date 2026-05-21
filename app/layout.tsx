import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'
import RightSidebar from '@/components/layout/RightSidebar'

const geist = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Konek',
  description: 'Connect with the world',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geist.className} font-sans antialiased`}>
        <div className="flex justify-center max-w-7xl mx-auto">
          {/* Sidebar */}
          <Sidebar />
          
          {/* Main Content Area */}
          <main className="flex-1 max-w-2xl border-x border-border min-h-screen">
            {children}
          </main>
          
          {/* Right Sidebar */}
          <RightSidebar />
        </div>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}