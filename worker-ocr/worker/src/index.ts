import { Env, OcrMode } from './types';
import { handleOptions, jsonResponse, errorResponse, parseIncomingRequest } from './utils';
import { getPromptForMode } from './prompts';
import { runVisionOcr, agreeToMetaLicense, VISION_MODEL } from './ocr';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // 1. Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    // 2. Optional Secret Key Check
    if (env.OCR_SECRET_KEY) {
      const authHeader = request.headers.get('Authorization') || '';
      const secretHeader = request.headers.get('X-OCR-Secret') || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim() || secretHeader.trim();

      if (token !== env.OCR_SECRET_KEY) {
        return errorResponse('Unauthorized: Invalid or missing OCR secret token', 401);
      }
    }

    // 3. Routing
    try {
      // Health / Info endpoint
      if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
        return jsonResponse({
          status: 'ok',
          service: 'docket-key-ocr-worker',
          model: VISION_MODEL,
          endpoints: [
            { method: 'POST', path: '/ocr', description: 'Transcribe document image to Markdown or plain text' },
            { method: 'POST', path: '/ocr/structured', description: 'Extract structured legal document metadata & text' },
            { method: 'POST', path: '/ocr/table', description: 'Extract tables from document images' },
            { method: 'POST', path: '/agree', description: 'Accept Meta Llama 3.2 license agreement on Workers AI' },
          ],
          supportedFormats: ['image/png', 'image/jpeg', 'image/webp', 'application/json (base64 or imageUrl)', 'multipart/form-data'],
        });
      }

      // Meta License Agreement endpoint
      if (request.method === 'POST' && url.pathname === '/agree') {
        const agreementResult = await agreeToMetaLicense(env);
        return jsonResponse({
          success: true,
          message: `Successfully sent agreement to ${VISION_MODEL}`,
          details: agreementResult,
        });
      }

      // Main OCR processing endpoint
      if (request.method === 'POST' && url.pathname === '/ocr') {
        const parsed = await parseIncomingRequest(request);
        const prompt = getPromptForMode(parsed.mode, parsed.prompt);

        const ocrResult = await runVisionOcr(env, {
          imageBytes: parsed.imageBytes,
          prompt,
          maxTokens: parsed.maxTokens,
          temperature: parsed.temperature,
        });

        return jsonResponse({
          success: true,
          text: ocrResult.text,
          metadata: {
            model: VISION_MODEL,
            mode: parsed.mode,
            imageSizeBytes: parsed.imageBytes.byteLength,
            processingTimeMs: ocrResult.durationMs,
          },
        });
      }

      // Structured Legal OCR endpoint
      if (request.method === 'POST' && url.pathname === '/ocr/structured') {
        const parsed = await parseIncomingRequest(request);
        const prompt = getPromptForMode('structured', parsed.prompt);

        const ocrResult = await runVisionOcr(env, {
          imageBytes: parsed.imageBytes,
          prompt,
          maxTokens: parsed.maxTokens,
          temperature: parsed.temperature,
        });

        // Attempt to parse structured JSON from model output
        let structuredData: Record<string, unknown> | null = null;
        let cleanedJsonText = ocrResult.text.trim();

        // Strip markdown code fences if model wrapped response in ```json ... ```
        const jsonMatch = cleanedJsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          cleanedJsonText = jsonMatch[1].trim();
        }

        try {
          structuredData = JSON.parse(cleanedJsonText);
        } catch {
          // If JSON parse fails, structured stays null but raw text is preserved
        }

        return jsonResponse({
          success: true,
          text: ocrResult.text,
          structured: structuredData,
          metadata: {
            model: VISION_MODEL,
            mode: 'structured',
            imageSizeBytes: parsed.imageBytes.byteLength,
            processingTimeMs: ocrResult.durationMs,
          },
        });
      }

      // Table OCR endpoint
      if (request.method === 'POST' && url.pathname === '/ocr/table') {
        const parsed = await parseIncomingRequest(request);
        const prompt = getPromptForMode('table', parsed.prompt);

        const ocrResult = await runVisionOcr(env, {
          imageBytes: parsed.imageBytes,
          prompt,
          maxTokens: parsed.maxTokens,
          temperature: parsed.temperature,
        });

        return jsonResponse({
          success: true,
          text: ocrResult.text,
          metadata: {
            model: VISION_MODEL,
            mode: 'table',
            imageSizeBytes: parsed.imageBytes.byteLength,
            processingTimeMs: ocrResult.durationMs,
          },
        });
      }

      return errorResponse(`Route not found: ${request.method} ${url.pathname}`, 404);
    } catch (err: any) {
      console.error('OCR Worker Error:', err);
      return errorResponse(err.message || 'Internal Server Error', 500, {
        stack: err.stack,
      });
    }
  },
} satisfies ExportedHandler<Env>;
