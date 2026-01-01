import { type } from 'arktype'
import { createContext, use } from 'react'

export const Theme = type("'light' | 'dark' | 'system'")

export type ThemeContext = {
  theme: typeof Theme.infer
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: typeof Theme.infer) => void
}
export const ThemeProviderContext = createContext<ThemeContext>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => null,
})

export const useTheme = () => {
  const context = use(ThemeProviderContext)

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
