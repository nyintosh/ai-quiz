import type { QuizStatus } from '@/hooks/useQuizAI'

const labels: Record<QuizStatus, string> = {
  idle: 'Scanning…',
  processing: 'Thinking…',
  answered: 'Answered',
  error: 'Error',
  'no-question': 'No question found',
}

const styles: Record<QuizStatus, string> = {
  idle: 'bg-white/10 text-slate-400',
  processing: 'bg-amber-400/20 text-amber-300',
  answered: 'bg-emerald-400/20 text-emerald-400',
  error: 'bg-red-400/20 text-red-400',
  'no-question': 'bg-white/10 text-slate-400',
}

export default function StatusChip({ status }: { status: QuizStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur-sm ${styles[status]}`}>
      {status === 'processing' && (
        <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
      )}
      {labels[status]}
    </span>
  )
}
