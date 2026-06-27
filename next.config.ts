import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    AUTH_SECRET: 'my-super-secret-key-for-demo-with-at-least-32-chars-long',
    AUTH_TRUST_HOST: 'true',
  },
};

export default nextConfig;
