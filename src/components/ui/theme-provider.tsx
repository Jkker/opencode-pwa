'use client'

import { type } from 'arktype'
import { useEffect, useState } from 'react'

import { useMediaQuery } from '@/hooks/use-media-query'
import { ThemeProviderContext, Theme } from '@/hooks/use-theme'

export interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: typeof Theme.infer
  storageKey?: string
}
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'theme',
  ...props
}: ThemeProviderProps) {
  const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)')

  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return defaultTheme
    const result = Theme(localStorage.getItem(storageKey))
    return result instanceof type.errors ? defaultTheme : result
  })

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      return root.classList.add(isDarkMode ? 'dark' : 'light')
    }

    root.classList.add(theme)
  }, [theme, isDarkMode])

  return (
    <ThemeProviderContext
      {...props}
      value={{
        theme,
        resolvedTheme: theme === 'system' ? (isDarkMode ? 'dark' : 'light') : theme,
        setTheme: (theme) => {
          localStorage.setItem(storageKey, theme)
          setTheme(theme)
        },
      }}
    >
      {children}
    </ThemeProviderContext>
  )
}
