"use client"

import { useEffect, useState } from "react"
import {
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ArrowUpDown,
} from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { getAuditLogs, getAuditActionCounts } from "@/lib/api/audit"

interface AuditEntry {
  id: string
  user: string
  email: string
  action: string
  targetType: string
  targetId: string
  targetName: string
  timestamp: string
  ipAddress: string
}

function getActionBadge(action: string) {
  const styles: Record<string, string> = {
    CREATE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    UPDATE: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    DELETE: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    DOWNLOAD: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    SHARE: "bg-violet-500/15 text-violet-400 border-violet-500/30",
    LOGIN: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    LOGOUT: "bg-red-500/15 text-red-400 border-red-500/30",
    APPROVE: "bg-blue-500/15 text-blue-400 border-blue-500/30"
  }
  const dots: Record<string, string> = {
    CREATE: "bg-emerald-400",
    UPDATE: "bg-sky-400",
    DELETE: "bg-rose-400",
    DOWNLOAD: "bg-amber-400",
    SHARE: "bg-violet-400",
    LOGIN: "bg-cyan-400",
    LOGOUT: "bg-red-400",
    APPROVE: "bg-blue-400"
  }
  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-mono ${styles[action] || "bg-secondary text-muted-foreground border-border"}`}
    >
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${dots[action] || "bg-muted-foreground"}`} />
      {action}
    </Badge>
  )
}

