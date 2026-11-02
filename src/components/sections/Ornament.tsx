import { useEffect, useRef, useState } from 'react'
import { gsap } from '../../lib/gsap'

// White wavy "tunnel" overlaid on the Hero/Services boundary, with a binary
// stream (0/1) flowing along its midline like a snake. The host section is
// 0-height so the ornament does not add scroll — the SVG simply overlaps
// the bottom of Hero and the top of Services.

const HEIGHT = 220 // SVG canvas height; half above, half below boundary
const PERIODS = 2
const AMP = 42
const TUNNEL_GAP = 90
const STROKE_WIDTH = 1.6

// Phones: one period with a smaller amplitude and gap, so the slope matches
// the desktop wave instead of being five times steeper, and the tunnel stays
// within ~50px of the boundary (clear of the hero links and the About label).
const MOBILE_PERIODS = 1
const MOBILE_AMP = 18
const MOBILE_TUNNEL_GAP = 60

// Binary pattern long enough to cover wide viewports comfortably. Period is
// 4 chars ("0 1 ") so a single-pattern shift yields a seamless loop.
const BINARY_PATTERN = '0 1 0 1 1 0 1 0 0 1 1 1 0 1 0 0 '
const BINARY_STREAM = BINARY_PATTERN.repeat(40)

function buildSinePath(
  vw: number,
  baseY: number,
  amp: number,
  periods: number,
) {
  const steps = Math.max(180, Math.round(periods * 80))
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = t * vw
    const y = baseY + amp * Math.sin(t * Math.PI * 2 * periods)
    pts.push(
      i === 0
        ? `M ${x.toFixed(2)} ${y.toFixed(2)}`
        : `L ${x.toFixed(2)} ${y.toFixed(2)}`,
    )
  }
  return pts.join(' ')
}

function buildClosedTunnelPath(
  vw: number,
  topY: number,
  bottomY: number,
  amp: number,
  periods: number,
) {
  const steps = Math.max(180, Math.round(periods * 80))
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = t * vw
    const y = topY + amp * Math.sin(t * Math.PI * 2 * periods)
    pts.push(
      i === 0
        ? `M ${x.toFixed(2)} ${y.toFixed(2)}`
        : `L ${x.toFixed(2)} ${y.toFixed(2)}`,
    )
  }
  for (let i = steps; i >= 0; i--) {
    const t = i / steps
    const x = t * vw
    const y = bottomY + amp * Math.sin(t * Math.PI * 2 * periods)
    pts.push(`L ${x.toFixed(2)} ${y.toFixed(2)}`)
  }
  pts.push('Z')
  return pts.join(' ')
}

