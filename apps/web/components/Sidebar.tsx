"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/board", label: "Board", icon: "◆" },
  { href: "/tasks", label: "Tasks", icon: "☐" },
  { href: "/dailies", label: "Dailies", icon: "↻" },
  { href: "/rewards", label: "Rewards", icon: "★" },
  { href: "/progress", label: "Progression", icon: "📈" },
]

export default function Sidebar() {
  const path = usePathname()
  return (
    <aside className="w-56 min-h-screen flex flex-col border-r" style={{ borderColor: "var(--border)", background: "var(--sidebar)" }}>
      <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
        <h1 className="text-lg font-bold" style={{ color: "var(--accent)" }}>MyBrain</h1>
        <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>Gamified Productivity</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map((l) => {
          const active = path === l.href
          return (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
              style={{
                background: active ? "var(--accent)" : "transparent",
                color: active ? "#fff" : "var(--text-dim)",
                fontWeight: active ? 600 : 400,
              }}
              onMouseOver={(e) => {
                if (!active) e.currentTarget.style.background = "var(--card)"
              }}
              onMouseOut={(e) => {
                if (!active) e.currentTarget.style.background = "transparent"
              }}
            >
              <span className="text-base">{l.icon}</span>
              {l.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 text-xs" style={{ color: "var(--text-dim)" }}>
        Project Freedom
      </div>
    </aside>
  )
}
