import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '../../lib/gsap'

// Mirror geometry from ProjectsIntro — same pill so the outro reads as the
// reverse of the entry.
const PILL_W = 215
const PILL_H = 720
const MAX_SCALE = 36
const LETTER_FONT = 110
const LETTERS = ['W', 'O', 'R', 'K', 'S']
const Y_OFFSET = 40

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


// Short viewports (a phone with Safari's toolbars, small laptops): the pill and
// its letters shrink until the whole pill fits on screen. 1080p desktop: 1.
function pillFit(vh: number) {
  return Math.min(1, (vh - 110) / PILL_H)
}
export function ProjectsOutro() {
  const sectionRef = useRef<HTMLElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<SVGPathElement>(null)
  const borderRef = useRef<SVGPathElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const decorRef = useRef<HTMLDivElement>(null)
  const decorLabelsRef = useRef<HTMLDivElement>(null)

  const [vp, setVp] = useState({ w: 1920, h: 1080 })

  useEffect(() => {
    const update = () =>
      setVp({ w: window.innerWidth, h: window.innerHeight })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Mouse parallax — two depth layers (mirrors ProjectsIntro)
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
    if (!sticky || !pill || !border || !text || !decor || !labels) return

    // A phone screen is already covered at 4×; starting from the desktop 36×
    // would keep it plain black for most of the scroll.
    const startScale = window.innerWidth < 768 ? 4 : MAX_SCALE

    const update = (self: ScrollTrigger) => {
      const p = self.progress
      // Inverse of the entry zoom — pill scales from startScale down to 1
      // with ease-out so the bulk of the shrink happens early.
      const eased = 1 - (1 - p) * (1 - p)
      const scale = startScale - eased * (startScale - 1)
      const fit = pillFit(window.innerHeight)
      const newW = PILL_W * fit * scale
      const newH = PILL_H * fit * scale
      const d = buildPillPath(
        window.innerWidth,
        window.innerHeight,
        newW,
        newH,
      )
      pill.setAttribute('d', d)
      border.setAttribute('d', d)

      // WORKS letters mirror the pill: start huge (matching pill scale,
      // invisible inside the all-black field), shrink back with the pill,
      // and fade in over the second half of progress.
      text.style.transform = `translate(-50%, -50%) scale(${scale})`
      text.style.opacity = String(Math.max(0, (p - 0.4) / 0.6))

      // Decor (rotating ring + axes + labels) fades in as the pill shrinks
      // and the white field around it reveals.
      const decorOpacity = String(Math.max(0, (p - 0.3) / 0.7))
      decor.style.opacity = decorOpacity
      labels.style.opacity = decorOpacity
    }

    // Desktop: the pin starts while the last cards still fly over the pulled-up
    // section, so the shrink can run during the pin alone. Phones have no such
    // overlap: the shrink starts as soon as the section enters (top at the
    // screen bottom) and ends with the pin, so no empty black screen scrolls by.
    const mobile = window.innerWidth < 768
    const pinTrigger = ScrollTrigger.create({
      trigger: sticky,
      start: 'top top',
      end: '+=120%',
      pin: true,
      pinSpacing: true,
      invalidateOnRefresh: true,
      ...(mobile ? {} : { scrub: 0.5, onUpdate: update }),
    })
    const enterTrigger = mobile
      ? ScrollTrigger.create({
          trigger: sectionRef.current,
          start: 'top bottom',
          end: () => `+=${window.innerHeight * (1 + 1.2)}`,
          invalidateOnRefresh: true,
          onUpdate: update,
          onRefresh: update,
        })
      : null

    return () => {
      pinTrigger.kill()
      enterTrigger?.kill()
    }
  }, [])

  const fit = pillFit(vp.h)
  const pillW = PILL_W * fit
  const pillH = PILL_H * fit

  // Initial render: pill at MAX_SCALE so the section visually continues the
  // all-black state from Projects until pin engages and the shrink begins.
  const initialD = buildPillPath(
    vp.w,
    vp.h,
    pillW * MAX_SCALE,
    pillH * MAX_SCALE,
  )

  // Decor geometry — derived from natural pill position (i.e., end-state)
  const cx = vp.w / 2
  const cy = vp.h / 2 + Y_OFFSET
  const pillLeft = cx - pillW / 2
  const pillRight = cx + pillW / 2
  const pillTop = cy - pillH / 2
  const pillBottom = cy + pillH / 2
  // Safe zones — keep decor anchored to pill edges from running past the
  // sticky's clipped bounds on smaller viewports.
  const pillTopSafe = Math.max(pillTop, 30)
  const pillBottomSafe = Math.min(pillBottom, vp.h - 30)

  const NAV_CLEARANCE = 96
  const BOTTOM_CLEARANCE = 40
  const maxRadius = Math.min(cy - NAV_CLEARANCE, vp.h - cy - BOTTOM_CLEARANCE)
  const ringOuterR = Math.min(pillH * 0.85, maxRadius)
  const ringMidR = Math.min(pillH * 0.7, maxRadius - 18)
  const ringInnerR = Math.min(pillH * 0.56, maxRadius - 36)

  return (
    <section
      ref={sectionRef}
      // Overlaps the end of the card flight on desktop only (see Projects).
      className="relative bg-[var(--color-fg)] md:-mt-[48vh]"
    >
      <div
        ref={stickyRef}
        className="relative h-screen w-full overflow-hidden bg-[var(--color-fg)]"
      >
        {/* Pill + mask + border — same setup as ProjectsIntro but reversed
            via the onUpdate. White field, pill cutout reveals dark bg through. */}
        <svg
          className="absolute inset-0"
          width={vp.w}
          height={vp.h}
          viewBox={`0 0 ${vp.w} ${vp.h}`}
        >
          <defs>
            <mask id="pill-zoom-out-mask">
              <rect width={vp.w} height={vp.h} fill="white" />
              <path ref={pillRef} d={initialD} fill="black" />
            </mask>
          </defs>

          <rect
            width={vp.w}
            height={vp.h}
            fill="var(--color-bg)"
            mask="url(#pill-zoom-out-mask)"
          />

          <path
            ref={borderRef}
            d={initialD}
            fill="none"
            stroke="var(--color-fg)"
            strokeWidth="1.5"
          />
        </svg>

        {/* Decor layer A — SVG geometric astro-theme (deeper parallax) */}
        <div
          ref={decorRef}
          aria-hidden
          className="absolute inset-0 pointer-events-none will-change-transform"
          style={{ opacity: 0 }}
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
            {Array.from({ length: Math.floor((pillLeft - 60) / 60) }).map(
              (_, i) => {
                const x = pillLeft - 60 - (i + 1) * 60
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
            {Array.from({
              length: Math.floor((vp.w - pillRight - 60) / 60),
            }).map((_, i) => {
              const x = pillRight + 60 + (i + 1) * 60
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
            })}

            {/* Vertical guide below pill */}
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
              y2={cy - pillH * 0.3}
              stroke="var(--color-fg)"
              strokeOpacity="0.22"
              strokeWidth="1"
            />
            <line
              x1={vp.w - 40}
              y1="40"
              x2={pillRight + 100}
              y2={cy - pillH * 0.3}
              stroke="var(--color-fg)"
              strokeOpacity="0.22"
              strokeWidth="1"
            />
            <line
              x1="40"
              y1={vp.h - 40}
              x2={pillLeft - 100}
              y2={cy + pillH * 0.3}
              stroke="var(--color-fg)"
              strokeOpacity="0.22"
              strokeWidth="1"
            />
            <line
              x1={vp.w - 40}
              y1={vp.h - 40}
              x2={pillRight + 100}
              y2={cy + pillH * 0.3}
              stroke="var(--color-fg)"
              strokeOpacity="0.22"
              strokeWidth="1"
            />

            {/* Crosshair markers at endpoints of diagonals */}
            {[
              { x: pillLeft - 100, y: cy - pillH * 0.3 },
              { x: pillRight + 100, y: cy - pillH * 0.3 },
              { x: pillLeft - 100, y: cy + pillH * 0.3 },
              { x: pillRight + 100, y: cy + pillH * 0.3 },
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
          style={{ opacity: 0 }}
        >
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

          <div
            className="absolute font-mono text-[0.65rem] uppercase tracking-[0.3em] text-[var(--color-fg)]/65 -translate-x-1/2"
            style={{ left: cx, top: 56 }}
          >
            section / end
          </div>


          <div className="absolute hidden md:block top-6 left-12 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-fg)]/55">
            [ 04 ]&nbsp;&nbsp;chapter
          </div>
          <div className="absolute hidden md:block top-6 right-12 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-fg)]/55">
            05 / projects
          </div>
          <div className="absolute hidden md:block bottom-6 left-12 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-fg)]/45">
            lat.55.751 / lon.37.617
          </div>
          <div className="absolute hidden md:block bottom-6 right-12 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-fg)]/45">
            v.1.0&nbsp;&nbsp;·&nbsp;&nbsp;portfolio
          </div>
        </div>

        {/* WORKS letters — start huge (matching pill scale, invisible against
            the all-black field), shrink with pill, fade in as it settles. */}
        <div
          ref={textRef}
          className="absolute left-1/2 z-10 pointer-events-none will-change-transform flex flex-col items-center"
          style={{
            top: `calc(50% + ${Y_OFFSET}px)`,
            transform: `translate(-50%, -50%) scale(${MAX_SCALE})`,
            opacity: 0,
          }}
        >
          {LETTERS.map((l) => (
            <span
              key={l}
              className="block font-extrabold tracking-[-0.04em] leading-[0.9] text-[var(--color-bg)]"
              style={{ fontSize: `${LETTER_FONT * fit}px` }}
            >
              {l}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
