<template>
  <!-- 基于 meting-js 的网易云歌单播放器。可在 props 中替换 id/server/type -->
  <meting-js
      :server="server"
      :type="type"
      :id="id"
      fixed="true"
      :autoplay="autoplay ? 'true' : 'false'"
      :loop="loop"
      :order="order"
      :preload="preload"
      theme="#e9546b"
      :volume="volume"
      :mutex="mutex ? 'true':'false'"
  />
</template>
<script setup lang="ts">
// Meting / APlayer 通过 index.html 引入的全局脚本自动初始化，无需手动实例化
// 这里只是包一层以便在 Vue 项目中使用，并提供类型安全 props。

interface Props {
  server?: 'netease' | 'tencent' | 'kugou' | 'xiami' | 'baidu';
  /** 资源类型: playlist(歌单) song(单曲) album(专辑) search(搜索) */
  type?: string;
  /** 对应资源 ID，比如歌单 ID */
  id?: string | number;
  autoplay?: boolean;
  loop?: 'all' | 'one' | 'none';
  order?: 'list' | 'random';
  preload?: 'auto' | 'metadata' | 'none';
  volume?: string | number; // 0~1
  mutex?: boolean; // 与页面其它播放器互斥
}

const props = withDefaults(defineProps<Props>(), {
  server: 'netease',
  type: 'playlist',
  id: '152130431',
  autoplay: false,
  loop: 'all',
  order: 'list',
  preload: 'auto',
  volume: 0.7,
  mutex: true
});
</script>
<style scoped>
/* meting-js 会自己注入固定定位的 APlayer; 这里本组件本身不需要额外样式 */
</style>

