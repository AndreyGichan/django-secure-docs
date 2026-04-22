"use client"

import { useState, useEffect } from "react"
import {
    Search,
    Filter,
    Plus,
    MoreHorizontal,
    X,
    ChevronLeft,
    ChevronRight,
    Mail,
    Shield,
    ShieldCheck,
    UserCog,
    KeyRound,
    Trash2,
    Ban,
    CheckCircle2,
    Clock,
    Edit,
    Eye,
    AlertTriangle,
    Copy,
    Check,
    Users,
} from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { Separator } from "@/components/ui/separator"
import { searchUsers } from "@/lib/api/auth"

interface User {
    id: string
    full_name: string
    email: string
    role: "admin" | "manager" | "employee"
    public_key: string | null
    date_joined: string
    last_login: string | null
    documentsCount: number
    createdAt: string
}

// const users: User[] = [
//   { id: "1", name: "Ivanov Ivan Petrovich", email: "ivanov@company.com", role: "admin", department: "IT", status: "active", documentsCount: 156, lastLogin: "2 hours ago", createdAt: "2024-01-15", avatarColor: "from-violet-500 to-purple-600" },
//   { id: "2", name: "Petrova Anna Sergeevna", email: "petrova@company.com", role: "manager", department: "Finance", status: "active", documentsCount: 89, lastLogin: "5 hours ago", createdAt: "2024-02-20", avatarColor: "from-cyan-500 to-blue-600" },
//   { id: "3", name: "Sidorov Kirill Dmitrievich", email: "sidorov@company.com", role: "user", department: "Legal", status: "active", documentsCount: 234, lastLogin: "1 day ago", createdAt: "2024-03-10", avatarColor: "from-emerald-500 to-green-600" },
//   { id: "4", name: "Kozlova Maria Alexandrovna", email: "kozlova@company.com", role: "manager", department: "HR", status: "active", documentsCount: 67, lastLogin: "3 days ago", createdAt: "2024-04-05", avatarColor: "from-amber-500 to-orange-600" },
//   { id: "5", name: "Novikov Dmitry Nikolaevich", email: "novikov@company.com", role: "user", department: "Marketing", status: "inactive", documentsCount: 12, lastLogin: "2 weeks ago", createdAt: "2024-05-12", avatarColor: "from-rose-500 to-pink-600" },
//   { id: "6", name: "Smirnova Elena Viktorovna", email: "smirnova@company.com", role: "user", department: "Sales", status: "active", documentsCount: 45, lastLogin: "6 hours ago", createdAt: "2024-06-18", avatarColor: "from-indigo-500 to-violet-600" },
//   { id: "7", name: "Kuznetsov Alexey Igorevich", email: "kuznetsov@company.com", role: "user", department: "IT", status: "blocked", documentsCount: 0, lastLogin: "1 month ago", createdAt: "2024-07-22", avatarColor: "from-slate-500 to-gray-600" },
//   { id: "8", name: "Morozova Tatiana Olegovna", email: "morozova@company.com", role: "manager", department: "Finance", status: "active", documentsCount: 178, lastLogin: "1 hour ago", createdAt: "2024-08-30", avatarColor: "from-teal-500 to-cyan-600" },
// ]

function getRoleBadge(role: string) {
    switch (role) {
        case "admin":
            return (
                <Badge variant="outline" className="bg-violet-500/15 text-violet-400 border-violet-500/30 text-[10px] tracking-wide font-mono">
                    <ShieldCheck className="mr-1 h-3 w-3" />
                    Админ
                </Badge>
            )
        case "manager":
            return (
                <Badge variant="outline" className="bg-cyan-500/15 text-cyan-400 border-cyan-500/30 text-[10px] tracking-wide font-mono">
                    <Shield className="mr-1 h-3 w-3" />
                    Менеджер
                </Badge>
            )
        default:
            return (
                <Badge variant="outline" className="bg-secondary text-muted-foreground border-border text-[10px] tracking-wide font-mono">
                    <Users className="mr-1 h-3 w-3" />
                    Сотрудник
                </Badge>
            )
    }
}

function getAvatarColor(name: string) {
    const colors = [
        "from-violet-500 to-purple-600",
        "from-cyan-500 to-blue-600",
        "from-emerald-500 to-green-600",
        "from-amber-500 to-orange-600",
        "from-rose-500 to-pink-600",
        "from-indigo-500 to-violet-600",
        "from-teal-500 to-cyan-600",
    ]

    let hash = 0
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }

    return colors[Math.abs(hash) % colors.length]
}

