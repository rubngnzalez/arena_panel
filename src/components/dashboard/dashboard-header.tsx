"use client"

import { useState } from "react"
import { Menu, X, Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DashboardHeaderProps {
  onMenuClick: () => void
  menuOpen: boolean
  unreadNotifications?: number
  user?: {
    email?: string
    name?: string
  }
}

export function DashboardHeader({
  onMenuClick,
  menuOpen,
  unreadNotifications = 0,
  user,
}: DashboardHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-40 glass-strong border-b border-white/5">
      <div className="arena-container">
        <div className="flex items-center justify-between py-3">
          {/* Left side */}
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuClick}
              className="glass p-2 rounded-pill transition-colors hover:border-primary/40"
              aria-label="Abrir menú"
            >
              {menuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
            <span className="text-sm font-medium">Arena<span className="text-gradient">13</span></span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {searchOpen ? (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Buscar..."
                  className="h-9 w-48"
                  autoFocus
                  onBlur={() => setSearchOpen(false)}
                />
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 glass"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
            )}

            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 glass relative">
                  <Bell className="h-4 w-4" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-pill bg-arena-gradient text-[0.6rem] font-bold text-white shadow-glow-purple">
                      {unreadNotifications > 9 ? "9+" : unreadNotifications}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 glass-strong rounded-2xl border-white/10" align="end">
                <div className="p-4 border-b border-white/5">
                  <h3 className="text-sm font-medium">Notificaciones</h3>
                </div>
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {unreadNotifications > 0
                    ? `Tienes ${unreadNotifications} notificaciones`
                    : "No hay notificaciones nuevas"}
                </div>
              </PopoverContent>
            </Popover>

            {/* User avatar */}
            <div className="flex h-9 w-9 items-center justify-center rounded-pill bg-arena-gradient shadow-glow-purple">
              <span className="text-xs font-semibold text-white">
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "A"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
