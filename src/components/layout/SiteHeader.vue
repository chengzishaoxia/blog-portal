<template>
  <header class="header-wrapper" :class="headerClass">
    <button
      class="mobile-toggle"
      type="button"
      :aria-expanded="drawerOpen"
      aria-controls="mobile-nav-drawer"
      aria-label="打开导航菜单"
      @click="toggleDrawer"
    >
      <span class="mobile-toggle-lines" :class="{ close: drawerOpen }">
        <span class="line"></span>
        <span class="line"></span>
        <span class="line"></span>
      </span>
    </button>

    <div class="menu">
      <div class="menu-item title">
        <RouterLink to="/" class="menu-btn">
          {{ title }}
        </RouterLink>
      </div>

      <template v-for="menu in menuList" :key="menu.name">
        <div v-if="!menu.children" class="menu-item" :class="{ active: isMenuActive(menu) }">
          <a v-if="menu.external" :href="menu.href || menu.path || '/'" class="menu-btn" :target="menu.target" :rel="menu.rel">
            <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path v-for="(path, index) in iconMap[menu.icon]" :key="`${menu.name}-${index}`" :d="path" />
            </svg>
            {{ menu.name }}
          </a>
          <RouterLink v-else :to="menu.path || '/'" class="menu-btn">
            <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path v-for="(path, index) in iconMap[menu.icon]" :key="`${menu.name}-${index}`" :d="path" />
            </svg>
            {{ menu.name }}
          </RouterLink>
        </div>

        <div v-else class="menu-item dropdown" :class="{ active: isMenuActive(menu) }">
          <a class="menu-btn drop">
            <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path v-for="(path, index) in iconMap[menu.icon]" :key="`${menu.name}-${index}`" :d="path" />
            </svg>
            {{ menu.name }}
          </a>

          <ul class="submenu">
            <li v-for="submenu in menu.children" :key="submenu.name" class="subitem" :class="{ active: isSubmenuActive(submenu) }">
                <a v-if="submenu.external" class="link" :href="submenu.href" target="_blank" rel="noopener noreferrer">
                  <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path v-for="(path, index) in iconMap[submenu.icon]" :key="`${submenu.name}-${index}`" :d="path" />
                  </svg>
                  {{ submenu.name }}
                </a>
                <RouterLink v-else class="link" :to="submenu.path || '/'">
                  <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path v-for="(path, index) in iconMap[submenu.icon]" :key="`${submenu.name}-${index}`" :d="path" />
                  </svg>
                  {{ submenu.name }}
                </RouterLink>
            </li>
          </ul>
        </div>
      </template>
    </div>

    <ul class="right">
      <li class="item search-item">
        <div class="search-entry" :class="{ active: focused || searchKey }" @click="focusSearch">
          <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 21l-4.35-4.35" />
            <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
          </svg>
          <input
            ref="searchInput"
            v-model.trim="searchKey"
            class="search-input"
            type="search"
            placeholder="文章搜索..."
            aria-label="搜索文章"
            @focus="focused = true"
            @blur="focused = false"
            @keyup.enter="triggerSearch"
            @click.stop
          >
        </div>
      </li>

      <li class="item">
        <div class="menu-item dropdown notice-wrap">
          <div class="menu-btn icon-only" aria-label="通知">
            <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
              <path d="M10 20a2 2 0 0 0 4 0" />
            </svg>
          </div>
        </div>
      </li>

      <li class="item">
        <div class="menu-item dropdown user-entry">
          <template v-if="!auth.isAuthed()">
            <a class="menu-btn menu-login" @click="openLogin">
              <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M20 21a8 8 0 0 0-16 0" />
                <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
              </svg>
              登录
            </a>
          </template>

          <template v-else>
            <div class="menu-btn avatar-btn drop" role="button" tabindex="0" @click="menuOpen = !menuOpen" @keyup.enter.space="menuOpen = !menuOpen">
              <span class="avatar" :class="{ 'has-img': !!auth.profile?.avatar }" aria-hidden="true">
                <img v-if="auth.profile?.avatar" :src="auth.profile.avatar" :alt="auth.profile.nickname || auth.profile.username" @error="handleAvatarError" v-show="!imgErr">
                <span v-else>{{ userInitial }}</span>
              </span>
            </div>

            <ul v-if="menuOpen" class="submenu user-submenu">
              <li class="subitem" :class="{ active: activeNav === 'user-profile' }">
                <RouterLink class="link" to="/user/profile" @click="menuOpen = false">
                  <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M20 21a8 8 0 0 0-16 0" />
                    <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                  </svg>
                  个人中心
                </RouterLink>
              </li>
              <li class="subitem">
                <button class="link logout-btn" @click="logout">
                  <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <path d="m16 17 5-5-5-5" />
                    <path d="M21 12H9" />
                  </svg>
                  退出
                </button>
              </li>
            </ul>
          </template>
        </div>
      </li>
    </ul>
  </header>

  <transition name="mobile-drawer-fade">
    <div v-if="drawerOpen" class="mobile-drawer-overlay" @click="closeDrawer"></div>
  </transition>

  <transition name="mobile-drawer-slide">
    <aside v-if="drawerOpen" id="mobile-nav-drawer" class="mobile-drawer" aria-label="移动端导航">
      <button class="mobile-drawer-close" type="button" aria-label="关闭导航菜单" @click="closeDrawer">×</button>

      <section class="mobile-drawer-author">
        <div class="mobile-drawer-avatar" :class="{ empty: !siteConfig.sidebarProfile.avatarUrl }">
          <img
            v-if="siteConfig.sidebarProfile.avatarUrl"
            :src="siteConfig.sidebarProfile.avatarUrl"
            :alt="siteConfig.sidebarProfile.name"
            loading="lazy"
            @error="handleDrawerAvatarError"
          >
          <span v-else>{{ drawerAvatarFallback }}</span>
        </div>
        <h2 class="mobile-drawer-name title">{{ siteConfig.sidebarProfile.name }}</h2>
        <p class="mobile-drawer-intro">{{ siteConfig.sidebarProfile.intro }}</p>
        <div class="mobile-drawer-stats">
          <RouterLink class="mobile-stat" to="/" @click="closeDrawer">
            <strong>{{ postStore.total || 0 }}</strong>
            <span>文章</span>
          </RouterLink>
          <RouterLink class="mobile-stat" to="/archives" @click="closeDrawer">
            <strong>{{ archiveCount }}</strong>
            <span>分类</span>
          </RouterLink>
          <RouterLink class="mobile-stat" to="/tags" @click="closeDrawer">
            <strong>{{ postStore.tags.length || 0 }}</strong>
            <span>标签</span>
          </RouterLink>
        </div>
        <div v-if="drawerSocials.length" class="mobile-drawer-socials">
          <a
            v-for="item in drawerSocials"
            :key="item.label"
            class="mobile-social"
            :class="item.tone"
            :href="item.href"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="item.label"
          >
            {{ item.icon }}
          </a>
        </div>
      </section>

      <nav class="mobile-drawer-nav">
        <template v-for="menu in menuList" :key="`mobile-${menu.name}`">
          <div v-if="!menu.children" class="mobile-nav-item" :class="{ active: isMenuActive(menu) }">
            <a
              v-if="menu.external"
              class="mobile-nav-link"
              :href="menu.href || menu.path || '/'"
              :target="menu.target"
              :rel="menu.rel"
              @click="closeDrawer"
            >
              <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path v-for="(path, index) in iconMap[menu.icon]" :key="`mobile-${menu.name}-${index}`" :d="path" />
              </svg>
              {{ menu.name }}
            </a>
            <RouterLink v-else class="mobile-nav-link" :to="menu.path || '/'" @click="closeDrawer">
              <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path v-for="(path, index) in iconMap[menu.icon]" :key="`mobile-${menu.name}-${index}`" :d="path" />
              </svg>
              {{ menu.name }}
            </RouterLink>
          </div>

          <div v-else class="mobile-nav-group" :class="{ active: isMenuActive(menu) }">
            <div class="mobile-nav-heading">
              <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path v-for="(path, index) in iconMap[menu.icon]" :key="`mobile-group-${menu.name}-${index}`" :d="path" />
              </svg>
              {{ menu.name }}
            </div>
            <div class="mobile-submenu">
              <template v-for="submenu in menu.children" :key="submenu.name">
                <a
                  v-if="submenu.external"
                  class="mobile-submenu-link"
                  :href="submenu.href"
                  :target="submenu.target || '_blank'"
                  :rel="submenu.rel || 'noopener noreferrer'"
                  @click="closeDrawer"
                >
                  <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path v-for="(path, index) in iconMap[submenu.icon]" :key="`mobile-${submenu.name}-${index}`" :d="path" />
                  </svg>
                  {{ submenu.name }}
                </a>
                <RouterLink v-else class="mobile-submenu-link" :to="submenu.path || '/'" @click="closeDrawer">
                  <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path v-for="(path, index) in iconMap[submenu.icon]" :key="`mobile-${submenu.name}-${index}`" :d="path" />
                  </svg>
                  {{ submenu.name }}
                </RouterLink>
              </template>
            </div>
          </div>
        </template>
      </nav>
    </aside>
  </transition>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onMounted, onUnmounted, ref, watch, type Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth-store';
