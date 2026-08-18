"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSupabase } from "@/lib/supabase/client"
import { Sidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { CommandBar } from "@/components/command-bar"
import { SplashScreen } from "@/components/splash-screen"
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
  const [nombreComercial, setNombreComercial] = useState<string | null>(null)

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

      if (rolUsuario === "cliente") {
        // Nombre comercial del cliente para la cabecera
        const { data: cli } = await supabase
          .from("clientes")
          .select("nombre_comercial, empresa, nombre")
          .or(`email.eq.${JSON.stringify(session.user.email)},usuario_auth_id.eq.${session.user.id}`)
          .maybeSingle()
        if (cli) setNombreComercial(cli.nombre_comercial || cli.empresa || cli.nombre || null)

        if (!esRutaPermitidaCliente(pathname)) {
          router.replace("/asistentes")
          return
        }
      } else {
        setNombreComercial(null)
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
    return <SplashScreen texto={rol === "cliente" ? "Cargando tu área…" : "Cargando panel…"} />
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
                {rol === "cliente" && nombreComercial ? (
                  <>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest2 font-light">
                      Área de Cliente
                    </p>
                    <p className="text-sm text-gradient font-medium mt-0.5">{nombreComercial}</p>
                  </>
                ) : (
                  <p className="text-sm text-gradient font-medium tracking-tight">
                    {nombreComercial || "Arena13"}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {rol !== "cliente" && (
                  <>
                    <span className="hidden xl:inline-flex items-center gap-1.5 text-xs text-muted-foreground font-light">
                      <kbd className="rounded-pill border border-white/10 bg-white/5 px-1.5 py-0.5 text-[0.65rem]">Ctrl K</kbd>
                      búsqueda rápida
                    </span>
                    <span className="text-xs text-muted-foreground font-light uppercase tracking-widest2">
                      Panel de Gestión
                    </span>
                  </>
                )}
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
