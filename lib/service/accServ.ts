import pool from '../utils/mysql';
import { AccRepo } from '../repo/accRepo';
import { MyAccount,AddAccountDTO ,UpdateAccountDTO, RotateItemDTO} from '../dto/acc';

export class AccServ {
  private accRepo: AccRepo;

  constructor() {
    this.accRepo = new AccRepo(pool);
  }

  /**
   * 校验账号数据对象的必填字段
   */
  private validateAccount(acc: MyAccount): void {
    if (typeof acc.id !== 'number' || isNaN(acc.id)) {
      throw new Error('字段 id 必须为有效数字');
    }
    if (!acc.web || acc.web.trim() === '') {
      throw new Error(`[ID: ${acc.id}] 字段 web 不能为空`);
    }
    if (!acc.acc || acc.acc.trim() === '') {
      throw new Error(`[ID: ${acc.id}] 字段 acc 不能为空`);
    }
    if (!acc.pin || acc.pin.trim() === '') {
      throw new Error(`[ID: ${acc.id}] 字段 pin 不能为空`);
    }
    if (!acc.classify || acc.classify.trim() === '') {
      throw new Error(`[ID: ${acc.id}] 字段 classify 不能为空`);
    }
  }

  /**
   * 获取所有加密账号数据（客户端拉取后本地解密）
   */
  async getAllAccounts(): Promise<MyAccount[]> {
    const conn = await pool.getConnection();
    try {
      return await this.accRepo.findAll();
    } finally {
      conn.release();
    }
  }
  async addAccount(dto: AddAccountDTO): Promise<number> {
    // 1. 业务参数非空校验

    if (!dto.web || dto.web.trim() === '') {
      throw new Error('字段 web 不能为空');
    }
    if (!dto.acc || dto.acc.trim() === '') {
      throw new Error('字段 acc 不能为空');
    }
    if (!dto.pin || dto.pin.trim() === '') {
      throw new Error('字段 pin 不能为空');
    }
    if (!dto.classify || dto.classify.trim() === '') {
      throw new Error('字段 classify 不能为空');
    }

    // 2. 拼装 Entity 实体对象
    const newAccount: AddAccountDTO = {
      web: dto.web.trim(),
      acc: dto.acc.trim(),
      pin: dto.pin.trim(),
      description: dto.description ? dto.description.trim() : "",
      classify: dto.classify.trim(),
    };

    // 3. 调用 Repo 执行写入
    const newId = await this.accRepo.insert(newAccount);
    return newId;
  }

  async deleteAccount(id: number): Promise<void> {
    // 1. 校验 id 是否有效
    if (typeof id !== 'number' || isNaN(id) || id <= 0) {
      throw new Error('请提供有效的数字类型账号 ID');
    }

    // 2. 调用 Repo 执行 SQL
    const affectedRows = await this.accRepo.deleteById(id);

    // 3. 检查受影响行数，如果为 0 说明没查到对应数据
    if (affectedRows === 0) {
      throw new Error(`未找到 ID 为 ${id} 的账号记录，可能已被删除`);
    }
  }
  async updateAccount(dto: UpdateAccountDTO): Promise<void> {
    // 1. 参数校验
    if (typeof dto.id !== 'number' || isNaN(dto.id) || dto.id <= 0) {
      throw new Error('字段 id 必须为有效数字');
    }
    if (!dto.web || dto.web.trim() === '') {
      throw new Error('字段 web 不能为空');
    }
    if (!dto.acc || dto.acc.trim() === '') {
      throw new Error('字段 acc 不能为空');
    }
    if (!dto.pin || dto.pin.trim() === '') {
      throw new Error('字段 pin 不能为空');
    }
    if (!dto.classify || dto.classify.trim() === '') {
      throw new Error('字段 classify 不能为空');
    }

    // 2. 清理空白字符
    const cleanDto: UpdateAccountDTO = {
      id: dto.id,
      web: dto.web.trim(),
      acc: dto.acc.trim(),
      pin: dto.pin.trim(),
      description: dto.description ? dto.description.trim() : "",
      classify: dto.classify.trim(),
    };

    // 3. 执行更新 SQL
    const affectedRows = await this.accRepo.update(cleanDto);

    // 4. 判断记录是否存在
    if (affectedRows === 0) {
      throw new Error(`未找到 ID 为 ${dto.id} 的账号记录，更新失败`);
    }
  }
  /**
   * 密钥轮转：在单个事务内批量更新所有重加密后的数据
   */
  async rotateAllKeys(accounts: MyAccount[]): Promise<boolean> {
    if (!accounts || accounts.length === 0) {
      throw new Error('轮转提交的数据集合不能为空');
    }

    // 1. 业务逻辑校验：循环检查所有数据的必填字段
    for (const acc of accounts) {
      this.validateAccount(acc);
    }

    // 2. 开启 DB 事务
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 执行批量重写
      await this.accRepo.batchUpsert(conn, accounts);

      // 提交事务
      await conn.commit();
      return true;
    } catch (error) {
      // 出现任何错误立刻回滚
      await conn.rollback();
      throw error;
    } finally {
      // 归还连接
      conn.release();
    }
  }
  async rotateKeysBatch(items: RotateItemDTO[]): Promise<void> {
    // 1. 数组非空校验
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('轮转数据列表不能为空');
    }

    // 2. 循环元素校验
    for (const item of items) {
      if (typeof item.id !== 'number' || isNaN(item.id) || item.id <= 0) {
        throw new Error(`轮转数据项中存在无效的 id: ${item.id}`);
      }
      if (!item.acc || item.acc.trim() === '') {
        throw new Error(`[ID: ${item.id}] 字段 acc 不能为空`);
      }
      if (!item.pin || item.pin.trim() === '') {
        throw new Error(`[ID: ${item.id}] 字段 pin 不能为空`);
      }
    }

    // 3. 从连接池获取单个连接并开启事务
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction(); // 🏁 开启事务

      // 调用 Repo 批量更新
      await this.accRepo.batchUpdateRotate(conn, items);

      await conn.commit(); // ✅ 提交事务
    } catch (error) {
      await conn.rollback(); // ❌ 遇到任何异常立刻回滚，保持数据安全
      throw error; // 向上抛出异常给 Controller
    } finally {
      conn.release(); // 🔌 归还连接池
    }
  }
}