import { useEffect, useLayoutEffect, useRef } from 'react'
import { siGithub, siTelegram } from 'simple-icons'
import { gsap, ScrollTrigger } from '../../lib/gsap'

// Background tone of the cut-out portrait after B/W processing — the hero
// background must match it so the leftover halo around the hair disappears.
const HERO_BG = '#EDEDED'

const NAME = 'Dmitry Tyusin'

// Contacts listed like a register map.
// Envelope drawn on the same 24×24 grid as the simple-icons brand paths.
const MAIL_PATH =
    'M2 5.5A1.5 1.5 0 0 1 3.5 4h17A1.5 1.5 0 0 1 22 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 18.5zm2.2.5L12 11.6 19.8 6zM4 7.9V18h16V7.9l-8 5.7z'

const SOCIAL = [
    { href: 'https://github.com/Dimopster', label: 'github', icon: siGithub.path },
    { href: 'https://t.me/Dimopster', label: 'telegram', icon: siTelegram.path },
    { href: 'mailto:tyusindima@gmail.com', label: 'email', icon: MAIL_PATH },
]

const PROMPT = '> dmitry@tyusin:~$'
const COMMAND = './software_engineer --lang='
const ARG = 'c,c++'

const toHex = (ch: string) => ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')
const randomHex = () =>
    Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0')

// Scales the font so the widest visible [data-line] fills the element edge to edge.
function useFitText(ref: React.RefObject<HTMLElement | null>) {
    useLayoutEffect(() => {
        const el = ref.current
        if (!el) return

        const fit = () => {
            el.style.fontSize = '100px'
            const lines = el.querySelectorAll<HTMLElement>('[data-line]')
            const widest = Math.max(...Array.from(lines, (l) => l.offsetWidth))
            if (widest > 0) el.style.fontSize = `${(100 * el.clientWidth) / widest}px`
        }

        fit()
        document.fonts.ready.then(fit)
        const ro = new ResizeObserver(fit)
        ro.observe(el)
        return () => ro.disconnect()
    }, [ref])
}

// The word's letters plus its ASCII bytes as an evenly spaced hex-dump row laid
// over it (letters can be narrower than a byte, so bytes are not per-letter).
// Glyph i and byte i share an index. Letter spans stay inline to keep kerning.
function ByteWord({ word }: { word: string }) {
    const chars = Array.from(word)
    return (
        <>
            {chars.map((ch, i) => (
                <span key={i} data-glyph>
                    {ch}
                </span>
            ))}
            <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between font-mono text-[0.2em] font-medium tracking-normal leading-none">
                {chars.map((ch, i) => (
                    <span key={i} data-hex={toHex(ch)} className="opacity-0">
                        {toHex(ch)}
                    </span>
                ))}
            </span>
        </>
    )
}

