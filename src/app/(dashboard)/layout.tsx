"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/client"
import { isFeatureEnabled } from "@/lib/features"
import { Sidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const supabase = useSupabase()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }
      setUser(session.user)
      setLoading(false)

      // Cargar notificaciones no leídas si la feature está activa
      if (isFeatureEnabled("notificaciones")) {
        const { count } = await supabase
          .from("notificaciones")
          .select("*", { count: "exact", head: true })
          .eq("leida", false)

        setUnreadNotifications(count || 0)
      }
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/login")
      } else {
        setUser(session)
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-pill border-2 border-white/10 border-t-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header móvil */}
      <DashboardHeader
        onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        menuOpen={mobileMenuOpen}
        unreadNotifications={unreadNotifications}
        user={user}
      />

      {/* Sidebar móvil */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 h-full">
            <Sidebar
              user={user}
              unreadNotifications={unreadNotifications}
              onCloseMobile={() => setMobileMenuOpen(false)}
              onLogout={handleLogout}
              isMobile={true}
            />
          </div>
        </div>
      )}

      {/* Sidebar desktop */}
      <Sidebar
        user={user}
        unreadNotifications={unreadNotifications}
        onLogout={handleLogout}
      />

      {/* Main content */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        {/* Header desktop */}
        <header className="hidden lg:block border-b border-white/5">
          <div className="arena-container">
            <div className="py-6 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest2 font-light">Panel de Gestión</p>
                <p className="text-sm text-gradient font-medium mt-0.5">Arena13</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-light">Diseño de Producto Digital & IA</span>
                <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="arena-container py-12">
          {children}
        </div>
      </main>
    </div>
  )
}
