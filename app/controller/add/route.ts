import { NextResponse } from 'next/server';
import { AccServ } from '@/lib/service/accServ';
import { AddAccountDTO, ApiResponse } from '@/lib/dto/acc';

const accServ = new AccServ();

export async function POST(request: Request) {
  try {
    const body: AddAccountDTO = await request.json();

    // 执行新增，拿到 DB 分配的自增 id
    const newId = await accServ.addAccount(body);

    const response: ApiResponse<{ id: number }> = {
      success: true,
      message: '账号新增成功！',
      data: { id: newId },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : '服务器内部异常';

    const response: ApiResponse = {
      success: false,
      message: '账号新增失败',
      error: errorMessage,
    };

    return NextResponse.json(response, { status: 400 });
  }
}