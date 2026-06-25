"use client"
import { useState, useRef, useEffect } from "react"

interface Chip {
  group: string
  groupKey: string
  label: string
  value: string
  color?: string
}

interface FilterOption {
  label: string
  value: string
  color?: string
}

interface FilterConfig {
  label: string
  key: string
  options: FilterOption[]
}

interface FilterBarProps {
  searchPlaceholder?: string
  filterConfigs: FilterConfig[]
  showCompleted: boolean
  onShowCompletedChange: (v: boolean) => void
  selected: Record<string, Set<string>>
  onSelectedChange: (key: string, values: Set<string>) => void
  search: string
  onSearchChange: (v: string) => void
}

export default function FilterBar({
  searchPlaceholder = "Search...",
  filterConfigs,
  showCompleted,
  onShowCompletedChange,
  selected,
  onSelectedChange,
  search,
  onSearchChange,
}: FilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const chips: Chip[] = []
  for (const cfg of filterConfigs) {
    const set = selected[cfg.key]
    if (set && set.size < cfg.options.length) {
      for (const opt of cfg.options) {
        if (set.has(opt.value)) {
          chips.push({ group: cfg.label, groupKey: cfg.key, label: opt.label, value: opt.value, color: opt.color })
        }
      }
    }
  }

  const activeFilters = filterConfigs.some((cfg) => {
    const set = selected[cfg.key]
    return set && set.size < cfg.options.length
  })

  const allOn = (key: string) =>
    filterConfigs.find((c) => c.key === key)?.options.length === (selected[key]?.size ?? 0)

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-2 pr-8 rounded-lg text-xs outline-none"
            style={{ background: "var(--card)", color: "var(--text)", border: "1px solid var(--border)" }}
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
              style={{ color: "var(--text-dim)" }}
            >
              ✕
            </button>
          )}
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpenDropdown(openDropdown ? null : "filters")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition"
            style={{
              background: openDropdown === "filters" || activeFilters ? "var(--accent)" : "var(--card)",
              color: openDropdown === "filters" || activeFilters ? "#fff" : "var(--text)",
              border: "1px solid var(--border)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M5 14a1 1 0 1 1 0-2 1 1 0 0 1 0 2m10-2H7.815A2.995 2.995 0 0 0 5 10a2.996 2.996 0 0 0-2.816 2H1a1 1 0 0 0 0 2h1.184A2.995 2.995 0 0 0 5 16a2.993 2.993 0 0 0 2.815-2H15a1 1 0 0 0 0-2m-4-3a1 1 0 1 1 0-2 1 1 0 0 1 0 2m4-2h-1.185A2.995 2.995 0 0 0 11 5a2.996 2.996 0 0 0-2.816 2H1a1 1 0 0 0 0 2h7.184A2.995 2.995 0 0 0 11 11a2.993 2.993 0 0 0 2.815-2H15a1 1 0 0 0 0-2M5 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2m10-2H7.815A2.995 2.995 0 0 0 5 0a2.996 2.996 0 0 0-2.816 2H1a1 1 0 0 0 0 2h1.184A2.995 2.995 0 0 0 5 6a2.993 2.993 0 0 0 2.815-2H15a1 1 0 0 0 0-2" />
            </svg>
            {activeFilters && <span className="w-2 h-2 rounded-full" style={{ background: "var(--green)" }} />}
          </button>

          {openDropdown === "filters" && (
            <div
              className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl p-3 shadow-lg"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              {filterConfigs.map((cfg) => (
                <div key={cfg.key} className="mb-3 last:mb-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold" style={{ color: "var(--text-dim)" }}>{cfg.label}</span>
                    <button
                      onClick={() => {
                        if (allOn(cfg.key)) {
                          onSelectedChange(cfg.key, new Set())
                        } else {
                          onSelectedChange(cfg.key, new Set(cfg.options.map((o) => o.value)))
                        }
                      }}
                      className="text-xs"
                      style={{ color: "var(--accent)" }}
                    >
                      {allOn(cfg.key) ? "None" : "All"}
                    </button>
                  </div>
                  <div className="space-y-1">
                    {cfg.options.map((opt) => {
                      const checked = selected[cfg.key]?.has(opt.value) ?? true
                      return (
                        <label key={opt.value} className="flex items-center gap-2 cursor-pointer py-0.5">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const next = new Set(selected[cfg.key] ?? cfg.options.map((o) => o.value))
                              if (checked) next.delete(opt.value)
                              else next.add(opt.value)
                              onSelectedChange(cfg.key, next)
                            }}
                            className="rounded"
                          />
                          <span
                            className="w-2 h-2 rounded-full inline-block"
                            style={{ background: opt.color || "var(--text-dim)" }}
                          />
                          <span className="text-xs">{opt.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}

              <hr className="my-2" style={{ borderColor: "var(--border)" }} />

              <label className="flex items-center gap-2 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={showCompleted}
                  onChange={() => onShowCompletedChange(!showCompleted)}
                  className="rounded"
                />
                <span className="text-xs">Show completed</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {chips.map((chip) => (
            <span
              key={`${chip.group}-${chip.value}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-dim)" }}
            >
              {chip.color && <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: chip.color }} />}
              {chip.label}
              <button
                onClick={() => {
                  const next = new Set(selected[chip.groupKey] ?? [])
                  next.delete(chip.value)
                  onSelectedChange(chip.groupKey, next)
                }}
                className="ml-0.5 hover:opacity-70"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
