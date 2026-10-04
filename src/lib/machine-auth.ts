import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { equalSecret } from "./auth";
export async function machineAuthorized(request: Request) { return equalSecret(request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "", getCloudflareContext().env.CASEVAULT_API_TOKEN); }
