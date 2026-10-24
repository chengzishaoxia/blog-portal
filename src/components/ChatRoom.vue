<template>
  <div class="chat-room">
    <header class="chat-header">
      <div class="left-side">
        <strong class="title">💬 聊天室</strong>
        <span v-if="connecting" class="status pending">连接中…</span>
        <span v-else-if="connected" class="status ok">已连接</span>
        <span v-else class="status err">未连接</span>
      </div>
      <div class="right-side online">
        <span class="online-label">在线</span>
        <span class="count-pill" :title="'后端推送在线人数（会话去重）'">{{ onlineCount }}</span>
        <transition-group name="fade-scale" tag="div" class="online-users">
          <span v-for="u in onlineUsers" :key="u" :class="['user-pill', { self: Number(u) === numericCurrentUserId }]"
                :title="Number(u) === numericCurrentUserId ? '这是你' : '用户ID ' + u">
            {{ userDisplayName(u) }}
          </span>
        </transition-group>
      </div>
    </header>

    <main class="chat-body" ref="scrollPanel" @scroll="handleScroll">
      <div v-if="!messages.length && connected && !connecting" class="empty-hint fade-in">暂无消息，开始发送第一条吧 🚀
      </div>
      <div v-if="connecting" class="empty-hint">正在连接服务器…</div>
      <div v-if="!connected && !connecting" class="empty-hint">连接已断开，可稍后自动重试或刷新页面。</div>

      <div v-for="group in groupedMessages" :key="group.dateKey">
        <div class="date-sep"><span>{{ group.label }}</span></div>
        <transition-group name="msg-fade" tag="div" class="msg-group">
          <div v-for="m in group.items" :key="m._id" :class="['msg-wrapper', { mine: isMine(m) }]">
            <!-- avatar + bubble layout -->
            <template v-if="!isMine(m)">
              <div class="avatar-box">
                <img v-if="m.fromAvatar" class="avatar" :src="m.fromAvatar" :alt="userDisplayName(m.fromUserId)"/>
                <span v-else class="avatar placeholder" :data-initial="initialOf(userDisplayName(m.fromUserId))"></span>
              </div>
            </template>
            <div :class="['msg', m.type.toLowerCase(), { mine: isMine(m), private: m.isPrivate }]">
              <template v-if="m.type === 'CHAT'">
                <div class="meta">
                  <span class="from">
                    {{ isMine(m) ? '我' : userDisplayName(m.fromUserId) }}
                    <template v-if="m.isPrivate && m.toUserId"> → {{
                        Number(m.toUserId) === numericCurrentUserId ? '我' : userDisplayName(m.toUserId)
                      }}</template>
                  </span>
                  <span class="time">{{ formatClock(m.timestamp) }}</span>
                </div>
                <div class="bubble" v-text="m.content"/>
              </template>
              <template v-else-if="m.type === 'IMAGE'">
                <div class="meta">
                  <span class="from">
                    {{ isMine(m) ? '我' : userDisplayName(m.fromUserId) }}
                    <template v-if="m.isPrivate && m.toUserId"> → {{
                        Number(m.toUserId) === numericCurrentUserId ? '我' : userDisplayName(m.toUserId)
                      }}</template>
                  </span>
                  <span class="time">{{ formatClock(m.timestamp) }}</span>
                </div>
                <div class="bubble img-bubble">
                  <img class="img-msg" :src="m.content" alt="img" @load="onImgLoaded" @click="previewImage(m.content)"
                       :style="imageStyle(m)"/>
                </div>
              </template>
              <template v-else-if="m.type === 'JOIN' || m.type === 'LEAVE'">
                <div class="sys-line chip">
                  用户 {{ userDisplayName(m.fromUserId) || m.fromUserId || '未知' }}
                  {{ m.type === 'JOIN' ? '加入' : '离开' }}
                  <span class="time">{{ formatClock(m.timestamp) }}</span>
                </div>
              </template>
              <template v-else-if="m.type === 'SYSTEM'">
                <div class="sys-line tag-line">[系统] {{ m.content }} <span class="time">{{
                    formatClock(m.timestamp)
                  }}</span></div>
              </template>
              <template v-else-if="m.type === 'ERROR'">
                <div class="error-line">[错误] {{ m.error }}</div>
              </template>
            </div>
            <template v-if="isMine(m)">
              <div class="avatar-box mine">
                <img v-if="m.fromAvatar" class="avatar" :src="m.fromAvatar" :alt="userDisplayName(m.fromUserId)"/>
                <span v-else class="avatar placeholder" :data-initial="initialOf(userDisplayName(m.fromUserId))"></span>
              </div>
            </template>
          </div>
        </transition-group>
      </div>
      <transition name="fade">
        <button v-if="showScrollBottom" class="scroll-bottom" @click="scrollToBottom" title="回到底部">⬇</button>
      </transition>
    </main>

    <footer class="chat-footer" ref="footerRef">
      <div class="toolbar">
        <div class="target-user-select" ref="userSelectRef">
          <div class="select-trigger" @click="isUserSelectOpen = !isUserSelectOpen" :class="{ open: isUserSelectOpen }">
            <template v-if="selectedUser">
              <img v-if="userCache[toUserId!]?.avatar" :src="userCache[toUserId!]?.avatar" class="selected-avatar"
                   alt="avatar"/>
              <span v-else class="selected-avatar placeholder"
                    :data-initial="initialOf(userDisplayName(toUserId))"></span>
              <span class="selected-name">{{ userDisplayName(toUserId) }}</span>
              <button class="clear-btn" @click.stop="selectUser(undefined)" title="清除选择">×</button>
            </template>
            <template v-else>
              <span class="select-placeholder">广播 (公聊)</span>
            </template>
            <span class="chevron">▾</span>
          </div>
          <transition name="fade-scale">
            <div v-if="isUserSelectOpen" class="select-dropdown">
              <div class="select-item" @click="selectUser(undefined)">
                <span class="item-avatar placeholder">📢</span>
                <span class="item-name">广播 (公聊)</span>
              </div>
              <div v-for="userId in selectableUsers" :key="userId" class="select-item" @click="selectUser(userId)">
                <img v-if="userCache[userId]?.avatar" :src="userCache[userId]?.avatar" class="item-avatar"
                     alt="avatar"/>
                <span v-else class="item-avatar placeholder" :data-initial="initialOf(userDisplayName(userId))"></span>
                <span class="item-name">{{ userDisplayName(userId) }}</span>
              </div>
              <div v-if="!selectableUsers.length" class="empty-option">没有其他在线用户</div>
            </div>
          </transition>
        </div>
        <div class="status-hint" :class="{ on: toUserId }">
          <span v-if="toUserId">将私聊用户 {{ userDisplayName(toUserId) }}</span>
          <span v-else>广播模式</span>
        </div>
      </div>
      <div class="send-row">
        <textarea
            ref="inputRef"
            v-model="input"
            @keydown.enter.exact.prevent="handleSend"
            @keydown.enter.shift.prevent="newline"
            class="msg-input"
            :placeholder="connected ? '输入消息，回车发送，Shift+Enter 换行' : '尚未连接...'"
        />
        <div class="side-actions">
          <div class="emoji-buttons">
            <button ref="emojiTriggerRef" class="mini ghost" :disabled="!connected" @click="toggleEmojiPanel"
                    title="打开表情">😊
            </button>
            <!-- 移除外部上传按钮，上传入口在弹框内 -->
          </div>
          <button class="send-btn" :disabled="!canSend" @click="handleSend">发送 ▶</button>
        </div>
      </div>
    </footer>

    <transition name="fade">
      <div
          v-if="emojiPanelMounted"
          v-show="emojiPanelOpen"
          class="emoji-panel"
          :class="{ 'emoji-panel--glass': enableEmojiBackdrop }"
          :style="emojiPanelStyle"
          ref="emojiPanelRef"
      >
        <div class="panel-header">
          <span class="panel-title">表情选择</span>
          <div class="panel-actions">
            <button class="mini link" @click="activeEmojiTab='builtin'" :class="{ active: activeEmojiTab==='builtin' }">
              表情
            </button>
            <button class="mini link" @click="switchToMy" :class="{ active: activeEmojiTab==='mine' }">我的</button>
            <button v-if="activeEmojiTab==='mine'" class="mini link" @click="chooseEmojiFile" :disabled="emojiLoading">
              上传
            </button>
            <button class="mini ghost" @click="closeEmojiPanel" title="关闭">×</button>
          </div>
        </div>
        <!-- 内置表情 -->
        <div v-show="activeEmojiTab==='builtin'" class="builtin-pane">
          <div class="builtin-emoji-grid">
            <span v-for="e in renderedBuiltinEmojis" :key="e" class="builtin-emoji" @click="insertEmoji(e)" :title="e">{{
                e
              }}</span>
          </div>
          <div v-if="builtinEmojiPending" class="builtin-emoji-hint">表情预热中...</div>
        </div>
        <!-- 我的自定义表情 -->
        <div v-show="activeEmojiTab==='mine'" class="my-pane">
          <div v-if="emojiLoading" class="emoji-loading">
            <div class="spinner kawaii">
              <div class="ring r1"></div>
              <div class="ring r2"></div>
              <div class="ring r3"></div>
              <div class="sparkles" aria-hidden="true">
                <span class="sp s1"></span>
                <span class="sp s2"></span>
                <span class="sp s3"></span>
                <span class="sp s4"></span>
                <span class="sp s5"></span>
              </div>
            </div>
            <div class="emoji-loading-text">{{ emojiUploading ? '上传中...' : '加载中...' }}</div>
            <div v-if="emojiUploading" class="upload-tip">(๑•̀ㅂ•́)و̑ 大图片请稍候 ~</div>
          </div>
          <div v-else-if="!myEmojis.length" class="empty-emoji">暂无表情</div>
          <div v-else class="emoji-grid">
            <div v-for="e in myEmojis" :key="e.id" class="emoji-item" @click="handleEmojiClick(e)">
              <img :src="e.imageUrl" :alt="'emoji'+e.id"/>
            </div>
          </div>
        </div>
      </div>
    </transition>
    <input ref="emojiFileInput" type="file" accept="image/*" style="display:none" @change="onEmojiFileChange"/>
  </div>
