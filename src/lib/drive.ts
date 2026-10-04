import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { driveFileSchema, driveListSchema, driveSearchQuery } from "./drive-schema";

const connectionKey = "casevault-2/connections/google-drive.enc.json";
const connectionSchema = z.object({ token: z.string(), account: z.string(), userId: z.string(), expiresAt: z.number() });
async function encryptionKey() {
  const secret = getCloudflareContext().env.SESSION_SECRET;
  if (!secret) throw new Error("Private connection encryption is unavailable.");
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`casevault2:drive:${secret}`));
  return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}
function encode(bytes: Uint8Array) { return btoa(String.fromCharCode(...bytes)); }
function decode(value: string) { return Uint8Array.from(atob(value), c => c.charCodeAt(0)); }
export async function connectDrive(token: string, account: string, userId: string) {
  // Check the extra Drive grant before persisting the provider token.
  const probe = await fetch("https://www.googleapis.com/drive/v3/files?pageSize=1&fields=files(id)", { headers: { Authorization: `Bearer ${token}` }, redirect: "manual", signal: AbortSignal.timeout(15000) });
  if (!probe.ok) { await probe.body?.cancel(); throw new Error("Drive authorization or Drive API activation is missing."); }
  await probe.body?.cancel();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await encryptionKey(), new TextEncoder().encode(JSON.stringify({ token, account, userId, expiresAt: Date.now() + 3500000 })));
  await getCloudflareContext().env.EVIDENCE.put(connectionKey, JSON.stringify({ iv: encode(iv), data: encode(new Uint8Array(encrypted)) }), { httpMetadata: { contentType: "application/json" } });
}
async function connection() {
  const object = await getCloudflareContext().env.EVIDENCE.get(connectionKey);
  if (!object) return null;
  const envelope = z.object({ iv: z.string(), data: z.string() }).parse(await object.json());
  const bytes = await crypto.subtle.decrypt({ name: "AES-GCM", iv: decode(envelope.iv) }, await encryptionKey(), decode(envelope.data));
  const value = connectionSchema.parse(JSON.parse(new TextDecoder().decode(bytes)));
  return value.expiresAt > Date.now() && value.account.toLowerCase() === getCloudflareContext().env.ALLOWED_LOGIN_EMAIL.toLowerCase() ? value : null;
}
export async function driveStatus() {
  const value = await connection();
  return { connected: Boolean(value), account: value?.account ?? null, expiresAt: value?.expiresAt ?? null };
}
export async function disconnectDrive() { await getCloudflareContext().env.EVIDENCE.delete(connectionKey); }
export async function driveRequest(url: string) {
  const value = await connection();
  if (!value) throw new Error("Connect Google Drive to browse files.");
  const response = await fetch(url, { headers: { Authorization: `Bearer ${value.token}` }, redirect: "manual", signal: AbortSignal.timeout(30000) });
  if (!response.ok) { await response.body?.cancel(); throw new Error("Drive access failed. Reconnect Drive and confirm that the Google Drive API is enabled."); }
  return response;
}
export async function listDriveFiles(folder: string, search: string, pageToken?: string) {
  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.searchParams.set("q", driveSearchQuery(folder, search));
  url.searchParams.set("fields", "files(id,name,mimeType,size,modifiedTime,webViewLink),nextPageToken");
  url.searchParams.set("pageSize", "50"); url.searchParams.set("orderBy", "folder,name");
  url.searchParams.set("supportsAllDrives", "true"); url.searchParams.set("includeItemsFromAllDrives", "true");
  if (pageToken) url.searchParams.set("pageToken", pageToken);
  return driveListSchema.parse(await (await driveRequest(url.href)).json());
}
export async function getDriveFile(id: string) {
  const url = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}`);
  url.searchParams.set("fields", "id,name,mimeType,size,modifiedTime,webViewLink"); url.searchParams.set("supportsAllDrives", "true");
  return driveFileSchema.parse(await (await driveRequest(url.href)).json());
}
export async function downloadDriveFile(file: z.infer<typeof driveFileSchema>) {
  const native = file.mimeType.startsWith("application/vnd.google-apps.");
  if (native && !["application/vnd.google-apps.document", "application/vnd.google-apps.spreadsheet", "application/vnd.google-apps.presentation"].includes(file.mimeType)) throw new Error("Choose a document, spreadsheet, presentation, PDF, or stored file.");
  if (Number(file.size ?? 0) > 20 * 1024 * 1024) throw new Error("Drive imports currently support files up to 20 MB.");
  const url = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}${native ? "/export" : ""}`);
  if (native) url.searchParams.set("mimeType", "application/pdf"); else { url.searchParams.set("alt", "media"); url.searchParams.set("supportsAllDrives", "true"); }
  const response = await driveRequest(url.href);
  const reader = response.body?.getReader(); if (!reader) throw new Error("Drive returned an empty file.");
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > 20 * 1024 * 1024) { await reader.cancel(); throw new Error("Drive imports currently support files up to 20 MB."); } chunks.push(value); }
  if (!size) throw new Error("Drive returned an empty file.");
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return { bytes, mimeType: native ? "application/pdf" : file.mimeType, filename: native ? `${file.name}.pdf` : file.name };
}
