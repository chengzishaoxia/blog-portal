/**
 * API 响应码枚举（与 admin 端保持一致）
 * 说明：保留字符串编码，同时在使用处做向后兼容（旧的数值 20000 仍视为成功）。
 */
export const enum ApiCodeEnum {
  /** 成功 */
  SUCCESS = "00000",
  /** 通用错误 */
  ERROR = "B0001",
  /** 访问令牌无效或过期 */
  ACCESS_TOKEN_INVALID = "A0230",
  /** 刷新令牌无效或过期 */
  REFRESH_TOKEN_INVALID = "A0231",
}

