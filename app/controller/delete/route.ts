import { NextResponse } from 'next/server';
import { AccServ } from '@/lib/service/accServ';
import { DeleteAccountDTO, ApiResponse } from '@/lib/dto/acc';

const accServ = new AccServ();

export async function POST(request: Request) {
  try {
    // 1. 解析请求体数据
    let body: DeleteAccountDTO;
    try {
      body = await request.json();
    } catch {
      throw new Error('请求体格式错误，请发送正确的 JSON 数据');
    }

    // 2. 调用 Service 执行删除
    await accServ.deleteAccount(body.id);

    // 3. 返回成功响应
    const response: ApiResponse = {
      success: true,
      message: `ID 为 ${body.id} 的账号已成功删除！`,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : '服务器内部异常';

    const response: ApiResponse = {
      success: false,
      message: '删除账号失败',
      error: errorMessage,
    };

    return NextResponse.json(response, { status: 400 });
  }
}