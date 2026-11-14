"use client";

import { useState, useCallback } from "react";

const CONFIG_STORAGE = "quizai.config";

export type Provider = "anthropic" | "google" | "openai";
export type ImageQuality = "efficient" | "balanced" | "high";

export interface ModelOption {
  id: string;
  label: string;
  recommended: boolean;
  note: string;
}

export const PROVIDER_MODELS: Record<Provider, ModelOption[]> = {
  anthropic: [
    {
      id: "claude-haiku-5-5",
      label: "Claude Haiku 5.5",
      recommended: true,
      note: "Best for this app — fast and low cost",
    },
    {
      id: "claude-sonnet-5-5",
      label: "Claude Sonnet 5.5",
      recommended: false,
      note: "Higher accuracy, moderately slower",
    },
    {
      id: "claude-opus-5-5",
      label: "Claude Opus 5.5",
      recommended: false,
      note: "Most accurate — slower and expensive",
    },
  ],
  google: [
    {
      id: "gemini-3.5-flash-lite",
      label: "Gemini 3.5 Flash-Lite",
      recommended: true,
      note: "Best for this app — fast and low cost",
    },
    {
      id: "gemini-3.8-flash",
      label: "Gemini 3.8 Flash",
      recommended: false,
      note: "Higher accuracy, can be busy at peak times",
    },
  ],
  openai: [
    {
      id: "gpt-4o-mini",
      label: "GPT-4o mini",
      recommended: true,
      note: "Best for this app — fast and affordable vision",
    },
    {
      id: "gpt-4o",
      label: "GPT-4o",
      recommended: false,
      note: "Higher accuracy, higher cost",
    },
  ],
};

export interface AppConfig {
  provider: Provider;
  model: string;
  imageQuality: ImageQuality;
}

export const QUALITY_PARAMS: Record<
  ImageQuality,
  { maxW: number; jpegQuality: number }
> = {
  efficient: { maxW: 640, jpegQuality: 0.65 },
  balanced: { maxW: 768, jpegQuality: 0.72 },
  high: { maxW: 960, jpegQuality: 0.82 },
};

const DEFAULTS: AppConfig = {
  provider: "anthropic",
  model: "claude-haiku-5-5",
  imageQuality: "balanced",
};

const VALID_PROVIDERS = new Set<string>(["anthropic", "google", "openai"]);
const VALID_QUALITY = new Set<string>(["efficient", "balanced", "high"]);

function loadConfig(): AppConfig {
  try {
    const stored = localStorage.getItem(CONFIG_STORAGE);
    if (!stored) return DEFAULTS;
    const parsed = JSON.parse(stored) as Partial<AppConfig>;

    const provider = VALID_PROVIDERS.has(parsed.provider ?? "")
      ? (parsed.provider as Provider)
      : DEFAULTS.provider;

    const models = PROVIDER_MODELS[provider];
    const model =
      parsed.model && models.some((m) => m.id === parsed.model)
        ? parsed.model
        : (models.find((m) => m.recommended)?.id ?? models[0].id);

    const imageQuality = VALID_QUALITY.has(parsed.imageQuality ?? "")
      ? (parsed.imageQuality as ImageQuality)
      : DEFAULTS.imageQuality;

    return { provider, model, imageQuality };
  } catch {
    return DEFAULTS;
  }
}

export function useConfig() {
  const [config, setConfig] = useState<AppConfig>(() => {
    if (typeof window === "undefined") return DEFAULTS;
    return loadConfig();
  });

  const updateConfig = useCallback((patch: Partial<AppConfig>) => {
    setConfig((prev) => {
      let next = { ...prev, ...patch };
      // Reset model to recommended when provider changes
      if (patch.provider && patch.provider !== prev.provider) {
        const models = PROVIDER_MODELS[patch.provider];
        next.model = models.find((m) => m.recommended)?.id ?? models[0].id;
      }
      localStorage.setItem(CONFIG_STORAGE, JSON.stringify(next));
      return next;
    });
  }, []);

  return { config, updateConfig };
}
