"use client"

import { useState, useRef } from "react"
import {
  KeyRound,
  Upload,
  FileKey,
  ShieldCheck,
  X,
  Unlock,
  CheckCircle2,
  Lock,
  AlertTriangle,
  Info,
  HardDrive,
  Eye,
  EyeOff,
  FileText,
  Download,
  RotateCcw,
} from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"

type DecryptionState = "idle" | "ready" | "decrypting" | "success" | "error"

export default function DecryptionPage() {
  const [encryptedFile, setEncryptedFile] = useState<File | null>(null)
  const [privateKeyFile, setPrivateKeyFile] = useState<File | null>(null)
  const [state, setState] = useState<DecryptionState>("idle")
  const [progress, setProgress] = useState(0)
  const [showKeyName, setShowKeyName] = useState(false)
  const encryptedInputRef = useRef<HTMLInputElement>(null)
  const keyInputRef = useRef<HTMLInputElement>(null)

  const isReady = encryptedFile && privateKeyFile

  const handleDecrypt = () => {
    if (!isReady) return
    setState("decrypting")
    setProgress(0)

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setState("success")
          return 100
        }
        return prev + Math.random() * 15 + 5
      })
    }, 200)
  }

  const handleReset = () => {
    setEncryptedFile(null)
    setPrivateKeyFile(null)
    setState("idle")
    setProgress(0)
    if (encryptedInputRef.current) encryptedInputRef.current.value = ""
    if (keyInputRef.current) keyInputRef.current.value = ""
  }

  const handleRemoveEncrypted = () => {
    setEncryptedFile(null)
    setState("idle")
    setProgress(0)
    if (encryptedInputRef.current) encryptedInputRef.current.value = ""
  }

  const handleRemoveKey = () => {
    setPrivateKeyFile(null)
    setState("idle")
    setProgress(0)
    if (keyInputRef.current) keyInputRef.current.value = ""
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Decryption"
        breadcrumbs={[{ label: "Decryption" }]}
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* Security banner */}
        <div className="relative mb-6 overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-600/10 via-teal-600/5 to-cyan-500/10 p-5">
          <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-emerald-500/10 to-transparent" />
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-teal-500/10 blur-3xl" />
          <div className="relative flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">Local Browser Decryption</h3>
              <p className="text-xs font-mono text-muted-foreground mt-1 leading-relaxed max-w-lg">
                Вся расшифровка выполняется полностью в вашем браузере. Ваш приватный ключ никогда не покидает ваше устройство и не передаётся на сервер.
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] text-emerald-400/80 font-medium">End-to-End Encrypted</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <HardDrive className="h-4 w-4 text-emerald-400/60" />
                  <span className="text-[11px] text-emerald-400/80 font-medium">Client-Side Decryption</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-emerald-400/60" />
                  <span className="text-[11px] text-emerald-400/80 font-medium">Zero-Knowledge</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Left: File Inputs */}
          <div className="lg:col-span-3 flex flex-col gap-5">
            {/* Step 1: Encrypted File */}
            <div className="relative rounded-2xl border border-border/50 bg-card overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/15">
                    <span className="text-[12px] font-bold text-violet-400">1</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-normal tracking-wide text-foreground">Выберите зашифрованный файл</h3>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">Загрузите зашифрованный документ для расшифровки</p>
                  </div>
                  {encryptedFile && (
                    <Badge variant="outline" className="ml-auto bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] tracking-wide">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Готово
                    </Badge>
                  )}
                </div>

                {!encryptedFile ? (
                  <div>
                    <input
                      ref={encryptedInputRef}
                      type="file"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) setEncryptedFile(f)
                      }}
                      className="hidden"
                      id="encrypted-file-input"
                    />
                    <label
                      htmlFor="encrypted-file-input"
                      className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border/60 bg-secondary/15 px-6 py-8 transition-all duration-300 hover:border-violet-500/30 hover:bg-secondary/25 group"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/40 border border-border/50 group-hover:border-violet-500/20 group-hover:bg-violet-500/10 transition-all duration-300">
                        <Upload className="h-6 w-6 text-muted-foreground/60 group-hover:text-violet-400 transition-colors duration-300" />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-medium font-mono text-muted-foreground group-hover:text-foreground transition-colors">
                          Перетащите зашифрованный файл или нажмите для выбора
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground/50">
                          Любой тип зашифрованного файла
                        </span>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl bg-violet-500/5 border border-violet-500/15 px-4 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/15">
                      <FileText className="h-4.5 w-4.5 text-violet-400" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-xs font-medium text-foreground truncate">
                        {encryptedFile.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {(encryptedFile.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <button
                      onClick={handleRemoveEncrypted}
                      className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors"
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Private Key */}
            <div className="relative rounded-2xl border border-border/50 bg-card overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/15">
                    <span className="text-[12px] font-bold text-cyan-400">2</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-normal tracking-wide text-foreground">Выберите приватный ключ</h3>
                    <p className="text-[12px] font-mono text-muted-foreground mt-0.5">Прикрепите ваш приватный ключ для расшифровки</p>
                  </div>
                  {privateKeyFile && (
                    <Badge variant="outline" className="ml-auto bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] tracking-wide ">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Готово
                    </Badge>
                  )}
                </div>

                {!privateKeyFile ? (
                  <div>
                    <input
                      ref={keyInputRef}
                      type="file"
                      accept=".pem,.key,.p8,.der"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) setPrivateKeyFile(f)
                      }}
                      className="hidden"
                      id="key-file-input"
                    />
                    <label
                      htmlFor="key-file-input"
                      className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border/60 bg-secondary/15 px-6 py-8 transition-all duration-300 hover:border-cyan-500/30 hover:bg-secondary/25 group"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/40 border border-border/50 group-hover:border-cyan-500/20 group-hover:bg-cyan-500/10 transition-all duration-300">
                        <KeyRound className="h-6 w-6 text-muted-foreground/60 group-hover:text-cyan-400 transition-colors duration-300" />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-medium font-mono text-muted-foreground group-hover:text-foreground transition-colors">
                          Перетащите файл приватного ключа или нажмите для выбора
                        </span>
                        <span className="text-[11px] text-muted-foreground/50">
                          .pem
                        </span>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl bg-cyan-500/5 border border-cyan-500/15 px-4 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/15">
                      <FileKey className="h-4.5 w-4.5 text-cyan-400" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground truncate">
                          {showKeyName ? privateKeyFile.name : "••••••••" + privateKeyFile.name.slice(-4)}
                        </span>
                        <button
                          onClick={() => setShowKeyName(!showKeyName)}
                          className="p-0.5 rounded hover:bg-secondary/50 transition-colors"
                        >
                          {showKeyName ? (
                            <EyeOff className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <Eye className="h-3 w-3 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {(privateKeyFile.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <button
                      onClick={handleRemoveKey}
                      className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors"
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Decrypt Action */}
            <div className="relative rounded-2xl border border-border/50 bg-card overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/15">
                    <span className="text-[12px] font-bold text-emerald-400">3</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-normal tracking-wide text-foreground">Расшифровать файл</h3>
                    <p className="text-[12px] font-mono text-muted-foreground mt-0.5">Запустить процесс расшифровки</p>
                  </div>
                </div>

                {state === "decrypting" && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
                      <span>Расшифровка...</span>
                      <span className="font-mono text-foreground">{Math.min(100, Math.round(progress))}%</span>
                    </div>
                    <Progress value={Math.min(100, progress)} className="h-2 bg-secondary" />
                  </div>
                )}

                {state === "success" && (
                  <div className="mb-4 flex items-center gap-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 px-4 py-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs font-medium font-mono text-emerald-400">Расшифровка завершена</span>
                      <span className="text-[10px] font-mono text-emerald-400/60">Расшифрованный файл сохранен на ваше устройство</span>
                    </div>
                  </div>
                )}

                {state === "error" && (
                  <div className="mb-4 flex items-center gap-3 rounded-xl bg-rose-500/5 border border-rose-500/20 px-4 py-3">
                    <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs font-medium font-mono text-rose-400">Ошибка расшифровки</span>
                      <span className="text-[10px] font-mono text-rose-400/60">Неверный приватный ключ или поврежденный файл</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  {state === "success" ? (
                    <>
                      <Button
                        size="sm"
                        className="flex-1 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-90 border-0 text-xs font-medium font-mono"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Сохранить рассшифрованный файл
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary text-xs font-mono"
                        onClick={handleReset}
                      >
                        <RotateCcw className="mr-2 h-3.5 w-3.5" />
                        Новый файл
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      className="flex-1 h-10 bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] text-primary-foreground hover:opacity-90 border-0 text-xs font-medium disabled:opacity-40"
                      disabled={!isReady || state === "decrypting"}
                      onClick={handleDecrypt}
                    >
                      {state === "decrypting" ? (
                        <span className="flex items-center gap-2">
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Расшифровка файла...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 font-mono">
                          <Unlock className="h-3.5 w-3.5" />
                          Расшифровать файл
                        </span>
                      )}
                    </Button>
                  )}
                </div>

                {!isReady && state === "idle" && (
                  <div className="flex items-start gap-2 mt-3 rounded-lg bg-amber-500/5 border border-amber-500/10 px-3 py-2">
                    <Info className="h-4 w-4 shrink-0 text-amber-400/60" />
                    <span className="text-[11px] tracking-wide text-amber-400/60 leading-relaxed">
                      Выберите зашифрованный файл и приватный ключ для продолжения расшифровки.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Info Panel */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* How it works */}
            <div className="relative rounded-2xl border border-border/50 bg-card overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
              <div className="p-5">
                <h3 className="text-xs font-normal font-mono text-foreground mb-4">Как это работает</h3>
                <div className="flex flex-col gap-3">
                  {[
                    {
                      step: "1",
                      title: "Выберите зашифрованный файл",
                      desc: "Выберите файл, загруженный из системы в зашифрованном виде",
                      color: "from-violet-500/20 to-purple-500/20 border-violet-500/15 text-violet-400",
                    },
                    {
                      step: "2",
                      title: "Прикрепите приватный ключ",
                      desc: "Загрузите файл приватного ключа, который использовался для шифрования документа",
                      color: "from-cyan-500/20 to-teal-500/20 border-cyan-500/15 text-cyan-400",
                    },
                    {
                      step: "3",
                      title: "Расшифруйте",
                      desc: "Нажмите расшифровать и сохраните полученный файл на устройство",
                      color: "from-emerald-500/20 to-green-500/20 border-emerald-500/15 text-emerald-400",
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-3">
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${item.color} border`}>
                        <span className="text-[9px] font-bold">{item.step}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-mono font-medium text-foreground tracking-wide ">{item.title}</span>
                        <span className="text-[10px] font-mono text-muted-foreground leading-relaxed tracking-wide ">{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Supported Formats */}
            {/* <div className="relative rounded-2xl border border-border/50 bg-card overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
              <div className="p-5">
                <h3 className="text-xs font-semibold text-foreground mb-3">Supported Key Formats</h3>
                <div className="flex flex-wrap gap-1.5">
                  {[".pem", ".key", ".p8", ".der"].map((format) => (
                    <Badge
                      key={format}
                      variant="outline"
                      className="bg-secondary/40 text-muted-foreground border-border/60 text-[10px] font-mono"
                    >
                      {format}
                    </Badge>
                  ))}
                </div>
                <Separator className="bg-border/30 my-3" />
                <h3 className="text-xs font-semibold text-foreground mb-3">Encryption Algorithms</h3>
                <div className="flex flex-col gap-2">
                  {[
                    { name: "AES-256-GCM", status: "Primary" },
                    { name: "RSA-OAEP", status: "Key Wrap" },
                    { name: "ChaCha20-Poly1305", status: "Supported" },
                  ].map((algo) => (
                    <div key={algo.name} className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-foreground">{algo.name}</span>
                      <Badge
                        variant="outline"
                        className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[9px]"
                      >
                        {algo.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div> */}

            {/* Security Info */}
            <div className="relative rounded-2xl border border-emerald-500/15 bg-emerald-500/5 overflow-hidden">
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-xs font-semibold text-emerald-400 font-mono tracking-wide">Гарантия безопасности</h3>
                </div>
                <div className="flex flex-col gap-2.5">
                  {[
                    "Ваш приватный ключ никогда не покидает браузер",
                    "Во время расшифровки данные не передаются на сервер",
                    "Файлы обрабатываются с использованием Web Crypto API",
                    "Память очищается после завершения операции",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400/60" />
                      <span className="text-[10px] text-emerald-400/70 font-mono leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
