import { useEffect, useRef } from 'react'

export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const bar = barRef.current
    if (!bar) return

    const update = () => {
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? window.scrollY / docHeight : 0
      bar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-px bg-transparent pointer-events-none">
      <div
        ref={barRef}
        className="h-full bg-[var(--color-fg)] origin-left"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  )
}
