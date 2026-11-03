/** @type {import('next').NextConfig} */
const nextConfig = {
  // 纯静态导出 → GitHub Pages / Cloudflare Pages / 任何静态托管都能跑
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  // GitHub Pages 项目站点挂在 /仓库名 子路径下，部署时注入 NEXT_PUBLIC_BASE_PATH
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
};

export default nextConfig;