</template>
<script setup lang="ts">
import {computed, nextTick, onActivated, onMounted, onUnmounted, reactive, ref, watch} from 'vue';
import {onClickOutside} from '@vueuse/core';
import {useChat} from '@/composables/useChat';
import {type ChatEmojiItem, listMyEmojis, uploadMyEmoji} from '@/services/chatEmoji';
import BUILTIN_EMOJIS from '@/constants/emojis';

type IdleDeadlineLike = { timeRemaining?: () => number; didTimeout?: boolean };

const props = defineProps<{ currentUserId: number | string; }>(); // 移除 token
const numericCurrentUserId = computed(() => Number(props.currentUserId));
const {init, send, sendImage, messages, onlineUsers, connected, connecting} = useChat();
const onlineCount = computed(() => onlineUsers.value.length); // 直接从 onlineUsers 计算在线人数

const input = ref('');
const inputRef = ref<HTMLTextAreaElement | null>(null);
const toUserId = ref<number | undefined>();
const scrollPanel = ref<HTMLElement | null>(null);
const showScrollBottom = ref(false);
const isUserSelectOpen = ref(false);
const userSelectRef = ref(null);
const emojiPanelOpen = ref(false);
const emojiPanelMounted = ref(false);
const activeEmojiTab = ref<'builtin' | 'mine'>('builtin');
// 新增：表情面板与触发按钮引用，便于点击外部关闭
const emojiPanelRef = ref<HTMLElement | null>(null);
const emojiTriggerRef = ref<HTMLElement | null>(null);
// 恢复缺失的引用定义
const myEmojis = ref<ChatEmojiItem[]>([]);
const emojiLoading = ref(false);
const emojiUploading = ref(false); // 新增：区分上传阶段
const myEmojisLoaded = ref(false); // 首次加载标记
const renderedBuiltinEmojis = ref<string[]>([]);
const enableEmojiBackdrop = ref(false);
const footerRef = ref<HTMLElement | null>(null);
const builtinEmojiPending = computed(() => renderedBuiltinEmojis.value.length < BUILTIN_EMOJIS.length);
const BUILTIN_EMOJI_FIRST_BATCH = 48;
const BUILTIN_EMOJI_BATCH_SIZE = 72;
let builtinEmojiBatchTimer: number | null = null;
let emojiWarmupTimer: ReturnType<typeof setTimeout> | null = null;
let emojiWarmupIdleId: number | null = null;

