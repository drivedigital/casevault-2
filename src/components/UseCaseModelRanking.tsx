"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Brain,
  CheckCircle2,
  FileSearch,
  Bot,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  AlertTriangle,
  Info,
  Layers,
} from "lucide-react";
import type { UseCaseId, UseCaseRanks, RankedModelChoice, ActiveModelOption } from "@/lib/use-case-types";
import { Card } from "@/components/ui";

interface UseCaseConfig {
  id: UseCaseId;
  title: string;
  eyebrow: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
  recommendedKeywords: string[];
}

const USE_CASE_CONFIGS: UseCaseConfig[] = [
  {
    id: "legal_reasoning",
    title: "Complex Legal Reasoning",
    eyebrow: "Analysis & Synthesis",
    icon: Brain,
    description: "Statutory interpretation, multi-claim analysis, contradiction detection, and brief drafting.",
    recommendedKeywords: ["gemini-3.5-flash", "gemini-3.7-flash", "nemotron-3.5-lightning", "30b", "deep-research"],
  },
  {
    id: "document_processing",
    title: "Image & Document Processing",
    eyebrow: "Multimodal & OCR",
    icon: FileSearch,
    description: "Dense scanned filings, visual document layouts, handwritten exhibits, and table structures.",
    recommendedKeywords: ["gemini-3.5-flash", "vision", "ocr", "multimodal", "image"],
  },
  {
    id: "agentic_work",
    title: "Agentic Work & Orchestration",
    eyebrow: "Tool Use & Autonomy",
    icon: Bot,
    description: "Autonomous multi-step tool execution, citation verification, chronology reconstruction, and task dispatch.",
    recommendedKeywords: ["gemini-3.5-flash", "gemini-3.5-flash-lite", "nemotron", "flash"],
  },
];

