<template>
  <teleport to="body">
    <div v-if="auth.showDialog" class="auth-mask" @click.self="auth.close()">
      <div class="auth-panel" role="dialog" aria-modal="true" aria-labelledby="auth-dialog-title">
        <header class="panel-head">
          <h2 id="auth-dialog-title" class="panel-title">{{ auth.activeTab === 'login' ? '用户登录' : '用户注册' }}</h2>
          <button class="close-btn" aria-label="关闭" @click="auth.close()">×</button>
        </header>
        <nav class="tab-bar" aria-label="认证切换">
          <button :class="['tab-btn', {active: auth.activeTab==='login'}]" @click="switchTab('login')">登录</button>
          <button :class="['tab-btn', {active: auth.activeTab==='register'}]" @click="switchTab('register')">注册</button>
        </nav>
        <section class="panel-body">
          <form v-if="auth.activeTab==='login'" class="form" @submit.prevent="submitLogin">
            <div class="mode-switch">
              <button type="button" :class="['mode-btn', { active: loginMode === 'password' }]" @click="loginMode = 'password'">邮箱密码登录</button>
              <button type="button" :class="['mode-btn', { active: loginMode === 'code' }]" @click="loginMode = 'code'">邮箱验证码登录</button>
            </div>
            <div class="form-row">
              <label>邮箱</label>
              <input v-model.trim="currentLoginForm.email" type="email" autocomplete="email" placeholder="请输入已注册邮箱" required/>
            </div>
            <div v-if="loginMode === 'password'" class="form-row">
              <label>密码</label>
              <input v-model.trim="emailPasswordForm.password" type="password" autocomplete="current-password" required/>
            </div>
            <div v-else class="form-row code-row">
              <label>邮箱验证码</label>
              <div class="cap-box">
                <input v-model.trim="emailCodeLoginForm.code" required maxlength="6" placeholder="输入6位验证码"/>
                <button type="button" class="mini-btn" @click="sendEmailCode('login')" :disabled="loginEmailCodeLoading || loginEmailCodeTimer > 0">
                  {{ loginEmailCodeTimer > 0 ? `${loginEmailCodeTimer}s` : '发送验证码' }}
                </button>
              </div>
            </div>
            <div class="form-row actions">
              <button type="submit" class="primary-btn" :disabled="auth.loading">{{
                  auth.loading ? '登录中...' : (loginMode === 'password' ? '邮箱密码登录' : '邮箱验证码登录')
                }}
              </button>
            </div>
            <div class="login-tip">
              <span class="tip-link" @click="switchTab('register')">立即注册</span>
              <span class="tip-text">邮箱密码和邮箱验证码二选一即可</span>
            </div>
            <!-- <div class="social-block">
              <div class="social-login-title">社交账号登录</div>
              <div class="social-login-wrapper">
                <button type="button" class="gitee-entry" :disabled="auth.loading" @click="openGiteeLogin" aria-label="使用 Gitee 登录">
                  <span class="gitee-mark">G</span>
                </button>
              </div>
            </div> -->
          </form>

          <form v-else class="form" @submit.prevent="submitRegister">
            <div class="form-row">
              <label>邮箱</label>
              <input v-model.trim="regForm.email" type="email" autocomplete="email" placeholder="请输入注册邮箱" required/>
            </div>
            <div class="form-row code-row">
              <label>注册验证码</label>
              <div class="cap-box">
                <input v-model.trim="regForm.code" required maxlength="6" placeholder="输入6位验证码"/>
                <button type="button" class="mini-btn" @click="sendEmailCode('register')" :disabled="registerEmailCodeLoading || registerEmailCodeTimer > 0">
                  {{ registerEmailCodeTimer > 0 ? `${registerEmailCodeTimer}s` : '发送验证码' }}
                </button>
              </div>
            </div>
            <div class="form-row">
              <label>密码</label>
              <input v-model.trim="regForm.password" type="password" required minlength="6"/>
            </div>
            <div class="form-row">
              <label>确认密码</label>
              <input v-model.trim="regForm.confirmPassword" type="password" required minlength="6"/>
            </div>
            <p v-if="regForm.password && regForm.confirmPassword && regForm.password!==regForm.confirmPassword"
               class="warn-text">两次密码不一致</p>
            <div class="form-row actions">
              <button type="submit" class="primary-btn"
                      :disabled="auth.loading || regForm.password!==regForm.confirmPassword">
                {{ auth.loading ? '提交中...' : '邮箱注册并登录' }}
              </button>
            </div>
            <div class="login-tip register-tip">
              <span class="tip-link" @click="switchTab('login')">返回登录</span>
              <span class="tip-text">注册后会自动完成登录</span>
            </div>
          </form>
        </section>
      </div>
    </div>
  </teleport>
