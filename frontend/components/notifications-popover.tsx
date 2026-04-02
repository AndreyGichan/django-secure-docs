"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
    Bell,
    FileText,
    FilePlus,
    Trash2,
    UserPlus,
    UserMinus,
    Clock,
    Check,
    CheckCheck,
    X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/api/notifications"

type NotificationType =
    | "document_created"
    | "version_added"
    | "document_deleted"
    | "access_granted"
    | "access_revoked"
    | "access_expired"


interface Notification {
    id: string
    type: NotificationType
    title: string
    message: string
    timestamp: Date
    is_read: boolean
    document?: string
    document_title?: string
}

const notificationConfig: Record<
    NotificationType,
    { icon: typeof FileText; color: string; bgColor: string }
> = {
    document_created: {
        icon: FilePlus,
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/10",
    },
    version_added: {
        icon: FileText,
        color: "text-violet-400",
        bgColor: "bg-violet-500/10",
    },
    document_deleted: {
        icon: Trash2,
        color: "text-red-400",
        bgColor: "bg-red-500/10",
    },
    access_granted: {
        icon: UserPlus,
        color: "text-cyan-400",
        bgColor: "bg-cyan-500/10",
    },
    access_revoked: {
        icon: UserMinus,
        color: "text-amber-400",
        bgColor: "bg-amber-500/10",
    },
    access_expired: {
        icon: Clock,
        color: "text-orange-400",
        bgColor: "bg-orange-500/10",
    },
}


function formatTimestamp(date: Date): string {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return "Только что"
    if (minutes < 60) return `${minutes} мин назад`
    if (hours < 24) return `${hours} ч назад`
    if (days === 1) return "Вчера"
    if (days < 7) return `${days} дн назад`
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
}

export function NotificationsPopover() {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])

    const unreadCount = notifications.filter((n) => !n.is_read).length
    const unreadNotifications = notifications.filter((n) => !n.is_read)
    const readNotifications = notifications.filter((n) => n.is_read)

    useEffect(() => {

        loadNotifications()

        const interval = setInterval(loadNotifications, 30000)

        return () => clearInterval(interval)

    }, [])

    const loadNotifications = async () => {
        const { data } = await getNotifications()

        const mapped = data.map((n: any) => ({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            timestamp: new Date(n.created_at),
            is_read: n.is_read,
            documentId: n.document,
            documentTitle: n.document_title,
        }))

        setNotifications(mapped)
    }

    const handleNotificationClick = async (notification: Notification) => {
        const res = await markNotificationRead(notification.id)
        setNotifications(prev =>
            prev.map(n => n.id === notification.id ? { ...n, read: res.data.is_read } : n)
        )
        setOpen(false)

        router.push("/dashboard/documents")
    }

    const markAllAsRead = async () => {

        await markAllNotificationsRead()

        setNotifications((prev) =>
            prev.map((n) => ({ ...n, read: true }))
        )
    }


    const clearAll = () => {
        setNotifications([])
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary relative"
                >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                            <span className="relative inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 text-[8px] font-bold text-white">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                sideOffset={8}
                className="w-[380px] p-0 bg-card border-border shadow-2xl shadow-black/40"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
                        {unreadCount > 0 && (
                            <Badge
                                variant="secondary"
                                className="h-5 px-1.5 text-[10px] font-mono bg-violet-500/15 text-violet-400 border-violet-500/30"
                            >
                                {unreadCount} new
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                                onClick={markAllAsRead}
                            >
                                <CheckCheck className="h-3 w-3" />
                                Отметить все прочитанными
                            </Button>
                        )}
                    </div>
                </div>

                {/* Notifications list */}
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                        <div className="h-12 w-12 rounded-full bg-secondary/50 flex items-center justify-center mb-3">
                            <Bell className="h-5 w-5 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm tracking-wide text-muted-foreground">Нет уведомлений</p>
                        <p className="text-xs tracking-wide text-muted-foreground/60 mt-1">
                            Здесь пока пусто
                        </p>
                    </div>
                ) : (
                    <div className="max-h-[400px] overflow-y-auto">
                        <div className="flex flex-col">
                            {/* Unread section */}
                            {unreadNotifications.length > 0 && (
                                <div>
                                    {unreadNotifications.map((notification) => {
                                        const config = notificationConfig[notification.type]
                                        const Icon = config.icon
                                        return (
                                            <button
                                                key={notification.id}
                                                onClick={() => handleNotificationClick(notification)}
                                                className={cn(
                                                    "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50 border-l-2 border-violet-500",
                                                    "bg-violet-500/5"
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                                                        config.bgColor
                                                    )}
                                                >
                                                    <Icon className={cn("h-4 w-4", config.color)} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="text-xs tracking-wide font-medium text-foreground">
                                                            {notification.title}
                                                        </span>
                                                        <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                                                    </div>
                                                    <p className="text-[11px] tracking-wide text-muted-foreground leading-relaxed line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <span className="text-[10px] tracking-wide text-muted-foreground/60 font-mono mt-1 inline-block">
                                                        {formatTimestamp(notification.timestamp)}
                                                    </span>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Divider between read and unread */}
                            {unreadNotifications.length > 0 && readNotifications.length > 0 && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30">
                                    <div className="h-px flex-1 bg-border/50" />
                                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-semibold">
                                        Ранее
                                    </span>
                                    <div className="h-px flex-1 bg-border/50" />
                                </div>
                            )}

                            {/* Read section */}
                            {readNotifications.map((notification) => {
                                const config = notificationConfig[notification.type]
                                const Icon = config.icon
                                return (
                                    <button
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50 border-l-2 border-transparent"
                                    >
                                        <div
                                            className={cn(
                                                "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 opacity-60",
                                                config.bgColor
                                            )}
                                        >
                                            <Icon className={cn("h-4 w-4", config.color)} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-xs tracking-wide font-medium text-muted-foreground">
                                                    {notification.title}
                                                </span>
                                                <Check className="h-3 w-3 text-muted-foreground/40" />
                                            </div>
                                            <p className="text-[11px] tracking-wide text-muted-foreground/70 leading-relaxed line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <span className="text-[10px] tracking-wide text-muted-foreground/50 font-mono mt-1 inline-block">
                                                {formatTimestamp(notification.timestamp)}
                                            </span>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/50 bg-secondary/20">
                        {/* <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[10px] text-muted-foreground hover:text-destructive"
                            onClick={clearAll}
                        >
                            <X className="h-3 w-3" />
                            Clear all
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[10px] text-violet-400 hover:text-violet-300"
                            onClick={() => {
                                setOpen(false)
                                router.push("/dashboard/notifications")
                            }}
                        >
                            View all notifications
                        </Button> */}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}