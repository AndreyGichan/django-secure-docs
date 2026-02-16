"use client"

import { FileText, Users, Download, Share2, Shield, Activity, ArrowUpRight, TrendingUp } from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"

import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Badge } from "@/components/ui/badge"

const dailyActivity = [
  { date: "01 Jan", actions: 124 },
  { date: "02 Jan", actions: 189 },
  { date: "03 Jan", actions: 156 },
  { date: "04 Jan", actions: 203 },
  { date: "05 Jan", actions: 178 },
  { date: "06 Jan", actions: 267 },
  { date: "07 Jan", actions: 245 },
  { date: "08 Jan", actions: 198 },
  { date: "09 Jan", actions: 312 },
  { date: "10 Jan", actions: 289 },
  { date: "11 Jan", actions: 256 },
  { date: "12 Jan", actions: 345 },
  { date: "13 Jan", actions: 298 },
  { date: "14 Jan", actions: 367 },
]

const rolesData = [
  { role: "Employee", count: 45, fill: "hsl(262, 83%, 58%)" },
  { role: "Manager", count: 12, fill: "hsl(190, 95%, 45%)" },
  { role: "Admin", count: 3, fill: "hsl(280, 65%, 60%)" },
]

const recentActions = [
  { user: "Ivanov I.", action: "DOWNLOAD", target: "Q4_Report.pdf", time: "2 min", avatar: "II" },
  { user: "Petrova A.", action: "SHARE", target: "Budget_2026.xlsx", time: "5 min", avatar: "PA" },
  { user: "Sidorov K.", action: "CREATE", target: "Proposal_v3.docx", time: "12 min", avatar: "SK" },
  { user: "Kozlova M.", action: "UPDATE", target: "NDA_Template.pdf", time: "18 min", avatar: "KM" },
  { user: "Novikov D.", action: "DELETE", target: "Old_Invoice.pdf", time: "25 min", avatar: "ND" },
]

const topUsers = [
  { email: "ivanov@co", actions: 156 },
  { email: "petrova@co", actions: 134 },
  { email: "sidorov@co", actions: 98 },
  { email: "kozlova@co", actions: 87 },
  { email: "novikov@co", actions: 72 },
]

const AVATAR_COLORS = [
  "from-violet-500 to-purple-600",
  "from-cyan-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-green-600",
]

function getActionBadgeClasses(action: string) {
  switch (action) {
    case "CREATE": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
    case "UPDATE": return "bg-sky-500/15 text-sky-400 border-sky-500/30"
    case "DELETE": return "bg-rose-500/15 text-rose-400 border-rose-500/30"
    case "DOWNLOAD": return "bg-amber-500/15 text-amber-400 border-amber-500/30"
    case "SHARE": return "bg-violet-500/15 text-violet-400 border-violet-500/30"
    default: return "bg-secondary text-muted-foreground border-border"
  }
}

