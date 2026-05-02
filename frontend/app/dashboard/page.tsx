"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import {
  FileText,
  Users,
  Download,
  Share2,
  Shield,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Eye,
  FileUp,
  FolderOpen,
  Key,
  Lock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  File,
  FileSpreadsheet,
  FileImage
} from "lucide-react"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUser } from "@/lib/user-context"
import {
  getTopUsers,
  getDocumentActivity,
  getDownloadActivity,
  getSharingActivity,
  getUserRolesDistribution,
  getDailyActivity,
} from "@/lib/api/reports"
import { getAuditLogs, getUserWeekActivity } from "@/lib/api/audit"
import { getDashboardStats, getUserDashboardStats } from "@/lib/api/reports"
import { getDocuments, getExpiringAccess } from "@/lib/api/documents"


type DailyActivityItem = {
  date: string
  actions: number
}

type RoleItem = {
  role: string
  count: number
  fill: string
}

type TopUser = {
  email: string
  actions: number
}

type RecentAction = {
  user: string
  action: string
  target: string
  time: string
}

type Stats = {
  documents: number
  users: number
  downloads: number
  shares: number
  audit_events: number
}


const AVATAR_COLORS = [
  "from-violet-500 to-purple-600",
  "from-cyan-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-green-600",
  "from-blue-500 to-indigo-600",
  "from-fuchsia-500 to-pink-600",
  "from-lime-500 to-emerald-600",
  "from-sky-500 to-blue-600",
]

const ROLE_COLORS: Record<string, string> = {
  admin: "hsl(280, 65%, 60%)",
  manager: "hsl(190, 95%, 45%)",
  employee: "hsl(262, 83%, 58%)",
}

function getActionBadgeClasses(action: string) {
  switch (action) {
    case "CREATE": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
    case "UPDATE": return "bg-sky-500/15 text-sky-400 border-sky-500/30"
    case "DELETE": return "bg-rose-500/15 text-rose-400 border-rose-500/30"
    case "DOWNLOAD": return "bg-amber-500/15 text-amber-400 border-amber-500/30"
    case "SHARE": return "bg-violet-500/15 text-violet-400 border-violet-500/30"
    case "LOGIN": return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
    case "LOGOUT": return "bg-red-500/15 text-red-400 border-red-500/30"
    case "APPROVE": return "bg-blue-500/15 text-blue-400 border-blue-500/30"
    default: return "bg-secondary text-muted-foreground border-border"
  }
}

const ACTION_CONFIG: Record<string, { icon: any; className: string }> = {
  CREATE: {
    icon: FileText,
    className: "bg-emerald-500/15 text-emerald-400",
  },
  UPDATE: {
    icon: FileUp,
    className: "bg-sky-500/15 text-sky-400",
  },
  DELETE: {
    icon: AlertCircle,
    className: "bg-rose-500/15 text-rose-400",
  },
  DOWNLOAD: {
    icon: Download,
    className: "bg-amber-500/15 text-amber-400",
  },
  SHARE: {
    icon: Share2,
    className: "bg-cyan-500/15 text-cyan-400",
  },
  LOGIN: {
    icon: Key,
    className: "bg-cyan-500/15 text-cyan-400",
  },
  LOGOUT: {
    icon: Lock,
    className: "bg-red-500/15 text-red-400",
  },
  APPROVE: {
    icon: CheckCircle2,
    className: "bg-blue-500/15 text-blue-400",
  },
  DEFAULT: {
    icon: Activity,
    className: "bg-secondary text-muted-foreground",
  },
}

