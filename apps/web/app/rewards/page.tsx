"use client"

import { useState } from "react"

interface Reward {
  id: string
  title: string
  cost: number
  description: string
  icon: string
}

const defaultRewards: Reward[] = [
  { id: "1", title: "Watch an episode", cost: 20, description: "Guilt-free episode of your show", icon: "📺" },
  { id: "2", title: "1h Gaming (LoL)", cost: 50, description: "League of Legends session", icon: "🎮" },
  { id: "3", title: "Takeout meal", cost: 30, description: "Order food, no cooking", icon: "🍕" },
  { id: "4", title: "Buy a coffee", cost: 10, description: "Your favorite coffee out", icon: "☕" },
  { id: "5", title: "Free afternoon", cost: 100, description: "Entire afternoon off, no guilt", icon: "🌴" },
  { id: "6", title: "New gadget", cost: 200, description: "Small tech/gadget purchase", icon: "📱" },
]

export default function RewardsPage() {
  const [rewards] = useState<Reward[]>(defaultRewards)
  const [customRewards, setCustomRewards] = useState<Reward[]>([])
  const allRewards = [...rewards, ...customRewards]
  const [gold, setGold] = useState(0)
  const [log, setLog] = useState<string[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newReward, setNewReward] = useState({ title: "", cost: 10, description: "", icon: "🎁" })

  function buy(r: Reward) {
    if (gold < r.cost) return
    setGold((g) => g - r.cost)
    setLog((l) => [`🎉 Redeemed: ${r.title} (-${r.cost} gold)`, ...l])
  }

  function addReward() {
    if (!newReward.title.trim()) return
    const r: Reward = { ...newReward, id: crypto.randomUUID() }
    setCustomRewards((prev) => [...prev, r])
    setNewReward({ title: "", cost: 10, description: "", icon: "🎁" })
    setShowForm(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Rewards</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-1.5 rounded text-xs font-medium"
            style={{ background: "var(--card)", color: "var(--text-dim)", border: "1px solid var(--border)" }}
          >
            + Custom Reward
          </button>
          <span className="text-lg font-bold" style={{ color: "var(--gold)" }}>
            🪙 {gold}
          </span>
        </div>
      </div>

      {showForm && (
        <div className="mb-6 p-4 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Reward name"
              value={newReward.title}
              onChange={(e) => setNewReward((r) => ({ ...r, title: e.target.value }))}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
            />
            <input
              type="number"
              placeholder="Cost in gold"
              value={newReward.cost}
              onChange={(e) => setNewReward((r) => ({ ...r, cost: Number(e.target.value) }))}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
            />
            <input
              placeholder="Description"
              value={newReward.description}
              onChange={(e) => setNewReward((r) => ({ ...r, description: e.target.value }))}
              className="px-3 py-2 rounded-lg text-sm outline-none col-span-2"
              style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
            />
          </div>
          <button
            onClick={addReward}
            className="mt-3 px-4 py-1.5 rounded text-xs font-medium"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            Add Reward
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-8">
        {allRewards.map((r) => {
          const affordable = gold >= r.cost
          return (
            <button
              key={r.id}
              onClick={() => buy(r)}
              disabled={!affordable}
              className="p-4 rounded-xl text-left transition-all"
              style={{
                background: "var(--card)",
                border: `1px solid var(--border)`,
                opacity: affordable ? 1 : 0.4,
                cursor: affordable ? "pointer" : "not-allowed",
              }}
            >
              <span className="text-2xl">{r.icon}</span>
              <p className="text-sm font-medium mt-2">{r.title}</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>{r.description}</p>
              <p className="text-sm font-bold mt-2" style={{ color: affordable ? "var(--gold)" : "var(--text-dim)" }}>
                🪙 {r.cost}
              </p>
            </button>
          )
        })}
      </div>

      {log.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-dim)" }}>Redemption Log</h3>
          <div className="space-y-1">
            {log.map((entry, i) => (
              <p key={i} className="text-xs" style={{ color: "var(--text-dim)" }}>{entry}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
