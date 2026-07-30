import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        // 匹配所有路由
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            // 开启 HSTS：告诉所有客户端/浏览器，未来 1 年内禁止对该域名使用明文 HTTP 访问
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;