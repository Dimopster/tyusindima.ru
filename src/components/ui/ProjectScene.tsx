import type { ReactNode } from 'react'

// Card covers for the projects, drawn in code: one dark 4:3 frame per project
// in the site's mono style, each with its own accent (taken from the stack's
// logo colours where the project has one).

export type SceneType = 'netanalyzer' | 'stm32' | 'qemu' | 'logging' | 'qt'

const BG = '#0E0E0E'
const DIM = 'rgba(255,255,255,0.38)'
const FAINT = 'rgba(255,255,255,0.12)'
const TEXT = 'rgba(255,255,255,0.85)'
const MONO = { fontFamily: 'var(--font-mono)' }

type Props = { type: SceneType; label: string }

export function ProjectScene({ type, label }: Props) {
    return (
        <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-[var(--color-line)]" style={{ background: BG }}>
            <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" role="img" aria-label={label} style={MONO}>
                <Grid />
                {SCENES[type]}
            </svg>
        </div>
    )
}

function Grid() {
    return (
        <g stroke="rgba(255,255,255,0.04)" strokeWidth="1">
            {Array.from({ length: 9 }, (_, i) => (
                <line key={`v${i}`} x1={(i + 1) * 40} y1="0" x2={(i + 1) * 40} y2="300" />
            ))}
            {Array.from({ length: 7 }, (_, i) => (
                <line key={`h${i}`} x1="0" y1={(i + 1) * 40} x2="400" y2={(i + 1) * 40} />
            ))}
        </g>
    )
}

// Window chrome shared by the terminal-like scenes.
function Frame({ title, children }: { title: string; children: ReactNode }) {
    return (
        <g>
            <rect x="20" y="20" width="360" height="260" rx="8" fill="#141414" stroke={FAINT} />
            <line x1="20" y1="44" x2="380" y2="44" stroke={FAINT} />
            {[34, 46, 58].map((x) => (
                <circle key={x} cx={x} cy="32" r="3.5" fill="rgba(255,255,255,0.18)" />
            ))}
            <text x="200" y="36" textAnchor="middle" fontSize="9" fill={DIM}>
                {title}
            </text>
            {children}
        </g>
    )
}

function Caret({ x, y, color }: { x: number; y: number; color: string }) {
    return (
        <rect x={x} y={y - 9} width="6" height="11" fill={color}>
            <animate attributeName="opacity" values="1;1;0;0" dur="1s" repeatCount="indefinite" />
        </rect>
    )
}

// ── /01 NetAnalyzer: capture output, one packet broken down by layer ──
const NET = '#4FD1C5'
function NetAnalyzer() {
    const rows: [string, string, string][] = [
        ['ETH ', 'a4:83:e7 → 3c:22:fb', 'IPv4'],
        ['IPv4', '192.168.1.12 → 1.1.1.1', 'UDP'],
        ['UDP ', ':51544 → :53', 'DNS'],
        ['TCP ', '10.0.0.5 → 10.0.0.1:22', 'SYN'],
        ['IPv6', 'fe80::1 → ff02::fb', 'UDP'],
    ]
    return (
        <Frame title="netanalyzer – en0">
            <text x="34" y="66" fontSize="10" fill={DIM}>
                $ <tspan fill={TEXT}>./netanalyzer --interface en0</tspan>
            </text>
            {rows.map(([proto, flow, next], i) => (
                <text key={i} x="34" y={88 + i * 17} fontSize="9.5" fill={TEXT}>
                    <tspan fill={NET}>{proto}</tspan>
                    <tspan dx="10">{flow}</tspan>
                    <tspan fill={DIM} dx="8">
                        → {next}
                    </tspan>
                </text>
            ))}
            {/* Layer breakdown of the selected packet */}
            {[
                ['L2', 54],
                ['L3', 92],
                ['L4', 70],
                ['L7', 112],
            ].map(([name, w], i, all) => {
                const x = 34 + all.slice(0, i).reduce((s, [, ww]) => s + (ww as number) + 4, 0)
                return (
                    <g key={name as string}>
                        <rect x={x} y="190" width={w as number} height="22" rx="3" fill={NET} fillOpacity={0.12 + i * 0.1} stroke={NET} strokeOpacity="0.5" />
                        <text x={x + 8} y="205" fontSize="9" fill={TEXT}>
                            {name}
                        </text>
                    </g>
                )
            })}
            <rect x="34" y="226" width="332" height="38" rx="4" fill="rgba(255,90,90,0.08)" stroke="rgba(255,90,90,0.5)" />
            <text x="46" y="242" fontSize="9.5" fill="#FF6B6B">
                [!] TCP-001 port scan
            </text>
            <text x="46" y="256" fontSize="9" fill={DIM}>
                src 10.0.0.66 · 14 ports / 5s · high
            </text>
            <Caret x={340} y={256} color={NET} />
        </Frame>
    )
}

