"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, Eye, EyeOff, ArrowRight, KeyRound, CheckCircle2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { login, forgotPassword } from "@/lib/api/auth";

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false)
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false)


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("");

    console.log("Trying login with:", { email, password });

    try {
      const res = await login({ email, password, remember_me: rememberMe, });
      console.log("Успешно вошли:", res.data);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Ошибка входа");
    } finally {
      setLoading(false);
    }
  }

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) return

    setForgotPasswordLoading(true)
    setForgotPasswordSuccess(false)

    try {
      await forgotPassword(forgotPasswordEmail)
      setForgotPasswordSuccess(true)
    } catch (err: any) {
      console.error("Ошибка запроса сброса пароля", err)
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background">
      {/* Animated background effects */}
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
        {/* Top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
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
            <p className="mt-1.5 text-sm text-muted-foreground">Secure Document Management</p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-2xl border border-violet-500/15 bg-card/80 backdrop-blur-sm p-7">
            {/* Card glow */}
            <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-violet-500/5 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-cyan-500/5 blur-3xl" />

            <div className="relative">
              <div className="mb-6">
                <h2 className="text-base font-medium tracking-wide text-foreground">Вход</h2>
                <p className="mt-1 text-xs tracking-wide text-muted-foreground">Введите учетные данные для доступа к системе</p>
              </div>


              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label className="text-xs text-muted-foreground font-medium">Email</Label>
                  <Input
                    type="email"
                    placeholder="user@company.com"
                    className="h-10 bg-secondary/50 border-border/70 tracking-wide text-foreground placeholder:text-muted-foreground/40 text-sm focus-visible:ring-violet-500/50 focus-visible:border-violet-500/30"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground font-medium">Пароль</Label>
                    {/* <button type="button" className="text-[11px] tracking-wide text-violet-400 hover:text-violet-300 transition-colors">
                      Забыли пароль?
                    </button> */}
                    <button
                      type="button"
                      className="text-[11px] tracking-wide text-violet-400 hover:text-violet-300 transition-colors"
                      onClick={() => {
                        setForgotPasswordEmail(email)
                        setForgotPasswordOpen(true)
                      }}
                    >
                      Забыли пароль?
                    </button>

                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Введите пароль"
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

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(!!checked)}
                    className="border-border data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-500"
                  />
                  <label htmlFor="remember" className="text-xs text-muted-foreground tracking-wide cursor-pointer">
                    Запомнить меня
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
                  <div className="flex items-center gap-2 font-medium font-mono">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Вход...
                  </div>
                ) : (
                  <div className="flex items-center gap-2 font-medium font-mono">
                    Войти
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>

              <div className="mt-6 text-center text-xs text-muted-foreground">
                Нет учетной записи?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/register")}
                  className="text-violet-400 hover:text-violet-300 transition-colors tracking-wide"
                >
                  Создать учетную запись
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

      <Dialog open={forgotPasswordOpen} onOpenChange={(open) => {
        setForgotPasswordOpen(open)
        if (!open) {
          // Сброс состояния при закрытии
          setForgotPasswordSuccess(false)
          setForgotPasswordLoading(false)
        }
      }}>
        <DialogContent className="bg-card text-card-foreground border-border max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/20">
                <KeyRound className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <DialogTitle className="text-foreground font-medium">Сброс пароля</DialogTitle>
                <DialogDescription className="mt-1 text-muted-foreground text-xs tracking-wide">
                  Администратор получит уведомление о вашем запросе
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {!forgotPasswordSuccess ? (
            <>
              <div className="py-4">
                <div className="flex flex-col gap-2">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <Input
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    placeholder="user@company.com"
                    className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground"
                    disabled={forgotPasswordLoading}
                  />
                </div>

                <p className="text-[11px] tracking-wide text-muted-foreground mt-3">
                  После отправки запроса администратор сбросит ваш пароль и свяжется с вами.
                </p>
              </div>

              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setForgotPasswordOpen(false)}
                  className="text-muted-foreground hover:text-foreground hover:bg-secondary"
                  disabled={forgotPasswordLoading}
                >
                  Отмена
                </Button>
                <Button
                  className="bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] text-primary-foreground hover:opacity-90 border-0"
                  disabled={!forgotPasswordEmail || forgotPasswordLoading}
                  onClick={handleForgotPassword}
                >
                  {forgotPasswordLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white mr-2" />
                      Отправка...
                    </>
                  ) : (
                    "Отправить запрос"
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="py-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
              </div>
              <h4 className="text-foreground font-medium mb-2">Запрос отправлен</h4>
              <p className="text-sm text-muted-foreground tracking-wide">
                Администратор получил уведомление и свяжется с вами в ближайшее время.
              </p>
              <Button
                variant="outline"
                className="mt-6 bg-secondary/50 border-border"
                onClick={() => setForgotPasswordOpen(false)}
              >
                Закрыть
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
