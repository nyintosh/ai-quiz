'use client'

import { useState, useCallback, useRef } from 'react'

export type QuizStatus = 'idle' | 'processing' | 'answered' | 'error' | 'no-question'

export interface QuizResult {
  question: string
  options: string[]
  answer: string
  explanation: string
}

export function useQuizAI() {
  const [result, setResult] = useState<QuizResult | null>(null)
  const [status, setStatus] = useState<QuizStatus>('idle')
  const abortRef = useRef<AbortController | null>(null)

  const analyze = useCallback(async (base64: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setStatus('processing')
    setResult(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
        signal: controller.signal,
      })

      if (!response.ok) {
        setStatus('error')
        return
      }

      const data = await response.json()

      if (!data.question) {
        setStatus('no-question')
        return
      }

      setResult(data as QuizResult)
      setStatus('answered')
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setResult(null)
    setStatus('idle')
  }, [])

  return { result, status, analyze, reset }
}
