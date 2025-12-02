import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Web3Provider } from '@/hooks/useWeb3'
import { NotificationProvider } from '@/hooks/useNotifications'
import { EducationalModeProvider } from '@/hooks/useEducationalMode'
import { SimulationProvider } from '@/hooks/useSimulation'
import { LiquidatorBotProvider } from '@/hooks/useLiquidatorBot'
import { ToastContainer } from '@/components/ui/NotificationCenter'
import { Toaster } from 'react-hot-toast'
import { Header } from '@/components/layout'
import ScrollToTop from '@/components/ScrollToTop'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DeFi Lending & Borrowing',
  description: 'Decentralized lending and borrowing protocol',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Web3Provider>
          <NotificationProvider>
            <EducationalModeProvider>
              <SimulationProvider>
                <LiquidatorBotProvider>
                  <ScrollToTop />
                  <Header />
                  {children}
                  <ToastContainer />
                  <Toaster
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: '#363636',
                        color: '#fff',
                      },
                      success: {
                        iconTheme: {
                          primary: '#22c55e',
                          secondary: '#fff',
                        },
                      },
                      error: {
                        iconTheme: {
                          primary: '#ef4444',
                          secondary: '#fff',
                        },
                      },
                    }}
                  />
                </LiquidatorBotProvider>
              </SimulationProvider>
            </EducationalModeProvider>
          </NotificationProvider>
        </Web3Provider>
      </body>
    </html>
  )
}
