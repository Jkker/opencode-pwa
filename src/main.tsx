import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/ui/theme-provider'
import { ReactI18nextProvider } from '@/lib/i18next'
import { OpencodeProvider } from '@/lib/opencode'
import { TanstackQueryProvider } from '@/lib/tanstack-query'
import { TanstackRouterProvider } from '@/lib/tanstack-router'

import './index.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

createRoot(rootElement).render(
  <StrictMode>
    <ReactI18nextProvider>
      <TanstackQueryProvider>
        <ThemeProvider>
          <OpencodeProvider>
            <TanstackRouterProvider />
            <Toaster />
          </OpencodeProvider>
        </ThemeProvider>
      </TanstackQueryProvider>
    </ReactI18nextProvider>
  </StrictMode>,
)
