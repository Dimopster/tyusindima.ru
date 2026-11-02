import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '../../lib/gsap'

// Base pill dimensions in viewport pixels
const PILL_W = 215
const PILL_H = 720

const MAX_SCALE = 36
const LETTER_FONT = 110

const LETTERS = ['W', 'O', 'R', 'K', 'S']
const Y_OFFSET = 40

const LINE_1 = 'Избранные'
const LINE_2 = 'работы'

function buildPillPath(vw: number, vh: number, pillW: number, pillH: number) {
  const cx = vw / 2
  const cy = vh / 2 + Y_OFFSET
  const halfW = pillW / 2
  const halfH = pillH / 2
  const radius = pillW / 2
  const top = cy - halfH
  const bottom = cy + halfH
  const left = cx - halfW
  const right = cx + halfW
  return [
    `M ${left} ${top + radius}`,
    `A ${radius} ${radius} 0 0 1 ${right} ${top + radius}`,
    `L ${right} ${bottom - radius}`,
    `A ${radius} ${radius} 0 0 1 ${left} ${bottom - radius}`,
    'Z',
  ].join(' ')
}

export function ProjectsIntro() {
  const sectionRef = useRef<HTMLElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<SVGPathElement>(null)
  const borderRef = useRef<SVGPathElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const decorRef = useRef<HTMLDivElement>(null)
  const decorLabelsRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const charsLine1Ref = useRef<(HTMLSpanElement | null)[]>([])
  const charsLine2Ref = useRef<(HTMLSpanElement | null)[]>([])
  const eyebrowRef = useRef<HTMLParagraphElement>(null)
  const caretRef = useRef<HTMLSpanElement>(null)

  const [vp, setVp] = useState({ w: 1920, h: 1080 })

  useEffect(() => {
    const update = () =>
      setVp({ w: window.innerWidth, h: window.innerHeight })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Mouse parallax — two depth layers
  useEffect(() => {
    const decor = decorRef.current
    const labels = decorLabelsRef.current
    if (!decor || !labels) return

    const dx = gsap.quickTo(decor, 'x', { duration: 0.8, ease: 'power3.out' })
    const dy = gsap.quickTo(decor, 'y', { duration: 0.8, ease: 'power3.out' })
    const lx = gsap.quickTo(labels, 'x', { duration: 1.0, ease: 'power3.out' })
    const ly = gsap.quickTo(labels, 'y', { duration: 1.0, ease: 'power3.out' })

    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2
      const ny = (e.clientY / window.innerHeight - 0.5) * 2
      // Lines shift more (deep), labels shift less (close to viewer)
      dx(nx * -28)
      dy(ny * -28)
      lx(nx * -10)
      ly(ny * -10)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useEffect(() => {
    const sticky = stickyRef.current
    const pill = pillRef.current
    const border = borderRef.current
    const text = textRef.current
    const decor = decorRef.current
    const labels = decorLabelsRef.current
    const title = titleRef.current
    if (!sticky || !pill || !border || !text || !decor || !labels || !title) return

    const trigger = ScrollTrigger.create({
      trigger: sticky,
      start: 'top top',
      end: '+=150%',
      pin: true,
      pinSpacing: true,
      scrub: 0.5,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = self.progress
        // Pill zoom takes the first half of progress; the title typewriter
        // takes the second half — no idle scroll afterwards, the pin releases
        // straight into the Projects card flight.
        const zoomP = Math.min(1, p / 0.5)
        const eased = zoomP * zoomP
        const scale = 1 + eased * (MAX_SCALE - 1)

        const newW = PILL_W * scale
        const newH = PILL_H * scale
        const d = buildPillPath(
          window.innerWidth,
          window.innerHeight,
          newW,
          newH,
        )
        pill.setAttribute('d', d)
        border.setAttribute('d', d)

        text.style.transform = `translate(-50%, -50%) scale(${scale})`
        // Faster fade — disappears around 35% of (zoom-relative) progress
        text.style.opacity = String(Math.max(0, 1 - zoomP * 3))
        // Decor fades even quicker
        const decorOpacity = String(Math.max(0, 1 - zoomP * 2.5))
        decor.style.opacity = decorOpacity
        labels.style.opacity = decorOpacity

        // Title typewriter runs across the second half of pin progress.
        // Eyebrow fades in first, then per-char typewriter on the heading.
        const titleP = Math.min(1, Math.max(0, (p - 0.5) / 0.5))
        title.style.opacity = titleP > 0 ? '1' : '0'

        const eyebrow = eyebrowRef.current
        if (eyebrow) {
          // Eyebrow takes the first 18% of titleP
          const eyeP = Math.min(1, titleP / 0.18)
          eyebrow.style.opacity = String(eyeP)
          eyebrow.style.transform = `translateY(${(1 - eyeP) * 8}px)`
        }

        // Per-char typewriter — quantized step reveal across both lines
        const line1 = charsLine1Ref.current
        const line2 = charsLine2Ref.current
        const total = line1.length + line2.length
        // Typewriter starts after eyebrow (0.18 → 1.0 of titleP)
        const typeP = Math.min(1, Math.max(0, (titleP - 0.18) / 0.82))
        const visibleCount = Math.floor(typeP * (total + 0.5))
        line1.forEach((el, i) => {
          if (el) el.style.opacity = i < visibleCount ? '1' : '0'
        })
        line2.forEach((el, i) => {
          const overall = line1.length + i
          if (el) el.style.opacity = overall < visibleCount ? '1' : '0'
        })

        // Caret blinks while typing, hides when done
        const caret = caretRef.current
        if (caret) {
          caret.style.opacity = typeP > 0 && typeP < 1 ? '1' : '0'
        }
      },
    })

    return () => {
      trigger.kill()
    }
  }, [])

  const initialD = buildPillPath(vp.w, vp.h, PILL_W, PILL_H)

  // Decor geometry — derived from pill position
  const cx = vp.w / 2
  const cy = vp.h / 2 + Y_OFFSET
  const pillLeft = cx - PILL_W / 2
  const pillRight = cx + PILL_W / 2
  const pillTop = cy - PILL_H / 2
  const pillBottom = cy + PILL_H / 2
  // Safe zones — keep decor anchored to pill edges from running past the
  // sticky's clipped bounds on smaller viewports.
  const pillTopSafe = Math.max(pillTop, 30)
  const pillBottomSafe = Math.min(pillBottom, vp.h - 30)

  // Adaptive radii — ensure ring fits within viewport accounting for Nav (88px) and bottom (40px)
  const NAV_CLEARANCE = 96
  const BOTTOM_CLEARANCE = 40
  const maxRadius = Math.min(cy - NAV_CLEARANCE, vp.h - cy - BOTTOM_CLEARANCE)
  const ringOuterR = Math.min(PILL_H * 0.85, maxRadius)
  const ringMidR = Math.min(PILL_H * 0.7, maxRadius - 18)
  const ringInnerR = Math.min(PILL_H * 0.56, maxRadius - 36)

  return (
    <section ref={sectionRef} className="relative bg-[var(--color-fg)]">
      <div
        ref={stickyRef}
        className="relative h-screen w-full overflow-hidden bg-[var(--color-fg)]"
      >
        {/* Pill + mask + border (white field with pill cutout to dark bg) */}
        <svg
          className="absolute inset-0"
          width={vp.w}
          height={vp.h}
          viewBox={`0 0 ${vp.w} ${vp.h}`}
        >
          <defs>
            <mask id="pill-zoom-mask">
              <rect width={vp.w} height={vp.h} fill="white" />
              <path ref={pillRef} d={initialD} fill="black" />
            </mask>
          </defs>

          <rect
            width={vp.w}
            height={vp.h}
            fill="var(--color-bg)"
            mask="url(#pill-zoom-mask)"
          />

          <path
            ref={borderRef}
            d={initialD}
            fill="none"
            stroke="var(--color-fg)"
            strokeWidth="1.5"
          />
        </svg>

        {/* Decor layer A — SVG geometric lines (deeper parallax) */}
        <div
          ref={decorRef}
          aria-hidden
          className="absolute inset-0 pointer-events-none will-change-transform"
        >
          <svg
            className="absolute inset-0"
            width={vp.w}
            height={vp.h}
            viewBox={`0 0 ${vp.w} ${vp.h}`}
          >
            {/* Slowly rotating outer ring (radius adapts to viewport) */}
            <g
              style={{
                transformOrigin: `${cx}px ${cy}px`,
                animation: 'pi-spin 60s linear infinite',
              }}
            >
              <circle
                cx={cx}
                cy={cy}
                r={ringOuterR}
                fill="none"
                stroke="var(--color-fg)"
                strokeOpacity="0.1"
                strokeWidth="1"
                strokeDasharray="1 14"
              />
              {/* Tick marks on the rotating ring */}
              {Array.from({ length: 24 }).map((_, i) => {
                const a = (i / 24) * Math.PI * 2
                const r1 = ringOuterR
                const r2 = r1 + (i % 6 === 0 ? 12 : 6)
                return (
                  <line
                    key={i}
                    x1={cx + Math.cos(a) * r1}
                    y1={cy + Math.sin(a) * r1}
                    x2={cx + Math.cos(a) * r2}
                    y2={cy + Math.sin(a) * r2}
                    stroke="var(--color-fg)"
                    strokeOpacity={i % 6 === 0 ? '0.45' : '0.2'}
                    strokeWidth="1"
                  />
                )
              })}
            </g>

            {/* Concentric dashed circles (static) */}
            <circle
              cx={cx}
              cy={cy}
              r={ringInnerR}
              fill="none"
              stroke="var(--color-fg)"
              strokeOpacity="0.18"
              strokeWidth="1"
              strokeDasharray="2 6"
            />
            <circle
              cx={cx}
              cy={cy}
              r={ringMidR}
              fill="none"
              stroke="var(--color-fg)"
              strokeOpacity="0.12"
              strokeWidth="1"
              strokeDasharray="2 8"
            />

            {/* Horizontal axes through pill center, with ruler ticks */}
            <line
              x1="0"
              y1={cy}
              x2={pillLeft - 60}
              y2={cy}
              stroke="var(--color-fg)"
              strokeOpacity="0.35"
              strokeWidth="1"
            />
            <line
              x1={pillRight + 60}
              y1={cy}
              x2={vp.w}
              y2={cy}
              stroke="var(--color-fg)"
              strokeOpacity="0.35"
              strokeWidth="1"
            />
            {/* Ruler ticks on horizontal axes */}
            {Array.from({ length: Math.floor((pillLeft - 60) / 60) }).map(
              (_, i) => {
                const x = (pillLeft - 60) - (i + 1) * 60
                if (x < 20) return null
                const long = i % 3 === 2
                return (
                  <line
                    key={`l${i}`}
                    x1={x}
                    y1={cy - (long ? 8 : 4)}
                    x2={x}
                    y2={cy + (long ? 8 : 4)}
                    stroke="var(--color-fg)"
                    strokeOpacity={long ? '0.45' : '0.25'}
                    strokeWidth="1"
                  />
                )
              },
            )}
            {Array.from({ length: Math.floor((vp.w - pillRight - 60) / 60) }).map(
              (_, i) => {
                const x = (pillRight + 60) + (i + 1) * 60
                if (x > vp.w - 20) return null
                const long = i % 3 === 2
                return (
                  <line
                    key={`r${i}`}
                    x1={x}
                    y1={cy - (long ? 8 : 4)}
                    x2={x}
                    y2={cy + (long ? 8 : 4)}
                    stroke="var(--color-fg)"
                    strokeOpacity={long ? '0.45' : '0.25'}
                    strokeWidth="1"
                  />
                )
              },
            )}

            {/* Vertical guide below pill (top one removed — collided with section label) */}
            <line
              x1={cx}
              y1={Math.min(pillBottom + 60, vp.h - 8)}
              x2={cx}
              y2={vp.h}
              stroke="var(--color-fg)"
              strokeOpacity="0.25"
              strokeWidth="1"
              strokeDasharray="3 5"
            />

            {/* Diagonal lines from corners pointing toward pill */}
            <line
              x1="40"
              y1="40"
              x2={pillLeft - 100}
              y2={cy - PILL_H * 0.3}
              stroke="var(--color-fg)"
              strokeOpacity="0.22"
              strokeWidth="1"
            />
            <line
              x1={vp.w - 40}
              y1="40"
              x2={pillRight + 100}
              y2={cy - PILL_H * 0.3}
              stroke="var(--color-fg)"
              strokeOpacity="0.22"
              strokeWidth="1"
            />
            <line
              x1="40"
              y1={vp.h - 40}
              x2={pillLeft - 100}
              y2={cy + PILL_H * 0.3}
              stroke="var(--color-fg)"
              strokeOpacity="0.22"
              strokeWidth="1"
            />
            <line
              x1={vp.w - 40}
              y1={vp.h - 40}
              x2={pillRight + 100}
              y2={cy + PILL_H * 0.3}
              stroke="var(--color-fg)"
              strokeOpacity="0.22"
              strokeWidth="1"
            />

            {/* Crosshair markers at endpoints of diagonals (close to pill) */}
            {[
              { x: pillLeft - 100, y: cy - PILL_H * 0.3 },
              { x: pillRight + 100, y: cy - PILL_H * 0.3 },
              { x: pillLeft - 100, y: cy + PILL_H * 0.3 },
              { x: pillRight + 100, y: cy + PILL_H * 0.3 },
            ].map((c, i) => (
              <g key={`cross${i}`}>
                <line
                  x1={c.x - 6}
                  y1={c.y}
                  x2={c.x + 6}
                  y2={c.y}
                  stroke="var(--color-fg)"
                  strokeOpacity="0.55"
                  strokeWidth="1"
                />
                <line
                  x1={c.x}
                  y1={c.y - 6}
                  x2={c.x}
                  y2={c.y + 6}
                  stroke="var(--color-fg)"
                  strokeOpacity="0.55"
                  strokeWidth="1"
                />
                <circle
                  cx={c.x}
                  cy={c.y}
                  r="2"
                  fill="var(--color-fg)"
                  fillOpacity="0.6"
                />
              </g>
            ))}

            {/* Corner brackets */}
            {[
              { x: 32, y: 32, dx: 1, dy: 1 },
              { x: vp.w - 32, y: 32, dx: -1, dy: 1 },
              { x: 32, y: vp.h - 32, dx: 1, dy: -1 },
              { x: vp.w - 32, y: vp.h - 32, dx: -1, dy: -1 },
            ].map((c, i) => (
              <g key={i}>
                <line
                  x1={c.x}
                  y1={c.y}
                  x2={c.x + 18 * c.dx}
                  y2={c.y}
                  stroke="var(--color-fg)"
                  strokeOpacity="0.7"
                  strokeWidth="1"
                />
                <line
                  x1={c.x}
                  y1={c.y}
                  x2={c.x}
                  y2={c.y + 18 * c.dy}
                  stroke="var(--color-fg)"
                  strokeOpacity="0.7"
                  strokeWidth="1"
                />
              </g>
            ))}
          </svg>
        </div>

        {/* Decor layer B — HTML mono labels (lighter parallax for depth) */}
        <div
          ref={decorLabelsRef}
          aria-hidden
          className="absolute inset-0 pointer-events-none will-change-transform"
        >
          {/* Mono labels around pill */}
          <div
            className="absolute font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-fg)]/55"
            style={{ left: pillLeft - 80, top: pillTopSafe - 8 }}
          >
            01.0
          </div>
          <div
            className="absolute font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-fg)]/55"
            style={{ left: pillRight + 30, top: pillTopSafe - 8 }}
          >
            x.215
          </div>
          <div
            className="absolute font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-fg)]/55"
            style={{ left: pillLeft - 80, top: pillBottomSafe - 8 }}
          >
            06.0
          </div>
          <div
            className="absolute font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-fg)]/55"
            style={{ left: pillRight + 30, top: pillBottomSafe - 8 }}
          >
            y.720
          </div>

          {/* Top mono indicator — fixed below Nav, never overlaps pill */}
          <div
            className="absolute font-mono text-[0.65rem] uppercase tracking-[0.3em] text-[var(--color-fg)]/65 -translate-x-1/2"
            style={{ left: cx, top: 56 }}
          >
            section / projects
          </div>

          {/* Bottom mono indicator — fixed near viewport bottom */}
          <div
            className="absolute font-mono text-[0.65rem] uppercase tracking-[0.3em] text-[var(--color-fg)]/65 -translate-x-1/2"
            style={{ left: cx, top: vp.h - 60 }}
          >
            ↓ scroll to enter
          </div>

          {/* Corner mono labels */}
          <div className="absolute top-6 left-12 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-fg)]/55">
            [ 04 ]&nbsp;&nbsp;chapter
          </div>
          <div className="absolute top-6 right-12 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-fg)]/55">
            05 / projects
          </div>
          <div className="absolute bottom-6 left-12 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-fg)]/45">
            lat.55.751 / lon.37.617
          </div>
          <div className="absolute bottom-6 right-12 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-fg)]/45">
            v.1.0&nbsp;&nbsp;·&nbsp;&nbsp;portfolio
          </div>
        </div>

        {/* WORKS — vertical, centered (with same Y offset as pill) */}
        <div
          ref={textRef}
          className="absolute left-1/2 z-10 pointer-events-none will-change-transform flex flex-col items-center"
          style={{
            top: `calc(50% + ${Y_OFFSET}px)`,
            transform: 'translate(-50%, -50%) scale(1)',
          }}
        >
          {LETTERS.map((l) => (
            <span
              key={l}
              className="block font-extrabold tracking-[-0.04em] leading-[0.9] text-[var(--color-bg)]"
              style={{ fontSize: `${LETTER_FONT}px` }}
            >
              {l}
            </span>
          ))}
        </div>

        {/* Projects title — top-left, typewriter reveal. Appears earlier in
            scroll progress so it's already typing before the pill fully
            completes its zoom. */}
        <div
          ref={titleRef}
          className="absolute left-6 md:left-12 top-24 md:top-32 z-20 pointer-events-none"
          style={{ opacity: 0 }}
        >
          <p
            ref={eyebrowRef}
            className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-[var(--color-bg)]/60 mb-2 md:mb-3"
            style={{ opacity: 0, transform: 'translateY(8px)' }}
          >
            [ 04 ]&nbsp;&nbsp;проекты
          </p>
          <h2 className="font-extrabold tracking-[-0.035em] leading-[0.95] text-[clamp(2.25rem,6vw,5rem)] text-[var(--color-bg)]">
            <span className="block">
              {LINE_1.split('').map((c, i) => (
                <span
                  key={`l1-${i}`}
                  ref={(el) => {
                    charsLine1Ref.current[i] = el
                  }}
                  style={{ opacity: 0 }}
                >
                  {c}
                </span>
              ))}
            </span>
            <span className="block text-[var(--color-bg)]/45">
              {LINE_2.split('').map((c, i) => (
                <span
                  key={`l2-${i}`}
                  ref={(el) => {
                    charsLine2Ref.current[i] = el
                  }}
                  style={{ opacity: 0 }}
                >
                  {c}
                </span>
              ))}
              <span
                ref={caretRef}
                aria-hidden
                className="inline-block align-baseline ml-2 w-[0.5ch] h-[0.85em] bg-[var(--color-bg)]/85 translate-y-[0.05em]"
                style={{ opacity: 0 }}
              />
            </span>
          </h2>
        </div>
      </div>
    </section>
  )
}
