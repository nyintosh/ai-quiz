'use client'

import type { QuizResult, QuizStatus } from '@/hooks/useQuizAI'

interface Props {
  result: QuizResult | null
  status: QuizStatus
  onDismiss: () => void
}

const visible = (status: QuizStatus, result: QuizResult | null) =>
  result !== null || status === 'processing' || status === 'error' || status === 'no-question'

function optionText(option: string) {
  return option.replace(/^[A-Z][.)]\s*/i, '').trim()
}

export default function AnswerPanel({ result, status, onDismiss }: Props) {
  const show = visible(status, result)

  return (
    <section
      aria-label="Answer"
      className={`glass-panel fixed inset-x-3 bottom-3 max-h-[50dvh] overflow-y-auto rounded-[30px] px-5 pb-[max(18px,env(safe-area-inset-bottom))] pt-5 text-white transition-transform duration-300 ease-out lg:inset-y-3 lg:left-auto lg:right-3 lg:max-h-none lg:w-[396px] lg:px-6 lg:pb-6 lg:pt-[max(22px,env(safe-area-inset-top))] ${show ? 'translate-y-0 lg:translate-x-0' : 'translate-y-[calc(100%+16px)] lg:translate-x-[calc(100%+16px)] lg:translate-y-0'}`}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/46">
            Quiz AI
          </p>
          <h1 className="mt-1 truncate text-2xl font-black tracking-normal">
            {result ? `Answer ${result.answer}` : status === 'processing' ? 'Reading' : 'Try another angle'}
          </h1>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Close answer"
          className="glass-control flex size-11 shrink-0 items-center justify-center rounded-full text-white active:scale-95"
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {status === 'processing' && (
        <div className="space-y-3">
          <div className="h-5 w-11/12 animate-pulse rounded-full bg-white/16" />
          <div className="h-5 w-2/3 animate-pulse rounded-full bg-white/12" />
          <div className="space-y-2 pt-2">
            {[1, 0.9, 0.82, 0.74].map((width, index) => (
              <div
                key={index}
                className="h-12 animate-pulse rounded-2xl bg-white/10"
                style={{ width: `${width * 100}%` }}
              />
            ))}
          </div>
        </div>
      )}

      {status === 'error' && !result && (
        <p className="rounded-3xl border border-red-200/20 bg-red-400/16 p-4 text-sm font-semibold leading-relaxed text-red-50">
          Could not read it. Move the camera and it will clear automatically.
        </p>
      )}

      {status === 'no-question' && !result && (
        <p className="rounded-3xl border border-white/16 bg-white/12 p-4 text-sm font-semibold leading-relaxed text-white/78">
          No readable multiple-choice question was found.
        </p>
      )}

      {result && (
        <div className="space-y-5">
          <p className="text-lg font-black leading-snug text-white">
            {result.question}
          </p>

          <ul className="space-y-2">
            {result.options.map((option) => {
              const letter = option.charAt(0).toUpperCase()
              const isCorrect = letter === result.answer
              return (
                <li
                  key={option}
                  className={`answer-option flex min-h-13 items-center gap-3 rounded-[22px] border px-4 py-3 text-sm font-bold ${
                    isCorrect
                      ? 'border-emerald-200/35 bg-emerald-400/28 text-white'
                      : 'border-white/12 bg-white/10 text-white/78'
                  }`}
                >
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                    isCorrect ? 'bg-emerald-200 text-emerald-950' : 'bg-white/16 text-white'
                  }`}>
                    {letter}
                  </span>
                  <span className="min-w-0 flex-1 leading-relaxed">{optionText(option)}</span>
                </li>
              )
            })}
          </ul>

          <div className="rounded-[24px] border border-white/12 bg-black/18 p-4 shadow-inner">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/42">
              Why
            </p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-white/78">
              {result.explanation}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
