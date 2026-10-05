import { OcrMode, OcrRequestPayload } from './types';

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-OCR-Secret, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

export function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export function jsonResponse(data: unknown, status = 200, customHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...customHeaders,
    },
  });
}

export function errorResponse(message: string, status = 400, details: unknown = null, code?: string): Response {
  return jsonResponse(
    {
      success: false,
      error: message,
      code,
      details,
    },
    status
  );
}

export function base64ToUint8Array(base64: string): Uint8Array {
  // Strip data URI prefix if present (e.g., data:image/png;base64,...)
  const cleanBase64 = base64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
  const binaryString = atob(cleanBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export interface ParsedImageRequest {
  imageBytes: Uint8Array;
  mode: OcrMode;
  prompt?: string;
  maxTokens: number;
  temperature: number;
}

export async function parseIncomingRequest(request: Request): Promise<ParsedImageRequest> {
  const contentType = request.headers.get('content-type') || '';
  const url = new URL(request.url);

  // Query parameter defaults
  const queryMode = (url.searchParams.get('mode') as OcrMode) || 'markdown';
  const queryMaxTokens = parseInt(url.searchParams.get('max_tokens') || '4096', 10);
  const queryTemp = parseFloat(url.searchParams.get('temperature') || '0.1');

  // Case 1: Raw image binary stream (image/png, image/jpeg, application/octet-stream)
  if (
    contentType.startsWith('image/') ||
    contentType.includes('application/octet-stream')
  ) {
    const buffer = await request.arrayBuffer();
    if (buffer.byteLength === 0) {
      throw new Error('Empty image payload received.');
    }
    return {
      imageBytes: new Uint8Array(buffer),
      mode: queryMode,
      prompt: url.searchParams.get('prompt') || undefined,
      maxTokens: isNaN(queryMaxTokens) ? 4096 : queryMaxTokens,
      temperature: isNaN(queryTemp) ? 0.1 : queryTemp,
    };
  }

  // Case 2: Multipart form-data
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const file = (formData.get('file') || formData.get('image')) as File | null;
    if (!file) {
      throw new Error('Multipart request missing "file" or "image" field.');
    }
    const buffer = await file.arrayBuffer();
    const mode = (formData.get('mode') as OcrMode) || queryMode;
    const prompt = (formData.get('prompt') as string) || undefined;
    const maxTokensStr = formData.get('max_tokens') as string | null;
    const tempStr = formData.get('temperature') as string | null;

    return {
      imageBytes: new Uint8Array(buffer),
      mode: mode || 'markdown',
      prompt,
      maxTokens: maxTokensStr ? parseInt(maxTokensStr, 10) : queryMaxTokens,
      temperature: tempStr ? parseFloat(tempStr) : queryTemp,
    };
  }

  // Case 3: JSON payload
  if (contentType.includes('application/json')) {
    const body: OcrRequestPayload = await request.json();
    let imageBytes: Uint8Array;

    if (body.image) {
      imageBytes = base64ToUint8Array(body.image);
    } else if (body.imageUrl) {
      const imgRes = await fetch(body.imageUrl);
      if (!imgRes.ok) {
        throw new Error(`Failed to fetch image from imageUrl: ${imgRes.status} ${imgRes.statusText}`);
      }
      const buffer = await imgRes.arrayBuffer();
      imageBytes = new Uint8Array(buffer);
    } else {
      throw new Error('JSON request must include either "image" (base64) or "imageUrl".');
    }

    return {
      imageBytes,
      mode: body.mode || queryMode,
      prompt: body.prompt,
      maxTokens: body.max_tokens || queryMaxTokens,
      temperature: body.temperature ?? queryTemp,
    };
  }

  throw new Error(
    `Unsupported Content-Type: "${contentType}". Please send image/png, image/jpeg, multipart/form-data, or application/json.`
  );
}
