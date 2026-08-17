"use client"

import { useEffect, useRef } from "react"

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  cyan: boolean
  phase: number
}

const LINK_DIST = 150
const FRAME_MS = 1000 / 30

export function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let nodes: Node[] = []
    let width = 0
    let height = 0
    let raf = 0
    let last = 0
    let running = true
    let resizeTimer: ReturnType<typeof setTimeout>

    const setup = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = Math.max(24, Math.min(70, Math.round((width * height) / 26000)))
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: 1 + Math.random() * 1.4,
        cyan: Math.random() > 0.5,
        phase: Math.random() * Math.PI * 2,
      }))
    }

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw)
      if (!running) return
      if (t - last < FRAME_MS) return
      const dt = Math.min((t - last) / FRAME_MS, 3)
      last = t

      ctx.clearRect(0, 0, width, height)

      for (const n of nodes) {
        n.x += n.vx * dt
        n.y += n.vy * dt
        if (n.x < -20) n.x = width + 20
        else if (n.x > width + 20) n.x = -20
        if (n.y < -20) n.y = height + 20
        else if (n.y > height + 20) n.y = -20
      }

      ctx.lineWidth = 1
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          const dx = a.x - b.x
          if (dx > LINK_DIST || dx < -LINK_DIST) continue
          const dy = a.y - b.y
          if (dy > LINK_DIST || dy < -LINK_DIST) continue
          const d2 = dx * dx + dy * dy
          if (d2 > LINK_DIST * LINK_DIST) continue
          const alpha = (1 - Math.sqrt(d2) / LINK_DIST) * 0.14
          ctx.strokeStyle =
            a.cyan === b.cyan
              ? a.cyan
                ? `rgba(1,169,242,${alpha})`
                : `rgba(120,125,255,${alpha})`
              : `rgba(90,150,250,${alpha})`
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      }

      for (const n of nodes) {
        const pulse = 0.35 + 0.3 * (0.5 + 0.5 * Math.sin(t / 1600 + n.phase))
        ctx.fillStyle = n.cyan
          ? `rgba(1,169,242,${pulse * 0.25})`
          : `rgba(120,125,255,${pulse * 0.25})`
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r * 3.2, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = n.cyan
          ? `rgba(1,169,242,${0.4 + pulse * 0.4})`
          : `rgba(160,165,255,${0.4 + pulse * 0.4})`
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(setup, 200)
    }

    const onVisibility = () => {
      running = !document.hidden
      if (running) last = performance.now()
    }

    setup()
    raf = requestAnimationFrame(draw)
    window.addEventListener("resize", onResize)
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(resizeTimer)
      window.removeEventListener("resize", onResize)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
    />
  )
}
