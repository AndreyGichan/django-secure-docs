"use client"

import { useState, useCallback, useEffect } from "react"
import {
    User,
    Mail,
    Building2,
    Shield,
    Calendar,
    KeyRound,
    Download,
    Copy,
    Check,
    AlertTriangle,
    RefreshCw,
    Clock,
    FileText,
    Share2,
    Lock,
    Fingerprint,
    Plus,
    ShieldCheck,
    Eye,
    EyeOff,
} from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { updateUserPublicKey, getCurrentUser, changePassword } from "@/lib/api/auth";
import { getUserStats } from "@/lib/api/stats"
import { generateKeyPair, toPEM } from "@/lib/crypto/keys";


export default function ProfilePage() {
    const [generateOpen, setGenerateOpen] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [generated, setGenerated] = useState(false)
    const [keySaved, setKeySaved] = useState(false)
    const [copied, setCopied] = useState(false)
    const [downloaded, setDownloaded] = useState(false)
    const [showFingerprint, setShowFingerprint] = useState<Record<string, boolean>>({})
    const [generatedPrivateKey, setGeneratedPrivateKey] = useState<string | null>(null)
    const [userProfile, setUserProfile] = useState<{
        id: string
        email: string
        full_name: string
        role: string
        public_key?: string
        date_joined: string
        last_login: string
    } | null>(null)
    const [stats, setStats] = useState({
        documents_created: 0,
        documents_shared: 0,
        documents_accessible: 0
    })
    const [oldPassword, setOldPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [showOldPassword, setShowOldPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)


    useEffect(() => {
        const loadProfile = async () => {
            try {
                const res = await getCurrentUser()
                setUserProfile(res.data)
            } catch (error) {
                console.error("Failed to load profile:", error)
            }
        }

        loadProfile()
    }, [])

    useEffect(() => {
        const loadStats = async () => {
            try {
                const res = await getUserStats()
                setStats(res.data)
            } catch (error) {
                console.error("Failed to load stats:", error)
            }
        }

        loadStats()
    }, [])


    const handleChangePassword = async () => {
        try {
            await changePassword(oldPassword, newPassword, confirmPassword)
            setSuccessMessage("Пароль успешно обновлён")
            setErrorMessage(null)
            setOldPassword("")
            setNewPassword("")
            setConfirmPassword("")
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err) {
            setErrorMessage("Ошибка при смене пароля")
            setSuccessMessage(null)
            setTimeout(() => setErrorMessage(null), 3000)
        }
    }


    const handleGenerate = async () => {
        try {
            setGenerating(true)
            setGenerated(false)

            const keys = await generateKeyPair()
            const privatePEM = toPEM(keys.privateKey, "PRIVATE")
            const publicPEM = toPEM(keys.publicKey, "PUBLIC")

            setGeneratedPrivateKey(privatePEM)
            await updateUserPublicKey(publicPEM)

            setGenerated(true)
        } catch (err) {
            console.error("Key generation error:", err)
        } finally {
            setGenerating(false)
        }
    }

    const handleDownloadKey = useCallback(() => {
        const blob = new Blob([generatedPrivateKey || ""], { type: "application/x-pem-file" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "docvault_private_key_new.pem"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setDownloaded(true)
    }, [generatedPrivateKey])

    const handleCopyKey = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(generatedPrivateKey || "")
            setCopied(true)
            setTimeout(() => setCopied(false), 2500)
        } catch {
            const textarea = document.createElement("textarea")
            textarea.value = generatedPrivateKey || ""
            document.body.appendChild(textarea)
            textarea.select()
            document.execCommand("copy")
            document.body.removeChild(textarea)
            setCopied(true)
            setTimeout(() => setCopied(false), 2500)
        }
    }, [])

    return (
        <div className="flex flex-1 flex-col">
            <PageHeader
                title="Profile"
                breadcrumbs={[{ label: "Profile" }]}
            />

            <div className="flex-1 overflow-auto p-6">
                <div className="mx-auto max-w-5xl flex flex-col gap-6">

                    {/* ---- Top: Profile card ---- */}
                    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card">
                        {/* Decorative gradient background */}
                        <div className="h-28 bg-gradient-to-r from-violet-600/20 via-purple-600/10 to-cyan-500/20 relative">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
                            <div className="absolute -top-16 left-1/4 h-32 w-32 rounded-full bg-violet-500/20 blur-3xl" />
                            <div className="absolute -top-10 right-1/3 h-28 w-28 rounded-full bg-cyan-500/15 blur-3xl" />
                            <div
                                className="absolute inset-0 opacity-[0.03]"
                                style={{
                                    backgroundImage: "radial-gradient(circle, hsl(262, 50%, 50%) 1px, transparent 1px)",
                                    backgroundSize: "24px 24px",
                                }}
                            />
                        </div>

                        <div className="relative px-6 pb-6 -mt-10">
                            <div className="flex flex-col sm:flex-row items-start gap-5">
                                {/* Avatar */}
                                <div className="relative">
                                    <Avatar className="h-20 w-20 border-4 border-card shadow-xl">
                                        <AvatarFallback className="bg-gradient-to-br from-violet-600 to-cyan-500 text-xl font-bold text-white">
                                            {userProfile?.full_name
                                                ?.split(" ")
                                                .map(n => n[0])
                                                .join("")
                                                .slice(0, 2)
                                            }
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 border-2 border-card">
                                        <ShieldCheck className="h-3 w-3 text-white" />
                                    </div>
                                </div>

                                {/* Name & meta */}
                                <div className="flex-1 pt-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                        <h2 className="text-xl tracking-wide font-mono text-foreground">{userProfile?.full_name}</h2>
                                        <Badge className="w-fit bg-violet-500/15 text-violet-400 border-violet-500/30 text-[10px] font-mono">
                                            {userProfile?.role}
                                        </Badge>
                                    </div>
                                    <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1.5">
                                            <Mail className="h-3 w-3 text-cyan-400" />
                                            {userProfile?.email}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="h-3 w-3 text-emerald-400" />
                                            {"Joined "}
                                            {userProfile?.date_joined
                                                ? new Date(userProfile.date_joined).toLocaleDateString()
                                                : ""}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick stats */}
                            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { label: "Documents", value: stats.documents_created, icon: FileText, color: "text-violet-400", bg: "bg-violet-500/10" },
                                    { label: "Shared", value: stats.documents_shared, icon: Share2, color: "text-cyan-400", bg: "bg-cyan-500/10" },
                                    { label: "Access", value: stats.documents_accessible, icon: Lock, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                                    {
                                        label: "Last Login", value: userProfile?.last_login
                                            ? new Date(userProfile.last_login).toLocaleTimeString()
                                            : "-",
                                        icon: Clock,
                                        color: "text-amber-400",
                                        bg: "bg-amber-500/10"
                                    },
                                ].map((stat) => (
                                    <div key={stat.label} className="flex items-center gap-3 rounded-xl bg-secondary/30 border border-border/40 px-4 py-3">
                                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg}`}>
                                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{stat.label}</span>
                                            <span className="text-sm font-bold text-foreground font-mono">{stat.value}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ---- Bottom: Two columns ---- */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                        {/* Left: Personal info */}
                        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5">
                            <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-violet-500/5 blur-3xl" />
                            <div className="relative flex flex-col gap-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        <User className="h-4 w-4 text-violet-400" />
                                        Personal Information
                                    </h3>
                                    <p className="text-[11px] font-mono tracking-wide text-muted-foreground mt-1.5">Данные учетной записи</p>
                                </div>

                                <Separator className="bg-border/40" />

                                <div className="flex flex-col gap-3.5">
                                    {[
                                        { label: "Full Name", value: userProfile?.full_name },
                                        { label: "Email Address", value: userProfile?.email },
                                        { label: "Role", value: userProfile?.role },
                                        {
                                            label: "Member Since", value: userProfile?.date_joined
                                                ? new Date(userProfile.date_joined).toLocaleDateString()
                                                : ""
                                        },
                                        {
                                            label: "Last Active",
                                            value: userProfile?.last_login
                                                ? new Date(userProfile.last_login).toLocaleString()
                                                : "-"
                                        }
                                    ].map((item) => (
                                        <div key={item.label} className="flex flex-col gap-1">
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.label}</span>
                                            <span className="text-xs text-foreground font-medium">{item.value}</span>
                                        </div>
                                    ))}
                                </div>

                                <Separator className="bg-border/40" />

                                <div className="flex flex-col gap-3">
                                    <Label className="text-xs text-muted-foreground font-medium">Change Password</Label>
                                    <div className="relative">
                                        <Input
                                            type={showOldPassword ? "text" : "password"}
                                            placeholder="Текущий пароль"
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            className="h-9 bg-secondary/50 border-border/70 text-foreground placeholder:text-muted-foreground/40 text-xs font-mono focus-visible:ring-violet-500/50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowOldPassword(!showOldPassword)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            type={showNewPassword ? "text" : "password"}
                                            placeholder="Новый пароль"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="h-9 bg-secondary/50 border-border/70 text-foreground placeholder:text-muted-foreground/40 text-xs font-mono focus-visible:ring-violet-500/50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Подтвердить новый пароль"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="h-9 bg-secondary/50 border-border/70 text-foreground placeholder:text-muted-foreground/40 text-xs font-mono focus-visible:ring-violet-500/50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleChangePassword}
                                        className="w-fit text-xs font-mono bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                                    >
                                        Обновить пароль
                                    </Button>
                                    {successMessage && (
                                        <div className="mt-2 flex items-center gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-emerald-600 text-sm font-mono">
                                            <Check className="h-4 w-4" />
                                            {successMessage}
                                        </div>
                                    )}

                                    {errorMessage && (
                                        <div className="mt-2 flex items-center gap-2 rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2 text-red-600 text-sm font-mono">
                                            <AlertTriangle className="h-4 w-4" />
                                            {errorMessage}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: Keys section */}
                        <div className="lg:col-span-3 relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5">
                            <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-emerald-500/5 blur-3xl" />
                            <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-cyan-500/5 blur-3xl" />

                            <div className="relative flex flex-col gap-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                            <KeyRound className="h-4 w-4 text-emerald-400" />
                                            Encryption Keys
                                        </h3>
                                        <p className="text-[11px] font-mono tracking-wide text-muted-foreground mt-1.5">Управляйте RSA ключами для шифрования документов</p>
                                    </div>
                                    <Button
                                        onClick={() => {
                                            setGenerated(false)
                                            setGenerating(false)
                                            setKeySaved(false)
                                            setCopied(false)
                                            setDownloaded(false)
                                            setGenerateOpen(true)
                                        }}
                                        size="sm"
                                        className="bg-gradient-to-r from-emerald-600 to-cyan-500 text-white hover:from-emerald-500 hover:to-cyan-400 border-0 text-xs tracking-wide shadow-lg shadow-emerald-500/15"
                                    >
                                        <Plus className="mr-1.5 h-3 w-3" />
                                        Создать новую пару
                                    </Button>
                                </div>

                                <Separator className="bg-border/40" />

                                {/* Info banner */}
                                <div className="flex items-start gap-3 rounded-xl bg-violet-500/5 border border-violet-500/15 px-4 py-3">
                                    <Shield className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[11px] text-violet-400 font-medium">About Key Pairs</span>
                                        <p className="text-[11px] font-mono text-muted-foreground leading-relaxed">
                                            Ваш открытый ключ хранится на сервере и используется для шифрования документов. Ваш закрытый ключ хранится только у вас и необходим для расшифровки загруженных документов. Сервер никогда не имеет доступа к вашему закрытому ключу.
                                        </p>
                                    </div>
                                </div>


                                {/* Key list */}
                                {/* <div className="flex flex-col gap-3">
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Key History</span>

                                    {keyHistory.map((key) => (
                                        <div
                                            key={key.id}
                                            className={`relative overflow-hidden rounded-xl border px-4 py-3.5 transition-all duration-200 ${key.status === "active"
                                                ? "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/30"
                                                : "border-border/40 bg-secondary/20 opacity-60 hover:opacity-80"
                                                }`}
                                        >
                                            {key.status === "active" && (
                                                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                                            )}

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${key.status === "active"
                                                        ? "bg-emerald-500/15"
                                                        : "bg-secondary/50"
                                                        }`}>
                                                        <Fingerprint className={`h-5 w-5 ${key.status === "active" ? "text-emerald-400" : "text-muted-foreground"
                                                            }`} />
                                                    </div>
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-semibold text-foreground font-mono">
                                                                {showFingerprint[key.id] ? key.fingerprint : key.fingerprint.replace(/[a-f0-9]/g, "*")}
                                                            </span>
                                                            <button
                                                                onClick={() => toggleFingerprint(key.id)}
                                                                className="text-muted-foreground hover:text-foreground transition-colors"
                                                            >
                                                                {showFingerprint[key.id]
                                                                    ? <EyeOff className="h-3 w-3" />
                                                                    : <Eye className="h-3 w-3" />
                                                                }
                                                            </button>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <Lock className="h-2.5 w-2.5" />
                                                                {key.algorithm}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="h-2.5 w-2.5" />
                                                                {key.createdAt}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] font-mono ${key.status === "active"
                                                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                                        : "bg-secondary/50 text-muted-foreground border-border"
                                                        }`}
                                                >
                                                    {key.status === "active" ? "ACTIVE" : "REVOKED"}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div> */}

                                {/* Warning */}
                                <div className="flex items-start gap-3 rounded-xl bg-amber-500/5 border border-amber-500/15 px-4 py-3">
                                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                                    <p className="text-[11px] font-mono text-amber-400/80 leading-relaxed">
                                        Генерация новой пары ключей аннулирует предыдущую. Для расшифровки документов, зашифрованных старым открытым ключом, по-прежнему потребуется старый закрытый ключ.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ---- Generate Key Dialog ---- */}
            <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
                <DialogContent className="bg-card text-card-foreground border-border max-w-md p-0 gap-0 overflow-hidden">
                    {/* Header */}
                    <div className="relative px-6 pt-6 pb-0">
                        <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
                        <DialogHeader className="relative">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20">
                                    <RefreshCw className={`h-5 w-5 text-white ${generating ? "animate-spin" : ""}`} />
                                </div>
                                <div>
                                    <DialogTitle className="text-base font-bold text-foreground">Generate New Key Pair</DialogTitle>
                                    <DialogDescription className="text-[11px] text-muted-foreground mt-0.5">
                                        Create a new RSA-4096 key pair for document encryption
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                    </div>

                    <div className="px-6 py-5 flex flex-col gap-4">
                        {/* Before generating */}
                        {!generated && !generating && (
                            <>
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-3 rounded-xl bg-secondary/30 border border-border/50 px-4 py-3">
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[11px] text-foreground font-medium">Algorithm</span>
                                            <span className="text-[10px] text-muted-foreground font-mono">RSA-4096 (OAEP + SHA-256)</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 rounded-xl bg-secondary/30 border border-border/50 px-4 py-3">
                                        <Shield className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[11px] text-foreground font-medium">Security Level</span>
                                            <span className="text-[10px] text-muted-foreground">Military-grade encryption, 4096-bit key length</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 rounded-xl bg-amber-500/5 border border-amber-500/15 px-4 py-3">
                                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-amber-400/80 leading-relaxed">
                                        This will revoke your current active key pair. You will need the new private key to decrypt any future documents. Old documents still require the old key.
                                    </p>
                                </div>

                                <Button
                                    onClick={handleGenerate}
                                    className="h-10 w-full bg-gradient-to-r from-emerald-600 to-cyan-500 text-white hover:from-emerald-500 hover:to-cyan-400 border-0 text-sm font-semibold shadow-lg shadow-emerald-500/20"
                                >
                                    <KeyRound className="mr-2 h-4 w-4" />
                                    Generate Key Pair
                                </Button>
                            </>
                        )}

                        {/* Generating animation */}
                        {generating && (
                            <div className="flex flex-col items-center gap-4 py-6">
                                <div className="relative">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-xl shadow-emerald-500/25">
                                        <RefreshCw className="h-8 w-8 text-white animate-spin" />
                                    </div>
                                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 opacity-20 blur-lg animate-pulse" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-foreground">Generating RSA-4096 key pair...</p>
                                    <p className="text-[11px] text-muted-foreground mt-1">This may take a few seconds</p>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 animate-[loading_2s_ease-in-out_infinite]"
                                        style={{ width: "100%", animation: "loading 2s ease-in-out infinite" }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Generated - show key */}
                        {generated && (
                            <>
                                {/* Success header */}
                                <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
                                        <Check className="h-4 w-4 text-emerald-400" />
                                    </div>
                                    <div>
                                        <span className="text-xs font-semibold text-emerald-400">Key pair generated successfully</span>
                                        <p className="text-[10px] text-muted-foreground">Save your private key below</p>
                                    </div>
                                </div>

                                {/* Key preview */}
                                <div className="rounded-xl bg-background/80 border border-border/50 p-3 font-mono text-[10px] text-muted-foreground leading-relaxed max-h-[100px] overflow-y-auto">
                                    <pre className="whitespace-pre-wrap break-all">{generatedPrivateKey}</pre>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleDownloadKey}
                                        className={`flex-1 h-9 text-xs font-semibold transition-all duration-300 ${downloaded
                                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                                            : "bg-gradient-to-r from-violet-600 to-cyan-500 text-white hover:from-violet-500 hover:to-cyan-400 border-0 shadow-lg shadow-violet-500/20"
                                            }`}
                                        variant={downloaded ? "outline" : "default"}
                                    >
                                        {downloaded ? (
                                            <><Check className="mr-1.5 h-3 w-3" /> Downloaded</>
                                        ) : (
                                            <><Download className="mr-1.5 h-3 w-3" /> Download .pem</>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={handleCopyKey}
                                        variant="outline"
                                        className={`flex-1 h-9 text-xs font-semibold border-border transition-all duration-300 ${copied
                                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                            : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                            }`}
                                    >
                                        {copied ? (
                                            <><Check className="mr-1.5 h-3 w-3" /> Copied</>
                                        ) : (
                                            <><Copy className="mr-1.5 h-3 w-3" /> Copy</>
                                        )}
                                    </Button>
                                </div>

                                {/* Warning */}
                                <div className="flex items-start gap-3 rounded-xl bg-amber-500/5 border border-amber-500/15 px-4 py-3">
                                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-amber-400/80 leading-relaxed">
                                        If you lose your private key, it will be impossible to restore access to previously uploaded documents.
                                    </p>
                                </div>

                                {/* Confirm */}
                                <div className="flex items-center gap-3 rounded-xl bg-secondary/30 border border-border/50 px-4 py-3">
                                    <Checkbox
                                        id="key-saved-profile"
                                        checked={keySaved}
                                        onCheckedChange={(v) => setKeySaved(v === true)}
                                        className="border-border data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                                    />
                                    <label htmlFor="key-saved-profile" className="text-xs text-foreground cursor-pointer font-medium">
                                        I have saved the key in a secure location
                                    </label>
                                </div>

                                <Button
                                    onClick={() => setGenerateOpen(false)}
                                    disabled={!keySaved}
                                    className="h-10 w-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white hover:from-violet-500 hover:to-cyan-400 border-0 text-sm font-semibold shadow-lg shadow-violet-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                                >
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    Confirm and Close
                                </Button>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
      `}</style>
        </div>
    )
}
