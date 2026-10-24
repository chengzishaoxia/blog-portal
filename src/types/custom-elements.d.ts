// 允许在 TSX / 模板推断中使用 <meting-js> 自定义元素
import 'vue';

declare module '@vue/runtime-dom' {
    interface IntrinsicElements {
        'meting-js': any;
    }
}
export {};