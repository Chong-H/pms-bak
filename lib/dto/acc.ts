// 1. 对应数据库表结构模型 (Entity)
export interface MyAccount {
  id: number;          // id 是数字，必填
  web: string;         // 网站/平台，必填
  acc: string;         // 账号/用户名，必填
  pin: string;         // AES-128 加密后的密码密文，必填
  description?: string | null; // 描述，允许为空
  classify: string;    // 分类，必填
}

// 2. DTO：新增/修改账号时的请求体数据类型
export interface CreateAccountDTO {
  id: number;
  web: string;
  acc: string;
  pin: string;
  description?: string;
  classify: string;
}

// 3. DTO：批量密钥轮转提交的数据类型
export interface RotateKeysDTO {
  accounts: MyAccount[];
} 

// 通用统一 API 响应格式
export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
// 1. 新增账号使用的 DTO（入参）
export interface AddAccountDTO {
  web: string;
  acc: string;
  pin: string;
  description?: string;
  classify: string;
}
export interface DeleteAccountDTO {
  id: number;
}
export interface UpdateAccountDTO {
  id: number;
  web: string;
  acc: string;
  pin: string;
  description?: string;
  classify: string;
}
// 1. 密钥轮转时，前端传过来的单条精简记录
export interface RotateItemDTO {
  id: number;
  acc: string;
  pin: string; // 用新主密钥加密后的新密文
}

// 2. 密钥轮转接口整体请求体（数组形式）
export interface RotateAccountDTO {
  items: RotateItemDTO[];
}