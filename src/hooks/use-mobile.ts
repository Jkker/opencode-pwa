import { useMediaQuery } from './use-media-query'

export const useIsMobile = (breakpoint = 768) => useMediaQuery(`(max-width: ${breakpoint - 1}px)`)