function getActionConfig(action: string) {
  return ACTION_CONFIG[action] || ACTION_CONFIG.DEFAULT
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

function CustomTooltipUser({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-violet-500/20 bg-popover/95 backdrop-blur-sm px-4 py-3 text-xs text-popover-foreground shadow-xl shadow-black/30">
        <p className="font-semibold text-foreground">{label}</p>
        {payload.map((item: any, index: number) => (
          <p key={index} className="text-muted-foreground mt-1 flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${index === 0 ? 'bg-violet-500' : 'bg-cyan-400'}`} />
            {item.name}: <span className="font-mono font-semibold text-foreground">{item.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

function getFileIcon(type: string) {
  switch (type) {
    case "pdf":
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-red-600/20 border border-rose-500/10">
          <File className="h-4 w-4 text-rose-400" />
        </div>
      )
    case "doc":
    case "docx":
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/10">
          <FileText className="h-4 w-4 text-blue-400" />
        </div>
      )
    case "xlsx":
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 border border-emerald-500/10">
          <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
        </div>
      )
    case "png":
    case "jpg":
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/20 border border-sky-500/10">
          <FileImage className="h-4 w-4 text-sky-400" />
        </div>
      )
    default:
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/10">
          <FileText className="h-4 w-4 text-violet-400" />
        </div>
      )
  }
}

function formatUserName(name?: string, email?: string) {
  if (!name) {
    if (!email) return "Unknown"
    name = email.split("@")[0]
  }

  const parts = name.trim().split(" ").filter(Boolean)

  return parts.slice(0, 2).join(" ")
}

function getUserInitials(name?: string) {
  if (!name) return "?"

  const parts = name.trim().split(" ").filter(Boolean)

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Администратор",
  manager: "Менеджер",
  employee: "Сотрудник",
}

function getFirstName(value?: string) {
  if (!value) return "User"

  const parts = value
    .replace(/\./g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)

  const name = parts[1] || parts[0] || "User"

  return name.charAt(0).toUpperCase() + name.slice(1)
}


function formatExpires(expiresIn: number, unit: string) {
  if (!unit) return `${expiresIn} д`

  const u = unit.toLowerCase()

  if (u.startsWith("hour")) return `${expiresIn} ч`
  if (u.startsWith("day")) return `${expiresIn} д`

  return `${expiresIn}`
}

function getExpiresInHours(value: number, unit: string) {
  if (!unit) return value

  const u = unit.toLowerCase()

  if (u.startsWith("hour")) return value
  if (u.startsWith("day")) return value * 24

  return value
}


function fillLast7Days(data: any[]) {
  const days: any[] = []

  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)

    const key = d.toLocaleDateString("en-US", { weekday: "short" })

    const found = data.find(
      (x) => x.date === key
    )

    days.push({
      date: key,
      actions: found?.actions || 0,
      downloads: found?.downloads || 0,
    })
  }

  return days
}


