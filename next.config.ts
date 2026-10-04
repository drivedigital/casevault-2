import type { NextConfig } from "next";
const nextConfig: NextConfig = {
 serverExternalPackages:["pg"],
 outputFileTracingIncludes:{"/*":["./node_modules/pg-cloudflare/**/*"]},
};
export default nextConfig;
