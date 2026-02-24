"use client"

import { useState, useEffect, useRef } from "react"
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
  ArrowUp,
  ArrowDown,
  X,
  File,
  FileSpreadsheet,
  FileImage,
  ChevronLeft,
  ChevronRight,
  Pencil,
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
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ShareDocumentDialog } from "@/components/share-document-dialog"
import { DownloadDocumentDialog } from "@/components/download-document-dialog"
import { getDocuments } from "@/lib/api/documents";
import { getCurrentUser, searchUsers } from "@/lib/api/auth"
import { updateDocument, createDocument, uploadDocumentVersion, deleteDocument, shareDocument } from "@/lib/api/documents"

interface Document {
  id: string
  title: string
  description: string
  type: string
  size: string
  owner_email: string
  owner_full_name: string
  version: number
  shared_with: number
  status: "active" | "archived" | "draft"
  created_at: string
  updated_at: string
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

function getStatusBadge(status: string, isSelected = false, compact = false) {
  const baseClasses = `text-[10px] font-mono rounded-xl ${compact ? "inline-flex items-center gap-1" : "flex items-center gap-1.5"
    }`

  switch (status) {
    case "active":
      return (
        <Badge
          variant="outline"
          className={`${baseClasses} bg-emerald-500/15 text-emerald-400 tracking-wide border-emerald-500/30 ${isSelected ? "ring-2 ring-emerald-400" : ""
            }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Активен
        </Badge>
      )
    case "archived":
      return (
        <Badge
          variant="outline"
          className={`${baseClasses} bg-amber-500/15 text-amber-400 tracking-wide border-amber-500/30 ${isSelected ? "ring-2 ring-amber-400" : ""
            }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          В архиве
        </Badge>
      )
    case "draft":
      return (
        <Badge
          variant="outline"
          className={`${baseClasses} bg-sky-500/15 text-sky-400 tracking-wide border-sky-500/30 ${isSelected ? "ring-2 ring-sky-400" : ""
            }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
          Черновик
        </Badge>
      )
    default:
      return null
  }
}

function formatOwnerName(fullName: string) {
  if (!fullName) return ""

  const parts = fullName.trim().split(/\s+/)

  if (parts.length === 1) return parts[0]

  const lastName = parts[0]
  const initials = parts
    .slice(1)
    .map((name) => name.charAt(0).toUpperCase() + ".")
    .join("")

  return `${lastName} ${initials}`
}

function formatRelativeDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()

  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return "только что"
  if (diffMinutes < 60) return `${diffMinutes} мин назад`
  if (diffHours < 24) return `${diffHours} ч назад`
  if (diffDays < 7) return `${diffDays} дн назад`

  return date.toLocaleDateString("ru-RU")
}

export default function DocumentsPage() {
  const [uploadOpen, setUploadOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [descriptionEdit, setDescriptionEdit] = useState("")
  const [editingDocId, setEditingDocId] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [filterStatus, setFilterStatus] = useState<Document["status"] | "all">("all")
  const [sortField, setSortField] = useState<keyof Document | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [filterOwner, setFilterOwner] = useState<string | "all">("all")
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState("")
  const [uploadDescription, setUploadDescription] = useState("")
  const [uploadType, setUploadType] = useState("")
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadVersionOpen, setUploadVersionOpen] = useState(false);
  const [uploadFileVersion, setUploadFileVersion] = useState<File | null>(null);
  const [uploadLoadingVersion, setUploadLoadingVersion] = useState(false);
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [totalCount, setTotalCount] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUserId, setShareUserId] = useState("");
  const [shareRole, setShareRole] = useState("read");
  const [shareLoading, setShareLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [shareDoc, setShareDoc] = useState<Document | null>(null)
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [downloadDoc, setDownloadDoc] = useState<Document | null>(null)

  const hiddenFileInput = useRef<HTMLInputElement>(null)


  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const res = await getCurrentUser()
        setCurrentUser(res.data)
      } catch (error) {
        console.error("Failed to fetch current user", error)
      }
    }
    fetchCurrentUser()
  }, [])


  useEffect(() => {
    if (selectedDoc) {
      setDescriptionEdit(selectedDoc.description || "")
    }
    setEditingDocId(null)
  }, [selectedDoc])


  useEffect(() => {
    if (searchInput.trim() === "") {
      setSearch("");
      setPage(1);
      return;
    }

    if (searchInput.length < 3) return;

    const handler = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 800);

    return () => clearTimeout(handler);
  }, [searchInput]);


  async function fetchDocuments() {
    if (!currentUser) return;
    setLoading(true);

    const params: any = {
      limit: pageSize,
      offset: (page - 1) * pageSize,
      search: search || undefined,
      status: filterStatus !== "all" ? filterStatus : undefined,
      owner:
        filterOwner === "mine"
          ? "mine"
          : filterOwner === "others"
            ? "others"
            : undefined,
      ordering: sortField
        ? sortDirection === "asc"
          ? sortField === "owner_full_name"
            ? "owner__full_name"
            : sortField === "version"
              ? "version_number"
              : sortField === "shared_with"
                ? "shared_with_count"
                : sortField
          : sortField === "owner_full_name"
            ? "-owner__full_name"
            : sortField === "version"
              ? "-version_number"
              : sortField === "shared_with"
                ? "-shared_with_count"
                : `-${sortField}`
        : undefined
    };

    try {
      const response = await getDocuments(params);
      setDocuments(response.data.results);
      setTotalCount(response.data.count);
    } catch (error) {
      console.error("Failed to fetch documents", error);
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    fetchDocuments();
  }, [search, filterStatus, filterOwner, sortField, sortDirection, currentUser, page]);


  const filtered = documents;
  const totalPages = Math.ceil(totalCount / pageSize);


  useEffect(() => {
    if (editingDocId && textareaRef.current) {
      const ta = textareaRef.current
      ta.style.height = "0px"
      ta.style.height = ta.scrollHeight + "px"
    }
  }, [editingDocId, descriptionEdit])


  const handleStatusChange = async (status: Document["status"]) => {
    if (!selectedDoc) return;

    const oldStatus = selectedDoc.status;

    setSelectedDoc((doc) => (doc ? { ...doc, status } : null));
    setDocuments((docs) =>
      docs.map((doc) =>
        doc.id === selectedDoc.id ? { ...doc, status } : doc
      )
    );

    try {
      await updateDocument(selectedDoc.id, { status });
    } catch (error) {
      console.error("Failed to update document status", error);
      setSelectedDoc((doc) => (doc ? { ...doc, status: oldStatus } : null));
      setDocuments((docs) =>
        docs.map((doc) =>
          doc.id === selectedDoc.id ? { ...doc, status: oldStatus } : doc
        )
      );
    }
  };


  const handleSort = (field: keyof Document) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };


  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle) {
      alert("Заполните все поля")
      return
    }

    try {
      setUploadLoading(true)

      const formData = new FormData()
      formData.append("file", uploadFile)
      formData.append("title", uploadTitle)
      formData.append("description", uploadDescription)
      formData.append("type", uploadType)

      await createDocument(formData)

      setUploadOpen(false)

      setUploadFile(null)
      setUploadTitle("")
      setUploadDescription("")
      setUploadType("")

      await fetchDocuments()

    } catch (error) {
      console.error("Upload error", error)
    } finally {
      setUploadLoading(false)
    }
  }


  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadFile(file)
    const extension = file.name.split(".").pop()?.toLowerCase() || ""
    setUploadType(extension)
  }


  const resetUploadForm = () => {
    setUploadFile(null)
    setUploadTitle("")
    setUploadDescription("")
    setUploadType("")
  }


  const handleFileSelectVersion = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFileVersion(file);
  };


  const handleUploadVersion = async () => {
    if (!uploadFileVersion || !selectedDoc) return;

    try {
      setUploadLoadingVersion(true);

      const formData = new FormData();
      formData.append("file", uploadFileVersion);

      await uploadDocumentVersion(selectedDoc.id, formData);

      setUploadVersionOpen(false);
      setUploadFileVersion(null);

      await fetchDocuments();
    } catch (error) {
      console.error("Failed to upload new version", error);
    } finally {
      setUploadLoadingVersion(false);
    }
  };


  const getDaysWord = (days: number) => {
    if (days % 10 === 1 && days % 100 !== 11) return "день";
    if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100))
      return "дня";
    return "дней";
  };


  const handleDelete = async () => {
    if (!docToDelete) return;
    try {
      await deleteDocument(docToDelete.id);
      setDocuments((docs) => docs.filter((d) => d.id !== docToDelete.id));
      setDeleteDialogOpen(false);
      setDocToDelete(null);

      if (documents.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchDocuments();
      }

      setTotalCount((count) => count - 1);
    } catch (error) {
      console.error("Failed to delete document", error);
    }
  };


  useEffect(() => {
    const handler = setTimeout(async () => {
      if (userSearch.trim().length < 1) {
        setUserResults([]);
        return;
      }

      try {
        setUserSearchLoading(true);
        const res = await searchUsers(userSearch); // API возвращает filtered users
        setUserResults(res.data);
      } catch (error) {
        console.error("User search error", error);
      } finally {
        setUserSearchLoading(false);
      }
    }, 500); // debounce 300ms

    return () => clearTimeout(handler);
  }, [userSearch]);


  const handleShare = async () => {
    if (!selectedDoc || !shareUserId) {
      alert("Выберите пользователя");
      return;
    }

    try {
      setShareLoading(true);

      await shareDocument(selectedDoc.id, {
        user_id: shareUserId,
        role: shareRole,
      });

      setShareOpen(false);
      setSelectedUser(null);
      setUserSearch("");
      setUserResults([]);
      setShareRole("read");

      await fetchDocuments();
    } catch (error: any) {
      console.error("Share error", error);
      alert(error?.response?.data?.detail || "Ошибка при выдаче доступа");
    } finally {
      setShareLoading(false);
    }
  };


  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Documents"
        breadcrumbs={[
          { label: "Documents" },
        ]}
      >
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск документов..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearch(searchInput);
                }
              }}
              className="h-8 pl-9 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground text-xs tracking-wide"
            />
            {search && (
              <button
                onClick={() => {
                  setSearchInput("")
                  setSearch("")
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">

            <Dialog
              open={uploadOpen}
              onOpenChange={(open) => {
                setUploadOpen(open)
                if (!open) resetUploadForm()
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] text-primary-foreground hover:opacity-90 border-0 tracking-wide">
                  <Upload className="h-3.5 w-3.5" />
                  Загрузить
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground tracking-wide">Upload Document</DialogTitle>
                  <DialogDescription className="text-muted-foreground tracking-wide">
                    Загрузите новый документ
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs text-muted-foreground">File</Label>

                    <input
                      type="file"
                      ref={hiddenFileInput}
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    <div
                      onClick={() => hiddenFileInput.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        const file = e.dataTransfer.files?.[0]
                        if (file) handleFileSelect({ target: { files: [file] } } as any)
                      }}
                      className="flex h-28 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/30 transition-colors hover:border-[hsl(var(--gradient-from))]/50 hover:bg-secondary/50"
                    >

                      {uploadFile ? (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-foreground">{uploadFile.name}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              setUploadFile(null)
                              setUploadType("")
                              if (hiddenFileInput.current) hiddenFileInput.current.value = ""
                            }}
                            className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Plus className="h-8 w-8 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground tracking-wide">
                            Перетащите файл или кликните, чтобы выбрать
                          </span>
                        </div>
                      )}
                    </div>


                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs text-muted-foreground">Title</Label>
                    <Input
                      placeholder="Название документа"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      className="bg-secondary/50 border-border text-foreground font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <Textarea
                      placeholder="Описание документа"
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      className="bg-secondary/50 border-border text-foreground font-mono"
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
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setUploadOpen(false)
                      resetUploadForm()
                    }}
                    className="text-muted-foreground hover:text-foreground hover:bg-secondary tracking-wide"
                  >
                    Отмена
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={uploadLoading}
                    className="bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] text-primary-foreground hover:opacity-90 border-0 tracking-wide"
                  >
                    {uploadLoading ? "Загрузка..." : "Загрузить"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs tracking-wide bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  <Filter className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-popover text-popover-foreground border-border w-44 p-2">
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Status</span>
                  <Select
                    value={filterStatus}
                    onValueChange={(value) => {
                      setFilterStatus(value as Document["status"] | "all")
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="h-7 text-xs bg-secondary/50 border-border text-foreground">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover text-popover-foreground border-border">
                      <SelectItem className="text-xs font-mono tracking-wide" value="all">Все</SelectItem>
                      <SelectItem className="text-xs font-mono tracking-wide" value="active">Активные</SelectItem>
                      <SelectItem className="text-xs font-mono tracking-wide" value="archived">В архиве</SelectItem>
                      <SelectItem className="text-xs font-mono tracking-wide" value="draft">Черновики</SelectItem>
                    </SelectContent>
                  </Select>

                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Owner</span>
                  <Select
                    value={filterOwner}
                    onValueChange={(value) => {
                      setFilterOwner(value as string)
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="h-7 text-xs bg-secondary/50 border-border text-foreground">
                      <SelectValue placeholder="Select owner" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover text-popover-foreground border-border">
                      <SelectItem className="text-xs font-mono tracking-wide" value="all">Все</SelectItem>
                      <SelectItem className="text-xs font-mono tracking-wide" value="mine">Мои документы</SelectItem>
                      <SelectItem className="text-xs font-mono tracking-wide" value="others">Остальные</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>

        {/* Table */}
        <div className="relative rounded-2xl border border-border/50 bg-card overflow-hidden">

          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/10 backdrop-blur-sm">
              <div className="h-10 w-10 border-4 border-t-4 border-t-indigo-500 border-gray-300 rounded-full animate-spin"></div>
            </div>
          )}

          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead
                  className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium"
                  onClick={() => handleSort("title")}
                >
                  <div className="flex items-center gap-1 justify-start">
                    Document
                    {sortField === "title" && (
                      sortDirection === "asc"
                        ? <ArrowUp className="h-3 w-3" />
                        : <ArrowDown className="h-3 w-3" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium"
                  onClick={() => handleSort("owner_full_name")}
                >
                  <div className="flex items-center gap-1 justify-start">
                    Owner
                    {sortField === "owner_full_name" && (
                      sortDirection === "asc"
                        ? <ArrowUp className="h-3 w-3" />
                        : <ArrowDown className="h-3 w-3" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium text-center"
                  onClick={() => handleSort("version")}
                >
                  <div className="flex items-center gap-1 justify-start">
                    Version
                    {sortField === "version" && (
                      sortDirection === "asc"
                        ? <ArrowUp className="h-3 w-3" />
                        : <ArrowDown className="h-3 w-3" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium text-center"
                  onClick={() => handleSort("shared_with")}
                >
                  <div className="flex items-center gap-1 justify-start">
                    Shared
                    {sortField === "shared_with" && (
                      sortDirection === "asc"
                        ? <ArrowUp className="h-3 w-3" />
                        : <ArrowDown className="h-3 w-3" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center gap-1 justify-start">
                    Status
                    {sortField === "status" && (
                      sortDirection === "asc"
                        ? <ArrowUp className="h-3 w-3" />
                        : <ArrowDown className="h-3 w-3" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium"
                  onClick={() => handleSort("updated_at")}
                >
                  <div className="flex items-center gap-1 justify-start">
                    Modified
                    {sortField === "updated_at" && (
                      sortDirection === "asc"
                        ? <ArrowUp className="h-3 w-3" />
                        : <ArrowDown className="h-3 w-3" />
                    )}
                  </div>
                </TableHead>
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
                          {doc.title}.{doc.type}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {doc.size}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground tracking-wide">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-foreground">
                        {formatOwnerName(doc.owner_full_name)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {doc.owner_email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-mono text-xs text-muted-foreground">
                      v{doc.version}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-mono text-xs text-muted-foreground">
                      {doc.shared_with}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(doc.status, false, true)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span
                        className="text-[10px] tracking-wide"
                        title={new Date(doc.updated_at).toLocaleString()}
                      >
                        {formatRelativeDate(doc.updated_at)}
                      </span>
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
                        <DropdownMenuItem className="text-xs tracking-wide font-mono">
                          <Eye className="mr-2 h-3.5 w-3.5" />
                          Сведения
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-xs tracking-wide font-mono"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDownloadDoc(doc)
                            setDownloadOpen(true)
                          }}
                        >
                          <Download className="mr-2 h-3.5 w-3.5" />
                          Скачать
                        </DropdownMenuItem>

                        {currentUser?.email === doc.owner_email && (
                          <>
                            <DropdownMenuItem
                              className="text-xs tracking-wide font-mono"
                              onClick={(e) => {
                                e.stopPropagation()
                                setShareDoc(doc)
                                setShareOpen(true)
                              }}
                            >
                              <Share2 className="mr-2 h-3.5 w-3.5" />
                              Поделиться
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem
                          className="text-xs tracking-wide font-mono"
                          onClick={async (e) => {
                            e.stopPropagation();
                            setSelectedDoc(doc);
                            setUploadVersionOpen(true);
                          }}
                        >
                          <Upload className="mr-2 h-3.5 w-3.5" />
                          Загрузить новую версию
                        </DropdownMenuItem>
                        {currentUser?.email === doc.owner_email && (
                          <>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem
                              className="text-xs text-destructive tracking-wide font-mono"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDocToDelete(doc);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Удалить
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>


        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="bg-card text-card-foreground border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                Delete Document
              </DialogTitle>
              <DialogDescription className="text-muted-foreground tracking-wide">
                Вы уверены, что хотите удалить документ{" "}
                <span className="font-mono font-semibold text-foreground">{docToDelete?.title}.{docToDelete?.type}</span>?
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-4">
              <div className="flex items-center gap-3">
                <Trash2 className="h-10 w-10 text-destructive/70" />
                <span className="text-xs text-muted-foreground tracking-wide font-mono">
                  После удаления документ будет полностью удалён из системы и восстановить его будет невозможно.
                </span>
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setDeleteDialogOpen(false)}
                className="text-muted-foreground hover:text-foreground hover:bg-secondary tracking-wide font-mono"
              >
                Отмена
              </Button>
              <Button
                onClick={handleDelete}
                className="bg-gradient-to-r from-rose-500 to-red-600 text-primary-foreground hover:opacity-90 border-0 tracking-wide font-mono"
              >
                Удалить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        {/* Share Document Dialog */}
        {shareDoc && (
          <ShareDocumentDialog
            open={shareOpen}
            onOpenChange={setShareOpen}
            documentTitle={shareDoc.title}
            documentId={shareDoc.id}
            documentType={shareDoc.type}
          />
        )}

        {/* Download Document Dialog */}
        {downloadDoc && (
          <DownloadDocumentDialog
            open={downloadOpen}
            onOpenChange={setDownloadOpen}
            documentTitle={downloadDoc.title}
            documentId={downloadDoc.id}
            documentType={downloadDoc.type}
          />
        )}


        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground tracking-wide">
            {"Показано "}
            <span className="font-mono text-foreground">{documents.length}</span>
            {" из "}
            <span className="font-mono text-foreground">{totalCount}</span>
            {" документов"}
          </span>
          <div className="flex items-center gap-1">
            {/* Prev */}
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            {Array.from({ length: totalPages }, (_, i) => {
              const pageNumber = i + 1
              const isActive = pageNumber === page

              return (
                <Button
                  key={pageNumber}
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(pageNumber)}
                  className={`h-7 min-w-7 text-xs ${isActive
                    ? "bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] text-primary-foreground border-0"
                    : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                >
                  {pageNumber}
                </Button>
              )
            })}

            {/* Next */}
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

      </div>
      <Dialog open={uploadVersionOpen} onOpenChange={setUploadVersionOpen}>
        <DialogContent className="bg-card text-card-foreground border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Upload New Version</DialogTitle>
            <DialogDescription>
              Загрузите новый файл для документа {selectedDoc?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <input
              type="file"
              ref={hiddenFileInput}
              onChange={handleFileSelectVersion}
              className="hidden"
            />
            <div
              onClick={() => hiddenFileInput.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileSelectVersion({ target: { files: [file] } } as any);
              }}
              className="flex h-28 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/30 transition-colors hover:border-[hsl(var(--gradient-from))]/50 hover:bg-secondary/50"
            >
              {uploadFileVersion ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-foreground">{uploadFileVersion.name}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadFileVersion(null);
                      if (hiddenFileInput.current) hiddenFileInput.current.value = "";
                    }}
                    className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground tracking-wide">
                    Перетащите файл или кликните, чтобы выбрать
                  </span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setUploadVersionOpen(false);
                setUploadFileVersion(null);
              }}
              className="text-muted-foreground hover:text-foreground hover:bg-secondary tracking-wide font-mono"
            >
              Отмена
            </Button>
            <Button
              onClick={handleUploadVersion}
              disabled={!uploadFileVersion || uploadLoadingVersion}
              className="bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] text-primary-foreground hover:opacity-90 border-0 tracking-wide font-mono"
            >
              {uploadLoadingVersion ? "Загрузка..." : "Загрузить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


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
                    <DialogTitle className="text-foreground text-sm">{selectedDoc.title}.{selectedDoc.type}</DialogTitle>
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
                  <span className="text-foreground font-medium tracking-wide">
                    <div className="text-right">
                      <div className="text-foreground font-medium text-xs">
                        {formatOwnerName(selectedDoc.owner_full_name)}
                      </div>
                      <div className="text-muted-foreground text-[10px]">
                        {selectedDoc.owner_email}
                      </div>
                    </div>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Status</span>

                  {currentUser?.email === selectedDoc?.owner_email ? (
                    <div className="flex gap-2">
                      {(["active", "archived", "draft"] as Document["status"][]).map((s) => {
                        const isSelected = selectedDoc.status === s
                        return (
                          <div
                            key={s}
                            className="cursor-pointer"
                            onClick={() => handleStatusChange(s)}
                          >
                            {getStatusBadge(s, isSelected)}
                          </div>
                        )
                      })}

                    </div>
                  ) : (
                    <div>{getStatusBadge(selectedDoc.status)}</div>
                  )}
                </div>


                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Shared With</span>
                  <span className="text-foreground font-mono">{selectedDoc.shared_with} users</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Created At</span>
                  <span className="text-foreground tracking-wide font-mono">
                    {new Date(selectedDoc.created_at).toLocaleString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Last Modified</span>
                  <span className="text-foreground tracking-wide font-mono">
                    {new Date(selectedDoc.updated_at).toLocaleString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
                <Separator className="bg-border/50" />
                <div className="flex flex-col gap-1 min-h-[2rem]">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Description</span>

                    {currentUser?.email === selectedDoc?.owner_email &&
                      editingDocId !== selectedDoc?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={() => setEditingDocId(selectedDoc.id)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                  </div>

                  {editingDocId === selectedDoc?.id ? (
                    <div className="flex gap-2 items-center">
                      <Textarea
                        value={descriptionEdit}
                        ref={textareaRef}
                        onChange={(e) => setDescriptionEdit(e.target.value)}
                        className="text-xs bg-secondary/50 border-border text-foreground font-mono resize-none overflow-hidden min-h-[24px] leading-snug"
                      />

                      <Button
                        size="sm"
                        onClick={async () => {
                          if (!selectedDoc) return
                          try {
                            await updateDocument(selectedDoc.id, {
                              description: descriptionEdit,
                            })

                            setDocuments((docs) =>
                              docs.map((doc) =>
                                doc.id === selectedDoc.id
                                  ? { ...doc, description: descriptionEdit }
                                  : doc
                              )
                            )

                            setSelectedDoc((doc) =>
                              doc ? { ...doc, description: descriptionEdit } : null
                            )

                            setEditingDocId(null)
                          } catch (error) {
                            console.error("Failed to update description", error)
                          }
                        }}
                        className="h-8 bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] text-primary-foreground text-xs border-0 hover:opacity-90"
                      >
                        Сохранить
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (selectedDoc) {
                            setDescriptionEdit(selectedDoc.description || "")
                          }
                          setEditingDocId(null)
                        }}
                        className="h-8 text-xs"
                      >
                        Отмена
                      </Button>
                    </div>
                  ) : (
                    <p className="text-foreground text-xs whitespace-pre-wrap">
                      {selectedDoc?.description || "Описание отсутствует"}
                    </p>
                  )}
                </div>


                <Separator className="bg-border/50" />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Version History</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[12px] tracking-wide font-mono bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center gap-1"
                      onClick={() => setUploadVersionOpen(true)}
                    >
                      <Upload className="h-3 w-3" />
                      Загрузить версию
                    </Button>
                  </div>

                  <div className="mt-2 flex flex-col gap-1.5">
                    {Array.from({ length: Math.min(selectedDoc.version, 3) }, (_, i) => (
                      <div key={i} className="flex items-center justify-between rounded-md bg-secondary/30 px-3 py-2 text-xs">
                        <span className="font-mono text-foreground">v{selectedDoc.version - i}</span>
                        <span className="text-muted-foreground tracking-wide font-mono">
                          {i === 0
                            ? "Текущая"
                            : `${i * 3} ${getDaysWord(i * 3)} назад`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter className="flex gap-2">
                {currentUser?.email === selectedDoc?.owner_email && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary text-xs tracking-wide font-mono"
                    onClick={() => {
                      setDetailOpen(false)
                      setShareDoc(selectedDoc)
                      setShareOpen(true)
                    }}
                  >
                    <Share2 className="h-3 w-3" />
                    Поделиться
                  </Button>
                )}
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] text-primary-foreground hover:opacity-90 border-0 text-xs tracking-wide font-mono"
                  onClick={() => {
                    setDetailOpen(false)
                    setDownloadDoc(selectedDoc)
                    setDownloadOpen(true)
                  }}
                >
                  <Download className="h-3 w-3" />
                  Скачать
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
