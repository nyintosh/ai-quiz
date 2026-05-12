import type { QuizStatus } from '@/hooks/useQuizAI'

const labels: Record<QuizStatus, string> = {
  idle: 'Scanning…',
  processing: 'Thinking…',
  answered: 'Answered',
  error: 'Error',
  'no-question': 'No question found',
}

const styles: Record<QuizStatus, string> = {
  idle: 'border-white/10 bg-white/10 text-slate-300',
  processing: 'border-amber-300/20 bg-amber-300/16 text-amber-200',
  answered: 'border-emerald-300/25 bg-emerald-300/16 text-emerald-200',
  error: 'border-red-300/25 bg-red-300/16 text-red-200',
  'no-question': 'border-sky-300/20 bg-sky-300/12 text-sky-100',
}

export default function StatusChip({ status }: { status: QuizStatus }) {
  return (
    <span className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide shadow-sm backdrop-blur-md ${styles[status]}`}>
      {status === 'processing' && (
        <span className="size-1.5 rounded-full bg-amber-300 animate-pulse" />
      )}
      {labels[status]}
    </span>
  )
}
