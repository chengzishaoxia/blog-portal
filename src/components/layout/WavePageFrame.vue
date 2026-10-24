<template>
  <section class="wave-page-frame">
    <WavePageHero
      :title="pageMeta.title"
      :eyebrow="pageMeta.eyebrow"
      :subtitle="pageMeta.subtitle"
      :background-image="pageMeta.imageUrl"
    />

    <WavePageLayout>
      <router-view></router-view>
    </WavePageLayout>
  </section>
</template>

<script setup lang="ts">
import { computed, inject, type Ref } from 'vue';
import { useRoute } from 'vue-router';
import WavePageHero from '@/components/common/WavePageHero.vue';
import WavePageLayout from '@/components/common/WavePageLayout.vue';
import { createDefaultSiteConfig, type SiteConfig, type SiteHeroConfig } from '@/types/site-config';

const route = useRoute();
const injectedSiteConfig = inject<Ref<SiteConfig>>('portalSiteConfig');

const siteConfig = computed(() => injectedSiteConfig?.value ?? createDefaultSiteConfig());

function getRouteHeroConfig(): SiteHeroConfig | null {
  switch (route.name) {
    case 'tags':
      return siteConfig.value.tagsHero;
    case 'archives':
      return siteConfig.value.archivesHero;
    case 'friend-links':
      return siteConfig.value.friendLinksHero;
    case 'chat':
      return siteConfig.value.chatHero;
    default:
      return null;
  }
}

const pageMeta = computed(() => {
  const hero = getRouteHeroConfig();
  return {
    title: hero?.title || (route.meta.waveTitle as string) || '',
    eyebrow: hero?.eyebrow || (route.meta.waveEyebrow as string) || '',
    subtitle: hero?.subtitle || (route.meta.waveSubtitle as string) || '',
    imageUrl: hero?.imageUrl || '',
  };
});
</script>

<style scoped>
.wave-page-frame {
  width: 100%;
}
</style>