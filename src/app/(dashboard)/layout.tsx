"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSupabase } from "@/lib/supabase/client"
import { Sidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { CommandBar } from "@/components/command-bar"
import { obtenerRol, esRutaPermitidaCliente, type Rol } from "@/lib/roles"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = useSupabase()
  const [user, setUser] = useState<any>(null)
  const [rol, setRol] = useState<Rol | null>(null)
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
      const rolUsuario = await obtenerRol(supabase as any, session.user.id)
      setRol(rolUsuario)
      setLoading(false)

      if (rolUsuario === "cliente" && !esRutaPermitidaCliente(pathname)) {
        router.replace("/asistentes")
        return
      }

      const { count } = await supabase
        .from("notificaciones")
        .select("*", { count: "exact", head: true })
        .eq("leida", false)

      setUnreadNotifications(count || 0)
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
  }, [router, supabase, pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (loading || !rol) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-pill border-2 border-white/10 border-t-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <CommandBar />

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
              rol={rol}
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
        rol={rol}
        onLogout={handleLogout}
      />

      {/* Main content */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        {/* Header desktop */}
        <header className="hidden lg:block border-b border-white/5">
          <div className="arena-container">
            <div className="py-6 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest2 font-light">
                  {rol === "cliente" ? "Área de cliente" : "Panel de Gestión"}
                </p>
                <p className="text-sm text-gradient font-medium mt-0.5">Arena13</p>
              </div>
              <div className="flex items-center gap-2">
                {rol !== "cliente" && (
                  <span className="hidden xl:inline-flex items-center gap-1.5 text-xs text-muted-foreground font-light mr-2">
                    <kbd className="rounded-pill border border-white/10 bg-white/5 px-1.5 py-0.5 text-[0.65rem]">Ctrl K</kbd>
                    búsqueda rápida
                  </span>
                )}
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
