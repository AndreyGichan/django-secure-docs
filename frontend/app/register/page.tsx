"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, Eye, EyeOff, ArrowRight, KeyRound, Download, Copy, Check, ShieldCheck, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import { register, login as loginUser } from "@/lib/api/auth";
import { generateKeyPair, toPEM } from "@/lib/crypto/keys";


export default function RegisterPage() {
    const router = useRouter()

    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [keyModalOpen, setKeyModalOpen] = useState(false)
    const [keySaved, setKeySaved] = useState(false)
    const [copied, setCopied] = useState(false)
    const [downloaded, setDownloaded] = useState(false)
    const [generatedPrivateKey, setGeneratedPrivateKey] = useState<string | null>(null);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        setError("");

        if (password !== confirmPassword) {
            setError("Пароли не совпадают");
            setLoading(false);
            return;
        }

        try {

            const keys = await generateKeyPair();
            const privatePEM = toPEM(keys.privateKey, "PRIVATE");
            const publicPEM = toPEM(keys.publicKey, "PUBLIC");

            setGeneratedPrivateKey(privatePEM);

            await register({
                email,
                password1: password,
                password2: confirmPassword,
                full_name: fullName,
                public_key: publicPEM,
            });

            await loginUser({ email, password });
            setKeyModalOpen(true)

            // router.push("/dashboard");
        } catch (err: any) {
            setError(
                err.response?.data?.email?.[0] ||
                err.response?.data?.password1?.[0] ||
                err.response?.data?.non_field_errors?.[0] ||
                "Ошибка регистрации"
            );
        } finally {
            setLoading(false);
        }
    }

    const handleDownloadKey = () => {
        if (!generatedPrivateKey) return;

        const blob = new Blob([generatedPrivateKey], { type: "application/x-pem-file" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "docvault_private_key.pem"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setDownloaded(true)
    }

    const handleCopyKey = async () => {
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
    }

    const handleContinue = () => {
        setKeyModalOpen(false)
        router.push("/dashboard")
    }


    return (
        <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background">
            {/* Background effects */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-violet-600 opacity-[0.07] blur-[150px] animate-pulse-glow" />
                <div className="absolute bottom-1/4 right-1/3 h-[400px] w-[400px] rounded-full bg-cyan-500 opacity-[0.05] blur-[130px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
                <div className="absolute top-1/2 right-1/4 h-[300px] w-[300px] rounded-full bg-purple-500 opacity-[0.04] blur-[100px] animate-pulse-glow" style={{ animationDelay: "3s" }} />

                <div
                    className="absolute inset-0 opacity-[0.015]"
                    style={{
                        backgroundImage: "radial-gradient(circle, hsl(262, 50%, 50%) 1px, transparent 1px)",
                        backgroundSize: "40px 40px",
                    }}
                />

                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
            </div>

            <div className="relative z-10 w-full max-w-lg px-6">
                {/* Logo */}
                <div className="mb-10 flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 shadow-xl shadow-violet-500/30">
                            <FileText className="h-7 w-7 text-white" />
                        </div>
                        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 opacity-20 blur-lg" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">DocVault</h1>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                            Secure Document Management
                        </p>
                    </div>
                </div>

                {/* Register Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="relative overflow-hidden rounded-2xl border border-violet-500/15 bg-card/80 backdrop-blur-sm p-7">

                        <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-violet-500/5 blur-3xl" />
                        <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-cyan-500/5 blur-3xl" />

                        <div className="relative">
                            <div className="mb-6">
                                <h2 className="text-base font-semibold text-foreground">Create Account</h2>
                                <p className="mt-1 text-xs text-muted-foreground tracking-wide">
                                    Зарегистрируйтесь для доступа к системе
                                </p>
                            </div>

                            <div className="flex flex-col gap-5">
                                {/* Full Name */}
                                <div className="flex flex-col gap-2">
                                    <Label className="text-xs text-muted-foreground tracking-wide font-medium">
                                        ФИО
                                    </Label>
                                    <Input
                                        type="text"
                                        placeholder="Иванов Иван Иванович"
                                        className="h-10 bg-secondary/50 border-border/70 tracking-wide text-foreground placeholder:text-muted-foreground/40 text-sm pr-10 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/30"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>

                                {/* Email */}
                                <div className="flex flex-col gap-2">
                                    <Label className="text-xs text-muted-foreground font-medium">
                                        Email
                                    </Label>
                                    <Input
                                        type="email"
                                        placeholder="user@company.com"
                                        className="h-10 bg-secondary/50 border-border/70 tracking-wide text-foreground placeholder:text-muted-foreground/40 text-sm pr-10 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/30"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                {/* Password */}
                                <div className="flex flex-col gap-2">
                                    <Label className="text-xs text-muted-foreground tracking-wide font-medium">
                                        Пароль
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Создайте пароль"
                                            className="h-10 bg-secondary/50 border-border/70 tracking-wide text-foreground placeholder:text-muted-foreground/40 text-sm pr-10 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/30"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div className="flex flex-col gap-2">
                                    <Label className="text-xs text-muted-foreground tracking-wide font-medium">
                                        Подтверждение пароля
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Повторите пароль"
                                            className="h-10 bg-secondary/50 border-border/70 tracking-wide text-foreground placeholder:text-muted-foreground/40 text-sm pr-10 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/30"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Terms */}
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="terms"
                                        className="border-border data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-500"
                                    />
                                    <label htmlFor="terms" className="text-xs tracking-wide text-muted-foreground cursor-pointer">
                                        Согласен с условиями и политикой конфиденциальности
                                    </label>
                                </div>
                            </div>

                            {error && <p className="text-red-500 text-center mt-2">{error}</p>}
                            <Button
                                type="submit"
                                disabled={loading}
                                className="mt-6 h-10 w-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white hover:from-violet-500 hover:to-cyan-400 border-0 text-sm font-semibold shadow-lg shadow-violet-500/20 transition-all duration-300 hover:shadow-violet-500/30"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                        Creating account...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        Sign Up
                                        <ArrowRight className="h-4 w-4" />
                                    </div>
                                )}
                            </Button>

                            <div className="mt-6 text-center tracking-wide text-xs text-muted-foreground">
                                Уже есть учетная запись?{" "}
                                <button
                                    type="button"
                                    onClick={() => router.push("/login")}
                                    className="text-violet-400 tracking-wide hover:text-violet-300 transition-colors"
                                >
                                    Войти
                                </button>
                            </div>
                        </div>
                    </div>
                </form>

                <div className="mt-8 flex flex-col items-center gap-3">
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground/40">
                        <span className="h-px w-8 bg-border/50" />
                        DocVault v2.0
                        <span className="h-px w-8 bg-border/50" />
                    </div>
                </div>
            </div>

            <Dialog open={keyModalOpen} onOpenChange={() => { /* prevent closing by clicking outside */ }}>
                <DialogContent
                    className="bg-card text-card-foreground border-border max-w-[35rem] p-0 gap-0 overflow-hidden [&>button]:hidden"
                    onPointerDownOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                >
                    <DialogTitle className="sr-only">Your Private Key</DialogTitle>
                    {/* Header with animated key icon */}
                    <div className="relative flex flex-col items-center px-6 pt-8 pb-5 text-center">
                        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent" />
                        <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

                        <div className="relative">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-xl shadow-emerald-500/25">
                                <KeyRound className="h-8 w-8 text-white" />
                            </div>
                            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 opacity-20 blur-lg animate-pulse" />
                            {/* Success checkmark overlay */}
                            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 border-2 border-card shadow-lg">
                                <Check className="h-3 w-3 text-white" />
                            </div>
                        </div>

                        <h2 className="relative mt-5 text-lg font-bold text-foreground">
                            Your Private Key Has Been Created!
                        </h2>
                        <p className="relative mt-2 text-sm font-mono text-muted-foreground leading-relaxed max-w-lg">
                            Сохраните ключ в надежном месте. Без него вы не сможете расшифровать документы.
                        </p>
                    </div>

                    {/* Key preview */}
                    <div className="px-6">
                        <div className="rounded-xl bg-background/80 border border-border/50 p-3 font-mono text-[12px] text-muted-foreground leading-relaxed max-h-[200px] overflow-y-auto">
                            <pre className="whitespace-pre-wrap break-all">{generatedPrivateKey}</pre>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 px-6 mt-4">
                        <Button
                            onClick={handleDownloadKey}
                            className={`flex-1 h-10 text-xs font-semibold font-mono tracking-wide transition-all duration-300 ${downloaded
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                                : "bg-gradient-to-r from-violet-600 to-cyan-500 text-white hover:from-violet-500 hover:to-cyan-400 border-0 shadow-lg shadow-violet-500/20"
                                }`}
                            variant={downloaded ? "outline" : "default"}
                        >
                            {downloaded ? (
                                <>
                                    <Check className="h-3.5 w-3.5" />
                                    Скачано
                                </>
                            ) : (
                                <>
                                    <Download className="h-3.5 w-3.5" />
                                    Скачать .pem
                                </>
                            )}
                        </Button>

                        <Button
                            onClick={handleCopyKey}
                            variant="outline"
                            className={`flex-1 h-10 text-xs font-semibold font-mono tracking-wide border-border transition-all duration-300 ${copied
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                }`}
                        >
                            {copied ? (
                                <>
                                    <Check className="h-3.5 w-3.5" />
                                    Скопировано
                                </>
                            ) : (
                                <>
                                    <Copy className="h-3.5 w-3.5" />
                                    Скопировать
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Warning */}
                    <div className="mx-6 mt-4 flex items-start gap-3 rounded-xl bg-amber-500/5 border border-amber-500/15 px-3 py-3">
                        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-2" />
                        <p className="text-[12px] text-amber-400/80 leading-relaxed font-mono">
                            При потере приватного ключа восстановить доступ к ранее загруженным документам будет невозможно. Храните его в безопасном месте.
                        </p>
                    </div>

                    {/* Confirm + continue */}
                    <div className="px-6 pt-4 pb-6 flex flex-col gap-3">
                        <div className="flex items-center gap-3 rounded-xl bg-secondary/30 border border-border/50 px-4 py-3">
                            <Checkbox
                                id="key-saved"
                                checked={keySaved}
                                onCheckedChange={(v) => setKeySaved(v === true)}
                                className="border-border data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                            />
                            <label htmlFor="key-saved" className="text-xs text-foreground font-mono cursor-pointer font-medium">
                                Я сохранил ключ в безопасном месте
                            </label>
                        </div>

                        <Button
                            onClick={handleContinue}
                            disabled={!keySaved}
                            className="h-10 w-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white hover:from-violet-500 hover:to-cyan-400 border-0 text-sm font-semibold tracking-wide shadow-lg shadow-violet-500/20 transition-all duration-300 hover:shadow-violet-500/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4" />
                                Продолжить
                            </div>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
