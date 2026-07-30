import pool from '../../../lib/utils/mysql'; // 复用原有数据库连接池
import { NextRequest, NextResponse } from 'next/server';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

// 处理 OPTIONS 预检请求（跨域必备）
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';

  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Worker-Auth-Token, Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
export async function GET(_request: Request) {
  try {
    // RowDataPacket[] 明确标注查询返回的是行数组
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM user');
    
    return NextResponse.json({
      success: true,
      message: '数据库连接成功！',
      testData: rows,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json({
      success: false,
      message: '数据库连接失败',
      error: errorMessage,
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, age } = await request.json();
    
    // ✅ 用 ResultSetHeader 代替 any，它包含 insertId, affectedRows 等属性
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO users (name, age) VALUES (?, ?)',
      [name, age]
    );
    
    return NextResponse.json({
      success: true,
      message: '数据插入成功',
      insertId: result.insertId, // 现在拿到完整的类型提示，且不会报错了！
    }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json({
      success: false,
      message: '数据插入失败',
      error: errorMessage,
    }, { status: 500 });
  }
}