// ── /02 STM32: a Modbus RTU frame between controller and drives ──
const ST = '#3CB4E6'
function Stm32() {
    const frame: [string, string][] = [
        ['01', 'addr'],
        ['03', 'func'],
        ['00 10', 'reg'],
        ['00 02', 'count'],
        ['C5 CE', 'crc'],
    ]
    return (
        <g>
            {/* MCU */}
            <rect x="40" y="70" width="96" height="96" rx="6" fill="#141414" stroke={ST} strokeOpacity="0.7" />
            {Array.from({ length: 6 }, (_, i) => (
                <g key={i} stroke={ST} strokeOpacity="0.5">
                    <line x1={52 + i * 14} y1="62" x2={52 + i * 14} y2="70" />
                    <line x1={52 + i * 14} y1="166" x2={52 + i * 14} y2="174" />
                    <line x1="32" y1={82 + i * 14} x2="40" y2={82 + i * 14} />
                    <line x1="136" y1={82 + i * 14} x2="144" y2={82 + i * 14} />
                </g>
            ))}
            <text x="88" y="114" textAnchor="middle" fontSize="13" fontWeight="700" fill={ST}>
                STM32
            </text>
            <text x="88" y="130" textAnchor="middle" fontSize="8" fill={DIM}>
                controller
            </text>
            {/* Bus to three drives */}
            <line x1="144" y1="118" x2="250" y2="118" stroke={ST} strokeOpacity="0.6" strokeDasharray="4 4">
                <animate attributeName="stroke-dashoffset" from="16" to="0" dur="0.8s" repeatCount="indefinite" />
            </line>
            <text x="197" y="110" textAnchor="middle" fontSize="8" fill={DIM}>
                RS-485
            </text>
            {[0, 1, 2].map((i) => (
                <g key={i}>
                    <line x1="250" y1="118" x2="282" y2={68 + i * 50} stroke={ST} strokeOpacity="0.35" />
                    <rect x="282" y={52 + i * 50} width="80" height="32" rx="4" fill="#141414" stroke={FAINT} />
                    <circle cx="298" cy={68 + i * 50} r="8" fill="none" stroke={ST} strokeOpacity="0.6" />
                    <line x1="298" y1={68 + i * 50} x2="304" y2={63 + i * 50} stroke={ST}>
                        <animateTransform attributeName="transform" type="rotate" from={`0 298 ${68 + i * 50}`} to={`360 298 ${68 + i * 50}`} dur={`${2 + i}s`} repeatCount="indefinite" />
                    </line>
                    <text x="314" y={72 + i * 50} fontSize="9" fill={TEXT}>
                        drive {i + 1}
                    </text>
                </g>
            ))}
            {/* Frame bytes */}
            <text x="40" y="214" fontSize="8" fill={DIM} letterSpacing="1.5">
                MODBUS RTU · REQUEST
            </text>
            {frame.map(([bytes, name], i, all) => {
                const widths = all.map(([b]) => (b.length > 2 ? 62 : 36))
                const x = 40 + widths.slice(0, i).reduce((s, w) => s + w + 6, 0)
                return (
                    <g key={name}>
                        <rect x={x} y="222" width={widths[i]} height="26" rx="3" fill={ST} fillOpacity={name === 'crc' ? 0.25 : 0.1} stroke={ST} strokeOpacity="0.5" />
                        <text x={x + widths[i] / 2} y="239" textAnchor="middle" fontSize="10" fill={TEXT}>
                            {bytes}
                        </text>
                        <text x={x + widths[i] / 2} y="262" textAnchor="middle" fontSize="7.5" fill={DIM}>
                            {name}
                        </text>
                    </g>
                )
            })}
        </g>
    )
}

