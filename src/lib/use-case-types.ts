import { z } from "zod";

export const USE_CASES = [
  {
    id: "legal_reasoning",
    title: "Complex Legal Reasoning",
    eyebrow: "Analysis & Synthesis",
    description: "Statutory interpretation, multi-claim analysis, contradiction detection, and brief drafting.",
  },
  {
    id: "document_processing",
    title: "Image & Document Processing",
    eyebrow: "Multimodal & OCR",
    description: "Dense scanned filings, visual document layouts, handwritten exhibits, and table structures.",
  },
  {
    id: "agentic_work",
    title: "Agentic Work & Orchestration",
    eyebrow: "Tool Use & Autonomy",
    description: "Autonomous multi-step tool execution, citation verification, chronology reconstruction, and task dispatch.",
  },
] as const;

export type UseCaseId = (typeof USE_CASES)[number]["id"];

export const rankedModelChoiceSchema = z.object({
  providerId: z.string().min(1),
  modelId: z.string().min(1),
  modelName: z.string().optional(),
});
export type RankedModelChoice = z.infer<typeof rankedModelChoiceSchema>;

export const useCaseRanksSchema = z.object({
  legal_reasoning: z.array(rankedModelChoiceSchema),
  document_processing: z.array(rankedModelChoiceSchema),
  agentic_work: z.array(rankedModelChoiceSchema),
});
export type UseCaseRanks = z.infer<typeof useCaseRanksSchema>;

export const useCaseRoutingKey = "casevault-2/settings/use-case-ranks-v1.json";

export interface ActiveModelOption {
  providerId: string;
  providerName: string;
  modelId: string;
  modelName: string;
  contextWindow?: number;
}

export function getDefaultRanks(available: ActiveModelOption[]): UseCaseRanks {
  const findModel = (predicate: (opt: ActiveModelOption) => boolean) => available.find(predicate);

  // Legal reasoning: prioritize strong reasoning models (Gemini Flash, Nemotron 30b/lightning, etc.)
  const reasoningPrimary = findModel(m => m.modelId.includes("gemini-3.5-flash") || m.modelId.includes("nemotron-3.5-lightning-30b"));
  const reasoningSecondary = findModel(m => m !== reasoningPrimary && (m.modelId.includes("nemotron") || m.modelId.includes("gemini")));

  // Document processing: prioritize multimodal vision/OCR capable models
  const docPrimary = findModel(m => m.providerId === "gemini" || m.modelId.includes("vision") || m.providerId === "ocr");
  const docSecondary = findModel(m => m !== docPrimary);

  // Agentic work: prioritize fast, tool-compliant models
  const agentPrimary = findModel(m => m.modelId.includes("gemini-3.5") || m.modelId.includes("nemotron"));
  const agentSecondary = findModel(m => m !== agentPrimary);

  const toChoice = (m?: ActiveModelOption): RankedModelChoice[] =>
    m ? [{ providerId: m.providerId, modelId: m.modelId, modelName: m.modelName }] : [];

  return {
    legal_reasoning: [
      ...toChoice(reasoningPrimary),
      ...toChoice(reasoningSecondary),
    ],
    document_processing: [
      ...toChoice(docPrimary),
      ...toChoice(docSecondary),
    ],
    agentic_work: [
      ...toChoice(agentPrimary),
      ...toChoice(agentSecondary),
    ],
  };
}
