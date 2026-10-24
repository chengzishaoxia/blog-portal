import {defineStore} from 'pinia';
import {ref} from 'vue';
import {AuthAPI, type EmailCodeLoginFormData, type EmailLoginFormData, type LoginFormData, type LoginResult, type RegisterFormData} from '@/api/auth';
import {fetchCurrentUser, type CurrentUserDTO} from '@/api/user';
import { useChat } from '@/composables/useChat';

interface TokenBundle extends LoginResult {
    loginAt: number;
    username: string
}

const REFRESH_KEY = 'BLOG_PORTAL_REFRESH_TOKEN';
const ACCESS_KEY = 'BLOG_PORTAL_ACCESS_TOKEN';
const EXPIRES_KEY = 'BLOG_PORTAL_EXPIRES_AT';
const USERNAME_KEY = 'BLOG_PORTAL_USERNAME';
const REDIRECT_KEY = 'BLOG_PORTAL_PENDING_REDIRECT';
const TOKEN_COOKIE_NAME = import.meta.env.VITE_APP_TOKEN_COOKIE_NAME || 'satoken';

function getCookie(name: string): string {
    if (typeof document === 'undefined') return '';
    const prefix = name + '=';
    return document.cookie.split(';').map(s=>s.trim()).find(c=>c.startsWith(prefix))?.slice(prefix.length) || '';
}

// 新增：删除 Cookie（尝试基础与可能的域名写入方式）
function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  const expires = 'Thu, 01 Jan 1970 00:00:00 GMT';
  const base = `${name}=; expires=${expires}; path=/`;
  document.cookie = base; // 基础
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host) {
      document.cookie = `${base}; domain=${host}`;
      const parts = host.split('.');
      if (parts.length > 2) {
        const topDomain = parts.slice(-2).join('.');
        document.cookie = `${base}; domain=.${topDomain}`;
      } else if (parts.length === 2) {
        document.cookie = `${base}; domain=.${host}`;
      }
    }
  }
}

function persist(t: TokenBundle) {
    localStorage.setItem(ACCESS_KEY, t.accessToken);
    localStorage.setItem(REFRESH_KEY, t.refreshToken);
    localStorage.setItem(EXPIRES_KEY, String(Date.now() + t.expiresIn * 1000 - 5000));
    localStorage.setItem(USERNAME_KEY, t.username);
}

function clearPersist() {
    [ACCESS_KEY, REFRESH_KEY, EXPIRES_KEY, USERNAME_KEY].forEach(k => localStorage.removeItem(k));
}

function loadPersist(): Partial<TokenBundle> {
    const accessToken = localStorage.getItem(ACCESS_KEY) || '';
    const refreshToken = localStorage.getItem(REFRESH_KEY) || '';
    const exp = Number(localStorage.getItem(EXPIRES_KEY) || 0);
    const username = localStorage.getItem(USERNAME_KEY) || '';
    return {
        accessToken,
        refreshToken,
        username,
        expiresIn: exp ? Math.max(0, (exp - Date.now()) / 1000) : 0,
        tokenType: 'Bearer',
        loginAt: 0
    } as any;
}

