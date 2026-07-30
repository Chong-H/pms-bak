import { Pool , PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { MyAccount ,AddAccountDTO,UpdateAccountDTO, RotateItemDTO} from '../dto/acc';

export class AccRepo {
  constructor(private readonly pool: Pool) {}

  /**
   * 查询所有账号数据（E2EE 全量拉取）
   */
  async findAll(): Promise<MyAccount[]> {
    const sql = `
      SELECT id, web, acc, pin, description, classify
      FROM myaccount
    `;
    const [rows] = await this.pool.query<RowDataPacket[]>(sql);
    return rows as MyAccount[];
  }

  /**
   * 插入单条账号记录
   */
  async insert(account: AddAccountDTO): Promise<number> {
    const sql = `
      INSERT INTO myaccount (web, acc, pin, description, classify)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const values = [
      account.web,
      account.acc,
      account.pin,
      account.description || "",
      account.classify,
    ];

    const [result] = await this.pool.query<ResultSetHeader>(sql, values);
    
    // 返回数据库刚刚自增生成的 id
    return result.insertId;
  }
  async deleteById(id: number): Promise<number> {
    const sql = 'DELETE FROM myaccount WHERE id = ?';
    const [result] = await this.pool.query<ResultSetHeader>(sql, [id]);
    
    // 返回被删除的行数
    return result.affectedRows;
  }

  /**
   * 批量更新/覆盖账号记录（用于密钥轮转，保证原子性）
   */
  async batchUpsert(conn: PoolConnection, accounts: MyAccount[]): Promise<ResultSetHeader> {
    const sql = `
      INSERT INTO myaccount (id, web, acc, pin, description, classify)
      VALUES ?
      ON DUPLICATE KEY UPDATE
        web = VALUES(web),
        acc = VALUES(acc),
        pin = VALUES(pin),
        description = VALUES(description),
        classify = VALUES(classify)
    `;

    const values = accounts.map((acc) => [
      acc.id,
      acc.web,
      acc.acc,
      acc.pin,
      acc.description || null,
      acc.classify,
    ]);

    const [result] = await conn.query<ResultSetHeader>(sql, [values]);
    return result;
  }
  /**
   * 根据 ID 更新账号记录
   * @returns 受影响的行数 (affectedRows)
   */
  async update(account: UpdateAccountDTO): Promise<number> {
    const sql = `
      UPDATE myaccount 
      SET web = ?, acc = ?, pin = ?, description = ?, classify = ?
      WHERE id = ?
    `;

    const values = [
      account.web,
      account.acc,
      account.pin,
      account.description || "",
      account.classify,
      account.id,
    ];

    const [result] = await this.pool.query<ResultSetHeader>(sql, values);

    // 返回匹配/修改的行数
    return result.affectedRows;
  }
  async batchUpdateRotate(
    conn: PoolConnection,
    items: RotateItemDTO[]
  ): Promise<ResultSetHeader> {
    // 使用 ON DUPLICATE KEY UPDATE 实现基于主键 (id) 的高效批量更新
    const sql = `
      INSERT INTO myaccount (id, acc, pin)
      VALUES ?
      ON DUPLICATE KEY UPDATE
        acc = VALUES(acc),
        pin = VALUES(pin)
    `;

    // 转换成 mysql2 批处理要求的二维数组格式 [[id, acc, pin], [id, acc, pin], ...]
    const values = items.map((item) => [item.id, item.acc, item.pin]);

    const [result] = await conn.query<ResultSetHeader>(sql, [values]);
    return result;
  }
}