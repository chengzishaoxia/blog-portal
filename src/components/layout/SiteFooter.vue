<template>
  <footer class="site-footer">
    <div class="footer-shell">
      <div class="footer-inner">
        <div class="footer-main-line">{{ copyrightLine }}</div>
        <div class="footer-record-line">{{ siteConfig.footer.primaryText }}</div>
        <div class="footer-metrics">
          <span class="footer-metric">总访问量 {{ formattedTotalPvCount }}</span>
          <span class="footer-divider">|</span>
          <span class="footer-metric">风风雨雨 {{ runTime }}</span>
        </div>
        <div class="footer-badges">
          <a v-for="badge in badges" :key="badge.label" class="badge-link" :href="badge.href" target="_blank" rel="noreferrer">
            <img :src="badge.src" :alt="badge.label" />
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>
<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, type Ref } from 'vue';
import { fetchFooterStats } from '@/api/portal';
import { createDefaultSiteConfig, type SiteConfig } from '@/types/site-config';

const FALLBACK_START_TIME = '2022-01-01T00:00:00';

const injectedSiteConfig = inject<Ref<SiteConfig>>('portalSiteConfig');
const siteConfig = computed(() => injectedSiteConfig?.value ?? createDefaultSiteConfig());
const runTime = ref('0天0时0分0秒');
const totalPvCount = ref<number | null>(null);

const badges = [
  {
    label: 'Tencent CVM',
    href: 'https://cloud.tencent.com/product/cvm',
    src: 'https://img.shields.io/badge/%E8%85%BE%E8%AE%AF%E4%BA%91-CVM%E6%9C%8D%E5%8A%A1%E5%99%A8-blue',
  },
  {
    label: 'MdEditorV3',
    href: 'https://imzbf.github.io/md-editor-v3/docs/index',
    src: 'https://img.shields.io/badge/MdEditorV3-MD%E7%BC%96%E8%BE%91%E5%99%A8-159957',
  },
  {
    label: 'Spring Boot',
    href: 'https://spring.io/projects/spring-boot',
    src: 'https://img.shields.io/badge/springboot-2.7-brightgreen',
  },
  {
    label: 'MinIO',
    href: 'https://min.io/',
    src: 'https://img.shields.io/badge/minio-%E5%AF%B9%E8%B1%A1%E5%AD%98%E5%82%A8%E7%B3%BB%E7%BB%9F-purple',
  },
];

let timerId: number | null = null;

const copyrightLine = computed(() => siteConfig.value.footer.copyrightText || `© ${siteConfig.value.sidebarProfile.name}`);
const formattedTotalPvCount = computed(() => {
  if (totalPvCount.value === null) {
    return '--';
  }
  return new Intl.NumberFormat('zh-CN').format(totalPvCount.value);
});

function updateRunTime() {
  const startText = siteConfig.value.footer.siteStartTime || FALLBACK_START_TIME;
  const parsedStartTime = new Date(startText);
  const startValue = Number.isNaN(parsedStartTime.getTime()) ? new Date(FALLBACK_START_TIME).getTime() : parsedStartTime.getTime();
  const now = Date.now();
  const diff = Math.max(0, now - startValue);
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  runTime.value = `${days}天${hours}时${minutes}分${seconds}秒`;
}

onMounted(() => {
  updateRunTime();
  timerId = window.setInterval(updateRunTime, 1000);
  fetchFooterStats()
    .then((data) => {
      totalPvCount.value = Math.max(0, data.totalPvCount || 0);
    })
    .catch(() => {
      totalPvCount.value = null;
    });
});

onUnmounted(() => {
  if (timerId !== null) {
    window.clearInterval(timerId);
  }
});
</script>
<style scoped>
.site-footer {
  position: relative;
  width: 100%;
  margin-top: 2.5rem;
  padding: 3.4rem 1.2rem 2.4rem;
  overflow: hidden;
  text-align: center;
}

.site-footer::before,
.site-footer::after {
  content: '';
  position: absolute;
  inset: 0;
}

.site-footer::before {
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0) 45%),
    linear-gradient(180deg, rgba(235, 243, 255, 0.96), rgba(227, 236, 249, 0.92));
}

.site-footer::after {
  background: linear-gradient(90deg, rgba(250, 184, 74, 0.14), rgba(234, 108, 136, 0.14));
  mask: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.9) 18%, rgba(0, 0, 0, 0.9) 100%);
}

.footer-shell {
  position: relative;
  z-index: 1;
  width: min(calc(100% - 2.4rem), var(--layout-max-width));
  margin: 0 auto;
}

.footer-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.65rem;
  color: rgba(52, 65, 88, 0.86);
  font-size: 0.95rem;
}

.footer-main-line {
  line-height: 1.5;
  font-size: 1rem;
  color: rgba(40, 52, 74, 0.92);
}

.footer-record-line {
  line-height: 1.6;
  color: rgba(51, 102, 188, 0.92);
}

.footer-metrics {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.55rem;
  line-height: 1.6;
}

.footer-divider {
  color: rgba(127, 144, 170, 0.78);
}

.footer-badges {
  margin-top: 0.3rem;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.badge-link {
  display: inline-flex;
  padding: 0.15rem;
}

.badge-link img {
  display: block;
  height: 20px;
}

:global(.dark) .site-footer::before {
  background:
    radial-gradient(circle at top, rgba(112, 141, 191, 0.24), rgba(20, 25, 38, 0) 42%),
    linear-gradient(180deg, rgba(32, 40, 55, 0.96), rgba(23, 29, 40, 0.94));
}

:global(.dark) .site-footer::after {
  background: linear-gradient(90deg, rgba(244, 170, 73, 0.18), rgba(115, 160, 255, 0.18));
}

:global(.dark) .footer-inner {
  color: rgba(220, 228, 242, 0.76);
}

:global(.dark) .footer-main-line {
  color: rgba(240, 244, 252, 0.92);
}

:global(.dark) .footer-record-line {
  color: rgba(146, 188, 255, 0.95);
}

:global(.dark) .footer-divider {
  color: rgba(166, 184, 213, 0.55);
}

@media (max-width: 640px) {
  .site-footer {
    margin-top: 2rem;
    padding: 2.8rem 1rem 2rem;
  }

  .footer-shell {
    width: min(calc(100% - 2rem), var(--layout-max-width));
  }

  .footer-inner {
    font-size: 0.84rem;
  }

  .footer-metrics {
    gap: 0.35rem;
  }
}
</style>

