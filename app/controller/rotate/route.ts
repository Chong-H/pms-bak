import { NextResponse } from 'next/server';
import { AccServ } from '@/lib/service/accServ';
import { ApiResponse, RotateAccountDTO } from '@/lib/dto/acc';

const accServ = new AccServ();

export async function POST(request: Request) {
  try {
    // 1. 安全解析 JSON
    let body: RotateAccountDTO;
    try {
      body = await request.json();
    } catch {
      throw new Error('请求体格式错误，请发送正确的 JSON 数据');
    }

    // 2. 调用 Service 执行批量事务轮转
    await accServ.rotateKeysBatch(body.items);

    // 3. 返回成功响应
    const response: ApiResponse = {
      success: true,
      message: `成功完成 ${body.items.length} 条数据的密钥轮转！`,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : '服务器内部异常';

    const response: ApiResponse = {
      success: false,
      message: '密钥轮转失败，更改已安全回滚',
      error: errorMessage,
    };

    return NextResponse.json(response, { status: 400 });
  }
}