// 表情面板位置样式
const emojiPanelStyle = computed(() => {
  const fh = footerRef.value?.offsetHeight || 130;
  return {bottom: (fh + 12) + 'px'};
});

onClickOutside(userSelectRef, () => isUserSelectOpen.value = false);
// 点击外部关闭表情面板
onClickOutside(emojiPanelRef, () => {
  if (emojiPanelOpen.value) closeEmojiPanel();
}, {ignore: [emojiTriggerRef]});

const selectableUsers = computed(() => {
  return onlineUsers.value.filter(id => Number(id) !== numericCurrentUserId.value);
});

const selectedUser = computed(() => {
  if (!toUserId.value) return null;
  const key = String(toUserId.value);
  return userCache[key] || {id: toUserId.value};
});

function selectUser(id?: number) {
  toUserId.value = id;
  isUserSelectOpen.value = false;
}

// 用户缓存，用于显示昵称/用户名/头像
const userCache = reactive<Record<string, { username?: string; nickname?: string; avatar?: string }>>({});

function cacheFromMessage(m: any) {
  const id = m?.fromUserId;
  if (id == null) return;
  const key = String(id);
  const entry = userCache[key] || (userCache[key] = {});
  // 只在有值时覆盖，避免空串覆盖已有数据
  if (m.fromUsername) entry.username = m.fromUsername;
  if (m.fromNickname) entry.nickname = m.fromNickname;
  if (m.fromAvatar) entry.avatar = m.fromAvatar;
}

watch(messages, (list) => {
  list.forEach(cacheFromMessage);
}, {deep: true, immediate: true});

function userDisplayName(id: any) {
  if (id == null) return '';
  const key = String(id);
  const e = userCache[key];
  return e?.nickname || e?.username || key; // 回退到 id
}

function initialOf(name: string) {
  if (!name) return '?';
  // 取第一个非空白字符
  return name.trim().charAt(0).toUpperCase();
}

function isMine(m: any) {
  return Number(m.fromUserId) === numericCurrentUserId.value;
}

onMounted(() => {
  // 初始化 websocket，不再传 token
  init({});
  detectEmojiPanelBackdrop();
  queueEmojiPanelWarmup();
});


onActivated(() => {
  nextTick(() => {
    scrollToBottom()
  })
})


const canSend = computed(() => connected.value && !!input.value.trim());

function handleSend() {
  if (!canSend.value) return;
  if (send(input.value, toUserId.value)) {
    input.value = '';
    nextTick(scrollToBottom);
  }
}

function newline() {
  input.value += '\n';
}

function closeEmojiPanel() {
  emojiPanelOpen.value = false;
}

// Esc 关闭面板
function handleEsc(e: KeyboardEvent) {
  if (e.key === 'Escape' && emojiPanelOpen.value) {
    e.stopPropagation();
    closeEmojiPanel();
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleEsc);
});
onUnmounted(() => {
  window.removeEventListener('keydown', handleEsc);
  if (builtinEmojiBatchTimer !== null) {
    window.clearTimeout(builtinEmojiBatchTimer);
    builtinEmojiBatchTimer = null;
  }
  if (emojiWarmupTimer !== null) {
    window.clearTimeout(emojiWarmupTimer);
    emojiWarmupTimer = null;
  }
  if (emojiWarmupIdleId !== null && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
    (window as Window & { cancelIdleCallback?: (handle: number) => void }).cancelIdleCallback?.(emojiWarmupIdleId);
    emojiWarmupIdleId = null;
  }
});

function normalizeTimestamp(raw: any): number {
  if (typeof raw === 'number') {
    if (!isFinite(raw)) return Date.now();
    return raw < 1e11 ? raw * 1000 : raw;
  }
  if (typeof raw === 'string') {
    const asNum = Number(raw);
    if (!isNaN(asNum) && isFinite(asNum)) return asNum < 1e11 ? asNum * 1000 : asNum;
    const parsed = Date.parse(raw);
    if (!isNaN(parsed)) return parsed;
  }
  return Date.now();
}

function formatClock(ts?: any) {
  const t = normalizeTimestamp(ts);
  const d = new Date(t);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'});
}

