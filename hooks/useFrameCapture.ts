"use client";

import { useRef, useCallback } from "react";

const INTERVAL_MS = 350;
const DIFF_THRESHOLD = 12;
const SETTLE_MS = 900;

const DEFAULT_CAPTURE_CONFIG = { maxW: 768, jpegQuality: 0.72 };

function sampleDiff(a: Uint8ClampedArray, b: Uint8ClampedArray): number {
  let total = 0;
  let count = 0;
  for (let i = 0; i < a.length; i += 64) {
    total += Math.abs(a[i] - b[i]);
    total += Math.abs(a[i + 1] - b[i + 1]);
    total += Math.abs(a[i + 2] - b[i + 2]);
    count += 3;
  }
  return count > 0 ? total / count : 0;
}

export function useFrameCapture(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  onSignificantChange: (base64: string) => void,
  onMotion?: () => void,
  captureConfig?: { maxW: number; jpegQuality: number },
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousPixels = useRef<Uint8ClampedArray | null>(null);
  const pendingFrame = useRef<string | null>(null);
  const callbackRef = useRef(onSignificantChange);
  const motionCallbackRef = useRef(onMotion);
  const captureConfigRef = useRef(captureConfig ?? DEFAULT_CAPTURE_CONFIG);
  callbackRef.current = onSignificantChange;
  motionCallbackRef.current = onMotion;
  captureConfigRef.current = captureConfig ?? DEFAULT_CAPTURE_CONFIG;

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;

    const { maxW, jpegQuality } = captureConfigRef.current;
    const scale = Math.min(1, maxW / video.videoWidth);
    const w = Math.round(video.videoWidth * scale);
    const h = Math.round(video.videoHeight * scale);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, w, h);

    return {
      dataUrl: canvas.toDataURL("image/jpeg", jpegQuality),
      pixels: ctx.getImageData(0, 0, w, h).data,
    };
  }, [videoRef, canvasRef]);

  const clearPending = useCallback(() => {
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    pendingFrame.current = null;
  }, []);

  const queueSettledFrame = useCallback((dataUrl: string) => {
    pendingFrame.current = dataUrl;
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = setTimeout(() => {
      const latest = pendingFrame.current;
      pendingFrame.current = null;
      settleTimerRef.current = null;
      if (latest) callbackRef.current(latest);
    }, SETTLE_MS);
  }, []);

  const captureNow = useCallback(() => {
    const frame = captureFrame();
    if (!frame) return;
    clearPending();
    previousPixels.current = new Uint8ClampedArray(frame.pixels);
    callbackRef.current(frame.dataUrl);
  }, [captureFrame, clearPending]);

  const tick = useCallback(() => {
    const frame = captureFrame();
    if (!frame) return;

    const current = frame.pixels;
    if (
      previousPixels.current &&
      previousPixels.current.length === current.length
    ) {
      const diff = sampleDiff(current, previousPixels.current);
      if (diff > DIFF_THRESHOLD) {
        previousPixels.current = new Uint8ClampedArray(current);
        motionCallbackRef.current?.();
        queueSettledFrame(frame.dataUrl);
      }
    } else {
      previousPixels.current = new Uint8ClampedArray(current);
    }
  }, [captureFrame, queueSettledFrame]);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    clearPending();
    previousPixels.current = null;
    intervalRef.current = setInterval(tick, INTERVAL_MS);
  }, [clearPending, tick]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    clearPending();
    previousPixels.current = null;
  }, [clearPending]);

  return { start, stop, captureNow };
}
