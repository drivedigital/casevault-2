export interface Env {
  AI: Ai;
  // Optional auth token to protect OCR worker from unauthorized public access
  OCR_SECRET_KEY?: string;
}

export type OcrMode = 'markdown' | 'plain' | 'structured' | 'table';

export interface OcrRequestPayload {
  image?: string; // Base64 string or data URI
  imageUrl?: string; // Remote URL to fetch
  mode?: OcrMode;
  prompt?: string;
  max_tokens?: number;
  temperature?: number;
}

export interface OcrMetadata {
  model: string;
  mode: OcrMode;
  imageSizeBytes?: number;
  processingTimeMs: number;
}

export interface OcrResponseSuccess {
  success: true;
  text: string;
  structured?: Record<string, unknown>;
  metadata: OcrMetadata;
}

export interface OcrResponseError {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}
