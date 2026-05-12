'use client'

import { useEffect, useRef } from 'react'
import { useCamera } from '@/hooks/useCamera'
import { useFrameCapture } from '@/hooks/useFrameCapture'
import type { QuizStatus } from '@/hooks/useQuizAI'

interface Props {
  onFrame: (base64: string) => void
  status: QuizStatus
  onDismiss: () => void
}

function cornerColor(status: QuizStatus): string {
  switch (status) {
    case 'processing': return 'border-amber-400'
    case 'answered':   return 'border-emerald-400'
    case 'error':      return 'border-red-400'
    default:           return 'border-white/70'
  }
}

export default function CameraView({ onFrame, status, onDismiss }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { videoRef, isReady, error, startCamera, toggleCamera } = useCamera()
  const { start, stop } = useFrameCapture(videoRef, canvasRef, onFrame)

  useEffect(() => {
    startCamera()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (isReady) {
      start()
    } else {
      stop()
    }
    return stop
  }, [isReady, start, stop])

  const color = cornerColor(status)
  const pulse = status === 'idle' ? 'animate-pulse' : ''
  const panelOpen = status === 'answered' || status === 'error' || status === 'no-question' || status === 'processing'

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black overflow-hidden">
      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center gap-4 px-8 text-center">
          <svg className="size-12 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
          <p className="text-sm text-red-400 max-w-xs leading-relaxed">{error}</p>
          <button
            onClick={() => startCamera()}
            className="rounded-full bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white active:bg-blue-600"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {!isReady && !error && (
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <div className="size-9 animate-spin rounded-full border-[3px] border-white/15 border-t-white" />
          <p className="text-sm">Starting camera…</p>
        </div>
      )}

      {/* Video feed */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        className={`h-full w-full object-cover ${isReady ? 'opacity-100' : 'opacity-0'}`}
        autoPlay
        playsInline
        muted
      />

      {/* Tap-to-dismiss overlay (camera area only) */}
      {panelOpen && (
        <button
          onClick={onDismiss}
          aria-label="Scan next question"
          className="absolute inset-x-0 top-0 bottom-[58dvh] cursor-pointer"
        />
      )}

      {/* Viewfinder corners */}
      {isReady && (
        <div className="pointer-events-none absolute inset-0">
          <span className={`absolute left-6 top-14 size-6 border-l-2 border-t-2 rounded-tl transition-colors duration-300 ${color} ${pulse}`} />
          <span className={`absolute right-6 top-14 size-6 border-r-2 border-t-2 rounded-tr transition-colors duration-300 ${color} ${pulse}`} />
          <span className={`absolute bottom-[calc(58dvh+16px)] left-6 size-6 border-b-2 border-l-2 rounded-bl transition-colors duration-300 ${color} ${pulse}`} />
          <span className={`absolute bottom-[calc(58dvh+16px)] right-6 size-6 border-b-2 border-r-2 rounded-br transition-colors duration-300 ${color} ${pulse}`} />
        </div>
      )}

      {/* Camera flip button */}
      {isReady && (
        <div className="absolute right-4 top-[max(16px,env(safe-area-inset-top))]">
          <button
            onClick={toggleCamera}
            aria-label="Flip camera"
            className="flex size-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md active:bg-black/70"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </button>
        </div>
      )}

      {/* Scan-next hint */}
      {panelOpen && (
        <div className="pointer-events-none absolute bottom-[calc(58dvh+32px)] inset-x-0 flex justify-center">
          <span className="rounded-full bg-black/50 px-3 py-1 text-[11px] text-white/60 backdrop-blur-sm">
            Tap to scan next
          </span>
        </div>
      )}

      {/* Hidden canvas for pixel capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