import { usePostStore } from '@/store/post-store';
import type { BlogArchiveGroup } from '@/types/blog';
import { createDefaultSiteConfig, type SiteConfig } from '@/types/site-config';

type MenuNode = {
  name: string;
  icon: keyof typeof iconMap;
  path?: string;
  matches?: string[];
  href?: string;
  external?: boolean;
  target?: string;
  rel?: string;
  children?: MenuNode[];
};

const title = '橙子的小屋';
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const postStore = usePostStore();
const injectedSiteConfig = inject<Ref<SiteConfig>>('portalSiteConfig');
const siteConfig = computed(() => injectedSiteConfig?.value ?? createDefaultSiteConfig());

const iconMap = {
  home: ['M3 10.5 12 3l9 7.5', 'M5 9.5V21h14V9.5'],
  article: ['M6 4h12', 'M6 9h12', 'M6 14h8', 'M6 19h10'],
  talk: ['M5 18l1.6-3.3A7 7 0 1 1 19 10.9', 'M8 11h.01', 'M12 11h.01', 'M16 11h.01'],
  friend: ['M10 13a5 5 0 0 1 0-7l1.5-1.5a5 5 0 0 1 7 7L17 13', 'M14 11a5 5 0 0 1 0 7L12.5 19.5a5 5 0 0 1-7-7L7 11'],
  leave: ['M5 19V6.2A1.2 1.2 0 0 1 6.2 5h11.6A1.2 1.2 0 0 1 19 6.2v8.6A1.2 1.2 0 0 1 17.8 16H8l-3 3Z', 'M9 9h6', 'M9 12h6'],
  plane: ['M3 11.5 21 3l-6.5 18-3.5-7-7-2.5Z', 'M10 14l4.5-4.5'],
  info: ['M12 8h.01', 'M11 12h1v4h1', 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Z'],
  archives: ['M6 4h12', 'M6 9h12', 'M6 14h8', 'M6 19h10'],
  tag: ['M20 13 11 22l-9-9V4h9l9 9Z', 'M7 7h.01'],
  user: ['M20 21a8 8 0 0 0-16 0', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'm16 17 5-5-5-5', 'M21 12H9'],
  abyss: ['M12 3l2.7 5.47 6.03.88-4.36 4.25 1.03 6.01L12 17.77 6.6 20.61l1.03-6.01L3.27 9.35l6.03-.88L12 3Z'],
} as const;

const menuList = computed<MenuNode[]>(() => [
  { name: '首页', icon: 'home', path: '/', matches: ['home'] },
  {
    name: '文章',
    icon: 'article',
    matches: ['archives', 'tags', 'tag', 'post-detail'],
    children: [
      { name: '归档', icon: 'archives', path: '/archives', matches: ['archives'] },
      { name: '标签', icon: 'tag', path: '/tags', matches: ['tags', 'tag'] },
    ],
  },
  { name: '聊天', icon: 'talk', path: '/chat', matches: ['chat'] },
  { name: '友链', icon: 'friend', path: '/friend-links', matches: ['friend-links'] },
  { name: '留言板', icon: 'leave', path: '/message-board', matches: ['message-board'] },
  { name: '深渊', icon: 'abyss', href: '/admin', external: true },
  {
    name: '关于',
    icon: 'info',
    children: [
      { name: '网站源码', icon: 'user', href: siteConfig.value.about.repoUrl, external: true, target: '_blank', rel: 'noopener noreferrer' },
    ],
  },
]);

const drawerSocials = computed(() => {
  const contact = siteConfig.value.contact;
  const candidates = [
    { label: 'GitHub', href: contact.github, icon: 'GH', tone: 'github' },
    { label: 'Gitee', href: contact.gitee, icon: '码', tone: 'gitee' },
    { label: '邮箱', href: contact.email ? (contact.email.startsWith('mailto:') ? contact.email : `mailto:${contact.email}`) : '', icon: '邮', tone: 'email' },
    { label: 'QQ', href: contact.qq ? `tencent://message/?uin=${contact.qq}` : '', icon: 'Q', tone: 'qq' },
  ];
  return candidates.filter(item => !!item.href);
});

const searchKey = ref('');
const focused = ref(false);
const searchInput = ref<HTMLInputElement | null>(null);
const menuOpen = ref(false);
const drawerOpen = ref(false);
const collapsed = ref(false);
const scrolled = ref(false);
const imgErr = ref(false);
let lastY = 0;

const activeNav = computed(() => String(route.name || ''));
const headerClass = computed(() => ({
  show: scrolled.value,
  up: !collapsed.value,
  down: collapsed.value,
}));

const userInitial = computed(() => auth.profile?.nickname?.charAt(0).toUpperCase() || auth.profile?.username?.charAt(0).toUpperCase() || auth.username?.charAt(0).toUpperCase() || '?');
const drawerAvatarFallback = computed(() => (siteConfig.value.sidebarProfile.name || 'B').charAt(0));
const archiveCount = computed(() => {
  const totalPosts = postStore.archives.reduce<number>((total: number, group: BlogArchiveGroup) => total + (group.count || 0), 0);
  return totalPosts || postStore.tags.length || 0;
});

function isMenuActive(menu: MenuNode) {
  if (menu.matches?.includes(activeNav.value)) return true;
  return !!menu.children?.some(child => child.matches?.includes(activeNav.value));
}

function isSubmenuActive(menu: MenuNode) {
  return !!menu.matches?.includes(activeNav.value);
}

function focusSearch() {
  nextTick(() => searchInput.value?.focus());
}

function syncFromRoute() {
  const q = (route.query.q as string) || '';
  if (q !== searchKey.value) searchKey.value = q;
}

function triggerSearch() {
  const query = searchKey.value ? { q: searchKey.value } : {};
  router.push({ name: 'home', query, hash: '#blog-list' });
}

function openLogin() {
  auth.open('login');
}

function logout() {
  auth.logout();
  menuOpen.value = false;
}

function toggleDrawer() {
  drawerOpen.value = !drawerOpen.value;
}

function closeDrawer() {
  drawerOpen.value = false;
}

function handleAvatarError() {
  imgErr.value = true;
  if (auth.profile) auth.profile.avatar = '';
}

function handleDrawerAvatarError(event: Event) {
  (event.target as HTMLImageElement).style.display = 'none';
}

function handleScroll() {
  const y = window.scrollY || document.documentElement.scrollTop;
  scrolled.value = y > 0;
  if (y <= 0) {
    collapsed.value = false;
  } else {
    collapsed.value = y > lastY;
  }
  lastY = y;
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  if (!target?.closest('.user-entry')) {
    menuOpen.value = false;
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    menuOpen.value = false;
    drawerOpen.value = false;
  }
}

onMounted(() => {
  syncFromRoute();
  lastY = window.scrollY || 0;
  handleScroll();
  postStore.loadTags().catch(() => undefined);
  postStore.loadArchives().catch(() => undefined);
  window.addEventListener('scroll', handleScroll, { passive: true });
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = '';
});

watch(() => route.query.q, syncFromRoute);
watch(() => route.fullPath, () => {
  closeDrawer();
  menuOpen.value = false;
});
watch(drawerOpen, (opened) => {
  document.body.style.overflow = opened ? 'hidden' : '';
});
</script>

<style scoped>
.header-wrapper {
  position: fixed;
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 3.125rem;
  padding: 0 1rem;
  color: var(--header-text-color, rgba(255, 255, 255, .95));
  text-shadow: 0 0.2rem 0.3rem rgb(0 0 0 / 50%);
  transition: all .2s ease-in-out;
  z-index: 24;
}

.mobile-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
}

