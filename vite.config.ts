import { defineConfig, loadEnv, type ConfigEnv, type UserConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';

export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  // 加载对应模式下的环境变量 (.env, .env.development, .env.production 等)
  const env = loadEnv(mode, process.cwd());
  const API_BASE = env.VITE_APP_BASE_API || '/api';
  const API_URL = env.VITE_APP_API_URL || 'http://localhost:8989'; // 例如: https://api.example.com

  if (!API_URL) {
    // 构建/启动时缺少变量给出提示（不会阻止运行）
    console.warn('[vite-config] VITE_APP_API_URL 未设置，开发代理将被跳过');
  }

  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag === 'meting-js',
          },
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 5175,
      host: '0.0.0.0',
      proxy: API_URL
        ? {
            // 动态 key，允许自定义前缀（默认为 /api）
            [API_BASE]: {
              target: API_URL,
              changeOrigin: true,
              // 若前缀不是 /api，但后端不需要该前缀，可以启用下面的 rewrite
              // rewrite: p => p.replace(new RegExp('^' + API_BASE), ''),
            },
          }
        : undefined,
    },
    build: {
      sourcemap: true,
      chunkSizeWarningLimit: 900,
    },
  };
});
