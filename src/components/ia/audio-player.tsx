"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Play, Pause } from "lucide-react"
import { cn } from "@/lib/utils"

const BARS = 72
const SPEEDS = [1, 1.5, 2] as const

function pseudoPeaks(seed: string): number[] {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const peaks: number[] = []
  for (let i = 0; i < BARS; i++) {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    peaks.push(0.15 + ((h >>> 0) % 1000) / 1000 * 0.75)
  }
  return peaks
}

function formatTime(seg: number): string {
  if (!Number.isFinite(seg)) return "0:00"
  const m = Math.floor(seg / 60)
  const s = Math.floor(seg % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}

interface AudioPlayerProps {
  src: string
  duracionSeg?: number
  className?: string
}

export function AudioPlayer({ src, duracionSeg, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const peaksRef = useRef<number[]>(pseudoPeaks(src))
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState<number>(1)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(duracionSeg ?? 0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const audio = audioRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr
      canvas.height = h * dpr
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    const total = audio?.duration && Number.isFinite(audio.duration) ? audio.duration : duration || 1
    const progress = total > 0 ? Math.min(current / total, 1) : 0
    const barW = w / BARS

    for (let i = 0; i < BARS; i++) {
      const v = peaksRef.current[i] ?? 0.3
      const barH = Math.max(2, v * (h - 4))
      const x = i * barW
      const y = (h - barH) / 2
      if (i / BARS <= progress) {
        const grad = ctx.createLinearGradient(0, 0, w, 0)
        grad.addColorStop(0, "#01a9f2")
        grad.addColorStop(1, "#787dff")
        ctx.fillStyle = grad
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.12)"
      }
      const r = Math.min(barW * 0.3, 2)
      ctx.beginPath()
      ctx.roundRect(x + barW * 0.18, y, barW * 0.64, barH, r)
      ctx.fill()
    }
  }, [current, duration])

  useEffect(() => {
    let cancelled = false
    const cargarPeaks = async () => {
      try {
        const res = await fetch(src)
        if (!res.ok) return
        const buffer = await res.arrayBuffer()
        const AC = window.AudioContext || (window as any).webkitAudioContext
        if (!AC) return
        const ctx = new AC()
        const audioBuffer = await ctx.decodeAudioData(buffer.slice(0))
        if (cancelled) { ctx.close(); return }
        const channel = audioBuffer.getChannelData(0)
        const blockSize = Math.floor(channel.length / BARS) || 1
        const peaks: number[] = []
        let max = 0.0001
        for (let i = 0; i < BARS; i++) {
          let sum = 0
          const start = i * blockSize
          for (let j = 0; j < blockSize; j += 16) {
            sum += Math.abs(channel[start + j] || 0)
          }
          const v = sum / (blockSize / 16)
          peaks.push(v)
          if (v > max) max = v
        }
        peaksRef.current = peaks.map((v) => Math.min(1, 0.12 + (v / max) * 0.88))
        ctx.close()
        draw()
      } catch {
        /* mantiene picos deterministas */
      }
    }
    cargarPeaks()
    return () => { cancelled = true }
  }, [src, draw])

  useEffect(() => { draw() }, [draw])

  useEffect(() => {
    const audio = audioRef.current
    if (audio) audio.playbackRate = rate
  }, [rate])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
    } else {
      audio.play()
    }
  }

  const seekFromEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const audio = audioRef.current
    const canvas = canvasRef.current
    if (!audio || !canvas || !Number.isFinite(audio.duration)) return
    const rect = canvas.getBoundingClientRect()
    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1)
    audio.currentTime = ratio * audio.duration
    setCurrent(audio.currentTime)
  }

  return (
    <div className={cn("glass rounded-2xl p-4 space-y-3", className)}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          if (Number.isFinite(e.currentTarget.duration)) setDuration(e.currentTarget.duration)
        }}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-arena-gradient shadow-glow-purple transition-transform active:scale-95"
          aria-label={playing ? "Pausar" : "Reproducir"}
        >
          {playing ? (
            <Pause className="h-4 w-4 text-white" />
          ) : (
            <Play className="h-4 w-4 text-white ml-0.5" />
          )}
        </button>

        <canvas
          ref={canvasRef}
          onClick={seekFromEvent}
          className="h-12 flex-1 min-w-0 cursor-pointer"
        />

        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
          {formatTime(current)} / {formatTime(duration)}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setRate(s)}
              className={cn(
                "rounded-pill px-2 py-1 text-[0.65rem] font-medium transition-colors",
                rate === s
                  ? "bg-primary/20 text-primary border border-primary/40"
                  : "text-muted-foreground border border-white/10 hover:text-foreground"
              )}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