function formatDate(ts: any) {
  const t = normalizeTimestamp(ts);
  const d = new Date(t);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const groupedMessages = computed(() => {
  const groups: { dateKey: string; label: string; items: any[] }[] = [];
  const list = messages.value;
  let lastGroup: any = null;
  const todayStr = formatDate(Date.now());
  const yesterdayStr = formatDate(Date.now() - 86400000);
  list.forEach((m, idx) => {
    const t = normalizeTimestamp((m as any).timestamp);
    const dk = formatDate(t);
    const label = dk === todayStr ? '今天' : dk === yesterdayStr ? '昨天' : dk || '未知日期';
    if (!lastGroup || lastGroup.dateKey !== dk) {
      lastGroup = {dateKey: dk || `unknown-${idx}`, label, items: []};
      groups.push(lastGroup);
    }
    (m as any)._id = `${dk || 'unknown'}-${idx}-${t}-${(m as any).fromUserId || 'sys'}`;
    lastGroup.items.push(m);
  });
  return groups;
});

function scrollToBottom() {
  const el = scrollPanel.value;
  if (!el) return;
  el.scrollTo({top: el.scrollHeight, behavior: 'smooth'});
  showScrollBottom.value = false;
}

function handleScroll() {
  const el = scrollPanel.value;
  if (!el) return;
  const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  showScrollBottom.value = !nearBottom;
}

watch(messages, async () => {
  await nextTick();
  const el = scrollPanel.value;
  if (!el) return;
  const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 160;
  if (nearBottom) scrollToBottom();
}, {deep: true});

function loadMyEmojisOnce() {
  if (myEmojisLoaded.value || emojiLoading.value) return;
  emojiLoading.value = true;
  listMyEmojis()
      .then(list => {
        myEmojis.value = list;
        myEmojisLoaded.value = true;
      })
      .finally(() => emojiLoading.value = false);
}

function detectEmojiPanelBackdrop() {
  if (typeof window === 'undefined' || typeof CSS === 'undefined') {
    return;
  }
  const supportsBackdrop = CSS.supports('backdrop-filter: blur(10px)')
      || CSS.supports('-webkit-backdrop-filter: blur(10px)');
  const navigatorWithHints = navigator as Navigator & { deviceMemory?: number };
  const deviceMemory = navigatorWithHints.deviceMemory ?? 4;
  const hardwareThreads = navigator.hardwareConcurrency ?? 4;
  enableEmojiBackdrop.value = supportsBackdrop && deviceMemory >= 4 && hardwareThreads >= 4;
}

function scheduleIdleTask(task: () => void, timeout = 1200) {
  if (typeof window === 'undefined') {
    return;
  }
  if ('requestIdleCallback' in window) {
    emojiWarmupIdleId = (window as Window & {
      requestIdleCallback?: (cb: (deadline: IdleDeadlineLike) => void, options?: { timeout: number }) => number;
    }).requestIdleCallback?.(() => {
      emojiWarmupIdleId = null;
      task();
    }, {timeout}) ?? null;
    return;
  }
  emojiWarmupTimer = setTimeout(() => {
    emojiWarmupTimer = null;
    task();
  }, 180);
}

function ensureBuiltinEmojisReady() {
  if (renderedBuiltinEmojis.value.length >= BUILTIN_EMOJIS.length) {
    return;
  }
  if (!renderedBuiltinEmojis.value.length) {
    renderedBuiltinEmojis.value = BUILTIN_EMOJIS.slice(0, BUILTIN_EMOJI_FIRST_BATCH);
  }
  queueBuiltinEmojiBatch();
}

function queueBuiltinEmojiBatch() {
  if (builtinEmojiBatchTimer !== null || renderedBuiltinEmojis.value.length >= BUILTIN_EMOJIS.length) {
    return;
  }
  builtinEmojiBatchTimer = window.setTimeout(() => {
    builtinEmojiBatchTimer = null;
    const nextCount = Math.min(renderedBuiltinEmojis.value.length + BUILTIN_EMOJI_BATCH_SIZE, BUILTIN_EMOJIS.length);
    renderedBuiltinEmojis.value = BUILTIN_EMOJIS.slice(0, nextCount);
    if (nextCount < BUILTIN_EMOJIS.length) {
      queueBuiltinEmojiBatch();
    }
  }, 16);
}

function ensureEmojiPanelMounted() {
  if (!emojiPanelMounted.value) {
    emojiPanelMounted.value = true;
  }
  ensureBuiltinEmojisReady();
}

function queueEmojiPanelWarmup() {
  scheduleIdleTask(() => {
    ensureEmojiPanelMounted();
  });
}

function toggleEmojiPanel() {
  if (emojiPanelOpen.value) {
    closeEmojiPanel();
  } else {
    ensureEmojiPanelMounted();
    activeEmojiTab.value = 'builtin';
    emojiPanelOpen.value = true;
  }
}

function switchToMy() {
  activeEmojiTab.value = 'mine';
  loadMyEmojisOnce();
}

function insertEmoji(e: string) {
  // 将 emoji 插入到当前光标位置
  const el = inputRef.value;
  if (!el) {
    input.value += e;
    return;
  }
  const start = el.selectionStart ?? input.value.length;
  const end = el.selectionEnd ?? start;
  const before = input.value.slice(0, start);
  const after = input.value.slice(end);
  input.value = before + e + after;
  nextTick(() => {
    el.focus();
    const pos = start + e.length;
    el.selectionStart = el.selectionEnd = pos;
  });
}

function handleEmojiClick(e: ChatEmojiItem) {
  if (!connected.value) return;
  if (sendImage(e.imageUrl, toUserId.value, {width: e.width, height: e.height})) {
    emojiPanelOpen.value = false; // 发送后关闭
    nextTick(scrollToBottom);
  }
}

function onImgLoaded() { /* 可以将来做尺寸调整 */
}

function previewImage(url?: string) {
  if (!url) return;
  window.open(url, '_blank');
}

function imageStyle(m: any) {
  const maxW = 220;
  const maxH = 240;
  const w = m.width || 0;
  const h = m.height || 0;
  if (w > 0 && h > 0) {
    const ratio = Math.min(maxW / w, maxH / h, 1);
    return {width: (w * ratio) + 'px', height: (h * ratio) + 'px'}
  }
  return {maxWidth: maxW + 'px', maxHeight: maxH + 'px'};
}

const emojiFileInput = ref<HTMLInputElement | null>(null); // 恢复上传 input 引用

function chooseEmojiFile() {
  if (activeEmojiTab.value === 'mine') emojiFileInput.value?.click();
}

async function onEmojiFileChange(e: Event) {
  const inputEl = e.target as HTMLInputElement;
  if (!inputEl.files || !inputEl.files.length) return;
  const file = inputEl.files[0];
  inputEl.value = '';
  emojiUploading.value = true;
  emojiLoading.value = true;
  try {
    const id = await uploadMyEmoji(file);
    if (id != null) {
      myEmojis.value = await listMyEmojis();
      myEmojisLoaded.value = true;
    }
  } finally {
    emojiUploading.value = false;
    emojiLoading.value = false;
  }
}
</script>
<style scoped>
.chat-room {
  --radius: 16px;
  --bg-glass: rgba(255, 255, 255, .55);
  --bg-glass-dark: rgba(22, 25, 30, .72);
  --border: rgba(0, 0, 0, .08);
  --border-dark: rgba(255, 255, 255, .08);
  position: relative;
  display: flex;
  flex-direction: column;
  height: 600px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: linear-gradient(180deg, color-mix(in srgb, var(--card-bg) 96%, var(--bg-color) 4%), color-mix(in srgb, var(--card-bg) 86%, var(--bg-color) 14%));
  color: var(--text-color);
  overflow: hidden;
  box-shadow: 0 8px 28px -10px rgba(0, 0, 0, .35);
  animation: chat-fade-in .4s ease; /* 纯淡入 */
}

/* 新的淡入动画，替换 panel-enter */
@keyframes chat-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 可选：保留旧动画注释方便回退 */
/* @keyframes panel-enter { from { opacity:0; transform: translateY(18px) scale(.96);} to { opacity:1; transform:translateY(0) scale(1);} } */

:global(.dark) .chat-room {
  background: linear-gradient(180deg, rgba(18, 22, 28, .96), rgba(12, 17, 23, .98)) !important;
  border-color: var(--border-dark);
  box-shadow: 0 24px 54px -34px rgba(0, 0, 0, .88);
}

@media (max-width: 860px) {
  .chat-room {
    height: 72vh;
  }
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  backdrop-filter: blur(12px);
  background: linear-gradient(90deg, color-mix(in srgb, var(--card-bg) 88%, transparent), color-mix(in srgb, var(--card-bg) 72%, transparent));
  border-bottom: 1px solid var(--border);
  gap: 1rem;
}

:global(.dark) .chat-header {
  background: linear-gradient(90deg, rgba(28, 34, 42, .96), rgba(22, 28, 35, .92)) !important;
  border-color: var(--border-dark);
}

.left-side {
  display: flex;
  align-items: center;
  gap: .75rem;
  font-size: .95rem;
  font-weight: 600;
}

.title {
  letter-spacing: .5px;
}

:global(.dark) .title,
:global(.dark) .left-side,
:global(.dark) .online-label,
:global(.dark) .selected-name,
:global(.dark) .select-placeholder,
:global(.dark) .item-name,
:global(.dark) .panel-title,
:global(.dark) .empty-option,
:global(.dark) .empty-hint,
:global(.dark) .emoji-loading,
:global(.dark) .empty-emoji {
  color: #e2e8f0;
}

.status {
  font-size: .65rem;
  padding: .25rem .55rem;
  border-radius: 999px;
  letter-spacing: .5px;
  background: rgba(0, 0, 0, .08);
}

.status.ok {
  background: #16a34a22;
  color: #16a34a;
}

.status.err {
  background: #dc262622;
  color: #dc2626;
}

.status.pending {
  background: #f59e0b22;
  color: #d97706;
}

.online {
  display: flex;
  align-items: center;
  gap: .5rem;
  flex-wrap: wrap;
}

.online-users {
  display: flex;
  gap: .4rem;
  max-width: 300px;
  flex-wrap: wrap;
}

.online-label {
  font-size: .6rem;
  letter-spacing: 1px;
  font-weight: 600;
  opacity: .65;
  text-transform: uppercase;
}

.user-pill {
  background: linear-gradient(120deg, #e2e8f0, #cbd5e1);
  color: #334155;
  padding: 2px 6px;
  font-size: .65rem;
  border-radius: 999px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, .15);
  animation: pill-in .35s ease;
}

.user-pill.self {
  background: linear-gradient(120deg, #6366f1, #8b5cf6);
  color: #fff;
}

:global(.dark) .user-pill {
  background: linear-gradient(120deg, #334155, #475569);
  color: #e2e8f0;
}

@keyframes pill-in {
  from {
    transform: scale(.6);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.chat-body {
  position: relative;
  flex: 1;
  overflow-y: auto;
  padding: 14px 18px 150px;
  background: linear-gradient(145deg, color-mix(in srgb, var(--card-bg) 94%, var(--bg-color) 6%), color-mix(in srgb, var(--bg-color) 84%, var(--card-bg) 16%));
}

:global(.dark) .chat-body {
  background: linear-gradient(145deg, rgba(15, 20, 27, .98), rgba(21, 28, 38, .96)) !important;
}

.chat-body::-webkit-scrollbar {
  width: 10px;
}

.chat-body::-webkit-scrollbar-track {
  background: transparent;
}

.chat-body::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #94a3b833, #64748b44);
  border-radius: 6px;
}

:global(.dark) .chat-body::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #47556955, #33415555);
}

.empty-hint {
  text-align: center;
  margin-top: 2.5rem;
  font-size: .8rem;
  opacity: .7;
}

.fade-in {
  animation: fade-in .6s ease;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.date-sep {
  position: relative;
  text-align: center;
  margin: 18px 0 10px;
}

.date-sep span {
  background: color-mix(in srgb, var(--card-bg) 84%, transparent);
  padding: 4px 10px;
  font-size: .65rem;
  font-weight: 600;
  letter-spacing: .5px;
  border-radius: 999px;
  box-shadow: 0 2px 6px -2px rgba(0, 0, 0, .15);
  backdrop-filter: blur(6px);
}

:global(.dark) .date-sep span {
  --sep-bg: rgba(30, 41, 59, .8);
  color: #e2e8f0;
}

.date-sep::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: linear-gradient(90deg, transparent, #94a3b855, transparent);
  z-index: -1;
}

:global(.dark) .date-sep::before {
  background: linear-gradient(90deg, transparent, #334155aa, transparent);
}

.msg-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.msg-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.msg-wrapper.mine {
  flex-direction: row-reverse;
}

.avatar-box {
  width: 32px;
  flex: 0 0 32px;
  display: flex;
  justify-content: center;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 2px 6px -2px rgba(0, 0, 0, .25);
  border: 1px solid #e2e8f0;
}

:global(.dark) .avatar {
  border-color: #334155;
}

.avatar.placeholder {
  background: linear-gradient(135deg, #64748b, #94a3b8);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .7rem;
  font-weight: 600;
  position: relative;
}

.avatar.placeholder::after {
  content: attr(data-initial);
}

.msg.mine .avatar {
  border-color: rgba(255, 255, 255, .4);
}

.meta {
  display: flex;
  justify-content: space-between;
  font-size: .6rem;
  letter-spacing: .5px;
  font-weight: 500;
  opacity: .7;
  padding: 0 4px;
}

.meta .from {
  display: flex;
  align-items: center;
  gap: 4px;
}

.bubble {
  position: relative;
  padding: 8px 12px 9px;
  background: linear-gradient(120deg, #ffffff, #f1f5f9);
  border-radius: 14px 14px 14px 4px;
  font-size: .8rem;
  line-height: 1.5;
  word-break: break-word;
  box-shadow: 0 4px 14px -6px rgba(0, 0, 0, .12);
  border: 1px solid #e2e8f0;
  white-space: pre-wrap; /* 保留换行与连续空格，自动换行 */
}

.msg.mine .bubble {
  background: linear-gradient(120deg, #6366f1, #8b5cf6);
  color: #fff;
  border-color: rgba(255, 255, 255, .25);
  border-radius: 14px 14px 4px 14px;
}

:global(.dark) .bubble {
  background: linear-gradient(120deg, #1e293b, #334155);
  color: #e2e8f0;
  border-color: #334155;
}

:global(.dark) .msg.mine .bubble {
  background: linear-gradient(120deg, #4f46e5, #7c3aed);
}

.msg.private .bubble {
  outline: 2px solid #f59e0b88;
}

.sys-line, .error-line {
  font-size: .65rem;
  padding: 6px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--card-bg) 72%, var(--bg-color) 28%);
  color: color-mix(in srgb, var(--text-color) 78%, transparent);
  margin: 4px auto;
  letter-spacing: .5px;
  backdrop-filter: blur(4px);
}

.error-line {
  background: rgba(220, 38, 38, .18);
  color: #dc2626;
}

.tag-line {
  background: color-mix(in srgb, #f59e0b 22%, var(--card-bg) 78%);
  color: color-mix(in srgb, #f59e0b 72%, var(--text-color) 28%);
}

.chip {
  background: color-mix(in srgb, #6366f1 20%, var(--card-bg) 80%);
  color: color-mix(in srgb, #818cf8 64%, var(--text-color) 36%);
}

.scroll-bottom {
  position: absolute;
  right: 14px;
  bottom: 160px;
  border: 0;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 6px 16px -4px rgba(99, 102, 241, .55);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: .35s;
}

.scroll-bottom:hover {
  transform: translateY(-3px) scale(1.05);
}

.scroll-bottom:active {
  transform: translateY(1px) scale(.96);
}

.chat-footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 10px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: linear-gradient(180deg, rgba(255, 255, 255, .65), rgba(255, 255, 255, .85));
  border-top: 1px solid var(--border);
}

:global(.dark) .chat-footer {
  background: linear-gradient(180deg, rgba(20, 26, 34, .95), rgba(14, 19, 26, .98)) !important;
  border-color: var(--border-dark);
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.target-input {
  display: flex;
  align-items: center;
  gap: .5rem;
}

.label {
  font-size: .65rem;
  letter-spacing: .5px;
  opacity: .65;
}

.target-field {
  width: 120px;
  padding: 4px 8px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #fff;
  font-size: .7rem;
}

:global(.dark) .target-field {
  background: #1e293b;
  border-color: #334155;
  color: #e2e8f0;
}

.status-hint {
  font-size: .6rem;
  letter-spacing: .5px;
  opacity: .55;
  padding: 4px 8px;
  border-radius: 8px;
  background: rgba(0, 0, 0, .05);
}

.status-hint.on {
  background: rgba(245, 158, 11, .15);
  color: #b45309;
  opacity: 1;
}

:global(.dark) .status-hint {
  background: rgba(255, 255, 255, .08);
  color: rgba(226, 232, 240, .76);
}

:global(.dark) .status-hint.on {
  color: #fbbf24;
}

.target-user-select {
  position: relative;
  width: 180px;
}

.select-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: color-mix(in srgb, var(--card-bg) 92%, transparent);
  color: var(--text-color);
  cursor: pointer;
  transition: .3s;
  user-select: none;
}

.select-trigger:hover {
  border-color: #a5b4fc;
}

.select-trigger.open {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px #6366f133;
}

:global(.dark) .select-trigger {
  border-color: #334155;
}

.selected-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.selected-avatar.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .7rem;
  background: #e2e8f0;
  color: #475569;
}

:global(.dark) .selected-avatar.placeholder {
  background: #334155;
  color: #94a3b8;
}

.selected-name {
  flex: 1;
  font-size: .75rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.select-placeholder {
  flex: 1;
  font-size: .75rem;
  opacity: .7;
}

.clear-btn {
  border: 0;
  background: #e2e8f0;
  color: #64748b;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}

.clear-btn:hover {
  background: #ef4444;
  color: #fff;
}

:global(.dark) .clear-btn {
  background: #334155;
  color: #94a3b8;
}

.chevron {
  font-size: 12px;
  transition: .3s;
  opacity: .5;
}

.select-trigger.open .chevron {
  transform: rotate(180deg);
}

.select-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: color-mix(in srgb, var(--card-bg) 92%, transparent);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 6px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 8px 24px -8px rgba(0, 0, 0, .2);
  backdrop-filter: blur(16px);
}

:global(.dark) .select-dropdown {
  background: var(--bg-glass-dark);
  border-color: var(--border-dark);
}

.select-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: .2s;
}

.select-item:hover {
  background: rgba(99, 102, 241, .15);
}

:global(.dark) .select-item:hover {
  background: rgba(99, 102, 241, .25);
}

.item-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.item-avatar.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .8rem;
  background: #e2e8f0;
  color: #475569;
}

:global(.dark) .item-avatar.placeholder {
  background: #334155;
  color: #94a3b8;
}

.item-name {
  font-size: .8rem;
}

.empty-option {
  padding: 12px;
  text-align: center;
  font-size: .7rem;
  opacity: .6;
}

.send-row {
  display: flex;
  gap: .65rem;
  align-items: flex-end;
}

.msg-input {
  flex: 1;
  resize: none;
  height: 82px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid #cbd5e1;
  background: linear-gradient(120deg, color-mix(in srgb, var(--bg-color) 70%, var(--card-bg) 30%), color-mix(in srgb, var(--card-bg) 92%, transparent));
  font-family: inherit;
  font-size: .8rem;
  line-height: 1.5;
  box-shadow: 0 4px 14px -6px rgba(0, 0, 0, .08) inset;
  transition: .3s;
}

.msg-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px #6366f144;
}

:global(.dark) .msg-input {
  background: linear-gradient(120deg, rgba(31, 41, 55, .98), rgba(15, 23, 42, .98)) !important;
  border-color: #334155;
  color: #e2e8f0;
}

:global(.dark) .msg-input::placeholder {
  color: rgba(226, 232, 240, .48);
}

.side-actions {
  display: flex;
  flex-direction: column;
  gap: .5rem;
}

.send-btn {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  border: 0;
  padding: .75rem 1.15rem;
  border-radius: 12px;
  font-size: .8rem;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: .5px;
  box-shadow: 0 8px 18px -6px rgba(99, 102, 241, .55);
  transition: .35s;
  min-width: 86px;
}

.send-btn:disabled {
  opacity: .4;
  cursor: not-allowed;
  box-shadow: none;
}

.send-btn:not(:disabled):hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px -8px rgba(99, 102, 241, .65);
}

.send-btn:not(:disabled):active {
  transform: translateY(2px);
}

button.mini {
  font-size: .6rem;
  padding: 4px 8px;
  border-radius: 8px;
  border: 0;
  background: #e2e8f0;
  cursor: pointer;
  letter-spacing: .5px;
  font-weight: 500;
}

button.mini.ghost {
  background: rgba(0, 0, 0, .08);
}

button.mini.link {
  background: transparent;
  color: #6366f1;
}

:global(.dark) button.mini {
  background: #334155;
  color: #e2e8f0;
}

:global(.dark) button.mini.ghost {
  background: rgba(255, 255, 255, .12);
}

:global(.dark) button.mini.link {
  color: #818cf8;
}

/* Animations */
.fade-enter-active, .fade-leave-active {
  transition: opacity .35s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.msg-fade-enter-active {
  transition: all .35s cubic-bezier(.4, .8, .4, 1);
}

.msg-fade-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(.96);
}

.fade-scale-enter-active, .fade-scale-leave-active {
  transition: all .35s cubic-bezier(.55, .2, .3, 1);
}

.fade-scale-enter-from, .fade-scale-leave-to {
  opacity: 0;
  transform: scale(.6);
}

.img-bubble {
  padding: 6px 8px;
}

.img-msg {
  max-width: 220px;
  max-height: 240px;
  border-radius: 12px;
  display: block;
  cursor: pointer;
  object-fit: contain;
  box-shadow: 0 2px 10px -4px rgba(0, 0, 0, .25);
}

.msg.mine .img-msg {
  border: 1px solid rgba(255, 255, 255, .3);
}

.emoji-panel {
  position: absolute;
  right: 12px; /* bottom 由内联样式控制 */
  width: 300px;
  max-height: 320px;
  background: color-mix(in srgb, var(--card-bg) 98%, var(--bg-color) 2%);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 8px 10px 10px;
  box-shadow: 0 10px 34px -10px rgba(0, 0, 0, .35);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 40;
}

:global(.dark) .emoji-panel {
  background: linear-gradient(180deg, rgba(22, 28, 36, .98), rgba(16, 22, 29, 1)) !important;
  border-color: var(--border-dark);
}

.emoji-panel--glass {
  background: color-mix(in srgb, var(--card-bg) 92%, transparent);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

:global(.dark) .emoji-panel--glass {
  background: linear-gradient(180deg, rgba(22, 28, 36, .96), rgba(16, 22, 29, .98)) !important;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-title {
  font-size: .7rem;
  font-weight: 600;
  letter-spacing: .5px;
  opacity: .75;
}

.emoji-loading, .empty-emoji {
  font-size: .65rem;
  text-align: center;
  opacity: .6;
  padding: 12px 4px;
}

.builtin-pane {
  flex: 1;
  overflow: hidden;
}

.builtin-emoji-hint {
  padding: 4px 6px 0;
  font-size: .62rem;
  text-align: right;
  opacity: .55;
}

.builtin-emoji-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 32px);
  gap: 6px;
  padding: 4px;
  max-height: 220px;
  overflow-y: auto;
}

.builtin-emoji {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: .25s;
  background: rgba(0, 0, 0, .04);
}

.builtin-emoji:hover {
  background: rgba(99, 102, 241, .25);
  transform: translateY(-2px);
}

:global(.dark) .builtin-emoji {
  background: rgba(255, 255, 255, .06);
}

:global(.dark) .builtin-emoji:hover {
  background: rgba(99, 102, 241, .35);
}

.my-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 调整原有 emoji-grid：添加网格布局与统一尺寸 */
.emoji-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 56px);
  gap: 8px;
  padding: 4px;
  max-height: 220px;
  overflow-y: auto;
}

.emoji-item {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 10px;
  background: rgba(0, 0, 0, .04);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: .25s;
  box-shadow: 0 2px 4px -2px rgba(0, 0, 0, .15);
}

.emoji-item:hover {
  background: rgba(99, 102, 241, .18);
  transform: translateY(-3px);
  box-shadow: 0 6px 14px -6px rgba(99, 102, 241, .35);
}

:global(.dark) .emoji-item {
  background: rgba(255, 255, 255, .06);
}

:global(.dark) .emoji-item:hover {
  background: rgba(99, 102, 241, .28);
}

.emoji-item img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  pointer-events: none; /* 点击事件留给父容器 */
}

/* 删除按钮样式移除（保留注释，若后续要恢复可参考） */
/* .del-btn { ... } */
/* .emoji-item:hover .del-btn { ... } */
.emoji-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 28px 10px;
  opacity: .95;
}

.emoji-loading .spinner {
  width: 46px;
  height: 46px;
  position: relative;
}

.emoji-loading .spinner::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(#6366f1, #8b5cf6, #6366f1);
  animation: spin 1s linear infinite;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, .45));
}

/* .emoji-loading .spinner.kawaii { ... } */
/* .emoji-loading .spinner.kawaii .ring { ... } */
.emoji-loading .spinner.kawaii {
  width: 84px;
  height: 84px;
  position: relative;
  animation: pop-in .6s ease, floaty 3.6s ease-in-out infinite;
}

.emoji-loading .spinner.kawaii .ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 4px dashed transparent;
  animation: spin 5s linear infinite;
}