.mobile-toggle-lines {
  width: 1.45rem;
  display: inline-flex;
  flex-direction: column;
  gap: .22rem;
}

.mobile-toggle-lines .line {
  display: block;
  width: 100%;
  height: .14rem;
  border-radius: 999px;
  background: currentColor;
  box-shadow: 0 0 .5rem rgb(0 0 0 / 35%);
  transition: transform .25s ease, opacity .25s ease;
}

.mobile-toggle-lines.close .line:nth-child(1) {
  transform: translateY(.36rem) rotate(45deg);
}

.mobile-toggle-lines.close .line:nth-child(2) {
  opacity: 0;
}

.mobile-toggle-lines.close .line:nth-child(3) {
  transform: translateY(-.36rem) rotate(-45deg);
}

.show {
  background: var(--nav-bg, color-mix(in srgb, var(--card-bg) 90%, transparent));
  box-shadow: 0.1rem 0.1rem 0.2rem rgba(0, 0, 0, .08);
  text-shadow: none;
  color: var(--text-color);
}

.up {
  transform: translateY(0);
}

.down {
  transform: translateY(-100%);
}

.menu {
  display: flex;
  align-items: center;
  height: 100%;
}

.menu-item {
  position: relative;
  display: inline-block;
  padding: 0 .625rem;
  letter-spacing: .0625rem;
  font-size: 17px;
  text-align: center;
}

