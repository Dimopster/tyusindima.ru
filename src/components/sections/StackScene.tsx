import { useEffect, useRef, useState } from 'react'
import { siApple, siQemu, siStmicroelectronics } from 'simple-icons'
import { gsap, ScrollTrigger } from '../../lib/gsap'

// Dark scene after «Обо мне»: a full-screen generated picture with the stack's
// logos circling in the plane of the screen (a flat circle, no depth).
//
// The picture comes in two layers: the full image, then the logos, then a
// cut-out of the person on top — where the circle crosses the figure, the
// logos slip behind it and come out on the other side. The section pins while
// the title types itself out on scroll, the same way as «Избранные работы».

const BG = '#0A0A0A'
const REVOLUTION = 60 // seconds per full turn
const LINE_1 = 'Мой'
const LINE_2 = 'стек'

// Coloured logos from devicon live in /public/stack. Brands devicon lacks (or
// whose colours vanish on black) are drawn from simple-icons in a light tint.
// `note` is the code-comment caption shown under a logo on hover.
type Logo = { title: string; note: string } & ({ src: string } | { path: string; color: string })

const LOGOS: Logo[] = [
    { title: 'C', note: 'язык', src: '/stack/c.svg' },
    { title: 'C++', note: 'язык', src: '/stack/cplusplus.svg' },
    { title: 'Qt', note: 'gui', src: '/stack/qt.svg' },
    { title: 'CMake', note: 'сборка', src: '/stack/cmake.svg' },
    { title: 'STM32', note: 'mcu', path: siStmicroelectronics.path, color: '#3CB4E6' },
    { title: 'QEMU', note: 'эмуляция', path: siQemu.path, color: `#${siQemu.hex}` },
    { title: 'Linux', note: 'ос', src: '/stack/linux.svg' },
    { title: 'macOS', note: 'ос', path: siApple.path, color: '#FFFFFF' },
    { title: 'Git', note: 'контроль версий', src: '/stack/git.svg' },
    { title: 'GitHub Actions', note: 'ci/cd', src: '/stack/githubactions.svg' },
    { title: 'Docker', note: 'контейнеры', src: '/stack/docker.svg' },
    { title: 'SQLite', note: 'бд', src: '/stack/sqlite.svg' },
    { title: 'PostgreSQL', note: 'бд', src: '/stack/postgresql.svg' },
    { title: 'MongoDB', note: 'nosql', src: '/stack/mongodb.svg' },
]

// Where the circle sits on the picture, as fractions of the image: centred on
// the figure's torso so its lower arc runs behind the seated body. The mobile
// file is a 9:16 crop centred on the figure, hence the different x.
const FIGURE_Y = 0.54
const RADIUS = 0.36 // of the displayed image height
const figureX = (naturalWidth: number) => (naturalWidth < 1500 ? 0.5 : 0.496)