function AdminDashboard() {
  const [loading, setLoading] = useState(true)

  const [dailyActivity, setDailyActivity] = useState<DailyActivityItem[]>([])
  const [rolesData, setRolesData] = useState<RoleItem[]>([])
  const [topUsers, setTopUsers] = useState<TopUser[]>([])
  const [recentActions, setRecentActions] = useState<RecentAction[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const { name, email } = useUser()

  const displayName = getFirstName(name)

  const router = useRouter()


  useEffect(() => {
    const load = async () => {
      setLoading(true)

      const [
        daily,
        roles,
        top,
        documents,
        sharing,
        downloads,
        audit,
        dashboard
      ] = await Promise.all([
        getDailyActivity(14),
        getUserRolesDistribution(),
        getTopUsers(),
        getDocumentActivity(),
        getSharingActivity(),
        getDownloadActivity(),
        getAuditLogs({ limit: 7, offset: 0 }),
        getDashboardStats()
      ])

      setDailyActivity(
        daily.data.map((d: any) => ({
          date: new Date(d.date).toLocaleDateString(),
          actions: d.actions_count
        }))
      )
      setRolesData(
        roles.data.map((r: any) => ({
          role: ROLE_LABELS[r.role] || r.role,
          count: r.users_count,
          fill: ROLE_COLORS[r.role] || "gray"
        }))
      )
      setTopUsers(
        top.data.map((u: any) => ({
          email: u.user_email,
          actions: u.actions_count
        }))
      )

      setRecentActions(
        audit.data.results.map((log: any) => ({
          user: formatUserName(log.user_name, log.user_email) || "Unknown",
          action: log.action,
          target: log.target_name || "-",
          time: new Date(log.timestamp).toLocaleTimeString(),
        }))
      )

      // setStats({
      //   documents: documents.data?.length ?? 0,
      //   users: roles.data?.reduce((a: number, b: any) => a + b.count, 0),
      //   downloads: downloads.data?.reduce((a: number, b: any) => a + b.downloads_count, 0)
      // })

      setStats(dashboard.data)

      setLoading(false)
    }

    load()
  }, [])


  return (
    <>
      {/* Welcome banner */}
      <div className="max-w-7xl mx-auto relative mb-6 overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-600/10 via-purple-600/5 to-cyan-500/10 p-6">
        <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-cyan-500/10 to-transparent" />
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-foreground tracking-wide ">С возвращением, {displayName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {" Панель управления содержит  "}
              <span className="text-violet-400 font-mono font-medium tracking-wide">актуальную информацию</span>
              {" о "}
              <span className="text-cyan-400 font-mono font-medium tracking-wide ">последних событиях</span>
              {"."}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard title="Documents" value={String(stats?.documents ?? 0)} icon={FileText} accentColor="0" />
        <StatCard title="Users" value={String(stats?.users ?? 0)} icon={Users} accentColor="1" />
        <StatCard title="Downloads" value={String(stats?.downloads ?? 0)} icon={Download} accentColor="2" />
        <StatCard title="Shared" value={String(stats?.shares ?? 0)} icon={Share2} accentColor="3" />
        <StatCard title="Audit Events" value={String(stats?.audit_events ?? 0)} icon={Shield} accentColor="4" />
        {/* <StatCard title="Active Now" value="24" change="Online users" changeType="neutral" icon={Activity} accentColor="5" /> */}
      </div>

      {/* Charts Row */}
      <div className="max-w-7xl mx-auto mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Daily Activity Chart */}
        <div className="col-span-2 relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5">
          <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-violet-500/5 blur-3xl" />
          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-mono font-medium text-foreground">Ежедневная активность</h3>
                <p className="text-xs text-muted-foreground">Количество действий в день за последние 14 дней</p>
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
              <h3 className="text-sm font-mono font-medium text-foreground">Распределение ролей</h3>
              <p className="text-xs text-muted-foreground">Пользователи по роли</p>
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
      <div className=" max-w-7xl mx-auto mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent Actions */}
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5">
          <div className="absolute -top-16 -left-16 h-32 w-32 rounded-full bg-violet-500/5 blur-3xl" />
          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-mono font-medium text-foreground">Недавние действия</h3>
                <p className="text-xs text-muted-foreground">Последние события аудита</p>
              </div>
              <button
                onClick={() => router.push("/dashboard/audit")}
                className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
              >

                Просмотреть все <ArrowUpRight className="h-3 w-3" />
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
                        {getUserInitials(action.user)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-foreground tracking-wide">
                        {action.user}
                      </span>
                      <span
                        className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px] cursor-default"
                        title={action.target}
                      >
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
                <h3 className="text-sm font-mono font-medium text-foreground">Топ активных пользователей</h3>
                <p className="text-xs text-muted-foreground">Больше всего действий в этом месяце</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
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
                <YAxis type="category" dataKey="email" axisLine={false} tickLine={false} tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 10 }} width={140} interval={0} />
                <Tooltip content={<CustomTooltipArea />} />
                <Bar dataKey="actions" fill="url(#barGradient)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  )
}

