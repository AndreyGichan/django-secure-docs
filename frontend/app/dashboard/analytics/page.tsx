"use client"

import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import { AlertTriangle, TrendingUp, Download, Share2, Users } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getTopUsers,
  getDocumentActivity,
  getDownloadActivity,
  getSharingActivity,
  getRolesDistribution,
  getDailyActivity,
  getSuspiciousActivity,
  getCollaborationIndex
} from "@/lib/api/reports"


const PIE_COLORS = [
  "hsl(262, 83%, 58%)",
  "hsl(190, 95%, 39%)",
  "hsl(280, 65%, 60%)",
]

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
        <p className="font-medium">{label}</p>
        <p className="text-muted-foreground">
          {"Значение: "}
          <span className="font-mono text-foreground">{payload[0].value}</span>
        </p>
      </div>
    )
  }
  return null
}

function getRiskBadge(risk: string) {
  if (risk === "high") {
    return (
      <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] font-mono">
        Высокий риск
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] font-mono">
      Средний риск
    </Badge>
  )
}

export default function AnalyticsPage() {
  const [downloadActivity, setDownloadActivity] = useState<any[]>([])
  const [sharingActivity, setSharingActivity] = useState<any[]>([])
  const [documentActivity, setDocumentActivity] = useState<any[]>([])
  const [dailyActivity, setDailyActivity] = useState<any[]>([])
  const [rolesDistribution, setRolesDistribution] = useState<any[]>([])
  const [suspiciousActivity, setSuspiciousActivity] = useState<any[]>([])
  const [topUsers, setTopUsers] = useState<any[]>([])
  const [collaborationIndex, setCollaborationIndex] = useState<any[]>([])
  const maxScore = Math.max(...collaborationIndex.map(u => u.score), 1)

  useEffect(() => {
    const loadData = async () => {
      const [
        downloads,
        sharing,
        documents,
        daily,
        roles,
        suspicious,
        collaboration,
        top
      ] = await Promise.all([
        getDownloadActivity(),
        getSharingActivity(),
        getDocumentActivity(),
        getDailyActivity(),
        getRolesDistribution(),
        getSuspiciousActivity(),
        getCollaborationIndex(),
        getTopUsers()
      ])

      setDownloadActivity(
        downloads.data.map((u: any) => ({
          email: u.user_email,
          downloads: u.downloads_count
        }))
      )
      setSharingActivity(
        sharing.data.map((u: any) => ({
          email: u.owner_email,
          shared: u.total_shared
        }))
      )
      setDocumentActivity(
        documents.data.map((doc: any) => ({
          ...doc,
          last_accessed: doc.last_accessed
            ? new Date(doc.last_accessed).toLocaleString()
            : "Никогда"
        }))
      )
      setDailyActivity(
        daily.data.map((d: any) => ({
          date: new Date(d.date).toLocaleDateString(),
          actions: d.actions_count
        }))
      )
      setRolesDistribution(
        roles.data.map((r: any) => ({
          role: r.role,
          count: r.users_count
        }))
      )
      setSuspiciousActivity(
        suspicious.data.map((u: any) => ({
          email: u.user_email,
          downloads: u.downloads_count,
          risk: u.downloads_count > 50 ? "high" : "medium"
        }))
      )
      setCollaborationIndex(
        collaboration.data.map((u: any) => ({
          email: u.user_email,
          score: u.collaboration_index
        }))
      )
      setTopUsers(
        top.data.map((u: any) => ({
          email: u.user_email,
          actions_count: u.actions_count
        }))
      )
    }

    loadData()
  }, [])

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Analytics"
        breadcrumbs={[{ label: "Analytics" }]}
      />

      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="overview" className="w-full max-w-7xl mx-auto">
          <TabsList className="mb-6 bg-secondary/50 border border-border/50">
            <TabsTrigger
              value="overview"
              className="text-xs font-mono data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--gradient-from))] data-[state=active]:to-[hsl(var(--gradient-to))] data-[state=active]:text-primary-foreground"
            >
              Обзор
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="text-xs font-mono data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--gradient-from))] data-[state=active]:to-[hsl(var(--gradient-to))] data-[state=active]:text-primary-foreground"
            >
              Документы
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="text-xs font-mono data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--gradient-from))] data-[state=active]:to-[hsl(var(--gradient-to))] data-[state=active]:text-primary-foreground"
            >
              Пользователи
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="text-xs font-mono data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--gradient-from))] data-[state=active]:to-[hsl(var(--gradient-to))] data-[state=active]:text-primary-foreground"
            >
              Безопасность
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Daily Activity Trend */}
              <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5">
                <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-violet-500/5 blur-3xl" />
                <div className="mb-4">
                  <h3 className="text-sm font-mono font-medium text-foreground">Ежедневная активность</h3>
                  <p className="text-xs font-mono text-muted-foreground">Дейстивя по дням</p>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={dailyActivity}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(190, 95%, 39%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 14%)" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="actions" stroke="hsl(262, 83%, 58%)" strokeWidth={2} fill="url(#areaGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Roles Distribution */}
              <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5">
                <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-cyan-500/5 blur-3xl" />
                <div className="mb-4">
                  <h3 className="text-sm font-mono font-medium text-foreground">Распределение ролей</h3>
                  <p className="text-xs font-mono text-muted-foreground">Пользователи по ролям</p>
                </div>
                <div className="flex items-center gap-8">
                  <ResponsiveContainer width="50%" height={220}>
                    <PieChart>
                      <Pie
                        data={rolesDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="count"
                        stroke="none"
                      >
                        {rolesDistribution.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-4">
                    {rolesDistribution.map((item, i) => (
                      <div key={item.role} className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-foreground">{item.role}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{item.count} пользователей</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Download Activity */}
              <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5">
                <div className="absolute -top-16 -left-16 h-32 w-32 rounded-full bg-purple-500/5 blur-3xl" />
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15 border border-violet-500/20">
                    <Download className="h-3.5 w-3.5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-mono font-medium text-foreground">Активность загрузок</h3>
                    <p className="text-xs font-mono text-muted-foreground">Загрузки по пользователям</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={downloadActivity} barSize={24}>
                    <defs>
                      <linearGradient id="dlGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(262, 83%, 58%)" />
                        <stop offset="100%" stopColor="hsl(190, 95%, 39%)" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 14%)" vertical={false} />
                    <XAxis
                      dataKey="email"
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={60}
                      tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 9 }}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="downloads" fill="url(#dlGrad)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Sharing Activity */}
              <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5">
                <div className="absolute -bottom-16 -right-16 h-32 w-32 rounded-full bg-cyan-500/5 blur-3xl" />
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/15 border border-cyan-500/20">
                    <Share2 className="h-3.5 w-3.5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-mono font-medium text-foreground">Активность предоставления доступа</h3>
                    <p className="text-xs font-mono text-muted-foreground">Предоставление доступа по владельцам</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={sharingActivity} barSize={24}>
                    <defs>
                      <linearGradient id="shareGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(190, 95%, 39%)" />
                        <stop offset="100%" stopColor="hsl(262, 83%, 58%)" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 14%)" vertical={false} />
                    <XAxis
                      dataKey="email"
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={60}
                      tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 9 }}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="shared" fill="url(#shareGrad)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-0 max-w-7xl mx-auto">
            <div className="relative rounded-2xl border border-border/50 bg-card overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
              <div className="p-5 border-b border-border/50">
                <h3 className="text-sm font-mono font-medium text-foreground">Отчет по активности документов</h3>
                <p className="text-xs font-mono text-muted-foreground">Метрики активности по документам</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Document</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium text-center">Versions</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium text-center">Downloads</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Last Accessed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentActivity.map((doc, i) => (
                    <TableRow key={i} className="border-border/30 hover:bg-secondary/30">
                      <TableCell
                        className="text-xs font-medium text-foreground truncate max-w-[220px] cursor-default"
                        title={doc.title}
                      >
                        {doc.title}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-mono text-xs text-muted-foreground">v{doc.total_versions}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-mono text-xs text-foreground">{doc.total_downloads}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{doc.last_accessed}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-0 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5">
                <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-violet-500/5 blur-3xl" />
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15 border border-violet-500/20">
                    <Users className="h-3.5 w-3.5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-mono font-medium text-foreground">Индекс сотрудничества</h3>
                    <p className="text-xs font-mono text-muted-foreground">Оценка активности пользователей на основе предоставления доступа и загрузок</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  {collaborationIndex.map((user, i) => (
                    <div key={user.email} className="flex items-center gap-3">
                      <span className="w-5 text-xs font-mono text-muted-foreground text-right">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-foreground">{user.email}</span>
                          <span className="text-xs font-mono text-muted-foreground">{user.score.toFixed(2)}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))]"
                            style={{ width: `${(user.score / maxScore) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Active Users */}
              <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5">
                <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-cyan-500/5 blur-3xl" />
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/20">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-mono font-medium text-foreground">Самые активные пользователи</h3>
                    <p className="text-xs font-mono text-muted-foreground">Наибольшее количество действий за период</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topUsers} layout="vertical" barSize={18}>
                    <defs>
                      <linearGradient id="topBarGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="hsl(262, 83%, 58%)" />
                        <stop offset="100%" stopColor="hsl(190, 95%, 39%)" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 14%)" horizontal={false} />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 10 }} />
                    <YAxis type="category" dataKey="email" axisLine={false} tickLine={false} tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 9 }} width={140} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="actions_count" fill="url(#topBarGrad)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="mt-0 max-w-7xl mx-auto">
            <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-card p-5">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/40 to-transparent" />
              <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-rose-500/5 blur-3xl" />
              <div className="mb-4 flex items-center gap-2">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-red-600/20 border border-rose-500/20">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  <div className="absolute -inset-0.5 rounded-xl bg-rose-500/10 blur-sm" />
                </div>
                <div>
                  <h3 className="text-sm font-mono font-medium text-foreground">Подозрительная активность</h3>
                  <p className="text-xs font-mono text-muted-foreground">Пользователи с аномально высоким количеством загрузок</p>
                </div>
              </div>
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">User</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium text-center">Downloads</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Risk Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suspiciousActivity.map((user, i) => (
                      <TableRow key={i} className="border-border/30 hover:bg-red-500/5">
                        <TableCell className="text-xs font-medium text-foreground">{user.email}</TableCell>
                        <TableCell className="text-center font-mono text-xs text-foreground">{user.downloads}</TableCell>
                        <TableCell>{getRiskBadge(user.risk)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