export function Ornament() {
  const [vw, setVw] = useState(1920)
  const textPathRef = useRef<SVGTextPathElement>(null)
  const textRef = useRef<SVGTextElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const portraitRef = useRef<SVGImageElement>(null)

  // The hero portrait continues through the tunnel: a copy of it, clipped to
  // the tunnel, is kept aligned with the original every tick so it follows the
  // hero parallax and intro fade. Positions are relative, so scroll cancels out.
  // The original is looked up on every tick: the Hero DOM can be re-created
  // (e.g. hot reload), and a cached reference would point at a detached node.
  useEffect(() => {
    const svg = svgRef.current
    const copy = portraitRef.current
    if (!svg || !copy) return

    const sync = () => {
      const wrap = document.getElementById('hero-portrait')
      const img = wrap?.querySelector('img')
      if (!wrap || !img) return
      const s = svg.getBoundingClientRect()
      if (s.bottom < 0 || s.top > window.innerHeight) return
      const r = img.getBoundingClientRect()
      if (img.currentSrc && copy.getAttribute('href') !== img.currentSrc) {
        copy.setAttribute('href', img.currentSrc)
      }
      copy.setAttribute('x', String(r.left - s.left))
      copy.setAttribute('y', String(r.top - s.top))
      copy.setAttribute('width', String(r.width))
      copy.setAttribute('height', String(r.height))
      copy.style.opacity = getComputedStyle(wrap).opacity
    }

    gsap.ticker.add(sync)
    return () => gsap.ticker.remove(sync)
  }, [])

  useEffect(() => {
    const update = () => setVw(window.innerWidth)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Continuously slide the text along the path. The shift must equal exactly
  // one BINARY_PATTERN width — иначе на стыке цикла будет визуальный прыжок.
  // Раньше было захардкожено 92px, но реальная ширина зависит от шрифта и
  // масштаба, поэтому замеряем через getSubStringLength после загрузки fonts.
  useEffect(() => {
    const tp = textPathRef.current
    const text = textRef.current
    if (!tp || !text) return

    let tween: gsap.core.Tween | undefined

    const start = () => {
      const patternWidth = text.getSubStringLength(0, BINARY_PATTERN.length)
      // На скорости ~15px/sec — duration пропорциональна ширине pattern.
      const duration = patternWidth / 15
      tween = gsap.fromTo(
        tp,
        { attr: { startOffset: 0 } },
        {
          attr: { startOffset: -patternWidth },
          duration,
          ease: 'none',
          repeat: -1,
        },
      )
    }

    if (document.fonts && document.fonts.status !== 'loaded') {
      document.fonts.ready.then(start)
    } else {
      start()
    }

    return () => {
      tween?.kill()
    }
  }, [vw])

  const mobile = vw < 768
  const periods = mobile ? MOBILE_PERIODS : PERIODS
  const amp = mobile ? MOBILE_AMP : AMP
  const gap = mobile ? MOBILE_TUNNEL_GAP : TUNNEL_GAP

  const centreY = HEIGHT / 2
  const topY = centreY - gap / 2
  const bottomY = centreY + gap / 2

  const tunnel = buildClosedTunnelPath(vw, topY, bottomY, amp, periods)
  const topPath = buildSinePath(vw, topY, amp, periods)
  const bottomPath = buildSinePath(vw, bottomY, amp, periods)
  const midPath = buildSinePath(vw, centreY, amp, periods)

  return (
    <section
      aria-hidden
      className="relative w-full h-0 z-20 pointer-events-none"
      style={{ overflow: 'visible' }}
    >
      <svg
        ref={svgRef}
        className="absolute left-0"
        style={{ top: -HEIGHT / 2 }}
        width={vw}
        height={HEIGHT}
        viewBox={`0 0 ${vw} ${HEIGHT}`}
        preserveAspectRatio="none"
      >
        <defs>
          {/* Midline path — invisible, used as the rail for the binary text */}
          <path id="ornament-midline" d={midPath} />
          <clipPath id="ornament-tunnel-clip">
            <path d={tunnel} />
          </clipPath>
        </defs>

        {/* White fill of the tunnel */}
        <path d={tunnel} fill="var(--color-bg)" />

        {/* Hero portrait continued inside the tunnel (positioned by the sync effect) */}
        <image
          ref={portraitRef}
          clipPath="url(#ornament-tunnel-clip)"
          preserveAspectRatio="none"
        />

        {/* Outline curves */}
        <path
          d={topPath}
          fill="none"
          stroke="var(--color-fg)"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
        />
        <path
          d={bottomPath}
          fill="none"
          stroke="var(--color-fg)"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
        />

        {/* Binary stream — text rendered along the midline curve. White +
            difference: grey on the white fill, light where it crosses the jacket. */}
        <text
          ref={textRef}
          fontFamily="var(--font-mono)"
          fontSize="11"
          fill="#FFFFFF"
          fillOpacity="0.7"
          letterSpacing="0.08em"
          dominantBaseline="middle"
          style={{ fontVariationSettings: "'wght' 500", mixBlendMode: 'difference' }}
        >
          <textPath
            ref={textPathRef}
            href="#ornament-midline"
            startOffset="0"
          >
            {BINARY_STREAM}
          </textPath>
        </text>
      </svg>
    </section>
  )
}
