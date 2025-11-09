import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    BACKEND_API_URL: process.env.BACKEND_API_URL,
  },
};

export default nextConfig;
