<template>
  <div v-if="totalPages > 1" class="pager-shell">
    <button
      v-if="!isLast"
      class="page hand-style no-select"
      type="button"
      :disabled="loading"
      @click="requestNext"
    >
      {{ loading ? '加载中...' : '加载更多' }}
    </button>

    <div v-else class="tips">
      <div class="divider"></div>
      <div class="content">😛我也是有底线的.....</div>
      <div class="divider"></div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  page: number;
  pageSize: number;
  total: number;
  loading?: boolean;
}>(), {
  loading: false,
});

const emit = defineEmits<{ (e: 'update:page', value: number): void; (e: 'change', value: number): void }>();

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)));
const isLast = computed(() => props.page >= totalPages.value);

function requestNext(event: MouseEvent) {
  if (props.loading || isLast.value) return;
  (event.currentTarget as HTMLButtonElement | null)?.blur();
  const nextPage = props.page + 1;
  emit('update:page', nextPage);
  emit('change', nextPage);
}
</script>
<style scoped>
.pager-shell {
  margin-top: 20px;
}

.page {
  display: block;
  text-align: center;
  background-color: var(--grey-1, #f8f8f8);
  width: 120px;
  height: 30px;
  line-height: 30px;
  border-radius: 50px;
  margin: 0 auto;
  position: relative;
  white-space: nowrap;
  border: 1px solid var(--grey-4, #dcdcdc);
  transition: all 0.3s;
  color: rgba(0, 0, 0, 0.65);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}

.page:hover:not(:disabled) {
  background-color: var(--grey-4, #dcdcdc);
}

.page:active:not(:disabled) {
  transform: scale(0.7);
}

.page:disabled {
  cursor: wait;
  opacity: 0.65;
}

.tips {
  text-align: center;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 12px;
}

.divider {
  display: inline-block;
  width: 100%;
  background-color: var(--grey-3, #e5e5e5);
  height: 1px;
}

.content {
  display: inline-block;
  width: 400px;
  font-size: 14px;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .content {
    width: auto;
    font-size: 12px;
  }
}
</style>

