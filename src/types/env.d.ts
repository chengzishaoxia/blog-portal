/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CHAT_WS?: string;
  readonly VITE_APP_TOKEN_COOKIE_NAME?: string;
  // 在此可继续扩展其他环境变量声明
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