export function UseCaseModelRanking({
  initialRanks,
  availableModels,
  defaults,
}: {
  initialRanks: UseCaseRanks;
  availableModels: ActiveModelOption[];
  defaults: UseCaseRanks;
}) {
  const [ranks, setRanks] = useState<UseCaseRanks>(initialRanks);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedToAdd, setSelectedToAdd] = useState<Record<UseCaseId, string>>({
    legal_reasoning: "",
    document_processing: "",
    agentic_work: "",
  });

  async function persistRanks(newRanks: UseCaseRanks) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/settings/use-cases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRanks),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as any).error || "Failed to save ranked model choices.");
      }
      setRanks(newRanks);
      setSaveMessage("Saved changes to workspace model routing.");
      setTimeout(() => setSaveMessage(null), 3500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving rankings.");
    } finally {
      setSaving(false);
    }
  }

  function handleMove(useCase: UseCaseId, index: number, direction: "up" | "down") {
    const list = [...ranks[useCase]];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= list.length) return;

    const [item] = list.splice(index, 1);
    list.splice(target, 0, item);

    const updated: UseCaseRanks = {
      ...ranks,
      [useCase]: list,
    };
    persistRanks(updated);
  }

  function handleRemove(useCase: UseCaseId, index: number) {
    const list = ranks[useCase].filter((_, idx) => idx !== index);
    const updated: UseCaseRanks = {
      ...ranks,
      [useCase]: list,
    };
    persistRanks(updated);
  }

  function handleAdd(useCase: UseCaseId) {
    const val = selectedToAdd[useCase];
    if (!val) return;
    const [providerId, modelId] = val.split(":::");
    if (!providerId || !modelId) return;

    // Don't add duplicate
    if (ranks[useCase].some(m => m.providerId === providerId && m.modelId === modelId)) {
      return;
    }

    const modelOption = availableModels.find(m => m.providerId === providerId && m.modelId === modelId);
    const newChoice: RankedModelChoice = {
      providerId,
      modelId,
      modelName: modelOption?.modelName || modelId,
    };

    const updated: UseCaseRanks = {
      ...ranks,
      [useCase]: [...ranks[useCase], newChoice],
    };
    setSelectedToAdd(prev => ({ ...prev, [useCase]: "" }));
    persistRanks(updated);
  }

  function handleResetDefaults() {
    if (!confirm("Reset all use cases to their recommended active model cascades?")) return;
    persistRanks(defaults);
  }

  const totalActive = availableModels.length;

  return (
    <div className="space-y-4">
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 items-center gap-1.5 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
              <Layers size={13} /> Workload Cascades
            </span>
            <h2 className="text-lg font-semibold text-slate-800">Ranked Model Routing</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Designate a priority cascade of active models for each litigation workload. CaseVault executes Choice #1 first and falls back down the rank upon rate limits or provider downtime.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            title="Reset to recommended model choices based on currently active models"
          >
            <RotateCcw size={13} /> Recommended Defaults
          </button>
        </div>
      </div>

      {/* Status banner */}
      {saveMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3.5 py-2 text-xs font-medium text-emerald-800 border border-emerald-200 transition-all">
          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-800 border border-rose-200">
          <AlertTriangle size={14} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {totalActive === 0 ? (
        <Card className="p-6 text-center border-dashed border-slate-300">
          <Info size={28} className="mx-auto mb-2 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">No active models selected yet</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            Enable a provider and toggle on active model pills in the section below (e.g. Gemini 3.5 Flash or NVIDIA Nemotron) to build ranked cascades for your use cases.
          </p>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          {USE_CASE_CONFIGS.map(config => {
            const Icon = config.icon;
            const cascade = ranks[config.id] || [];
            const candidateModels = availableModels.filter(
              opt => !cascade.some(c => c.providerId === opt.providerId && c.modelId === opt.modelId)
            );

            return (
              <Card key={config.id} className="flex flex-col justify-between overflow-hidden border border-slate-200 shadow-sm">
                <div>
                  {/* Card Header */}
                  <div className="border-b border-slate-100 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        {config.eyebrow}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-slate-200/80 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        {cascade.length} {cascade.length === 1 ? "choice" : "choices"}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200 text-indigo-600">
                        <Icon size={16} />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-800">{config.title}</h3>
                    </div>
                    <p className="mt-2 text-xs text-slate-500 leading-relaxed">{config.description}</p>
                  </div>

                  {/* Ranked List */}
                  <div className="p-4 space-y-2.5">
                    {cascade.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/60 p-3 text-center">
                        <AlertTriangle size={15} className="mx-auto mb-1 text-amber-600" />
                        <p className="text-xs font-medium text-amber-800">No models ranked</p>
                        <p className="text-[11px] text-amber-600 mt-0.5">
                          Add an active model below to establish execution priority.
                        </p>
                      </div>
                    ) : (
                      cascade.map((item, index) => {
                        const isPrimary = index === 0;
                        const isLast = index === cascade.length - 1;
                        const modelOpt = availableModels.find(
                          m => m.providerId === item.providerId && m.modelId === item.modelId
                        );

                        return (
                          <div
                            key={`${item.providerId}:::${item.modelId}`}
                            className={`group relative flex items-center justify-between gap-2 rounded-xl border p-2.5 transition ${
                              isPrimary
                                ? "border-emerald-200 bg-emerald-50/40 shadow-xs"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            {/* Rank Badge & Details */}
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                                  isPrimary
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                #{index + 1}
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-xs font-semibold text-slate-800 truncate" title={item.modelId}>
                                    {item.modelName || item.modelId}
                                  </p>
                                  {isPrimary && (
                                    <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-800">
                                      Primary
                                    </span>
                                  )}
                                  {!isPrimary && (
                                    <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-medium text-slate-600">
                                      Fallback
                                    </span>
                                  )}
                                </div>
                                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                                  <span className="capitalize font-medium text-slate-600">
                                    {modelOpt?.providerName || item.providerId}
                                  </span>
                                  {modelOpt?.contextWindow && (
                                    <>
                                      <span>•</span>
                                      <span>{(modelOpt.contextWindow / 1000).toFixed(0)}k ctx</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Order Adjust / Delete */}
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                disabled={index === 0 || saving}
                                onClick={() => handleMove(config.id, index, "up")}
                                title="Move up in rank"
                                aria-label={`Move ${item.modelId} up`}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20"
                              >
                                <ArrowUp size={14} />
                              </button>
                              <button
                                type="button"
                                disabled={isLast || saving}
                                onClick={() => handleMove(config.id, index, "down")}
                                title="Move down in rank"
                                aria-label={`Move ${item.modelId} down`}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20"
                              >
                                <ArrowDown size={14} />
                              </button>
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => handleRemove(config.id, index)}
                                title="Remove from this use case"
                                aria-label={`Remove ${item.modelId}`}
                                className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-20"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Footer: Add Model Selector */}
                <div className="border-t border-slate-100 bg-slate-50/50 p-3">
                  <div className="flex items-center gap-1.5">
                    <select
                      value={selectedToAdd[config.id]}
                      onChange={e =>
                        setSelectedToAdd(prev => ({ ...prev, [config.id]: e.target.value }))
                      }
                      disabled={saving || candidateModels.length === 0}
                      aria-label={`Add model to ${config.title}`}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">
                        {candidateModels.length === 0
                          ? "All active models added"
                          : `+ Add active model (${candidateModels.length} available)...`}
                      </option>
                      {candidateModels.map(opt => (
                        <option
                          key={`${opt.providerId}:::${opt.modelId}`}
                          value={`${opt.providerId}:::${opt.modelId}`}
                        >
                          {opt.providerName}: {opt.modelName || opt.modelId}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleAdd(config.id)}
                      disabled={saving || !selectedToAdd[config.id]}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-xs transition hover:bg-indigo-700 disabled:opacity-40"
                    >
                      <Plus size={13} /> Add
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