function CustomTooltipArea({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-violet-500/20 bg-popover/95 backdrop-blur-sm px-4 py-3 text-xs text-popover-foreground shadow-xl shadow-black/30">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-muted-foreground mt-1 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" />
          {"Actions: "}
          <span className="font-mono font-semibold text-foreground">{payload[0].value}</span>
        </p>
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Dashboard"
        breadcrumbs={[{ label: "Dashboard" }]}
      />

      <div className="flex-1 overflow-auto p-6">
        {/* Welcome banner */}
        <div className="relative mb-6 overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-600/10 via-purple-600/5 to-cyan-500/10 p-6">
          <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-cyan-500/10 to-transparent" />
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Welcome back, Admin</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {"You have "}
                <span className="text-violet-400 font-semibold">23 new documents</span>
                {" and "}
                <span className="text-cyan-400 font-semibold">5 pending reviews</span>
                {" today."}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-emerald-400/70">Activity</span>
                  <span className="text-xs font-bold text-emerald-400">+18%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard title="Documents" value="1,284" change="+23 this week" changeType="positive" icon={FileText} accentColor="0" />
          <StatCard title="Users" value="60" change="+3 this month" changeType="positive" icon={Users} accentColor="1" />
          <StatCard title="Downloads" value="3,456" change="+12% vs last week" changeType="positive" icon={Download} accentColor="2" />
          <StatCard title="Shared" value="892" change="156 this week" changeType="neutral" icon={Share2} accentColor="3" />
          <StatCard title="Audit Events" value="12,847" change="Last 30 days" changeType="neutral" icon={Shield} accentColor="4" />
          <StatCard title="Active Now" value="24" change="Online users" changeType="neutral" icon={Activity} accentColor="5" />
        </div>

        {/* Charts Row */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Daily Activity Chart */}
          <div className="col-span-2 relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5">
            {/* Decorative corner glow */}
            <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-violet-500/5 blur-3xl" />
            <div className="relative">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Daily Activity</h3>
                  <p className="text-xs text-muted-foreground">Actions per day for the last 14 days</p>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono bg-violet-500/10 text-violet-400 border-violet-500/20">
                  Last 14 days
                </Badge>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={dailyActivity}>
                  <defs>
                    <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.4} />
                      <stop offset="50%" stopColor="hsl(280, 70%, 55%)" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="hsl(190, 95%, 39%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="strokeGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(262, 83%, 58%)" />
                      <stop offset="100%" stopColor="hsl(190, 95%, 50%)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 12%)" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "hsl(0, 0%, 45%)", fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(0, 0%, 45%)", fontSize: 10 }} />
                  <Tooltip content={<CustomTooltipArea />} />
                  <Area type="monotone" dataKey="actions" stroke="url(#strokeGrad)" strokeWidth={2.5} fill="url(#gradientArea)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Roles Distribution */}
          <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5">
            <div className="absolute -bottom-16 -right-16 h-32 w-32 rounded-full bg-cyan-500/5 blur-3xl" />
            <div className="relative">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground">Roles Distribution</h3>
                <p className="text-xs text-muted-foreground">Users by role</p>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={rolesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="role"
                    stroke="none"
                  >
                    {rolesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-3 mt-2">
                {rolesData.map((item) => (
                  <div key={item.role} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-3 w-3 rounded-md" style={{ backgroundColor: item.fill }} />
                      <span className="text-xs text-muted-foreground">{item.role}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-foreground">{item.count}</span>
                      <span className="text-[10px] text-muted-foreground/50">users</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Recent Actions */}
          <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5">
            <div className="absolute -top-16 -left-16 h-32 w-32 rounded-full bg-violet-500/5 blur-3xl" />
            <div className="relative">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Recent Actions</h3>
                  <p className="text-xs text-muted-foreground">Latest audit events</p>
                </div>
                <button className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition-colors">
                  View all <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
              <div className="flex flex-col gap-2.5">
                {recentActions.map((action, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl bg-secondary/30 px-3.5 py-3 border border-transparent hover:border-border/50 transition-all duration-200 hover:bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${AVATAR_COLORS[i]} shadow-sm`}>
                        <span className="text-[10px] font-bold text-white">
                          {action.avatar}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-foreground">
                          {action.user}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {action.target}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono ${getActionBadgeClasses(action.action)}`}
                      >
                        {action.action}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground/60 w-12 text-right">
                        {action.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Active Users */}
          <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5">
            <div className="absolute -bottom-16 -right-16 h-32 w-32 rounded-full bg-cyan-500/5 blur-3xl" />
            <div className="relative">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Top Active Users</h3>
                  <p className="text-xs text-muted-foreground">Most actions this month</p>
                </div>
                <button className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors">
                  Details <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={topUsers} layout="vertical" barSize={20}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(262, 83%, 58%)" />
                      <stop offset="50%" stopColor="hsl(280, 70%, 55%)" />
                      <stop offset="100%" stopColor="hsl(190, 95%, 45%)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 12%)" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "hsl(0, 0%, 45%)", fontSize: 10 }} />
                  <YAxis type="category" dataKey="email" axisLine={false} tickLine={false} tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 10 }} width={90} />
                  <Tooltip content={<CustomTooltipArea />} />
                  <Bar dataKey="actions" fill="url(#barGradient)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
