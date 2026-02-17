"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, Eye, EyeOff, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { login } from "@/lib/api/auth";

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("");

    try {
      const res = await login({ email, password });
      console.log("Успешно вошли:", res.data);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Ошибка входа");
    } finally {
      setLoading(false);
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
                <h2 className="text-base font-semibold tracking-wide text-foreground">Sign In</h2>
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
                    <button type="button" className="text-[11px] tracking-wide text-violet-400 hover:text-violet-300 transition-colors">
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
                  <Checkbox id="remember" className="border-border data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-500" />
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
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Sign In
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
    </div>
  )
}
