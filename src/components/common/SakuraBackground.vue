<template>
  <div class="sakura-container">
    <canvas ref="canvasRef" id="sakura-canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import sakuraImgUrl from '@/assets/img/sakura.png';

const canvasRef = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;
let animationFrameId: number;
const petalCount = 50; // Number of petals
const petals: Petal[] = [];
let img: HTMLImageElement;

interface Petal {
  x: number;
  y: number;
  s: number; // size
  r: number; // rotation
  fn: {
    x: number;
    y: number;
  };
  rotate: {
    x: number;
    y: number;
  };
  speed: {
    x: number;
    y: number;
    r: number;
  };
}

const initPetals = (width: number, height: number) => {
  for (let i = 0; i < petalCount; i++) {
    petals.push(createPetal(width, height));
  }
};

const createPetal = (width: number, height: number): Petal => {
  return {
    x: Math.random() * width,
    y: Math.random() * height - height, // Start above the screen
    s: Math.random() * 0.5 + 0.5, // Size scale 0.5 to 1
    r: Math.random() * Math.PI * 2, // Initial rotation
    fn: {
      x: Math.random() * 0.005 + 0.002, // Horizontal oscillation frequency
      y: Math.random() * 0.005 + 0.002, // Vertical oscillation frequency
    },
    rotate: {
      x: Math.random() * 0.05,
      y: Math.random() * 0.05,
    },
    speed: {
      x: Math.random() * 1 + 0.5,
      y: Math.random() * 2 + 1, // Falling speed
      r: Math.random() * 0.05, // Rotation speed
    },
  };
};

const updatePetals = (width: number, height: number) => {
  ctx?.clearRect(0, 0, width, height);

  petals.forEach((p) => {
    // Update position
    p.x += Math.cos(p.r) * p.speed.x;
    p.y += p.speed.y;
    p.r += p.speed.r;

    // Reset if out of bounds
    if (p.x > width || p.x < 0 || p.y > height) {
      if (Math.random() > 0.4) {
        p.x = Math.random() * width;
        p.y = -20;
        p.s = Math.random() * 0.5 + 0.5;
        p.r = Math.random() * Math.PI * 2;
      }
    }

    // Draw
    if (ctx && img.complete) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      const size = 40 * p.s; // Base size 20px
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
  });
};

const animate = () => {
  if (!canvasRef.value) return;
  const width = canvasRef.value.width;
  const height = canvasRef.value.height;
  updatePetals(width, height);
  animationFrameId = requestAnimationFrame(animate);
};

const handleResize = () => {
  if (canvasRef.value) {
    canvasRef.value.width = window.innerWidth;
    canvasRef.value.height = window.innerHeight;
  }
};

onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext('2d');
    canvasRef.value.width = window.innerWidth;
    canvasRef.value.height = window.innerHeight;

    img = new Image();
    img.src = sakuraImgUrl;
    img.onload = () => {
      initPetals(window.innerWidth, window.innerHeight);
      animate();
    }

    window.addEventListener('resize', handleResize);
  }
});

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.sakura-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* Allow clicks to pass through */
  z-index: 0; /* Behind content but visible if background is transparent */
  overflow: hidden;
}
</style>
