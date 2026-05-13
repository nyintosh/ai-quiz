"use client";

import type { QuizResult, QuizStatus } from "@/hooks/useQuizAI";

interface Props {
  result: QuizResult | null;
  status: QuizStatus;
  onDismiss: () => void;
}

const visible = (status: QuizStatus, result: QuizResult | null) =>
  result !== null ||
  status === "processing" ||
  status === "error" ||
  status === "no-question" ||
  status === "invalid-key";

function optionText(option: string) {
  return option.replace(/^[A-Z][.)]\s*/i, "").trim();
}

export default function AnswerPanel({ result, status, onDismiss }: Props) {
  const show = visible(status, result);

  return (
    <section
      aria-label="Answer"
      className={`glass-panel fixed inset-x-0 bottom-0 z-30 max-h-[64dvh] overflow-y-auto overscroll-contain rounded-t-[20px] px-4 pb-[calc(78px+env(safe-area-inset-bottom))] text-white touch-pan-y lg:inset-y-8 lg:left-auto lg:right-8 lg:max-h-none lg:w-84 lg:rounded-[20px] lg:px-4 lg:pb-20 ${show ? "translate-y-0 opacity-100 lg:translate-x-0" : "translate-y-[calc(100%+16px)] opacity-0 lg:translate-x-[calc(100%+16px)] lg:translate-y-0"}`}
    >
      <div className="sticky top-0 z-10 -mx-4 mb-3 bg-[linear-gradient(to_bottom,rgba(20,22,30,.86),rgba(20,22,30,.54)_72%,transparent)] px-4 pb-3 pt-2 backdrop-blur-xl">
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-white/26" />
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42">
            Quiz AI
          </p>
          <h1 className="mt-1 truncate text-[17px] font-semibold leading-tight tracking-normal transition-opacity duration-200">
            {result
              ? `Answer ${result.answer}`
              : status === "processing"
                ? "Reading"
                : "Try another angle"}
          </h1>
        </div>
      </div>

      {status === "processing" && (
        <div className="sheet-rise space-y-2.5">
          <div className="h-4 w-11/12 animate-pulse rounded-full bg-white/16" />
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-white/12" />
          <div className="space-y-1.5 pt-1">
            {[1, 0.9, 0.82, 0.74].map((width, index) => (
              <div
                key={index}
                className="h-10 animate-pulse rounded-xl bg-white/10"
                style={{ width: `${width * 100}%` }}
              />
            ))}
          </div>
        </div>
      )}

      {status === "error" && !result && (
        <p className="sheet-rise rounded-2xl border border-red-200/20 bg-red-400/16 p-3 text-[13px] font-medium leading-relaxed text-red-50">
          Could not read it. Move the camera and it will clear automatically.
        </p>
      )}

      {status === "no-question" && !result && (
        <p className="sheet-rise rounded-2xl border border-white/16 bg-white/12 p-3 text-[13px] font-medium leading-relaxed text-white/78">
          No readable multiple-choice question was found.
        </p>
      )}

      {status === "invalid-key" && !result && (
        <p className="sheet-rise rounded-2xl border border-amber-200/20 bg-amber-400/16 p-3 text-[13px] font-medium leading-relaxed text-amber-50">
          API key rejected. Tap the lock icon to update your key.
        </p>
      )}

      {result && (
        <div className="sheet-rise space-y-3.5">
          <p className="text-[15px] font-semibold leading-snug text-white">
            {result.question}
          </p>

          <ul className="space-y-1.5">
            {result.options.map((option) => {
              const letter = option.charAt(0).toUpperCase();
              const isCorrect = letter === result.answer;
              return (
                <li
                  key={option}
                  className={`answer-option flex min-h-11 items-center gap-2.5 rounded-2xl border px-3 py-2 text-[13px] font-semibold ${
                    isCorrect
                      ? "border-emerald-200/35 bg-emerald-400/28 text-white"
                      : "border-white/12 bg-white/10 text-white/78"
                  }`}
                >
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold transition-colors duration-200 ${
                      isCorrect
                        ? "bg-emerald-200 text-emerald-950"
                        : "bg-white/16 text-white"
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="min-w-0 flex-1 leading-relaxed">
                    {optionText(option)}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="rounded-2xl border border-white/12 bg-black/18 p-3 shadow-inner transition-colors duration-200">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42">
              Why
            </p>
            <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-white/78">
              {result.explanation}
            </p>
          </div>
        </div>
      )}

      {status !== "processing" && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 py-[max(16px,env(safe-area-inset-bottom))] lg:absolute">
          <button
            onClick={onDismiss}
            className="pointer-events-auto h-12 w-full rounded-full bg-white text-[14px] font-semibold text-black shadow-[0_12px_30px_rgba(0,0,0,.34),inset_0_2px_0_rgba(255,255,255,.95),inset_0_-4px_8px_rgba(0,0,0,.16)] transition-transform duration-150 active:scale-[.99]"
          >
            Scan next
          </button>
        </div>
      )}
    </section>
  );
}
