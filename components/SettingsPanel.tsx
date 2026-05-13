"use client";

import { useState } from "react";
import type { AppConfig, Provider, ImageQuality } from "@/hooks/useConfig";
import { PROVIDER_MODELS, QUALITY_PARAMS } from "@/hooks/useConfig";
import type { ApiKeys } from "@/hooks/useApiKey";

interface Props {
  // first-run: hasExistingKey=false; settings overlay: hasExistingKey=true
  hasExistingKey: boolean;
  keys: ApiKeys;
  config: AppConfig;
  onSaveKey: (provider: Provider, key: string) => Promise<void>;
  onClearKey: (provider: Provider) => void;
  onUpdateConfig: (patch: Partial<AppConfig>) => void;
  onDismiss?: () => void;
}

const PROVIDERS: {
  id: Provider;
  label: string;
  color: string;
  keyHint: string;
  keyUrl: string;
}[] = [
  {
    id: "anthropic",
    label: "Anthropic",
    color: "text-orange-300",
    keyHint: "sk-ant-api03-…",
    keyUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "google",
    label: "Google",
    color: "text-blue-300",
    keyHint: "AIzaSy…",
    keyUrl: "https://aistudio.google.com/app/apikey",
  },
  {
    id: "openai",
    label: "OpenAI",
    color: "text-emerald-300",
    keyHint: "sk-proj-…",
    keyUrl: "https://platform.openai.com/api-keys",
  },
];

const QUALITIES: { id: ImageQuality; label: string; desc: string }[] = [
  { id: "efficient", label: "Efficient", desc: "~300 tokens · fastest" },
  { id: "balanced", label: "Balanced", desc: "~480 tokens · default" },
  { id: "high", label: "High", desc: "~720 tokens · most readable" },
];

function maskKey(key: string): string {
  return key.slice(0, 10) + "••••••••";
}

function looksLikeKey(v: string, provider: Provider): boolean {
  const t = v.trim();
  if (t.length < 16) return false;
  if (provider === "anthropic") return t.startsWith("sk-ant-");
  if (provider === "google") return t.startsWith("AIza");
  return t.startsWith("sk-");
}

