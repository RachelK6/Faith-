import type { ReactNode, CSSProperties } from 'react'
import { useReveal, useSpotlight } from '../../hooks/useDashboardFx'

/** Standard dashboard card: reveals on scroll into view, glows toward the cursor on hover. */
export function Card({
  span = 4,
  children,
  style,
  as: As = 'div',
}: {
  span?: 3 | 4 | 5 | 6 | 7 | 8 | 12
  children: ReactNode
  style?: CSSProperties
  as?: 'div' | 'section'
}) {
  const reveal = useReveal<HTMLDivElement>()
  const spotlight = useSpotlight()
  return (
    <As
      ref={reveal.ref as any}
      className={`dg-card dg-c${span} ${reveal.className}`}
      style={style}
      onMouseMove={spotlight.onMouseMove}
    >
      {children}
    </As>
  )
}
