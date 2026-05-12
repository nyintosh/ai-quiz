"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCamera } from "@/hooks/useCamera";
import { useFrameCapture } from "@/hooks/useFrameCapture";
import type { QuizStatus } from "@/hooks/useQuizAI";

interface Props {
  onFrame: (base64: string) => void;
  status: QuizStatus;
  onDismiss: () => void;
}

const statusText: Record<QuizStatus, string> = {
  idle: "Frame a question",
  processing: "Reading",
  answered: "Answer ready",
  error: "Move closer",
  "no-question": "No question",
};

export default function CameraView({ onFrame, status, onDismiss }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [autoScan, setAutoScan] = useState(false);
  const { videoRef, isReady, error, startCamera } = useCamera();

  const dismissTransientResult = useCallback(() => {
    if (status === "error" || status === "no-question") onDismiss();
  }, [onDismiss, status]);

  const analyzeFrame = useCallback(
    (base64: string) => {
      if (status === "error" || status === "no-question") onDismiss();
      onFrame(base64);
    },
    [onDismiss, onFrame, status],
  );

  const { start, stop, captureNow } = useFrameCapture(
    videoRef,
    canvasRef,
    analyzeFrame,
    dismissTransientResult,
  );

  useEffect(() => {
    startCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const shouldAutoScan =
      isReady && autoScan && status !== "processing" && status !== "answered";

    if (shouldAutoScan) {
      start();
    } else {
      stop();
    }

    return stop;
  }, [autoScan, isReady, start, status, stop]);

  const scanNow = () => {
    dismissTransientResult();
    captureNow();
  };

  const canScan = isReady && status !== "processing";

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#07080b] text-white">
      {error && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 px-8 text-center">
          <div className="glass-panel flex max-w-sm flex-col items-center gap-4 rounded-[28px] px-6 py-7">
            <div className="flex size-14 items-center justify-center rounded-full bg-white/15 shadow-inner">
              <svg
                className="size-7 text-white/85"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            </div>
            <p className="text-sm font-medium leading-relaxed text-white/78">
              {error}
            </p>
            <button
              onClick={() => startCamera()}
              className="h-11 rounded-full bg-white px-6 text-sm font-bold text-black shadow-lg active:scale-[.98]"
            >
              Retry camera
            </button>
          </div>
        </div>
      )}

      {!isReady && !error && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 text-white/70">
          <div className="size-9 animate-spin rounded-full border-2 border-white/15 border-t-white" />
          <p className="text-sm font-semibold">Starting camera</p>
        </div>
      )}

      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        className={`h-full w-full object-cover transition-opacity duration-300 ${isReady ? "opacity-100" : "opacity-0"}`}
        autoPlay
        playsInline
        muted
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_0,transparent_35%,rgba(0,0,0,.28)_64%,rgba(0,0,0,.76)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,.58),transparent_22%,transparent_62%,rgba(0,0,0,.76))]" />

      {isReady && (
        <>
          <p className="absolute inset-x-6 top-[max(18px,env(safe-area-inset-top))] text-center text-[13px] font-semibold tracking-normal text-white/78 drop-shadow transition-opacity duration-200 lg:right-[392px]">
            {statusText[status]}
          </p>

          <div className="pointer-events-none absolute inset-x-5 top-[13dvh] h-[43dvh] rounded-[26px] border border-white/26 bg-white/[0.012] shadow-[inset_0_1px_0_rgba(255,255,255,.2),inset_0_-1px_0_rgba(0,0,0,.28),0_0_0_999px_rgba(0,0,0,.12)] lg:left-8 lg:right-[392px] lg:top-[17dvh] lg:h-[58dvh]" />

          <div className="control-rise absolute inset-x-0 top-[calc(56dvh-60px)] z-10 flex justify-center px-5 lg:left-8 lg:right-[392px] lg:top-[calc(75dvh-60px)]">
            <div className="glass-control glass-segment flex rounded-full p-0.5">
              <button
                onClick={() => setAutoScan(false)}
                className={`h-8 rounded-full px-4 text-[12px] font-semibold transition-all duration-200 ${!autoScan ? "bg-white text-black shadow-[0_6px_14px_rgba(0,0,0,.22)]" : "text-white/70"}`}
              >
                Manual
              </button>
              <button
                onClick={() => setAutoScan(true)}
                className={`h-8 rounded-full px-4 text-[12px] font-semibold transition-all duration-200 ${autoScan ? "bg-white text-black shadow-[0_6px_14px_rgba(0,0,0,.22)]" : "text-white/70"}`}
              >
                Auto
              </button>
            </div>
          </div>

          <div className="absolute inset-x-0 top-[calc(56dvh+18px)] z-10 flex justify-center px-5 lg:left-8 lg:right-[392px] lg:top-[calc(75dvh+18px)]">
            {!autoScan && (
              <button
                onClick={scanNow}
                disabled={!canScan}
                className="control-rise shutter-button flex size-14 items-center justify-center rounded-full active:scale-[.97] disabled:opacity-60"
                aria-label="Scan question"
              >
                <span className="size-9 rounded-full border border-black/20 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,.9),rgba(255,255,255,.2)_48%,rgba(0,0,0,.12)_100%)] shadow-[inset_0_2px_6px_rgba(255,255,255,.8),inset_0_-5px_9px_rgba(0,0,0,.18)]" />
              </button>
            )}
          </div>
        </>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
