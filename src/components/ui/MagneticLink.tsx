import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { gsap } from '../../lib/gsap'

type Props = {
  children: ReactNode
  href?: string
  // External links open in a new tab.
  external?: boolean
  strength?: number
  className?: string
  onClick?: () => void
}

export function MagneticLink({
  children,
  href,
  external,
  strength = 0.3,
  className,
  onClick,
}: Props) {
  const wrapRef = useRef<HTMLAnchorElement>(null)
  const innerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const inner = innerRef.current
    if (!wrap || !inner) return

    const onMove = (e: MouseEvent) => {
      const rect = wrap.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2
      gsap.to(wrap, {
        x: x * strength,
        y: y * strength,
        duration: 0.5,
        ease: 'power3.out',
      })
      gsap.to(inner, {
        x: x * strength * 0.4,
        y: y * strength * 0.4,
        duration: 0.5,
        ease: 'power3.out',
      })
    }

    const onLeave = () => {
      gsap.to([wrap, inner], {
        x: 0,
        y: 0,
        duration: 0.7,
        ease: 'elastic.out(1, 0.5)',
      })
    }

    wrap.addEventListener('mousemove', onMove)
    wrap.addEventListener('mouseleave', onLeave)
    return () => {
      wrap.removeEventListener('mousemove', onMove)
      wrap.removeEventListener('mouseleave', onLeave)
    }
  }, [strength])

  return (
    <a
      ref={wrapRef}
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      onClick={onClick}
      className={`inline-flex items-center justify-center will-change-transform ${className ?? ''}`}
    >
      <span ref={innerRef} className="inline-flex items-center gap-2 will-change-transform">
        {children}
      </span>
    </a>
  )
}