function formatDateTime(date: string | null) {
    if (!date) return "—"

    const d = new Date(date)

    return d.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

export default function UsersPage() {
    const [search, setSearch] = useState("")
    const [roleFilter, setRoleFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)
    const [resetPasswordOpen, setResetPasswordOpen] = useState(false)
    const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null)
    const [newPassword, setNewPassword] = useState("")
    const [passwordCopied, setPasswordCopied] = useState(false)
    const [passwordGenerated, setPasswordGenerated] = useState(false)
    const [addUserOpen, setAddUserOpen] = useState(false)
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [pageSize] = useState(10)
    const [totalCount, setTotalCount] = useState(0)

    useEffect(() => {
        loadUsers(search, page)
    }, [search, page])

    const loadUsers = async (searchValue: string, pageValue: number) => {
        try {
            const res = await searchUsers({
                search: searchValue,
                limit: pageSize,
                offset: (pageValue - 1) * pageSize,
            })

            setUsers(res.data.results)
            setTotalCount(res.data.count)
        } catch (e) {
            console.error("Failed to load users", e)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = async (value: string) => {
        setSearch(value)
        setPage(1)
    }

    const generatePassword = () => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%"
        let password = ""
        for (let i = 0; i < 16; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        setNewPassword(password)
        setPasswordGenerated(true)
    }

    const copyPassword = () => {
        navigator.clipboard.writeText(newPassword)
        setPasswordCopied(true)
        setTimeout(() => setPasswordCopied(false), 2000)
    }

    const handleResetPassword = (user: User) => {
        setResetPasswordUser(user)
        setNewPassword("")
        setPasswordGenerated(false)
        setPasswordCopied(false)
        setResetPasswordOpen(true)
    }

    const getInitials = (name: string) => {
        return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
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
                title="Users"
                breadcrumbs={[{ label: "Users" }]}
            >
                <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="h-8 bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] text-primary-foreground hover:opacity-90 border-0">
                            <Plus className="mr-2 h-3.5 w-3.5" />
                            Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card text-card-foreground border-border max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-foreground">Add New User</DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                                Create a new user account. The user will receive an email with login credentials.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col gap-4 py-4">
                            <div className="flex flex-col gap-2">
                                <Label className="text-xs text-muted-foreground">Full Name</Label>
                                <Input
                                    placeholder="Ivanov Ivan Petrovich"
                                    className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label className="text-xs text-muted-foreground">Email</Label>
                                <Input
                                    type="email"
                                    placeholder="user@company.com"
                                    className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-2">
                                    <Label className="text-xs text-muted-foreground">Role</Label>
                                    <Select defaultValue="user">
                                        <SelectTrigger className="bg-secondary/50 border-border text-foreground">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover text-popover-foreground border-border">
                                            <SelectItem value="user">Employee</SelectItem>
                                            <SelectItem value="manager">Manager</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setAddUserOpen(false)} className="text-muted-foreground hover:text-foreground hover:bg-secondary">
                                Cancel
                            </Button>
                            <Button className="bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] text-primary-foreground hover:opacity-90 border-0">
                                Create User
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </PageHeader>

            <div className="flex-1 overflow-auto p-6">
                {/* Filters */}
                <div className="mb-4 max-w-7xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 flex-1">
                        <div className="relative max-w-sm flex-1">
                            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email, or department..."
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="h-8 pl-9 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground text-xs"
                            />
                            {search && (
                                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                </button>
                            )}
                        </div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="h-8 w-32 bg-secondary/50 border-border text-xs text-muted-foreground">
                                <Shield className="mr-1 h-3 w-3" />
                                <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover text-popover-foreground border-border">
                                <SelectItem value="all" className="text-xs">Все роли</SelectItem>
                                <SelectItem value="admin" className="text-xs">Админ</SelectItem>
                                <SelectItem value="manager" className="text-xs">Менеджер</SelectItem>
                                <SelectItem value="employee" className="text-xs">Сотрудник</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Table */}
                <div className="relative max-w-7xl mx-auto rounded-2xl border border-border/50 bg-card overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border/50 hover:bg-transparent">
                                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">User</TableHead>
                                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Role</TableHead>
                                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium text-center">Documents</TableHead>
                                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Last Login</TableHead>
                                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium w-10"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow
                                    key={user.id}
                                    className="border-border/30 cursor-pointer hover:bg-secondary/30"
                                    onClick={() => {
                                        setSelectedUser(user)
                                        setDetailOpen(true)
                                    }}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarFallback className={`bg-gradient-to-br ${getAvatarColor(user.full_name)} text-[10px] font-bold text-white`}>
                                                    {getInitials(user.full_name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium text-foreground">
                                                    {user.full_name}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {user.email}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                                    <TableCell className="text-center">
                                        <span className="font-mono text-xs text-muted-foreground">
                                            {user.documentsCount}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            <span className="text-[10px]">{formatDateTime(user.last_login)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary">
                                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border w-48">
                                                <DropdownMenuItem className="text-xs">
                                                    <Eye className="mr-2 h-3.5 w-3.5" />
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-xs">
                                                    <Edit className="mr-2 h-3.5 w-3.5" />
                                                    Edit User
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-xs">
                                                    <Mail className="mr-2 h-3.5 w-3.5" />
                                                    Send Email
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-border" />
                                                <DropdownMenuItem
                                                    className="text-xs text-amber-400 focus:text-amber-400"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleResetPassword(user)
                                                    }}
                                                >
                                                    <KeyRound className="mr-2 h-3.5 w-3.5" />
                                                    Reset Password
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-border" />
                                                <DropdownMenuItem className="text-xs text-destructive">
                                                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                                                    Delete User
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
                <div className="mt-4 max-w-7xl mx-auto flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                        {"Showing "}
                        <span className="font-mono text-foreground">{users.length}</span>
                        {" of "}
                        <span className="font-mono text-foreground">{totalCount}</span>
                        {" users"}
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

            {/* User Detail Dialog */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="bg-card text-card-foreground border-border max-w-lg">
                    {selectedUser && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-14 w-14">
                                        <AvatarFallback className={`bg-gradient-to-br ${getAvatarColor(selectedUser.full_name)} text-lg font-bold text-white`}>
                                            {getInitials(selectedUser.full_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <DialogTitle className="text-foreground">{selectedUser.full_name}</DialogTitle>
                                        <DialogDescription className="text-muted-foreground flex items-center gap-2">
                                            <Mail className="h-3 w-3" />
                                            {selectedUser.email}
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>
                            <Separator className="bg-border/50" />
                            <div className="flex flex-col gap-3 py-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Role</span>
                                    {getRoleBadge(selectedUser.role)}
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Documents</span>
                                    <span className="text-foreground font-mono">{selectedUser.documentsCount}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Last Login</span>
                                    <span className="text-foreground">{formatDateTime(selectedUser.last_login)}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Created</span>
                                    <span className="text-foreground font-mono">{selectedUser.createdAt}</span>
                                </div>
                            </div>
                            <Separator className="bg-border/50" />
                            <DialogFooter className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary text-xs"
                                    onClick={() => {
                                        setDetailOpen(false)
                                        handleResetPassword(selectedUser)
                                    }}
                                >
                                    <KeyRound className="mr-2 h-3 w-3" />
                                    Reset Password
                                </Button>
                                <Button size="sm" className="bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] text-primary-foreground hover:opacity-90 border-0 text-xs">
                                    <Edit className="mr-2 h-3 w-3" />
                                    Edit User
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
                <DialogContent className="bg-card text-card-foreground border-border max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/20">
                                <KeyRound className="h-6 w-6 text-amber-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-foreground">Reset Password</DialogTitle>
                                <DialogDescription className="text-muted-foreground text-xs">
                                    {resetPasswordUser?.full_name}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="py-4">
                        {/* Warning */}
                        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 mb-4">
                            <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-amber-400">Security Notice</span>
                                <span className="text-[11px] text-amber-400/80">
                                    The user will need to use this new password to log in. Make sure to securely share it with them.
                                </span>
                            </div>
                        </div>

                        {/* Generate Password Section */}
                        <div className="flex flex-col gap-3">
                            <Label className="text-xs text-muted-foreground">New Password</Label>

                            {!passwordGenerated ? (
                                <Button
                                    variant="outline"
                                    onClick={generatePassword}
                                    className="h-12 border-dashed border-2 border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary/50 hover:border-violet-500/30"
                                >
                                    <KeyRound className="mr-2 h-4 w-4" />
                                    Generate Secure Password
                                </Button>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 rounded-lg border border-border bg-secondary/50 px-3 py-2.5">
                                            <code className="text-sm font-mono text-foreground tracking-wide">
                                                {newPassword}
                                            </code>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-10 w-10 bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary shrink-0"
                                            onClick={copyPassword}
                                        >
                                            {passwordCopied ? (
                                                <Check className="h-4 w-4 text-emerald-400" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={generatePassword}
                                            className="h-7 text-[10px] text-muted-foreground hover:text-foreground"
                                        >
                                            <KeyRound className="mr-1.5 h-3 w-3" />
                                            Regenerate
                                        </Button>
                                        {passwordCopied && (
                                            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                                                <Check className="h-3 w-3" />
                                                Copied to clipboard
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Manual Input Option */}
                        {passwordGenerated && (
                            <>
                                <Separator className="my-4 bg-border/50" />
                                <div className="flex flex-col gap-2">
                                    <Label className="text-xs text-muted-foreground">Or enter custom password</Label>
                                    <Input
                                        type="text"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter custom password..."
                                        className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground font-mono"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setResetPasswordOpen(false)}
                            className="text-muted-foreground hover:text-foreground hover:bg-secondary"
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] text-primary-foreground hover:opacity-90 border-0"
                            disabled={!newPassword}
                            onClick={() => {
                                setResetPasswordOpen(false)
                            }}
                        >
                            Reset Password
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}