"use client";

import { useState } from "react";
import CameraView from "@/components/CameraView";
import AnswerPanel from "@/components/AnswerPanel";
import SettingsPanel from "@/components/SettingsPanel";
import { useQuizAI } from "@/hooks/useQuizAI";
import { useApiKeys } from "@/hooks/useApiKey";
import { useConfig, QUALITY_PARAMS } from "@/hooks/useConfig";

export default function Home() {
  const { keys, isLoading, saveKey, clearKey } = useApiKeys();
  const { config, updateConfig } = useConfig();
  const [showSettings, setShowSettings] = useState(false);
  const [autoScan, setAutoScan] = useState(false);

  const activeKey = keys[config.provider];
  const { result, status, analyze, reset } = useQuizAI(
    activeKey,
    config.model,
    config.provider,
  );

  if (isLoading) {
    return (
      <main
        className="fixed inset-x-0 top-0 overflow-hidden bg-[#07080b]"
        style={{ bottom: "calc(-1 * env(safe-area-inset-bottom))" }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-9 animate-spin rounded-full border-2 border-white/15 border-t-white" />
        </div>
      </main>
    );
  }

  // Show setup screen when the active provider has no key configured
  if (!activeKey) {
    return (
      <main
        className="fixed inset-x-0 top-0 overflow-hidden bg-[#07080b]"
        style={{ bottom: "calc(-1 * env(safe-area-inset-bottom))" }}
      >
        <SettingsPanel
          hasExistingKey={false}
          keys={keys}
          config={config}
          onSaveKey={saveKey}
          onClearKey={clearKey}
          onUpdateConfig={updateConfig}
        />
      </main>
    );
  }

  return (
    <main
      className="fixed inset-x-0 top-0 overflow-hidden"
      style={{ bottom: "calc(-1 * env(safe-area-inset-bottom))" }}
    >
      <CameraView
        onFrame={analyze}
        status={status}
        onDismiss={reset}
        onSettings={() => setShowSettings(true)}
        captureConfig={QUALITY_PARAMS[config.imageQuality]}
        autoScan={autoScan}
        onAutoScanChange={setAutoScan}
      />
      <AnswerPanel
        result={result}
        status={status}
        autoScan={autoScan}
        onDismiss={reset}
      />

      {showSettings && (
        <SettingsPanel
          hasExistingKey
          keys={keys}
          config={config}
          onSaveKey={saveKey}
          onClearKey={(provider) => {
            clearKey(provider);
            // If the cleared provider was the active one, reset quiz state
            if (provider === config.provider) reset();
          }}
          onUpdateConfig={updateConfig}
          onDismiss={() => setShowSettings(false)}
        />
      )}
    </main>
  );
}
