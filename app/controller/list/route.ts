import { NextResponse } from 'next/server';
import { AccServ } from '@/lib/service/accServ';
import { ApiResponse, MyAccount } from '@/lib/dto/acc';

const accServ = new AccServ();

export async function GET(_request: Request) {
  try {
    // 1. 调用 Service 层获取全量数据
    const accounts = await accServ.getAllAccounts();

    // 2. 返回成功响应
    const response: ApiResponse<MyAccount[]> = {
      success: true,
      message: '获取成功',
      data: accounts,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : '服务器内部异常';

    // 3. 返回失败响应
    const response: ApiResponse<null> = {
      success: false,
      message: '获取数据列表失败',
      error: errorMessage,
    };

    return NextResponse.json(response, { status: 500 });
  }
}