import { useEffect, useRef } from 'react'
import { gsap } from '../../lib/gsap'
import { ProjectScene } from '../ui/ProjectScene'
import type { SceneType } from '../ui/ProjectScene'

type Project = {
    scene: SceneType
    index: string
    title: string
    body: string
    tags: string[]
    href?: string
}

const PROJECTS: Project[] = [
    {
        scene: 'netanalyzer',
        index: '/01',
        title: 'NetAnalyzer – анализатор трафика',
        body: 'Захватывает пакеты с сетевого интерфейса или из pcap-файла, разбирает их по уровням от Ethernet до прикладных протоколов и ищет подозрительную активность по правилам.',
        tags: ['C++20', 'libpcap', 'CMake', 'Linux'],
        href: 'https://github.com/Dimopster/Network-Analyzer',
    },
    {
        scene: 'stm32',
        index: '/02',
        title: 'Система управления на STM32',
        body: 'Встраиваемая система для автоматического регулирования оборудования на промышленном объекте, обмен с приводами по Modbus RTU.',
        tags: ['C', 'STM32', 'Modbus RTU'],
    },
    {
        scene: 'qemu',
        index: '/03',
        title: 'PCI-устройство в QEMU',
        body: 'Виртуальное PCI-устройство и драйвер к нему: генерирует прерывания с точными интервалами, чтобы тестировать системное ПО без настоящего железа.',
        tags: ['C', 'QEMU', 'PCI', 'Драйверы'],
    },
    {
        scene: 'logging',
        index: '/04',
        title: 'Логирование и трекинг ошибок',
        body: 'Отказоустойчивый логгер на C: при сбое сохраняет время, причину и цепочку вызовов. К нему – модуль отслеживания ошибок, который подключается к другим C/C++ проектам.',
        tags: ['C', 'C++', 'CMocka', 'Catch2'],
    },
    {
        scene: 'qt',
        index: '/05',
        title: 'Миграция с MFC на Qt',
        body: 'Перенос legacy-приложения с MFC на Qt: интерфейс и логика переехали на кроссплатформенный фреймворк, и приложение больше не привязано к Windows.',
        tags: ['C++', 'Qt', 'MFC'],
    },
]

// Per-card flight traits — dy is the card's vertical lane during its sweep
// across the viewport; rot is its baseline tilt. Cards drift their rotation
// slightly while crossing so they don't feel rigid.
const FLIGHT = [
    { dy: 28, rot: -6 },
    { dy: -12, rot: 4 },
    { dy: -22, rot: -3 },
    { dy: 24, rot: 5 },
    { dy: -8, rot: -5 },
    { dy: 18, rot: 7 },
]