</template>
<script setup lang="ts">
import {computed, reactive, ref} from 'vue';
import {useIntervalFn} from '@vueuse/core';
import {ElMessage} from 'element-plus';
import {useAuthStore} from '@/store/auth-store';
import {AuthAPI} from '@/api/auth';

const auth = useAuthStore();

const loginMode = ref<'password' | 'code'>('password');
const emailPasswordForm = reactive({email: '', password: ''});
const emailCodeLoginForm = reactive({email: '', code: ''});
const regForm = reactive({email: '', code: '', password: '', confirmPassword: ''});

const loginEmailCodeLoading = ref(false);
const loginEmailCodeTimer = ref(0);
const registerEmailCodeLoading = ref(false);
const registerEmailCodeTimer = ref(0);

const { pause: pauseLoginEmailCode, resume: resumeLoginEmailCode } = useIntervalFn(() => {
  loginEmailCodeTimer.value -= 1;
  if (loginEmailCodeTimer.value <= 0) {
    pauseLoginEmailCode();
  }
}, 1000, { immediate: false });

const { pause: pauseRegisterEmailCode, resume: resumeRegisterEmailCode } = useIntervalFn(() => {
  registerEmailCodeTimer.value -= 1;
  if (registerEmailCodeTimer.value <= 0) {
    pauseRegisterEmailCode();
  }
}, 1000, { immediate: false });

const currentLoginForm = computed(() => loginMode.value === 'password' ? emailPasswordForm : emailCodeLoginForm);

function switchTab(tab: 'login' | 'register') {
  auth.activeTab = tab;
}

async function submitLogin() {
  if (loginMode.value === 'password') {
    if (!emailPasswordForm.email || !emailPasswordForm.password) return;
    await auth.loginByEmail(emailPasswordForm);
    return;
  }
  if (!emailCodeLoginForm.email || !emailCodeLoginForm.code) return;
  await auth.loginByEmailCode(emailCodeLoginForm);
}

async function submitRegister() {
  if (!regForm.email || !regForm.code || !regForm.password) return;
  await auth.register(regForm);
}

async function sendEmailCode(scene: 'login' | 'register') {
  const email = scene === 'login' ? emailCodeLoginForm.email : regForm.email;
  if (!email) {
    ElMessage.warning('请先输入邮箱');
    return;
  }
  try {
    if (scene === 'login') {
      loginEmailCodeLoading.value = true;
      await AuthAPI.sendEmailCode(email);
      loginEmailCodeTimer.value = 60;
      resumeLoginEmailCode();
    } else {
      registerEmailCodeLoading.value = true;
      await AuthAPI.sendRegisterEmailCode(email);
      registerEmailCodeTimer.value = 60;
      resumeRegisterEmailCode();
    }
    ElMessage.success('验证码已发送');
  } finally {
    if (scene === 'login') {
      loginEmailCodeLoading.value = false;
    } else {
      registerEmailCodeLoading.value = false;
    }
  }
}

async function openGiteeLogin() {
  const authorizeUrl = await AuthAPI.getSocialAuthorizeUrl('gitee');
  window.location.href = authorizeUrl;
}

</script>
<style scoped>
.auth-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .45);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: fadeIn .25s ease;
}

.auth-panel {
  width: min(380px, 92%);
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 22px 60px -28px rgba(15, 23, 42, .35);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: panelIn .32s ease;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.2rem .2rem;
}

.panel-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #303133;
}

.close-btn {
  border: 0;
  background: transparent;
  color: #909399;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  padding: .25rem .4rem;
}

.tab-bar {
  display: flex;
  gap: .5rem;
  padding: 0 1.2rem .75rem;
}

