import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import Providers from './providers';
import { GoogleAnalytics } from '@next/third-parties/google'
import VersionChecker from './check-version';


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'J.A.R.V.I.S',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_KEY || "unknown";
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            // enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </Providers>
        <VersionChecker />
        <Toaster />
      </body>
      <GoogleAnalytics gaId={key} />
    </html >
  )
}
