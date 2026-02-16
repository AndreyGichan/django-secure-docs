"use client"

import { useState } from "react"
import {
  FileText,
  Upload,
  Search,
  MoreHorizontal,
  Download,
  Share2,
  Trash2,
  Eye,
  Clock,
  Filter,
  Plus,
  ArrowUpDown,
  X,
  File,
  FileSpreadsheet,
  FileImage,
  ChevronLeft,
  ChevronRight,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

interface Document {
  id: string
  title: string
  type: string
  size: string
  version: number
  owner: string
  sharedWith: number
  lastModified: string
  status: "active" | "archived" | "draft"
}

const documents: Document[] = [
  { id: "1", title: "Q4_Financial_Report_2025.pdf", type: "pdf", size: "2.4 MB", version: 5, owner: "Ivanov I.", sharedWith: 8, lastModified: "2 hours ago", status: "active" },
  { id: "2", title: "Budget_Forecast_2026.xlsx", type: "xlsx", size: "1.1 MB", version: 3, owner: "Petrova A.", sharedWith: 5, lastModified: "5 hours ago", status: "active" },
  { id: "3", title: "NDA_Template_v2.docx", type: "docx", size: "340 KB", version: 2, owner: "Sidorov K.", sharedWith: 12, lastModified: "1 day ago", status: "active" },
  { id: "4", title: "Product_Roadmap.pdf", type: "pdf", size: "5.7 MB", version: 8, owner: "Kozlova M.", sharedWith: 15, lastModified: "1 day ago", status: "active" },
  { id: "5", title: "Meeting_Notes_Jan.docx", type: "docx", size: "89 KB", version: 1, owner: "Novikov D.", sharedWith: 3, lastModified: "2 days ago", status: "draft" },
  { id: "6", title: "Architecture_Diagram.png", type: "png", size: "3.2 MB", version: 4, owner: "Ivanov I.", sharedWith: 10, lastModified: "3 days ago", status: "active" },
  { id: "7", title: "Security_Audit_2025.pdf", type: "pdf", size: "1.8 MB", version: 2, owner: "Petrova A.", sharedWith: 2, lastModified: "5 days ago", status: "archived" },
  { id: "8", title: "Employee_Handbook.pdf", type: "pdf", size: "4.5 MB", version: 12, owner: "Sidorov K.", sharedWith: 45, lastModified: "1 week ago", status: "active" },
  { id: "9", title: "API_Documentation.docx", type: "docx", size: "678 KB", version: 6, owner: "Kozlova M.", sharedWith: 8, lastModified: "1 week ago", status: "active" },
  { id: "10", title: "Invoice_Dec_2025.xlsx", type: "xlsx", size: "245 KB", version: 1, owner: "Novikov D.", sharedWith: 1, lastModified: "2 weeks ago", status: "archived" },
]

function getFileIcon(type: string) {
  switch (type) {
    case "pdf":
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-red-600/20 border border-rose-500/10">
          <File className="h-4 w-4 text-rose-400" />
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

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return (
        <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-mono">
          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Active
        </Badge>
      )
    case "archived":
      return (
        <Badge variant="outline" className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px] font-mono">
          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
          Archived
        </Badge>
      )
    case "draft":
      return (
        <Badge variant="outline" className="bg-sky-500/15 text-sky-400 border-sky-500/30 text-[10px] font-mono">
          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-sky-400" />
          Draft
        </Badge>
      )
    default:
      return null
  }
}

