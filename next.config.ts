import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // lib/answerEvaluation.ts loads kuromoji.builder({ dicPath: "node_modules/kuromoji/dict" })
  // with a plain cwd-relative string, so Next's static import tracer (@vercel/nft) never
  // sees the dependency and drops the dict/*.gz files from the serverless function bundle.
  outputFileTracingIncludes: {
    "/api/check": ["./node_modules/kuromoji/dict/**/*"],
  },
};

export default nextConfig;
