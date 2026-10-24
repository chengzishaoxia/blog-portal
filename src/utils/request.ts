import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/store/auth-store';
import { ApiCodeEnum } from '@/enums/api/code-enum';

// 与 admin 保持风格：统一成功 code=20000，其它视为业务异常；
// 前台只在需要时 (withToken) 携带 token；处理登录过期/未授权。

const httpRequest = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API || '/api',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json;charset=utf-8' },
});

const TOKEN_HEADER_NAME = import.meta.env.VITE_APP_TOKEN_COOKIE_NAME || 'satoken';

// 控制只弹一次登录失效提示
let showingLogin = false;

function messageError(msg?: string) {
  ElMessage({
    type: 'error',
    message: msg || '请求失败',
    showClose: true,
    zIndex: 99999, // 确保层级最高
    grouping: true,
    duration: 3000,
    offset: 20,
  });
}

httpRequest.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const auth = useAuthStore();
    config.headers.systemType = 'portal';
    // 移除显式 Authorization，统一改为 Sa-Token 的 token-name 请求头或 Cookie
    if (config.headers?.Authorization) delete config.headers.Authorization;
    if ((config.headers as any)?.withToken) delete (config.headers as any).withToken; // 兼容旧逻辑
    if (auth.accessToken && !config.headers?.[TOKEN_HEADER_NAME]) {
      config.headers[TOKEN_HEADER_NAME] = auth.accessToken;
    }
    return config;
  },
  error => Promise.reject(error)
);

httpRequest.interceptors.response.use(
  (response: AxiosResponse<any>) => {
    // 文件/流 直接返回
    if (response.config.responseType === 'blob') return response;

    const raw = response.data;
    // 标准包装
    if (raw && typeof raw === 'object' && 'code' in raw) {
      const { code, data, msg } = raw as { code: any; data: any; msg?: string };
      const codeStr = String(code);

      if (codeStr === ApiCodeEnum.SUCCESS || codeStr === '20000') return data;

      if (codeStr === ApiCodeEnum.ACCESS_TOKEN_INVALID || codeStr === ApiCodeEnum.REFRESH_TOKEN_INVALID) {
        if (!showingLogin) {
          showingLogin = true;
          messageError(msg || '登录状态已失效，请重新登录');
          const auth = useAuthStore();
          auth.logout().finally(() => auth.open('login'));
          setTimeout(() => (showingLogin = false), 800);
        }
        return Promise.reject(new Error(msg || '登录已过期'));
      }

      messageError(msg || '系统出错');
      return Promise.reject(new Error(msg || 'Business Error'));
    }

    // 未包装 => 直接返回原始数据 (例如登录接口)
    return raw;
  },
  async error => {
    const { response } = error;
    const auth = useAuthStore();

    if (!response) {
      messageError('网络连接失败，请检查网络');
      return Promise.reject(error);
    }

    const { status, data: raw } = response;
    let code: string | undefined;
    let msg: string | undefined;
    if (raw && typeof raw === 'object') {
      code = String((raw as any).code);
      msg = (raw as any).msg || (raw as any).message;
    }

    if (code === ApiCodeEnum.ACCESS_TOKEN_INVALID || code === ApiCodeEnum.REFRESH_TOKEN_INVALID || status === 401) {
      if (!showingLogin) {
        showingLogin = true;
        messageError(msg || (status === 401 ? '未授权或登录已过期' : '登录状态已失效，请重新登录'));
        await auth.logout();
        auth.open('login');
        setTimeout(() => (showingLogin = false), 800);
      }
      return Promise.reject(new Error(msg || 'Unauthorized'));
    }

    messageError(msg || `请检查后端服务是否启动`);
    return Promise.reject(error);
  }
);

export default httpRequest;
