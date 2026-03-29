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
  FileKey,
  KeyRound,
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
import { updateDocument, createDocument, getDocument, uploadDocumentVersion, deleteDocument, approveDocumentVersion, setCurrentVersion, getDocumentVersions, getMyEncryptedDEK } from "@/lib/api/documents"
import { decryptDEK, importPrivateKey, importPublicKey, encryptDEKForUser, arrayBufferToBase64 } from "@/lib/crypto/keys";

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
  my_role: "owner" | "editor" | "viewer" | null
}

interface DocumentVersion {
  id: number
  version_number: number
  status: "approved" | "pending"
  uploaded_at: string
}

type DownloadDocument = Document & {
  versionId?: number
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

function getVersionStatusBadge(status: string) {
  const base =
    "text-[10px] font-mono rounded-xl tracking-wide inline-flex items-center gap-1 px-2 py-0.5"

  switch (status) {
    case "approved":
      return (
        <Badge
          variant="outline"
          className={`${base} bg-emerald-500/15 text-emerald-400 border-emerald-500/30`}
        >
          ✔ Одобрено
        </Badge>
      )
    case "pending":
      return (
        <Badge
          variant="outline"
          className={`${base} bg-amber-500/15 text-amber-400 border-amber-500/30`}
        >
          ⏳ В ожидании
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
  const [pageSize, setPageSize] = useState(10)
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
  const [downloadDoc, setDownloadDoc] = useState<DownloadDocument | null>(null)
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [privateKeyFile, setPrivateKeyFile] = useState<File | null>(null)
  const [titleEdit, setTitleEdit] = useState("");
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null)
  const [editingDescriptionId, setEditingDescriptionId] = useState<string | null>(null)


  const hiddenFileInput = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      setTitleEdit(selectedDoc.title || "");
    }
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

      const dek = window.crypto.getRandomValues(new Uint8Array(32))
      const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        dek,
        "AES-GCM",
        false,
        ["encrypt"]
      )

      const iv = window.crypto.getRandomValues(new Uint8Array(12))
      const fileBuffer = await uploadFile.arrayBuffer()

      const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        fileBuffer
      )

      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength)
      combined.set(iv, 0)
      combined.set(new Uint8Array(encryptedBuffer), iv.length)

      const publicPem = currentUser.public_key
      const publicKey = await importPublicKey(publicPem)

      const encryptedDek = await encryptDEKForUser(dek, publicKey)

      const formData = new FormData()
      formData.append("file", new Blob([combined]), uploadFile.name)
      formData.append("title", uploadTitle)
      formData.append("description", uploadDescription)
      formData.append("type", uploadType)
      formData.append("encrypted_dek", arrayBufferToBase64(encryptedDek.buffer))

      await createDocument(formData)

      setUploadOpen(false)
      resetUploadForm()

      await fetchDocuments()

    } catch (error) {
      console.error("Upload error", error)
    } finally {
      setUploadLoading(false)
    }
  }

  const processSelectedFile = (file: File) => {
    setUploadFile(file)

    const extension = file.name.split(".").pop()?.toLowerCase() || ""
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "")

    setUploadType(extension)

    if (!uploadTitle) {
      setUploadTitle(fileNameWithoutExt)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    processSelectedFile(file)
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
        const res = await searchUsers(userSearch);
        setUserResults(res.data);
      } catch (error) {
        console.error("User search error", error);
      } finally {
        setUserSearchLoading(false);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [userSearch]);

  useEffect(() => {
    if (!selectedDoc) return

    const documentId = selectedDoc.id;

    async function fetchVersions() {
      try {
        const res = await getDocumentVersions(documentId)
        setVersions(res.data)
      } catch (error) {
        console.error("Failed to fetch versions", error)
      }
    }

    fetchVersions()
  }, [selectedDoc])


  const handleApproveVersion = async (versionId: number) => {
    if (!selectedDoc) return

    try {
      await approveDocumentVersion(selectedDoc.id, versionId)

      const res = await getDocumentVersions(selectedDoc.id)

      const updatedVersions = res.data.map((v: DocumentVersion) => {
        if (v.id === versionId) return { ...v, status: "approved" };
        return v;
      });

      setVersions(updatedVersions)

      const updatedDoc = await getDocument(selectedDoc.id);
      setSelectedDoc(updatedDoc.data);


      setDocuments((docs) =>
        docs.map((d) => (d.id === updatedDoc.data.id ? updatedDoc.data : d))
      );

    } catch (error) {
      console.error("Failed to approve version", error)
    }
  }

  const handleSetCurrentVersion = async (versionId: number) => {
    if (!selectedDoc) return;

    try {
      await setCurrentVersion(selectedDoc.id, versionId);

      const versionsRes = await getDocumentVersions(selectedDoc.id);

      const updatedVersions = versionsRes.data.map((v: DocumentVersion) => ({
        ...v,
        isCurrent: v.id === versionId,
      }));

      setVersions(updatedVersions);

      const updatedDoc = await getDocument(selectedDoc.id);
      setSelectedDoc(updatedDoc.data);

      setDocuments((docs) =>
        docs.map((d) => (d.id === updatedDoc.data.id ? updatedDoc.data : d))
      );
    } catch (error) {
      console.error("Failed to set current version", error);
    }
  };

  const getVersionLabel = (v: DocumentVersion, isCurrent: boolean) => {
    if (isCurrent) return "текущая";

    const date = new Date(v.uploaded_at);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "сегодня";
    if (diffDays < 7) return `${diffDays} ${getDaysWord(diffDays)} назад`;

    return date.toLocaleDateString("ru-RU");
  };

  const handleEncryptAndUploadVersion = async () => {
    if (!uploadFileVersion || !privateKeyFile || !selectedDoc) return;

    setUploadLoadingVersion(true);

    try {
      const pem = await privateKeyFile.text();
      const privateKey = await importPrivateKey(pem);

      const { data: dekResponse } = await getMyEncryptedDEK(selectedDoc.id);
      const encryptedDek = Uint8Array.from(atob(dekResponse.encrypted_dek), c => c.charCodeAt(0));
      const dekBytes = await decryptDEK(encryptedDek, privateKey);

      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        new Uint8Array(dekBytes),
        "AES-GCM",
        false,
        ["encrypt"]
      );

      const fileBuffer = await uploadFileVersion.arrayBuffer();
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        fileBuffer
      );

      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);

      const formData = new FormData();
      formData.append("file", new Blob([combined]), uploadFileVersion.name);

      await uploadDocumentVersion(selectedDoc.id, formData);

      setUploadVersionOpen(false);
      setUploadFileVersion(null);
      setPrivateKeyFile(null);

      const versionsRes = await getDocumentVersions(selectedDoc.id);
      setVersions(versionsRes.data);

      const updatedDocRes = await getDocument(selectedDoc.id);
      setSelectedDoc(updatedDocRes.data);

      setDocuments((docs) =>
        docs.map((d) => (d.id === updatedDocRes.data.id ? updatedDocRes.data : d))
      );

      await fetchDocuments();
    } catch (err) {
      console.error(err);
      alert("Не удалось зашифровать и загрузить файл");
    } finally {
      setUploadLoadingVersion(false);
    }
  };

  function canDownload(doc: Document) {
    if (doc.status === "draft") {
      return doc.my_role === "owner"
    }

    return doc.status === "active" || doc.status === "archived"
  }

  function canUpload(doc: Document) {
    if (doc.status === "archived") return false

    if (doc.status === "draft") {
      return doc.my_role === "owner"
    }

    if (doc.status === "active") {
      return doc.my_role === "owner" || doc.my_role === "editor"
    }

    return false
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
                      onClick={() => {
                        if (!uploadFile) hiddenFileInput.current?.click()
                      }}
                      onDragOver={(e) => {
                        if (!uploadFile) e.preventDefault()
                      }}
                      onDrop={(e) => {
                        if (!uploadFile) {
                          e.preventDefault()
                          const file = e.dataTransfer.files?.[0]
                          if (file) processSelectedFile(file)
                        }
                      }}
                      className={`flex ${uploadFile ? "w-full" : "h-28 cursor-pointer items-center justify-center border-2 border-dashed border-border bg-secondary/30 hover:border-[hsl(var(--gradient-from))]/50 hover:bg-secondary/50"} rounded-lg transition-colors`}                    >

                      {uploadFile ? (
                        <div className="flex w-full items-center gap-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3.5 py-3">

                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-500/15">
                            <FileText className="h-4 w-4 text-emerald-400" />
                          </div>

                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-[12px] font-medium text-emerald-400 truncate">
                              {uploadFile.name}
                            </span>
                            <span className="text-[10px] text-emerald-400/50 font-mono">
                              {(uploadFile.size / 1024).toFixed(1)} KB
                            </span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setUploadFile(null)
                              setUploadType("")
                              if (hiddenFileInput.current) hiddenFileInput.current.value = ""
                            }}
                            className="p-1 rounded-md hover:bg-secondary/50 transition-colors"
                          >
                            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </button>

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
                  {/* <div className="flex flex-col gap-2">
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
                  </div> */}
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
                        {canDownload(doc) && (
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
                        )}

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
                        {canUpload(doc) && (
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
                        )}
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
            versionId={downloadDoc.versionId}
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
              // onClick={() => setPage((p) => p - 1)}
              onClick={() => page > 1 && setPage(page - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            {getPaginationPages(page, totalPages).map((p, idx) =>
              p === "..." ? (
                <span key={idx} className="px-2 py-1 text-muted-foreground">…</span>
              ) : (
                <Button
                  key={idx}
                  size="sm"
                  variant={p === page ? "default" : "outline"}
                  onClick={() => setPage(p as number)}
                  className={`h-7 min-w-7 text-xs ${p === page
                    ? "bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] text-primary-foreground border-0"
                    : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                >
                  {p}
                </Button>
              )
            )}

            {/* Next */}
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
              disabled={page === totalPages}
              // onClick={() => setPage((p) => p + 1)}
              onClick={() => page < totalPages && setPage(page + 1)}
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

          <div className="flex flex-col gap-2 py-2">
            <input
              type="file"
              ref={hiddenFileInput}
              onChange={handleFileSelectVersion}
              className="hidden"
            />
            <div
              onClick={() => {
                if (!uploadFileVersion) hiddenFileInput.current?.click()
              }}
              onDragOver={(e) => {
                if (!uploadFileVersion) e.preventDefault()
              }}
              onDrop={(e) => {
                if (!uploadFileVersion) {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileSelectVersion({ target: { files: [file] } } as any);
                }
              }}
              className={`flex ${uploadFileVersion ? "w-full" : "h-28 cursor-pointer items-center justify-center border-2 border-dashed border-border bg-secondary/30 transition-colors hover:border-[hsl(var(--gradient-from))]/50 hover:bg-secondary/50"} rounded-lg transition-colors`}
            >
              {uploadFileVersion ? (
                <div className="flex w-full items-center gap-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3.5 py-3">

                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-500/15">
                    <FileText className="h-4 w-4 text-emerald-400" />
                  </div>

                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[12px] font-medium text-emerald-400 truncate">
                      {uploadFileVersion.name}
                    </span>
                    {/* <span className="text-[10px] text-emerald-400/50 font-mono">
                    {(uploadFileVersion.size / 1024).toFixed(1)} KB
                  </span> */}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setUploadFileVersion(null)
                      setUploadType("")
                      if (hiddenFileInput.current) hiddenFileInput.current.value = ""
                    }}
                    className="p-1 rounded-md hover:bg-secondary/50 transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>

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

          <div>
            {!privateKeyFile ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) setPrivateKeyFile(file);
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pem,.key,.p8,.der"
                  onChange={(e) => setPrivateKeyFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="private-key-input-version"
                />
                <label
                  htmlFor="private-key-input-version"
                  className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-border/60 bg-card/50 px-3 py-3 transition-all duration-200 hover:border-violet-500/30 hover:bg-secondary/30 group"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/60 border border-border/50 group-hover:border-violet-500/20 transition-colors">
                    <KeyRound className="h-4 w-4 text-muted-foreground group-hover:text-violet-400 transition-colors" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-medium tracking-wide text-muted-foreground group-hover:text-foreground transition-colors">
                      Прикрепить приватный ключ
                    </span>
                    <span className="text-[11px] text-muted-foreground/60">
                      .pem
                    </span>
                  </div>
                  <Upload className="ml-auto h-4 w-4 text-muted-foreground/40 group-hover:text-violet-400/60 transition-colors" />
                </label>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-500/15">
                  <FileKey className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[12px] font-medium text-emerald-400 truncate">
                    {privateKeyFile.name}
                  </span>
                  <span className="text-[10px] text-emerald-400/50 font-mono">
                    {(privateKeyFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <button
                  onClick={() => {
                    setPrivateKeyFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ""
                  }}
                  className="p-1 rounded-md hover:bg-secondary/50 transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            )}
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
              onClick={handleEncryptAndUploadVersion}
              disabled={!uploadFileVersion || !privateKeyFile || uploadLoadingVersion}
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
                    <span className="sr-only">
                      <DialogTitle>{selectedDoc.title}</DialogTitle>
                    </span>
                    {/* <DialogTitle className="text-foreground text-sm">{selectedDoc.title}.{selectedDoc.type}</DialogTitle> */}
                    <div className="flex items-center gap-2">
                      {editingTitleId === selectedDoc.id ? (
                        <>
                          <Textarea
                            value={titleEdit}
                            onChange={(e) => setTitleEdit(e.target.value)}
                            className="text-xs bg-secondary/50 border-border text-foreground font-mono overflow-hidden h-9 min-h-[8px]"
                          />
                          <Button
                            size="sm"
                            onClick={async () => {
                              if (!selectedDoc) return
                              try {
                                await updateDocument(selectedDoc.id, { title: titleEdit })
                                setDocuments(docs =>
                                  docs.map(doc =>
                                    doc.id === selectedDoc.id ? { ...doc, title: titleEdit } : doc
                                  )
                                )
                                setSelectedDoc(doc => doc ? { ...doc, title: titleEdit } : null)
                                setEditingTitleId(null)
                              } catch (err) {
                                console.error("Failed to update title", err)
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
                              if (selectedDoc) setTitleEdit(selectedDoc.title || "")
                              setEditingTitleId(null)
                            }}
                            className="h-8 text-xs"
                          >
                            Отмена
                          </Button>
                        </>
                      ) : (
                        <>
                          <DialogTitle className="text-foreground text-sm">{selectedDoc.title}.{selectedDoc.type}</DialogTitle>
                          {currentUser?.email === selectedDoc?.owner_email && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              onClick={() => setEditingTitleId(selectedDoc.id)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                    <div className="mt-1">
                      <DialogDescription className="text-muted-foreground text-xs">
                        {selectedDoc.size} - Version {selectedDoc.version}
                      </DialogDescription>
                    </div>
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
                          onClick={() => setEditingDescriptionId(selectedDoc.id)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                  </div>

                  {editingDescriptionId === selectedDoc?.id ? (
                    <div className="flex gap-2 items-center">
                      <Textarea
                        value={descriptionEdit}
                        ref={textareaRef}
                        onChange={(e) => setDescriptionEdit(e.target.value)}
                        className="text-xs bg-secondary/50 border-border text-foreground font-mono overflow-hidden h-9 min-h-[8px]"
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

                            setEditingDescriptionId(null)
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
                          setEditingDescriptionId(null)
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
                    {selectedDoc?.my_role !== "viewer" && canUpload(selectedDoc) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[12px] tracking-wide font-mono bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center gap-1"
                        onClick={() => setUploadVersionOpen(true)}
                      >
                        <Upload className="h-3 w-3" />
                        Загрузить версию
                      </Button>
                    )}
                  </div>

                  <div className="mt-2 flex flex-col gap-1.5">
                    {(() => {
                      return versions.map((v) => {
                        const isCurrent = v.version_number === selectedDoc.version;
                        const isSingleCurrent = versions.length === 1 && isCurrent;

                        return (
                          <div
                            key={v.id}
                            className="flex items-center justify-between rounded-md bg-secondary/30 px-3 py-2 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-foreground">v{v.version_number}</span>
                              <span className="text-muted-foreground tracking-wide font-mono px-1">
                                {getVersionLabel(v, isCurrent)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 justify-end w-[8rem]">
                              {currentUser?.email === selectedDoc?.owner_email ? (
                                <>
                                  {isSingleCurrent ? (
                                    <div className="ml-auto">{getVersionStatusBadge(v.status)}</div>
                                  ) : (
                                    <>
                                      {getVersionStatusBadge(v.status)}
                                      {!isCurrent && (
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <button className="text-muted-foreground hover:text-foreground">
                                              <MoreHorizontal className="h-4 w-4" />
                                            </button>
                                          </DropdownMenuTrigger>

                                          <DropdownMenuContent align="end">
                                            {v.status === "pending" && (
                                              <DropdownMenuItem
                                                className="text-xs tracking-wide font-mono"
                                                onClick={() => handleApproveVersion(v.id)}
                                              >
                                                Одобрить
                                              </DropdownMenuItem>
                                            )}

                                            {v.status === "approved" && (
                                              <DropdownMenuItem
                                                className="text-xs tracking-wide font-mono"
                                                onClick={() => handleSetCurrentVersion(v.id)}
                                              >
                                                Сделать текущей
                                              </DropdownMenuItem>
                                            )}

                                            <DropdownMenuItem
                                              className="text-xs tracking-wide font-mono"
                                              onClick={() => {
                                                setDetailOpen(false)
                                                setDownloadDoc({ ...selectedDoc, versionId: v.id })
                                                setDownloadOpen(true)
                                              }}
                                            >
                                              Скачать
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      )}
                                    </>
                                  )}
                                </>
                              ) : (
                                <div className="ml-auto">{getVersionStatusBadge(v.status)}</div>
                              )}
                            </div>
                          </div>
                        )
                      })
                    })()}
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
                {canDownload(selectedDoc) && (
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
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
