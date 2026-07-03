import './globals.css'

import Providers from '@/components/providers'
import { TooltipProvider } from '@/components/ui/tooltip'

export const metadata = {
  title: 'Slack Agent Platform',
  description:
    'A subscription-based Slack agent platform powered by ChatBotKit',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <TooltipProvider>{children}</TooltipProvider>
        </Providers>
      </body>
    </html>
  )
}
