# PmsBak API 文档


## 概览
- 文档基于项目源码自动生成。
- 路由文件：请参见源代码以获取实现细节。

相关源码：

- 健康检查: [app/api/health/route.ts](app/api/health/route.ts#L1)
- DB 测试: [app/api/test/route.ts](app/api/test/route.ts#L1)
- 新增: [app/controller/add/route.ts](app/controller/add/route.ts#L1)
- 删除: [app/controller/delete/route.ts](app/controller/delete/route.ts#L1)
- 列表: [app/controller/list/route.ts](app/controller/list/route.ts#L1)
- 轮转: [app/controller/rotate/route.ts](app/controller/rotate/route.ts#L1)
- 更新: [app/controller/update/route.ts](app/controller/update/route.ts#L1)

类型定义（DTO）：[lib/dto/acc.ts](lib/dto/acc.ts#L1-L120)

### 公共说明
- 所有接口返回统一结构 `ApiResponse<T>`：

```json
{
  "success": true | false,
  "message": "描述",
  "data": {...},
  "error": "错误信息"
}
```

- 敏感字段说明：`pin` 为 AES-128 加密后的密文，传输与存储须保持加密。
- 鉴权：当前路由实现中未包含鉴权，建议上线前补充（例如 `Authorization: Bearer <token>` 或 `X-Worker-Auth-Token`）。

---

## 接口详情

### 健康检查
- Path: `GET /api/health`
- 描述: 服务存活检查，返回服务标识与时间戳。
- 响应示例 (200):

```json
{
  "status": "ok",
  "service": "PmsBak Backend Engine",
  "timestamp": "2026-07-31T..."
}
```

实现： [app/api/health/route.ts](app/api/health/route.ts#L1)

### 数据库测试
- Path: `OPTIONS /api/test`
  - 描述: CORS 预检，返回允许的来源与方法。
- Path: `GET /api/test`
  - 描述: 查询 `user` 表，返回测试行数据。
  - 响应示例 (200):

```json
{
  "success": true,
  "message": "数据库连接成功！",
  "testData": [ /* rows */ ]
}
```

- Path: `POST /api/test`
  - 描述: 向 `users` 表插入示例数据，请求体 `{ name, age }`。
  - 响应示例 (201):

```json
{
  "success": true,
  "message": "数据插入成功",
  "insertId": 123
}
```

实现： [app/api/test/route.ts](app/api/test/route.ts#L1)

### 新增账号
- Path: `POST /controller/add`
- 描述: 新增一条加密账号记录，成功返回新记录 ID。
- 请求体 (JSON) - `AddAccountDTO`（详见 DTO 文件）:

```json
{
  "web": "string",
  "acc": "string",
  "pin": "string",
  "description": "string (可选)",
  "classify": "string"
}
```

- 成功响应 (201):

```json
{
  "success": true,
  "message": "账号新增成功！",
  "data": { "id": 123 }
}
```

- 失败响应 (400)：常见错误 `字段 web 不能为空` 等。

实现： [app/controller/add/route.ts](app/controller/add/route.ts#L1)

### 删除账号
- Path: `POST /controller/delete`
- 描述: 根据 ID 删除账号。
- 请求体 (JSON) - `DeleteAccountDTO`:

```json
{ "id": 123 }
```

- 成功响应 (200):

```json
{
  "success": true,
  "message": "ID 为 123 的账号已成功删除！"
}
```

- 失败响应 (400):

```json
{
  "success": false,
  "message": "删除账号失败",
  "error": "未找到 ID 为 123 的账号记录，可能已被删除"
}
```

实现： [app/controller/delete/route.ts](app/controller/delete/route.ts#L1)

### 获取账号列表
- Path: `GET /controller/list`
- 描述: 获取所有加密账号数据，客户端拉取后负责解密 `pin`。
- 成功响应 (200):

```json
{
  "success": true,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "web": "示例站点",
      "acc": "user@example.com",
      "pin": "ENCRYPTED_PIN",
      "description": null,
      "classify": "个人"
    }
  ]
}
```

实现： [app/controller/list/route.ts](app/controller/list/route.ts#L1)

### 更新账号
- Path: `POST /controller/update`
- 描述: 更新账号信息，全部必填字段必须校验通过。
- 请求体 (JSON) - `UpdateAccountDTO`:

```json
{
  "id": 123,
  "web": "string",
  "acc": "string",
  "pin": "string",
  "description": "string (可选)",
  "classify": "string"
}
```

- 成功响应 (200):

```json
{
  "success": true,
  "message": "ID 为 123 的账号信息已修改成功！"
}
```

- 失败响应 (400): 常见为校验失败或未找到记录。

实现： [app/controller/update/route.ts](app/controller/update/route.ts#L1)

### 密钥轮转（批量）
- Path: `POST /controller/rotate`
- 描述: 批量更新 `pin`，在单个事务内完成，失败则回滚。
- 请求体 (JSON) - `RotateAccountDTO`:

```json
{
  "items": [
    { "id": 1, "acc": "user1", "pin": "NEW_ENCRYPTED_PIN" },
    { "id": 2, "acc": "user2", "pin": "NEW_ENCRYPTED_PIN" }
  ]
}
```

- 成功响应 (200):

```json
{
  "success": true,
  "message": "成功完成 2 条数据的密钥轮转！"
}
```

- 失败响应 (400)：例如 `轮转数据列表不能为空`，并且变更已回滚。

实现与校验逻辑： [lib/service/accServ.ts](lib/service/accServ.ts#L1-L220)

---

## 常见错误与 HTTP 状态码
- 200: 查询或普通成功。
- 201: 资源创建成功（新增）。
- 400: 客户端请求错误或业务校验失败。
- 500: 服务端异常，例如 DB 连接错误。

常见错误描述示例：
- "字段 web 不能为空"
- "未找到 ID 为 X 的账号记录"
- "轮转数据列表不能为空"

---

## 建议
- 在写接口前统一约定错误码与错误结构（例如 `code` 字段），便于前端处理。
- 为所有写操作补充鉴权与操作审计日志。
- 明确 `pin` 的加解密规范与密钥管理流程，配合密钥轮转接口使用。

---