.emoji-loading .spinner.kawaii .ring.r1 {
  border-top-color: #6366f1;
  border-right-color: #8b5cf6;
  border-bottom-color: #6366f1;
  filter: drop-shadow(0 0 4px #6366f188);
  animation-duration: 9s;
}

.emoji-loading .spinner.kawaii .ring.r2 {
  inset: 8px;
  border-width: 3px;
  border-left-color: #f59e0b;
  border-top-color: #f472b6;
  border-right-color: #22d3ee;
  opacity: .9;
  animation: spin-rev 6s linear infinite;
}

.emoji-loading .spinner.kawaii .ring.r3 {
  inset: 18px;
  border-width: 3px;
  border-top-color: #10b981;
  border-right-color: #f43f5e;
  border-bottom-color: #3b82f6;
  opacity: .85;
  animation: spin 4s linear infinite;
  filter: blur(.3px);
}

/* 删除 no-face 相关样式 */
/* .emoji-loading .spinner.kawaii.no-face { ... } */
.emoji-loading .spinner.kawaii .sparkles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.emoji-loading .spinner.kawaii .sparkles .sp {
  position: absolute;
  width: 10px;
  height: 10px;
  background: conic-gradient(from 0deg, #ffffff 0 25%, #ffe4e6 25% 50%, #fde68a 50% 75%, #bfdbfe 75%);
  border-radius: 50%;
  animation: sparkle 1.8s ease-in-out infinite;
  opacity: 0;
}

.emoji-loading .spinner.kawaii .sparkles .sp::after {
  content: "";
  position: absolute;
  inset: 2px;
  background: radial-gradient(circle, #fff, #ffffff00 70%);
  border-radius: 50%;
}

.emoji-loading .spinner.kawaii .sparkles .s1 {
  top: -4px;
  left: 50%;
  margin-left: -5px;
  animation-delay: .1s;
}

.emoji-loading .spinner.kawaii .sparkles .s2 {
  top: 14px;
  right: -6px;
  animation-delay: .6s;
}

.emoji-loading .spinner.kawaii .sparkles .s3 {
  bottom: 8px;
  left: -6px;
  animation-delay: 1s;
}

.emoji-loading .spinner.kawaii .sparkles .s4 {
  bottom: -6px;
  right: 16px;
  animation-delay: 1.4s;
}

.emoji-loading .spinner.kawaii .sparkles .s5 {
  top: 4px;
  left: 8px;
  animation-delay: 1.8s;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pop-in {
  0% {
    transform: scale(.4) rotate(-20deg);
    opacity: 0;
  }
  70% {
    transform: scale(1.06);
    opacity: 1;
  }
  100% {
    transform: scale(1);
  }
}

@keyframes floaty {
  0%, 100% {
    transform: translateY(-4px);
  }
  50% {
    transform: translateY(4px);
  }
}

@keyframes sparkle {
  0% {
    transform: scale(0) translateY(0);
    opacity: 0;
  }
  15% {
    opacity: 1;
    transform: scale(1) translateY(-4px);
  }
  60% {
    opacity: 1;
    transform: scale(.9) translateY(-6px);
  }
  100% {
    opacity: 0;
    transform: scale(0) translateY(-10px);
  }
}

@keyframes spin-rev {
  to {
    transform: rotate(-360deg);
  }
}

/* Dark mode tweaks */
:global(.dark) .emoji-loading .spinner.kawaii .ring.r1 {
  border-top-color: #818cf8;
  border-right-color: #a78bfa;
  border-bottom-color: #818cf8;
}

:global(.dark) .emoji-loading .spinner.kawaii .ring.r2 {
  border-left-color: #fbbf24;
  border-top-color: #f472b6;
  border-right-color: #06b6d4;
}

:global(.dark) .emoji-loading .spinner.kawaii .ring.r3 {
  border-top-color: #34d399;
  border-right-color: #fb7185;
  border-bottom-color: #60a5fa;
}

/* === 二次元动感加载增强部分 END === */

.count-pill { /* 新增：显示在线人数 */
  background: linear-gradient(120deg, #38bdf8, #0ea5e9);
  color: #fff;
  padding: 2px 8px;
  font-size: .65rem;
  font-weight: 600;
  border-radius: 999px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, .2);
}

:global(.dark) .count-pill {
  background: linear-gradient(120deg, #0ea5e9, #0369a1);
}
</style>
