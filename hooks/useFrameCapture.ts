'use client'

import { useRef, useCallback } from 'react'

const INTERVAL_MS = 600
const DIFF_THRESHOLD = 12
const MOTION_FRAMES = 3
const COOLDOWN_MS = 3000
const MAX_W = 800

function sampleDiff(a: Uint8ClampedArray, b: Uint8ClampedArray): number {
  let total = 0
  let count = 0
  for (let i = 0; i < a.length; i += 32) {
    total += Math.abs(a[i] - b[i])
    total += Math.abs(a[i + 1] - b[i + 1])
    total += Math.abs(a[i + 2] - b[i + 2])
    count += 3
  }
  return count > 0 ? total / count : 0
}

export function useFrameCapture(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  onSignificantChange: (base64: string) => void,
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const previousPixels = useRef<Uint8ClampedArray | null>(null)
  const diffCount = useRef(0)
  const lastCallAt = useRef(0)
  const callbackRef = useRef(onSignificantChange)
  callbackRef.current = onSignificantChange

  const tick = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) return

    const scale = Math.min(1, MAX_W / video.videoWidth)
    const w = Math.round(video.videoWidth * scale)
    const h = Math.round(video.videoHeight * scale)
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, w, h)

    const current = ctx.getImageData(0, 0, w, h).data
    const now = Date.now()

    if (previousPixels.current && previousPixels.current.length === current.length) {
      const diff = sampleDiff(current, previousPixels.current)
      if (diff > DIFF_THRESHOLD) {
        diffCount.current++
      } else {
        diffCount.current = 0
      }

      if (diffCount.current >= MOTION_FRAMES && now - lastCallAt.current >= COOLDOWN_MS) {
        diffCount.current = 0
        lastCallAt.current = now
        previousPixels.current = new Uint8ClampedArray(current)
        callbackRef.current(canvas.toDataURL('image/jpeg', 0.75))
      }
    } else {
      previousPixels.current = new Uint8ClampedArray(current)
      if (now - lastCallAt.current >= COOLDOWN_MS) {
        lastCallAt.current = now
        callbackRef.current(canvas.toDataURL('image/jpeg', 0.75))
      }
    }
  }, [videoRef, canvasRef])

  const start = useCallback(() => {
    if (intervalRef.current) return
    previousPixels.current = null
    diffCount.current = 0
    lastCallAt.current = 0
    intervalRef.current = setInterval(tick, INTERVAL_MS)
  }, [tick])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    previousPixels.current = null
    diffCount.current = 0
  }, [])

  return { start, stop }
}
