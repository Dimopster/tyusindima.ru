import { Code2, Send, Mail } from 'lucide-react'

const SOCIAL = [
  { icon: Send, href: 'https://t.me/Dimopster', label: 'Telegram' },
  { icon: Code2, href: 'https://github.com/Dimopster', label: 'GitHub' },
  { icon: Mail, href: 'mailto:tyusindima@gmail.com', label: 'Email' },
]

export function Footer() {
  return (
    <footer className="mt-16 md:mt-24 border-t border-[var(--color-line)] py-10 px-6 md:px-10">
      <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center md:items-baseline justify-between gap-6">
        <a
          href="#"
          className="font-mono text-sm font-semibold tracking-tight text-[var(--color-fg)]"
        >
          dmitry<span className="text-[var(--color-fg-subtle)]">.</span>
        </a>

        <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-[var(--color-fg-subtle)]">
          © 2026 · Дмитрий Тюсин
        </p>

        <div className="flex items-center gap-2">
          {SOCIAL.map((s) => {
            const Icon = s.icon
            return (
              <a
                key={s.label}
                href={s.href}
                target={s.href.startsWith('http') ? '_blank' : undefined}
                rel="noreferrer"
                aria-label={s.label}
                className="h-9 w-9 rounded-full border border-[var(--color-line)] hover:border-[var(--color-fg)] hover:bg-[var(--color-fg)] hover:text-[var(--color-bg)] text-[var(--color-fg-muted)] flex items-center justify-center transition-colors"
              >
                <Icon size={14} strokeWidth={1.8} />
              </a>
            )
          })}
        </div>
      </div>
    </footer>
  )
}
