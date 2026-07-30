// pms-bak/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. 从请求头中提取 Authorization
  const authHeader = request.headers.get('authorization');
  
  // 从环境变量中读取你配置的 256-bit 密钥
  const serverSecret = process.env.API_SECRET_KEY;

  // 校验 Bearer Token 格式: "Bearer <your_256bit_key>"
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : null;

  // 2. 如果密钥不存在或者与服务端不匹配，直接拦截并返回 401
  if (!token || token !== serverSecret) {
    return NextResponse.json(
      {
        success: false,
        message: '未经授权的访问：API Key 无效或未提供',
      },
      { status: 401 }
    );
  }

  // 3. 校验通过，无缝放行给后面的 route.ts 处理
  return NextResponse.next();
}

// 4. 配置拦截路径匹配规则
export const config = {
  matcher: [
    '/api/:path*',
    '/controller/:path*',
  ],
};