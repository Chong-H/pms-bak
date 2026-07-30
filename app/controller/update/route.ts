import { NextResponse } from 'next/server';
import { AccServ } from '@/lib/service/accServ';
import { ApiResponse, UpdateAccountDTO } from '@/lib/dto/acc';

const accServ = new AccServ();

export async function POST(request: Request) {
  try {
    // 1. 安全解析请求体
    let body: UpdateAccountDTO;
    try {
      body = await request.json();
    } catch {
      throw new Error('请求体格式错误，请发送正确的 JSON 数据');
    }

    // 2. 调用 Service 层执行修改
    await accServ.updateAccount(body);

    // 3. 返回成功响应
    const response: ApiResponse = {
      success: true,
      message: `ID 为 ${body.id} 的账号信息已修改成功！`,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : '服务器内部异常';

    const response: ApiResponse = {
      success: false,
      message: '更新账号失败',
      error: errorMessage,
    };

    return NextResponse.json(response, { status: 400 });
  }
}