.menu-item:not(.title) .menu-btn::before {
  content: "";
  position: absolute;
  width: 0;
  height: .1875rem;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  border-radius: .125rem;
  background-color: currentColor;
  transition: all .4s ease-in-out;
}

.menu-item.dropdown:hover > .submenu,
.menu-item.dropdown:focus-within > .submenu {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(0) scale(1);
}

.menu-item.active:not(.dropdown) .menu-btn::before,
.menu-item:not(.dropdown):hover .menu-btn::before {
  width: 70%;
  color: #70b6ff;
}

.menu-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: .38rem;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
  transition: color .2s ease-in-out;
}

.title .menu-btn {
  font-family: var(--font-brand);
  font-size: 2rem;
  font-weight: 700;
}

.menu-icon {
  width: 1rem;
  height: 1rem;
  flex: 0 0 auto;
}

.drop::after {
  content: "";
  display: inline-block;
  vertical-align: middle;
  border: .3rem solid transparent;
  border-top-color: currentColor;
  border-bottom: 0;
  transition: transform .25s ease, opacity .25s ease;
}

.menu-item.dropdown:hover > .menu-btn.drop::after,
.menu-item.dropdown:focus-within > .menu-btn.drop::after {
  transform: rotate(180deg);
}

.submenu {
  position: absolute;
  left: 7px;
  width: max-content;
  margin-top: .5rem;
  padding: 0;
  background: rgba(33, 41, 54, .86);
  box-shadow: 0 .3125rem 1.25rem -.25rem rgba(0, 0, 0, .35);
  border-radius: .625rem;
  list-style: none;
  z-index: 35;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(.85rem) scale(.98);
  transform-origin: top center;
  transition: opacity .22s ease, transform .22s ease, visibility 0s linear .22s;
}