export function Projects() {
    const sectionRef = useRef<HTMLElement>(null)
    const stickyRef = useRef<HTMLDivElement>(null)
    const cardsRef = useRef<(HTMLDivElement | null)[]>([])
    const progressRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const isDesktop = window.matchMedia('(min-width: 768px)').matches
        if (!isDesktop) return

        const sticky = stickyRef.current
        const progress = progressRef.current
        const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[]
        if (!sticky || !progress || !cards.length) return

        // Each card travels along a spherical arc as it crosses the viewport:
        //   x — linear right→left
        //   y — constant (per-card vertical lane variance)
        //   z — outward bend, edges close (z=0), centre recedes (-ARC_DEPTH)
        //   rotationY — sweeps to follow sphere tangent (concave / inside-of-sphere)
        //   scale — base bump + slight edge boost
        // 3D depth requires per-card transformPerspective set in the tween.
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: sticky,
                start: 'top top',
                end: '+=470%', // ~same scroll per card for the five cards
                pin: true,
                pinSpacing: true,
                scrub: 1,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                    progress.style.width = `${self.progress * 100}%`
                },
            },
        })

        // Park cards off-screen until their flight starts
        cards.forEach((card, i) => {
            const t = FLIGHT[i]
            gsap.set(card, {
                x: () => window.innerWidth + 800,
                y: t.dy,
                z: 0,
                rotation: t.rot,
                rotationY: 65,
                scale: 1.22,
                opacity: 1,
            })
        })

        const FLIGHT_DUR = 2.6
        const FLIGHT_STAGGER = 0.5
        // Path geometry: cards travel along the inside of a sphere — edges of
        // the arc are closest to the viewer (z = 0), the centre recedes into
        // the screen (z = −ARC_DEPTH). Each card faces the sphere's interior
        // tangent via rotationY, so it visually "bends" with the curvature.
        const ARC_DEPTH = 700 // how far the centre recedes along z (px)
        const ROT_Y_RANGE = 65 // rotationY at edges (deg)

        cards.forEach((card, i) => {
            const t = FLIGHT[i]
            const proxy = { p: 0 }
            tl.to(
                proxy,
                {
                    p: 1,
                    duration: FLIGHT_DUR,
                    ease: 'none',
                    onUpdate: () => {
                        const p = proxy.p
                        // Centred progress: -1 (right edge) → 0 (centre) → +1 (left edge)
                        const cp = (p - 0.5) * 2

                        // Linear horizontal sweep with extra buffer for off-screen entry
                        const totalSpan = window.innerWidth + 1600
                        const x = -cp * (totalSpan / 2)

                        // Outward bend on z — edges sit at z = 0 (closest to viewer),
                        // centre recedes to −ARC_DEPTH. sin(p·π) is 0 → 1 → 0.
                        const outward = Math.sin(p * Math.PI)
                        const z = -ARC_DEPTH * outward

                        // rotationY: right entry tilted negative, centre flat, left exit
                        // tilted positive. Cards now hug the inside of the sphere — each
                        // edge faces back toward the viewer's centre.
                        const rotY = ROT_Y_RANGE * cp

                        // Base scale bumped so cards read bigger overall; small edge
                        // boost on top reinforces the closer-to-viewer feel at the rim.
                        const scale = 1.22 + 0.08 * (1 - Math.sin(p * Math.PI))

                        // Subtle rotational drift over flight
                        const rotZ = t.rot + cp * 4

                        gsap.set(card, {
                            x,
                            y: t.dy,
                            z,
                            rotation: rotZ,
                            rotationY: rotY,
                            scale,
                            transformPerspective: 1400,
                        })
                    },
                },
                i * FLIGHT_STAGGER,
            )
        })

        return () => {
            tl.scrollTrigger?.kill()
            tl.kill()
        }
    }, [])

    return (
        <section
            id="projects"
            ref={sectionRef}
            // Pulled up under the intro only on desktop, where the cards fly in
            // over it; the phone layout is a plain scroller and must not overlap.
            className="relative bg-[var(--color-fg)] md:-mt-[55vh]"
        >
            {/* Desktop: cards travel along a spherical arc — enter from the right,
          rise + scale up + face the viewer at the apex, then recede + exit
          to the left. Per-card timeline driven by ScrollTrigger pin. */}
            <div
                ref={stickyRef}
                className="hidden md:block relative h-screen overflow-hidden"
            >
                <div className="absolute inset-0">
                    {PROJECTS.map((p, i) => (
                        <div
                            key={p.scene}
                            className="absolute left-1/2 top-1/2"
                            style={{
                                transform: 'translate(-50%, -50%)',
                                zIndex: i + 1,
                            }}
                        >
                            <div
                                ref={(el) => {
                                    cardsRef.current[i] = el
                                }}
                                className="will-change-transform"
                            >
                                <ProjectCard project={p} />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="absolute bottom-8 left-6 right-6 md:left-10 md:right-10 z-50">
                    <div className="max-w-[1280px] mx-auto h-px bg-white/15 relative">
                        <div
                            ref={progressRef}
                            className="absolute inset-y-0 left-0 bg-white"
                            style={{ width: '0%' }}
                        />
                    </div>
                </div>
            </div>

            {/* Mobile: the cards simply stack and scroll with the page — a
                sideways swipe inside a vertical page is easy to miss. */}
            <div className="md:hidden flex flex-col gap-6 px-6 py-12">
                {PROJECTS.map((p) => (
                    <ProjectCard key={p.scene} project={p} />
                ))}
            </div>
        </section>
    )
}

function ProjectCard({ project }: { project: Project }) {
    return (
        <article className="flex-shrink-0 w-full md:w-[440px] rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)] overflow-hidden hover:border-[var(--color-fg)] transition-colors">
            <ProjectScene type={project.scene} label={project.title} />
            <div className="p-6 md:p-7">
                <div className="flex items-baseline justify-between mb-4">
                    <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-[var(--color-fg-subtle)]">
                        project{project.index}
                    </p>
                    {project.href && (
                        <a
                            href={project.href}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-[var(--color-fg)] hover:opacity-60 transition-opacity"
                        >
                            github ↗
                        </a>
                    )}
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-[var(--color-fg)] mb-3">
                    {project.title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--color-fg-muted)] mb-5">
                    {project.body}
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {project.tags.map((t) => (
                        <span
                            key={t}
                            className="font-mono text-[0.7rem] px-2.5 py-1 rounded-full border border-[var(--color-line)] text-[var(--color-fg-muted)]"
                        >
                            {t}
                        </span>
                    ))}
                </div>
            </div>
        </article>
    )
}