export default function SettingsPanel({
  hasExistingKey,
  keys,
  config,
  onSaveKey,
  onClearKey,
  onUpdateConfig,
  onDismiss,
}: Props) {
  // In first-run: activeProvider is the provider being set up (defaults to config.provider)
  // In settings: activeProvider is the provider tab currently shown
  const [activeProvider, setActiveProvider] = useState<Provider>(
    config.provider,
  );
  const [inputValue, setInputValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  const providerMeta = PROVIDERS.find((p) => p.id === activeProvider)!;
  const currentKey = keys[activeProvider];

  const handleSaveKey = async () => {
    if (!looksLikeKey(inputValue, activeProvider)) {
      setKeyError(`Expected format: ${providerMeta.keyHint}`);
      return;
    }
    setKeyError(null);
    setIsSaving(true);
    try {
      await onSaveKey(activeProvider, inputValue.trim());
      // On first-run, also switch config to this provider
      if (!hasExistingKey) {
        onUpdateConfig({ provider: activeProvider });
      }
      setInputValue("");
    } finally {
      setIsSaving(false);
    }
  };

  const handleProviderTab = (p: Provider) => {
    setActiveProvider(p);
    setInputValue("");
    setKeyError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-sm px-4 pb-[max(16px,env(safe-area-inset-bottom))] sm:items-center sm:px-0 sm:pb-0">
      <div className="glass-panel sheet-rise w-full sm:max-w-sm rounded-[28px] flex flex-col max-h-[92dvh] overflow-hidden">
        {/* Sticky header */}
        <div className="shrink-0 -mb-px px-6 pt-5 pb-4 bg-[linear-gradient(to_bottom,rgba(20,22,30,.92),rgba(20,22,30,.72)_72%,transparent)] backdrop-blur-xl">
          {hasExistingKey ? (
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-black">Settings</h2>
              <button
                onClick={onDismiss}
                aria-label="Close settings"
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
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-white/12">
                <svg
                  className="size-7 text-white/80"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h2 className="text-[18px] font-black">
                Connect your AI provider
              </h2>
              <p className="text-[12px] leading-relaxed text-white/55 max-w-65">
                Your key is encrypted on this device only and sent exclusively
                to the chosen provider.
              </p>
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 pt-5 pb-7 flex flex-col gap-5">
          {/* Provider tabs */}
          {(() => {
            const activeIdx = PROVIDERS.findIndex(
              (p) => p.id === activeProvider,
            );
            const n = PROVIDERS.length;
            return (
              <div className="glass-control glass-segment relative flex rounded-full p-1">
                <div
                  className="absolute top-1 bottom-1 rounded-full bg-white shadow-[0_6px_16px_rgba(0,0,0,.22)]"
                  style={{
                    width: `calc((100% - 8px) / ${n})`,
                    left: `calc(4px + ${activeIdx} * (100% - 8px) / ${n})`,
                    transition: "left 220ms cubic-bezier(0.22,1,0.36,1)",
                  }}
                />
                {PROVIDERS.map((p) => {
                  const active = activeProvider === p.id;
                  const hasKey = keys[p.id] !== null;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleProviderTab(p.id)}
                      className={`relative z-10 flex-1 h-9 rounded-full text-[12px] font-bold transition-colors duration-200 ${active ? "text-black" : "text-white/65"}`}
                    >
                      {p.label}
                      {hasKey && (
                        <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-emerald-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })()}

          {/* API Key for active provider */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/42">
                API Key
              </p>
              {currentKey && (
                <button
                  onClick={() => onClearKey(activeProvider)}
                  className="text-[11px] font-semibold text-red-400 transition-opacity duration-150 active:opacity-70"
                >
                  Remove
                </button>
              )}
            </div>

            {currentKey && (
              <p className="text-[12px] font-mono text-white/50 bg-white/6 rounded-xl px-3 py-2">
                {maskKey(currentKey)}
              </p>
            )}

            <input
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setKeyError(null);
              }}
              placeholder={
                currentKey ? "Enter new key to replace" : providerMeta.keyHint
              }
              type="text"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="w-full rounded-2xl border border-white/22 bg-white/[0.07] px-4 py-2.5 font-mono text-[16px] text-white placeholder:text-white/28 outline-none focus:border-white/40 focus:bg-white/10 transition-colors"
            />

            {keyError && (
              <p className="rounded-xl border border-red-300/20 bg-red-400/14 px-3 py-2 text-[11px] font-medium text-red-200">
                {keyError}
              </p>
            )}

            <button
              onClick={handleSaveKey}
              disabled={isSaving || !inputValue.trim()}
              className="flex h-12 w-full items-center justify-center rounded-full bg-white text-[14px] font-semibold text-black shadow-[0_12px_30px_rgba(0,0,0,.34),inset_0_2px_0_rgba(255,255,255,.95),inset_0_-4px_8px_rgba(0,0,0,.16)] active:scale-[.97] disabled:opacity-45 transition-[transform,opacity] duration-150"
            >
              {isSaving ? (
                <span className="size-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
              ) : currentKey ? (
                "Update key"
              ) : (
                "Save key"
              )}
            </button>

            <a
              href={providerMeta.keyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-center text-[11px] underline underline-offset-2 transition-colors ${providerMeta.color} opacity-60 hover:opacity-90`}
            >
              Get a {providerMeta.label} key →
            </a>
          </div>

          {/* Model — only when the active tab's provider has a key */}
          {currentKey && (
            <div className="flex flex-col gap-2.5">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/42">
                Model
              </p>
              <div className="flex flex-col gap-1.5">
                {PROVIDER_MODELS[activeProvider].map((m) => {
                  const active =
                    config.provider === activeProvider && config.model === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() =>
                        onUpdateConfig({
                          provider: activeProvider,
                          model: m.id,
                        })
                      }
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors active:scale-[.97] ${
                        active
                          ? "border-white/28 bg-white/14"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-white">
                            {m.label}
                          </span>
                          {m.recommended && (
                            <span className="rounded-full bg-emerald-400/22 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-white/50">
                          {m.note}
                        </p>
                      </div>
                      {active && (
                        <svg
                          className="size-4 shrink-0 text-white"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Image quality — only when the active tab's provider has a key */}
          {currentKey && (
            <div className="flex flex-col gap-2.5">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/42">
                Image quality sent to API
              </p>
              {(() => {
                const activeIdx = QUALITIES.findIndex(
                  (q) => q.id === config.imageQuality,
                );
                const n = QUALITIES.length;
                return (
                  <div className="glass-control glass-segment relative flex rounded-full p-1">
                    <div
                      className="absolute top-1 bottom-1 rounded-full bg-white shadow-[0_6px_16px_rgba(0,0,0,.22)]"
                      style={{
                        width: `calc((100% - 8px) / ${n})`,
                        left: `calc(4px + ${activeIdx} * (100% - 8px) / ${n})`,
                        transition: "left 220ms cubic-bezier(0.22,1,0.36,1)",
                      }}
                    />
                    {QUALITIES.map((q) => {
                      const active = config.imageQuality === q.id;
                      return (
                        <button
                          key={q.id}
                          onClick={() => onUpdateConfig({ imageQuality: q.id })}
                          className={`relative z-10 flex-1 h-9 rounded-full text-[12px] font-bold transition-colors duration-200 ${active ? "text-black" : "text-white/65"}`}
                        >
                          {q.label}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
              <p className="text-[11px] text-white/50">
                {QUALITIES.find((q) => q.id === config.imageQuality)?.desc}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