// ── /03 QEMU: interrupt pulses on a timing grid, scrolling like a scope ──
const QE = '#FF7A1A'
function Qemu() {
    // One period of the pulse train, repeated and slid left forever.
    const period = 50
    const pulse = (x0: number) => `L ${x0 + 10} 150 L ${x0 + 10} 96 L ${x0 + 18} 96 L ${x0 + 18} 150 L ${x0 + period} 150`
    const d = `M -50 150 ${Array.from({ length: 10 }, (_, i) => pulse(-50 + i * period)).join(' ')}`
    return (
        <g>
            <text x="30" y="44" fontSize="8" fill={DIM} letterSpacing="1.5">
                QEMU · PCI DEVICE · IRQ
            </text>
            <rect x="30" y="56" width="340" height="120" rx="4" fill="#121212" stroke={FAINT} />
            <clipPath id="scope-clip">
                <rect x="30" y="56" width="340" height="120" />
            </clipPath>
            <g clipPath="url(#scope-clip)">
                {Array.from({ length: 8 }, (_, i) => (
                    <line key={i} x1={30 + i * 42.5} y1="56" x2={30 + i * 42.5} y2="176" stroke="rgba(255,255,255,0.05)" />
                ))}
                <path d={d} fill="none" stroke={QE} strokeWidth="1.6">
                    <animateTransform attributeName="transform" type="translate" from="0 0" to={`-${period} 0`} dur="1.2s" repeatCount="indefinite" />
                </path>
            </g>
            <text x="364" y="70" textAnchor="end" fontSize="8" fill={DIM}>
                Δt = const
            </text>
            {/* Jitter distribution: narrow peak around the target interval */}
            <text x="30" y="204" fontSize="8" fill={DIM} letterSpacing="1.5">
                INTERVAL SPREAD
            </text>
            {Array.from({ length: 23 }, (_, i) => {
                const h = 48 * Math.exp(-((i - 11) ** 2) / 10)
                return <rect key={i} x={30 + i * 14.8} y={262 - h} width="10" height={Math.max(2, h)} rx="1" fill={QE} fillOpacity={0.25 + (h / 48) * 0.6} />
            })}
            <line x1="30" y1="262" x2="370" y2="262" stroke={FAINT} />
            <line x1={30 + 11 * 14.8 + 5} y1="200" x2={30 + 11 * 14.8 + 5} y2="266" stroke={QE} strokeDasharray="2 3" />
            <text x={30 + 11 * 14.8 + 10} y="206" fontSize="8" fill={TEXT}>
                target
            </text>
        </g>
    )
}

// ── /04 Logging: a crash record with its cause and call chain ──
const LOG = '#FF5F57'
function Logging() {
    const lines: [string, string, string][] = [
        ['12:04:31.208', 'INFO ', 'session opened'],
        ['12:04:31.412', 'INFO ', 'frame #4812 ok'],
        ['12:04:31.415', 'WARN ', 'queue 92% full'],
        ['12:04:31.419', 'FATAL', 'SIGSEGV in parse_frame'],
    ]
    const tone: Record<string, string> = { 'INFO ': DIM, 'WARN ': '#F5C451', FATAL: LOG }
    return (
        <Frame title="crash.log">
            {lines.map(([t, lvl, msg], i) => (
                <text key={i} x="34" y={68 + i * 16} fontSize="9" fill={TEXT}>
                    <tspan fill={DIM}>{t}</tspan>
                    <tspan dx="8" fill={tone[lvl]}>
                        {lvl}
                    </tspan>
                    <tspan dx="8">{msg}</tspan>
                </text>
            ))}
            <rect x="34" y="138" width="332" height="128" rx="4" fill="rgba(255,95,87,0.06)" stroke="rgba(255,95,87,0.4)" />
            <text x="46" y="156" fontSize="8" fill={LOG} letterSpacing="1.5">
                CAUSE · NULL POINTER · ERR 0x0B
            </text>
            {[
                ['#0', 'parse_frame', 'frame.c:212'],
                ['#1', 'decode_packet', 'decoder.c:88'],
                ['#2', 'worker_loop', 'worker.c:41'],
                ['#3', 'thread_start', 'pool.c:17'],
            ].map(([n, fn, at], i) => (
                <g key={n}>
                    <text x="46" y={178 + i * 20} fontSize="9.5" fill={TEXT}>
                        <tspan fill={DIM}>{n}</tspan>
                        <tspan dx="10">{fn}()</tspan>
                    </text>
                    <text x="354" y={178 + i * 20} textAnchor="end" fontSize="8.5" fill={DIM}>
                        {at}
                    </text>
                </g>
            ))}
        </Frame>
    )
}

