import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon: LucideIcon
  gradient?: boolean
  accentColor?: string
}

const ACCENT_PRESETS = [
  { bg: "from-violet-600/20 to-purple-600/20", icon: "bg-violet-500/20 text-violet-400", border: "border-violet-500/10" },
  { bg: "from-cyan-600/20 to-teal-600/20", icon: "bg-cyan-500/20 text-cyan-400", border: "border-cyan-500/10" },
  { bg: "from-emerald-600/20 to-green-600/20", icon: "bg-emerald-500/20 text-emerald-400", border: "border-emerald-500/10" },
  { bg: "from-amber-600/20 to-orange-600/20", icon: "bg-amber-500/20 text-amber-400", border: "border-amber-500/10" },
  { bg: "from-rose-600/20 to-pink-600/20", icon: "bg-rose-500/20 text-rose-400", border: "border-rose-500/10" },
  { bg: "from-sky-600/20 to-blue-600/20", icon: "bg-sky-500/20 text-sky-400", border: "border-sky-500/10" },
]

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  gradient,
  accentColor,
}: StatCardProps) {
  const colorIndex = accentColor ? parseInt(accentColor) % ACCENT_PRESETS.length : 0
  const accent = ACCENT_PRESETS[colorIndex]

  return (
    <div className={`group relative overflow-hidden rounded-xl border ${accent.border} bg-card p-5 transition-all duration-300 hover:border-border hover:shadow-lg hover:shadow-black/20`}>
      {/* Gradient background overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${accent.bg} opacity-30 transition-opacity group-hover:opacity-50`} />

      {/* Subtle shimmer effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

      <div className="relative flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{title}</span>
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {value}
          </span>
          {change && (
            <span
              className={`text-[11px] font-medium ${
                changeType === "positive"
                  ? "text-emerald-400"
                  : changeType === "negative"
                    ? "text-rose-400"
                    : "text-muted-foreground"
              }`}
            >
              {change}
            </span>
          )}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent.icon} transition-transform group-hover:scale-110`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
