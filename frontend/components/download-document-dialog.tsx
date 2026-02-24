"use client"

import { useState, useRef } from "react"
import {
  Download,
  Lock,
  Unlock,
  KeyRound,
  FileKey,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  X,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

interface DownloadDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentTitle: string
  documentId: string
  documentType: string
}

export function DownloadDocumentDialog({
  open,
  onOpenChange,
  documentTitle,
  documentId,
  documentType,
}: DownloadDocumentDialogProps) {
  const [privateKeyFile, setPrivateKeyFile] = useState<File | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadMode, setDownloadMode] = useState<"decrypted" | "encrypted" | null>(null)
  const [downloadComplete, setDownloadComplete] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleKeyAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPrivateKeyFile(file)
    }
  }

  const handleRemoveKey = () => {
    setPrivateKeyFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDownload = (mode: "decrypted" | "encrypted") => {
    setDownloadMode(mode)
    setDownloading(true)
    setTimeout(() => {
      setDownloading(false)
      setDownloadComplete(true)
      setTimeout(() => {
        setDownloadComplete(false)
        setDownloadMode(null)
        onOpenChange(false)
        setPrivateKeyFile(null)
      }, 1500)
    }, 2000)
  }

  const handleClose = (val: boolean) => {
    if (!val) {
      setPrivateKeyFile(null)
      setDownloading(false)
      setDownloadComplete(false)
      setDownloadMode(null)
    }
    onOpenChange(val)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card text-card-foreground border-border max-w-md p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/20">
                <Download className="h-4.5 w-4.5 text-violet-400" />
              </div>
              <div>
                <DialogTitle className="text-foreground text-sm">Download Document</DialogTitle>
                <DialogDescription className="text-muted-foreground text-xs mt-0.5">
                  Choose download method
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-secondary/40 border border-border/50 px-3 py-2">
            <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-foreground font-medium truncate">{documentTitle}.{documentType}</span>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="flex flex-col gap-3">
            {/* Option 1: Download Decrypted */}
            <div className="rounded-xl border border-border/50 bg-secondary/20 overflow-hidden transition-all duration-200">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/15">
                    <Unlock className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-foreground">Download Decrypted</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                      The file will be decrypted locally using your private key before saving
                    </p>
                  </div>
                </div>

                {/* Private key attachment area */}
                <div className="mt-3">
                  {!privateKeyFile ? (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pem,.key,.p8,.der"
                        onChange={handleKeyAttach}
                        className="hidden"
                        id="private-key-input"
                      />
                      <label
                        htmlFor="private-key-input"
                        className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-border/60 bg-card/50 px-3 py-3 transition-all duration-200 hover:border-violet-500/30 hover:bg-secondary/30 group"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/60 border border-border/50 group-hover:border-violet-500/20 transition-colors">
                          <KeyRound className="h-3.5 w-3.5 text-muted-foreground group-hover:text-violet-400 transition-colors" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                            Attach private key
                          </span>
                          <span className="text-[9px] text-muted-foreground/60">
                            .pem, .key, .p8, .der
                          </span>
                        </div>
                        <Upload className="ml-auto h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-violet-400/60 transition-colors" />
                      </label>

                      {/* Warning when no key */}
                      <div className="flex items-start gap-2 mt-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15 px-3 py-2">
                        <AlertTriangle className="h-3 w-3 shrink-0 text-amber-400/70 mt-0.5" />
                        <span className="text-[10px] text-amber-400/70 leading-relaxed">
                          A private key is required to decrypt the file. Without it, download is not available.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/15">
                        <FileKey className="h-3.5 w-3.5 text-emerald-400" />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-[11px] font-medium text-emerald-400 truncate">
                          {privateKeyFile.name}
                        </span>
                        <span className="text-[9px] text-emerald-400/50 font-mono">
                          {(privateKeyFile.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <button
                        onClick={handleRemoveKey}
                        className="p-1 rounded-md hover:bg-secondary/50 transition-colors"
                      >
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                  )}
                </div>

                <Button
                  size="sm"
                  className="w-full mt-3 h-9 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-90 border-0 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={!privateKeyFile || (downloading && downloadMode === "decrypted")}
                  onClick={() => handleDownload("decrypted")}
                >
                  {downloading && downloadMode === "decrypted" ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Decrypting...
                    </span>
                  ) : downloadComplete && downloadMode === "decrypted" ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Downloaded
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Unlock className="h-3.5 w-3.5" />
                      Download Decrypted
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <Separator className="flex-1 bg-border/40" />
              <span className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider">or</span>
              <Separator className="flex-1 bg-border/40" />
            </div>

            {/* Option 2: Download Encrypted */}
            <div className="rounded-xl border border-border/50 bg-secondary/20 overflow-hidden transition-all duration-200">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/15">
                    <Lock className="h-4 w-4 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-foreground">Download Encrypted</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                      Download the file in its encrypted form. You can decrypt it later in the Decryption section.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full mt-3 h-9 bg-secondary/60 border border-border/60 text-foreground hover:bg-secondary text-xs font-medium"
                  disabled={downloading && downloadMode === "encrypted"}
                  onClick={() => handleDownload("encrypted")}
                >
                  {downloading && downloadMode === "encrypted" ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground" />
                      Downloading...
                    </span>
                  ) : downloadComplete && downloadMode === "encrypted" ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      Downloaded
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5" />
                      Download Encrypted
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Security notice */}
            <div className="flex items-start gap-2.5 rounded-lg bg-violet-500/5 border border-violet-500/10 px-3 py-2.5">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-violet-400/60 mt-0.5" />
              <span className="text-[10px] text-muted-foreground leading-relaxed">
                All decryption is performed locally in your browser. Your private key never leaves your device and is not transmitted to the server.
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