.show .submenu {
  background: color-mix(in srgb, var(--card-bg) 94%, transparent);
}

.submenu::before {
  position: absolute;
  top: -1.25rem;
  left: 0;
  width: 100%;
  height: 2.5rem;
  content: "";
}

.subitem {
  display: block;
  font-size: 1rem;
}

.link,
.logout-btn {
  display: inline-flex;
  align-items: center;
  gap: .45rem;
  width: 100%;
  padding: .45rem .8rem;
  color: inherit;
  text-decoration: none;
  text-shadow: none;
  background: transparent;
  border: 0;
  font: inherit;
  cursor: pointer;
  transition: transform .2s ease-in-out, color .2s ease-in-out;
}

.subitem:hover .link,
.subitem:hover .logout-btn {
  transform: translateX(.3rem);
}

.submenu .subitem.active,
.submenu .subitem:hover {
  color: #70b6ff;
}

.right {
  margin-right: 4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  list-style: none;
}

.item {
  padding: .625rem .5rem;
}

.search-item {
  min-width: 210px;
}

.search-entry {
  display: inline-flex;
  align-items: center;
  gap: .45rem;
  color: inherit;
  cursor: text;
}

.search-input {
  width: 9.2rem;
  border: 0;
  outline: none;
  background: transparent;
  color: inherit;
  font: inherit;
  text-shadow: inherit;
}

