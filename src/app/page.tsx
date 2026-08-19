"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getBrowserClient } from "@/lib/supabase/client"
import { BrandLogo } from "@/components/brand-logo"

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
      <div className="flex flex-col items-center gap-5 animate-fade-in">
        <BrandLogo
          className="drop-shadow-[0_0_18px_rgba(120,125,255,0.4)]"
          imgClassName="h-20"
          fallbackSize="text-4xl"
        />
        <div className="h-6 w-6 rounded-pill border-2 border-white/10 border-t-primary animate-spin" />
      </div>
    </div>
  )
}
