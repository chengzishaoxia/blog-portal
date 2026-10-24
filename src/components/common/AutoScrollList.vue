<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

defineSlots<{
  default(props: { row: any; index: number }): any;
}>();

const props = withDefaults(defineProps<{
  list: any[];
  itemHeight?: string;
  height?: string;
  speed?: number;
}>(), {
  itemHeight: '5rem',
  height: '15rem',
  speed: 0.35,
});

const scrollRef = ref<HTMLElement | null>(null);
const frameId = ref<number | null>(null);
const scrollOffset = ref(0);
const mergedList = computed(() => (props.list.length ? [...props.list, ...props.list] : []));

function stop() {
  if (frameId.value !== null) {
    cancelAnimationFrame(frameId.value);
    frameId.value = null;
  }
}

function tick() {
  const element = scrollRef.value;
  if (!element || props.list.length <= 1) {
    frameId.value = null;
    return;
  }
  scrollOffset.value += props.speed;
  const resetPoint = element.scrollHeight / 2;
  if (scrollOffset.value >= resetPoint) {
    scrollOffset.value = 0;
  }
  element.scrollTop = scrollOffset.value;
  frameId.value = requestAnimationFrame(tick);
}

function start(resetPosition = false) {
  stop();
  const element = scrollRef.value;
  if (!element) return;
  if (resetPosition) {
    scrollOffset.value = 0;
    element.scrollTop = 0;
  } else {
    scrollOffset.value = element.scrollTop;
  }
  if (props.list.length <= 1) {
    return;
  }
  frameId.value = requestAnimationFrame(tick);
}

watch(() => props.list, () => {
  start(true);
}, { deep: true });

onMounted(() => {
  start(true);
});

onBeforeUnmount(() => {
  stop();
});
</script>

<template>
  <div class="auto-scroll-list" :style="{ height }" @mouseenter="stop" @mouseleave="start()">
    <div ref="scrollRef" class="auto-scroll-list__viewport">
      <div
        v-for="(item, index) in mergedList"
        :key="index"
        class="auto-scroll-list__row"
        :style="{ minHeight: itemHeight }"
      >
        <slot :row="item" :index="index">{{ item }}</slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auto-scroll-list {
  overflow: hidden;
}

.auto-scroll-list__viewport {
  height: 100%;
  overflow-y: scroll;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.auto-scroll-list__viewport::-webkit-scrollbar {
  display: none;
}

.auto-scroll-list__row {
  display: flex;
}
</style>