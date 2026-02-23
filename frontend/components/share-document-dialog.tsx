"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import {
    Search,
    X,
    Shield,
    Eye,
    Pencil,
    Clock,
    UserPlus,
    Users,
    CalendarDays,
    MessageSquare,
    Check,
    Share2,
    Trash2,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { searchUsers } from "@/lib/api/auth"
import { shareDocument, getDocumentAccess, updateDocumentAccess, revokeDocumentAccess } from "@/lib/api/documents"

interface User {
    id: string
    name: string
    email: string
    department: string
    avatarInitials: string
    color: string
}

interface AccessEntry {
    user: User
    role: "viewer" | "editor"
    grantedAt: string
    expiresAt?: string
}

interface ShareDocumentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    documentTitle: string
    documentId: string
    documentType: string
}

const AVATAR_COLORS = [
    "from-violet-600 to-indigo-500",
    "from-cyan-500 to-teal-500",
    "from-rose-500 to-pink-500",
    "from-amber-500 to-orange-500",
    "from-emerald-500 to-green-500",
    "from-sky-500 to-blue-500",
]

export function ShareDocumentDialog({
    open,
    onOpenChange,
    documentTitle,
    documentId,
    documentType,
}: ShareDocumentDialogProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedUsers, setSelectedUsers] = useState<User[]>([])
    const [role, setRole] = useState<"viewer" | "editor">("viewer")
    const [duration, setDuration] = useState<string>("unlimited")
    const [comment, setComment] = useState("")
    const [currentAccess, setCurrentAccess] = useState<AccessEntry[]>([])
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [grantSuccess, setGrantSuccess] = useState(false)
    const [allUsers, setAllUsers] = useState<User[]>([])
    const [loadingAccess, setLoadingAccess] = useState(false)
    const [editingUserId, setEditingUserId] = useState<string | null>(null)
    const [editRole, setEditRole] = useState<"viewer" | "editor">("viewer")
    const [editDuration, setEditDuration] = useState<string>("unlimited")
    const [editComment, setEditComment] = useState("")
    const [revokeUser, setRevokeUser] = useState<AccessEntry | null>(null)
    const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)

    const dropdownRef = useRef<HTMLDivElement | null>(null)

    const currentAccessUserIds = currentAccess.map((a) => a.user.id)
    const selectedUserIds = selectedUsers.map((u) => u.id)

    const filteredUsers = useMemo(() => {
        const query = searchQuery.toLowerCase().trim()
        return allUsers.filter((user) => {
            if (currentAccessUserIds.includes(user.id)) return false
            if (selectedUserIds.includes(user.id)) return false
            if (!query) return true
            return (
                user.name.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query)
            )
        })
    }, [searchQuery, allUsers, currentAccessUserIds, selectedUserIds])

    const handleSelectUser = (user: User) => {
        setSelectedUsers((prev) => [...prev, user])
        setSearchQuery("")
        setDropdownOpen(false)
    }

    const handleRemoveSelected = (userId: string) => {
        setSelectedUsers((prev) => prev.filter((u) => u.id !== userId))
    }

    const handleRevokeAccess = async () => {
        if (!revokeUser) return

        try {
            await revokeDocumentAccess(documentId, revokeUser.user.id)
            await loadAccess()
            setRevokeDialogOpen(false)
            setRevokeUser(null)
        } catch (err) {
            console.error("Failed to revoke access", err)
        }
    }

    const handleGrantAccess = async () => {
        if (selectedUsers.length === 0) return

        try {
            await Promise.all(
                selectedUsers.map((user) => {
                    const data: {
                        user_id: string
                        role: "viewer" | "editor"
                        comment?: string
                        days?: number
                    } = {
                        user_id: user.id,
                        role,
                    }
                    if (comment.trim()) data.comment = comment.trim()
                    if (duration !== "unlimited") data.days = parseInt(duration)
                    return shareDocument(documentId, data)
                })
            )

            await loadAccess()

            setSelectedUsers([])
            setComment("")
            setRole("viewer")
            setDuration("unlimited")
            setGrantSuccess(true)
            setTimeout(() => setGrantSuccess(false), 2000)
        } catch (err) {
            console.error("Failed to grant access", err)
        }
    }

    const handleClose = (val: boolean) => {
        if (!val) {
            setSearchQuery("")
            setSelectedUsers([])
            setComment("")
            setRole("viewer")
            setDuration("unlimited")
            setDropdownOpen(false)
            setGrantSuccess(false)

            setEditingUserId(null)
            setEditRole("viewer")
            setEditDuration("unlimited")
            setEditComment("")
        }
        onOpenChange(val)
    }


    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setDropdownOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])


    useEffect(() => {
        if (!searchQuery.trim()) {
            setAllUsers([])
            return
        }

        const timeout = setTimeout(() => {
            searchUsers(searchQuery)
                .then(res => {
                    const users: User[] = res.data.map((u: any, idx: number) => ({
                        id: u.id,
                        name: u.full_name || u.name,
                        email: u.email,
                        avatarInitials: u.full_name
                            ? u.full_name.split(" ").map((s: string) => s[0]).join("").slice(0, 2).toUpperCase()
                            : "NA",
                        color: AVATAR_COLORS[idx % AVATAR_COLORS.length],
                    }))
                    setAllUsers(users)
                })
                .catch(() => setAllUsers([]))
        }, 300)

        return () => clearTimeout(timeout)
    }, [searchQuery])


    const loadAccess = async () => {
        setLoadingAccess(true)
        try {
            const res = await getDocumentAccess(documentId)

            const data: AccessEntry[] = res.data.map((item: any, idx: number) => {
                const grantedDate = new Date(item.granted_at)
                const expiresDate = item.expires_at ? new Date(item.expires_at) : null

                return {
                    user: {
                        id: item.user_id,
                        name: item.full_name,
                        email: item.email,
                        avatarInitials: item.full_name
                            .split(" ")
                            .map((s: string) => s[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase(),
                        color: AVATAR_COLORS[idx % AVATAR_COLORS.length],
                    },
                    role: item.role,
                    grantedAt: grantedDate.toLocaleDateString("ru-RU"),
                    expiresAt: expiresDate
                        ? expiresDate.toLocaleDateString("ru-RU")
                        : undefined,
                }
            })

            setCurrentAccess(data)
        } catch {
            setCurrentAccess([])
        } finally {
            setLoadingAccess(false)
        }
    }

    useEffect(() => {
        if (open) {
            loadAccess()
        }
    }, [open, documentId])

    const handleSaveEdit = async () => {
        if (!editingUserId) return

        try {
            const data: {
                role?: "viewer" | "editor"
                comment?: string
                days?: number
            } = {
                role: editRole,
            }

            if (editComment.trim()) {
                data.comment = editComment.trim()
            }

            if (editDuration !== "unlimited") {
                data.days = parseInt(editDuration)
            } else {
                data.days = 0
            }

            await updateDocumentAccess(documentId, editingUserId, data)

            await loadAccess()

            setEditingUserId(null)
        } catch (err) {
            console.error("Failed to update access", err)
        }
    }


    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="bg-card text-card-foreground border-border max-w-2xl p-0 gap-0 overflow-hidden max-h-[90vh]">
                {/* Header with gradient accent */}
                <div className="relative px-6 pt-6 pb-4">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--gradient-from))]/50 to-transparent" />
                    <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[hsl(var(--gradient-from))]/5 to-transparent pointer-events-none" />
                    <DialogHeader className="relative">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--gradient-from))]/20 to-[hsl(var(--gradient-to))]/20 border border-[hsl(var(--gradient-from))]/20">
                                <Share2 className="h-5 w-5 text-[hsl(var(--gradient-from))]" />
                            </div>
                            <div>
                                <DialogTitle className="text-foreground text-lg font-semibold">
                                    Share Access
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground text-xs mt-0.5 max-w-[380px] truncate">
                                    {documentTitle}.{documentType}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <ScrollArea className="max-h-[calc(90vh-100px)]">
                    <div className="px-6 pb-6 flex flex-col gap-5">
                        {/* Grant access section */}
                        <div className="rounded-xl border border-border/50 bg-secondary/20 p-4 flex flex-col gap-4">
                            <div className="flex items-center gap-2">
                                <UserPlus className="h-4 w-4 text-[hsl(var(--gradient-from))]" />
                                <span className="text-sm tracking-wide font-mono text-foreground">Предоставить новый доступ</span>
                            </div>

                            {/* User search and selection */}
                            <div className="flex flex-col gap-2">
                                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">
                                    Users
                                </Label>

                                {/* Selected users chips */}
                                {selectedUsers.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedUsers.map((user) => (
                                            <div
                                                key={user.id}
                                                className="group/chip flex items-center gap-1.5 rounded-lg bg-[hsl(var(--gradient-from))]/10 border border-[hsl(var(--gradient-from))]/20 px-2 py-1 transition-colors hover:bg-[hsl(var(--gradient-from))]/15"
                                            >
                                                <Avatar className="h-5 w-5">
                                                    <AvatarFallback className={`bg-gradient-to-br ${user.color} text-[7px] font-bold text-white`}>
                                                        {user.avatarInitials}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-[12px] font-medium text-foreground max-w-[120px] truncate">
                                                    {user.name.split(" ").slice(0, 2).join(" ")}
                                                </span>
                                                <button
                                                    onClick={() => handleRemoveSelected(user.id)}
                                                    className="ml-0.5 rounded-sm p-0.5 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                                                >
                                                    <X className="h-2.5 w-2.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Search input with dropdown */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                    <div className="relative" ref={dropdownRef}>
                                        <Input
                                            placeholder="Поиск по имени или email..."
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value)
                                                setDropdownOpen(e.target.value.trim() !== "")
                                            }}
                                            className="h-9 pl-9 bg-card/80 border-border text-foreground placeholder:text-muted-foreground text-xs tracking-wide"
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() => {
                                                    setSearchQuery("")
                                                    setDropdownOpen(false)
                                                }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                            >
                                                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                            </button>
                                        )}

                                        {/* Dropdown user list */}
                                        {dropdownOpen && filteredUsers.length > 0 && (
                                            <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-xl border border-border bg-popover shadow-xl shadow-black/30 overflow-hidden">
                                                <div className="max-h-[180px] overflow-y-auto">
                                                    <div className="p-1">
                                                        {filteredUsers.map((user) => (
                                                            <button
                                                                key={user.id}
                                                                onClick={() => handleSelectUser(user)}
                                                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-secondary/50 group/item"
                                                            >
                                                                <Avatar className="h-8 w-8 shrink-0">
                                                                    <AvatarFallback className={`bg-gradient-to-br ${user.color} text-[10px] font-bold text-white`}>
                                                                        {user.avatarInitials}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex flex-col min-w-0 flex-1">
                                                                    <span className="text-xs font-medium text-foreground truncate">
                                                                        {user.name}
                                                                    </span>
                                                                    <span className="text-[12px] text-muted-foreground truncate">
                                                                        {user.email}
                                                                    </span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {dropdownOpen && searchQuery && filteredUsers.length === 0 && (
                                            <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-xl border border-border bg-popover shadow-xl shadow-black/30 p-4">
                                                <div className="flex flex-col items-center gap-1 text-center">
                                                    <Users className="h-5 w-5 text-muted-foreground/40" />
                                                    <span className="text-xs text-muted-foreground tracking-wide font-mono">Пользователи не найдены</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Role and Duration row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-2">
                                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">
                                        Role
                                    </Label>
                                    <Select value={role} onValueChange={(v) => setRole(v as "viewer" | "editor")}>
                                        <SelectTrigger className="h-9 bg-card/80 border-border text-foreground text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover text-popover-foreground border-border">
                                            <SelectItem value="viewer" className="text-xs">
                                                <div className="flex items-center gap-3 tracking-wide">
                                                    <Eye className="h-4 w-4 text-sky-400" />
                                                    <span>Только просмотр</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="editor" className="text-xs">
                                                <div className="flex items-center gap-3 tracking-wide">
                                                    <Pencil className="h-4 w-4 text-emerald-400" />
                                                    <span>Редактирование</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">
                                        Duration
                                    </Label>
                                    <Select value={duration} onValueChange={setDuration}>
                                        <SelectTrigger className="h-9 bg-card/80 border-border text-foreground text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover text-popover-foreground border-border">
                                            <SelectItem value="unlimited" className="text-xs">
                                                <div className="flex items-center gap-3 tracking-wide">
                                                    <Shield className="h-4 w-4 text-violet-400" />
                                                    <span>Без ограничения</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="1" className="text-xs">
                                                <div className="flex items-center gap-3 tracking-wide">
                                                    <CalendarDays className="h-4 w-4 text-amber-400" />
                                                    <span>1 день</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="7" className="text-xs">
                                                <div className="flex items-center gap-3 tracking-wide">
                                                    <CalendarDays className="h-4 w-4 text-amber-400" />
                                                    <span>7 дней</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="30" className="text-xs">
                                                <div className="flex items-center gap-3 tracking-wide">
                                                    <CalendarDays className="h-4 w-4 text-amber-400" />
                                                    <span>30 дней</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="90" className="text-xs">
                                                <div className="flex items-center gap-3 tracking-wide">
                                                    <CalendarDays className="h-4 w-4 text-amber-400" />
                                                    <span>90 дней</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="180" className="text-xs">
                                                <div className="flex items-center gap-3 tracking-wide">
                                                    <CalendarDays className="h-4 w-4 text-amber-400" />
                                                    <span>180 дней</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="365" className="text-xs">
                                                <div className="flex items-center gap-3 tracking-wide">
                                                    <CalendarDays className="h-4 w-4 text-amber-400" />
                                                    <span>1 год</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Comment */}
                            <div className="flex flex-col gap-2">
                                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium flex items-center gap-1.5">
                                    <MessageSquare className="h-3 w-3" />
                                    Comment
                                </Label>
                                <Textarea
                                    placeholder="Добавьте комментарий к выдаче доступа..."
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="min-h-[64px] bg-card/80 border-border text-foreground placeholder:text-muted-foreground text-xs resize-none tracking-wide px-3 py-2"
                                    rows={2}
                                />
                            </div>

                            {/* Grant button */}
                            <Button
                                onClick={handleGrantAccess}
                                disabled={selectedUsers.length === 0}
                                className={`w-full h-9 text-xs font-semibold transition-all duration-300 ${grantSuccess
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                                    : "bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] text-primary-foreground hover:opacity-90 border-0"
                                    }`}
                            >
                                {grantSuccess ? (
                                    <span className="flex items-center gap-2 tracking-wide">
                                        <Check className="h-3.5 w-3.5" />
                                        Доступ выдан
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2 tracking-wide">
                                        <UserPlus className="h-3.5 w-3.5" />
                                        Предоставить доступ
                                        {selectedUsers.length > 0 && (
                                            <Badge variant="outline" className="ml-1 h-4 px-1.5 text-[10px] bg-white/10 border-white/20 text-primary-foreground">
                                                {selectedUsers.length}
                                            </Badge>
                                        )}
                                    </span>
                                )}
                            </Button>
                        </div>

                        <Separator className="bg-border/50" />

                        {/* Current access section */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-[hsl(var(--gradient-to))]" />
                                    <span className="text-sm text-foreground tracking-wide">Текущий доступ</span>
                                </div>
                                <Badge variant="outline" className="text-xs font-mono bg-secondary/50 text-muted-foreground border-border">
                                    {currentAccess.length} {currentAccess.length === 1 ? "user" : "users"}
                                </Badge>
                            </div>

                            {loadingAccess ? (
                                <div className="flex flex-col items-center gap-2 py-6 rounded-xl border border-dashed border-border/50 bg-secondary/10">
                                    <span className="text-xs text-muted-foreground font-mono tracking-wide">Загрузка доступа...</span>
                                </div>
                            ) : currentAccess.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 py-6 rounded-xl border border-dashed border-border/50 bg-secondary/10">
                                    <Shield className="h-6 w-6 text-muted-foreground/30" />
                                    <span className="text-xs text-muted-foreground tracking-wide">Пока никто не имеет доступа к этому документу</span>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1.5">
                                    {currentAccess.map((entry) => (
                                        <div
                                            key={entry.user.id}
                                            className="group flex flex-col gap-2 rounded-xl border border-border/30 bg-secondary/15 px-3 py-2.5 transition-all hover:border-border/60 hover:bg-secondary/25"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8 shrink-0">
                                                    <AvatarFallback className={`bg-gradient-to-br ${entry.user.color} text-[10px] font-bold text-white`}>
                                                        {entry.user.avatarInitials}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="text-xs font-medium text-foreground truncate tracking-wide">
                                                        {entry.user.name.split(" ").slice(0, 2).join(" ")}
                                                    </span>
                                                    <span className="text-[12px] text-muted-foreground truncate">
                                                        {entry.user.email}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {entry.role === "editor" ? (
                                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-mono px-2 tracking-wide">
                                                            <Pencil className="mr-1 h-2.5 w-2.5" />
                                                            Редактирование
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-sky-500/10 text-sky-400 border-sky-500/20 text-[10px] font-mono px-2 tracking-wide">
                                                            <Eye className="mr-1 h-2.5 w-2.5" />
                                                            Просмотр
                                                        </Badge>
                                                    )}
                                                    <div className="hidden sm:flex flex-col items-end">
                                                        <span className="text-[11px] text-muted-foreground tracking-wide font-mono flex items-center gap-1">
                                                            <Clock className="h-2.5 w-2.5" />
                                                            {entry.grantedAt}
                                                        </span>
                                                        {entry.expiresAt && (
                                                            <span className="text-[11px] text-amber-400/80 tracking-wide font-mono">
                                                                {"до "}{entry.expiresAt}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setEditingUserId(entry.user.id)
                                                            setEditRole(entry.role)
                                                            setEditDuration("unlimited")
                                                            setEditComment("")
                                                        }}
                                                        className="h-7 w-7 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>


                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setRevokeUser(entry)
                                                            setRevokeDialogOpen(true)
                                                        }}
                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {editingUserId === entry.user.id && (
                                                <div className="flex flex-col gap-3 w-full mt-2 bg-card/20 border border-border/30 rounded-xl p-3 animate-fadeIn">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="flex flex-col gap-2">
                                                            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">
                                                                Role
                                                            </Label>
                                                            <Select value={editRole} onValueChange={(v) => setEditRole(v as "viewer" | "editor")}>
                                                                <SelectTrigger className="h-9 bg-card/80 border-border text-foreground text-xs">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-popover text-popover-foreground border-border">
                                                                    <SelectItem value="viewer" className="text-xs">
                                                                        <div className="flex items-center gap-3 tracking-wide">
                                                                            <Eye className="h-4 w-4 text-sky-400" />
                                                                            <span>Только просмотр</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem value="editor" className="text-xs">
                                                                        <div className="flex items-center gap-3 tracking-wide">
                                                                            <Pencil className="h-4 w-4 text-emerald-400" />
                                                                            <span>Редактирование</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        <div className="flex flex-col gap-2">
                                                            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">
                                                                Duration
                                                            </Label>

                                                            <Select value={editDuration} onValueChange={setEditDuration}>
                                                                <SelectTrigger className="h-9 bg-card/80 border-border text-foreground text-xs">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-popover text-popover-foreground border-border">
                                                                    <SelectItem value="unlimited" className="text-xs">
                                                                        <div className="flex items-center gap-3 tracking-wide">
                                                                            <Shield className="h-4 w-4 text-violet-400" />
                                                                            <span>Без ограничения</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem value="1" className="text-xs">
                                                                        <div className="flex items-center gap-3 tracking-wide">
                                                                            <CalendarDays className="h-4 w-4 text-amber-400" />
                                                                            <span>1 день</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem value="7" className="text-xs">
                                                                        <div className="flex items-center gap-3 tracking-wide">
                                                                            <CalendarDays className="h-4 w-4 text-amber-400" />
                                                                            <span>7 дней</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem value="30" className="text-xs">
                                                                        <div className="flex items-center gap-3 tracking-wide">
                                                                            <CalendarDays className="h-4 w-4 text-amber-400" />
                                                                            <span>30 дней</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem value="90" className="text-xs">
                                                                        <div className="flex items-center gap-3 tracking-wide">
                                                                            <CalendarDays className="h-4 w-4 text-amber-400" />
                                                                            <span>90 дней</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem value="180" className="text-xs">
                                                                        <div className="flex items-center gap-3 tracking-wide">
                                                                            <CalendarDays className="h-4 w-4 text-amber-400" />
                                                                            <span>180 дней</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem value="365" className="text-xs">
                                                                        <div className="flex items-center gap-3 tracking-wide">
                                                                            <CalendarDays className="h-4 w-4 text-amber-400" />
                                                                            <span>1 год</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    {/* Comment field */}
                                                    <div className="flex flex-col gap-1">
                                                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                                                            <MessageSquare className="h-3 w-3" /> Comment
                                                        </Label>
                                                        <Textarea
                                                            value={editComment}
                                                            onChange={(e) => setEditComment(e.target.value)}
                                                            placeholder="Комментарий к доступу"
                                                            className="min-h-[60px] bg-card/80 border-border text-foreground text-xs tracking-wide px-3 py-2 rounded-lg resize-none focus:ring-1 focus:ring-[hsl(var(--gradient-from))] focus:border-[hsl(var(--gradient-from))]"
                                                        />
                                                    </div>

                                                    {/* Action buttons */}
                                                    <div className="flex gap-2 justify-end">
                                                        <Button
                                                            size="sm"
                                                            className="bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] text-primary-foreground hover:opacity-90 border-0 text-xs flex items-center gap-1"
                                                            onClick={handleSaveEdit}
                                                        >
                                                            <Check className="h-3 w-3" /> Сохранить
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-xs"
                                                            onClick={() => setEditingUserId(null)}
                                                        >
                                                            Отмена
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>

                <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
                    <DialogContent className="bg-card text-card-foreground border-border max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-foreground">
                                Revoke Access
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground tracking-wide">
                                Вы уверены, что хотите отменить доступ для{" "}
                                <span className="font-mono font-semibold text-foreground">
                                    {revokeUser?.user.name}
                                </span>
                                ?
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col gap-4 py-4">
                            <div className="flex items-center gap-3">
                                <Trash2 className="h-6 w-6 text-destructive/70" />
                                <span className="text-xs text-muted-foreground tracking-wide font-mono">
                                    Пользователь потеряет доступ к документу немедленно.
                                </span>
                            </div>
                        </div>

                        <DialogFooter className="flex justify-end gap-2">
                            <Button
                                variant="ghost"
                                onClick={() => setRevokeDialogOpen(false)}
                                className="text-muted-foreground hover:text-foreground hover:bg-secondary tracking-wide font-mono"
                            >
                                Отмена
                            </Button>
                            <Button
                                onClick={handleRevokeAccess}
                                className="bg-gradient-to-r from-rose-500 to-red-600 text-primary-foreground hover:opacity-90 border-0 tracking-wide font-mono"
                            >
                                Удалить доступ
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </DialogContent>
        </Dialog>
    )
}
