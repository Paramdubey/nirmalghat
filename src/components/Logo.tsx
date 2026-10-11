import { IMAGES } from '../constants/images'

/** The NirmalGhat emblem. Decorative: the name is always written out in text next to it. */
export function Logo({ className = 'h-11' }: { className?: string }) {
  return <img src={IMAGES.logoMark} alt="" aria-hidden="true" className={`w-auto ${className}`} />
}
