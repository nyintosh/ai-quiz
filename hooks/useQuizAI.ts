"use client";

import { useState, useCallback, useRef } from "react";

export type QuizStatus =
  | "idle"
  | "processing"
  | "answered"
  | "error"
  | "no-question";

export interface QuizResult {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

function isQuizResult(value: unknown): value is QuizResult {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Record<string, unknown>;

  return (
    typeof result.question === "string" &&
    Array.isArray(result.options) &&
    result.options.length > 0 &&
    result.options.every((option) => typeof option === "string") &&
    typeof result.answer === "string" &&
    /^[A-D]$/.test(result.answer) &&
    typeof result.explanation === "string"
  );
}

export function useQuizAI() {
  const [result, setResult] = useState<QuizResult | null>(null);
  const [status, setStatus] = useState<QuizStatus>("idle");
  const abortRef = useRef<AbortController | null>(null);

  const analyze = useCallback(async (base64: string) => {
    if (abortRef.current) return;

    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("processing");
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
        signal: controller.signal,
      });

      if (abortRef.current !== controller) return;

      if (!response.ok) {
        setStatus("error");
        return;
      }

      const data = await response.json();
      if (abortRef.current !== controller) return;

      if (!data.question) {
        setStatus("no-question");
        return;
      }

      if (!isQuizResult(data)) {
        setStatus("error");
        return;
      }

      setResult(data);
      setStatus("answered");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setStatus("error");
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setResult(null);
    setStatus("idle");
  }, []);

  return { result, status, analyze, reset };
}
