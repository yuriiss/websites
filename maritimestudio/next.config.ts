import type { NextConfig } from 'next';

// Static export: `npm run build` writes a plain HTML/CSS/JS site to `out/`
// that can be hosted anywhere. Trailing slashes keep the current URLs
// (/services/, /glossary/cybersecurity/ …).
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  reactStrictMode: true,
};

export default nextConfig;
