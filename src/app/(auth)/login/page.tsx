"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getBrowserClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const supabase = getBrowserClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message || "No se pudo iniciar sesión. Revisa tus credenciales.")
        setLoading(false)
        return
      }

      if (!data.user) {
        setError("No se pudo iniciar sesión. Revisa tus credenciales.")
        setLoading(false)
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("Ocurrió un error inesperado. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-grid px-6">
      <div className="w-full max-w-sm space-y-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-pill bg-arena-gradient shadow-glow-purple mb-5">
            <span className="text-2xl font-semibold text-white">A</span>
          </div>
          <h1 className="text-3xl font-medium tracking-tight mb-1.5">
            Arena<span className="text-gradient">13</span>
          </h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest2 font-light">
            Panel de Gestión
          </p>
        </div>

        {/* Login Form */}
        <div className="glass-strong rounded-2xl p-7 space-y-6">
          <div className="space-y-1.5 text-center">
            <h2 className="text-lg font-medium tracking-tight">Acceso al panel</h2>
            <p className="text-xs text-muted-foreground font-light">
              Diseño de Producto Digital & IA
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 rounded-pill border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Contraseña</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Iniciando..." : "Iniciar Sesión"}
            </Button>
          </form>
        </div>

        <Link
          href="/"
          className="block text-center text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
        >
          ← arenatrece.com
        </Link>
      </div>
    </div>
  )
}
