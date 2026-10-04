import { z } from "zod";
export const driveFileSchema = z.object({ id: z.string(), name: z.string(), mimeType: z.string(), size: z.string().optional(), modifiedTime: z.string().optional(), webViewLink: z.string().optional() });
export const driveListSchema = z.object({ files: z.array(driveFileSchema), nextPageToken: z.string().optional() });
export type DriveFile = z.infer<typeof driveFileSchema>;
export function driveSearchQuery(folder: string, search: string): string {
  const escaped = search.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
  return `trashed = false and ${search ? `name contains '${escaped}'` : `'${folder}' in parents`}`;
}
export const driveImportSchema = z.object({ fileIds: z.array(z.string().regex(/^[a-zA-Z0-9_-]{10,200}$/)).min(1).max(5), matterId: z.number().int().positive().nullable().optional() }).strict();