function UserDashboard() {
  const [documents, setDocuments] = useState<any[]>([])
  const [docsLoading, setDocsLoading] = useState(true)
  const [recentActions, setRecentActions] = useState<any[]>([])
  const [expiringAccess, setExpiringAccess] = useState<any[]>([])
  const [userActivity, setUserActivity] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const router = useRouter()
  const { name, email, loading } = useUser()
  const displayName = getFirstName(name)


  useEffect(() => {
    const loadActivity = async () => {
      try {
        const res = await getUserWeekActivity()

        const formatted = res.data.map((item: any) => ({
          date: new Date(item.date).toLocaleDateString("en-US", {
            weekday: "short",
          }),
          actions: item.document_actions,
          downloads: item.downloads,
        }))

        setUserActivity(fillLast7Days(formatted))
      } catch (e) {
        console.error(e)
      }
    }

    loadActivity()
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const [docsRes, auditRes, statsRes] = await Promise.all([
          getDocuments({
            limit: 5,
            ordering: "-updated_at",
          }),
          getAuditLogs({
            limit: 5,
            ordering: "-timestamp",
            user_email: email,
          }),
          getUserDashboardStats()
        ])

        setDocuments(docsRes.data.results ?? docsRes.data)

        setRecentActions(
          auditRes.data.results
            .map((log: any) => ({
              action: log.action,
              target: log.target_name || "-",
              time: new Date(log.timestamp).toLocaleString(),
            }))
        )

        setStats(statsRes.data)
      } finally {
        setDocsLoading(false)
      }
    }

    if (email) {
      load()
    }
  }, [email])


  useEffect(() => {
    const load = async () => {
      try {
        const res = await getExpiringAccess()

        setExpiringAccess(
          res.data.map((item: any) => ({
            name: `${item.title}.${item.type}`,
            owner: item.owner_name,
            permission: item.role === "editor" ? "edit" : "view",
            expiresIn: item.expires_in,
            expiresUnit: item.expires_unit,
          }))
        )
      } catch (e) {
        console.error(e)
      }
    }

    load()
  }, [])


  return (
    <>
      {/* Welcome banner */}
      <div className=" max-w-7xl mx-auto relative mb-6 overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-600/10 via-purple-600/5 to-cyan-500/10 p-6">
        <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-cyan-500/10 to-transparent" />
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium tracking-wide text-foreground">С возвращением, {displayName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {"Здесь представлен обзор вашей "}
              <span className="text-violet-400 font-mono font-medium tracking-wide">недавней активности</span>
              {" и "}
              <span className="text-cyan-400 font-mono font-medium tracking-wide">рабочего пространства</span>
              {"."}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="My Documents" value={String(stats?.my_documents ?? 0)} icon={FolderOpen} accentColor="0" />
        <StatCard title="Shared with Me" value={String(stats?.shared_with_me ?? 0)} icon={Share2} accentColor="1" />
        <StatCard title="Downloads" value={String(stats?.downloads ?? 0)} icon={Download} accentColor="2" />
        <StatCard title="Storage Used" value={`${stats?.storage_used_mb ?? 0} MB`} icon={FileText} accentColor="3" />
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Activity Chart */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5">
          <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-violet-500/5 blur-3xl" />
          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium tracking-wide text-foreground">Моя активность</h3>
                <p className="text-xs text-muted-foreground">Действия с документами и скачивания за неделю</p>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono bg-violet-500/10 text-violet-400 border-violet-500/20">
                На этой неделе
              </Badge>
            </div>
            {userActivity.every(d => d.actions === 0 && d.downloads === 0) ? (
              <div className="flex flex-col items-center justify-center h-[250px] text-center">
                <TrendingUp className="h-6 w-6 text-muted-foreground mb-2" />
                <span className="text-xs text-muted-foreground">
                  Нет активности за неделю
                </span>
                <span className="text-[10px] text-muted-foreground/60">
                  Данные появятся после ваших действий
                </span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={userActivity} barGap={4}>
                  <defs>
                    <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.3} />
                    </linearGradient>
                    <linearGradient id="downloadsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(190, 95%, 45%)" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="hsl(190, 95%, 45%)" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 12%)" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "hsl(0, 0%, 45%)", fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(0, 0%, 45%)", fontSize: 10 }} />
                  <Tooltip content={<CustomTooltipUser />} />
                  <Bar dataKey="actions" name="Все действия" fill="url(#viewsGradient)" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="downloads" name="Скачивания" fill="url(#downloadsGradient)" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            )}
            {!userActivity.every(d => d.actions === 0 && d.downloads === 0) && (
              <div className="flex items-center justify-center gap-6 mt-3">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded bg-violet-500" />
                  <span className="text-[10px] text-muted-foreground">Все действия с документами</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded bg-cyan-500" />
                  <span className="text-[10px] text-muted-foreground">Скачивания</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5">
          <div className="absolute -bottom-16 -right-16 h-32 w-32 rounded-full bg-cyan-500/5 blur-3xl" />
          <div className="relative">
            <div className="mb-4">
              <h3 className="text-sm font-medium tracking-wide text-foreground">Недавняя активность</h3>
              <p className="text-xs text-muted-foreground">Ваши последние действия</p>
            </div>
            <div className="flex flex-col gap-3">
              {recentActions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Activity className="h-6 w-6 text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground">
                    Пока нет активности
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">
                    Ваши действия появятся здесь
                  </span>
                </div>
              ) : (
                recentActions.map((item, i) => {
                  const config = getActionConfig(item.action)
                  const Icon = config.icon

                  return (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/30 transition-colors">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.className}`}>
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-xs font-medium text-foreground truncate">
                          {item.target}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {item.action}
                        </span>
                      </div>

                      <span className="text-[10px] text-muted-foreground/60 shrink-0">
                        {item.time}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Documents and Shared */}
      <div className="max-w-7xl mx-auto mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* My Documents */}
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5">
          <div className="absolute -top-16 -left-16 h-32 w-32 rounded-full bg-violet-500/5 blur-3xl" />
          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium tracking-wide text-foreground">Мои документы</h3>
                <p className="text-xs text-muted-foreground">Документы, к которым у вас есть доступ</p>
              </div>
              <button
                onClick={() => router.push("/dashboard/documents")}
                className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
              >
                Просмотреть все<ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
            <div className="flex flex-col gap-2.5">
              {docsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="h-5 w-5 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
                </div>
              ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <FolderOpen className="h-6 w-6 text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground">
                    Нет документов
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">
                    Загрузите первый файл, чтобы начать работу
                  </span>
                </div>
              ) : (
                documents.map((doc, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl bg-secondary/30 px-3.5 py-3 border border-transparent hover:border-border/50 transition-all duration-200 hover:bg-secondary/50 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg">
                        {getFileIcon(doc.type)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-foreground">{doc.title}.{doc.type}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">{doc.size}</span>
                          <span className="text-[10px] text-muted-foreground/40">•</span>
                          <span className="text-[10px] text-muted-foreground">{new Date(doc.updated_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    {/* <Badge variant="outline" className={`text-[9px] font-mono ${doc.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-secondary text-muted-foreground border-border"
                      }`}>
                      {doc.type}
                    </Badge> */}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Expiring Access */}
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5">
          <div className="absolute -bottom-16 -right-16 h-32 w-32 rounded-full bg-amber-500/5 blur-3xl" />
          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium tracking-wide text-foreground">Истекающий доступ</h3>
                <p className="text-xs text-muted-foreground">Документы с истекающими правами доступа</p>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border-amber-500/20">
                {expiringAccess.length} элементов
              </Badge>
            </div>
            <div className="flex flex-col gap-2.5">
              {expiringAccess.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400 mb-2" />
                  <span className="text-xs text-muted-foreground">
                    Нет истекающих доступов
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">
                    Все доступы актуальны
                  </span>
                </div>
              ) : (
                expiringAccess.map((doc, i) => {
                  const hours = getExpiresInHours(doc.expiresIn, doc.expiresUnit)

                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between rounded-xl px-3.5 py-3 border transition-all duration-200 hover:bg-secondary/50 cursor-pointer ${hours <= 24
                        ? "bg-rose-500/5 border-rose-500/20"
                        : hours <= 24 * 7
                          ? "bg-amber-500/5 border-amber-500/20"
                          : "bg-secondary/30 border-transparent"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback
                            className={`bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} text-[10px] font-bold text-white`}
                          >
                            {getUserInitials(doc.owner)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-foreground">
                            {doc.name}
                          </span>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">
                              {doc.owner}
                            </span>

                            <span className="text-[10px] text-muted-foreground/40">•</span>

                            <Badge
                              variant="outline"
                              className={`text-[9px] font-mono px-1.5 py-0 ${doc.permission === "edit"
                                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                                : "bg-violet-500/10 text-violet-400 border-violet-500/20"
                                }`}
                            >
                              {doc.permission === "edit" ? "Edit" : "View"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {hours <= 24 && (
                          <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                        )}

                        <div
                          className={`flex items-center gap-1 rounded-lg px-2 py-1 ${hours <= 24
                            ? "bg-rose-500/15 text-rose-400"
                            : hours <= 24 * 7
                              ? "bg-amber-500/15 text-amber-400"
                              : "bg-secondary text-muted-foreground"
                            }`}
                        >
                          <Calendar className="h-3 w-3" />

                          <span className="text-[10px] font-mono font-medium">
                            {formatExpires(doc.expiresIn, doc.expiresUnit)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                }))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Security */}
      {/* <div className="max-w-7xl mx-auto mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3"> */}
      {/* Quick Actions */}
      {/* <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5">
          <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-violet-500/5 blur-3xl" />
          <div className="relative">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
              <p className="text-xs text-muted-foreground">Frequently used features</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/30 border border-transparent hover:border-violet-500/30 hover:bg-violet-500/10 transition-all group">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400 group-hover:scale-110 transition-transform">
                  <FileUp className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-foreground">Upload</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/30 border border-transparent hover:border-cyan-500/30 hover:bg-cyan-500/10 transition-all group">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400 group-hover:scale-110 transition-transform">
                  <Share2 className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-foreground">Share</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/30 border border-transparent hover:border-emerald-500/30 hover:bg-emerald-500/10 transition-all group">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 group-hover:scale-110 transition-transform">
                  <Key className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-foreground">Decrypt</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/30 border border-transparent hover:border-amber-500/30 hover:bg-amber-500/10 transition-all group">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 group-hover:scale-110 transition-transform">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-foreground">Browse</span>
              </button>
            </div>
          </div>
        </div> */}

      {/* Security Status */}
      {/* <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5">
          <div className="absolute -bottom-16 -right-16 h-32 w-32 rounded-full bg-emerald-500/5 blur-3xl" />
          <div className="relative">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground">Security Status</h3>
              <p className="text-xs text-muted-foreground">Your encryption keys</p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
                  <Lock className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-xs font-medium text-foreground">Private Key</span>
                  <span className="text-[10px] text-emerald-400">Active</span>
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="flex flex-col gap-2 p-3 rounded-xl bg-secondary/30">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Key created</span>
                  <span className="text-[10px] font-mono text-foreground">Jan 15, 2026</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Algorithm</span>
                  <span className="text-[10px] font-mono text-foreground">RSA-4096</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Fingerprint</span>
                  <span className="text-[10px] font-mono text-muted-foreground">A7:3F:...92:1B</span>
                </div>
              </div>
            </div>
          </div>
        </div> */}
      {/* </div> */}
    </>
  )
}

export default function DashboardPage() {
  const { role, loading } = useUser()
  const isAdmin = role === "admin"

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="relative flex flex-col items-center gap-4">

          {/* Анимированный круг */}
          <div className="h-12 w-12 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />

          {/* Текст */}
          <p className="text-sm text-muted-foreground font-medium tracking-wide">
            Загружаем данные…
          </p>

          {/* Glow эффект */}
          <div className="absolute -z-10 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Dashboard"
        breadcrumbs={[{ label: "Dashboard" }]}
      />

      <div className="flex-1 overflow-auto p-6">


        {isAdmin ? <AdminDashboard /> : <UserDashboard />}
      </div>
    </div>
  )
}
