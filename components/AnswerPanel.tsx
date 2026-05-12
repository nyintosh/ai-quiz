'use client'

import type { QuizResult, QuizStatus } from '@/hooks/useQuizAI'
import StatusChip from './StatusChip'

interface Props {
  result: QuizResult | null
  status: QuizStatus
  onDismiss: () => void
}

const visible = (status: QuizStatus, result: QuizResult | null) =>
  result !== null || status === 'processing' || status === 'error'

export default function AnswerPanel({ result, status, onDismiss }: Props) {
  const show = visible(status, result)

  return (
    <div
      className={`fixed inset-x-0 bottom-0 max-h-[58dvh] overflow-y-auto rounded-t-2xl border-t border-white/10 bg-slate-900/80 px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 backdrop-blur-2xl transition-transform duration-300 ease-out will-change-transform ${show ? 'translate-y-0' : 'translate-y-full'}`}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
          Quiz AI
        </span>
        <div className="flex items-center gap-2">
          <StatusChip status={status} />
          {show && (
            <button
              onClick={onDismiss}
              aria-label="Dismiss"
              className="flex size-6 items-center justify-center rounded-full bg-white/10 text-slate-400 active:bg-white/20"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Processing skeleton — matches result layout to prevent shift */}
      {status === 'processing' && (
        <div className="flex flex-col gap-2.5">
          <div className="h-4 w-full animate-pulse rounded bg-white/10" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-white/10" />
          <div className="mt-1 flex flex-col gap-2">
            {[1, 0.9, 0.85, 0.75].map((w, i) => (
              <div
                key={i}
                className="h-11 animate-pulse rounded-xl bg-white/10"
                style={{ width: `${w * 100}%` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {status === 'error' && !result && (
        <p className="py-2 text-sm text-red-400">
          Could not process image. Point the camera at a clear quiz question.
        </p>
      )}

      {/* Result */}
      {result && (
        <>
          <p className="mb-3 text-[15px] font-semibold leading-relaxed text-slate-100">
            {result.question}
          </p>

          <ul className="mb-3 flex flex-col gap-2">
            {result.options.map((opt) => {
              const letter = opt.charAt(0).toUpperCase()
              const isCorrect = letter === result.answer
              return (
                <li
                  key={opt}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                    isCorrect
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                      : 'border-white/6 bg-white/5 text-slate-400'
                  }`}
                >
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isCorrect
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="flex-1">{opt.slice(2).trim()}</span>
                  {isCorrect && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-emerald-400">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </li>
              )
            })}
          </ul>

          <p className="border-t border-white/8 pt-3 text-xs leading-relaxed text-slate-500">
            {result.explanation}
          </p>
        </>
      )}
    </div>
  )
}
