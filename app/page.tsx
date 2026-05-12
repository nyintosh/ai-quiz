'use client'

import CameraView from '@/components/CameraView'
import AnswerPanel from '@/components/AnswerPanel'
import { useQuizAI } from '@/hooks/useQuizAI'

export default function Home() {
  const { result, status, analyze, reset } = useQuizAI()

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <CameraView onFrame={analyze} status={status} onDismiss={reset} />
      <AnswerPanel result={result} status={status} onDismiss={reset} />
    </main>
  )
}