.search-input::placeholder {
  color: inherit;
  opacity: .78;
}

.icon-only {
  padding-inline: .15rem;
}

.menu-login {
  padding-inline: .15rem;
}

.avatar-btn {
  padding: 0;
}

.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(255, 244, 225, .95), rgba(242, 198, 141, .88));
  color: #7d4f13;
  font-size: .75rem;
  font-weight: 700;
}

.avatar.has-img {
  background: transparent;
}

.avatar.has-img img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}

.user-submenu {
  left: auto;
  right: 0;
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(0) scale(1);
  transition: opacity .18s ease, transform .18s ease;
}

.mobile-drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 39;
  background: rgba(10, 14, 24, .42);
  backdrop-filter: blur(4px);
}

.mobile-drawer {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 40;
  width: min(86vw, 23rem);
  max-width: 23rem;
  height: 100vh;
  padding: 1.15rem 1.1rem 1.75rem;
  overflow-y: auto;
  color: var(--text-color);
  background: color-mix(in srgb, var(--card-bg) 94%, rgba(255, 255, 255, .6));
  box-shadow: 0 1.25rem 3rem rgba(0, 0, 0, .2);
}

.mobile-drawer-close {
  position: absolute;
  top: .7rem;
  left: .85rem;
  border: 0;
  background: transparent;
  color: color-mix(in srgb, var(--text-color) 70%, transparent);
  font-size: 2rem;
  line-height: 1;
}

.mobile-drawer-author {
  padding: 1.1rem 0 1.35rem;
  text-align: center;
}

.mobile-drawer-avatar {
  width: 7.75rem;
  height: 7.75rem;
  margin: 0 auto;
  padding: .18rem;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8fbff, #77b9ff 52%, #4a82ff);
  box-shadow: 0 0 1.2rem .55rem rgba(99, 102, 241, .14);
  border: 1px solid rgba(99, 102, 241, .12);
  transition: transform 1s ease;
}

