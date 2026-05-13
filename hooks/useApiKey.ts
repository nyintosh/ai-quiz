"use client";

import { useState, useCallback, useEffect } from "react";
import type { Provider } from "./useConfig";

const WRAPPING_KEY_STORAGE = "quizai.wrapping_key";
const KEY_PREFIX = "quizai.api_key.";

interface EncryptedPayload {
  iv: number[];
  ct: number[];
}

function isEncryptedPayload(v: unknown): v is EncryptedPayload {
  return (
    typeof v === "object" &&
    v !== null &&
    Array.isArray((v as Record<string, unknown>).iv) &&
    Array.isArray((v as Record<string, unknown>).ct)
  );
}

async function getOrCreateWrappingKey(): Promise<CryptoKey> {
  const stored = localStorage.getItem(WRAPPING_KEY_STORAGE);
  if (stored) {
    return crypto.subtle.importKey(
      "jwk",
      JSON.parse(stored) as JsonWebKey,
      { name: "AES-GCM" },
      true,
      ["encrypt", "decrypt"],
    );
  }
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
  const jwk = await crypto.subtle.exportKey("jwk", key);
  localStorage.setItem(WRAPPING_KEY_STORAGE, JSON.stringify(jwk));
  return key;
}

async function encryptValue(
  plaintext: string,
  wk: CryptoKey,
): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    wk,
    new TextEncoder().encode(plaintext),
  );
  return { iv: Array.from(iv), ct: Array.from(new Uint8Array(ciphertext)) };
}

async function decryptValue(
  payload: EncryptedPayload,
  wk: CryptoKey,
): Promise<string> {
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(payload.iv) },
    wk,
    new Uint8Array(payload.ct),
  );
  return new TextDecoder().decode(plaintext);
}

async function loadKeyForProvider(provider: Provider): Promise<string | null> {
  try {
    const stored = localStorage.getItem(`${KEY_PREFIX}${provider}`);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    if (!isEncryptedPayload(parsed)) return null;
    const wk = await getOrCreateWrappingKey();
    return await decryptValue(parsed, wk);
  } catch {
    return null;
  }
}

const PROVIDERS: Provider[] = ["anthropic", "google", "openai"];

export type ApiKeys = Record<Provider, string | null>;

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKeys>({
    anthropic: null,
    google: null,
    openai: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all(PROVIDERS.map((p) => loadKeyForProvider(p)))
      .then(([anthropic, google, openai]) => {
        setKeys({ anthropic, google, openai });
      })
      .finally(() => setIsLoading(false));
  }, []);

  const saveKey = useCallback(async (provider: Provider, key: string) => {
    const trimmed = key.trim();
    const wk = await getOrCreateWrappingKey();
    const payload = await encryptValue(trimmed, wk);
    localStorage.setItem(`${KEY_PREFIX}${provider}`, JSON.stringify(payload));
    setKeys((prev) => ({ ...prev, [provider]: trimmed }));
  }, []);

  const clearKey = useCallback((provider: Provider) => {
    localStorage.removeItem(`${KEY_PREFIX}${provider}`);
    setKeys((prev) => ({ ...prev, [provider]: null }));
  }, []);

  return { keys, isLoading, saveKey, clearKey };
}