export default function AuditPage() {
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [actionCounts, setActionCounts] = useState<Record<string, number>>({})
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  useEffect(() => {
    loadLogs()
    loadActionCounts()
  }, [page, pageSize, actionFilter, search, dateRange])

  const loadLogs = async () => {
    const { data } = await getAuditLogs({
      limit: pageSize,
      offset: (page - 1) * pageSize,
      action: actionFilter !== "all" ? actionFilter : undefined,
      search: search || undefined,
      date_from: dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
      date_to: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    })

    const mapped: AuditEntry[] = data.results.map((log: any) => ({
      id: log.id,
      user: log.user_name || "Unknown",
      email: log.user_email || "",
      action: log.action,
      targetType: log.target_type || "",
      targetId: log.target_id || "",
      targetName: log.target_name || "",
      timestamp: log.timestamp,
      ipAddress: log.ip_address || "",
    }))

    setLogs(mapped)
    setTotalCount(data.count)
  }

  const loadActionCounts = async () => {
    try {
      const { data } = await getAuditActionCounts({
        search,
        date_from: dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
        date_to: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
      })
      setActionCounts(data)
    } catch (err) {
      console.error("Failed to load action counts", err)
    }
  }


  function getPaginationPages(currentPage: number, totalPages: number, maxVisible = 3): (number | "...")[] {
    const pages: (number | "...")[] = []

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
      return pages
    }

    const half = Math.floor(maxVisible / 2)
    let start = Math.max(2, currentPage - half)
    let end = Math.min(totalPages - 1, currentPage + half)

    if (currentPage - 1 <= half) start = 2
    if (totalPages - currentPage <= half) end = totalPages - 1

    pages.push(1)
    if (start > 2) pages.push("...")
    for (let i = start; i <= end; i++) pages.push(i)
    if (end < totalPages - 1) pages.push("...")
    pages.push(totalPages)

    return pages
  }

  const clearDateRange = () => {
    setDateRange({ from: undefined, to: undefined })
  }

  function getUserInitials(name: string) {
    if (!name) return "?"

    const parts = name.trim().split(" ")

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase()
    }

    return (parts[0][0] + parts[1][0]).toUpperCase()
  }


  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Audit Log"
        breadcrumbs={[{ label: "Audit Log" }]}
      >
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        {/* Filters */}
        <div className="mb-4 max-w-7xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск по пользователю, email или файлу..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="h-8 pl-9 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground text-xs tracking-wide"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="h-8 w-40 bg-secondary/50 border-border text-xs font-mono text-muted-foreground">
                <Filter className="mr-1 h-3 w-3" />
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground border-border">
                <SelectItem value="all" className="text-xs">Все действия</SelectItem>
                <SelectItem value="CREATE" className="text-xs">CREATE</SelectItem>
                <SelectItem value="UPDATE" className="text-xs">UPDATE</SelectItem>
                <SelectItem value="DELETE" className="text-xs">DELETE</SelectItem>
                <SelectItem value="DOWNLOAD" className="text-xs">DOWNLOAD</SelectItem>
                <SelectItem value="SHARE" className="text-xs">SHARE</SelectItem>
                <SelectItem value="LOGIN" className="text-xs">LOGIN</SelectItem>
                <SelectItem value="LOGOUT" className="text-xs">LOGOUT</SelectItem>
                <SelectItem value="APPROVE" className="text-xs">APPROVE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-8 text-xs font-mono bg-secondary/50 border-border hover:text-foreground hover:bg-secondary ${dateRange.from || dateRange.to ? "text-foreground border-violet-500/50" : "text-muted-foreground"
                  }`}
              >
                <Calendar className="h-3 w-3" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd.MM.yy")} - {format(dateRange.to, "dd.MM.yy")}
                    </>
                  ) : (
                    format(dateRange.from, "dd.MM.yyyy")
                  )
                ) : (
                  "Период"
                )}
                {(dateRange.from || dateRange.to) && (
                  <span
                    role="button"
                    className="ml-2 p-0.5 rounded hover:bg-rose-500/20 transition-colors"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      clearDateRange()
                    }}
                    onPointerDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                  >
                    <X className="h-3 w-3 hover:text-rose-400" />
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-popover border-border"
              align="end"
              sideOffset={4}
            >
              <div className="p-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium font-mono text-foreground">Выберите диапазон дат</span>
                  {(dateRange.from || dateRange.to) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] font-mono text-muted-foreground hover:text-foreground"
                      onClick={clearDateRange}
                    >
                      Очистить
                    </Button>
                  )}
                </div>
                {dateRange.from && (
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="font-mono bg-secondary/50 px-1.5 py-0.5 rounded">
                      {format(dateRange.from, "dd.MM.yyyy")}
                    </span>
                    {dateRange.to && (
                      <>
                        <span>-</span>
                        <span className="font-mono bg-secondary/50 px-1.5 py-0.5 rounded">
                          {format(dateRange.to, "dd.MM.yyyy")}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <CalendarComponent
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  setDateRange({ from: range?.from, to: range?.to })
                }}
                numberOfMonths={2}
                className="p-3"
              />
              <div className="p-3 border-t border-border flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs tracking-wide bg-secondary/50 border-border text-muted-foreground hover:text-foreground"
                  onClick={() => setDatePickerOpen(false)}
                >
                  Отмена
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs tracking-wide bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] text-primary-foreground border-0"
                  onClick={() => {
                    setPage(1)
                    setDatePickerOpen(false)
                  }}
                >
                  Применить
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Summary badges */}
        <div className="mb-4 max-w-7xl mx-auto flex flex-wrap gap-2">
          {["CREATE", "UPDATE", "DELETE", "DOWNLOAD", "SHARE", "LOGIN", "LOGOUT", "APPROVE"].map((action) => {
            const count = actionCounts[action] || 0
            return (
              <button
                key={action}
                onClick={() => {
                  setActionFilter(actionFilter === action ? "all" : action)
                  setPage(1)
                }}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-mono transition-colors ${actionFilter === action
                  ? "border-[hsl(var(--gradient-from))]/50 bg-[hsl(var(--gradient-from))]/10 text-foreground"
                  : "border-border/50 bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
              >
                {action}
                <span className="rounded bg-secondary/50 px-1.5 py-0.5 text-[9px]">{count}</span>
              </button>
            )
          })}
        </div>

        {/* Table */}
        <div className="relative max-w-7xl mx-auto rounded-2xl border border-border/50 bg-card overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">
                  <button className="flex items-center gap-1">
                    Timestamp <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">User</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Action</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Target</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="border-border/30 hover:bg-secondary/30">
                  <TableCell className="font-mono text-[11px] text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/10">
                        <span className="text-[9px] font-bold text-violet-400">
                          {getUserInitials(log.user)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-foreground">{log.user}</span>
                        <span className="text-[10px] text-muted-foreground">{log.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getActionBadge(log.action)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span
                        className="text-xs text-foreground truncate max-w-[220px] cursor-default"
                        title={log.targetName}
                      >
                        {log.targetName}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">{log.targetType} / {log.targetId}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">
                    {log.ipAddress}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="mt-4 max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-xs text-muted-foreground tracking-wide">
            {"Показано "}
            <span className="font-mono text-foreground">{logs.length}</span>
            {" из "}
            <span className="font-mono text-foreground">{totalCount}</span>
            {" событий"}
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            {getPaginationPages(page, Math.ceil(totalCount / pageSize)).map((p, idx) =>
              p === "..." ? (
                <span key={idx} className="px-2 text-xs">...</span>
              ) : (
                <Button
                  key={idx}
                  variant={p === page ? "default" : "outline"}
                  size="sm"
                  className={`h-7 min-w-7 text-xs ${p === page ? "bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] text-primary-foreground border-0" : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
                  onClick={() => setPage(p as number)}
                >
                  {p}
                </Button>
              )
            )}

            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
              disabled={page === Math.ceil(totalCount / pageSize)}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
