"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getBrowserClient } from "@/lib/supabase/client"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const redirect = async () => {
      const supabase = getBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      router.push(session ? "/dashboard" : "/login")
    }
    redirect()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-grid">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-pill bg-arena-gradient shadow-glow-purple">
          <span className="text-2xl font-semibold text-white">A</span>
        </div>
        <div className="h-6 w-6 rounded-pill border-2 border-white/10 border-t-primary animate-spin" />
      </div>
    </div>
  )
}