export function StackScene() {
    const stickyRef = useRef<HTMLDivElement>(null)
    const titleRef = useRef<HTMLDivElement>(null)
    const eyebrowRef = useRef<HTMLParagraphElement>(null)
    const caretRef = useRef<HTMLSpanElement>(null)
    const charsRef = useRef<(HTMLSpanElement | null)[]>([])
    const logosRef = useRef<(HTMLDivElement | null)[]>([])
    const imgRef = useRef<HTMLImageElement>(null)
    const fgRef = useRef<HTMLImageElement>(null)
    const [photo, setPhoto] = useState(true)
    // Hovered logo: the ring brakes to a stop, the rest dim, it shows its caption.
    const [hovered, setHovered] = useState<number | null>(null)
    const hoveredRef = useRef<number | null>(null)

    // Pin + scroll typewriter.
    useEffect(() => {
        const sticky = stickyRef.current
        const title = titleRef.current
        if (!sticky || !title) return

        const trigger = ScrollTrigger.create({
            trigger: sticky,
            start: 'top top',
            end: '+=120%',
            pin: true,
            pinSpacing: true,
            scrub: 0.5,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
                // Typing takes the first 70% of the pin, the rest is a pause
                // to look at the stack before the page moves on.
                const p = Math.min(1, self.progress / 0.7)
                title.style.opacity = p > 0 ? '1' : '0'

                const eyebrow = eyebrowRef.current
                if (eyebrow) {
                    const eyeP = Math.min(1, p / 0.18)
                    eyebrow.style.opacity = String(eyeP)
                    eyebrow.style.transform = `translateY(${(1 - eyeP) * 8}px)`
                }

                const chars = charsRef.current
                const typeP = Math.min(1, Math.max(0, (p - 0.18) / 0.82))
                const visible = Math.floor(typeP * (chars.length + 0.5))
                chars.forEach((el, i) => {
                    if (el) el.style.opacity = i < visible ? '1' : '0'
                })

                const caret = caretRef.current
                if (caret) caret.style.opacity = typeP > 0 && typeP < 1 ? '1' : '0'
            },
        })

        return () => trigger.kill()
    }, [])

    // Flat circle: every logo keeps its size and stays upright, only its
    // position moves along the circle.
    useEffect(() => {
        const sticky = stickyRef.current
        if (!sticky) return

        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        let angle = -Math.PI / 2
        let speed = 1
        // Alpha of the cut-out, downscaled: tells whether a point of the picture
        // is covered by the figure. Rebuilt when the cut-out's source changes.
        let mask: { src: string; data: Uint8ClampedArray; w: number; h: number } | null = null
        const covered = (fx: number, fy: number) => {
            const fg = fgRef.current
            if (!fg?.naturalWidth) return false
            if (mask?.src !== fg.currentSrc) {
                const mw = 200
                const mh = Math.round((mw * fg.naturalHeight) / fg.naturalWidth)
                const ctx = Object.assign(document.createElement('canvas'), { width: mw, height: mh }).getContext('2d')
                if (!ctx) return false
                ctx.drawImage(fg, 0, 0, mw, mh)
                mask = { src: fg.currentSrc, data: ctx.getImageData(0, 0, mw, mh).data, w: mw, h: mh }
            }
            const x = Math.floor(fx * mask.w)
            const y = Math.floor(fy * mask.h)
            if (x < 0 || y < 0 || x >= mask.w || y >= mask.h) return false
            return mask.data[(y * mask.w + x) * 4 + 3] > 128
        }

        const tick = (_time: number, deltaMs: number) => {
            const dt = deltaMs / 1000
            speed += ((hoveredRef.current === null ? 1 : 0) - speed) * Math.min(1, dt * 5)
            if (!reduced) angle += ((Math.PI * 2) / REVOLUTION) * speed * dt
            const w = sticky.clientWidth
            const h = sticky.clientHeight
            let cx = w / 2
            let cy = h * 0.56
            let r = Math.min(h * 0.32, w * 0.4)
            let toImage: ((x: number, y: number) => [number, number]) | null = null
            // Follow the figure through object-cover's scaling and cropping.
            const img = imgRef.current
            if (img?.naturalWidth) {
                const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight)
                const iw = img.naturalWidth * scale
                const ih = img.naturalHeight * scale
                cx = (w - iw) / 2 + figureX(img.naturalWidth) * iw
                cy = (h - ih) / 2 + FIGURE_Y * ih
                r = Math.min(RADIUS * ih, w * 0.44)
                toImage = (x, y) => [(x - (w - iw) / 2) / iw, (y - (h - ih) / 2) / ih]
            }
            // Read the refs every tick, so the ring always spaces exactly the
            // logos that are rendered (a list edit or hot reload can't leave a gap).
            const logos = logosRef.current.filter((el): el is HTMLDivElement => el?.isConnected === true)
            logos.forEach((el, i) => {
                const a = angle + (i / logos.length) * Math.PI * 2
                const x = cx + Math.cos(a) * r
                const y = cy + Math.sin(a) * r
                el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`
                // A logo behind the figure is out of sight, so it can't be hovered.
                el.style.pointerEvents = toImage && covered(...toImage(x, y)) ? 'none' : ''
            })
        }

        gsap.ticker.add(tick)
        return () => gsap.ticker.remove(tick)
    }, [])

    let charIndex = 0
    const typed = (text: string) =>
        Array.from(text).map((c) => {
            const i = charIndex++
            return (
                <span
                    key={i}
                    ref={(el) => {
                        charsRef.current[i] = el
                    }}
                    style={{ opacity: 0 }}
                >
                    {c}
                </span>
            )
        })

    return (
        <section id="stack" className="relative" style={{ background: BG }}>
            <div ref={stickyRef} className="relative isolate h-screen w-full overflow-hidden" style={{ background: BG }}>
                                {photo ? (
                    <>
                        <picture>
                            <source media="(min-width: 768px)" srcSet="/scene/stack-2000.webp" />
                            <img
                                ref={imgRef}
                                src="/scene/stack-1000.webp"
                                alt=""
                                onError={() => setPhoto(false)}
                                className="absolute inset-0 h-full w-full object-cover select-none"
                                draggable={false}
                            />
                        </picture>
                        {/* The picture's top is a touch darker than the page black. */}
                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-x-0 top-0 h-[25%]"
                            style={{ background: `linear-gradient(${BG}, transparent)` }}
                        />
                        <picture>
                            <source media="(min-width: 768px)" srcSet="/scene/stack-fg-2000.webp" />
                            <img
                                ref={fgRef}
                                src="/scene/stack-fg-1000.webp"
                                alt=""
                                aria-hidden
                                className="absolute inset-0 z-20 h-full w-full object-cover select-none pointer-events-none"
                                draggable={false}
                            />
                        </picture>
                        {/* The bottom fades to black like the top, above the cut-out
                            too, so the scene ends softly instead of on a hard edge. */}
                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[45%]"
                            style={{ background: `linear-gradient(transparent, ${BG})` }}
                        />
                    </>
                ) : (
                    <div
                        aria-hidden
                        className="absolute inset-0 flex items-end justify-center pb-[10vh] font-mono text-xs uppercase tracking-[0.2em] text-white/30"
                        style={{ background: `linear-gradient(to bottom, ${BG} 30%, #2a0d1c 100%)` }}
                    >
                        [ фото ]
                    </div>
                )}

                <div className="relative z-10" aria-label="Стек: C, C++, Qt, CMake, STM32, QEMU, Linux, macOS, Git, CI/CD, Docker, SQLite, PostgreSQL, MongoDB">
                    {LOGOS.map((logo, i) => (
                        <div
                            key={logo.title}
                            ref={(el) => {
                                logosRef.current[i] = el
                            }}
                            onPointerEnter={() => {
                                hoveredRef.current = i
                                setHovered(i)
                            }}
                            onPointerLeave={() => {
                                hoveredRef.current = null
                                setHovered(null)
                            }}
                            className="absolute left-0 top-0 h-10 w-10 md:h-14 md:w-14 will-change-transform"
                        >
                            <div
                                className={`h-full w-full transition-[transform,opacity,filter] duration-300 ease-out ${
                                    hovered === i
                                        ? 'scale-[1.35] [filter:drop-shadow(0_0_14px_rgba(255,255,255,0.35))]'
                                        : 'scale-100 [filter:drop-shadow(0_2px_8px_rgba(0,0,0,0.6))]'
                                } ${hovered !== null && hovered !== i ? 'opacity-30' : 'opacity-100'}`}
                            >
                                {'src' in logo ? (
                                    <img src={logo.src} alt="" className="h-full w-full" draggable={false} />
                                ) : (
                                    <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden>
                                        <path d={logo.path} fill={logo.color} />
                                    </svg>
                                )}
                            </div>
                            {/* Caption sits in the logo's own layer, so it hides
                                behind the figure together with the logo. */}
                            <div
                                aria-hidden
                                className={`pointer-events-none absolute left-1/2 top-full mt-3 -translate-x-1/2 whitespace-nowrap text-center font-mono text-[0.7rem] leading-snug transition-[opacity,transform] duration-300 ease-out md:text-xs ${
                                    hovered === i ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
                                }`}
                            >
                                <span className="block font-semibold text-white">{logo.title}</span>
                                <span className="block text-white/50">// {logo.note}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div
                    ref={titleRef}
                    className="pointer-events-none absolute left-6 top-14 z-40 md:left-12 md:top-20"
                    style={{ opacity: 0 }}
                >
                    <p
                        ref={eyebrowRef}
                        className="mb-2 font-mono text-[0.7rem] uppercase tracking-[0.22em] text-white/60 md:mb-3"
                        style={{ opacity: 0, transform: 'translateY(8px)' }}
                    >
                        [ 02 ]&nbsp;&nbsp;технологии
                    </p>
                    <h2
                        aria-label={`${LINE_1} ${LINE_2}`}
                        className="font-extrabold tracking-[-0.035em] leading-[0.95] text-[clamp(2.25rem,6vw,5rem)] text-white"
                    >
                        <span aria-hidden className="block">
                            {typed(LINE_1)}
                        </span>
                        <span aria-hidden className="block text-white/45">
                            {typed(LINE_2)}
                            <span
                                ref={caretRef}
                                className="ml-2 inline-block h-[0.85em] w-[0.5ch] translate-y-[0.05em] bg-white/85 align-baseline"
                                style={{ opacity: 0 }}
                            />
                        </span>
                    </h2>
                </div>
            </div>
            {/* A stretch of plain black after the picture, so the scene has fully
                faded out before the next section arrives. */}
            <div aria-hidden className="h-[12vh]" />
        </section>
    )
}
