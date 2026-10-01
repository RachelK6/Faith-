import logoHorizontal from '../../../images/optimum-lms-logo/svg/optimum-lms-horizontal.svg'
import logoHorizontalOnDark from '../../../images/optimum-lms-logo/svg/optimum-lms-horizontal-on-dark.svg'
import logoIcon from '../../../images/optimum-lms-logo/svg/optimum-lms-icon.svg'

/**
 * The one place the brand mark is rendered.
 *
 * The horizontal logo files already contain the icon. Pick the variant by
 * the background it sits on; use the standalone icon only in tight spaces.
 */
export default function Logo({ tone = 'light', mark = false, height = 36, className = '' }) {
  const src = mark ? logoIcon : tone === 'dark' ? logoHorizontalOnDark : logoHorizontal
  return (
    <img
      src={src}
      alt={mark ? '' : 'Optimum LMS'}
      height={height}
      style={{ height, width: 'auto' }}
      className={`block select-none ${className}`}
      draggable={false}
    />
  )
}
