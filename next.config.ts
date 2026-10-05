import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
 serverExternalPackages:["pg"],
 outputFileTracingIncludes:{"/*":["./node_modules/pg-cloudflare/**/*"]},
};
export default nextConfig;
