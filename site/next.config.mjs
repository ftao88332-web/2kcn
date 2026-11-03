/** @type {import('next').NextConfig} */
const nextConfig = {
  // 纯静态导出 → Cloudflare Pages / GitHub Pages / 任何静态托管都能跑
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
