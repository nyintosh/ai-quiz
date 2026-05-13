"use client";

import { useState, useCallback, useRef } from "react";
import type { Provider } from "./useConfig";

export type QuizStatus =
  | "idle"
  | "processing"
  | "answered"
  | "error"
  | "no-question"
  | "invalid-key";

export interface QuizResult {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

function isQuizResult(value: unknown): value is QuizResult {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.question === "string" &&
    Array.isArray(r.options) &&
    r.options.length > 0 &&
    r.options.every((o) => typeof o === "string") &&
    typeof r.answer === "string" &&
    /^[A-D]$/.test(r.answer) &&
    typeof r.explanation === "string"
  );
}

export function useQuizAI(
  apiKey: string | null,
  model: string,
  provider: Provider,
) {
  const [result, setResult] = useState<QuizResult | null>(null);
  const [status, setStatus] = useState<QuizStatus>("idle");
  const abortRef = useRef<AbortController | null>(null);
  const apiKeyRef = useRef(apiKey);
  const modelRef = useRef(model);
  const providerRef = useRef(provider);
  apiKeyRef.current = apiKey;
  modelRef.current = model;
  providerRef.current = provider;

  const analyze = useCallback(async (base64: string) => {
    if (abortRef.current) return;
    if (!apiKeyRef.current) {
      setStatus("error");
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("processing");
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKeyRef.current,
        },
        body: JSON.stringify({
          image: base64,
          model: modelRef.current,
          provider: providerRef.current,
        }),
        signal: controller.signal,
      });

      if (abortRef.current !== controller) return;

      if (!response.ok) {
        setStatus(response.status === 401 ? "invalid-key" : "error");
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
      if (abortRef.current === controller) abortRef.current = null;
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
