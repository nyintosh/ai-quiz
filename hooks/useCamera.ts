'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')

  const startCamera = useCallback(async (facing: 'environment' | 'user' = facingMode) => {
    setError(null)
    setIsReady(false)

    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsReady(true)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Camera access denied')
    }
  }, [facingMode])

  const toggleCamera = useCallback(async () => {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
    await startCamera(next)
  }, [facingMode, startCamera])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setIsReady(false)
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  useEffect(() => () => { stopCamera() }, [stopCamera])

  return { videoRef, isReady, error, facingMode, startCamera, stopCamera, toggleCamera }
}
