// 全站唯一品牌图形入口：public/brand/logo-mark.png（无副标题，用于导航/页脚）
//                            public/brand/logo-full.png（含副标题，用于首屏/分享图）
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function BrandLogo({
  variant = "mark",
  height = 32,
  className = "",
}: {
  variant?: "mark" | "full";
  height?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${BASE}/brand/logo-${variant}.png`}
      alt="2K Card Lab"
      style={{ height }}
      className={`w-auto select-none ${className}`}
      draggable={false}
    />
  );
}