export function Hero() {
    const sectionRef = useRef<HTMLElement>(null)
    const portraitRef = useRef<HTMLDivElement>(null)
    const nameRef = useRef<HTMLHeadingElement>(null)
    const cornersRef = useRef<HTMLDivElement>(null)
    const roleRef = useRef<HTMLParagraphElement>(null)

    useFitText(nameRef)

    useEffect(() => {
        const section = sectionRef.current
        const name = nameRef.current
        const role = roleRef.current
        if (!section || !name || !role) return

        const glyphs = name.querySelectorAll<HTMLElement>('[data-glyph]')
        const hexes = name.querySelectorAll<HTMLElement>('[data-hex]')
        const typeLines = role.querySelectorAll<HTMLElement>('[data-type]')
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

        gsap.set(portraitRef.current, { opacity: 0, y: 40 })
        gsap.set(cornersRef.current, { opacity: 0 })
        gsap.set(glyphs, { opacity: 0 })
        gsap.set(hexes, { opacity: 1 })
        gsap.set(typeLines, { width: '0ch' })

        const intro = gsap.timeline({ delay: 0.1 })
        intro.to(portraitRef.current, { opacity: 1, y: 0, duration: 1.4, ease: 'power3.out' })

        // Name boots as a hex dump: every byte flickers through random values,
        // settles on its real ASCII code, then decodes into the letter.
        hexes.forEach((hex, i) => {
            const at = 0.4 + i * 0.06
            const counter = { t: 0 }
            intro.to(
                counter,
                {
                    t: 1,
                    duration: reduced ? 0 : 0.7,
                    ease: 'none',
                    onUpdate: () => {
                        hex.textContent = counter.t < 0.75 ? randomHex() : hex.dataset.hex!
                    },
                },
                at,
            )
            intro.to(hex, { opacity: 0, duration: 0.35, ease: 'power2.out' }, at + 0.75)
            intro.to(glyphs[i], { opacity: 1, duration: 0.35, ease: 'power2.out' }, at + 0.75)
        })

        // The role line is typed like a shell command (monospace, so ch = 1 char).
        typeLines.forEach((line) => {
            const n = line.textContent!.length
            intro.to(line, { width: `${n}ch`, duration: reduced ? 0 : n * 0.035, ease: `steps(${n})` })
        })
        intro.to(cornersRef.current, { opacity: 1, duration: 0.8, ease: 'power2.out' }, '<')

        // Hovering a word shows its bytes again.
        const words = name.querySelectorAll<HTMLElement>('[data-line]')
        const cleanups: (() => void)[] = []
        words.forEach((word) => {
            const wordGlyphs = word.querySelectorAll('[data-glyph]')
            const wordHexes = word.querySelectorAll('[data-hex]')
            const show = () => {
                if (intro.isActive()) return
                gsap.to(wordGlyphs, { opacity: 0.12, duration: 0.3, stagger: 0.03, overwrite: true })
                gsap.to(wordHexes, { opacity: 1, duration: 0.3, stagger: 0.03, overwrite: true })
            }
            const hide = () => {
                if (intro.isActive()) return
                gsap.to(wordGlyphs, { opacity: 1, duration: 0.4, stagger: 0.03, overwrite: true })
                gsap.to(wordHexes, { opacity: 0, duration: 0.4, stagger: 0.03, overwrite: true })
            }
            word.addEventListener('mouseenter', show)
            word.addEventListener('mouseleave', hide)
            cleanups.push(() => {
                word.removeEventListener('mouseenter', show)
                word.removeEventListener('mouseleave', hide)
            })
        })

        // Parallax on portrait — moves slower than the rest of the page on scroll
        const parallaxTrigger = ScrollTrigger.create({
            trigger: section,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.5,
            onUpdate: (self) => {
                gsap.to(portraitRef.current, {
                    yPercent: self.progress * -8,
                    duration: 0.3,
                    overwrite: 'auto',
                    ease: 'power1.out',
                })
            },
        })

        return () => {
            intro.kill()
            parallaxTrigger.kill()
            cleanups.forEach((fn) => fn())
        }
    }, [])

    return (
        <section
            ref={sectionRef}
            className="relative isolate h-svh min-h-[560px] overflow-hidden"
            style={{ background: HERO_BG }}
        >
            {/* Portrait is anchored by height so the name always crosses the face.
                Image is 1 : 1.33; the head centre sits at 44% of its width. */}
            <div
                ref={portraitRef}
                id="hero-portrait"
                className="absolute left-[calc(50%-43svh)] top-[18svh] h-[130svh] md:left-[calc(50%-51svh-60px)] md:top-[8svh] md:h-[155svh] will-change-transform"
            >
                <picture>
                    <source media="(min-width: 768px)" srcSet="/hero/portrait-2000.webp" />
                    <img
                        src="/hero/portrait-1000.webp"
                        alt="Дмитрий Тюсин"
                        className="h-full w-auto max-w-none select-none"
                        draggable={false}
                    />
                </picture>
            </div>

            {/* Everything below is white + difference: dark on the grey background,
                light on the dark jacket and hair. */}
            {/* Mobile: the name and the links share one column between the role
                line and the Ornament wave. The spacer aims the name at 46svh (across
                the face) but shrinks on short screens (Safari with its toolbars), so
                the links can never ride up over the name. On desktop the column
                dissolves (md:contents) and both blocks are positioned on the section. */}
            <div className="pointer-events-none absolute inset-x-6 top-[150px] bottom-[72px] flex flex-col md:contents">
            <div aria-hidden className="shrink basis-[calc(46svh-150px)] md:hidden" />
            {/* Mobile: two stacked lines across the face. Desktop: the h1 is the
                full-height left half, so the fitted lines are half-width; "Tyusin"
                sits top-right starting at the page centre, "Dmitry" bottom-left.
                136px bottom offsets keep text clear of the Ornament wave.
                Only the words take the pointer (for the hover), not the whole box. */}
            <h1
                ref={nameRef}
                aria-label={NAME}
                className="pointer-events-none relative shrink-0 md:absolute md:inset-y-0 md:left-10 md:right-1/2 font-medium leading-[0.82] tracking-[-0.055em] text-white mix-blend-difference whitespace-nowrap"
            >
                <span
                    data-line
                    aria-hidden
                    className="pointer-events-auto relative block w-fit ml-auto md:absolute md:top-[84px] md:left-full md:ml-0"
                >
                    <ByteWord word="Tyusin" />
                </span>
                <span
                    data-line
                    aria-hidden
                    className="pointer-events-auto relative block w-fit md:absolute md:bottom-[136px] md:left-0"
                >
                    <ByteWord word="Dmitry" />
                </span>
            </h1>

            <div
                ref={cornersRef}
                className="pointer-events-auto mt-7 shrink-0 self-end text-white mix-blend-difference md:absolute md:right-10 md:bottom-0 md:mt-0 md:pb-[136px]"
            >
                <ul className="flex flex-col gap-2 font-mono [font-variant-ligatures:none]">
                    {SOCIAL.map((s, i) => (
                        <li key={s.label}>
                            <a
                                href={s.href}
                                target={s.href.startsWith('http') ? '_blank' : undefined}
                                rel="noreferrer"
                                className="flex items-baseline gap-4 text-base md:text-lg font-medium hover:opacity-60 transition-opacity"
                            >
                                <span className="opacity-50">{`0x${i.toString(16).padStart(2, '0').toUpperCase()}`}</span>
                                <span className="flex items-center gap-2.5">
                                    {s.label}
                                    <svg viewBox="0 0 24 24" aria-hidden className="h-[0.95em] w-[0.95em] fill-current">
                                        <path d={s.icon} fillRule="evenodd" />
                                    </svg>
                                </span>
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
            </div>

            <p
                ref={roleRef}
                aria-label={`${PROMPT} ${COMMAND}${ARG}`}
                className="absolute left-6 top-[100px] md:left-10 md:top-[124px] font-mono font-medium [font-variant-ligatures:none] leading-[1.5] text-[clamp(0.95rem,1.55vw,1.75rem)] text-white mix-blend-difference"
            >
                <span data-type aria-hidden className="block overflow-hidden whitespace-nowrap opacity-60">
                    {PROMPT}
                </span>
                <span className="flex items-center" aria-hidden>
                    <span data-type className="inline-block overflow-hidden whitespace-nowrap">
                        {COMMAND}
                        <span className="font-extrabold">{ARG}</span>
                    </span>
                    <span className="ml-[0.15em] inline-block h-[1.1em] w-[0.6em] bg-white animate-[caret-blink_1s_steps(1)_infinite]" />
                </span>
            </p>
        </section>
    )
}