export default function DocumentsPage() {
  const [search, setSearch] = useState("")
  const [uploadOpen, setUploadOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)

  const filtered = documents.filter((doc) =>
    doc.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Documents"
        breadcrumbs={[
          { label: "Documents" },
        ]}
      >
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] text-primary-foreground hover:opacity-90 border-0">
              <Upload className="mr-2 h-3.5 w-3.5" />
              Upload
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Upload Document</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Upload a new document or a new version of an existing one.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">File</Label>
                <div className="flex h-32 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/30 transition-colors hover:border-[hsl(var(--gradient-from))]/50 hover:bg-secondary/50">
                  <div className="flex flex-col items-center gap-2">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Drop files here or click to browse
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">Title</Label>
                <Input
                  placeholder="Document title"
                  className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">Access</Label>
                <Select>
                  <SelectTrigger className="bg-secondary/50 border-border text-foreground">
                    <SelectValue placeholder="Select access level" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground border-border">
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="public">All users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setUploadOpen(false)} className="text-muted-foreground hover:text-foreground hover:bg-secondary">
                Cancel
              </Button>
              <Button className="bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] text-primary-foreground hover:opacity-90 border-0">
                Upload
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-9 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground text-xs"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary">
              <Filter className="mr-2 h-3 w-3" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary">
              <ArrowUpDown className="mr-2 h-3 w-3" />
              Sort
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="relative rounded-2xl border border-border/50 bg-card overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Document</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Owner</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium text-center">Version</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium text-center">Shared</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Status</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Modified</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((doc) => (
                <TableRow
                  key={doc.id}
                  className="border-border/30 cursor-pointer hover:bg-secondary/30"
                  onClick={() => {
                    setSelectedDoc(doc)
                    setDetailOpen(true)
                  }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {getFileIcon(doc.type)}
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-foreground">
                          {doc.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {doc.size}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {doc.owner}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-mono text-xs text-muted-foreground">
                      v{doc.version}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-mono text-xs text-muted-foreground">
                      {doc.sharedWith}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(doc.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className="text-[10px]">{doc.lastModified}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border w-44">
                        <DropdownMenuItem className="text-xs">
                          <Eye className="mr-2 h-3.5 w-3.5" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-xs">
                          <Download className="mr-2 h-3.5 w-3.5" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-xs">
                          <Share2 className="mr-2 h-3.5 w-3.5" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem className="text-xs text-destructive">
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
            <span className="font-mono text-foreground">{documents.length}</span>
            {" documents"}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7 bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary" disabled>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="sm" className="h-7 min-w-7 bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] text-primary-foreground border-0 text-xs">
              1
            </Button>
            <Button variant="outline" size="sm" className="h-7 min-w-7 bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary text-xs">
              2
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7 bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary">
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Document Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-card text-card-foreground border-border max-w-lg">
          {selectedDoc && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    {getFileIcon(selectedDoc.type)}
                  </div>
                  <div>
                    <DialogTitle className="text-foreground text-sm">{selectedDoc.title}</DialogTitle>
                    <DialogDescription className="text-muted-foreground text-xs">
                      {selectedDoc.size} - Version {selectedDoc.version}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <Separator className="bg-border/50" />
              <div className="flex flex-col gap-3 py-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Owner</span>
                  <span className="text-foreground font-medium">{selectedDoc.owner}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Status</span>
                  {getStatusBadge(selectedDoc.status)}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Shared With</span>
                  <span className="text-foreground font-mono">{selectedDoc.sharedWith} users</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Last Modified</span>
                  <span className="text-foreground">{selectedDoc.lastModified}</span>
                </div>
                <Separator className="bg-border/50" />
                <div>
                  <span className="text-xs text-muted-foreground">Version History</span>
                  <div className="mt-2 flex flex-col gap-1.5">
                    {Array.from({ length: Math.min(selectedDoc.version, 3) }, (_, i) => (
                      <div key={i} className="flex items-center justify-between rounded-md bg-secondary/30 px-3 py-2 text-xs">
                        <span className="font-mono text-foreground">v{selectedDoc.version - i}</span>
                        <span className="text-muted-foreground">{i === 0 ? "Current" : `${i * 3} days ago`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter className="flex gap-2">
                <Button variant="outline" size="sm" className="bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary text-xs">
                  <Share2 className="mr-2 h-3 w-3" />
                  Share
                </Button>
                <Button size="sm" className="bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] text-primary-foreground hover:opacity-90 border-0 text-xs">
                  <Download className="mr-2 h-3 w-3" />
                  Download
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
