import { Env } from './types';

export const VISION_MODEL = '@cf/meta/llama-3.2-11b-vision-instruct';

export interface RunVisionOcrOptions {
  imageBytes: Uint8Array;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface RunVisionOcrResult {
  text: string;
  rawResponse: unknown;
  durationMs: number;
}

/**
 * Executes OCR using Workers AI @cf/meta/llama-3.2-11b-vision-instruct
 */
export async function runVisionOcr(
  env: Env,
  options: RunVisionOcrOptions
): Promise<RunVisionOcrResult> {
  const startTime = Date.now();
  const { imageBytes, prompt, maxTokens = 4096, temperature = 0.1 } = options;

  // Convert Uint8Array to Array of numbers for Workers AI JSON serialization
  const imageNumberArray = Array.from(imageBytes);

  let lastError: unknown = null;

  // Strategy 1: Prompt + image number array (Official Workers AI documented parameter)
  try {
    const aiResponse: any = await env.AI.run(VISION_MODEL as any, {
      prompt,
      image: imageNumberArray,
      max_tokens: maxTokens,
      temperature,
    });

    const text = extractTextFromAiResponse(aiResponse);
    return {
      text,
      rawResponse: aiResponse,
      durationMs: Date.now() - startTime,
    };
  } catch (err: any) {
    lastError = err;
    // Check if error is due to license agreement
    checkLicenseAgreementError(err);
  }

  // Strategy 2: Multimodal messages format
  try {
    const aiResponse: any = await env.AI.run(VISION_MODEL as any, {
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', image: imageNumberArray },
            { type: 'text', text: prompt },
          ],
        },
      ],
      max_tokens: maxTokens,
      temperature,
    });

    const text = extractTextFromAiResponse(aiResponse);
    return {
      text,
      rawResponse: aiResponse,
      durationMs: Date.now() - startTime,
    };
  } catch (err: any) {
    lastError = err;
    checkLicenseAgreementError(err);
  }

  // Strategy 3: Passing raw Uint8Array
  try {
    const aiResponse: any = await env.AI.run(VISION_MODEL as any, {
      prompt,
      image: imageBytes,
      max_tokens: maxTokens,
      temperature,
    });

    const text = extractTextFromAiResponse(aiResponse);
    return {
      text,
      rawResponse: aiResponse,
      durationMs: Date.now() - startTime,
    };
  } catch (err: any) {
    lastError = err;
    checkLicenseAgreementError(err);
    throw new Error(
      `Workers AI execution failed on ${VISION_MODEL}: ${lastError instanceof Error ? lastError.message : String(lastError)}`
    );
  }
}

/**
 * Extracts plain text from various Workers AI response shapes
 */
function extractTextFromAiResponse(aiResponse: any): string {
  if (!aiResponse) return '';
  if (typeof aiResponse === 'string') return aiResponse;
  if (typeof aiResponse.response === 'string') return aiResponse.response;
  if (Array.isArray(aiResponse.choices) && aiResponse.choices.length > 0) {
    const choice = aiResponse.choices[0];
    if (choice?.message?.content) return choice.message.content;
    if (choice?.text) return choice.text;
  }
  if (typeof aiResponse.description === 'string') return aiResponse.description;
  return JSON.stringify(aiResponse);
}

/**
 * Detects if the model failed because Meta license terms haven't been agreed to yet
 */
function checkLicenseAgreementError(err: any): void {
  const msg = (err?.message || String(err)).toLowerCase();
  if (
    msg.includes('agree') ||
    msg.includes('license') ||
    msg.includes('acceptable use') ||
    msg.includes('terms')
  ) {
    throw new Error(
      `Meta License Agreement Required: To use ${VISION_MODEL}, your Cloudflare account must accept the Meta License. Call POST /agree on this worker or run 'curl -X POST https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/ai/run/${VISION_MODEL} -H "Authorization: Bearer $TOKEN" -d \'{"prompt":"agree"}\''. Original error: ${err.message}`
    );
  }
}

/**
 * Automatically agrees to the Meta License on the Cloudflare account
 */
export async function agreeToMetaLicense(env: Env): Promise<{ success: boolean; result: unknown }> {
  const result = await env.AI.run(VISION_MODEL as any, {
    prompt: 'agree',
  });
  return {
    success: true,
    result,
  };
}
