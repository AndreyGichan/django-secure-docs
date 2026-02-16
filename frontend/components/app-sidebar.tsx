"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FileText,
  LayoutDashboard,
  Shield,
  BarChart3,
  Share2,
  LogOut,
  ChevronDown,
  User,
  Sparkles,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const mainNav = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    color: "text-violet-400",
  },
  {
    title: "Documents",
    href: "/dashboard/documents",
    icon: FileText,
    color: "text-cyan-400",
  },
]

const adminNav = [
  {
    title: "Audit Log",
    href: "/dashboard/audit",
    icon: Shield,
    color: "text-amber-400",
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    color: "text-emerald-400",
  },
  {
    title: "Sharing Graph",
    href: "/dashboard/graph",
    icon: Share2,
    color: "text-rose-400",
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="px-4 py-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 shadow-lg shadow-violet-500/25">
            <FileText className="h-4.5 w-4.5 text-white" />
            <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[hsl(0,0%,5%)]" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold text-foreground tracking-tight">
              DocVault
            </span>
            <span className="text-[10px] text-muted-foreground leading-none">
              Document Management
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={isActive ? "bg-gradient-to-r from-violet-600/15 to-cyan-500/10 border border-violet-500/20 text-foreground" : ""}
                    >
                      <Link href={item.href}>
                        <item.icon className={`h-4 w-4 ${isActive ? item.color : ""}`} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">
            Administration
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNav.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={isActive ? "bg-gradient-to-r from-violet-600/15 to-cyan-500/10 border border-violet-500/20 text-foreground" : ""}
                    >
                      <Link href={item.href}>
                        <item.icon className={`h-4 w-4 ${isActive ? item.color : ""}`} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Pro upgrade card */}
        <div className="mx-3 mt-auto group-data-[collapsible=icon]:hidden">
          <div className="relative overflow-hidden rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-600/10 via-purple-600/5 to-cyan-500/10 p-4">
            <div className="absolute top-0 right-0 h-20 w-20 bg-gradient-to-bl from-violet-500/20 to-transparent rounded-bl-full" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <span className="text-xs font-semibold text-foreground">Storage</span>
              </div>
              <div className="mb-2">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                  <span>8.2 GB / 10 GB</span>
                  <span className="text-violet-400 font-mono">82%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">1,284 documents stored</p>
            </div>
          </div>
        </div>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="w-full">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 text-[10px] font-bold text-white">
                      AD
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col text-left group-data-[collapsible=icon]:hidden">
                    <span className="text-xs font-semibold text-foreground">
                      Admin User
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      admin@company.com
                    </span>
                  </div>
                  <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-56 bg-popover text-popover-foreground"
              >
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/" className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