.mobile-drawer-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.mobile-drawer-name {
  margin: 1rem 0 .3rem;
  font-size: 1.55rem;
}

.mobile-drawer-intro {
  margin: 0;
  font-size: 1rem;
  color: color-mix(in srgb, var(--text-color) 72%, transparent);
}

.mobile-drawer-stats {
  display: flex;
  justify-content: center;
  gap: 0;
  margin-top: 1.1rem;
}

.mobile-stat {
  min-width: 4.8rem;
  padding: 0 .8rem;
  color: inherit;
}

.mobile-stat + .mobile-stat {
  border-left: 1px solid color-mix(in srgb, var(--text-color) 14%, transparent);
}

.mobile-stat strong,
.mobile-stat span {
  display: block;
  text-align: center;
}

.mobile-stat strong {
  font-size: 1.2rem;
}

.mobile-stat span {
  margin-top: .18rem;
  font-size: .88rem;
  color: color-mix(in srgb, var(--text-color) 72%, transparent);
}

.mobile-drawer-socials {
  display: flex;
  justify-content: center;
  gap: .7rem;
  margin-top: 1.1rem;
}

.mobile-social {
  width: 2.35rem;
  height: 2.35rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: .88rem;
  font-weight: 700;
  color: #fff;
  box-shadow: 0 .5rem 1.3rem rgba(0, 0, 0, .18);
}

.mobile-social.github { background: #111827; }
.mobile-social.gitee { background: #e32c32; }
.mobile-social.email { background: #e98f36; }
.mobile-social.qq { background: #409eff; }

.mobile-drawer-nav {
  display: grid;
  gap: .85rem;
  padding-top: .6rem;
}

.mobile-nav-item,
.mobile-nav-group {
  border-radius: 1rem;
  background: color-mix(in srgb, var(--card-bg) 82%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--text-color) 7%, transparent);
}

.mobile-nav-link,
.mobile-nav-heading,
.mobile-submenu-link {
  display: flex;
  align-items: center;
  gap: .7rem;
  width: 100%;
  padding: .92rem 1rem;
  color: inherit;
}

.mobile-nav-item.active,
.mobile-nav-group.active {
  color: #3b82f6;
}

.mobile-nav-heading {
  font-weight: 600;
}

.mobile-submenu {
  display: grid;
  gap: .15rem;
  padding: 0 .65rem .65rem;
}

.mobile-submenu-link {
  padding: .72rem .8rem;
  border-radius: .8rem;
  color: color-mix(in srgb, var(--text-color) 85%, transparent);
}

.mobile-submenu-link:hover,
.mobile-nav-link:hover {
  color: #3b82f6;
}

.mobile-drawer-fade-enter-active,
.mobile-drawer-fade-leave-active {
  transition: opacity .2s ease;
}

.mobile-drawer-fade-enter-from,
.mobile-drawer-fade-leave-to {
  opacity: 0;
}

.mobile-drawer-slide-enter-active,
.mobile-drawer-slide-leave-active {
  transition: transform .26s ease, opacity .26s ease;
}

.mobile-drawer-slide-enter-from,
.mobile-drawer-slide-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

@keyframes slideUpIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 991px) {
  .header-wrapper {
    padding: 0 .35rem;
  }

  .right {
    margin-right: 0;
  }
}

@media (max-width: 865px) {
  .mobile-toggle {
    display: inline-flex;
    flex: 0 0 auto;
  }

  .header-wrapper {
    padding-inline: .4rem;
  }

  .menu {
    flex: 1;
    justify-content: flex-start;
    min-width: 0;
  }

  .menu .menu-item {
    display: none;
  }

  .menu .title {
    display: inline-block;
    padding-left: .25rem;
  }

  .search-item {
    min-width: 0;
  }

  .search-entry {
    justify-content: flex-end;
  }

  .search-input {
    display: none;
  }

  .search-entry.active .search-input {
    display: block;
    width: 6.2rem;
  }
}
</style>