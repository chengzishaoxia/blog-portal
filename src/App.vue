<template>
  <div :class="['app-shell', 'anime-ui', theme, 'hexo-active']">
    <SakuraBackground />
    <SiteHeader/>
    <AuthDialog/>
    <HomeHero v-if="showHero"/>
    <div :class="['hexo-shell', showHero ? 'hero-shell' : '', isStandaloneWavePage ? 'standalone-wave-shell' : '', isWidePage ? 'wide-page-shell' : '', needsHeaderOffset ? 'header-offset-shell' : '']">
      <SideHeader v-if="!hideSideHeader"/>
      <main :class="['hexo-main', isStandaloneWavePage ? 'standalone-wave-main' : '', isWidePage ? 'wide-page-main' : '']">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in" @after-leave="handleRouteLeaveComplete">
            <keep-alive>
              <component :is="Component"/>
            </keep-alive>
          </transition>
        </router-view>
        <ScrollTop/>
      </main>
    </div>
    <SiteFooter v-if="!isWidePage"/>
    <MetingMusicPlayer />
  </div>
</template>
<script setup lang="ts">
import SiteHeader from '@/components/layout/SiteHeader.vue';
import SakuraBackground from '@/components/common/SakuraBackground.vue';
import SideHeader from '@/components/layout/SideHeader.vue';
import SiteFooter from '@/components/layout/SiteFooter.vue';
import ScrollTop from '@/components/common/ScrollTop.vue';
import HomeHero from '@/components/home/HomeHero.vue';
import AuthDialog from '@/components/auth/AuthDialog.vue';
import MetingMusicPlayer from '@/components/music/MetingMusicPlayer.vue';
import { usePreferredDark, useStorage } from '@vueuse/core';
import { useAuthStore } from '@/store/auth-store';
import { onMounted, computed, watch, ref, provide } from 'vue';
import { useRoute } from 'vue-router';
import { fetchSiteConfig } from '@/api/site-config';
import { createDefaultSiteConfig, mergeSiteConfig, type SiteConfig } from '@/types/site-config';

const prefersDark = usePreferredDark();
const theme = useStorage<'light' | 'dark'>('BLOG_PORTAL_THEME', prefersDark.value ? 'dark' : 'light');

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
}

provide('portalTheme', theme);
provide('togglePortalTheme', toggleTheme);

const siteConfig = ref<SiteConfig>(createDefaultSiteConfig());
provide('portalSiteConfig', siteConfig);

const auth = useAuthStore();
const route = useRoute();
const heroVisible = ref(route.name === 'home');

onMounted(() => {
  document.body.classList.add(theme.value);
  if (auth.isAuthed() && !auth.profile) auth.loadProfile();
  fetchSiteConfig()
    .then((data) => {
      siteConfig.value = mergeSiteConfig(data);
    })
    .catch(() => {
      siteConfig.value = createDefaultSiteConfig();
    });
});
const isMobile = ref(false);

function computeMobile() {
  isMobile.value = window.innerWidth <= 960;
}

onMounted(() => {
  computeMobile();
  window.addEventListener('resize', computeMobile);
});
watch(theme, (v: 'light' | 'dark', ov?: 'light' | 'dark') => {
  if (ov) document.body.classList.remove(ov);
  document.body.classList.add(v);
});
watch(
  () => route.name,
  (name) => {
    if (name === 'home') {
      heroVisible.value = true;
    }
  }
);

function handleRouteLeaveComplete() {
  if (route.name !== 'home') {
    heroVisible.value = false;
  }
}

const showHero = computed(() => heroVisible.value);
const isStandaloneWavePage = computed(() => route.meta.layout === 'wave');
const isWidePage = computed(() => route.meta.layout === 'full');
const hideSideHeader = computed(() => isStandaloneWavePage.value || isWidePage.value);
const needsHeaderOffset = computed(() => !showHero.value && !isStandaloneWavePage.value && !isWidePage.value);
</script>
<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.hexo-shell {
  flex: 1 0 auto;
}

.header-offset-shell {
  margin-top: calc(var(--header-height) + 1.5rem);
}

.hero-shell {
  position: relative;
  z-index: 2;
  margin-top: 1.25rem;
  overflow-x: clip;
}

.standalone-wave-shell {
  max-width: none;
  width: 100%;
  margin: 0;
  padding: 0 0 2.5rem;
  display: block;
}

.standalone-wave-main {
  max-width: none;
  width: 100%;
  overflow: visible;
}

@media (max-width: 960px) {
  .hero-shell {
    margin-top: 0;
  }
}
</style>