export const useAuthStore = defineStore('auth', () => {
    const cached = loadPersist();
    const accessToken = ref(getCookie(TOKEN_COOKIE_NAME) || cached.accessToken || ''); // 初始优先 Cookie，再退回本地缓存
    const refreshToken = ref('');
    const expiresAt = ref(0); // timestamp ms
    const username = ref('');
    const loading = ref(false);
    const showDialog = ref(false);
    const activeTab = ref<'login' | 'register'>('login');
    const profile = ref<CurrentUserDTO | null>(null);
    const pendingRedirect = ref<string | null>(sessionStorage.getItem(REDIRECT_KEY));

    // 初始化本地缓存
    refreshToken.value = cached.refreshToken || '';
    username.value = cached.username || '';
    expiresAt.value = cached.expiresIn ? Date.now() + cached.expiresIn * 1000 : 0;

    const isAuthed = () => !!accessToken.value;

    function open(tab: 'login' | 'register' = 'login') {
        activeTab.value = tab;
        showDialog.value = true;
    }

    function close() {
        showDialog.value = false;
    }

    function setRedirect(path: string) {
        pendingRedirect.value = path;
        sessionStorage.setItem(REDIRECT_KEY, path);
    }

    function clearRedirect() {
        pendingRedirect.value = null;
        sessionStorage.removeItem(REDIRECT_KEY);
    }

    function applyLoginResult(res: LoginResult, loginName: string) {
        accessToken.value = res.accessToken;
        refreshToken.value = res.refreshToken;
        expiresAt.value = Date.now() + res.expiresIn * 1000 - 5000;
        username.value = loginName;
        persist({...res, loginAt: Date.now(), username: loginName});
    }

    async function finalizeSuccessfulLogin() {
        await loadProfile();
        const redirect = pendingRedirect.value;
        clearRedirect();
        close();
        if (redirect) {
            setTimeout(() => window.location.pathname + window.location.search !== redirect && (window.location.href = redirect), 0);
        }
    }

    async function loadProfile() {
        if (!accessToken.value) {
            profile.value = null;
            return;
        }
        try {
            profile.value = await fetchCurrentUser();
            if (profile.value?.nickname) {
                username.value = profile.value.nickname || username.value;
            }
        } catch { /* ignore */
        }
    }

    async function login(form: LoginFormData) {
        loading.value = true;
        try {
            const res = await AuthAPI.login(form);
            applyLoginResult(res, form.username);
            await finalizeSuccessfulLogin();
        } finally {
            loading.value = false;
        }
    }

    async function loginByEmail(form: EmailLoginFormData) {
        loading.value = true;
        try {
            const res = await AuthAPI.loginByEmail(form);
            applyLoginResult(res, form.email);
            await finalizeSuccessfulLogin();
        } finally {
            loading.value = false;
        }
    }

    async function loginByEmailCode(form: EmailCodeLoginFormData) {
        loading.value = true;
        try {
            const res = await AuthAPI.loginByEmailCode(form);
            applyLoginResult(res, form.email);
            await finalizeSuccessfulLogin();
        } finally {
            loading.value = false;
        }
    }

    async function register(form: RegisterFormData) {
        loading.value = true;
        try {
            if (form.password !== form.confirmPassword) throw new Error('两次密码不一致');
            const res = await AuthAPI.register(form);
            applyLoginResult(res, form.email);
            await finalizeSuccessfulLogin();
        } finally {
            loading.value = false;
        }
    }

    async function consumeOauthCallback(params: Record<string, unknown>) {
        const nextAccessToken = typeof params.accessToken === 'string' ? params.accessToken : '';
        const error = typeof params.error === 'string' ? params.error : '';
        if (!nextAccessToken) {
            throw new Error(error || '第三方登录失败');
        }
        const nextRefreshToken = typeof params.refreshToken === 'string' ? params.refreshToken : '';
        const nextTokenType = typeof params.tokenType === 'string' ? params.tokenType : 'Bearer';
        const nextExpiresIn = Number(params.expiresIn || 0);
        applyLoginResult({
            accessToken: nextAccessToken,
            refreshToken: nextRefreshToken,
            tokenType: nextTokenType,
            expiresIn: Number.isFinite(nextExpiresIn) && nextExpiresIn > 0 ? nextExpiresIn : 1800,
        }, username.value || '第三方用户');
        await loadProfile();
        close();
        const redirect = pendingRedirect.value || '/';
        clearRedirect();
        return redirect;
    }

    async function ensureFreshToken() {
        if (!accessToken.value || !refreshToken.value) return;
        if (Date.now() + 20_000 < expiresAt.value) return; // 距离过期还有 20 秒以上则不刷新
        try {
            const res = await AuthAPI.refreshToken(refreshToken.value);
            refreshToken.value = res.refreshToken;
            expiresAt.value = Date.now() + res.expiresIn * 1000 - 5000;
            persist({...res, loginAt: Date.now(), username: username.value});
        } catch (e) {
            // 刷新失败则清理
            logout();
        }
    }

    async function logout() {
        try {
            if (accessToken.value) await AuthAPI.logout();
        } catch { /* ignore */ }
        // WebSocket 断开
        try {
            const chat = useChat();
            chat.disconnect();
        } catch { /* ignore */ }
        // 删除 Cookie（如果非 HttpOnly）
        deleteCookie(TOKEN_COOKIE_NAME);
        accessToken.value = '';
        refreshToken.value = '';
        expiresAt.value = 0;
        username.value = '';
        profile.value = null;
        clearPersist();
        clearRedirect();
    }

    return {
        accessToken,
        refreshToken,
        expiresAt,
        username,
        profile,
        loading,
        showDialog,
        activeTab,
        isAuthed,
        open,
        close,
        setRedirect,
        login,
        loginByEmail,
        loginByEmailCode,
        register,
        consumeOauthCallback,
        ensureFreshToken,
        logout,
        loadProfile
    };
});