// ── /05 MFC → Qt: the same window before and after, now on three systems ──
const QT = '#41CD52'
function QtMigration() {
    const appWindow = (x: number, title: string, accent: string, modern: boolean) => (
        <g>
            <rect x={x} y="60" width="140" height="120" rx={modern ? 8 : 0} fill={modern ? '#161616' : '#1B1B1B'} stroke={modern ? accent : 'rgba(255,255,255,0.3)'} strokeOpacity={modern ? 0.7 : 1} />
            <rect x={x} y="60" width="140" height="18" rx={modern ? 8 : 0} fill={modern ? 'transparent' : 'rgba(80,110,200,0.55)'} />
            {modern && <line x1={x} y1="78" x2={x + 140} y2="78" stroke={FAINT} />}
            <text x={x + 8} y="72" fontSize="8" fill={TEXT}>
                {title}
            </text>
            {[0, 1, 2].map((i) => (
                <rect key={i} x={x + 10} y={90 + i * 18} width={modern ? 120 - i * 24 : 120 - i * 18} height="9" rx={modern ? 4 : 0} fill={modern ? accent : 'rgba(255,255,255,0.18)'} fillOpacity={modern ? 0.18 + i * 0.08 : 1} />
            ))}
            <rect x={x + 76} y="152" width="54" height="16" rx={modern ? 8 : 0} fill={modern ? accent : 'rgba(255,255,255,0.22)'} fillOpacity={modern ? 0.85 : 1} />
            <text x={x + 103} y="163" textAnchor="middle" fontSize="7.5" fill={modern ? '#0E0E0E' : TEXT}>
                OK
            </text>
        </g>
    )
    return (
        <g>
            <text x="200" y="40" textAnchor="middle" fontSize="8" fill={DIM} letterSpacing="1.5">
                LEGACY → CROSS-PLATFORM
            </text>
            {appWindow(30, 'app.exe – MFC', '', false)}
            <g>
                <line x1="178" y1="120" x2="218" y2="120" stroke={QT} strokeWidth="1.5" />
                <path d="M 214 114 L 222 120 L 214 126" fill="none" stroke={QT} strokeWidth="1.5" />
            </g>
            {appWindow(230, 'app – Qt', QT, true)}
            {[
                ['Windows', 0],
                ['Linux', 1],
                ['macOS', 2],
            ].map(([os, i]) => (
                <g key={os as string}>
                    <rect x={70 + (i as number) * 92} y="214" width="80" height="26" rx="13" fill="none" stroke={QT} strokeOpacity="0.55" />
                    <circle cx={84 + (i as number) * 92} cy="227" r="3" fill={QT} />
                    <text x={94 + (i as number) * 92} y="230" fontSize="9" fill={TEXT}>
                        {os}
                    </text>
                </g>
            ))}
            <text x="200" y="266" textAnchor="middle" fontSize="8" fill={DIM}>
                one codebase · no Windows-only APIs
            </text>
        </g>
    )
}

const SCENES: Record<SceneType, ReactNode> = {
    netanalyzer: <NetAnalyzer />,
    stm32: <Stm32 />,
    qemu: <Qemu />,
    logging: <Logging />,
    qt: <QtMigration />,
}
