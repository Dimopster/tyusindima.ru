import { useEffect, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { MagneticLink } from '../ui/MagneticLink'
import { ScrollTrigger } from '../../lib/gsap'

const NAV_LINKS = [
  { href: '#projects', label: 'Projects' },
  { href: '#about', label: 'About' },
]

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // The bar slides away once the dark stack scene comes in and stays away for
  // the rest of the page (it comes back only when scrolling up past that
  // point). Refreshed last: the scene pins itself, and its pin spacing has to
  // exist before this point is measured.
  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: '#stack',
      start: 'top 50%',
      refreshPriority: -1,
      onEnter: () => setHidden(true),
      onLeaveBack: () => setHidden(false),
    })
    return () => trigger.kill()
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-[padding,background,border,backdrop-filter,translate] duration-500 ${
        hidden ? '-translate-y-full' : 'translate-y-0'
      } ${
        scrolled
          ? 'py-3 bg-[var(--color-bg)]/80 backdrop-blur-md border-b border-[var(--color-line)]'
          : 'py-6 bg-transparent border-b border-transparent'
      }`}
    >
      <div className="px-6 md:px-10 flex items-center justify-between gap-6">
        <a
          href="#"
          className="font-mono text-base font-semibold tracking-tight text-[var(--color-fg)]"
        >
          dmitry<span className="text-[var(--color-fg-subtle)]">.</span>
        </a>

        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="hidden md:block text-sm font-medium text-[var(--color-fg)] hover:text-[var(--color-fg-muted)] transition-colors"
          >
            {link.label}
          </a>
        ))}

        <MagneticLink
          href="https://t.me/Dimopster"
          external
          strength={0.25}
          className="px-5 py-2.5 bg-[var(--color-fg)] text-[var(--color-bg)] rounded-full text-xs font-semibold tracking-tight"
        >
          <span>Связаться</span>
          <ArrowUpRight size={14} strokeWidth={2.4} />
        </MagneticLink>
      </div>
    </header>
  )
}
