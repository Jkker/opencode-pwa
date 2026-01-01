import { useEffect, useState } from 'react'

const checkMediaQuery = (q: string): boolean => {
  if (typeof window !== 'undefined') {
    return window.matchMedia(q).matches
  }
  return false
}

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => checkMediaQuery(query))

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const handler = ({ matches }: MediaQueryListEvent) => setMatches(matches)

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  return matches
}
