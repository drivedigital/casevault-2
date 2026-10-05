import test from "node:test";
import assert from "node:assert/strict";
import {
  useCaseRanksSchema,
  rankedModelChoiceSchema,
  USE_CASES,
  type ActiveModelOption,
  type UseCaseRanks,
  getDefaultRanks,
} from "../src/lib/use-case-types";

test("use cases metadata contains expected core workloads", () => {
  const ids = USE_CASES.map(u => u.id);
  assert.deepEqual(ids, ["legal_reasoning", "document_processing", "agentic_work"]);
});

test("ranked model choice schema validates valid items and rejects empty strings", () => {
  assert.equal(
    rankedModelChoiceSchema.safeParse({
      providerId: "gemini",
      modelId: "gemini-3.5-flash",
      modelName: "Gemini 3.5 Flash",
    }).success,
    true
  );

  // Missing providerId or modelId
  assert.equal(
    rankedModelChoiceSchema.safeParse({
      providerId: "",
      modelId: "gemini-3.5-flash",
    }).success,
    false
  );
  assert.equal(
    rankedModelChoiceSchema.safeParse({
      providerId: "gemini",
      modelId: "",
    }).success,
    false
  );
});

test("use case ranks schema validates correct structures and rejects missing workloads", () => {
  const valid: UseCaseRanks = {
    legal_reasoning: [
      { providerId: "gemini", modelId: "gemini-3.5-flash", modelName: "Gemini 3.5 Flash" },
      { providerId: "openrouter", modelId: "nvidia/nemotron-3.5-lightning:free", modelName: "Nemotron" },
    ],
    document_processing: [
      { providerId: "gemini", modelId: "gemini-3.5-flash", modelName: "Gemini 3.5 Flash" },
    ],
    agentic_work: [
      { providerId: "gemini", modelId: "gemini-3.5-flash", modelName: "Gemini 3.5 Flash" },
    ],
  };

  assert.equal(useCaseRanksSchema.safeParse(valid).success, true);

  // Missing a required use case
  const incomplete = {
    legal_reasoning: valid.legal_reasoning,
    document_processing: valid.document_processing,
  };
  assert.equal(useCaseRanksSchema.safeParse(incomplete).success, false);
});

test("getDefaultRanks handles empty available models gracefully", () => {
  const defaults = getDefaultRanks([]);
  assert.deepEqual(defaults, {
    legal_reasoning: [],
    document_processing: [],
    agentic_work: [],
  });
});

test("getDefaultRanks intelligently assigns active models based on workload suitability", () => {
  const mockAvailable: ActiveModelOption[] = [
    {
      providerId: "gemini",
      providerName: "Google Gemini",
      modelId: "gemini-3.5-flash",
      modelName: "Gemini 3.5 Flash (Free)",
      contextWindow: 1048576,
    },
    {
      providerId: "nvidia",
      providerName: "NVIDIA NIM",
      modelId: "nvidia/nemotron-3.5-lightning-30b-a3b",
      modelName: "Nemotron 3.5 30B",
      contextWindow: 131072,
    },
    {
      providerId: "openrouter",
      providerName: "OpenRouter",
      modelId: "nvidia/nemotron-3.5-lightning:free",
      modelName: "Nemotron 3.5 Free",
      contextWindow: 131072,
    },
  ];

  const defaults = getDefaultRanks(mockAvailable);

  // Legal reasoning should pick gemini-3.5-flash first, then secondary reasoning model
  assert.equal(defaults.legal_reasoning.length, 2);
  assert.equal(defaults.legal_reasoning[0].modelId, "gemini-3.5-flash");
  assert.equal(defaults.legal_reasoning[1].modelId, "nvidia/nemotron-3.5-lightning-30b-a3b");

  // Document processing should prioritize multimodal (gemini)
  assert.equal(defaults.document_processing.length, 2);
  assert.equal(defaults.document_processing[0].providerId, "gemini");

  // Agentic work should have primary and fallback
  assert.equal(defaults.agentic_work.length, 2);
  assert.equal(defaults.agentic_work[0].modelId, "gemini-3.5-flash");
});
