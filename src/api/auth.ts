import request from '@/utils/request';

// 复用后端 /api/v1/auth 系列接口
// 在 blog-portal 中 baseURL 已配置为 /api

export interface CaptchaInfo {
    captchaKey: string;
    captchaBase64: string;
}

export interface LoginFormData {
    username: string;
    password: string;
    captchaKey: string;
    captchaCode: string;
    rememberMe?: boolean;
}

export interface EmailLoginFormData {
    email: string;
    password: string;
}

export interface EmailCodeLoginFormData {
    email: string;
    code: string;
}

export type SocialProvider = 'qq' | 'gitee' | 'github';

export interface LoginResult {
    accessToken: string;
    refreshToken: string;
    tokenType: string; // e.g. Bearer
    expiresIn: number; // seconds
}

export interface RegisterFormData {
    email: string;
    code: string;
    password: string;
    confirmPassword: string;
}

function unwrap<T>(resp: any): T {
    if (resp && typeof resp === 'object' && 'data' in resp) return resp.data as T;
    return resp as T;
}

export const AuthAPI = {
    getCaptcha(): Promise<CaptchaInfo> {
        return request.get('/v1/auth/captcha').then(r => unwrap<CaptchaInfo>(r));
    },
    login(form: LoginFormData): Promise<LoginResult> {
        // 后端要求 multipart/form-data（参考 admin）
        const fd = new FormData();
        fd.append('username', form.username);
        fd.append('password', form.password);
        fd.append('captchaKey', form.captchaKey);
        fd.append('captchaCode', form.captchaCode);
        fd.append('rememberMe', String(!!form.rememberMe));
        return request
            .post('/v1/auth/login', fd, {headers: {'Content-Type': 'multipart/form-data'}})
            .then(r => unwrap<LoginResult>(r));
    },
    loginByEmail(form: EmailLoginFormData): Promise<LoginResult> {
        return request
            .post('/v1/auth/login/email', form)
            .then(r => unwrap<LoginResult>(r));
    },
    loginByEmailCode(form: EmailCodeLoginFormData): Promise<LoginResult> {
        return request
            .post('/v1/auth/login/email/code', form)
            .then(r => unwrap<LoginResult>(r));
    },
    sendEmailCode(email: string): Promise<void> {
        const fd = new FormData();
        fd.append('email', email);
        return request
            .post('/v1/auth/email/code', fd, {headers: {'Content-Type': 'multipart/form-data'}})
            .then(() => undefined);
    },
    sendRegisterEmailCode(email: string): Promise<void> {
        const fd = new FormData();
        fd.append('email', email);
        return request
            .post('/v1/auth/email/register/code', fd, {headers: {'Content-Type': 'multipart/form-data'}})
            .then(() => undefined);
    },
    getSocialAuthorizeUrl(source: SocialProvider): Promise<string> {
        return request
            .get(`/v1/auth/social/render/${source}`)
            .then(r => unwrap<string>(r));
    },
    refreshToken(refreshToken: string): Promise<LoginResult> {
        return request
            .post('/v1/auth/refresh-token', null, {params: {refreshToken}, headers: {Authorization: 'no-auth'}})
            .then(r => unwrap<LoginResult>(r));
    },
    logout(): Promise<void> {
        return request.delete('/v1/auth/logout').then(() => {
        });
    },
    // 注册接口：返回与登录相同的 token 结构；若接口未开放(404)则抛出错误
    register(form: RegisterFormData): Promise<LoginResult> {
        return request
            .post('/v1/auth/register', form)
            .then(r => unwrap<LoginResult>(r))
            .catch((e) => {
                if ((e?.response?.status) === 404) {
                    console.warn('[register] endpoint not found');
                    throw new Error('后端未开放注册接口');
                }
                throw e;
            });
    }
};