.tab-btn {
  flex: 1;
  border: 1px solid #e4e7ed;
  background: #fff;
  padding: .5rem .75rem;
  cursor: pointer;
  font-size: .78rem;
  border-radius: 8px;
  font-weight: 600;
  color: #606266;
  transition: .25s ease;
}

.tab-btn.active {
  border-color: #49b1f5;
  color: #49b1f5;
  background: rgba(73, 177, 245, .08);
}

.panel-body {
  padding: .1rem 1.2rem 1.25rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: .75rem;
}

.mode-switch {
  display: flex;
  gap: .5rem;
}

.mode-btn {
  flex: 1;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafafa;
  padding: .55rem .75rem;
  font-size: .72rem;
  font-weight: 600;
  cursor: pointer;
  transition: .25s ease;
  color: #606266;
}

.mode-btn.active {
  border-color: #49b1f5;
  background: #ecf8ff;
  color: #49b1f5;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: .35rem;
}

.form-row label {
  font-size: .75rem;
  font-weight: 600;
  color: #606266;
}

.form-row input {
  border: 1px solid #dcdfe6;
  background: #fff;
  padding: .7rem .8rem;
  border-radius: 8px;
  font-size: .85rem;
  outline: none;
  transition: border-color .25s ease, box-shadow .25s ease;
}

.form-row input:focus {
  border-color: #49b1f5;
  box-shadow: 0 0 0 3px rgba(73, 177, 245, .12);
}

.code-row .cap-box {
  display: flex;
  gap: .5rem;
  align-items: center;
}

.mini-btn {
  border: 0;
  background: #49b1f5;
  color: #fff;
  padding: .72rem .9rem;
  border-radius: 8px;
  font-size: .75rem;
  cursor: pointer;
  white-space: nowrap;
}

.actions {
  margin-top: .2rem;
}

.login-tip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: .75rem;
  font-size: .74rem;
}

.register-tip {
  margin-top: -.1rem;
}

.tip-link {
  color: #49b1f5;
  cursor: pointer;
}

.tip-text {
  color: #909399;
}

.social-block {
  margin-top: .15rem;
}

.social-login-title {
  margin-top: .2rem;
  color: #b5b5b5;
  font-size: .75rem;
  text-align: center;
}

.social-login-title::before,
.social-login-title::after {
  content: "";
  display: inline-block;
  background-color: #d8d8d8;
  width: 60px;
  height: 1px;
  margin: 0 12px;
  vertical-align: middle;
}

.social-login-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.gitee-entry {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 0;
  background: #c71d23;
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 24px -16px rgba(199, 29, 35, .95);
}

.gitee-mark {
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1;
}

.gitee-entry:disabled {
  opacity: .55;
  cursor: not-allowed;
  box-shadow: none;
}

.primary-btn {
  width: 100%;
  border: 0;
  background: #70b6ff;
  color: #fff;
  padding: .76rem .9rem;
  font-size: .88rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.primary-btn:disabled,
.mini-btn:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.warn-text {
  margin: -.15rem 0 0;
  font-size: .72rem;
  color: #dc2626;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes panelIn {
  0% {
    transform: translateY(18px) scale(.98);
    opacity: 0;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

:global(.dark) .auth-panel {
  background: var(--card-bg, #1c2229);
}

:global(.dark) .tab-btn,
:global(.dark) .mode-btn {
  background: rgba(255, 255, 255, .06);
  border-color: rgba(255, 255, 255, .08);
  color: #d1d5db;
}

:global(.dark) .tab-btn.active,
:global(.dark) .mode-btn.active {
  border-color: #49b1f5;
  background: rgba(73, 177, 245, .12);
  color: #7cc8ff;
}

:global(.dark) .form-row input {
  background: #101317;
  border-color: rgba(255, 255, 255, .12);
  color: #e5e7eb;
}

:global(.dark) .panel-title,
:global(.dark) .form-row label {
  color: #e5e7eb;
}

:global(.dark) .tip-text,
:global(.dark) .social-login-title {
  color: rgba(229, 231, 235, .62);
}

:global(.dark) .form-row input:focus {
  border-color: #49b1f5;
  box-shadow: 0 0 0 3px rgba(73, 177, 245, .16);
}
</style>
