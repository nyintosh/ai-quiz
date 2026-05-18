"use client";

import type { QuizResult, QuizStatus } from "@/hooks/useQuizAI";

interface Props {
  result: QuizResult | null;
  status: QuizStatus;
  autoScan: boolean;
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

export default function AnswerPanel({
  result,
  status,
  autoScan,
  onDismiss,
}: Props) {
  const show = visible(status, result);

  return (
    <section
      aria-label="Answer"
      className={`glass-panel fixed left-4 right-4 bottom-[max(16px,env(safe-area-inset-bottom))] z-30 flex max-h-[64dvh] flex-col overflow-hidden rounded-[28px] text-white touch-pan-y lg:inset-y-8 lg:left-auto lg:right-8 lg:bottom-8 lg:max-h-none lg:w-84 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${show ? "translate-y-0 opacity-100 lg:translate-x-0" : "translate-y-[calc(100%+24px)] opacity-0 lg:translate-x-[calc(100%+16px)] lg:translate-y-0"}`}
    >
      {/* Header — sticky */}
      <div className="shrink-0 -mb-px px-5 pb-3 pt-4 bg-[linear-gradient(to_bottom,rgba(20,22,30,.92),rgba(20,22,30,.72)_72%,transparent)] backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          {/* State indicator */}
          {result && (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-400/22 ring-1 ring-emerald-400/30 text-[14px] font-black text-emerald-300">
              {result.answer}
            </span>
          )}
          {status === "processing" && (
            <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
          )}

          <h1 className="min-w-0 flex-1 truncate text-[17px] font-bold leading-tight tracking-normal">
            {result
              ? "Answer ready"
              : status === "processing"
                ? "Reading…"
                : "Try another angle"}
          </h1>

          {status !== "processing" && (
            <button
              onClick={onDismiss}
              aria-label="Close"
              className="glass-control flex size-8 shrink-0 items-center justify-center rounded-full"
            >
              <svg
                className="size-3.5 text-white/78"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="overflow-y-auto overscroll-contain px-5 pt-3">
        {status === "processing" && (
          <div className="sheet-rise space-y-2.5 pb-5">
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
          <p className="sheet-rise mb-4 rounded-2xl border border-red-200/20 bg-red-400/16 p-3 text-[13px] font-medium leading-relaxed text-red-50">
            Could not read it. Move the camera and it will clear automatically.
          </p>
        )}

        {status === "no-question" && !result && (
          <p className="sheet-rise mb-4 rounded-2xl border border-white/16 bg-white/12 p-3 text-[13px] font-medium leading-relaxed text-white/78">
            No readable multiple-choice question was found.
          </p>
        )}

        {status === "invalid-key" && !result && (
          <p className="sheet-rise mb-4 rounded-2xl border border-amber-200/20 bg-amber-400/16 p-3 text-[13px] font-medium leading-relaxed text-amber-50">
            API key rejected. Tap the lock icon to update your key.
          </p>
        )}

        {result && (
          <div className="sheet-rise space-y-3 pb-5">
            <p className="text-[14px] font-medium leading-normal text-white/80">
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
                      className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                        isCorrect
                          ? "bg-emerald-200 text-emerald-950"
                          : "bg-white/16 text-white"
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="min-w-0 flex-1 leading-snug">
                      {optionText(option)}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/38">
                Why
              </p>
              <p className="mt-1 text-[12px] font-medium leading-relaxed text-white/65">
                {result.explanation}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sticky footer — Scan Next (manual mode only) */}
      {status !== "processing" && !autoScan && (
        <div className="shrink-0 px-5 pb-5 pt-2.5">
          <button
            onClick={onDismiss}
            className="h-12 w-full rounded-full bg-white text-[14px] font-semibold text-black shadow-[0_12px_30px_rgba(0,0,0,.34),inset_0_2px_0_rgba(255,255,255,.95),inset_0_-4px_8px_rgba(0,0,0,.16)] transition-transform duration-150 active:scale-[.97]"
          >
            Scan next
          </button>
        </div>
      )}
    </section>
  );
}
