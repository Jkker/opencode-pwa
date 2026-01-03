'use client'

import { useEffect } from 'react'

import { useMediaQuery } from '@/hooks/use-media-query'
import { ThemeProviderContext, Theme } from '@/hooks/use-theme'
import { settingStore } from '@/stores/setting-store'

export interface ThemeProviderProps {
  children: React.ReactNode
}

function resolveTheme(theme: typeof Theme.infer, isDarkMode: boolean): 'light' | 'dark' {
  return theme === 'system' ? (isDarkMode ? 'dark' : 'light') : theme
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
  const theme = settingStore.useValue('theme')
  const setTheme = settingStore.actions.setTheme

  useEffect(() => {
    const root = window.document.documentElement
    const resolved = resolveTheme(theme, isDarkMode)

    root.classList.remove('light', 'dark')
    root.classList.add(resolved)
    root.style.colorScheme = resolved
  }, [theme, isDarkMode])

  return (
    <ThemeProviderContext
      {...props}
      value={{
        theme,
        resolvedTheme: resolveTheme(theme, isDarkMode),
        setTheme,
      }}
    >
      {children}
    </ThemeProviderContext>
  )
}
