"use client"

import { useEffect, useState } from "react"
import {
  Search,
  Filter,
  Download,
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
import { getAuditLogs } from "@/lib/api/audit"

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

// const auditLogs: AuditEntry[] = [
//   { id: "1", user: "Ivanov I.", email: "ivanov@company.com", action: "DOWNLOAD", targetType: "Document", targetId: "doc-001", targetName: "Q4_Report.pdf", timestamp: "2026-02-16 14:32:05", ipAddress: "192.168.1.45" },
//   { id: "2", user: "Petrova A.", email: "petrova@company.com", action: "SHARE", targetType: "Document", targetId: "doc-002", targetName: "Budget_2026.xlsx", timestamp: "2026-02-16 14:28:12", ipAddress: "192.168.1.78" },
//   { id: "3", user: "Sidorov K.", email: "sidorov@company.com", action: "CREATE", targetType: "Document", targetId: "doc-003", targetName: "Proposal_v3.docx", timestamp: "2026-02-16 14:15:33", ipAddress: "192.168.1.22" },
//   { id: "4", user: "Kozlova M.", email: "kozlova@company.com", action: "UPDATE", targetType: "Document", targetId: "doc-004", targetName: "NDA_Template.pdf", timestamp: "2026-02-16 13:45:18", ipAddress: "192.168.1.91" },
//   { id: "5", user: "Novikov D.", email: "novikov@company.com", action: "DELETE", targetType: "Document", targetId: "doc-005", targetName: "Old_Invoice.pdf", timestamp: "2026-02-16 13:30:42", ipAddress: "10.0.0.15" },
//   { id: "6", user: "Admin", email: "admin@company.com", action: "LOGIN", targetType: "System", targetId: "session-101", targetName: "Admin Session", timestamp: "2026-02-16 13:00:00", ipAddress: "10.0.0.1" },
//   { id: "7", user: "Ivanov I.", email: "ivanov@company.com", action: "SHARE", targetType: "Document", targetId: "doc-006", targetName: "Architecture.png", timestamp: "2026-02-16 12:45:19", ipAddress: "192.168.1.45" },
//   { id: "8", user: "Petrova A.", email: "petrova@company.com", action: "DOWNLOAD", targetType: "Document", targetId: "doc-007", targetName: "Security_Audit.pdf", timestamp: "2026-02-16 12:30:55", ipAddress: "192.168.1.78" },
//   { id: "9", user: "Sidorov K.", email: "sidorov@company.com", action: "UPDATE", targetType: "Document", targetId: "doc-008", targetName: "Employee_Handbook.pdf", timestamp: "2026-02-16 11:20:08", ipAddress: "192.168.1.22" },
//   { id: "10", user: "Kozlova M.", email: "kozlova@company.com", action: "CREATE", targetType: "Document", targetId: "doc-009", targetName: "API_Docs_v2.docx", timestamp: "2026-02-16 10:55:41", ipAddress: "192.168.1.91" },
//   { id: "11", user: "Novikov D.", email: "novikov@company.com", action: "DOWNLOAD", targetType: "Document", targetId: "doc-010", targetName: "Invoice_Dec.xlsx", timestamp: "2026-02-16 10:10:22", ipAddress: "10.0.0.15" },
//   { id: "12", user: "Ivanov I.", email: "ivanov@company.com", action: "LOGIN", targetType: "System", targetId: "session-102", targetName: "User Session", timestamp: "2026-02-16 09:00:00", ipAddress: "192.168.1.45" },
// ]

function getActionBadge(action: string) {
  const styles: Record<string, string> = {
    CREATE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    UPDATE: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    DELETE: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    DOWNLOAD: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    SHARE: "bg-violet-500/15 text-violet-400 border-violet-500/30",
    LOGIN: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  }
  const dots: Record<string, string> = {
    CREATE: "bg-emerald-400",
    UPDATE: "bg-sky-400",
    DELETE: "bg-rose-400",
    DOWNLOAD: "bg-amber-400",
    SHARE: "bg-violet-400",
    LOGIN: "bg-cyan-400",
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

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    const { data } = await getAuditLogs()

    const mapped: AuditEntry[] = data.results.map((log: any) => ({
      id: log.id,
      user: log.user_name || "Unknown",
      email: log.user_email || "",
      action: log.action,
      targetType: log.target_type || "",
      targetId: log.target_id || "",
      targetName: log.target_type || "",
      timestamp: log.timestamp,
      ipAddress: log.ip_address || "",
    }))

    setLogs(mapped)
  }

  const filtered = logs.filter((log) => {
    const matchSearch =
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.targetName.toLowerCase().includes(search.toLowerCase()) ||
      log.email.toLowerCase().includes(search.toLowerCase())
    const matchAction = actionFilter === "all" || log.action === actionFilter
    return matchSearch && matchAction
  })

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Audit Log"
        breadcrumbs={[{ label: "Audit Log" }]}
      >
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <Download className="mr-2 h-3 w-3" />
          Export
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by user, email, or file..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-9 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground text-xs"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="h-8 w-36 bg-secondary/50 border-border text-xs text-muted-foreground">
                <Filter className="mr-2 h-3 w-3" />
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground border-border">
                <SelectItem value="all" className="text-xs">All Actions</SelectItem>
                <SelectItem value="CREATE" className="text-xs">CREATE</SelectItem>
                <SelectItem value="UPDATE" className="text-xs">UPDATE</SelectItem>
                <SelectItem value="DELETE" className="text-xs">DELETE</SelectItem>
                <SelectItem value="DOWNLOAD" className="text-xs">DOWNLOAD</SelectItem>
                <SelectItem value="SHARE" className="text-xs">SHARE</SelectItem>
                <SelectItem value="LOGIN" className="text-xs">LOGIN</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary">
            <Calendar className="mr-2 h-3 w-3" />
            Date Range
          </Button>
        </div>

        {/* Summary badges */}
        <div className="mb-4 flex flex-wrap gap-2">
          {["CREATE", "UPDATE", "DELETE", "DOWNLOAD", "SHARE", "LOGIN"].map((action) => {
            const count = logs.filter((l) => l.action === action).length
            return (
              <button
                key={action}
                onClick={() => setActionFilter(actionFilter === action ? "all" : action)}
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
        <div className="relative rounded-2xl border border-border/50 bg-card overflow-hidden">
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
              {filtered.map((log) => (
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
                          {log.user.slice(0, 2).toUpperCase()}
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
                      <span className="text-xs text-foreground">{log.targetName}</span>
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
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {"Showing "}
            <span className="font-mono text-foreground">{filtered.length}</span>
            {" of "}
            <span className="font-mono text-foreground">{logs.length}</span>
            {" events"}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7 bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary" disabled>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="sm" className="h-7 min-w-7 bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] text-primary-foreground border-0 text-xs">
              1
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7 bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary" disabled>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
